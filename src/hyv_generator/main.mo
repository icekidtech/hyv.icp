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
    type HttpRequest = {
        url : Text;
        max_response_bytes: ?Nat64;
        headers: [(Text, Text)];
        body: ?Blob;
        method: { #get; #post; #head };
        transform: ?{
            function: shared query (response: HttpResponse) -> async HttpResponse;
            context: Blob;
        };
    };

    type HttpResponse = {
        status: Nat;
        headers: [(Text, Text)];
        body: Blob;
    };

    // The management canister interface for HTTP outcalls
    type IC = actor {
        http_request : (HttpRequest) -> async HttpResponse;
    };

    let ic : IC = actor("aaaaa-aa");

    // Function to generate synthetic data using OpenRouter API
    public func generateSyntheticData(prompt: Text, apiKey: Text) : async Text {
        Debug.print("Generating synthetic data for prompt: " # prompt);
        
        if (Text.size(apiKey) == 0) {
            return "Error: API key is required";
        };
        
        // Enhanced prompt for better synthetic data generation
        let enhancedPrompt = "Generate realistic synthetic training data based on this request: " # prompt # 
                           ". Provide structured, diverse examples that would be useful for AI model training. " #
                           "Focus on creating high-quality, varied data points with realistic patterns.";
        
        // Create JSON body for OpenRouter API
        let jsonBody = "{\"model\": \"openai/gpt-3.5-turbo\", \"messages\": [{\"role\": \"system\", \"content\": \"You are a synthetic data generator. Create high-quality training data that is diverse, realistic, and useful for machine learning. Always provide structured output.\"}, {\"role\": \"user\", \"content\": \"" # escapeJson(enhancedPrompt) # "\"}], \"max_tokens\": 1000, \"temperature\": 0.8}";
        
        let request : HttpRequest = {
            url = "https://openrouter.ai/api/v1/chat/completions";
            max_response_bytes = ?5000;
            method = #post;
            headers = [
                ("Authorization", "Bearer " # apiKey),
                ("Content-Type", "application/json"),
                ("HTTP-Referer", "http://u6s2n-gx777-77774-qaaba-cai.localhost:4943/"),
                ("X-Title", "Hyv AI Data Marketplace")
            ];
            body = ?Text.encodeUtf8(jsonBody);
            transform = null;
        };

        try {
            Debug.print("Making API request to OpenRouter...");
            let response = await ic.http_request(request);
            
            Debug.print("Response status: " # Nat.toText(response.status));
            
            switch(Text.decodeUtf8(response.body)) {
                case (?decoded) {
                    // Use custom function to truncate response for debugging
                    Debug.print("Response received: " # truncateText(decoded, 200) # "...");
                    
                    if (response.status == 200) {
                        let extractedContent = parseOpenRouterResponse(decoded);
                        if (Text.startsWith(extractedContent, #text "Error:")) {
                            return extractedContent;
                        } else {
                            return "=== SYNTHETIC TRAINING DATA ===\n\n" # 
                                   "Generated from prompt: " # prompt # "\n" #
                                   "Timestamp: " # debugTimestamp() # "\n" #
                                   "Data quality: High-fidelity synthetic\n\n" #
                                   "--- DATA START ---\n" #
                                   extractedContent # "\n" #
                                   "--- DATA END ---\n\n" #
                                   "Note: This synthetic data is AI-generated and suitable for training purposes.";
                        };
                    } else {
                        Debug.print("HTTP Error: " # Nat.toText(response.status));
                        return "Error: API request failed with status " # Nat.toText(response.status) # 
                               ". Please check your API key and try again.";
                    };
                };
                case null {
                    return "Error: Could not decode API response";
                };
            };
        } catch (error) {
            Debug.print("Request failed with error");
            return "Error: Network request failed. Please check your connection and try again.";
        };
    };

    // Legacy function for backward compatibility
    public func generateText(prompt: Text) : async Text {
        return "Error: Please use generateSyntheticData with an API key";
    };

    // Helper function to escape JSON special characters
    private func escapeJson(text: Text) : Text {
        var result = text;
        // Replace backslashes first to avoid double escaping
        result := Text.replace(result, #text "\\", "\\\\");
        result := Text.replace(result, #text "\"", "\\\"");
        result := Text.replace(result, #text "\n", "\\n");
        result := Text.replace(result, #text "\r", "\\r");
        result := Text.replace(result, #text "\t", "\\t");
        result;
    };

    // Helper function to truncate text (replaces Text.take)
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
}