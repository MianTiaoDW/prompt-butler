import type { RuntimeRequestMessage } from "../types/runtime";

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export async function sendRuntimeMessage<TResponse>(message: RuntimeRequestMessage) {
  if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) {
    throw new Error("当前环境不支持 chrome.runtime.sendMessage。");
  }

  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await new Promise<TResponse>((resolve, reject) => {
        chrome.runtime.sendMessage(message, (response: TResponse) => {
          const runtimeError = chrome.runtime.lastError;

          if (runtimeError) {
            reject(new Error(runtimeError.message));
            return;
          }

          resolve(response);
        });
      });

      return result;
    } catch (error) {
      const isConnectionError =
        error instanceof Error && error.message.includes("Receiving end does not exist");

      if (isConnectionError && attempt < maxAttempts) {
        await delay(1000 * attempt);
        continue;
      }

      throw error;
    }
  }

  throw new Error("连接后台服务失败，请刷新页面后重试。");
}

export function sendRuntimeMessageLong<TResponse>(
  message: RuntimeRequestMessage,
  pollFn: () => Promise<TResponse | null>
): Promise<TResponse> {
  return new Promise((resolve, reject) => {
    // 先尝试 sendMessage（Worker 活跃时最快）
    chrome.runtime.sendMessage(message, (response: TResponse) => {
      const runtimeError = chrome.runtime.lastError;
      if (!runtimeError && response) {
        resolve(response);
      }
    });

    // 同时启动轮询（Worker 被杀后靠这个拿到结果）
    let attempts = 0;
    const maxAttempts = 60; // 最多轮询 60 次（120 秒）
    const poll = setInterval(async () => {
      attempts++;
      try {
        const result = await pollFn();
        if (result) {
          clearInterval(poll);
          resolve(result);
        }
      } catch {
        // 轮询失败继续重试
      }
      if (attempts >= maxAttempts) {
        clearInterval(poll);
        reject(new Error("请求超时，请重试。"));
      }
    }, 2000);
  });
}
