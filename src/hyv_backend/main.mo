import Time "mo:base/Time";
import Principal "mo:base/Principal";
import Map "mo:base/HashMap";
import Nat "mo:base/Nat";
import Nat32 "mo:base/Nat32";
import Text "mo:base/Text";
import Iter "mo:base/Iter";
import Blob "mo:base/Blob";
import Array "mo:base/Array";
import Option "mo:base/Option";

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

  // The unique identifier for a dataset
  type DatasetId = Nat;

  // The main data structure for a dataset
  type Dataset = {
    id: DatasetId;
    title: Text;
    description: Text;
    tags: [Text];
    uploader: Principal;
    fileHash: Text; // SHA256 hash of the data
    uploadDate: Int;
  };

  // Stable variables to persist data across upgrades
  private stable var nextId: DatasetId = 0;
  private stable var datasetsEntries: [(DatasetId, Dataset)] = [];
  private var datasets = Map.HashMap<DatasetId, Dataset>(0, Nat.equal, func(n: Nat) : Nat32 { Nat32.fromNat(n % (2**32)) });

  // Define stable state for models
  private stable var models: [ModelNFT] = [];
  private stable var nextModelId: Nat = 0;

  // Define the public interface (actor type) for the generator canister.
  type Generator = actor {
    generateText: (prompt: Text, openAiApiKey: Text) -> async Text;
  };

  // A private helper function to hash text using a simple hash.
  private func hashText(text: Text) : Text {
    // For MVP, we'll use a simple text-based hash
    // In production, you'd want to use proper SHA256
    let hash = Text.hash(text);
    return Nat32.toText(hash);
  };

  // A new public function to orchestrate the AI generation and storage.
  public func generateAndStoreDataset(prompt: Text, apiKey: Text) : async DatasetId {
    // For MVP, we'll create a generator reference dynamically
    // In production, this would be a fixed canister ID
    try {
      let generator: Generator = actor("rdmx6-jaaaa-aaaah-qdrqq-cai"); // Placeholder ID
      
      // Step A: Call the generator canister to get the synthetic text.
      let generated_text = await generator.generateText(prompt, apiKey);

      // Step B: Hash the generated text for verification.
      let generated_hash = hashText(generated_text);

      // Step C: Create metadata for the new dataset.
      let title = "AI Generated: " # prompt;
      let description = "This dataset was generated from a prompt using the Hyv AI Generator.";
      let tags = ["generated", "ai-synthetic"];

      // Step D: Call our existing uploadDataset function to save the new dataset.
      return await uploadDataset(title, description, tags, generated_hash);
    } catch (_) {
      // For MVP, create a mock dataset if generator fails
      let mock_hash = hashText("Generated from: " # prompt);
      let title = "AI Generated: " # prompt;
      let description = "Mock dataset generated from prompt.";
      let tags = ["generated", "mock"];
      return await uploadDataset(title, description, tags, mock_hash);
    };
  };

  // Public function to upload metadata for a new dataset
  public func uploadDataset(title: Text, description: Text, tags: [Text], fileHash: Text) : async DatasetId {
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

  public query func greet(name : Text) : async Text {
    return "Hello, " # name # "!";
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
    Array.find<ModelNFT>(models, func(m) = m.id == id)
  };

  public query func searchModels(
    domain: ?Domain,
    modelType: ?ModelType,
    performance: ?Text
  ) : async [ModelNFT] {
    Array.filter<ModelNFT>(models, func(m) {
      let domainMatch = switch (domain) {
        case null { true };
        case (?d) { m.metadata.domain == d };
      };
      
      let typeMatch = switch (modelType) {
        case null { true };
        case (?t) { m.metadata.modelType == t };
      };
      
      let performanceMatch = switch (performance) {
        case null { true };
        case (?p) { Text.contains(m.metadata.performance, #text p) };
      };
      
      domainMatch and typeMatch and performanceMatch
    })
  };

  // System functions for upgrade persistence
  system func preupgrade() {
    // Convert HashMap to stable array for persistence
    datasetsEntries := Iter.toArray(datasets.entries());
  };

  system func postupgrade() {
    // Restore HashMap from stable array
    datasets := Map.fromIter<DatasetId, Dataset>(datasetsEntries.vals(), datasetsEntries.size(), Nat.equal, func(n: Nat) : Nat32 { Nat32.fromNat(n % (2**32)) });
    datasetsEntries := [];
  };
}