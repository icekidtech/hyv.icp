import React, { useState } from "react";

export default function ModelSearch({ onSearch }) {
  const [domain, setDomain] = useState("");
  const [modelType, setModelType] = useState("");
  const [performance, setPerformance] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    onSearch({ domain, modelType, performance });
  }

  return (
    <div className="card">
      <h2 className="card-title">🔍 Search Models</h2>
      <form onSubmit={handleSubmit} aria-label="Search AI Models">
        <select
          value={domain}
          onChange={e => setDomain(e.target.value)}
          className="form-control"
        >
          <option value="">Any Domain</option>
          <option value="Healthcare">Healthcare</option>
          <option value="Finance">Finance</option>
          {/* ... */}
        </select>
        <select
          value={modelType}
          onChange={e => setModelType(e.target.value)}
          className="form-control"
        >
          <option value="">Any Type</option>
          <option value="Transformer">Transformer</option>
          <option value="CNN">CNN</option>
          {/* ... */}
        </select>
        <input
          type="text"
          placeholder="Performance (e.g. accuracy > 0.9)"
          value={performance}
          onChange={e => setPerformance(e.target.value)}
          className="form-control"
        />
        <button type="submit" className="btn btn-primary btn-full">Search</button>
      </form>
    </div>
  );
}