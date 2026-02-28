import { streamText } from "ai";
import { langflow } from "../src/index.js";

async function main() {
    const result = streamText({
        // Provide the Langflow flow ID as the model ID
        model: langflow("YOUR_FLOW_ID"),
        prompt: "Write a haiku about coding.",
    });

    for await (const chunk of result.textStream) {
        process.stdout.write(chunk);
    }
}

main().catch(console.error);
