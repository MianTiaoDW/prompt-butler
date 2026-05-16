import type { RuntimeRequestMessage } from "../types/runtime";

export function sendRuntimeMessage<TResponse>(message: RuntimeRequestMessage) {
  return new Promise<TResponse>((resolve, reject) => {
    if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) {
      reject(new Error("当前环境不支持 chrome.runtime.sendMessage。"));
      return;
    }

    chrome.runtime.sendMessage(message, (response: TResponse) => {
      const runtimeError = chrome.runtime.lastError;

      if (runtimeError) {
        reject(new Error(runtimeError.message));
        return;
      }

      resolve(response);
    });
  });
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
