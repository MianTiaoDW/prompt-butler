import type { ExtensionSettings } from "../types/settings";
import type {
  PromptGenerationInput,
  PromptGenerationOutput,
  PromptGenerationResult,
  PromptOptimizationResult
} from "../types/prompt";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function buildUrl(baseUrl: string, path: string) {
  const normalizedBaseUrl = trimTrailingSlash(baseUrl.trim());
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${normalizedBaseUrl}${normalizedPath}`;
}

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);

  if (!match) {
    throw new Error("参考图格式无法识别，请重新上传。");
  }

  return {
    mediaType: match[1],
    data: match[2]
  };
}

function buildSystemPrompt() {
  return [
    "你是一个高级提示词导演，专门把角色设定与用户需求扩写成高质量图像提示词。",
    "你必须只返回 JSON，不要输出 Markdown、解释或额外前后缀。",
    "所有字段内容必须使用中文，包括 structuredPrompt 内所有子字段。",
    "JSON 结构必须如下：",
    "{",
    '  "cnPrompt": "中文完整提示词段落",',
    '  "enPrompt": "English prompt paragraph（仅此字段用英文）",',
    '  "structuredPrompt": {',
    '    "characterCore": { "identity": "身份（中文）", "appearance": "外貌描述（中文）", "personality": "性格特征（中文）" },',
    '    "sceneDesign": { "environment": "环境（中文）", "lighting": "光影风格（中文）", "camera": "镜头语言（中文）", "action": "动作描述（中文）" },',
    '    "styleDirectives": ["风格指令1（中文）", "风格指令2（中文）"],',
    '    "negativePrompt": ["负面提示1（中文）", "负面提示2（中文）"],',
    '    "usageNotes": ["使用建议1（中文）", "使用建议2（中文）"]',
    "  }",
    "}",
    "要求：cnPrompt 要自然具体可直接用于生图；enPrompt 要地道流畅；structuredPrompt 要高度结构化且所有内容用中文填写。"
  ].join("\n");
}

function buildUserPrompt(input: PromptGenerationInput) {
  const imageCount = input.referenceImages?.length ?? 0;
  const imageNote = imageCount > 0
    ? `【参考图说明】已附加 ${imageCount} 张参考图，请把它们作为构图、氛围或角色视觉参考。`
    : "【参考图说明】本次未提供参考图，请完全基于文字理解构建画面。";

  return [
    "请基于以下内容生成提示词。",
    "",
    "【角色设定】",
    input.rolePreset.trim(),
    "",
    "【用户需求】",
    input.userRequirement.trim(),
    "",
    imageNote,
    "",
    "输出时保持电影感、构图感、可执行性，并且适合高质量提示词工作流。"
  ].join("\n");
}

function buildOptimizationSystemPrompt() {
  return [
    "你是一位高级提示词优化师。",
    "你的任务是优化用户已经写好的提示词，让它更清晰、更有镜头感、更适合高质量视觉生成。",
    "保留原意，不要改变主题，不要输出解释，只输出优化后的完整提示词文本。"
  ].join("\n");
}

function buildOptimizationUserPrompt(content: string) {
  return [
    "请优化下面这段提示词，使它更具画面张力、结构更清晰、细节更可执行：",
    "",
    content.trim()
  ].join("\n");
}

function extractJsonText(rawText: string) {
  const fencedMatch = rawText.match(/```json\s*([\s\S]*?)```/i);

  if (fencedMatch) {
    return fencedMatch[1].trim();
  }

  const firstBraceIndex = rawText.indexOf("{");
  const lastBraceIndex = rawText.lastIndexOf("}");

  if (firstBraceIndex >= 0 && lastBraceIndex > firstBraceIndex) {
    return rawText.slice(firstBraceIndex, lastBraceIndex + 1);
  }

  return rawText.trim();
}

function normalizePromptOutput(rawText: string): PromptGenerationOutput {
  const jsonText = extractJsonText(rawText);

  try {
    const parsed = JSON.parse(jsonText) as Partial<PromptGenerationOutput>;

    return {
      cnPrompt: parsed.cnPrompt ?? rawText,
      enPrompt: parsed.enPrompt ?? rawText,
      structuredPrompt: {
        characterCore: {
          identity: parsed.structuredPrompt?.characterCore?.identity ?? "",
          appearance: parsed.structuredPrompt?.characterCore?.appearance ?? "",
          personality: parsed.structuredPrompt?.characterCore?.personality ?? ""
        },
        sceneDesign: {
          environment: parsed.structuredPrompt?.sceneDesign?.environment ?? "",
          lighting: parsed.structuredPrompt?.sceneDesign?.lighting ?? "",
          camera: parsed.structuredPrompt?.sceneDesign?.camera ?? "",
          action: parsed.structuredPrompt?.sceneDesign?.action ?? ""
        },
        styleDirectives: parsed.structuredPrompt?.styleDirectives ?? [],
        negativePrompt: parsed.structuredPrompt?.negativePrompt ?? [],
        usageNotes: parsed.structuredPrompt?.usageNotes ?? []
      }
    };
  } catch {
    return {
      cnPrompt: rawText,
      enPrompt: rawText,
      structuredPrompt: {
        characterCore: {
          identity: "",
          appearance: "",
          personality: ""
        },
        sceneDesign: {
          environment: "",
          lighting: "",
          camera: "",
          action: ""
        },
        styleDirectives: [],
        negativePrompt: [],
        usageNotes: ["模型未严格返回 JSON，已回退为原始文本"]
      }
    };
  }
}

function isHtmlBody(text: string) {
  const lower = text.trim().toLowerCase();
  return lower.startsWith("<!doctype") || lower.startsWith("<html") || lower.startsWith("<head") || lower.startsWith("<body");
}

async function parseErrorMessage(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    const text = await response.text().catch(() => "");
    if (isHtmlBody(text)) {
      return `接口返回了网页页面（HTTP ${response.status}），请检查 API Key 和 Base URL 是否正确配置。`;
    }
    const preview = text.slice(0, 300).trim();
    if (preview) {
      return `接口返回了非 JSON 响应（HTTP ${response.status}）：${preview}${text.length > 300 ? "..." : ""}`;
    }
    return `接口返回了非 JSON 响应（HTTP ${response.status}），可能是 Base URL 或端点路径不正确。`;
  }

  try {
    const data = (await response.json()) as Record<string, unknown>;
    const directMessage =
      typeof data.message === "string"
        ? data.message
        : typeof data.error === "string"
          ? data.error
          : null;

    if (directMessage) {
      return directMessage;
    }

    if (data.error && typeof data.error === "object" && data.error !== null) {
      const nestedMessage = (data.error as Record<string, unknown>).message;

      if (typeof nestedMessage === "string") {
        return nestedMessage;
      }
    }
  } catch {
    return response.statusText || "生成请求失败。";
  }

  return response.statusText || "生成请求失败。";
}

async function requestWithOpenAiCompatible(
  settings: ExtensionSettings,
  options: {
    systemPrompt: string;
    userPrompt: string;
    model: string;
    referenceImages?: Array<{ dataUrl: string; name: string }>;
  }
) {
  const baseUrl = trimTrailingSlash(settings.baseUrl.trim());
  const referenceImages = options.referenceImages ?? [];
  const content = referenceImages.length > 0
    ? [
        { type: "text" as const, text: options.userPrompt },
        ...referenceImages.map((img) => ({
          type: "image_url" as const,
          image_url: { url: img.dataUrl }
        }))
      ]
    : options.userPrompt;

  const body = JSON.stringify({
    model: options.model,
    temperature: 0.7,
    max_tokens: 2000,
    messages: [
      {
        role: "system",
        content: options.systemPrompt
      },
      {
        role: "user",
        content
      }
    ]
  });

  // 尝试多个可能的 chat completions 端点路径
  const pathsToTry = baseUrl.endsWith("/v1")
    ? ["/chat/completions"]
    : baseUrl.endsWith("/v1beta")
      ? ["/chat/completions"]
      : ["/v1/chat/completions", "/chat/completions"];

  let lastError: Error | null = null;

  for (const path of pathsToTry) {
    const endpoint = `${baseUrl}${path}`;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${settings.apiKey}`,
          "Content-Type": "application/json"
        },
        body
      });

      if (!response.ok) {
        lastError = new Error(await parseErrorMessage(response));
        continue;
      }

      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        lastError = new Error(await parseErrorMessage(response));
        continue;
      }

      const data = (await response.json()) as {
        choices?: Array<{
          message?: {
            content?: string | Array<{ type?: string; text?: string }>;
          };
        }>;
      };

      const messageContent = data.choices?.[0]?.message?.content;
      const rawText =
        typeof messageContent === "string"
          ? messageContent
          : Array.isArray(messageContent)
            ? messageContent
                .map((item) => item.text ?? "")
                .join("\n")
                .trim()
            : "";

      if (!rawText) {
        lastError = new Error("模型返回了空响应，请重试。");
        continue;
      }

      return {
        model: options.model,
        rawText
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("请求失败。");
    }
  }

  throw lastError ?? new Error("无法连接到聊天接口，请检查 Base URL 和模型配置。");
}

