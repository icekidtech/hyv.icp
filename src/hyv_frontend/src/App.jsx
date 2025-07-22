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
  const [isInitializing, setIsInitializing] = useState(true);

  const [datasets, setDatasets] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);

  const [models, setModels] = useState([]);
  const [searchParams, setSearchParams] = useState({});
  const [generatedData, setGeneratedData] = useState(null);

  const [showDataModal, setShowDataModal] = useState(false);
  const [currentDataset, setCurrentDataset] = useState(null);

  const [connectionStatus, setConnectionStatus] = useState("disconnected");

  // Initialize authentication on app load
  useEffect(() => {
    initializeAuth();
  }, []);

  // Animate main app when it loads
  useEffect(() => {
    if (isAuthenticated) {
      setTimeout(() => setIsVisible(true), 100);
    }
  }, [isAuthenticated]);

  const initializeAuth = async () => {
    try {
      console.log("Initializing authentication...");
      const client = await AuthClient.create({
        idleOptions: {
          idleTimeout: 1000 * 60 * 30, // 30 minutes
          disableDefaultIdleCallback: true,
        },
      });
      
      setAuthClient(client);
      
      // Check if user is already authenticated
      const authenticated = await client.isAuthenticated();
      console.log("Authentication status:", authenticated);
      
      if (authenticated) {
        const userIdentity = client.getIdentity();
        console.log("User already authenticated with principal:", userIdentity.getPrincipal().toString());
        await handleAuthenticationSuccess(userIdentity);
        setShowLanding(false);
        setShowLogin(false);
      }
    } catch (error) {
      console.error("Failed to initialize authentication:", error);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleAuthenticationSuccess = async (userIdentity) => {
    try {
      setConnectionStatus("connecting");
      setIdentity(userIdentity);
      setIsAuthenticated(true);

      // Use the correct local development host
      const host = process.env.DFX_NETWORK === "local" ? "http://127.0.0.1:4943" : "https://ic0.app";
      
      console.log("Creating agent with host:", host);
      
      const agent = new HttpAgent({ 
        identity: userIdentity, 
        host: host
      });
      
      // Only fetch root key in local development
      if (process.env.DFX_NETWORK !== "ic") {
        console.log("Fetching root key for local development");
        await agent.fetchRootKey();
      }
      
      // Create backend actor with the agent
      const actor = Actor.createActor(backendIdl, { 
        agent, 
        canisterId: backendCanisterId 
      });
      
      console.log("Testing backend connection...");
      // Test the connection
      await actor.listDatasets();
      
      setBackendActor(actor);
      setConnectionStatus("connected");
      console.log("Backend actor created and tested successfully");
    } catch (error) {
      setConnectionStatus("failed");
      console.error("Failed to setup backend connection:", error);
    }
  };

  const handleEnterApp = () => {
    console.log("Entering app - showing login screen");
    setShowLanding(false);
    setShowLogin(true);
  };

  const handleLogin = async (userIdentity) => {
    console.log("Login successful, setting up user session");
    await handleAuthenticationSuccess(userIdentity);
    setShowLogin(false);
  };

  const handleLogout = async () => {
    try {
      console.log("Logging out user");
      if (authClient) {
        await authClient.logout();
      }
      
      // Reset all state
      setIsAuthenticated(false);
      setIdentity(null);
      setBackendActor(null);
      setShowLanding(true);
      setShowLogin(false);
      setIsVisible(false);
      setDatasets([]);
      setModels([]);
      setGeneratedData(null);
      setPrompt("");
      setApiKey("");
      
      console.log("Logout complete - redirecting to landing page");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  // Data fetching functions
  const fetchDatasets = async () => {
    if (!backendActor) return;
    setLoading(true);
    try {
      console.log("Fetching datasets...");
      const result = await backendActor.listDatasets();
      setDatasets(result);
      console.log("Datasets fetched:", result.length);
    } catch (error) {
      console.error("Failed to fetch datasets:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (backendActor) {
      fetchDatasets();
    }
  }, [backendActor]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    
    // Debug logging
    console.log("Debug - backendActor:", !!backendActor);
    console.log("Debug - prompt:", prompt, "Length:", prompt?.length || 0);
    console.log("Debug - apiKey:", apiKey ? "PROVIDED" : "MISSING", "Length:", apiKey?.length || 0);
    
    // Improved validation
    if (!backendActor) {
      alert("Backend connection not established. Please refresh the page and try again.");
      return;
    }
    
    if (!prompt || !prompt.trim()) {
      alert("Please enter a prompt for data generation.");
      return;
    }
    
    if (!apiKey || !apiKey.trim()) {
      alert("Please enter your OpenRouter API key.");
      return;
    }
    
    setLoading(true);
    try {
      console.log("Generating synthetic data with prompt:", prompt);
      const newDatasetId = await backendActor.generateAndStoreDataset(prompt.trim(), apiKey.trim());
      
      // Fetch the generated dataset
      const generatedDataset = await backendActor.getDataset(newDatasetId);
      if (generatedDataset.length > 0) {
        setCurrentDataset(generatedDataset[0]);
        setShowDataModal(true);
      }
      
      alert(`✅ Successfully generated synthetic dataset with ID: ${newDatasetId}`);
      setPrompt("");
      setApiKey("");
      fetchDatasets();
    } catch (error) {
      console.error("Generation failed:", error);
      alert(`❌ Generation failed: ${error.message || "Unknown error"}. Please check your API key and try again.`);
    }
    setLoading(false);
  };

  // Model-related logic
  useEffect(() => {
    if (isAuthenticated && backendActor) {
      hyv_backend.listModels().then(setModels).catch(console.error);
    }
  }, [isAuthenticated, backendActor]);

  async function handleSearch(params) {
    try {
      const results = await hyv_backend.searchModels(params.domain, params.modelType, params.performance);
      setModels(results);
    } catch (error) {
      console.error("Search failed:", error);
    }
  }

  async function handleUpload(id) {
    try {
      const model = await hyv_backend.getModelNFT(id);
      if (model) {
        setModels((prev) => [...prev, model]);
      }
    } catch (error) {
      console.error("Failed to fetch uploaded model:", error);
    }
  }

  // Show loading spinner during initialization
  if (isInitializing) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Initializing Hyv Marketplace...</p>
      </div>
    );
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
              <span className="user-status">
                {identity ? `Principal: ${identity.getPrincipal().toString().slice(0, 8)}...` : 'Connected via Internet Identity'}
              </span>
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
                  <label htmlFor="prompt">Synthetic Data Generation Prompt</label>
                  <textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Example: Generate 10 customer reviews for a coffee shop with ratings and sentiment..."
                    className="textarea modern-input"
                    rows={4}
                  />
                  <small className="form-help">
                    🤖 Describe the type of training data you need. Be specific about format, quantity, and use case.
                  </small>
                </div>
                <div className="form-group">
                  <label htmlFor="apiKey">OpenRouter API Key</label>
                  <input
                    id="apiKey"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your OpenRouter API key"
                    className="input modern-input"
                  />
                  <small className="form-help">
                    🔑 Get your API key from <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer">OpenRouter.ai</a>
                  </small>
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={loading || !prompt.trim() || !apiKey.trim()}
                  className="btn btn-primary btn-generate"
                >
                  {loading ? (
                    <>
                      <div className="loading-spinner"></div>
                      <span>Generating Synthetic Data...</span>
                    </>
                  ) : (
                    <>
                      <span>🚀 Generate Training Data</span>
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
      {showDataModal && currentDataset && (
        <div className="modal-overlay" onClick={() => setShowDataModal(false)}>
          <div className="modal-content enhanced-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🎉 Synthetic Data Generated Successfully!</h2>
              <button onClick={() => setShowDataModal(false)} className="modal-close">×</button>
            </div>
            <div className="modal-body">
              <div className="dataset-info">
                <h3><strong>📊 Dataset:</strong> {currentDataset.title}</h3>
                <p><strong>📝 Description:</strong> {currentDataset.description}</p>
                <div className="tags-container">
                  <strong>🏷️ Tags:</strong>
                  {currentDataset.tags.map((tag, index) => (
                    <span key={index} className="tag modal-tag">{tag}</span>
                  ))}
                </div>
                <p><strong>🔐 Hash:</strong> <code>{currentDataset.fileHash}</code></p>
              </div>
              <div className="content-preview">
                <h4><strong>📄 Generated Content:</strong></h4>
                <pre className="code-preview synthetic-data">{currentDataset.content}</pre>
              </div>
              <div className="modal-actions">
                <button 
                  className="btn btn-primary" 
                  onClick={() => {
                    navigator.clipboard.writeText(currentDataset.content);
                    alert('📋 Content copied to clipboard!');
                  }}
                >
                  📋 Copy to Clipboard
                </button>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setShowDataModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
