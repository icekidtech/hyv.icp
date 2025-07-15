import React, { useState, useEffect } from "react";
import { AuthClient } from "@dfinity/auth-client";
import { Actor, HttpAgent } from "@dfinity/agent";
import ModelUpload from "./components/ModelUpload";
import ModelGrid from "./components/ModelGrid";
import ModelSearch from "./components/ModelSearch";
import { hyv_backend } from "declarations/hyv_backend";

// Placeholder factories if you haven't deployed yet
const backendIdl = ({ IDL }) => IDL.Service({});
const backendCanisterId = process.env.CANISTER_ID_HYV_BACKEND;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authClient, setAuthClient] = useState(null);
  const [identity, setIdentity] = useState(null);
  const [backendActor, setBackendActor] = useState(null);

  const [datasets, setDatasets] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);

  const [models, setModels] = useState([]);
  const [searchParams, setSearchParams] = useState({});

  // Authentication
  useEffect(() => {
    AuthClient.create().then(async (client) => {
      setAuthClient(client);
      const authenticated = await client.isAuthenticated();
      setIsAuthenticated(authenticated);
      if (authenticated) {
        handleAuthenticated(client);
      }
    });
  }, []);

  const handleAuthenticated = (client) => {
    const user_identity = client.getIdentity();
    setIdentity(user_identity);
    setIsAuthenticated(true);

    const agent = new HttpAgent({ identity: user_identity, host: "http://127.0.0.1:8080/" });
    const actor = Actor.createActor(backendIdl, { agent, canisterId: backendCanisterId });
    setBackendActor(actor);
  };

  const handleLogin = async () => {
    await authClient.login({
      identityProvider: "https://identity.ic0.app/#authorize",
      onSuccess: () => handleAuthenticated(authClient),
    });
  };

  const handleLogout = async () => {
    await authClient.logout();
    setIsAuthenticated(false);
    setIdentity(null);
    setBackendActor(null);
  };

  const fetchDatasets = async () => {
    if (!backendActor) return;
    setLoading(true);
    try {
      const result = await backendActor.listDatasets();
      setDatasets(result);
    } catch (error) {
      console.error("Failed to fetch datasets:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (backendActor) fetchDatasets();
  }, [backendActor]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!backendActor || !prompt || !apiKey) {
      alert("Please enter a prompt and your OpenAI API key.");
      return;
    }
    setLoading(true);
    try {
      const newDatasetId = await backendActor.generateAndStoreDataset(prompt, apiKey);
      alert(`Successfully generated and stored dataset with ID: ${newDatasetId}`);
      setPrompt("");
      setApiKey("");
      fetchDatasets();
    } catch (error) {
      console.error("Generation failed:", error);
      alert("Generation failed. See console for details.");
    }
    setLoading(false);
  };

  // Model-related logic
  useEffect(() => {
    hyv_backend.listModels().then(setModels);
  }, []);

  async function handleSearch(params) {
    const results = await hyv_backend.searchModels(params.domain, params.modelType, params.performance);
    setModels(results);
  }

  async function handleUpload(id) {
    const model = await hyv_backend.getModelNFT(id);
    setModels((prev) => [...prev, model]);
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      <div className="container mx-auto p-8">
        <header className="flex justify-between items-center mb-12 pb-4 border-b-2 border-hyv-medium-green">
          <h1 className="text-4xl font-bold text-hyv-dark-green">Hyv Marketplace</h1>
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <p className="text-sm text-hyv-gray">Principal: {identity?.getPrincipal().toText().slice(0, 15)}...</p>
              <button onClick={handleLogout} className="bg-hyv-gray hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">
                Logout
              </button>
            </div>
          ) : (
            <button onClick={handleLogin} className="bg-hyv-medium-green hover:bg-hyv-light-green hover:text-hyv-dark-green text-white font-bold py-2 px-4 rounded">
              Login with Internet Identity
            </button>
          )}
        </header>

        {!isAuthenticated ? (
          <div className="text-center p-10 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-hyv-dark-green">Welcome to Hyv</h2>
            <p className="mt-2 text-hyv-gray">Please log in to generate, upload, and view synthetic datasets.</p>
          </div>
        ) : (
          <main className="grid md:grid-cols-2 gap-12">
            {/* Left Column */}
            <div className="flex flex-col gap-8">
              {/* Generate Dataset */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-hyv-medium-green mb-4">🧠 Generate Synthetic Data</h2>
                <form onSubmit={handleGenerate}>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Enter your data generation prompt..."
                    className="w-full p-2 border rounded mb-4 h-24"
                    disabled={loading}
                  />
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your OpenAI API Key (for MVP demo)"
                    className="w-full p-2 border rounded mb-4"
                    disabled={loading}
                  />
                  <button type="submit" disabled={loading} className="w-full bg-hyv-medium-green hover:bg-hyv-light-green hover:text-hyv-dark-green text-white font-bold py-2 px-4 rounded">
                    {loading ? "Generating..." : "Generate & Store"}
                  </button>
                </form>
              </div>

              {/* Upload Model */}
              <ModelUpload onUpload={handleUpload} />
            </div>

            {/* Right Column */}
            <div className="flex flex-col gap-8">
              {/* Dataset List */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-hyv-medium-green">🏪 Marketplace Datasets</h2>
                  <button onClick={fetchDatasets} disabled={loading} className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 py-1 px-3 rounded">
                    {loading ? "Refreshing..." : "Refresh"}
                  </button>
                </div>
                <ul className="space-y-4">
                  {datasets.length > 0 ? (
                    datasets.map((dataset) => (
                      <li key={Number(dataset.id)} className="border-l-4 border-hyv-light-green bg-gray-50 p-4 rounded">
                        <h3 className="font-bold text-lg text-hyv-dark-green">{dataset.title}</h3>
                        <p className="text-sm text-gray-600 my-1">{dataset.description}</p>
                        <p className="text-xs text-hyv-gray">Tags: {dataset.tags.join(", ")}</p>
                        <p className="text-xs text-gray-500 mt-2 font-mono break-all">Hash: {dataset.fileHash}</p>
                      </li>
                    ))
                  ) : (
                    <p className="text-hyv-gray">No datasets found. Generate one to get started!</p>
                  )}
                </ul>
              </div>

              {/* Model Search and Grid */}
              <ModelSearch onSearch={handleSearch} />
              <ModelGrid models={models} />
            </div>
          </main>
        )}
      </div>
    </div>
  );
}

export default App;
