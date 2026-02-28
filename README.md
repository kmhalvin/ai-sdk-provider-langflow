# AI SDK Provider for Langflow

A community provider for the [Vercel AI SDK](https://sdk.vercel.ai/docs) that enables using AI models through Langflow and the `@datastax/langflow-client` API.

This provider enables you to use Langflow's AI capabilities through the familiar Vercel AI SDK interface, supporting `generateText()` and `streamText()`.

## Installation

```bash
npm install ai-sdk-provider-langflow @datastax/langflow-client ai
```

## Prerequisites

- Node.js >= 18
- Access to a Langflow instance
- The Base URL of your Langflow instance and optionally an API key

## Quick Start

```typescript
import { generateText } from "ai";
import { langflow, createLangflow } from "ai-sdk-provider-langflow";

// By default, it expects you to provide configuration or relying on ENV variables if they existed
const myLangflow = createLangflow({
  baseURL: "http://127.0.0.1:7860", 
  // apiKey: "sk-...",
  // langflowId: "..."
});

const result = await generateText({
  // The model ID is the ID of your Langflow Flow
  model: myLangflow("YOUR_FLOW_ID"),
  prompt: "What is the capital of France?",
});

console.log(result.text);
```

## Settings

### Provider configuration

The `createLangflow` function accepts the following settings:
- `baseURL`: The Base URL of your API (defaults to DataStax Langflow endpoint)
- `apiKey`: Your API Key (if required by your Langflow instance)
- `langflowId`: Your organization's Langflow ID (if applicable)

### Model Configuration

When calling the initialized provider to configure your model, you can pass tweaks and input/output types:
```typescript
const model = myLangflow("YOUR_FLOW_ID", {
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
