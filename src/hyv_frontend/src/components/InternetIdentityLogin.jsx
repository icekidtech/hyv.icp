import React, { useEffect, useState } from "react";
import { AuthClient } from "@dfinity/auth-client";
import './InternetIdentityLogin.css';

export default function InternetIdentityLogin({ onLogin }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [error, setError] = useState("");
  const [authClient, setAuthClient] = useState(null);

  useEffect(() => {
    setIsVisible(true);
    initAuthClient();
  }, []);

  const initAuthClient = async () => {
    try {
      const client = await AuthClient.create({
        idleOptions: {
          idleTimeout: 1000 * 60 * 30, // 30 minutes
          disableDefaultIdleCallback: true,
        },
      });
      setAuthClient(client);

      // Check if user is already authenticated
      const isAuthenticated = await client.isAuthenticated();
      if (isAuthenticated) {
        const identity = client.getIdentity();
        onLogin(identity);
      }
    } catch (error) {
      console.error("Failed to initialize AuthClient:", error);
      setError("Failed to initialize authentication. Please refresh the page.");
    }
  };

  const login = async () => {
    if (!authClient) {
      setError("Authentication client not ready. Please try again.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Get the current hostname for the redirect URL
      const hostname = window.location.hostname;
      const port = window.location.port ? `:${window.location.port}` : '';
      const protocol = window.location.protocol;
      
      // Determine the identity provider URL based on environment
      const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
      const identityProvider = isLocal 
        ? `http://rdmx6-jaaaa-aaaaa-aaadq-cai.localhost:4943`
        : "https://identity.ic0.app";

      await new Promise((resolve, reject) => {
        authClient.login({
          identityProvider,
          windowOpenerFeatures: 
            `left=${window.screen.width / 2 - 525 / 2}, ` +
            `top=${window.screen.height / 2 - 705 / 2},` +
            `toolbar=0,location=0,menubar=0,width=525,height=705`,
          onSuccess: () => {
            const identity = authClient.getIdentity();
            console.log("Login successful, identity:", identity.getPrincipal().toString());
            onLogin(identity);
            resolve();
          },
          onError: (error) => {
            console.error("Login failed:", error);
            setError("Login failed. Please try again.");
            reject(error);
          }
        });
      });
    } catch (error) {
      console.error("Authentication error:", error);
      setError("Authentication failed. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`auth-container ${isVisible ? 'visible' : ''}`}>
      {/* Animated Background */}
      <div className="auth-bg-animation">
        <div className="neural-network">
          {[...Array(12)].map((_, i) => (
            <div key={i} className={`node node-${i}`}></div>
          ))}
          {[...Array(8)].map((_, i) => (
            <div key={i} className={`connection connection-${i}`}></div>
          ))}
        </div>
      </div>

      <div className="auth-content">
        <div className="auth-login">
          <div className="login-animation">
            <div className="floating-identity">
              <div className="identity-icon">🔐</div>
              <div className="identity-pulse"></div>
            </div>
          </div>
          
          <h2 className="auth-title">
            Connect with <span className="gradient-text">Internet Identity</span>
          </h2>
          
          <p className="auth-subtitle">
            Secure, passwordless authentication powered by the Internet Computer Protocol
          </p>
          
          <div className="auth-features">
            <div className="feature-item">
              <span className="feature-icon">🔒</span>
              <span>Fully Decentralized</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🚀</span>
              <span>No Passwords Required</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">⚡</span>
              <span>Instant Access</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🛡️</span>
              <span>Cryptographically Secure</span>
            </div>
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}
          
          <button 
            onClick={login} 
            className="btn btn-primary auth-btn"
            disabled={isLoading || !authClient}
          >
            {isLoading ? (
              <>
                <div className="loading-spinner"></div>
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <span>Connect Internet Identity</span>
                <div className="btn-glow"></div>
              </>
            )}
          </button>
          
          <div className="auth-footer">
            <p>
              First time? {" "}
              <a 
                href="https://identity.ic0.app" 
                target="_blank" 
                rel="noopener noreferrer"
                className="create-identity-link"
              >
                Create your Internet Identity
              </a>
            </p>
            <div className="security-notice">
              <small>
                🔒 Your authentication is secured by the Internet Computer's cryptographic protocols. 
                No personal data is stored on our servers.
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}