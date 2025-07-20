import React, { useEffect, useState } from 'react';
import './LandingPage.css';

const LandingPage = ({ onEnterApp }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(0);

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      title: "AI-Powered Generation",
      description: "Generate high-quality synthetic datasets using on-chain LLMs",
      icon: "🧠"
    },
    {
      title: "Decentralized Marketplace",
      description: "Trade verified datasets with transparent provenance on ICP",
      icon: "🌐"
    },
    {
      title: "Token Incentives",
      description: "Earn rewards for contributing quality synthetic data",
      icon: "💎"
    }
  ];

  const stats = [
    { number: "10K+", label: "Datasets Generated" },
    { number: "500+", label: "Active Contributors" },
    { number: "99.9%", label: "Data Accuracy" },
    { number: "100%", label: "On-Chain Verified" }
  ];

  return (
    <div className={`landing-container ${isVisible ? 'visible' : ''}`}>
      {/* Animated Background */}
      <div className="bg-animation">
        <div className="neural-network">
          {[...Array(20)].map((_, i) => (
            <div key={i} className={`node node-${i}`}></div>
          ))}
          {[...Array(15)].map((_, i) => (
            <div key={i} className={`connection connection-${i}`}></div>
          ))}
        </div>
      </div>

      {/* Header */}
      <header className="landing-header">
        <div className="logo-container">
          <div className="logo">
            <span className="logo-text"><img src="tlogo.png" alt="" width={50}/></span>
            <div className="logo-pulse"></div>
          </div>
        </div>
        <nav className="nav-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#stats">Stats</a>
          <button className="nav-cta" onClick={onEnterApp}>Launch App</button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <span><img src="favicon.jpg" alt="" width={20} /> Powered by Internet Computer</span>
          </div>
          <h1 className="hero-title">
            The Future of
            <span className="gradient-text"> AI Data</span>
            <br />
            is <span className="gradient-text">Decentralized</span>
          </h1>
          <p className="hero-subtitle">
            Generate, verify, and trade synthetic datasets on the world's first 
            fully on-chain AI marketplace. Built for the next generation of trustworthy AI.
          </p>
          <div className="hero-actions">
            <button className="primary-btn" onClick={onEnterApp}>
              <span>Enter Marketplace</span>
              <div className="btn-glow"></div>
            </button>
            <button className="secondary-btn">
              <span>Watch Demo</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </button>
          </div>
        </div>
        <div className="hero-visual">
          <div className="floating-cards">
            <div className="data-card card-1">
              <div className="card-header">
                <span className="card-type">Text Dataset</span>
                <span className="card-status verified">✓ Verified</span>
              </div>
              <div className="card-content">
                <div className="data-preview">
                  <div className="data-line"></div>
                  <div className="data-line short"></div>
                  <div className="data-line"></div>
                </div>
              </div>
            </div>
            <div className="data-card card-2">
              <div className="card-header">
                <span className="card-type">AI Model</span>
                <span className="card-status generating">⚡ Generating</span>
              </div>
              <div className="card-content">
                <div className="progress-ring">
                  <div className="progress-fill"></div>
                </div>
              </div>
            </div>
            <div className="data-card card-3">
              <div className="card-header">
                <span className="card-type">Marketplace</span>
                <span className="card-status trading">💰 Trading</span>
              </div>
              <div className="card-content">
                <div className="trading-chart">
                  <div className="chart-bar" style={{height: '60%'}}></div>
                  <div className="chart-bar" style={{height: '80%'}}></div>
                  <div className="chart-bar" style={{height: '40%'}}></div>
                  <div className="chart-bar" style={{height: '90%'}}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="section-header">
          <h2>Revolutionary Features</h2>
          <p>Experience the power of decentralized AI data generation</p>
        </div>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className={`feature-card ${index === currentFeature ? 'active' : ''}`}
            >
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <div className="feature-glow"></div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="how-it-works-section">
        <div className="section-header">
          <h2>How Hyv Works</h2>
          <p>Three simple steps to revolutionize your AI data pipeline</p>
        </div>
        <div className="steps-container">
          <div className="step">
            <div className="step-number">01</div>
            <div className="step-content">
              <h3>Generate</h3>
              <p>Use our on-chain AI models to create high-quality synthetic datasets tailored to your needs</p>
            </div>
            <div className="step-visual">
              <div className="generation-animation">
                <div className="input-prompt"></div>
                <div className="processing-dots">
                  <span></span><span></span><span></span>
                </div>
                <div className="output-data"></div>
              </div>
            </div>
          </div>
          <div className="step">
            <div className="step-number">02</div>
            <div className="step-content">
              <h3>Verify</h3>
              <p>All datasets are cryptographically verified and stored with immutable provenance on the blockchain</p>
            </div>
            <div className="step-visual">
              <div className="verification-animation">
                <div className="blockchain-blocks">
                  <div className="block"></div>
                  <div className="block"></div>
                  <div className="block"></div>
                </div>
                <div className="verification-check">✓</div>
              </div>
            </div>
          </div>
          <div className="step">
            <div className="step-number">03</div>
            <div className="step-content">
              <h3>Trade</h3>
              <p>Discover, license, and monetize datasets in our decentralized marketplace with token rewards</p>
            </div>
            <div className="step-visual">
              <div className="trading-animation">
                <div className="marketplace-grid">
                  <div className="market-item"></div>
                  <div className="market-item"></div>
                  <div className="market-item"></div>
                  <div className="market-item"></div>
                </div>
                <div className="token-reward">💎</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="stats-section">
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="stat-number">{stat.number}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Transform Your AI Data Pipeline?</h2>
          <p>Join the decentralized revolution and start generating verified synthetic datasets today</p>
          <button className="cta-button" onClick={onEnterApp}>
            <span>Launch Hyv Marketplace</span>
            <div className="cta-glow"></div>
          </button>
        </div>
        <div className="cta-background">
          <div className="gradient-orb orb-1"></div>
          <div className="gradient-orb orb-2"></div>
          <div className="gradient-orb orb-3"></div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-left">
            <div className="footer-logo">
              <span className="logo-text">Hyv</span>
            </div>
            <p>Decentralized synthetic data marketplace for trustworthy AI</p>
          </div>
          <div className="footer-links">
            <div className="link-group">
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#how-it-works">How It Works</a>
              <a href="#stats">Statistics</a>
            </div>
            <div className="link-group">
              <h4>Technology</h4>
              <a href="#">Internet Computer</a>
              <a href="#">Blockchain</a>
              <a href="#">AI Models</a>
            </div>
            <div className="link-group">
              <h4>Community</h4>
              <a href="#">Discord</a>
              <a href="#">Twitter</a>
              <a href="#">GitHub</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 Hyv. Built on Internet Computer Protocol.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
