import type { ImageGenerationResult } from "../types/image";
import type { PromptGenerationResult } from "../types/prompt";
import { storageGet, storageSet, subscribeStorage } from "./storage";

export const IMAGE_TASK_KEY = "prompt-butler-image-task";
export const PROMPT_TASK_KEY = "prompt-butler-prompt-task";

export type TaskStatus =
  | "idle"
  | "submitting"
  | "generating"
  | "success"
  | "error"
  | "cancelled";

interface TaskState<T> {
  status: TaskStatus;
  taskId: string | null;
  workerSessionId: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  result: T | null;
  errorMessage: string | null;
}

export type ImageTaskState = TaskState<ImageGenerationResult>;
export type PromptTaskState = TaskState<PromptGenerationResult>;

const idleImageTask: ImageTaskState = {
  status: "idle",
  taskId: null,
  workerSessionId: null,
  startedAt: null,
  finishedAt: null,
  result: null,
  errorMessage: null
};
const idlePromptTask: PromptTaskState = {
  status: "idle",
  taskId: null,
  workerSessionId: null,
  startedAt: null,
  finishedAt: null,
  result: null,
  errorMessage: null
};

function createTaskId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createRunningTask<T>(): TaskState<T> {
  return {
    status: "submitting",
    taskId: createTaskId(),
    workerSessionId: null,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    result: null,
    errorMessage: null
  };
}

async function markTaskGenerating<T>(key: string, fallback: TaskState<T>, workerSessionId: string) {
  const current = await storageGet(key, fallback);
  await storageSet(key, {
    ...current,
    status: "generating",
    workerSessionId,
    errorMessage: null
  } satisfies TaskState<T>);
}

async function finishTask<T extends { ok: boolean }>(key: string, fallback: TaskState<T>, result: T) {
  const current = await storageGet(key, fallback);
  await storageSet(key, {
    ...current,
    status: result.ok ? "success" : "error",
    workerSessionId: null,
    finishedAt: new Date().toISOString(),
    result,
    errorMessage: result.ok ? null : ("message" in result && typeof result.message === "string" ? result.message : "任务失败。")
  } satisfies TaskState<T>);
}

async function failTask<T>(key: string, fallback: TaskState<T>, message: string) {
  const current = await storageGet(key, fallback);
  await storageSet(key, {
    ...current,
    status: "error",
    workerSessionId: null,
    finishedAt: new Date().toISOString(),
    result: null,
    errorMessage: message
  } satisfies TaskState<T>);
}

export async function startImageTask() {
  const task = createRunningTask<ImageGenerationResult>();
  await storageSet(IMAGE_TASK_KEY, task);
  return task.taskId;
}

export async function markImageTaskGenerating(workerSessionId: string) {
  await markTaskGenerating(IMAGE_TASK_KEY, idleImageTask, workerSessionId);
}

export async function finishImageTask(result: ImageGenerationResult) {
  await finishTask(IMAGE_TASK_KEY, idleImageTask, result);
}

export async function failImageTask(message: string) {
  await failTask(IMAGE_TASK_KEY, idleImageTask, message);
}

export async function getImageTask(): Promise<ImageTaskState> {
  return storageGet(IMAGE_TASK_KEY, idleImageTask);
}

export function subscribeImageTask(handler: (task: ImageTaskState) => void) {
  return subscribeStorage(IMAGE_TASK_KEY, idleImageTask, handler);
}

export async function clearImageTask() {
  await storageSet(IMAGE_TASK_KEY, idleImageTask);
}

export async function startPromptTask() {
  const task = createRunningTask<PromptGenerationResult>();
  await storageSet(PROMPT_TASK_KEY, task);
  return task.taskId;
}

export async function markPromptTaskGenerating(workerSessionId: string) {
  await markTaskGenerating(PROMPT_TASK_KEY, idlePromptTask, workerSessionId);
}

export async function finishPromptTask(result: PromptGenerationResult) {
  await finishTask(PROMPT_TASK_KEY, idlePromptTask, result);
}

export async function failPromptTask(message: string) {
  await failTask(PROMPT_TASK_KEY, idlePromptTask, message);
}

export async function getPromptTask(): Promise<PromptTaskState> {
  return storageGet(PROMPT_TASK_KEY, idlePromptTask);
}

export function subscribePromptTask(handler: (task: PromptTaskState) => void) {
  return subscribeStorage(PROMPT_TASK_KEY, idlePromptTask, handler);
}

export async function clearPromptTask() {
  await storageSet(PROMPT_TASK_KEY, idlePromptTask);
}

export async function recoverInterruptedTasks(workerSessionId: string) {
  const [imageTask, promptTask] = await Promise.all([getImageTask(), getPromptTask()]);
  const recoveryMessage = "后台服务已重新启动，上次任务未能继续。请重试。";
  const isStaleSubmission = (task: ImageTaskState | PromptTaskState) =>
    task.status === "submitting" &&
    task.startedAt !== null &&
    Date.now() - new Date(task.startedAt).getTime() > 30_000;

  if (isStaleSubmission(imageTask) || (imageTask.status === "generating" && imageTask.workerSessionId !== workerSessionId)) {
    await failImageTask(recoveryMessage);
  }
  if (isStaleSubmission(promptTask) || (promptTask.status === "generating" && promptTask.workerSessionId !== workerSessionId)) {
    await failPromptTask(recoveryMessage);
  }
}
