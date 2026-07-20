# 提示词生成管家 - 项目规则

本文件与 `AGENTS.md` 保持一致，供另一台电脑上的编码代理读取。

## 开始工作前

1. 阅读 `docs/CODEX_HANDOFF.md`。
2. 执行 `git status --short --branch` 和 `git log -5 --oneline --decorate`。
3. 当前可接续分支是 `codex/optical-fidelity-lab`；在合并前，不得以旧版 `origin/main` 覆盖它。

## 核心约束

- Chrome/Edge Manifest V3；正式名称为“提示词生成管家”。
- React 18、TypeScript、Vite、Tailwind CSS、Framer Motion、react-rnd、CRXJS。
- 所有 AI 请求经 Background Service Worker；Content Script 不直连外部 API。
- 设置和提示词使用 `chrome.storage.local`，会话状态使用 `chrome.storage.session`，持久示例图 Blob 使用扩展 Origin IndexedDB。
- 正式插件图标沿用 `lucide-react`；Design Lab 依赖保持隔离。
- 不新增账号、云同步、容量、在线状态等未经确认的能力。
- `design-lab/` 与 `ui-pattern-atlas/` 不得自动接入正式插件。
- 生成结果保持临时；只有用户明确保存才持久化。
- 不提交密钥、本机配置、依赖目录、构建输出或临时日志。

## 工作方式

- 只改任务要求涉及的文件，不顺手重构。
- 当前正式插件代码和实际运行效果优先于旧截图与历史需求文档。
- Apple Optical 与 Hero Icon 决策以 `docs/CODEX_HANDOFF.md` 和 Lab README 为准。
- 构建前执行 `npm run typecheck` 与 `npm run build`；构建通过不等于浏览器验收通过。
- 正式交互改动仍需在 Chrome/Edge 加载 `dist` 完成真实流程验收。
