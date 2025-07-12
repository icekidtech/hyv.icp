// filepath: src/hyv_generator/main.mo
import Text "mo:base/Text";
import Blob "mo:base/Blob";
import {
    managementCanister,
    HttpResponse,
    HttpTransformArgs,
    HttpRequest
} from "ic:canisters/management";

actor {
    // This function calls the OpenAI API to generate text from a prompt.
    // NOTE: For production, the API key should be stored securely using IC secrets.
    public func generateText(prompt: Text, openAiApiKey: Text) : async Text {
        let request : HttpRequest = {
            url = "https://api.openai.com/v1/chat/completions";
            max_response_bytes = Some(2_000);
            method = { post = null };
            headers = [
                ("Authorization", "Bearer " # openAiApiKey),
                ("Content-Type", "application/json")
            ];
            // A simple JSON body for the OpenAI Chat Completions endpoint.
            body = Some(Text.encodeUtf8('{"model": "gpt-3.5-turbo", "messages": [{"role": "user", "content": "' # prompt # '"}], "max_tokens": 150}'));
            transform = Some({
                function = func (args: HttpTransformArgs) : async HttpResponse {
                    return { ...args.response, headers = [] };
                };
                context = Blob.fromArray([]);
            });
        };

        // Perform the HTTPS outcall, paying with cycles.
        let (response) = await managementCanister.http_request(request, 50_000_000);
        
        // For now, we just return the body as text. 
        // In a real app, you would parse the JSON to extract the content.
        switch(response) {
            case ({ body = b; status = 200 }) {
                return Text.decodeUtf8(b);
            };
            case (res) {
                // Handle errors
                return "Error: " # debug_show(res.status);
            }
        };
    };
}