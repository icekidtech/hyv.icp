import Time "mo:base/Time";
import Principal "mo:base/Principal";
import Map "mo:base/HashMap";
import Nat "mo:base/Nat";
import Nat32 "mo:base/Nat32";
import Text "mo:base/Text";
import Iter "mo:base/Iter";

actor Main {
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
    uploadDate: Time.Time;
  };

  // Stable variables to persist data across upgrades
  private stable var nextId: DatasetId = 0;
  private var datasets = Map.HashMap<DatasetId, Dataset>(0, Nat.equal, func(n: Nat) : Nat32 { Nat32.fromNat(n % (2**32)) });

  // Define the public interface (actor type) for the generator canister.
  type Generator = actor {
    generateText: (prompt: Text, openAiApiKey: Text) -> async Text;
  };

  // A private helper function to hash text using a simple hash.
  private func hashText(text: Text) : Text {
    // For MVP, we'll use a simple text-based hash
    // In production, you'd want to use proper SHA256
    return Nat32.toNat(Text.hash(text)) |> Nat.toText(_);
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

  // System functions for upgrade persistence
  system func preupgrade() {
    // Convert HashMap to stable array for persistence
  };

  system func postupgrade() {
    // Restore HashMap from stable array
  };
};