async function requestWithAnthropic(
  settings: ExtensionSettings,
  options: {
    systemPrompt: string;
    userPrompt: string;
    model: string;
    referenceImages?: Array<{ dataUrl: string; name: string }>;
  }
) {
  const baseUrl = trimTrailingSlash(settings.baseUrl);
  const endpoint = baseUrl.endsWith("/v1")
    ? `${baseUrl}/messages`
    : buildUrl(baseUrl, "/v1/messages");
  const referenceImages = options.referenceImages ?? [];
  const imageBlocks = referenceImages.map((img) => {
    const parsed = parseDataUrl(img.dataUrl);
    return {
      type: "image" as const,
      source: {
        type: "base64" as const,
        media_type: parsed.mediaType,
        data: parsed.data
      }
    };
  });
  const content = [
    { type: "text" as const, text: options.userPrompt },
    ...imageBlocks
  ];

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "x-api-key": settings.apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: options.model,
      max_tokens: 1800,
      system: options.systemPrompt,
      messages: [
        {
          role: "user",
          content
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  const data = (await response.json()) as {
    content?: Array<{ type?: string; text?: string }>;
  };

  const rawText = data.content
    ?.filter((item) => item.type === "text")
    .map((item) => item.text ?? "")
    .join("\n")
    .trim();

  return {
    model: options.model,
    rawText: rawText ?? ""
  };
}

async function requestWithGemini(
  settings: ExtensionSettings,
  options: {
    systemPrompt: string;
    userPrompt: string;
    model: string;
    referenceImages?: Array<{ dataUrl: string; name: string }>;
    responseMimeType?: string;
  }
) {
  const baseUrl = trimTrailingSlash(settings.baseUrl);
  const endpointRoot = baseUrl.endsWith("/v1beta") ? baseUrl : `${baseUrl}/v1beta`;
  const endpoint = `${endpointRoot}/models/${options.model}:generateContent?key=${encodeURIComponent(
    settings.apiKey
  )}`;
  const parts: Array<Record<string, unknown>> = [
    {
      text: `${options.systemPrompt}\n\n${options.userPrompt}`
    }
  ];

  const referenceImages = options.referenceImages ?? [];
  for (const img of referenceImages) {
    const image = parseDataUrl(img.dataUrl);
    parts.push({
      inlineData: {
        mimeType: image.mediaType,
        data: image.data
      }
    });
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts
        }
      ],
      generationConfig: {
        temperature: 0.7,
        responseMimeType: options.responseMimeType ?? "text/plain"
      }
    })
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };

  const rawText = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("\n")
    .trim();

  return {
    model: options.model,
    rawText: rawText ?? ""
  };
}

