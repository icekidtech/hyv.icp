import React, { useState, useEffect } from "react";
import { AuthClient } from "@dfinity/auth-client";
import { Actor, HttpAgent } from "@dfinity/agent";
import ModelUpload from "./components/ModelUpload";
import ModelGrid from "./components/ModelGrid";
import ModelSearch from "./components/ModelSearch";
import LandingPage from "./components/LandingPage";
import { hyv_backend } from "declarations/hyv_backend";

// Placeholder factories if you haven't deployed yet
const backendIdl = ({ IDL }) => IDL.Service({});
const backendCanisterId = process.env.CANISTER_ID_HYV_BACKEND;

function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authClient, setAuthClient] = useState(null);
  const [identity, setIdentity] = useState(null);
  const [backendActor, setBackendActor] = useState(null);

  const [datasets, setDatasets] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);

  const [models, setModels] = useState([]);
  const [searchParams, setSearchParams] = useState({});
  const [generatedData, setGeneratedData] = useState(null); // New state for generated data

  // Authentication
  useEffect(() => {
    AuthClient.create().then(async (client) => {
      setAuthClient(client);
      const authenticated = await client.isAuthenticated();
      setIsAuthenticated(authenticated);
      if (authenticated) {
        handleAuthenticated(client);
      }
    });
  }, []);

  const handleAuthenticated = (client) => {
    const user_identity = client.getIdentity();
    setIdentity(user_identity);
    setIsAuthenticated(true);

    const agent = new HttpAgent({ identity: user_identity, host: "http://127.0.0.1:8080/" });
    const actor = Actor.createActor(backendIdl, { agent, canisterId: backendCanisterId });
    setBackendActor(actor);
  };

  const handleLogin = async () => {
    await authClient.login({
      identityProvider: "https://identity.ic0.app/#authorize",
      onSuccess: () => handleAuthenticated(authClient),
    });
  };

  const handleLogout = async () => {
    await authClient.logout();
    setIsAuthenticated(false);
    setIdentity(null);
    setBackendActor(null);
  };

  const fetchDatasets = async () => {
    if (!backendActor) return;
    setLoading(true);
    try {
      const result = await backendActor.listDatasets();
      setDatasets(result);
    } catch (error) {
      console.error("Failed to fetch datasets:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (backendActor) fetchDatasets();
  }, [backendActor]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!backendActor || !prompt || !apiKey) {
      alert("Please enter a prompt and your OpenAI API key.");
      return;
    }
    setLoading(true);
    try {
      const newDatasetId = await backendActor.generateAndStoreDataset(prompt, apiKey);
      alert(`Successfully generated and stored dataset with ID: ${newDatasetId}`);
      setPrompt("");
      setApiKey("");
      fetchDatasets();
    } catch (error) {
      console.error("Generation failed:", error);
      alert("Generation failed. See console for details.");
    }
    setLoading(false);
  };

  // Model-related logic
  useEffect(() => {
    hyv_backend.listModels().then(setModels);
  }, []);

  async function handleSearch(params) {
    const results = await hyv_backend.searchModels(params.domain, params.modelType, params.performance);
    setModels(results);
  }

  async function handleUpload(id) {
    const model = await hyv_backend.getModelNFT(id);
    setModels((prev) => [...prev, model]);
  }

  const fetchDataset = async (id) => {
    const dataset = await backendActor.getDataset(id); // Ensure this function exists
    setGeneratedData(dataset);
  };

  // Show landing page first, then main app
  if (showLanding) {
    return <LandingPage onEnterApp={() => setShowLanding(false)} />;
  }

  return (
    <div className="app-container">
      <div className="app-header">
        <h1 className="app-title">🧠 Hyv - Synthetic Data Marketplace</h1>
        <div className="auth-section">
          {isAuthenticated ? (
            <div className="user-info">
              <span className="user-greeting">Welcome! 👋</span>
              <button onClick={handleLogout} className="btn btn-secondary">
                Logout
              </button>
            </div>
          ) : (
            <button onClick={handleLogin} className="btn btn-primary">
              Login with Internet Identity
            </button>
          )}
        </div>
      </div>

      {isAuthenticated && (
        <main className="main-content">
          <div className="left-column">
            {/* Data Generation */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">🤖 Generate Synthetic Data</h2>
              </div>
              <div className="form-group">
                <label htmlFor="prompt">Prompt:</label>
                <textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Enter your data generation prompt..."
                  className="textarea"
                  rows={4}
                />
              </div>
              <div className="form-group">
                <label htmlFor="apiKey">OpenAI API Key:</label>
                <input
                  id="apiKey"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your OpenAI API key"
                  className="input"
                />
              </div>
              <button
                onClick={handleGenerateData}
                disabled={loading || !prompt.trim() || !apiKey.trim()}
                className="btn btn-primary btn-full"
              >
                {loading ? "Generating..." : "Generate Data"}
              </button>
            </div>

            {/* Model Upload */}
            <ModelUpload onUpload={handleModelUpload} />
          </div>

          <div className="right-column">
            {/* Dataset List */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">🏪 Marketplace Datasets</h2>
                <button onClick={fetchDatasets} disabled={loading} className="btn btn-small">
                  {loading ? "Refreshing..." : "Refresh"}
                </button>
              </div>
              <ul className="dataset-list">
                {datasets.length > 0 ? (
                  datasets.map((dataset) => (
                    <li key={Number(dataset.id)} className="dataset-item">
                      <h3 className="dataset-title">{dataset.title}</h3>
                      <p className="dataset-description">{dataset.description}</p>
                      <p className="dataset-tags">Tags: {dataset.tags.join(", ")}</p>
                      <p className="dataset-hash">Hash: {dataset.fileHash}</p>
                    </li>
                  ))
                ) : (
                  <p className="no-data">No datasets found. Generate one to get started!</p>
                )}
              </ul>
            </div>

            {/* Model Search and Grid */}
            <ModelSearch onSearch={handleSearch} />
            <ModelGrid models={models} />
          </div>
        </main>
      )}

      {/* New section for displaying generated data */}
      <div className="mt-8 p-4 border rounded">
        <h2 className="text-xl font-bold mb-4">Generated Data</h2>
        {generatedData ? (
          <div>
            <p><strong>Title:</strong> {generatedData.title}</p>
            <p><strong>Description:</strong> {generatedData.description}</p>
            <p><strong>Tags:</strong> {generatedData.tags.join(', ')}</p>
            <p className="mt-2"><strong>Content:</strong></p>
            <pre className="bg-gray-100 p-2 rounded">{generatedData.content}</pre> {/* ✅ Display raw text */}
            <p className="mt-2"><strong>Hash:</strong> {generatedData.fileHash}</p>
          </div>
        ) : (
          <p>No data generated yet</p>
        )}
      </div>
    </div>
  );
}

export default App;
