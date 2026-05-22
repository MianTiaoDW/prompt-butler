import type { ProviderId } from "./settings";

export interface ReferenceImage {
  dataUrl: string;
  name: string;
}

export interface PromptGenerationInput {
  rolePreset: string;
  userRequirement: string;
  referenceImages?: ReferenceImage[];
}

export interface StructuredPromptPayload {
  characterCore: {
    identity: string;
    appearance: string;
    personality: string;
  };
  sceneDesign: {
    environment: string;
    lighting: string;
    camera: string;
    action: string;
  };
  styleDirectives: string[];
  negativePrompt: string[];
  usageNotes: string[];
}

export interface PromptGenerationOutput {
  cnPrompt: string;
  enPrompt: string;
  structuredPrompt: StructuredPromptPayload;
}

export interface PromptGenerationSuccess {
  ok: true;
  provider: ProviderId;
  model: string;
  generatedAt: string;
  output: PromptGenerationOutput;
}

export interface PromptGenerationFailure {
  ok: false;
  provider: ProviderId;
  model: string;
  generatedAt: string;
  message: string;
}

export type PromptGenerationResult = PromptGenerationSuccess | PromptGenerationFailure;

export interface PromptOptimizationSuccess {
  ok: true;
  provider: ProviderId;
  model: string;
  optimizedAt: string;
  output: string;
}

export interface PromptOptimizationFailure {
  ok: false;
  provider: ProviderId;
  model: string;
  optimizedAt: string;
  message: string;
}

export type PromptOptimizationResult =
  | PromptOptimizationSuccess
  | PromptOptimizationFailure;

export type PromptOutputFormat = "cnPrompt" | "enPrompt" | "structuredPrompt";

export interface SavedPromptRecord {
  id: string;
  title: string;
  createdAt: string;
  updatedAt?: string;
  provider: ProviderId;
  model: string;
  format: PromptOutputFormat;
  content: string;
  category: string;
  tags: string[];
  order?: number;
}

export interface PromptWorkspaceState {
  rolePreset: string;
  rolePresetLocked: boolean;
  userRequirement: string;
}

export interface PromptFolder {
  id: string;
  name: string;
  scope: string;
  createdAt: string;
  order: number;
}
