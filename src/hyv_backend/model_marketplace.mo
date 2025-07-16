import Nat "mo:base/Nat";
import Text "mo:base/Text";
import Principal "mo:base/Principal";
import Blob "mo:base/Blob";
import Array "mo:base/Array";
import Option "mo:base/Option";
import Time "mo:base/Time";

actor ModelNFTMarketplace {
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

  // Stable variables for persistence across upgrades
  private stable var models: [ModelNFT] = [];
  private stable var nextId: Nat = 0;

  public func uploadModel(
    metadata: ModelMetadata,
    fileChunks: [Blob],
    pricing: PricingModel
  ) : async Nat {
    let caller = Principal.fromActor(ModelNFTMarketplace);
    let newModel: ModelNFT = {
      id = nextId;
      owner = caller;
      metadata = metadata;
      pricing = pricing;
      revenue = { creator = 80; platform = 20 }; // Default revenue split
      fileChunks = fileChunks;
      mintedAt = Time.now();
    };
    
    models := Array.append(models, [newModel]);
    nextId += 1;
    nextId - 1
  };

  public query func getModelNFT(id: Nat) : async ?ModelNFT {
    Array.find<ModelNFT>(models, func(model) = model.id == id)
  };

  public query func searchModels(
    domain: ?Domain,
    modelType: ?ModelType,
    performance: ?Text
  ) : async [ModelNFT] {
    Array.filter<ModelNFT>(models, func(model) {
      let domainMatch = switch (domain) {
        case null { true };
        case (?d) { model.metadata.domain == d };
      };
      
      let typeMatch = switch (modelType) {
        case null { true };
        case (?t) { model.metadata.modelType == t };
      };
      
      let performanceMatch = switch (performance) {
        case null { true };
        case (?p) { Text.contains(model.metadata.performance, #text p) };
      };
      
      domainMatch and typeMatch and performanceMatch
    })
  };

  public query func listModels() : async [ModelNFT] {
    models
  };

  public query func getTotalModels() : async Nat {
    models.size()
  };

  public func transferModel(id: Nat, newOwner: Principal) : async Bool {
    let caller = Principal.fromActor(ModelNFTMarketplace);
    
    switch (Array.find<ModelNFT>(models, func(model) = model.id == id)) {
      case null { false };
      case (?model) {
        if (model.owner == caller) {
          let updatedModel = {
            id = model.id;
            owner = newOwner;
            metadata = model.metadata;
            pricing = model.pricing;
            revenue = model.revenue;
            fileChunks = model.fileChunks;
            mintedAt = model.mintedAt;
          };
          
          models := Array.map<ModelNFT, ModelNFT>(models, func(m) {
            if (m.id == id) { updatedModel } else { m }
          });
          
          true
        } else {
          false
        }
      };
    }
  };
}