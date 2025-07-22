import React, { useState, useEffect } from "react";
import { AuthClient } from "@dfinity/auth-client";
import { HttpAgent, Actor } from "@dfinity/agent";
import { hyv_backend } from "declarations/hyv_backend";
import { idlFactory as backendIdl } from "declarations/hyv_backend/hyv_backend.did.js";

import LandingPage from "./components/LandingPage";
import InternetIdentityLogin from "./components/InternetIdentityLogin";
import ModelUpload from "./components/ModelUpload";
import ModelGrid from "./components/ModelGrid";
import ModelSearch from "./components/ModelSearch";

import "./index.css";

const backendCanisterId = process.env.CANISTER_ID_HYV_BACKEND || "rdmx6-jaaaa-aaaaa-aaadq-cai";

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
  const [generatedData, setGeneratedData] = useState(null);

  // Authentication setup
  useEffect(() => {
    AuthClient.create().then(async (client) => {
      setAuthClient(client);
      const authenticated = await client.isAuthenticated();
      if (authenticated) {
        setIsAuthenticated(true);
        handleAuthenticated(client);
      }
    });
  }, []);

  const handleAuthenticated = (client) => {
    const user_identity = client.getIdentity();
    setIdentity(user_identity);
    setIsAuthenticated(true);

    const agent = new HttpAgent({ 
      identity: user_identity, 
      host: process.env.DFX_NETWORK === "ic" ? "https://ic0.app" : "http://127.0.0.1:4943/" 
    });
    
    if (process.env.DFX_NETWORK !== "ic") {
      agent.fetchRootKey();
    }
    
    const actor = Actor.createActor(backendIdl, { agent, canisterId: backendCanisterId });
    setBackendActor(actor);
  };

  const handleLogin = async (identity) => {
    const agent = new HttpAgent({ 
      identity, 
      host: process.env.DFX_NETWORK === "ic" ? "https://ic0.app" : "http://127.0.0.1:4943/" 
    });
    
    if (process.env.DFX_NETWORK !== "ic") {
      agent.fetchRootKey();
    }
    
    const actor = Actor.createActor(backendIdl, { agent, canisterId: backendCanisterId });
    setBackendActor(actor);
    setIdentity(identity);
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    if (authClient) {
      await authClient.logout();
    }
    setIsAuthenticated(false);
    setIdentity(null);
    setBackendActor(null);
  };

  // Data fetching functions
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

  // Show landing page first
  if (showLanding) {
    return <LandingPage onEnterApp={() => setShowLanding(false)} />;
  }

  // Show Internet Identity login if not authenticated
  if (!isAuthenticated) {
    return <InternetIdentityLogin onLogin={handleLogin} />;
  }

  // Main authenticated app
  return (
    <div className="app-container">
      <div className="app-header">
        <h1 className="app-title">🧠 Hyv - AI Model Marketplace</h1>
        <div className="auth-section">
          <div className="user-info">
            <span className="user-greeting">Welcome! 👋</span>
            <button onClick={handleLogout} className="btn btn-secondary">
              Logout
            </button>
          </div>
        </div>
      </div>

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
              onClick={handleGenerate}
              disabled={loading || !prompt.trim() || !apiKey.trim()}
              className="btn btn-primary btn-full"
            >
              {loading ? "Generating..." : "Generate Data"}
            </button>
          </div>

          {/* Model Upload */}
          <ModelUpload onUpload={handleUpload} />
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

      {/* Generated Data Display */}
      {generatedData && (
        <div className="card mt-4">
          <h2 className="card-title">Generated Data</h2>
          <div>
            <p><strong>Title:</strong> {generatedData.title}</p>
            <p><strong>Description:</strong> {generatedData.description}</p>
            <p><strong>Tags:</strong> {generatedData.tags.join(', ')}</p>
            <p><strong>Content:</strong></p>
            <pre className="bg-gray-100 p-2 rounded">{generatedData.content}</pre>
            <p><strong>Hash:</strong> {generatedData.fileHash}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
