import React, { useState, useEffect } from "react";
import { AuthClient } from "@dfinity/auth-client";
import { Actor, HttpAgent } from "@dfinity/agent";
import ModelUpload from "./components/ModelUpload";
import ModelGrid from "./components/ModelGrid";
import ModelSearch from "./components/ModelSearch";
import { hyv_backend } from "declarations/hyv_backend";

// Placeholder factories if you haven't deployed yet
const backendIdl = ({ IDL }) => IDL.Service({});
const backendCanisterId = process.env.CANISTER_ID_HYV_BACKEND;

function App() {
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

  return (
    <div className="app-container">
      <div className="container">
        <header className="header">
          <h1 className="main-title">Hyv Marketplace</h1>
          {isAuthenticated ? (
            <div className="user-actions">
              <p className="user-info">Principal: {identity?.getPrincipal().toText().slice(0, 15)}...</p>
              <button onClick={handleLogout} className="btn btn-secondary">
                Logout
              </button>
            </div>
          ) : (
            <button onClick={handleLogin} className="btn btn-primary">
              Login with Internet Identity
            </button>
          )}
        </header>

        {!isAuthenticated ? (
          <div className="welcome-card">
            <h2 className="welcome-title">Welcome to Hyv</h2>
            <p className="welcome-text">Please log in to generate, upload, and view synthetic datasets.</p>
          </div>
        ) : (
          <main className="main-content">
            {/* Left Column */}
            <div className="left-column">
              {/* Generate Dataset */}
              <div className="card">
                <h2 className="card-title">🧠 Generate Synthetic Data</h2>
                <form onSubmit={handleGenerate}>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Enter your data generation prompt..."
                    className="form-control textarea"
                    disabled={loading}
                  />
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your OpenAI API Key (for MVP demo)"
                    className="form-control"
                    disabled={loading}
                  />
                  <button type="submit" disabled={loading} className="btn btn-primary btn-full">
                    {loading ? "Generating..." : "Generate & Store"}
                  </button>
                </form>
              </div>

              {/* Upload Model */}
              <ModelUpload onUpload={handleUpload} />
            </div>

            {/* Right Column */}
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
      </div>
    </div>
  );
}

export default App;
