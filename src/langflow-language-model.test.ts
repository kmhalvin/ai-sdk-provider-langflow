import { describe, it, expect, vi, beforeEach } from "vitest";
import { LangflowLanguageModel } from "./langflow-language-model.js";
import { LangflowClient } from "@datastax/langflow-client";
import type { LanguageModelV3Prompt } from "@ai-sdk/provider";

vi.mock("@datastax/langflow-client");

describe("LangflowLanguageModel", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should initialize correctly with default options", () => {
        const model = new LangflowLanguageModel("test-flow", {}, {});
        expect(model.modelId).toBe("test-flow");
        expect(model.provider).toBe("langflow");
        expect(model.specificationVersion).toBe("v3");
        expect(LangflowClient).toHaveBeenCalledWith({});
    });

    it("should initialize with custom options", () => {
        new LangflowLanguageModel(
            "test-flow",
            {},
            { baseUrl: "http://test", apiKey: "token", langflowId: "id" }
        );
        expect(LangflowClient).toHaveBeenCalledWith({
            baseUrl: "http://test",
            langflowId: "id",
            apiKey: "token",
        });
    });

    describe("doGenerate", () => {
        it("should call langflow flow.run and return content", async () => {
            const mockRun = vi.fn().mockResolvedValue({
                chatOutputText: () => "Test Output Text",
                outputs: {}
            });
            vi.mocked(LangflowClient).mockImplementation(() => {
                return {
                    flow: vi.fn().mockReturnValue({ run: mockRun, stream: vi.fn() })
                } as any;
            });

            const model = new LangflowLanguageModel("test-flow", { tweaks: { a: "1" }, input_type: "chat", output_type: "chat" }, {});

            const prompt: LanguageModelV3Prompt = [
                { role: "user", content: [{ type: "text", text: "Hello" }] }
            ];

            const result = await model.doGenerate({ prompt } as any);

            expect(mockRun).toHaveBeenCalledWith("User: Hello", expect.objectContaining({
                tweaks: { a: "1" },
                input_type: "chat",
                output_type: "chat"
            }));

            expect(result.content).toEqual([{ type: "text", text: "Test Output Text" }]);
            expect(result.finishReason.unified).toBe("stop");
            expect(result.providerMetadata?.langflow?.flowId).toBe("test-flow");
        });

        it("should fallback to JSON output if chatOutputText is not a function", async () => {
            const mockRun = vi.fn().mockResolvedValue({
                outputs: { result: "some output" }
            });
            vi.mocked(LangflowClient).mockImplementation(() => {
                return {
                    flow: vi.fn().mockReturnValue({ run: mockRun, stream: vi.fn() })
                } as any;
            });

            const model = new LangflowLanguageModel("test-flow", {}, {});
            const result = await model.doGenerate({ prompt: [] } as any);

            expect(result.content).toEqual([{ type: "text", text: "{\"result\":\"some output\"}" }]);
        });

        it("should handle and rethrow errors from flow.run", async () => {
            const mockRun = vi.fn().mockRejectedValue(new Error("API Error"));
            vi.mocked(LangflowClient).mockImplementation(() => {
                return {
                    flow: vi.fn().mockReturnValue({ run: mockRun, stream: vi.fn() })
                } as any;
            });

            const model = new LangflowLanguageModel("test-flow", {}, {});
            await expect(model.doGenerate({ prompt: [] } as any)).rejects.toThrow("API Error");
        });

        it("should handle AbortError specially", async () => {
            const abortError = new Error("Abort");
            abortError.name = "AbortError";
            const mockRun = vi.fn().mockRejectedValue(abortError);
            vi.mocked(LangflowClient).mockImplementation(() => {
                return {
                    flow: vi.fn().mockReturnValue({ run: mockRun, stream: vi.fn() })
                } as any;
            });

            const model = new LangflowLanguageModel("test-flow", {}, {});
            await expect(model.doGenerate({ prompt: [] } as any)).rejects.toThrow("Request aborted");
        });
    });

    describe("doStream", () => {
        it("should stream text deltas", async () => {
            async function* mockStreamGenerator() {
                yield { event: "token", data: { chunk: "Hello" } };
                yield { event: "token", data: { chunk: " World" } };
                yield { event: "end" };
            }

            const mockStream = vi.fn().mockResolvedValue(mockStreamGenerator());
            vi.mocked(LangflowClient).mockImplementation(() => {
                return {
                    flow: vi.fn().mockReturnValue({ run: vi.fn(), stream: mockStream })
                } as any;
            });

            const model = new LangflowLanguageModel("test-flow", { tweaks: { a: "1" }, input_type: "chat", output_type: "chat" }, {});
            const prompt: LanguageModelV3Prompt = [
                { role: "user", content: [{ type: "text", text: "Hello" }] }
            ];

            const result = await model.doStream({ prompt, abortSignal: undefined } as any);
            const stream = result.stream;
            const reader = stream.getReader();

            expect(mockStream).toHaveBeenCalledWith("User: Hello", expect.objectContaining({
                tweaks: { a: "1" },
                input_type: "chat",
                output_type: "chat"
            }));

            const chunks = [];
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                chunks.push(value);
            }

            expect(chunks.length).toBe(3);
            expect(chunks[0]).toEqual({ type: "text-delta", delta: "Hello" });
            expect(chunks[1]).toEqual({ type: "text-delta", delta: " World" });
            expect(chunks[2]).toEqual(expect.objectContaining({ type: "finish" }));
            expect((chunks[2] as any).finishReason.unified).toBe("stop");
        });

        it("should check abortSignal during streaming if provided", async () => {
            let iteration = 0;
            const abortSignal = { aborted: false } as any;

            async function* mockStreamGenerator() {
                yield { event: "token", data: { chunk: "1" } };
                iteration++;
                yield { event: "token", data: { chunk: "2" } }; // Should not be reached but mocked just in case
            }

            const mockStream = vi.fn().mockResolvedValue(mockStreamGenerator());
            vi.mocked(LangflowClient).mockImplementation(() => {
                return {
                    flow: vi.fn().mockReturnValue({ run: vi.fn(), stream: mockStream })
                } as any;
            });

            const model = new LangflowLanguageModel("test-flow", {}, {});
            const result = await model.doStream({ prompt: [], abortSignal } as any);
            const stream = result.stream;
            const reader = stream.getReader();

            const chunk1 = await reader.read();
            expect(chunk1.value).toEqual({ type: "text-delta", delta: "1" });

            abortSignal.aborted = true;

            const chunk2 = await reader.read();
            expect(chunk2.done).toBe(true);
        });

        it("should handle error during stream", async () => {
            const mockStream = vi.fn().mockRejectedValue(new Error("Stream Error"));
            vi.mocked(LangflowClient).mockImplementation(() => {
                return {
                    flow: vi.fn().mockReturnValue({ run: vi.fn(), stream: mockStream })
                } as any;
            });

            const model = new LangflowLanguageModel("test-flow", {}, {});
            const result = await model.doStream({ prompt: [] } as any);
            const reader = result.stream.getReader();

            const chunk1 = await reader.read();
            expect(chunk1.done).toBe(false);
            expect(chunk1.value).toEqual({ type: "error", error: new Error("Stream Error") });

            const chunk2 = await reader.read();
            expect(chunk2.done).toBe(true);
        });
    });
});