async function executeGeneration(settings: ExtensionSettings, input: PromptGenerationInput) {
  const hasImages = (input.referenceImages?.length ?? 0) > 0;
  const model = hasImages ? settings.visionModel : settings.reasoningModel;
  const options = {
    systemPrompt: buildSystemPrompt(),
    userPrompt: buildUserPrompt(input),
    model,
    referenceImages: input.referenceImages
  };

  if (settings.provider === "claude") {
    return requestWithAnthropic(settings, options);
  }

  if (settings.provider === "gemini") {
    return requestWithGemini(settings, {
      ...options,
      responseMimeType: "application/json"
    });
  }

  return requestWithOpenAiCompatible(settings, options);
}

export async function generatePromptFromProvider(
  settings: ExtensionSettings,
  input: PromptGenerationInput
): Promise<PromptGenerationResult> {
  const generatedAt = new Date().toISOString();

  if (!settings.apiKey.trim()) {
    return {
      ok: false,
      provider: settings.provider,
      model: (input.referenceImages?.length ?? 0) > 0 ? settings.visionModel : settings.reasoningModel,
      generatedAt,
      message: "API Key 为空，无法发起生成。"
    };
  }

  try {
    const { model, rawText } = await executeGeneration(settings, input);

    return {
      ok: true,
      provider: settings.provider,
      model,
      generatedAt,
      output: normalizePromptOutput(rawText)
    };
  } catch (error) {
    return {
      ok: false,
      provider: settings.provider,
      model: (input.referenceImages?.length ?? 0) > 0 ? settings.visionModel : settings.reasoningModel,
      generatedAt,
      message: error instanceof Error ? error.message : "生成失败。"
    };
  }
}

async function executeOptimization(settings: ExtensionSettings, content: string) {
  const options = {
    systemPrompt: buildOptimizationSystemPrompt(),
    userPrompt: buildOptimizationUserPrompt(content),
    model: settings.reasoningModel,
    referenceImageDataUrl: null
  };

  if (settings.provider === "claude") {
    return requestWithAnthropic(settings, options);
  }

  if (settings.provider === "gemini") {
    return requestWithGemini(settings, options);
  }

  return requestWithOpenAiCompatible(settings, options);
}

export async function optimizePromptWithProvider(
  settings: ExtensionSettings,
  content: string
): Promise<PromptOptimizationResult> {
  const optimizedAt = new Date().toISOString();

  if (!settings.apiKey.trim()) {
    return {
      ok: false,
      provider: settings.provider,
      model: settings.reasoningModel,
      optimizedAt,
      message: "API Key 为空，无法发起优化。"
    };
  }

  try {
    const { model, rawText } = await executeOptimization(settings, content);

    return {
      ok: true,
      provider: settings.provider,
      model,
      optimizedAt,
      output: rawText.trim()
    };
  } catch (error) {
    return {
      ok: false,
      provider: settings.provider,
      model: settings.reasoningModel,
      optimizedAt,
      message: error instanceof Error ? error.message : "优化失败。"
    };
  }
}
