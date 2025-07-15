import Time "mo:base/Time";
import Principal "mo:base/Principal";
import Trie "mo:base/Trie";
import Nat "mo:base/Nat";
import Array "mo:base/Array";
import Text "mo:base/Text";
import Blob "mo:base/Blob";
import Hash "mo:base/Hash";

actor {
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
  stable var nextId: DatasetId = 0;
  stable var datasets: Trie.Trie<DatasetId, Dataset> = Trie.empty();

  // --- New Code Below ---

  // 1. Define the public interface (actor type) for the generator canister.
  // This tells our backend what functions the generator has.
  type Generator = actor {
    generateText: (prompt: Text, openAiApiKey: Text) -> async Text;
  };

  // 2. Create an actor instance that points to our deployed hyv_generator canister.
  // The text principal will be replaced by the actual canister ID during deployment.
  let generator_canister_id = Principal.fromText("$(HYV_GENERATOR_CANISTER_ID)");
  let generator: Generator = actor(generator_canister_id);

  // 3. A private helper function to hash text using SHA256.
  private func hashText(text: Text) : Text {
    let blob = Blob.fromArray(Text.encodeUtf8(text));
    let hash_blob = Hash.sha256(blob);
    // NOTE: This is a raw text representation of the hash, not standard hex encoding.
    // It is sufficient for verification within the MVP.
    return Text.fromBlob(hash_blob);
  };

  // 4. A new public function to orchestrate the AI generation and storage.
  public func generateAndStoreDataset(prompt: Text, apiKey: Text) : async DatasetId {
    // Step A: Call the generator canister to get the synthetic text.
    let generated_text = await generator.generateText(prompt, apiKey);

    // Step B: Hash the generated text for verification.
    let generated_hash = hashText(generated_text);

    // Step C: Create metadata for the new dataset.
    let title = "AI Generated: " # prompt;
    let description = "This dataset was generated from a prompt using the Hyv AI Generator.";
    let tags = ["generated", "ai-synthetic"];

    // Step D: Call our existing uploadDataset function to save the new dataset.
    // Note: The generated text itself isn't stored on-chain in this model, only its hash.
    return await uploadDataset(title, description, tags, generated_hash);
  };

  // Public function to upload metadata for a new dataset
  public func uploadDataset(title: Text, description: Text, tags: [Text], fileHash: Text) : async DatasetId {
    let caller = actor.caller();
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

    datasets := Trie.put(datasets, nextId, new_dataset);
    let createdId = nextId;
    nextId += 1;
    
    return createdId;
  };

  // Public query function to return all datasets
  public query func listDatasets() : async [Dataset] {
    let dataset_iterator = Trie.vals(datasets);
    return Array.fromIter(dataset_iterator);
  };

  public query func greet(name : Text) : async Text {
    return "Hello, " # name # "!";
  };
};
