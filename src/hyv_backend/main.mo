import Time "mo:base/Time";
import Principal "mo:base/Principal";
import Map "mo:base/HashMap";
import Nat "mo:base/Nat";
import Nat32 "mo:base/Nat32";
import Text "mo:base/Text";
import Iter "mo:base/Iter";
import Blob "mo:base/Blob";
import Array "mo:base/Array";
import Generator "canister:hyv_generator";

actor Main {
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

  private stable var nextId: Nat = 0;
  private var datasets = Map.HashMap<DatasetId, Dataset>(0, Nat.equal, func(n: Nat) : Nat32 { Nat32.fromNat(n % (2**32)) });

  // Define stable state for models
  private stable var models: [ModelNFT] = [];
  private stable var nextModelId: Nat = 0;

  // Define the public interface (actor type) for the generator canister.
  type Generator = actor {
    generateSyntheticData: (prompt: Text, apiKey: Text) -> async Text;
    generateText: (prompt: Text) -> async Text;
  };

  // A private helper function to hash text using a simple hash.
  private func hashText(text: Text) : Text {
    let hash = Text.hash(text);
    return Nat32.toText(hash);
  };

  // Helper function to get the generator actor
  private func getGeneratorActor() : async Generator.Generator {
    return Generator;
  };
  
  // Updated function to generate and store synthetic data with API key
  public func generateAndStoreDataset(prompt: Text, apiKey: Text) : async DatasetId {
    let generator = await getGeneratorActor();
    let response = await generator.generateSyntheticData(prompt, apiKey);
    
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
    let caller = Principal.fromActor(Main);
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
    let caller = Principal.fromActor(Main);
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
}