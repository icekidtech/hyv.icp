import Time "mo:base/Time";
import Principal "mo:base/Principal";
import Trie "mo:base/Trie";
import Nat "mo:base/Nat";
import Array "mo:base/Array";

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

  // Public function to upload metadata for a new dataset
  public func uploadDataset(title: Text, description: Text, tags: [Text], fileHash: Text) : async DatasetId {
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

    (datasets, _) := Trie.put(datasets, nextId, Nat.equal, new_dataset);
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
