import Text "mo:base/Text";
import Blob "mo:base/Blob";
import Nat "mo:base/Nat";
import Nat64 "mo:base/Nat64";
import Debug "mo:base/Debug";
import Option "mo:base/Option";
import Result "mo:base/Result";

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
                ("HTTP-Referer", "http://u6s2n-gx777-77774-qaaba-cai.localhost:4943/"),// Fix with playground link domain
                ("X-Title", "Hyv AI Data Marketplace") // Optional but recommended
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
                    Debug.print("Response received: " # Text.take(decoded, 200) # "...");
                    
                    if (response.status == 200) {
                        let extractedContent = parseOpenRouterResponse(decoded);
                        if (Text.startsWith(extractedContent, #text "Error:")) {
                            return extractedContent;
                        } else {
                            return "=== SYNTHETIC TRAINING DATA ===\n\n" # 
                                   "Generated from prompt: " # prompt # "\n" #
                                   "Timestamp: " # debug_timestamp() # "\n" #
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
                    }
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
        result
    };

    // Enhanced JSON response parser for OpenRouter
    private func parseOpenRouterResponse(response: Text) : Text {
        Debug.print("Parsing response...");
        
        // Look for the content field in the JSON response
        switch (Text.split(response, #text "\"content\":")) {
            case (#next(_, rest)) {
                // Find the start of the content string
                switch (Text.split(rest, #text "\"")) {
                    case (#next(_, contentStart)) {
                        // Find the end of the content (before the next quote that's not escaped)
                        let content = extractJsonString(contentStart);
                        if (Text.size(content) > 0) {
                            return unescapeJson(content);
                        };
                    };
                };
            };
        };
        
        // Fallback: if JSON parsing fails, return error
        return "Error: Could not parse API response. The service may be temporarily unavailable.";
    };

    // Helper to extract content from JSON string
    private func extractJsonString(text: Text) : Text {
        var result = "";
        var escaped = false;
        var inString = true;
        
        for (char in text.chars()) {
            if (inString) {
                if (escaped) {
                    result := result # Text.fromChar(char);
                    escaped := false;
                } else if (char == '\\') {
                    escaped := true;
                } else if (char == '"') {
                    inString := false;
                } else {
                    result := result # Text.fromChar(char);
                };
            };
        };
        
        result
    };

    // Helper to unescape JSON strings
    private func unescapeJson(text: Text) : Text {
        var result = text;
        result := Text.replace(result, #text "\\n", "\n");
        result := Text.replace(result, #text "\\r", "\r");
        result := Text.replace(result, #text "\\t", "\t");
        result := Text.replace(result, #text "\\\"", "\"");
        result := Text.replace(result, #text "\\\\", "\\");
        result
    };

    // Helper function to get current timestamp for debugging
    private func debug_timestamp() : Text {
        "Generated at: " # Int.toText(Time.now())
    };

    // Test function
    public query func test() : async Text {
        "Hyv Generator v2.0 - Ready for synthetic data generation!"
    };

    // Health check
    public query func health() : async Text {
        "Generator canister is healthy and ready to generate synthetic data"
    };
}