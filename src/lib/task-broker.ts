import type { ImageGenerationResult } from "../types/image";
import type { PromptGenerationResult } from "../types/prompt";
import { storageGet, storageSet } from "./storage";

const IMAGE_TASK_KEY = "prompt-butler-image-task";
const PROMPT_TASK_KEY = "prompt-butler-prompt-task";

interface TaskState<T> {
  status: "idle" | "running" | "done";
  startedAt: string | null;
  result: T | null;
}

export type ImageTaskState = TaskState<ImageGenerationResult>;
export type PromptTaskState = TaskState<PromptGenerationResult>;

const idleImageTask: ImageTaskState = { status: "idle", startedAt: null, result: null };
const idlePromptTask: PromptTaskState = { status: "idle", startedAt: null, result: null };

export async function startImageTask() {
  await storageSet(IMAGE_TASK_KEY, {
    status: "running",
    startedAt: new Date().toISOString(),
    result: null
  } satisfies ImageTaskState);
}

export async function finishImageTask(result: ImageGenerationResult) {
  await storageSet(IMAGE_TASK_KEY, {
    status: "done",
    startedAt: null,
    result
  } satisfies ImageTaskState);
}

export async function getImageTask(): Promise<ImageTaskState> {
  return storageGet<ImageTaskState>(IMAGE_TASK_KEY, idleImageTask);
}

export async function clearImageTask() {
  await storageSet(IMAGE_TASK_KEY, idleImageTask);
}

export async function startPromptTask() {
  await storageSet(PROMPT_TASK_KEY, {
    status: "running",
    startedAt: new Date().toISOString(),
    result: null
  } satisfies PromptTaskState);
}

export async function finishPromptTask(result: PromptGenerationResult) {
  await storageSet(PROMPT_TASK_KEY, {
    status: "done",
    startedAt: null,
    result
  } satisfies PromptTaskState);
}

export async function getPromptTask(): Promise<PromptTaskState> {
  return storageGet<PromptTaskState>(PROMPT_TASK_KEY, idlePromptTask);
}

export async function clearPromptTask() {
  await storageSet(PROMPT_TASK_KEY, idlePromptTask);
}
