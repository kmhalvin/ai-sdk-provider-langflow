import { LangflowClientOptions } from "@datastax/langflow-client";
import { FlowRequestOptions } from "@datastax/langflow-client/flow";

export type LangflowProviderSettings = LangflowClientOptions

export type LangflowModelSettings = Partial<Omit<FlowRequestOptions, "input_value" | "signal">>;

export type LangflowModelId = string;
