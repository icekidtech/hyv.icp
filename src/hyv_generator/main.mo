import Text "mo:base/Text";
import Blob "mo:base/Blob";
import Nat "mo:base/Nat";
import Nat64 "mo:base/Nat64";
import Debug "mo:base/Debug";
import Option "mo:base/Option";
import Result "mo:base/Result";
import Time "mo:base/Time";
import Int "mo:base/Int";
import Iter "mo:base/Iter";

actor Generator {
    // HTTP request and response types for IC HTTP outcalls
    type HttpResponse = {
        status: Nat;
        headers: [(Text, Text)];
        body: Blob;
    };

    // The management canister interface for HTTP outcalls
    type IC = actor {
        http_request : (HttpRequestArgs) -> async HttpResponse;
    };

    let ic : IC = actor("aaaaa-aa");

    // Simplified helper function to escape JSON strings
    private func escapeJson(text: Text) : Text {
        var result = text;
        // Replace in order: backslashes first, then quotes
        result := Text.replace(result, #text "\\", "\\\\");
        result := Text.replace(result, #text "\"", "\\\"");
        result := Text.replace(result, #text "\n", "\\n");
        result := Text.replace(result, #text "\r", "\\r");
        result := Text.replace(result, #text "\t", "\\t");
        result;
    };

    // Updated function to use Hugging Face API
    public func generateSyntheticData(prompt: Text, apiKey: Text) : async Text {
        Debug.print("Generating synthetic data for prompt: " # prompt);
        
        if (Text.size(apiKey) == 0) {
            return "Error: API key is required";
        };
        
        // Enhanced prompt for better synthetic data generation
        let enhancedPrompt = "Generate realistic synthetic training data based on this request: " # prompt # 
                           ". Provide structured, diverse examples that would be useful for AI model training. " #
                           "Focus on creating high-quality, varied data points with realistic patterns.";
        
        // Hugging Face API JSON body (using a free model)
        let jsonBody = "{\"inputs\": \"" # escapeJson(enhancedPrompt) # "\"}";
        
        // Update HTTP request for DeepSeek Coder on Hugging Face
        let http_request : HttpRequestArgs = {
            url = "https://api-inference.huggingface.co/models/deepseek-ai/deepseek-coder-1.3b-instruct"; // DeepSeek model
            max_response_bytes = ?Nat64.fromNat(4000);
            headers = [
                ("Authorization", "Bearer " # apiKey),
                ("Content-Type", "application/json"),
                ("User-Agent", "HyvICP/1.0"),
            ];
            body = ?Text.encodeUtf8(jsonBody);
            method = #post;
            transform = ?{
                function = transform;
                context = Blob.fromArray([]);
            };
        };

        try {
            Debug.print("Making API request to Hugging Face...");
            let response = await ic.http_request(http_request);
            
            Debug.print("Response status: " # Nat.toText(response.status));
            
            if (response.status == 200) {
                switch(Text.decodeUtf8(response.body)) {
                    case (?decoded) {
                        Debug.print("Response received: " # truncateText(decoded, 200) # "...");
                        return processHuggingFaceResponse(decoded, prompt);
                    };
                    case null {
                        return "Error: Failed to decode response";
                    };
                };
            } else {
                Debug.print("API request failed with status: " # Nat.toText(response.status));
                return generateMockData(prompt);
            };
        } catch (error) {
            Debug.print("HTTP request failed, using fallback");
            return generateMockData(prompt);
        };
    };

    // Process Hugging Face response format
    private func processHuggingFaceResponse(response: Text, originalPrompt: Text) : Text {
        // Hugging Face returns array format, extract the generated text
        let cleanedResponse = if (Text.startsWith(response, #text "[")) {
            // Extract from JSON array format
            let withoutBrackets = Text.replace(response, #text "[", "");
            let withoutEndBrackets = Text.replace(withoutBrackets, #text "]", "");
            withoutEndBrackets;
        } else {
            response;
        };
        
        "=== SYNTHETIC TRAINING DATA ===\n\n" #
        "Generated from prompt: " # originalPrompt # "\n" #
        "Timestamp: " # Int.toText(Time.now()) # "\n" #
        "Generator: Hugging Face DialoGPT\n\n" #
        "--- GENERATED DATA ---\n" #
        cleanedResponse # "\n" #
        "--- END DATA ---\n\n" #
        "Status: Successfully generated using AI";
    };

    // Mock data generator for when API fails
    private func generateMockData(prompt: Text) : Text {
        "=== SYNTHETIC TRAINING DATA (MOCK) ===\n\n" #
        "Generated from prompt: " # prompt # "\n" #
        "Timestamp: " # Int.toText(Time.now()) # "\n\n" #
        "--- SAMPLE DATA ---\n" #
        "Example 1: This is high-quality synthetic data sample based on: " # prompt # "\n" #
        "Example 2: Another realistic data point for training purposes\n" #
        "Example 3: Diverse synthetic content suitable for ML model training\n" #
        "Example 4: Additional structured data following the prompt requirements\n" #
        "--- END DATA ---\n\n" #
        "Note: This is mock data for testing purposes when API is unavailable.";
    };

    // Helper function to truncate text
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

    // Enhanced JSON response parser for OpenRouter using Text.contains and pattern matching
    private func parseOpenRouterResponse(response: Text) : Text {
        Debug.print("Parsing response...");
        
        // Simple approach: look for content pattern and extract until next quote
        let contentPattern = "\"content\":\"";
        
        if (Text.contains(response, #text contentPattern)) {
            // Split the response by the content pattern
            let parts = Text.split(response, #text contentPattern);
            let partsArray = Iter.toArray(parts);
            
            if (partsArray.size() >= 2) {
                // Get the part after "content":"
                let afterContent = partsArray[1];
                
                // Find the first unescaped quote to end the content
                let content = extractContentUntilQuote(afterContent);
                return unescapeJson(content);
            };
        };
        
        return "Error: Could not find content field in response";
    };

    // Helper to extract content until the first unescaped quote
    private func extractContentUntilQuote(text: Text) : Text {
        var result = "";
        var i = 0;
        let textSize = Text.size(text);
        let chars = Text.toIter(text);
        
        for (char in chars) {
            // Simple approach: just look for the first quote that's not at the very beginning
            if (i > 0 and Text.fromChar(char) == "\"") {
                return result;
            } else {
                result := result # Text.fromChar(char);
            };
            i += 1;
        };
        
        result;
    };

    // Helper to unescape JSON strings
    private func unescapeJson(text: Text) : Text {
        var result = text;
        result := Text.replace(result, #text "\\n", "\n");
        result := Text.replace(result, #text "\\r", "\r");
        result := Text.replace(result, #text "\\t", "\t");
        result := Text.replace(result, #text "\\\"", "\"");
        result := Text.replace(result, #text "\\\\", "\\");
        result;
    };

    // Helper function to get current timestamp for debugging
    private func debugTimestamp() : Text {
        "Generated at: " # Int.toText(Time.now());
    };

    // Test function
    public query func test() : async Text {
        "Hyv Generator v2.0 - Ready for synthetic data generation!";
    };

    // Health check
    public query func health() : async Text {
        "Generator canister is healthy and ready to generate synthetic data";
    };
    
    public query func transform(raw : TransformArgs) : async CanisterHttpResponsePayload {
        let transformed : CanisterHttpResponsePayload = {
            status = raw.response.status;
            body = raw.response.body;
            headers = [
                {
                    name = "Content-Security-Policy";
                    value = "default-src 'self'";
                },
                { name = "Referrer-Policy"; value = "strict-origin" },
                { name = "Permissions-Policy"; value = "geolocation=(self)" },
                {
                    name = "Strict-Transport-Security";
                    value = "max-age=63072000";
                },
                { name = "X-Frame-Options"; value = "DENY" },
                { name = "X-Content-Type-Options"; value = "nosniff" },
            ];
        };
        transformed;
    };
    
    // Test HTTP call function
    public func testHttpCall() : async Text {
        try {
            let request : HttpRequestArgs = {
                url = "https://httpbin.org/get";
                max_response_bytes = ?1000;
                headers = [];
                body = null;
                method = #get;
                transform = ?{
                    function = transform;
                    context = Blob.fromArray([]);
                };
            };
            
            let response = await ic.http_request(request);
            return "HTTP test successful";
        } catch (error) {
            return "HTTP test failed";
        };
    };
    
    // Additional types for HTTP outcalls
    type HttpRequestArgs = {
        url : Text;
        max_response_bytes : ?Nat64;
        headers : [(Text, Text)];
        body : ?Blob;
        method : { #get; #post; #head };
        transform : ?{
            function : shared query (TransformArgs) -> async CanisterHttpResponsePayload;
            context : Blob;
        };
    };

    type TransformArgs = {
        response : HttpResponse;
        context : Blob;
    };

    type CanisterHttpResponsePayload = {
        status : Nat;
        headers : [HttpHeader];
        body : Blob;
    };

    type HttpHeader = {
        name : Text;
        value : Text;
    };
}