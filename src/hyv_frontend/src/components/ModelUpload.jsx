import React, { useState } from "react";
import { hyv_backend } from "declarations/hyv_backend";

export default function ModelUpload({ onUpload }) {
  const [file, setFile] = useState(null);
  const [metadata, setMetadata] = useState({
    name: "",
    format: "ONNX",
    domain: "Healthcare",
    modelType: "Transformer",
    architecture: "",
    parameters: "",
    performance: "",
    description: "",
  });
  const [error, setError] = useState("");
  const [cycleCost, setCycleCost] = useState(null);

  function handleFileChange(e) {
    const f = e.target.files[0];
    if (f && f.size > 50 * 1024 * 1024 * 1024) {
      setError("File exceeds 50GB limit. Please shard and upload.");
      setFile(null);
    } else {
      setFile(f);
      setError("");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) return setError("No file selected.");
    // TODO: Extract metadata automatically (stubbed)
    // TODO: Calculate cycle cost (stubbed)
    setCycleCost("~0.5T cycles (est.)");
    // Convert file to ArrayBuffer/Blob chunks
    const chunk = await file.arrayBuffer();
    // Call canister uploadModel
    const id = await hyv_backend.uploadModel(metadata, [chunk], { usageBased: 10 });
    onUpload(id);
  }

  return (
    <div className="card">
      <form onSubmit={handleSubmit}>
        <h2 className="card-title">Upload AI Model</h2>
        <input
          type="file"
          accept=".onnx,.pt,.pth,.pb,.h5,.bin"
          onChange={handleFileChange}
          className="form-control"
        />
        {/* Metadata fields */}
        <input
          type="text"
          placeholder="Model Name"
          value={metadata.name}
          onChange={e => setMetadata({ ...metadata, name: e.target.value })}
          required
          className="form-control"
        />
        {/* Format, Domain, Type dropdowns */}
        {/* ...other metadata fields... */}
        <button type="submit" className="btn btn-primary btn-full">Upload & Mint NFT</button>
        {error && <div className="error">{error}</div>}
        {cycleCost && <div className="cycle-cost">Cycle Cost: {cycleCost}</div>}
      </form>
    </div>
  );
}