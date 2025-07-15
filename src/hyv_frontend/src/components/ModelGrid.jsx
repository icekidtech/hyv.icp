import React from "react";

export default function ModelGrid({ models }) {
  return (
    <div className="model-grid" role="list">
      {models.map(model => (
        <div key={model.id} className="model-card" role="listitem" tabIndex={0}>
          <h3>{model.metadata.name}</h3>
          <p>Domain: {model.metadata.domain}</p>
          <p>Type: {model.metadata.modelType}</p>
          <p>Performance: {model.metadata.performance}</p>
          <p>Price: {model.pricing.usageBased} SAGE/use</p>
          {/* Community ratings, etc. */}
        </div>
      ))}
    </div>
  );
}