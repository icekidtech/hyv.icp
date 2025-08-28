import React, { useState, useEffect, useRef } from 'react';
import { Actor, HttpAgent } from '@dfinity/agent';
import { AuthClient } from '@dfinity/auth-client';
import { idlFactory, canisterId as backendCanisterId } from '../../declarations/hyv_backend';
import LandingPage from './components/LandingPage';
import InternetIdentityLogin from './components/InternetIdentityLogin';
import ModelSearch from './components/ModelSearch';
import ModelGrid from './components/ModelGrid';
import Marketplace from './components/Marketplace';
import GenerationPage from './components/GenerationPage';
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
  const [currentPage, setCurrentPage] = useState('marketplace'); // 'marketplace' or 'generation'
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
      } else {
        // Allow viewing marketplace without authentication
        await initializeBackendActor();
      }
    } catch (error) {
      console.error("Failed to initialize authentication:", error);
      // Still allow marketplace viewing
      await initializeBackendActor();
    } finally {
      if (videoLoaded || videoError) {
        setIsInitializing(false);
      } else {
        setTimeout(() => setIsInitializing(false), 5000);
      }
    }
  };

  const initializeBackendActor = async () => {
    try {
      // Determine the host based on environment
      const hostname = window.location.hostname;
      const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
      const isCanister = hostname.includes('.localhost');
      
      let host;
      if (isLocal || isCanister) {
        host = "http://127.0.0.1:4943";
      } else {
        host = "https://ic0.app";
      }

      console.log("Creating agent with host:", host);

      const agent = new HttpAgent({
        identity: null, // Anonymous access for marketplace viewing
        host: host,
      });

      // CRITICAL: Always fetch root key for local development
      if (isLocal || isCanister || process.env.DFX_NETWORK !== "ic") {
        console.log("Fetching root key for local development...");
        try {
          await agent.fetchRootKey();
          console.log("Root key fetched successfully");
        } catch (rootKeyError) {
          console.error("Failed to fetch root key:", rootKeyError);
        }
      }

      const actor = Actor.createActor(idlFactory, {
        agent,
        canisterId: backendCanisterId,
      });

      setBackendActor(actor);
      console.log("Backend actor created successfully for anonymous access");
    } catch (error) {
      console.error("Failed to create backend actor:", error);
    }
  };

  // Updated handleAuthenticationSuccess function with runtime host detection and root key fetching
  const handleAuthenticationSuccess = async (userIdentity) => {
    try {
      setIdentity(userIdentity);

      // Determine the host based on environment
      const hostname = window.location.hostname;
      const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
      const isCanister = hostname.includes('.localhost');
      
      let host;
      if (isLocal || isCanister) {
        host = "http://127.0.0.1:4943";
      } else {
        host = "https://ic0.app";
      }

      console.log("Creating agent with host:", host);

      const agent = new HttpAgent({
        identity: userIdentity,
        host: host,
      });

      // CRITICAL: Always fetch root key for local development
      if (isLocal || isCanister || process.env.DFX_NETWORK !== "ic") {
        console.log("Fetching root key for local development...");
        try {
          await agent.fetchRootKey();
          console.log("Root key fetched successfully");
        } catch (rootKeyError) {
          console.error("Failed to fetch root key:", rootKeyError);
          throw new Error(`Root key fetch failed: ${rootKeyError.message}`);
        }
      }

      const actor = Actor.createActor(idlFactory, {
        agent,
        canisterId: backendCanisterId,
      });

      setBackendActor(actor);
      setIsAuthenticated(true);
      console.log("Backend actor created successfully");
    } catch (error) {
      console.error("Failed to create backend actor:", error);
      // Show user-friendly error
      alert(`Authentication setup failed: ${error.message}. Please try refreshing the page.`);
    }
  };

  const handleEnterApp = () => {
  setShowLanding(false);
  setCurrentPage('marketplace');
  // Make the main app visible for anonymous users who 'enter' the marketplace
  setIsVisible(true);
  // Ensure we bypass the initial loading screen if user explicitly enters the marketplace
  setIsInitializing(false);
  setReadyToShow(true);
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
      setShowLanding(true);
      setShowLogin(false);
      setIsVisible(false);
      setDatasets([]);
      setModels([]);
      setJobs([]);
      setCurrentJob(null);
      setJobStatus("idle");
      setPrompt("");
      setCurrentPage('marketplace');

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

    if (!isAuthenticated) {
      alert("❌ Please login to generate datasets. The marketplace is viewable without login, but generation requires authentication.");
      setShowLogin(true);
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

  const handlePurchaseDataset = async (datasetId) => {
    if (!isAuthenticated) {
      alert("❌ Please login to purchase datasets.");
      setShowLogin(true);
      return;
    }

    try {
      const result = await backendActor.purchaseDataset(datasetId);
      if (result.ok) {
        alert(`✅ ${result.ok}`);
        await fetchDatasets(); // Refresh the datasets
      } else {
        alert(`❌ Purchase failed: ${result.err}`);
      }
    } catch (error) {
      alert(`❌ Purchase failed: ${error.message}`);
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
          <nav className="nav-links">
            <button
              className={`nav-link ${currentPage === 'marketplace' ? 'active' : ''}`}
              onClick={() => setCurrentPage('marketplace')}
            >
              Marketplace
            </button>
            <button
              className={`nav-link ${currentPage === 'generation' ? 'active' : ''}`}
              onClick={() => setCurrentPage('generation')}
            >
              Generate Data
            </button>
          </nav>
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
            {isAuthenticated ? (
              <div className="user-avatar">
                <span>🧠</span>
                <div className="avatar-pulse"></div>
              </div>
            ) : (
              <button onClick={() => setShowLogin(true)} className="btn btn-secondary login-btn">
                <span>Login</span>
              </button>
            )}
            {isAuthenticated && (
              <>
                <div className="user-details">
                  <span className="user-greeting">Welcome back!</span>
                  <span className="user-status">
                    {identity ? `Principal: ${identity.getPrincipal().toString().slice(0, 8)}...` : 'Connected via Internet Identity'}
                  </span>
                </div>
                <button onClick={handleLogout} className="btn btn-secondary logout-btn">
                  <span>Logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="main-content">
        {currentPage === 'marketplace' ? (
          <Marketplace
            datasets={datasets}
            loading={loading}
            onRefresh={fetchDatasets}
            onPurchaseDataset={handlePurchaseDataset}
            onViewDataset={(dataset) => {
              setCurrentDataset(dataset);
              setShowDataModal(true);
            }}
            isAuthenticated={isAuthenticated}
          />
        ) : (
          <GenerationPage
            prompt={prompt}
            setPrompt={setPrompt}
            onGenerate={handleGenerate}
            loading={loading}
            currentJob={currentJob}
            jobStatus={jobStatus}
            onCancelJob={cancelCurrentJob}
            jobs={jobs}
            onRefreshJobs={fetchJobs}
            onViewDataset={(dataset) => {
              setCurrentDataset(dataset);
              setShowDataModal(true);
            }}
            backendActor={backendActor}
            isAuthenticated={isAuthenticated}
            onLogin={() => setShowLogin(true)}
          />
        )}
      </main>

      {/* Generated Data Modal */}
      {showDataModal && currentDataset && (
        <div className="modal-overlay" onClick={() => setShowDataModal(false)}>
          <div className="modal-content enhanced-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🎉 Dataset Details</h2>
              <button onClick={() => setShowDataModal(false)} className="modal-close">×</button>
            </div>
            <div className="modal-body">
              <div className="dataset-info">
                <h3><strong>📊 Dataset:</strong> {currentDataset.title || "Untitled Dataset"}</h3>
                <p><strong>📝 Description:</strong> {currentDataset.description || "No description provided"}</p>
                <div className="dataset-meta-info">
                  <p><strong>💰 Price:</strong> {currentDataset.price} eICP</p>
                  <p><strong>📥 Downloads:</strong> {currentDataset.downloads}</p>
                  <p><strong>⭐ Rating:</strong> {currentDataset.rating}/100</p>
                </div>
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
                <h4><strong>📄 Content Preview:</strong></h4>
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
