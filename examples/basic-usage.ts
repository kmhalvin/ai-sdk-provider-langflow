import { generateText } from "ai";
import { langflow } from "../src/index.js";

async function main() {
    const result = await generateText({
        // Provide the Langflow flow ID as the model ID
        model: langflow("YOUR_FLOW_ID"),
        prompt: "What is the capital of France?",
    });

    console.log(result.text);
}

main().catch(console.error);
