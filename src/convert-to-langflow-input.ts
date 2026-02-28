import type { LanguageModelV3Prompt } from "@ai-sdk/provider";

export function convertToLangflowInput(prompt: LanguageModelV3Prompt): string {
    let input = "";

    for (const message of prompt) {
        if (message.role === "system") {
            input += `System: ${message.content}\n`;
        } else if (message.role === "user") {
            const content = extractTextFromParts(message.content);
            input += `User: ${content}\n`;
        } else if (message.role === "assistant") {
            const content = extractTextFromParts(message.content);
            input += `Assistant: ${content}\n`;
        }
    }

    // Langflow often just uses the last input, or the entire appended string for chat if needed.
    // We provide the full text representation.
    return input.trim();
}

function extractTextFromParts(content: unknown): string {
    if (typeof content === "string") {
        return content;
    }

    if (!Array.isArray(content)) {
        return "";
    }

    let text = "";
    for (const part of content) {
        if (
            typeof part === "object" &&
            part !== null &&
            "type" in part &&
            part.type === "text" &&
            "text" in part &&
            typeof part.text === "string"
        ) {
            text += part.text;
        }
        // Langflow file upload / image support requires using LangflowClient.uploadFile
        // We can't automatically extract and upload local files easily in this synchronous converter,
        // so we handle plain text prompts in the main input stream.
    }
    return text;
}
