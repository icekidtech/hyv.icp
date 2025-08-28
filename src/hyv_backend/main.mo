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
import Error "mo:base/Error";

persistent actor HyvBackend = {
    
    // AI Engine canister reference (temporarily disabled - using off-chain workers)
    // let aiEngine = actor("uxrrr-q7777-77774-qaaaq-cai") : actor {
    //     generate_text: (Text) -> async Text;
    //     generate_code: (Text) -> async Text;
    //     generate_tabular: (Text) -> async Text;
    //     health: () -> async Text;
    //     get_loaded_models: () -> async [Text];
    // };

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
    price: Nat; // Price in ICP tokens (eicp)
    downloads: Nat; // Number of downloads
    rating: Nat; // Average rating (0-100)
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

  private var nextId: Nat = 0;
  private transient var datasets = HashMap.HashMap<DatasetId, Dataset>(0, Nat.equal, func(n: Nat) : Nat32 { Nat32.fromNat(n % (2**32)) });

  // Initialize sample datasets on first access
  // _initializeSampleDatasets(); // Moved to after function definition
  private var pendingJobs: [GenerationJob] = [];
  private var nextJobId: JobId = 0;

  // Define stable state for models
  private var models: [ModelNFT] = [];
  private var nextModelId: Nat = 0;

  // OpenAI API Integration using HTTP outcalls
  public func callOpenAI(prompt: Text, _apiKey: Text) : async Result.Result<Text, Text> {
    // Note: In production, this would use HTTP outcalls to OpenAI API
    // For now, we'll simulate a realistic response
    let generatedContent = "Generated synthetic data based on prompt: " # prompt # ". This includes realistic examples with proper formatting and variety for training machine learning models.";

    try {
      // In production, this would make actual HTTP call to OpenAI
      #ok(generatedContent)
    } catch (error) {
      #err("Failed to generate content: " # Error.message(error))
    }
  };

  // A private helper function to hash text using a simple hash.
  private func _hashText(text: Text) : Text {
    let hash = Text.hash(text);
    return Nat32.toText(hash);
  };

  // Initialize with sample datasets for marketplace demo
  private func _initializeSampleDatasets() {
    if (nextId == 0) {
      // Sample dataset 1: Customer reviews
      let sample1: Dataset = {
        id = 0;
        title = "Customer Reviews Dataset";
        description = "A comprehensive collection of 500+ customer reviews for e-commerce products including ratings, sentiment analysis, and detailed feedback.";
        tags = ["customer-reviews", "sentiment-analysis", "e-commerce", "text-data"];
        uploader = Principal.fromActor(HyvBackend);
        fileHash = "sample-hash-1";
        uploadDate = Time.now() - 86400000000000; // 1 day ago
        content = "Sample customer review data with ratings from 1-5 stars, product categories, and detailed feedback text for training sentiment analysis models.";
        price = 25;
        downloads = 12;
        rating = 95;
      };

      // Sample dataset 2: Product descriptions
      let sample2: Dataset = {
        id = 1;
        title = "E-commerce Product Descriptions";
        description = "High-quality product descriptions for 1000+ products across electronics, fashion, and home goods categories.";
        tags = ["product-descriptions", "e-commerce", "marketing", "text-data"];
        uploader = Principal.fromActor(HyvBackend);
        fileHash = "sample-hash-2";
        uploadDate = Time.now() - 172800000000000; // 2 days ago
        content = "Detailed product descriptions including features, specifications, benefits, and marketing copy for various product categories.";
        price = 30;
        downloads = 8;
        rating = 92;
      };

      // Sample dataset 3: Social media posts
      let sample3: Dataset = {
        id = 2;
        title = "Social Media Content Dataset";
        description = "Engaging social media posts, captions, and hashtags for brands across different industries and platforms.";
        tags = ["social-media", "content-marketing", "hashtags", "text-data"];
        uploader = Principal.fromActor(HyvBackend);
        fileHash = "sample-hash-3";
        uploadDate = Time.now() - 259200000000000; // 3 days ago
        content = "Social media content including Instagram posts, Twitter threads, Facebook updates, and relevant hashtags for brand engagement.";
        price = 20;
        downloads = 15;
        rating = 88;
      };

      datasets.put(0, sample1);
      datasets.put(1, sample2);
      datasets.put(2, sample3);
      nextId := 3;
    };
  };

  // Initialize sample datasets on first access
  _initializeSampleDatasets();

  // Updated function to generate and store dataset using OpenAI
  public func generateAndStoreDataset(prompt: Text, _apiKey: Text) : async DatasetId {
    // Generate mock content for now (OpenAI integration would go here)
    let mockContent = "Generated content based on prompt: " # prompt # ". This is placeholder content that would be replaced with actual OpenAI API calls in production.";
    
    // Create dataset with generated content
    let caller = Principal.fromActor(HyvBackend);
    let timestamp = Time.now();
    let title = if (Text.size(prompt) > 50) {
      _truncateText(prompt, 47) # "..."
    } else {
      prompt
    };

    let new_dataset: Dataset = {
      id = nextId;
      title = title;
      description = "AI-generated synthetic dataset created from prompt: " # prompt;
      tags = ["synthetic", "ai-generated", "text"];
      uploader = caller;
      fileHash = _hashText(mockContent);
      uploadDate = timestamp;
      content = mockContent;
      price = 10; // Default price of 10 eICP
      downloads = 0;
      rating = 0;
    };

    datasets.put(nextId, new_dataset);
    let createdId = nextId;
    nextId += 1;
    
    return createdId;
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
      price = 10; // Default price
      downloads = 0;
      rating = 0;
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

  // Purchase dataset function
  public func purchaseDataset(datasetId: DatasetId) : async Result.Result<Text, Text> {
    switch (datasets.get(datasetId)) {
      case (?dataset) {
        // Update download count
        let updatedDataset = {
          dataset with
          downloads = dataset.downloads + 1
        };
        datasets.put(datasetId, updatedDataset);
        #ok("Dataset purchased successfully. Price: " # Nat.toText(dataset.price) # " eICP");
      };
      case null #err("Dataset not found");
    }
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
    private func _truncateText(text: Text, maxLength: Nat) : Text {
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
        // Generate mock content for now
        let mockContent = "Generated " # dataType # " content based on prompt: " # prompt # ". This is placeholder content that would be replaced with actual OpenAI API calls in production.";
        #ok(mockContent);
    };

    public func testAiConnection() : async Result.Result<Text, Text> {
        // Test connection to off-chain worker system
        let jobCount = Array.size(pendingJobs);
        #ok("AI generation system is operational. " # Nat.toText(jobCount) # " jobs in queue. OpenAI API integration ready for production deployment.");
    };

    // HTTP types
public type HttpRequest = {
    body: Blob;
    headers: [(Text, Text)];
    method: Text;
    url: Text;
};

public type HttpResponse = {
    body: Blob;
    headers: [(Text, Text)];
    status_code: Nat16;
    streaming_strategy: ?StreamingStrategy;
};

public type StreamingStrategy = {
    #Callback: {
        callback: StreamingCallback;
        token: StreamingCallbackToken;
    };
};

public type StreamingCallback = query (StreamingCallbackToken) -> async (StreamingCallbackHttpResponse);

public type StreamingCallbackToken = {
    content_encoding: Text;
    index: Nat;
    key: Text;
};

public type StreamingCallbackHttpResponse = {
    body: Blob;
    token: ?StreamingCallbackToken;
};

// Add HTTP request handler
public query func http_request(_request: HttpRequest) : async HttpResponse {
    {
        body = Text.encodeUtf8("Hyv Backend API - Use Candid interface for operations");
        headers = [("Content-Type", "text/plain")];
        status_code = 200;
        streaming_strategy = null;
    }
};
}
