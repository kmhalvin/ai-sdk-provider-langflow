import type { LanguageModelV3 } from "@ai-sdk/provider";
import { NoSuchModelError } from "@ai-sdk/provider";
import { LangflowLanguageModel } from "./langflow-language-model.js";
import type {
    LangflowModelId,
    LangflowModelSettings,
    LangflowProviderSettings,
} from "./types.js";

export interface LangflowProvider {
    (
        modelId: LangflowModelId,
        settings?: LangflowModelSettings,
    ): LanguageModelV3;

    languageModel(
        modelId: LangflowModelId,
        settings?: LangflowModelSettings,
    ): LanguageModelV3;

    chat(
        modelId: LangflowModelId,
        settings?: LangflowModelSettings,
    ): LanguageModelV3;

    provider: "langflow";
    specificationVersion: "v3";
}

export function createLangflow(
    options?: LangflowProviderSettings,
): LangflowProvider {
    const createModel = (
        modelId: LangflowModelId,
        settings?: LangflowModelSettings,
    ): LanguageModelV3 => {
        return new LangflowLanguageModel(modelId, settings ?? {}, options ?? {});
    };

    const provider = Object.assign(
        (
            modelId: LangflowModelId,
            settings?: LangflowModelSettings,
        ): LanguageModelV3 => {
            return createModel(modelId, settings);
        },
        {
            languageModel: (
                modelId: LangflowModelId,
                settings?: LangflowModelSettings,
            ): LanguageModelV3 => {
                return createModel(modelId, settings);
            },
            chat: (
                modelId: LangflowModelId,
                settings?: LangflowModelSettings,
            ): LanguageModelV3 => {
                return createModel(modelId, settings);
            },
            provider: "langflow" as const,
            specificationVersion: "v3" as const,

            embeddingModel: (modelId: string): never => {
                throw new NoSuchModelError({ modelId, modelType: "embeddingModel" });
            },
            imageModel: (modelId: string): never => {
                throw new NoSuchModelError({ modelId, modelType: "imageModel" });
            },
        }
    );

    return provider as LangflowProvider;
}

export const langflow = createLangflow();
