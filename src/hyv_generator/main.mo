import Text "mo:base/Text";
import Blob "mo:base/Blob";
import Nat "mo:base/Nat";

actor {
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

    type IC = actor {
        http_request : (HttpRequest) -> async HttpResponse;
    };

    let ic : IC = actor("aaaaa-aa");

    // This function calls the OpenAI API to generate text from a prompt.
    // NOTE: For production, the API key should be stored securely using IC secrets.
    public func generateText(prompt: Text, openAiApiKey: Text) : async Text {
        let jsonBody = "{\"model\": \"gpt-3.5-turbo\", \"messages\": [{\"role\": \"user\", \"content\": \"" # prompt # "\"}], \"max_tokens\": 150}";
        
        let request : HttpRequest = {
            url = "https://api.openai.com/v1/chat/completions";
            max_response_bytes = ?2000;
            method = #post;
            headers = [
                ("Authorization", "Bearer " # openAiApiKey),
                ("Content-Type", "application/json")
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
                        return decoded;
                    } else {
                        return "Error: HTTP " # Nat.toText(response.status);
                    }
                };
                case null {
                    return "Error: Could not decode response";
                };
            };
        } catch (_) {
            return "Error: Request failed";
        };
    };
}
