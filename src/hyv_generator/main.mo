import Text "mo:base/Text";
import Blob "mo:base/Blob";
import Nat "mo:base/Nat";
import Nat64 "mo:base/Nat64";
import Debug "mo:base/Debug";
import Option "mo:base/Option";


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

    // Store API key as a stable variable (in production, use proper secret management)
    private stable var apiKey: ?Text = null;

    // Function to set API key (should be called during deployment)
    public func setApiKey(key: Text) : async () {
        apiKey := ?key;
    };

    // Function to get API key
    private func getApiKey() : ?Text {
        // In production, you might want to get this from environment variables
        // or a secure configuration system
        switch (apiKey) {
            case (?key) { ?key };
            case null { 
                // Fallback - you can set a default key here during development
                // or return null to handle missing key gracefully
                null
            };
        }
    };

    // This function calls the OpenAI API to generate text from a prompt.
    public func generateText(prompt: Text) : async Text {
        // Get API key from storage
        let openAiApiKey = switch (getApiKey()) {
            case (?key) { key };
            case null { 
                return "Error: API key not configured";
            };
        };
        
        // Create JSON body for the request
        let jsonBody = "{\"model\": \"openai/gpt-3.5-turbo\", \"messages\": [{\"role\": \"user\", \"content\": \"" # escapeJson(prompt) # "\"}], \"max_tokens\": 150}";
        
        let request : HttpRequest = {
            url = "https://openrouter.ai/api/v1/chat/completions";
            max_response_bytes = ?2000;
            method = #post;
            headers = [
                ("Authorization", "Bearer " # openAiApiKey),
                ("Content-Type", "application/json"),
                ("HTTP-Referer", "https://your-domain.com"), // Required by OpenRouter
                ("X-Title", "Hyv Marketplace") // Optional but recommended
            ];
            body = ?Text.encodeUtf8(jsonBody);
            transform = null;
        };

        try {
            // Perform the HTTPS outcall
            let response = await ic.http_request(request);
            
            switch(Text.decodeUtf8(response.body)) {
                case (?decoded) {
                    if (response.status == 200) {
                        // Parse the JSON response to extract the generated text
                        return parseOpenAIResponse(decoded);
                    } else {
                        Debug.print("HTTP Error: " # Nat.toText(response.status));
                        Debug.print("Response: " # decoded);
                        return "Error: HTTP " # Nat.toText(response.status) # " - " # decoded;
                    }
                };
                case null {
                    return "Error: Could not decode response";
                };
            };
        } catch (_) {
            Debug.print("Request failed");
            return "Error: Request failed";
        };
    };

    // Helper function to escape JSON special characters in the prompt
    private func escapeJson(text: Text) : Text {
        // Basic JSON escaping - replace quotes and backslashes
        var result = text;
        result := Text.replace(result, #text "\"", "\\\"");
        result := Text.replace(result, #text "\\", "\\\\");
        result := Text.replace(result, #text "\n", "\\n");
        result := Text.replace(result, #text "\r", "\\r");
        result
    };

    // Helper function to parse OpenAI API response and extract the generated text
    private func parseOpenAIResponse(response: Text) : Text {
        // For MVP, return the full response
        // In production, implement proper JSON parsing
        response
    };

    // Test function to verify the canister is working
    public query func test() : async Text {
        "Generator canister is working!"
    };

    // Function to check if API key is configured
    public query func hasApiKey() : async Bool {
        Option.isSome(apiKey)
    };
}