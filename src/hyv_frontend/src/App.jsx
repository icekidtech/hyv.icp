import React, { useState, useEffect } from "react";
import ModelUpload from "./components/ModelUpload";
import ModelGrid from "./components/ModelGrid";
import ModelSearch from "./components/ModelSearch";
import { hyv_backend } from "declarations/hyv_backend";

function App() {
  const [models, setModels] = useState([]);
  const [searchParams, setSearchParams] = useState({});

  useEffect(() => {
    hyv_backend.listModels().then(setModels);
  }, []);

  async function handleSearch(params) {
    const results = await hyv_backend.searchModels(params.domain, params.modelType, params.performance);
    setModels(results);
  }

  async function handleUpload(id) {
    const model = await hyv_backend.getModelNFT(id);
    setModels(models => [...models, model]);
  }

  return (
    <main>
      <ModelUpload onUpload={handleUpload} />
      <ModelSearch onSearch={handleSearch} />
      <ModelGrid models={models} />
    </main>
  );
}

export default App;
