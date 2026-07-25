import type { PromptSkillId } from "../types/prompt";

export interface PromptSkillProfile {
  id: PromptSkillId;
  name: string;
  summary: string;
  systemDirective: string;
}

export const PROMPT_SKILL_PROFILES: PromptSkillProfile[] = [
  {
    id: "standard",
    name: "通用提示词",
    summary: "将需求整理为清晰、完整、可直接使用的图像提示词。",
    systemDirective: "优先保证主体、场景、风格、光线与画面重点清晰完整。"
  },
  {
    id: "cinematic-image",
    name: "电影级视觉提示词",
    summary: "基于本地 cinematic-prompt-director 的镜头、光影与材质工作流。",
    systemDirective: [
      "先确定一个主导情绪与观者位置，再组织主体、动作、前中后景。",
      "明确镜头距离、视角、光源方向、曝光行为、克制的色彩与材质表现。",
      "避免使用‘8K’、‘史诗级’、‘高质量’等无执行意义的空泛词。",
      "负面提示只保留与本次画面真正相关的约束。"
    ].join("\n")
  }
];

export function getPromptSkillProfile(id?: PromptSkillId) {
  return PROMPT_SKILL_PROFILES.find((profile) => profile.id === id)
    ?? PROMPT_SKILL_PROFILES[0];
}
