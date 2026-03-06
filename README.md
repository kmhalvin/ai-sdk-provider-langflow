# AI SDK Provider for Langflow

A community provider for the [Vercel AI SDK](https://sdk.vercel.ai/docs) that enables using AI models through Langflow and the `@datastax/langflow-client` API.

This provider enables you to use Langflow's AI capabilities through the familiar Vercel AI SDK interface, supporting `generateText()` and `streamText()`.

## Installation

```bash
npm install ai-sdk-provider-langflow ai
```

## Prerequisites

- Node.js >= 18
- Access to a Langflow instance
- The Base URL of your Langflow instance and optionally an API key

## Quick Start

```typescript
import { generateText } from "ai";
import { langflow, createLangflow } from "ai-sdk-provider-langflow";

// 1. Local Langflow Configuration
const localLangflow = createLangflow({
  baseURL: "http://127.0.0.1:7860", 
});

// 2. DataStax Astra Langflow Configuration
// const astraLangflow = createLangflow({
//   langflowId: "YOUR_LANGFLOW_ID", // Required for Astra Langflow
//   apiKey: "YOUR_ASTRA_API_KEY",   // Required for Astra Langflow
//   // baseURL is optional here since it defaults to https://api.langflow.astra.datastax.com
// });

const result = await generateText({
  // The model ID is the ID of your Langflow Flow
  model: localLangflow("YOUR_FLOW_ID"),
  prompt: "What is the capital of France?",
});

console.log(result.text);
```

## Settings

### Provider configuration

The `createLangflow` function accepts the following settings depending on your environment:
- `baseURL`: The Base URL of your API. Defaults to DataStax Astra Langflow (`https://api.langflow.astra.datastax.com`). For local development, you must explicitly set this (typically `http://127.0.0.1:7860`).
- `apiKey`: Your API Key. Required for DataStax Astra Langflow, or if you have enabled authentication on your local instance.
- `langflowId`: Your organization's Application / Langflow ID. **Required for DataStax Astra Langflow.** Omit this if you are using a local Langflow deployment.

### Model Configuration

When calling the initialized provider to configure your model, you can pass tweaks and input/output types:
```typescript
const model = localLangflow("YOUR_FLOW_ID", {
  tweaks: {
    "ChatInput-123": { files: "path_to_file" }
  },
  inputType: "chat", // Default
  outputType: "chat" // Default
});
```

## Execution Details

- `doGenerate`: Runs `flow(flowId).run(input, { tweaks })`.
- `doStream`: Streams responses using `flow(flowId).stream(input, { tweaks })`.

## License

MIT
