import Debug "mo:base/Debug";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Array "mo:base/Array";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Blob "mo:base/Blob";
import Nat "mo:base/Nat";
import Nat32 "mo:base/Nat32";
import Principal "mo:base/Principal";
import Generator "canister:hyv_generator";
import Error "mo:base/Error"; // Add this import

actor HyvBackend = {
    
    // AI Engine canister reference (you'll need to update this with actual canister ID)
    let aiEngine = actor("uxrrr-q7777-77774-qaaaq-cai") : actor {
        generate_text: (Text) -> async Text;
        generate_code: (Text) -> async Text;
        generate_tabular: (Text) -> async Text;
        health: () -> async Text;
        get_loaded_models: () -> async [Text];
    };

  // Model marketplace types (moved from module to avoid non-static expression error)
  public type ModelFormat = { #ONNX; #PyTorch; #TensorFlow; #HuggingFace };
  public type Domain = { #Healthcare; #Finance; #Vision; #NLP; #Other };
  public type ModelType = { #Transformer; #CNN; #RNN; #DecisionTree; #Ensemble };

  public type ModelMetadata = {
    name: Text;
    format: ModelFormat;
    domain: Domain;
    modelType: ModelType;
    architecture: Text;
    parameters: Nat;
    performance: Text;
    description: Text;
  };

  public type PricingModel = { usageBased: Nat };
  public type RevenueShare = { creator: Nat; platform: Nat };
  
  public type ModelNFT = {
    id: Nat;
    owner: Principal;
    metadata: ModelMetadata;
    pricing: PricingModel;
    revenue: RevenueShare;
    fileChunks: [Blob];
    mintedAt: Int;
  };

  public type Dataset = {
    id: Nat;
    title: Text;
    description: Text;
    tags: [Text];
    uploader: Principal;
    fileHash: Text;
    uploadDate: Int;
    content: Text;
  };

  public type DatasetId = Nat;

  // Job queue types for off-chain AI generation
  public type JobId = Nat;
  public type JobStatus = { #Pending; #Running; #Completed; #Failed };

  public type GenerationJob = {
    id: JobId;
    owner: Principal;
    prompt: Text;
    config: Text; // JSON string for data_type, max_tokens, etc.
    status: JobStatus;
    createdAt: Int;
    datasetId: ?Nat; // Link to final dataset when completed
  };

  private stable var nextId: Nat = 0;
  private transient var datasets = HashMap.HashMap<DatasetId, Dataset>(0, Nat.equal, func(n: Nat) : Nat32 { Nat32.fromNat(n % (2**32)) });

  // Job queue stable state
  private stable var pendingJobs: [GenerationJob] = [];
  private stable var nextJobId: JobId = 0;

  // Define stable state for models
  private stable var models: [ModelNFT] = [];
  private stable var nextModelId: Nat = 0;

  // A private helper function to hash text using a simple hash.
  private func hashText(text: Text) : Text {
    let hash = Text.hash(text);
    return Nat32.toText(hash);
  };

  // Updated function to generate and store synthetic data with API key
  public func generateAndStoreDataset(prompt: Text, apiKey: Text) : async DatasetId {
    let response = await Generator.generateSyntheticData(prompt, apiKey);
    
    // Check if generation was successful
    if (Text.startsWith(response, #text "Error:")) {
        // For error cases, still store but mark as failed
        let title = "Failed Generation - " # Nat.toText(nextId);
        let description = "Generation failed for prompt: " # prompt;
        let tags = ["synthetic", "error", "failed"];
        let fileHash = hashText(response);
        
        return await uploadDataset(title, description, tags, fileHash, response);
    } else {
        let title = "Synthetic Dataset #" # Nat.toText(nextId);
        let description = "High-quality synthetic training data generated from: " # truncateText(prompt, 100) # "...";
        let tags = ["synthetic", "ai-generated", "training-data", "verified"];
        let fileHash = hashText(response);
        
        return await uploadDataset(title, description, tags, fileHash, response);
    };
  };

  // Public function to upload metadata for a new dataset
  public func uploadDataset(
    title: Text, 
    description: Text, 
    tags: [Text], 
    fileHash: Text, 
    content: Text
  ) : async DatasetId {
    // Fix: Get the caller using message context instead of Main
    let caller = Principal.fromActor(HyvBackend); // Use the actual actor name
    // OR use: let caller = Principal.anonymousIdentity(); // for testing
    let timestamp = Time.now();

    let new_dataset: Dataset = {
      id = nextId;
      title = title;
      description = description;
      tags = tags;
      uploader = caller;
      fileHash = fileHash;
      uploadDate = timestamp;
      content = content;
    };

    datasets.put(nextId, new_dataset);
    let createdId = nextId;
    nextId += 1;
    
    return createdId;
  };

  // Public query function to return all datasets
  public query func listDatasets() : async [Dataset] {
    let dataset_iterator = datasets.vals();
    return Iter.toArray(dataset_iterator);
  };

  // Get dataset by ID
  public query func getDataset(id: DatasetId) : async ?Dataset {
    datasets.get(id)
  };

  // --- Job Queue Functions for Off-Chain AI Generation ---

  // Submit a new generation job
  public func submitGenerationJob(prompt: Text, config: Text) : async JobId {
    let caller = Principal.fromActor(HyvBackend);
    let id = nextJobId;
    nextJobId += 1;

    let job: GenerationJob = {
      id;
      owner = caller;
      prompt;
      config;
      status = #Pending;
      createdAt = Time.now();
      datasetId = null;
    };

    pendingJobs := Array.append(pendingJobs, [job]);
    id
  };

  // List all pending jobs (for off-chain worker to poll)
  public query func listPendingJobs() : async [GenerationJob] {
    Array.filter<GenerationJob>(pendingJobs, func(j) { j.status != #Completed })
  };

  // Mark a job as completed and link to the generated dataset
  public func markJobComplete(jobId: JobId, datasetId: Nat) : async Bool {
    pendingJobs := Array.map<GenerationJob, GenerationJob>(pendingJobs, func(j) {
      if (j.id == jobId) {
        { j with status = #Completed; datasetId = ?datasetId }
      } else { j }
    });
    true
  };

  // Get job by ID
  public query func getJob(jobId: JobId) : async ?GenerationJob {
    Array.find<GenerationJob>(pendingJobs, func(j) { j.id == jobId })
  };

  public query func greet(name : Text) : async Text {
    return "Hello, " # name # "! Welcome to Hyv Synthetic Data Marketplace.";
  };

  // --- Model Marketplace Functions ---
  public query func listModels() : async [ModelNFT] {
    models
  };

  public func uploadModel(
    metadata: ModelMetadata,
    fileChunks: [Blob],
    pricing: PricingModel
  ) : async Nat {
    // Fix: Same issue here
    let caller = Principal.fromActor(HyvBackend);
    let revenue = { creator = 70; platform = 30 };
    let id = nextModelId;
    nextModelId += 1;
    let nft: ModelNFT = {
      id;
      owner = caller;
      metadata;
      pricing;
      revenue;
      fileChunks;
      mintedAt = Time.now();
    };
    models := Array.append(models, [nft]);
    return id;
  };

  public query func getModelNFT(id: Nat) : async ?ModelNFT {
    Array.find(models, func(m: ModelNFT) : Bool = m.id == id)
  };

  public query func searchModels(
    domain: ?Domain,
    modelType: ?ModelType,
    performance: ?Text
  ) : async [ModelNFT] {
    Array.filter(models, func(m: ModelNFT) : Bool =
      (switch(domain) { case null true; case (?d) m.metadata.domain == d }) and
      (switch(modelType) { case null true; case (?t) m.metadata.modelType == t }) and
      (switch(performance) { case null true; case (?p) Text.contains(m.metadata.performance, #text p) })
    )
  };

    // Add the truncateText helper function (if it doesn't exist)
    private func truncateText(text: Text, maxLength: Nat) : Text {
        if (Text.size(text) <= maxLength) {
            return text;
        };
        
        var result = "";
        var count = 0;
        
        for (char in Text.toIter(text)) {
            if (count >= maxLength) {
                return result;
            };
            result := result # Text.fromChar(char);
            count += 1;
        };
        
        result;
    };

    public func generateSyntheticData(prompt: Text, dataType: Text) : async Result.Result<Text, Text> {
        try {
            let result = switch (dataType) {
                case ("text") {
                    await aiEngine.generate_text(prompt)
                };
                case ("code") {
                    await aiEngine.generate_code(prompt)
                };
                case ("tabular") {
                    await aiEngine.generate_tabular(prompt)
                };
                case (_) {
                    return #err("Unsupported data type: " # dataType)
                };
            };
            #ok(result)
        } catch (error) {
            // Fix: Use Error.message instead of debug_show
            #err("AI Engine error: " # Error.message(error))
        }
    };

    public func testAiConnection() : async Result.Result<Text, Text> {
        try {
            let health = await aiEngine.health();
            let models = await aiEngine.get_loaded_models();
            #ok("AI Engine Status: " # health # "\nLoaded Models: " # debug_show(models))
        } catch (error) {
            // Fix: Use Error.message instead of debug_show
            #err("Failed to connect to AI Engine: " # Error.message(error))
        }
    };
}