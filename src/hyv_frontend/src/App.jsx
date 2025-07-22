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
  const [showLogin, setShowLogin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authClient, setAuthClient] = useState(null);
  const [identity, setIdentity] = useState(null);
  const [backendActor, setBackendActor] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

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
        setShowLanding(false);
        setShowLogin(false);
        handleAuthenticated(client);
      }
    });
  }, []);

  // Animate main app when it loads
  useEffect(() => {
    if (isAuthenticated) {
      setTimeout(() => setIsVisible(true), 100);
    }
  }, [isAuthenticated]);

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

  const handleEnterApp = () => {
    setShowLanding(false);
    setShowLogin(true);
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
    setShowLogin(false);
  };

  const handleLogout = async () => {
    if (authClient) {
      await authClient.logout();
    }
    setIsAuthenticated(false);
    setIdentity(null);
    setBackendActor(null);
    setShowLanding(true);
    setShowLogin(false);
    setIsVisible(false);
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
    if (isAuthenticated) {
      hyv_backend.listModels().then(setModels);
    }
  }, [isAuthenticated]);

  async function handleSearch(params) {
    const results = await hyv_backend.searchModels(params.domain, params.modelType, params.performance);
    setModels(results);
  }

  async function handleUpload(id) {
    const model = await hyv_backend.getModelNFT(id);
    setModels((prev) => [...prev, model]);
  }

  // Flow: Landing Page → Internet Identity Login → Main App Dashboard
  if (showLanding) {
    return <LandingPage onEnterApp={handleEnterApp} />;
  }

  if (showLogin && !isAuthenticated) {
    return <InternetIdentityLogin onLogin={handleLogin} />;
  }

  // Main authenticated app with animations
  return (
    <div className={`app-container ${isVisible ? 'visible' : ''}`}>
      {/* Animated Background */}
      <div className="app-bg-animation">
        <div className="neural-network">
          {[...Array(15)].map((_, i) => (
            <div key={i} className={`node node-${i}`}></div>
          ))}
          {[...Array(10)].map((_, i) => (
            <div key={i} className={`connection connection-${i}`}></div>
          ))}
        </div>
      </div>

      <div className="app-header">
        <div className="header-left">
          <div className="app-logo">
            <img src="tlogo.png" alt="Hyv" width={40} />
            <h1 className="app-title">
              <span className="gradient-text">Hyv</span> AI Marketplace
            </h1>
          </div>
        </div>
        <div className="header-right">
          <div className="user-info">
            <div className="user-avatar">
              <span>🧠</span>
              <div className="avatar-pulse"></div>
            </div>
            <div className="user-details">
              <span className="user-greeting">Welcome back!</span>
              <span className="user-status">Connected via Internet Identity</span>
            </div>
            <button onClick={handleLogout} className="btn btn-secondary logout-btn">
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      <main className="main-content">
        <div className="content-grid">
          <div className="left-section">
            {/* Data Generation Card */}
            <div className="dashboard-card generation-card">
              <div className="card-header">
                <div className="card-icon">🤖</div>
                <div className="card-title-section">
                  <h2 className="card-title">Generate Synthetic Data</h2>
                  <p className="card-subtitle">Create AI-powered datasets with custom prompts</p>
                </div>
              </div>
              <div className="card-content">
                <div className="form-group">
                  <label htmlFor="prompt">Data Generation Prompt</label>
                  <textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the type of data you want to generate..."
                    className="textarea modern-input"
                    rows={4}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="apiKey">OpenAI API Key</label>
                  <input
                    id="apiKey"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your OpenAI API key"
                    className="input modern-input"
                  />
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={loading || !prompt.trim() || !apiKey.trim()}
                  className="btn btn-primary btn-generate"
                >
                  {loading ? (
                    <>
                      <div className="loading-spinner"></div>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <span>Generate Dataset</span>
                      <div className="btn-glow"></div>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Model Upload */}
            <div className="dashboard-card model-upload-card">
              <ModelUpload onUpload={handleUpload} />
            </div>
          </div>

          <div className="right-section">
            {/* Marketplace Stats */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📊</div>
                <div className="stat-value">{datasets.length}</div>
                <div className="stat-label">Datasets</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🤖</div>
                <div className="stat-value">{models.length}</div>
                <div className="stat-label">AI Models</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⚡</div>
                <div className="stat-value">99.9%</div>
                <div className="stat-label">Uptime</div>
              </div>
            </div>

            {/* Dataset List */}
            <div className="dashboard-card marketplace-card">
              <div className="card-header">
                <div className="card-icon">🏪</div>
                <div className="card-title-section">
                  <h2 className="card-title">Marketplace Datasets</h2>
                  <p className="card-subtitle">Browse and manage your datasets</p>
                </div>
                <button onClick={fetchDatasets} disabled={loading} className="btn btn-small refresh-btn">
                  {loading ? (
                    <div className="loading-spinner small"></div>
                  ) : (
                    "Refresh"
                  )}
                </button>
              </div>
              <div className="card-content">
                {datasets.length > 0 ? (
                  <div className="dataset-grid">
                    {datasets.map((dataset) => (
                      <div key={Number(dataset.id)} className="dataset-card">
                        <div className="dataset-header">
                          <h3 className="dataset-title">{dataset.title}</h3>
                          <div className="dataset-status verified">✓ Verified</div>
                        </div>
                        <p className="dataset-description">{dataset.description}</p>
                        <div className="dataset-meta">
                          <div className="dataset-tags">
                            {dataset.tags.map((tag, index) => (
                              <span key={index} className="tag">{tag}</span>
                            ))}
                          </div>
                          <div className="dataset-hash">Hash: {dataset.fileHash.slice(0, 8)}...</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">📦</div>
                    <h3>No datasets found</h3>
                    <p>Generate your first dataset to get started!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Model Search and Grid */}
            <div className="dashboard-card models-card">
              <div className="card-header">
                <div className="card-icon">🔍</div>
                <div className="card-title-section">
                  <h2 className="card-title">AI Models</h2>
                  <p className="card-subtitle">Discover and deploy AI models</p>
                </div>
              </div>
              <div className="card-content">
                <ModelSearch onSearch={handleSearch} />
                <ModelGrid models={models} />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Generated Data Modal */}
      {generatedData && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Generated Data</h2>
              <button onClick={() => setGeneratedData(null)} className="modal-close">×</button>
            </div>
            <div className="modal-body">
              <p><strong>Title:</strong> {generatedData.title}</p>
              <p><strong>Description:</strong> {generatedData.description}</p>
              <p><strong>Tags:</strong> {generatedData.tags.join(', ')}</p>
              <p><strong>Content:</strong></p>
              <pre className="code-preview">{generatedData.content}</pre>
              <p><strong>Hash:</strong> {generatedData.fileHash}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
