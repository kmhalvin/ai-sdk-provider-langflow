import { describe, it, expect } from "vitest";
import { convertToLangflowInput } from "./convert-to-langflow-input.js";
import type { LanguageModelV3Prompt } from "@ai-sdk/provider";

describe("convertToLangflowInput", () => {
    it("should format system, user, and assistant messages correctly", () => {
        const prompt: LanguageModelV3Prompt = [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: [{ type: "text", text: "Hello!" }] },
            { role: "assistant", content: [{ type: "text", text: "How can I help you?" }] }
        ];

        const result = convertToLangflowInput(prompt);

        expect(result).toBe("System: You are a helpful assistant.\nUser: Hello!\nAssistant: How can I help you?");
    });

    it("should extract text from string content for user message", () => {
        const prompt: LanguageModelV3Prompt = [
            { role: "user", content: "Hello directly as string" as any },
        ];

        const result = convertToLangflowInput(prompt);

        expect(result).toBe("User: Hello directly as string");
    });

    it("should handle unknown or complex array content gracefully", () => {
        const prompt: LanguageModelV3Prompt = [
            { role: "user", content: [{ type: "image", image: new Uint8Array() }] as any },
            { role: "assistant", content: [{ type: "text", text: "I cannot see images." }, { type: "unknown" } as any] }
        ];

        const result = convertToLangflowInput(prompt);

        expect(result).toBe("User: \nAssistant: I cannot see images.");
    });
});
