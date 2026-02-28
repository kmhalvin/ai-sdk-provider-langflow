import { LangflowClient, LangflowClientOptions } from "@datastax/langflow-client";
import type {
    LanguageModelV3,
    LanguageModelV3CallOptions,
    LanguageModelV3StreamPart,
    LanguageModelV3Content,
    LanguageModelV3FinishReason,
} from "@ai-sdk/provider";
import type { LangflowModelId, LangflowModelSettings, LangflowProviderSettings } from "./types.js";
import { convertToLangflowInput } from "./convert-to-langflow-input.js";

export class LangflowLanguageModel implements LanguageModelV3 {
    readonly specificationVersion = "v3";
    readonly provider = "langflow";
    readonly modelId: LangflowModelId;
    readonly supportedUrls: Record<string, RegExp[]> = {};

    private client: LangflowClient;
    private settings: LangflowModelSettings;

    constructor(
        modelId: LangflowModelId,
        settings: LangflowModelSettings,
        providerSettings: LangflowProviderSettings
    ) {
        this.modelId = modelId;
        this.settings = settings;

        // Use LangflowClient
        const clientOptions: LangflowClientOptions = providerSettings;

        this.client = new LangflowClient(clientOptions);
    }

    async doGenerate(options: LanguageModelV3CallOptions) {
        const input = convertToLangflowInput(options.prompt);

        // Add additional run options like tweaks
        const runOptions = {
            ...this.settings,
            ...(options.abortSignal ? { signal: options.abortSignal as AbortSignal } : {}),
        };

        const flow = this.client.flow(this.modelId);
        let outputText = "";
        const usage = {
            inputTokens: { total: 0, noCache: 0, cacheRead: 0, cacheWrite: 0 },
            outputTokens: { total: 0, text: undefined, reasoning: 0 },
            raw: {}
        };

        try {
            const response = await flow.run(input, runOptions);
            // Try to get chat output or default to raw outputs
            if (response && typeof response.chatOutputText === "function") {
                outputText = response.chatOutputText() || "";
            } else {
                outputText = JSON.stringify(response.outputs ?? {});
            }
        } catch (error) {
            const isAbortError = error instanceof Error && error.name === "AbortError";
            if (isAbortError) {
                throw new Error("Request aborted");
            }
            throw error;
        }

        const content: LanguageModelV3Content[] = [
            {
                type: "text",
                text: outputText,
            },
        ];

        const finishReason: LanguageModelV3FinishReason = { unified: "stop", raw: "stop" };

        return {
            content,
            finishReason,
            usage,
            request: { body: { input, runOptions } },
            providerMetadata: {
                langflow: {
                    flowId: this.modelId,
                }
            },
            warnings: [],
        };
    }

    async doStream(options: LanguageModelV3CallOptions) {
        const input = convertToLangflowInput(options.prompt);

        const runOptions = {
            ...this.settings,
            ...(options.abortSignal ? { signal: options.abortSignal as AbortSignal } : {}),
        };

        const flow = this.client.flow(this.modelId);

        // Create ReadableStream of LanguageModelV3StreamPart
        const stream = new ReadableStream<LanguageModelV3StreamPart>({
            start: async (controller) => {
                try {
                    const events = await flow.stream(input, runOptions);

                    for await (const event of events) {
                        if (options.abortSignal?.aborted) {
                            controller.close();
                            return;
                        }

                        if (event.event === "token") {
                            controller.enqueue({
                                type: "text-delta",
                                textDelta: event.data.chunk || "",
                            } as unknown as LanguageModelV3StreamPart);
                        } else if (event.event === "end") {
                            const finishReason: LanguageModelV3FinishReason = { unified: "stop", raw: "stop" };
                            controller.enqueue({
                                type: "finish",
                                finishReason,
                                usage: {
                                    inputTokens: { total: 0, noCache: 0, cacheRead: 0, cacheWrite: 0 },
                                    outputTokens: { total: 0, text: undefined, reasoning: 0 },
                                    raw: {}
                                }
                            });
                        }
                    }
                    controller.close();
                } catch (error) {
                    const isAbortError = error instanceof Error && error.name === "AbortError";
                    if (!isAbortError) {
                        controller.enqueue({
                            type: "error",
                            error,
                        });
                    }
                    controller.close();
                }
            }
        });

        return {
            stream,
            request: { body: { input, runOptions } },
        };
    }
}
