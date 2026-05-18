import type { ExtensionSettings, ModelCatalog, ProviderId } from "./settings";
import type {
  PromptGenerationInput,
  PromptGenerationResult,
  PromptOptimizationResult
} from "./prompt";
import type { ImageGenerationInput, ImageGenerationResult } from "./image";

export interface ConnectionTestSuccess {
  ok: true;
  provider: ProviderId;
  checkedUrl: string;
  checkedAt: string;
  status: number;
  message: string;
}

export interface ConnectionTestFailure {
  ok: false;
  provider: ProviderId;
  checkedUrl: string;
  checkedAt: string;
  status: number;
  message: string;
}

export type ConnectionTestResult = ConnectionTestSuccess | ConnectionTestFailure;

export interface ModelDetectionSuccess {
  ok: true;
  provider: ProviderId;
  checkedAt: string;
  checkedUrl: string;
  catalog: ModelCatalog;
  message: string;
}

export interface ModelDetectionFailure {
  ok: false;
  provider: ProviderId;
  checkedAt: string;
  checkedUrl: string;
  catalog: null;
  message: string;
}

export type ModelDetectionResult = ModelDetectionSuccess | ModelDetectionFailure;

export interface TestProviderConnectionMessage {
  type: "provider:test-connection";
  payload: {
    settings: ExtensionSettings;
  };
}

export interface GeneratePromptMessage {
  type: "prompt:generate";
  payload: {
    settings: ExtensionSettings;
    input: PromptGenerationInput;
  };
}

export interface OptimizePromptMessage {
  type: "prompt:optimize";
  payload: {
    settings: ExtensionSettings;
    content: string;
  };
}

export interface GenerateImagesMessage {
  type: "image:generate";
  payload: {
    settings: ExtensionSettings;
    input: ImageGenerationInput;
  };
}

export interface DownloadImagesMessage {
  type: "image:download";
  payload: {
    urls: string[];
  };
}

export interface DetectProviderModelsMessage {
  type: "provider:detect-models";
  payload: {
    settings: ExtensionSettings;
  };
}

export interface OpenOptionsPageMessage {
  type: "open-options-page";
}

export interface CancelImageGenerationMessage {
  type: "image:cancel";
}

export type RuntimeRequestMessage =
  | TestProviderConnectionMessage
  | DetectProviderModelsMessage
  | GeneratePromptMessage
  | OptimizePromptMessage
  | GenerateImagesMessage
  | DownloadImagesMessage
  | OpenOptionsPageMessage
  | CancelImageGenerationMessage;

export type RuntimeResponseMessage =
  | ConnectionTestResult
  | ModelDetectionResult
  | PromptGenerationResult
  | PromptOptimizationResult
  | ImageGenerationResult
  | number[]
  | { ok: true };
