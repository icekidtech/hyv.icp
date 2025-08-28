import React, { useState, useEffect, useRef } from "react";
import { AuthClient } from "@dfinity/auth-client";
import { HttpAgent, Actor } from "@dfinity/agent";
import { createActor as createBackendActor, canisterId as backendCanisterId } from "../../declarations/hyv_backend";

import LandingPage from "./components/LandingPage";
import InternetIdentityLogin from "./components/InternetIdentityLogin";
import ModelUpload from "./components/ModelUpload";
import ModelGrid from "./components/ModelGrid";
import ModelSearch from "./components/ModelSearch";

import "./index.css";

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
  const [currentDataset, setCurrentDataset] = useState(null);
  const [showDataModal, setShowDataModal] = useState(false);

  // Job-related state (was missing and caused runtime errors)
  const [jobs, setJobs] = useState([]);
  const [currentJob, setCurrentJob] = useState(null);
  const [jobStatus, setJobStatus] = useState("idle");

  const [connectionStatus, setConnectionStatus] = useState("disconnected");

  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef(null);

  // Force the app to wait for both initialization and video loading
  const [readyToShow, setReadyToShow] = useState(false);
  
  useEffect(() => {
    // Only mark ready when initialization completes AND video loads (or errors)
    if (!isInitializing && (videoLoaded || videoError)) {
      // Add a small delay for smoother transition
      const timer = setTimeout(() => setReadyToShow(true), 500);
      return () => clearTimeout(timer);
    }
  }, [isInitializing, videoLoaded, videoError]);

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

  // Update the initialization function to load video assets
  const initializeAuth = async () => {
    try {
      console.log("Initializing authentication...");
      // Load your video in parallel with auth
      preloadVideo();
      
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
      // Only finish initializing if video has loaded or errored
      if (videoLoaded || videoError) {
        setIsInitializing(false);
      } else {
        // Set a timeout to prevent getting stuck on initialization
        setTimeout(() => setIsInitializing(false), 5000);
      }
    }
  };

  const handleAuthenticationSuccess = async (userIdentity) => {
    try {
      setIdentity(userIdentity);
      
      // Create actor with proper configuration
      const actor = Actor.createActor(backendIdl, {
        agentOptions: {
          identity: userIdentity,
          host: process.env.DFX_NETWORK === "local" ? "http://localhost:4943" : "https://ic0.app",
        },
      });
      
      setBackendActor(actor);
      setIsAuthenticated(true);
      console.log("Backend actor created successfully");
    } catch (error) {
      console.error("Failed to create backend actor:", error);
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
      setJobs([]);
      setCurrentJob(null);
      setJobStatus("idle");
      setPrompt("");
      
      console.log("Logout complete - redirecting to landing page");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  // Poll job status until completion
  const pollJobStatus = async (jobId) => {
    const maxPolls = 60; // Maximum 5 minutes of polling
    let pollCount = 0;

    const poll = async () => {
      try {
        pollCount++;
        console.log(`Polling job ${jobId} (attempt ${pollCount})`);

        // Check if getJob function exists
        if (typeof backendActor.getJob !== 'function') {
          console.error("getJob function not available on backend");
          // Fallback: fetch all jobs and find the one we need
          const allJobs = await backendActor.listPendingJobs();
          const job = allJobs.find(j => Number(j.id) === Number(jobId));
          
          if (!job) {
            console.error("Job not found in pending jobs");
            setJobStatus("failed");
            return;
          }
          
          // Continue with job processing...
          console.log("Job status:", job.status);
        } else {
          const job = await backendActor.getJob(jobId);
          // ...existing job processing code...
        }
      } catch (error) {
        console.error("Polling error:", error);
        setJobStatus("failed");
      }
    };

    poll();
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

  const fetchJobs = async () => {
    if (!backendActor) return;
    try {
      console.log("Fetching jobs...");
      const result = await backendActor.listPendingJobs();
      setJobs(result);
      console.log("Jobs fetched:", result.length);
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
    }
  };

  useEffect(() => {
    if (backendActor) {
      fetchDatasets();
      fetchJobs();
    }
  }, [backendActor]);

  const handleGenerate = async (e) => {
    e.preventDefault();

    // Validation
    if (!backendActor) {
      alert("Backend connection not established. Please refresh the page and try again.");
      return;
    }

    if (!prompt || !prompt.trim()) {
      alert("Please enter a prompt for data generation.");
      return;
    }

    setLoading(true);
    setJobStatus("submitting");

    try {
      console.log("Submitting generation job:", prompt);

      // Submit job to off-chain worker queue
      const config = JSON.stringify({
        data_type: "text",
        max_tokens: 100
      });

      const jobId = await backendActor.submitGenerationJob(prompt.trim(), config);
      console.log("Job submitted with ID:", jobId);

      // Set current job for tracking
      setCurrentJob({
        id: Number(jobId),
        prompt: prompt.trim(),
        config: config,
        status: "pending",
        createdAt: Date.now()
      });

      setJobStatus("polling");

      // Start polling for job completion
      pollJobStatus(jobId);

      alert(`✅ Job submitted successfully with ID: ${jobId}\n\nThe off-chain worker will process your request. You'll be notified when it's complete.`);

      setPrompt("");
    } catch (error) {
      console.error("Job submission failed:", error);
      alert(`❌ Job submission failed: ${error.message || "Unknown error"}`);
      setJobStatus("failed");
    } finally {
      setLoading(false);
    }
  };

  // Model-related logic
  useEffect(() => {
    if (isAuthenticated && backendActor) {
      backendActor.listModels().then(setModels).catch(console.error);
    }
  }, [isAuthenticated, backendActor]);

  async function handleSearch(params) {
    try {
      const results = await backendActor.searchModels(params.domain, params.modelType, params.performance);
      setModels(results);
    } catch (error) {
      console.error("Search failed:", error);
    }
  }

  async function handleUpload(id) {
    try {
      const model = await backendActor.getModelNFT(id);
      if (model) {
        setModels((prev) => [...prev, model]);
      }
    } catch (error) {
      console.error("Failed to fetch uploaded model:", error);
    }
  }

  // Preload video function
  const preloadVideo = () => {
    const video = new Image();
    video.src = "/videos/hyv-loop.mp4";
    console.log("Preloading video from:", video.src);
  };

  // Add this debug function to check connection
  const debugBackendConnection = async () => {
    console.log("Backend Actor:", backendActor);
    if (backendActor) {
      try {
        // Test basic connection
        const datasets = await backendActor.listDatasets();
        console.log("Backend connection working, datasets:", datasets.length);
        
        // Test job functions
        const jobs = await backendActor.listPendingJobs();
        console.log("Job functions working, pending jobs:", jobs.length);
      } catch (error) {
        console.error("Backend connection error:", error);
      }
    } else {
      console.error("Backend actor not initialized");
    }
  };

  // Add this to your useEffect after authentication
  useEffect(() => {
    if (isAuthenticated && backendActor) {
      debugBackendConnection();
    }
  }, [isAuthenticated, backendActor]);

  // Show loading screen until ready to proceed
  if (!readyToShow) {
    return (
      <div className="app-loading">
        <div className="video-container">
          <video 
            ref={videoRef}
            autoPlay 
            loop 
            muted 
            playsInline
            className={`loading-video ${videoLoaded ? 'loaded' : ''}`}
            onCanPlayThrough={() => {
              console.log("Video can play through");
              setVideoLoaded(true);
            }}
            onError={(e) => {
              console.error("Video loading error:", e);
              setVideoError(true);
            }}
          >
            <source src="/videos/hyv-loop.mp4" type="video/mp4" />
          </video>
          
          <div className="fallback-loading">
            <div className="loading-spinner"></div>
            <p>Initializing Hyv Marketplace...</p>
          </div>
        </div>
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
            <div className="connection-status">
              <div className={`status-indicator ${connectionStatus}`}>
                <div className="status-dot"></div>
                <span className="status-text">
                  {connectionStatus === "connected" && "🟢 Connected"}
                  {connectionStatus === "connecting" && "🟡 Connecting..."}
                  {connectionStatus === "failed" && "🔴 Connection Failed"}
                  {connectionStatus === "disconnected" && "⚪ Disconnected"}
                </span>
              </div>
              {connectionStatus === "failed" && (
                <button 
                  onClick={() => window.location.reload()} 
                  className="btn btn-small retry-btn"
                >
                  🔄 Retry Connection
                </button>
              )}
            </div>
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
                    🤖 Describe the type of training data you need. Your job will be processed by our off-chain AI worker using local models.
                  </small>
                </div>

                {/* Job Status Display */}
                {currentJob && (
                  <div className="form-group">
                    <label>Current Job Status</label>
                    <div className="job-status-display">
                      <div className="job-info">
                        <span className="job-id">Job #{currentJob.id}</span>
                        <span className={`job-status status-${jobStatus}`}>
                          {jobStatus === "submitting" && "📤 Submitting..."}
                          {jobStatus === "polling" && "⏳ Processing..."}
                          {jobStatus === "completed" && "✅ Completed"}
                          {jobStatus === "failed" && "❌ Failed"}
                        </span>
                      </div>
                      <div className="job-prompt-preview">
                        "{currentJob.prompt.substring(0, 50)}..."
                      </div>
                    </div>
                  </div>
                )}
                <button
                  onClick={handleGenerate}
                  disabled={loading || !prompt.trim() || jobStatus === "polling"}
                  className="btn btn-primary btn-generate"
                >
                  {loading ? (
                    <>
                      <div className="loading-spinner"></div>
                      <span>Submitting Job...</span>
                    </>
                  ) : jobStatus === "polling" ? (
                    <>
                      <div className="loading-spinner"></div>
                      <span>Worker Processing...</span>
                    </>
                  ) : (
                    <>
                      <span>🚀 Submit Generation Job</span>
                      <div className="btn-glow"></div>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Jobs List */}
            <div className="dashboard-card jobs-card">
              <div className="card-header">
                <div className="card-icon">⚙️</div>
                <div className="card-title-section">
                  <h2 className="card-title">Generation Jobs</h2>
                  <p className="card-subtitle">Track your AI generation requests</p>
                </div>
                <button onClick={fetchJobs} disabled={loading} className="btn btn-small refresh-btn">
                  {loading ? (
                    <div className="loading-spinner small"></div>
                  ) : (
                    "Refresh"
                  )}
                </button>
              </div>
              <div className="card-content">
                {jobs.length > 0 ? (
                  <div className="jobs-list">
                    {jobs.map((job) => (
                      <div key={Number(job.id)} className="job-card">
                        <div className="job-header">
                          <span className="job-id">Job #{Number(job.id)}</span>
                          <span className={`job-status status-${Object.keys(job.status)[0].toLowerCase()}`}>
                            {Object.keys(job.status)[0]}
                          </span>
                        </div>
                        <p className="job-prompt">"{job.prompt.substring(0, 60)}..."</p>
                        <div className="job-meta">
                          <span className="job-date">
                            {new Date(Number(job.createdAt)).toLocaleString()}
                          </span>
                          {job.datasetId && (
                            <span className="job-dataset">Dataset #{Number(job.datasetId)}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">⚙️</div>
                    <h3>No jobs found</h3>
                    <p>Submit your first generation job to get started!</p>
                  </div>
                )}
              </div>
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
                <div className="stat-icon">⚙️</div>
                <div className="stat-value">{jobs.length}</div>
                <div className="stat-label">Jobs</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🤖</div>
                <div className="stat-value">{models.length}</div>
                <div className="stat-label">AI Models</div>
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
              <h2>🎉 AI Generation Complete!</h2>
              <button onClick={() => setShowDataModal(false)} className="modal-close">×</button>
            </div>
            <div className="modal-body">
              <div className="dataset-info">
                <h3><strong>📊 Dataset:</strong> {currentDataset.title || "Untitled Dataset"}</h3>
                <p><strong>📝 Description:</strong> {currentDataset.description || "No description provided"}</p>
                <div className="tags-container">
                  <strong>🏷️ Tags:</strong>
                  {Array.isArray(currentDataset.tags) ? 
                    currentDataset.tags.map((tag, index) => (
                      <span key={index} className="tag modal-tag">{tag}</span>
                    )) : 
                    <span>No tags available</span>
                  }
                </div>
                <p><strong>🔐 Hash:</strong> <code>{currentDataset.fileHash || "No hash available"}</code></p>
                {currentJob && (
                  <div className="job-info">
                    <strong>⚙️ Generated from Job:</strong> #{currentJob.id}
                    <br />
                    <strong>📝 Original Prompt:</strong> {currentJob.prompt}
                  </div>
                )}
              </div>
              <div className="content-preview">
                <h4><strong>📄 Generated Content:</strong></h4>
                <pre className="code-preview synthetic-data">
                  {typeof currentDataset.content === 'string' ? currentDataset.content : JSON.stringify(currentDataset.content, null, 2)}
                </pre>
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
