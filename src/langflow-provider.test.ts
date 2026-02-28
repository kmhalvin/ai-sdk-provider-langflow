import { describe, expect, it, vi } from 'vitest';
import { langflow, createLangflow } from './langflow-provider.js';
import { NoSuchModelError } from '@ai-sdk/provider';

vi.mock('@datastax/langflow-client', () => {
    return {
        LangflowClient: class MockClient { }
    };
});

describe('langflow-provider', () => {
    it('should create a provider instance', () => {
        expect(langflow).toBeDefined();
        expect(langflow.provider).toBe('langflow');
        expect(langflow.specificationVersion).toBe('v3');
    });

    it('should create custom provider instances', () => {
        const custom = createLangflow({ baseUrl: 'http://localhost:7860' });
        expect(custom).toBeDefined();
        expect(custom.provider).toBe('langflow');
    });

    it('should create languageModel and chat models', () => {
        const model1 = langflow('my-flow');
        const model2 = langflow.languageModel('my-flow');
        const model3 = langflow.chat('my-flow');

        expect(model1.modelId).toBe('my-flow');
        expect(model2.modelId).toBe('my-flow');
        expect(model3.modelId).toBe('my-flow');
    });

    it('should throw NoSuchModelError for embeddingModel', () => {
        expect(() => {
            // @ts-expect-error embeddingModel is not defined in the interface
            langflow.embeddingModel('my-model');
        }).toThrow(NoSuchModelError);
    });

    it('should throw NoSuchModelError for imageModel', () => {
        expect(() => {
            // @ts-expect-error imageModel is not defined in the interface
            langflow.imageModel('my-model');
        }).toThrow(NoSuchModelError);
    });
});
