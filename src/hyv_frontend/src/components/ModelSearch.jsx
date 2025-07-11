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
    <form onSubmit={handleSubmit} aria-label="Search AI Models">
      <select value={domain} onChange={e => setDomain(e.target.value)}>
        <option value="">Any Domain</option>
        <option value="Healthcare">Healthcare</option>
        <option value="Finance">Finance</option>
        {/* ... */}
      </select>
      <select value={modelType} onChange={e => setModelType(e.target.value)}>
        <option value="">Any Type</option>
        <option value="Transformer">Transformer</option>
        <option value="CNN">CNN</option>
        {/* ... */}
      </select>
      <input type="text" placeholder="Performance (e.g. accuracy > 0.9)" value={performance}
        onChange={e => setPerformance(e.target.value)} />
      <button type="submit">Search</button>
    </form>
  );
}