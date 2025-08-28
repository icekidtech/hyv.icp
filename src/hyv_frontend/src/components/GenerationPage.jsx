import React, { useState } from 'react';

function GenerationPage({
  prompt,
  setPrompt,
  onGenerate,
  loading,
  currentJob,
  jobStatus,
  onCancelJob,
  jobs,
  onRefreshJobs,
  onViewDataset,
  backendActor,
  isAuthenticated,
  onLogin
}) {
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [advancedConfig, setAdvancedConfig] = useState(false);

  // Generation templates
  const templates = [
    {
      id: 'customer-reviews',
      title: 'Customer Reviews',
      description: 'Generate realistic customer reviews with ratings and sentiment',
      example: 'Generate 50 customer reviews for a coffee shop with ratings from 1-5 stars and detailed feedback about service, ambiance, and food quality.'
    },
    {
      id: 'product-descriptions',
      title: 'Product Descriptions',
      description: 'Create compelling product descriptions for e-commerce',
      example: 'Generate 25 detailed product descriptions for various electronic gadgets including smartphones, laptops, and accessories with features, specifications, and benefits.'
    },
    {
      id: 'social-media-posts',
      title: 'Social Media Posts',
      description: 'Generate engaging social media content and captions',
      example: 'Create 30 Instagram post captions and descriptions for a fitness brand promoting healthy lifestyle, workout routines, and nutrition tips.'
    },
    {
      id: 'faq-content',
      title: 'FAQ Content',
      description: 'Generate frequently asked questions and answers',
      example: 'Generate 40 FAQ entries for a software company covering topics like pricing, features, technical support, and account management.'
    },
    {
      id: 'blog-posts',
      title: 'Blog Posts',
      description: 'Create informative blog post content and outlines',
      example: 'Generate 10 blog post outlines and content samples about digital marketing trends, SEO strategies, and content creation tips.'
    },
    {
      id: 'email-campaigns',
      title: 'Email Campaigns',
      description: 'Generate email marketing content and sequences',
      example: 'Create 15 email campaign templates for a subscription box service including welcome series, product announcements, and re-engagement emails.'
    }
  ];

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template.id);
    setPrompt(template.example);
  };

  const handleGenerate = async (e) => {
    if (!isAuthenticated) {
      onLogin();
      return;
    }
    onGenerate(e);
  };

  return (
    <div className="generation-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-section">
          <h1 className="page-title">
            <span className="gradient-text">🤖 AI Data Generation</span>
          </h1>
          <p className="page-subtitle">
            Create high-quality synthetic datasets using advanced AI models
          </p>
        </div>
        <div className="page-stats">
          <div className="stat-item">
            <span className="stat-number">{jobs.length}</span>
            <span className="stat-label">Active Jobs</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">
              {jobs.filter(job => Object.keys(job.status)[0] === 'Completed').length}
            </span>
            <span className="stat-label">Completed</span>
          </div>
        </div>
      </div>

      <div className="generation-content">
        {/* Generation Form */}
        <div className="generation-form-section">
          <div className="form-card">
            <div className="form-header">
              <div className="form-icon">🚀</div>
              <div className="form-title-section">
                <h2>Submit Generation Job</h2>
                <p>Describe your data requirements and let AI do the work</p>
              </div>
            </div>

            <div className="form-content">
              {/* Template Selection */}
              <div className="form-group">
                <label>Quick Templates (Optional)</label>
                <div className="templates-grid">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className={`template-card ${selectedTemplate === template.id ? 'selected' : ''}`}
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <div className="template-header">
                        <h4>{template.title}</h4>
                        {selectedTemplate === template.id && <span className="selected-indicator">✓</span>}
                      </div>
                      <p className="template-description">{template.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Prompt Input */}
              <div className="form-group">
                <label htmlFor="generation-prompt">
                  Data Generation Prompt <span className="required">*</span>
                </label>
                <textarea
                  id="generation-prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the type of data you want to generate. Be specific about format, quantity, and any particular characteristics..."
                  className="textarea modern-input"
                  rows={6}
                  required
                />
                <div className="form-help">
                  <div className="help-icon">💡</div>
                  <div className="help-text">
                    <strong>Tips for better results:</strong>
                    <ul>
                      <li>Specify the exact number of items you need</li>
                      <li>Describe the format (JSON, CSV, text, etc.)</li>
                      <li>Include any specific fields or categories</li>
                      <li>Mention the domain or industry context</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Advanced Configuration Toggle */}
              <div className="form-group">
                <button
                  type="button"
                  className="btn btn-link advanced-toggle"
                  onClick={() => setAdvancedConfig(!advancedConfig)}
                >
                  {advancedConfig ? '▼' : '▶'} Advanced Configuration
                </button>
              </div>

              {/* Advanced Configuration Panel */}
              {advancedConfig && (
                <div className="advanced-config-panel">
                  <div className="config-grid">
                    <div className="config-item">
                      <label>Model Type</label>
                      <select className="config-select" defaultValue="gpt-3.5-turbo">
                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Fast)</option>
                        <option value="gpt-4">GPT-4 (High Quality)</option>
                        <option value="claude-3">Claude 3 (Balanced)</option>
                      </select>
                    </div>
                    <div className="config-item">
                      <label>Temperature</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        defaultValue="0.7"
                        className="config-slider"
                      />
                      <span className="config-value">0.7</span>
                    </div>
                    <div className="config-item">
                      <label>Max Tokens</label>
                      <input
                        type="number"
                        min="100"
                        max="4000"
                        defaultValue="1000"
                        className="config-input"
                      />
                    </div>
                    <div className="config-item">
                      <label>Data Format</label>
                      <select className="config-select" defaultValue="text">
                        <option value="text">Plain Text</option>
                        <option value="json">JSON</option>
                        <option value="csv">CSV</option>
                        <option value="xml">XML</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="form-actions">
                <button
                  onClick={handleGenerate}
                  disabled={loading || !prompt.trim() || jobStatus === "polling"}
                  className="btn btn-primary btn-generate-large"
                >
                  {loading ? (
                    <>
                      <div className="loading-spinner"></div>
                      <span>Submitting Job...</span>
                    </>
                  ) : jobStatus === "polling" ? (
                    <>
                      <div className="loading-spinner"></div>
                      <span>Processing...</span>
                    </>
                  ) : !isAuthenticated ? (
                    <>
                      <span>🔐 Login to Generate</span>
                    </>
                  ) : (
                    <>
                      <span>🚀 Start Generation</span>
                      <div className="btn-glow"></div>
                    </>
                  )}
                </button>

                {!isAuthenticated && (
                  <p className="auth-notice">
                    You need to login with Internet Identity to submit generation jobs.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Current Job Status */}
        {currentJob && (
          <div className="current-job-section">
            <div className="status-card">
              <div className="status-header">
                <div className="status-icon">
                  {jobStatus === "submitting" && "📤"}
                  {jobStatus === "polling" && "⏳"}
                  {jobStatus === "completed" && "✅"}
                  {jobStatus === "failed" && "❌"}
                </div>
                <div className="status-title-section">
                  <h3>Current Job Status</h3>
                  <p>Job #{currentJob.id}</p>
                </div>
                {jobStatus === "polling" && (
                  <button
                    onClick={onCancelJob}
                    className="btn btn-small btn-danger"
                  >
                    Cancel
                  </button>
                )}
              </div>

              <div className="status-content">
                <div className="job-progress">
                  <div className="progress-bar">
                    <div
                      className={`progress-fill status-${jobStatus}`}
                      style={{
                        width: jobStatus === "submitting" ? "25%" :
                               jobStatus === "polling" ? "50%" :
                               jobStatus === "completed" ? "100%" : "0%"
                      }}
                    ></div>
                  </div>
                  <div className="progress-text">
                    {jobStatus === "submitting" && "Submitting job to AI worker..."}
                    {jobStatus === "polling" && "AI worker is processing your request..."}
                    {jobStatus === "completed" && "Job completed successfully!"}
                    {jobStatus === "failed" && "Job failed to complete"}
                  </div>
                </div>

                <div className="job-details">
                  <div className="detail-item">
                    <strong>Status:</strong>
                    <span className={`status-badge status-${jobStatus}`}>
                      {jobStatus === "submitting" && "Submitting"}
                      {jobStatus === "polling" && "Processing"}
                      {jobStatus === "completed" && "Completed"}
                      {jobStatus === "failed" && "Failed"}
                    </span>
                  </div>
                  <div className="detail-item">
                    <strong>Created:</strong>
                    <span>{new Date(currentJob.createdAt).toLocaleString()}</span>
                  </div>
                  {currentJob.updatedAt && currentJob.updatedAt !== currentJob.createdAt && (
                    <div className="detail-item">
                      <strong>Last Updated:</strong>
                      <span>{new Date(currentJob.updatedAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>

                <div className="job-prompt-preview">
                  <strong>Prompt:</strong>
                  <p className="prompt-text">
                    {currentJob.prompt.length > 200
                      ? currentJob.prompt.substring(0, 200) + '...'
                      : currentJob.prompt}
                  </p>
                </div>

                {currentJob.error && (
                  <div className="job-error-display">
                    <strong>❌ Error:</strong>
                    <p className="error-text">{currentJob.error}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Jobs History */}
        <div className="jobs-history-section">
          <div className="section-header">
            <div className="section-title">
              <h2>Generation History</h2>
              <p>Track all your AI generation jobs</p>
            </div>
            <button
              onClick={onRefreshJobs}
              disabled={loading}
              className="btn btn-secondary refresh-btn"
            >
              {loading ? (
                <>
                  <div className="loading-spinner small"></div>
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <span>🔄 Refresh</span>
                </>
              )}
            </button>
          </div>

          <div className="jobs-list">
            {jobs.length > 0 ? (
              jobs.map((job) => {
                const statusKey = Object.keys(job.status)[0];
                const isCompleted = statusKey === "Completed";
                const isFailed = statusKey === "Failed";
                const isRunning = statusKey === "Running";
                const isPending = statusKey === "Pending";

                return (
                  <div key={Number(job.id)} className="job-card history-card">
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
                      <div className="job-date">
                        {new Date(Number(job.createdAt)).toLocaleString()}
                      </div>
                    </div>

                    <div className="job-content">
                      <p className="job-prompt">
                        <strong>Prompt:</strong> {job.prompt.length > 150
                          ? job.prompt.substring(0, 150) + '...'
                          : job.prompt}
                      </p>

                      <div className="job-meta">
                        <div className="meta-item">
                          <span className="meta-icon">⚙️</span>
                          <span className="meta-text">
                            {JSON.parse(job.config).data_type || 'text'}
                          </span>
                        </div>
                        {job.datasetId && job.datasetId.length > 0 && (
                          <div className="meta-item">
                            <span className="meta-icon">📊</span>
                            <span className="meta-text">
                              Dataset #{Number(job.datasetId[0])}
                            </span>
                          </div>
                        )}
                      </div>

                      {isFailed && job.status.Failed && (
                        <div className="job-error-details">
                          <strong>❌ Error:</strong> {job.status.Failed}
                        </div>
                      )}
                    </div>

                    <div className="job-actions">
                      {isCompleted && job.datasetId && job.datasetId.length > 0 && (
                        <button
                          className="btn btn-small btn-primary"
                          onClick={async () => {
                            try {
                              const dataset = await backendActor.getDataset(Number(job.datasetId[0]));
                              if (dataset && dataset.length > 0) {
                                onViewDataset(dataset[0]);
                              }
                            } catch (error) {
                              console.error("Error fetching dataset:", error);
                            }
                          }}
                        >
                          👁️ View Dataset
                        </button>
                      )}
                      {isCompleted && (
                        <button
                          className="btn btn-small btn-secondary"
                          onClick={() => {
                            // Copy prompt to current input
                            setPrompt(job.prompt);
                            setSelectedTemplate('');
                          }}
                        >
                          📝 Use Prompt
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-state">
                <div className="empty-icon">⚙️</div>
                <h3>No generation jobs yet</h3>
                <p>Submit your first AI generation job to get started!</p>
                <div className="empty-actions">
                  <button
                    className="btn btn-primary"
                    onClick={() => document.querySelector('#generation-prompt')?.focus()}
                  >
                    🚀 Create Job
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default GenerationPage;
