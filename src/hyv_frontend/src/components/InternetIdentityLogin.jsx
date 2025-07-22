import React, { useEffect, useState } from "react";
import { AuthClient } from "@dfinity/auth-client";
import './InternetIdentityLogin.css';

export default function InternetIdentityLogin({ onLogin }) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    AuthClient.create().then(client => {
      if (client.isAuthenticated()) {
        setLoggedIn(true);
        onLogin(client.getIdentity());
      }
    });
  }, [onLogin]);

  async function login() {
    setIsLoading(true);
    try {
      const client = await AuthClient.create();
      await client.login({
        identityProvider: "https://identity.ic0.app",
        onSuccess: () => {
          setLoggedIn(true);
          onLogin(client.getIdentity());
          setIsLoading(false);
        },
        onError: () => {
          setIsLoading(false);
        }
      });
    } catch (error) {
      console.error("Login failed:", error);
      setIsLoading(false);
    }
  }

  async function logout() {
    setIsLoading(true);
    try {
      const client = await AuthClient.create();
      await client.logout();
      setLoggedIn(false);
      setIsLoading(false);
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoading(false);
    }
  }

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
        {loggedIn ? (
          <div className="auth-success">
            <div className="success-animation">
              <div className="success-icon">✓</div>
              <div className="success-rings">
                <div className="ring ring-1"></div>
                <div className="ring ring-2"></div>
                <div className="ring ring-3"></div>
              </div>
            </div>
            <h2 className="auth-title">
              <span className="gradient-text">Connected Successfully!</span>
            </h2>
            <p className="auth-subtitle">
              Your Internet Identity is now linked to Hyv Marketplace
            </p>
            <div className="user-badge">
              <div className="user-avatar">
                <div className="avatar-glow"></div>
                <span>🧠</span>
              </div>
              <span className="user-greeting">Welcome to the future of AI!</span>
            </div>
            <button 
              onClick={logout} 
              className="btn btn-secondary"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="loading-spinner"></div>
                  <span>Disconnecting...</span>
                </>
              ) : (
                'Disconnect'
              )}
            </button>
          </div>
        ) : (
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
            </div>
            <button 
              onClick={login} 
              className="btn btn-primary auth-btn"
              disabled={isLoading}
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
              <p>First time? <a href="https://identity.ic0.app" target="_blank" rel="noopener noreferrer">Create your Internet Identity</a></p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}