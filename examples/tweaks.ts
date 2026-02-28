import { generateText } from "ai";
import { langflow } from "../src/index.js";

async function main() {
    // Example of passing tweaks to a Langflow flow
    const tweaks = {
        "Prompt-1234": {
            template: "What is the capital of {country}?",
        },
        "TextInput-5678": {
            input_value: "France",
        },
    };

    const result = await generateText({
        // Provide the Langflow flow ID as the model ID
        model: langflow("YOUR_FLOW_ID", { tweaks }),
        prompt: "Run the flow",
    });

    console.log(result.text);
}

main().catch(console.error);
