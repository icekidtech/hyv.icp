import Nat "mo:base/Nat";
import Text "mo:base/Text";
import Principal "mo:base/Principal";
import Blob "mo:base/Blob";

type ModelFormat = { #ONNX; #PyTorch; #TensorFlow; #HuggingFace };
type Domain = { #Healthcare; #Finance; #Vision; #NLP; #Other };
type ModelType = { #Transformer; #CNN; #RNN; #DecisionTree; #Ensemble };

type ModelMetadata = {
  name: Text;
  format: ModelFormat;
  domain: Domain;
  modelType: ModelType;
  architecture: Text;
  parameters: Nat;
  performance: Text; // e.g., "accuracy: 0.92, latency: 50ms"
  description: Text;
};

type PricingModel = { usageBased: Nat }; // price per call in SAGE tokens

type RevenueShare = { creator: Nat; platform: Nat }; // e.g., 70/30

type ModelNFT = {
  id: Nat;
  owner: Principal;
  metadata: ModelMetadata;
  pricing: PricingModel;
  revenue: RevenueShare;
  fileChunks: [Blob]; // Sharded model storage
  mintedAt: Nat;
};

stable var models: [ModelNFT] = [];
stable var nextId: Nat = 0;

// Upload model (sharding if >50GB, here simplified)
public func uploadModel(
  metadata: ModelMetadata,
  fileChunks: [Blob],
  pricing: PricingModel
) : async Nat {
  let caller = Principal.fromActor(this);
  let revenue = { creator = 70; platform = 30 };
  let id = nextId;
  nextId += 1;
  let nft: ModelNFT = {
    id;
    owner = caller;
    metadata;
    pricing;
    revenue;
    fileChunks;
    mintedAt = Nat.now();
  };
  models := Array.append(models, [nft]);
  return id;
};

// Mint NFT for uploaded model
public query func getModelNFT(id: Nat) : async ?ModelNFT {
  models.find(func(m) = m.id == id)
};

// Search models by domain, type, or performance metric
public query func searchModels(
  ?domain: ?Domain,
  ?modelType: ?ModelType,
  ?performance: ?Text
) : async [ModelNFT] {
  models.filter(func(m) =
    (switch(domain) { case null true; case (?d) m.metadata.domain == d }) and
    (switch(modelType) { case null true; case (?t) m.metadata.modelType == t }) and
    (switch(performance) { case null true; case (?p) Text.contains(m.metadata.performance, p) })
  )
};

// List all models
public query func listModels() : async [ModelNFT] {
  models
};

// Placeholder: SAGE token logic, cycles, Internet Identity integration
// These would use ICP ledger and cycles APIs in full implementation