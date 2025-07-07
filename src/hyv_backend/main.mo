import Time "mo:base/Time";
import Principal "mo:base/Principal";

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

  public query func greet(name : Text) : async Text {
    return "Hello, " # name # "!";
  };
};
