import React, { useState, useEffect, useRef } from 'react';
import { Actor, HttpAgent } from '@dfinity/agent';
import { AuthClient } from '@dfinity/auth-client';
import { backendIdl } from '../declarations/hyv_backend';
import LandingPage from './components/LandingPage';
import InternetIdentityLogin from './components/InternetIdentityLogin';
import ModelSearch from './components/ModelSearch';
import ModelGrid from './components/ModelGrid';
import './index.css';

function App() {
  // Authentication state
  const [authClient, setAuthClient] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [identity, setIdentity] = useState(null);
  const [backendActor, setBackendActor] = useState(null);

  // UI state
  const [showLanding, setShowLanding] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [readyToShow, setReadyToShow] = useState(false);

  // Data state
  const [datasets, setDatasets] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [models, setModels] = useState([]);
  const [currentDataset, setCurrentDataset] = useState(null);
  const [showDataModal, setShowDataModal] = useState(false);

  // Job state
  const [currentJob, setCurrentJob] = useState(null);
  const [jobStatus, setJobStatus] = useState("idle");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  // Connection state
  const [connectionStatus, setConnectionStatus] = useState("disconnected");

  // Video loading state
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef(null);

  // Initialize app readiness
  useEffect(() => {
    if (!isInitializing && (videoLoaded || videoError)) {
      const timer = setTimeout(() => setReadyToShow(true), 500);
      return () => clearTimeout(timer);
    }
  }, [isInitializing, videoLoaded, videoError]);

  // Initialize authentication
  useEffect(() => {
    initializeAuth();
  }, []);

  // Animate main app when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setTimeout(() => setIsVisible(true), 100);
    }
  }, [isAuthenticated]);

  // Fetch data when backend is available
  useEffect(() => {
    if (backendActor) {
      fetchDatasets();
      fetchJobs();
    }
  }, [backendActor]);

  // Connection monitoring
  useEffect(() => {
    const checkConnection = async () => {
      if (!backendActor) {
        setConnectionStatus("disconnected");
        return;
      }

      try {
        setConnectionStatus("connecting");
        await backendActor.listDatasets();
        setConnectionStatus("connected");
      } catch (error) {
        console.error("Connection check failed:", error);
        setConnectionStatus("failed");
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, [backendActor]);

  const initializeAuth = async () => {
    try {
      console.log("Initializing authentication...");
      preloadVideo();

      const client = await AuthClient.create({
        idleOptions: {
          idleTimeout: 1000 * 60 * 30,
          disableDefaultIdleCallback: true,
        },
      });

      setAuthClient(client);

      const authenticated = await client.isAuthenticated();
      console.log("Authentication status:", authenticated);

      if (authenticated) {
        const userIdentity = client.getIdentity();
        console.log("User already authenticated");
        await handleAuthenticationSuccess(userIdentity);
        setShowLanding(false);
        setShowLogin(false);
      }
    } catch (error) {
      console.error("Failed to initialize authentication:", error);
    } finally {
      if (videoLoaded || videoError) {
        setIsInitializing(false);
      } else {
        setTimeout(() => setIsInitializing(false), 5000);
      }
    }
  };

  const handleAuthenticationSuccess = async (userIdentity) => {
    try {
      setIdentity(userIdentity);

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
    setShowLanding(false);
    setShowLogin(true);
  };

  const handleLogin = async (userIdentity) => {
    await handleAuthenticationSuccess(userIdentity);
    setShowLogin(false);
  };

  const handleLogout = async () => {
    try {
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

      console.log("Logout complete");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const preloadVideo = () => {
    const video = document.createElement('video');
    video.src = "/videos/hyv-loop.mp4";
    video.preload = "metadata";
    console.log("Preloading video");
  };

  const fetchDatasets = async () => {
    if (!backendActor) return;
    setLoading(true);
    try {
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
      const result = await backendActor.listPendingJobs();
      setJobs(result);
      console.log("Jobs fetched:", result.length);
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
    }
  };

  const pollJobStatus = async (jobId) => {
    const maxPolls = 60;
    let pollCount = 0;
    let pollInterval;

    const poll = async () => {
      try {
        pollCount++;
        console.log(`Polling job ${jobId} (attempt ${pollCount}/${maxPolls})`);

        if (pollCount > maxPolls) {
          setJobStatus("failed");
          setCurrentJob(prev => prev ? { ...prev, status: "failed", error: "Timeout: Job took too long to complete" } : null);
          return;
        }

        if (!backendActor) {
          setJobStatus("failed");
          return;
        }

        let job;
        try {
          if (typeof backendActor.getJob === 'function') {
            job = await backendActor.getJob(jobId);
          } else {
            const allJobs = await backendActor.listPendingJobs();
            job = allJobs.find(j => Number(j.id) === Number(jobId));
          }

          if (!job) {
            setJobStatus("failed");
            setCurrentJob(prev => prev ? { ...prev, status: "failed", error: "Job not found" } : null);
            return;
          }
        } catch (error) {
          setJobStatus("failed");
          setCurrentJob(prev => prev ? { ...prev, status: "failed", error: error.message } : null);
          return;
        }

        setCurrentJob(prev => prev ? {
          ...prev,
          status: Object.keys(job.status)[0].toLowerCase(),
          updatedAt: Date.now()
        } : null);

        const statusKey = Object.keys(job.status)[0];

        if (statusKey === "Completed") {
          setJobStatus("completed");
          await fetchDatasets();

          if (job.datasetId && job.datasetId.length > 0) {
            try {
              const datasetId = Number(job.datasetId[0]);
              const dataset = await backendActor.getDataset(datasetId);
              if (dataset && dataset.length > 0) {
                setCurrentDataset(dataset[0]);
                setShowDataModal(true);
              }
            } catch (error) {
              console.error("Error fetching completed dataset:", error);
            }
          }

          if (pollInterval) {
            clearInterval(pollInterval);
          }

          setTimeout(() => {
            alert(`✅ Job #${jobId} completed successfully! Check the marketplace for your new dataset.`);
          }, 500);

        } else if (statusKey === "Failed") {
          setJobStatus("failed");
          setCurrentJob(prev => prev ? {
            ...prev,
            status: "failed",
            error: job.status.Failed || "Job processing failed"
          } : null);

          if (pollInterval) {
            clearInterval(pollInterval);
          }

          setTimeout(() => {
            alert(`❌ Job #${jobId} failed: ${job.status.Failed || "Unknown error"}`);
          }, 500);

        } else {
          setJobStatus("polling");
        }

      } catch (error) {
        setJobStatus("failed");
        setCurrentJob(prev => prev ? {
          ...prev,
          status: "failed",
          error: error.message
        } : null);

        if (pollInterval) {
          clearInterval(pollInterval);
        }
      }
    };

    poll();
    pollInterval = setInterval(poll, 5000);

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  };

  const handleGenerate = async (e) => {
    e.preventDefault();

    if (!backendActor) {
      alert("❌ Backend connection not established. Please refresh the page and try again.");
      return;
    }

    if (!prompt || !prompt.trim()) {
      alert("❌ Please enter a prompt for data generation.");
      return;
    }

    if (prompt.trim().length < 10) {
      alert("❌ Please provide a more detailed prompt (at least 10 characters).");
      return;
    }

    setLoading(true);
    setJobStatus("submitting");

    try {
      const config = JSON.stringify({
        data_type: "text",
        max_tokens: 100,
        temperature: 0.7,
        model: "gpt-3.5-turbo"
      });

      const jobId = await backendActor.submitGenerationJob(prompt.trim(), config);

      setCurrentJob({
        id: Number(jobId),
        prompt: prompt.trim(),
        config: config,
        status: "pending",
        createdAt: Date.now(),
        updatedAt: Date.now()
      });

      setJobStatus("polling");
      const cleanup = pollJobStatus(jobId);
      setCurrentJob(prev => prev ? { ...prev, cleanup } : null);
      setPrompt("");

    } catch (error) {
      alert(`❌ Job submission failed: ${error.message || "Unknown error"}`);
      setJobStatus("failed");
      setCurrentJob(null);
    } finally {
      setLoading(false);
    }
  };

  const cancelCurrentJob = () => {
    if (currentJob && currentJob.cleanup) {
      currentJob.cleanup();
    }
    setCurrentJob(null);
    setJobStatus("idle");
  };

  const retryConnection = async () => {
    setConnectionStatus("connecting");

    try {
      if (!backendActor) {
        throw new Error("Backend actor not initialized");
      }

      await Promise.all([
        backendActor.listDatasets(),
        backendActor.listPendingJobs()
      ]);

      setConnectionStatus("connected");
      await Promise.all([fetchDatasets(), fetchJobs()]);

    } catch (error) {
      setConnectionStatus("failed");
      alert("Failed to reconnect. Please check your internet connection and try again.");
    }
  };

  const handleSearch = async (params) => {
    try {
      const results = await backendActor.searchModels(params.domain, params.modelType, params.performance);
      setModels(results);
    } catch (error) {
      console.error("Search failed:", error);
    }
  };

  // Loading screen
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
            onCanPlayThrough={() => setVideoLoaded(true)}
            onError={() => setVideoError(true)}
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

  // Landing page
  if (showLanding) {
    return <LandingPage onEnterApp={handleEnterApp} />;
  }

  // Login page
  if (showLogin && !isAuthenticated) {
    return <InternetIdentityLogin onLogin={handleLogin} />;
  }

  // Main app
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

      {/* Header */}
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
                  onClick={retryConnection}
                  className="btn btn-small retry-btn"
                  disabled={connectionStatus === "connecting"}
                >
                  {connectionStatus === "connecting" ? (
                    <>
                      <div className="loading-spinner small"></div>
                      <span>Retrying...</span>
                    </>
                  ) : (
                    "🔄 Retry Connection"
                  )}
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

      {/* Main Content */}
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
                        <div className="job-primary-info">
                          <span className="job-id">Job #{currentJob.id}</span>
                          <span className={`job-status status-${jobStatus}`}>
                            {jobStatus === "submitting" && "📤 Submitting..."}
                            {jobStatus === "polling" && "⏳ Processing..."}
                            {jobStatus === "completed" && "✅ Completed"}
                            {jobStatus === "failed" && "❌ Failed"}
                          </span>
                        </div>
                        <div className="job-timing">
                          <span className="job-created">
                            Created: {new Date(currentJob.createdAt).toLocaleTimeString()}
                          </span>
                          {currentJob.updatedAt && currentJob.updatedAt !== currentJob.createdAt && (
                            <span className="job-updated">
                              Updated: {new Date(currentJob.updatedAt).toLocaleTimeString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="job-prompt-preview">
                        <strong>Prompt:</strong> "{currentJob.prompt.length > 80
                          ? currentJob.prompt.substring(0, 80) + '...'
                          : currentJob.prompt}"
                      </div>
                      {currentJob.error && (
                        <div className="job-error">
                          <strong>Error:</strong> {currentJob.error}
                        </div>
                      )}
                      {jobStatus === "polling" && (
                        <div className="polling-indicator">
                          <div className="loading-spinner small"></div>
                          <span>AI worker is processing your request...</span>
                          <button
                            onClick={cancelCurrentJob}
                            className="btn btn-small"
                            style={{
                              marginLeft: 'auto',
                              background: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.2)',
                              color: 'var(--error-color)'
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      )}
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
                    {jobs.map((job) => {
                      const statusKey = Object.keys(job.status)[0];
                      const isCompleted = statusKey === "Completed";
                      const isFailed = statusKey === "Failed";
                      const isRunning = statusKey === "Running";
                      const isPending = statusKey === "Pending";

                      return (
                        <div key={Number(job.id)} className="job-card">
                          <div className="job-header">
                            <div className="job-title-section">
                              <span className="job-id">Job #{Number(job.id)}</span>
                              <span className={`job-status status-${statusKey.toLowerCase()}`}>
                                {isPending && "⏳ Pending"}
                                {isRunning && "⚙️ Running"}
                                {isCompleted && "✅ Completed"}
                                {isFailed && "❌ Failed"}
                              </span>
                            </div>
                            <div className="job-actions">
                              {isCompleted && job.datasetId && job.datasetId.length > 0 && (
                                <button
                                  className="btn btn-small btn-secondary"
                                  onClick={async () => {
                                    try {
                                      const dataset = await backendActor.getDataset(Number(job.datasetId[0]));
                                      if (dataset && dataset.length > 0) {
                                        setCurrentDataset(dataset[0]);
                                        setShowDataModal(true);
                                      }
                                    } catch (error) {
                                      console.error("Error fetching dataset:", error);
                                    }
                                  }}
                                >
                                  👁️ View Dataset
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="job-prompt">
                            <strong>Prompt:</strong> {job.prompt.length > 100
                              ? job.prompt.substring(0, 100) + '...'
                              : job.prompt}
                          </p>
                          <div className="job-meta">
                            <div className="job-details">
                              <span className="job-date">
                                📅 {new Date(Number(job.createdAt)).toLocaleString()}
                              </span>
                              {job.datasetId && job.datasetId.length > 0 && (
                                <span className="job-dataset">
                                  📊 Dataset #{Number(job.datasetId[0])}
                                </span>
                              )}
                            </div>
                            <div className="job-config">
                              <span className="config-badge">
                                {JSON.parse(job.config).data_type || 'text'}
                              </span>
                            </div>
                          </div>
                          {isFailed && job.status.Failed && (
                            <div className="job-error-details">
                              <strong>❌ Error:</strong> {job.status.Failed}
                            </div>
                          )}
                        </div>
                      );
                    })}
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
            {/* Stats Grid */}
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
                  <p className="card-subtitle">Browse and manage your AI-generated datasets</p>
                </div>
                <button onClick={fetchDatasets} disabled={loading} className="btn btn-small refresh-btn">
                  {loading ? (
                    <div className="loading-spinner small"></div>
                  ) : (
                    "🔄 Refresh"
                  )}
                </button>
              </div>
              <div className="card-content">
                {datasets.length > 0 ? (
                  <div className="dataset-grid">
                    {datasets.map((dataset) => (
                      <div
                        key={Number(dataset.id)}
                        className="dataset-card"
                        onClick={() => {
                          setCurrentDataset(dataset);
                          setShowDataModal(true);
                        }}
                      >
                        <div className="dataset-header">
                          <h3 className="dataset-title">
                            {dataset.title || `Dataset #${Number(dataset.id)}`}
                          </h3>
                          <div className="dataset-status verified">✓ Verified</div>
                        </div>
                        <p className="dataset-description">
                          {dataset.description || "AI-generated synthetic dataset"}
                        </p>
                        <div className="dataset-meta">
                          <div className="dataset-tags">
                            {Array.isArray(dataset.tags) && dataset.tags.length > 0 ? (
                              dataset.tags.slice(0, 3).map((tag, index) => (
                                <span key={index} className="tag">{tag}</span>
                              ))
                            ) : (
                              <span className="tag">synthetic-data</span>
                            )}
                            {Array.isArray(dataset.tags) && dataset.tags.length > 3 && (
                              <span className="tag">+{dataset.tags.length - 3} more</span>
                            )}
                          </div>
                          <div className="dataset-info">
                            <div className="dataset-hash">
                              ID: {Number(dataset.id)}
                            </div>
                            <div className="dataset-size">
                              Size: {dataset.content ? dataset.content.length : 0} chars
                            </div>
                            <div className="dataset-date">
                              {dataset.uploadDate ? new Date(Number(dataset.uploadDate)).toLocaleDateString() : 'Recent'}
                            </div>
                          </div>
                        </div>
                        <div className="dataset-actions">
                          <button
                            className="btn btn-small btn-secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentDataset(dataset);
                              setShowDataModal(true);
                            }}
                          >
                            👁️ View Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">📦</div>
                    <h3>No datasets found</h3>
                    <p>Create your first AI-generated dataset using the form above to get started!</p>
                    <div className="empty-actions">
                      <button
                        className="btn btn-primary"
                        onClick={() => document.querySelector('.generation-card textarea')?.focus()}
                      >
                        🚀 Generate Dataset
                      </button>
                    </div>
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
