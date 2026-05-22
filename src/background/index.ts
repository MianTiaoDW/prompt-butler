import { cancelImageGeneration, downloadImages, generateImagesWithProvider } from "./image-generator";
import { detectProviderModels } from "./model-discovery";
import { generatePromptFromProvider } from "./prompt-generator";
import { optimizePromptWithProvider } from "./prompt-generator";
import { testProviderConnection } from "./provider-health";
import { finishImageTask, finishPromptTask } from "../lib/task-broker";
import { importSeedPrompts, ensureSeedCategories } from "../lib/prompt-library";
import { SEED_PROMPTS } from "../lib/seed-prompts";
import type { RuntimeRequestMessage } from "../types/runtime";

console.log("[Prompt Butler] Service Worker 启动中...");

const APP_WINDOW_PATH = "options.html?view=app";

let appWindowUrlPattern: string;
try {
  appWindowUrlPattern = `${chrome.runtime.getURL("options.html")}*`;
} catch (error) {
  console.error("[Prompt Butler] 初始化失败：", error);
  appWindowUrlPattern = "";
}

async function getExistingAppWindowId() {
  if (!appWindowUrlPattern) return null;

  const tabs = await chrome.tabs.query({ url: appWindowUrlPattern });
  const tabWithWindow = tabs.find((tab) => typeof tab.windowId === "number");
  return tabWithWindow?.windowId ?? null;
}

async function openOrFocusAppWindow() {
  const existingWindowId = await getExistingAppWindowId();

  if (existingWindowId !== null) {
    await chrome.windows.update(existingWindowId, { focused: true });
    return;
  }

  await chrome.windows.create({
    url: APP_WINDOW_PATH,
    type: "popup",
    width: 460,
    height: 760
  });
}

async function tryImportSeedPrompts() {
  // 角色设定种子提示词归入"收藏"（角色设定 tab 是 AI 生成工具，不放浏览器视图）
  const remapped = SEED_PROMPTS.map((p) =>
    p.category === "角色设定" ? { ...p, category: "收藏" } : p
  );
  const seedCategories = [...new Set(remapped.map((p) => p.category))];
  await ensureSeedCategories(seedCategories);
  const count = await importSeedPrompts(remapped);
  if (count > 0) {
    console.log(`[Prompt Butler] 已导入 ${count} 条内置提示词，分类：${seedCategories.join("、")}`);
  }
}

// 首次安装时导入
chrome.runtime.onInstalled.addListener(() => {
  console.log("[Prompt Butler] 扩展已安装。");
  void tryImportSeedPrompts();
});

// 每次 Service Worker 启动也检查（覆盖已安装但未导入的情况）
void tryImportSeedPrompts();

chrome.action.onClicked.addListener(() => {
  void openOrFocusAppWindow();
});

chrome.runtime.onMessage.addListener((message: RuntimeRequestMessage, _sender, sendResponse) => {
  void (async () => {
    try {
      if (message.type === "provider:test-connection") {
        const result = await testProviderConnection(message.payload.settings);
        sendResponse(result);
        return;
      }

      if (message.type === "provider:detect-models") {
        const result = await detectProviderModels(message.payload.settings);
        sendResponse(result);
        return;
      }

      if (message.type === "prompt:generate") {
        const result = await generatePromptFromProvider(
          message.payload.settings,
          message.payload.input
        );
        await finishPromptTask(result);
        sendResponse(result);
        return;
      }

      if (message.type === "prompt:optimize") {
        const result = await optimizePromptWithProvider(
          message.payload.settings,
          message.payload.content
        );
        sendResponse(result);
        return;
      }

      if (message.type === "image:generate") {
        const result = await generateImagesWithProvider(
          message.payload.settings,
          message.payload.input
        );
        await finishImageTask(result);
        sendResponse(result);
        return;
      }

      if (message.type === "image:cancel") {
        cancelImageGeneration();
        sendResponse({ ok: true });
        return;
      }

      if (message.type === "image:download") {
        const result = await downloadImages(message.payload.urls);
        sendResponse(result);
        return;
      }

      if (message.type === "open-options-page") {
        await chrome.tabs.create({ url: chrome.runtime.getURL("options.html") });
        sendResponse({ ok: true });
        return;
      }

      sendResponse(null);
    } catch (error) {
      console.error("[Prompt Butler] 消息处理异常：", error);
      sendResponse({
        ok: false,
        message: error instanceof Error ? error.message : "后台处理异常。"
      });
    }
  })();

  return true;
});
