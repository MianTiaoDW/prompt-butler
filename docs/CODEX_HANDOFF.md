# Codex 跨设备交接（唯一入口）

更新日期：2026-07-21

最新开发分支：`codex/optical-fidelity-lab`

仓库：`https://github.com/MianTiaoDW/prompt-butler`

## 先说结论

- GitHub 的 `origin/main` 目前仍是旧版；不要在公司电脑直接从 `main` 继续。
- 在当前分支合并前，`origin/codex/optical-fidelity-lab` 是正式插件最新本地功能、当前视觉、两套隔离 Design Lab、测试截图和交接文档的共同基准。
- Codex 聊天记录和本机安装的 Skill 不由 Git 同步。本文件把继续工作所需的决策和边界写入仓库，公司 Codex 不应依赖旧聊天猜测。

## 公司电脑首次接续

```powershell
git clone https://github.com/MianTiaoDW/prompt-butler.git
cd prompt-butler
git fetch origin
git switch --track origin/codex/optical-fidelity-lab
npm install
npm run typecheck
npm run build
```

若公司电脑已经克隆过旧仓库：

```powershell
git status --short --branch
git fetch origin
git switch codex/optical-fidelity-lab
git pull --ff-only
npm install
npm run build
```

切分支前若 `git status` 有公司电脑自己的修改，不要覆盖；先提交到独立分支或暂存并说明来源。

给公司 Codex 的第一条指令：

> 完整阅读 `AGENTS.md`、`docs/CODEX_HANDOFF.md`、`README.md`，检查当前分支、Git 状态和最近提交。以 `codex/optical-fidelity-lab` 为最新基准，不要用旧版 main 回退。继续前先说明你看到的正式插件状态、Design Lab 边界和尚未完成的浏览器验收。

## 仓库中已经保留的内容

### 正式插件

- 提示词生成、中文/英文/结构化结果、Prompt 预览与保存。
- 提示词库、收藏夹、搜索、导入/导出、编辑、复制和 AI 优化。
- 图像工坊、生成历史、下载、Prompt 保存和示例图显式保存。
- 配置中心、服务商健康检查、模型发现以及 Background 请求编排。
- Windows 可选原生置顶辅助程序及安装/卸载脚本。
- `ui-pattern-atlas/` 站内 UI 知识图谱。

数据事实：设置和 Prompt 使用 `chrome.storage.local`；会话状态使用 `chrome.storage.session`；明确保存的示例图 Blob 使用扩展 Origin IndexedDB。不存在账号、云同步、云容量或跨电脑自动数据同步。

### 隔离视觉实验

1. `design-lab/apple-optical-library/`
   - 420 单列、680 双栏、980 三栏。
   - Hover、Selected、Pressed、Loading、AI Inspector、Modal、reduced-motion、reduced-transparency。
   - 截图与 `IMPLEMENTATION_SPEC.md` 已保留。
2. `design-lab/optical-fidelity-lab/`
   - 光学上传、命令栏、Prompt 卡片、AI Processing 与图标系统。
   - 多轮 Hero Icon 候选、可编辑 SVG、100%/小尺寸检查图、原始生产素材和来源审计。
   - 根目录旧命名截图已归档为 `artifacts/optical-fidelity-lab-overview-legacy.png`。

两套 Lab 都不连接 Manifest、Content Script、Background、拖动缩放、存储或 API，不得自动迁移到正式插件。

## 当前 Hero Icon 决策

- 系列使用深黑/深蓝黑大圆角光学底板；内部符号冷蓝为主、少量紫色，冰白只做高光核心。
- 禁止整块偏紫、平均紫色外圈、绿色幕布成品、廉价通用线性图标造型和过度发光。
- 内部符号先保证可理解，再增加克制的树脂、折射、遮挡和纹理。
- AI Spark：两枚相扣弧形主体与右上圆点。
- Upload：文件穿过水平轨道/门环并带底部圆点。
- Processing：三个旋转弧段，中心必须干净，不得出现小箭头。
- Warning、Success、Command Entry 仍需继续做小尺寸语义验收。

候选顺序：

1. `artifacts/hero-icon-shape-study-v8.svg/.png`：手工 SVG 结构草案，检查语义、比例和 64/48px 可读性；不是最终材质。
2. `artifacts/hero-icon-material-bright-v7.png`：当前高亮材质候选；尚未最终确认。
3. `artifacts/hero-icon-full-redesign-v6.png`：上一版回退稿。

用户明确说“OK”前，不拆分为正式插件资产，不迁移代码。

## 继续图标工作时所需 Skill

- 必须优先使用：`apple-design`、`emil-design-eng`。
- 适合审查/设计指导：`ai-design-director`、`design-audit`、`ui-pattern-atlas`。
- 需要生成或编辑位图时：`imagegen`。

这些 Skill 是 Codex 本机安装项，不在 Git 仓库内。公司电脑缺失时需另行安装；缺失并不影响拉取、构建和阅读已有资产。

## 验证命令

正式插件：

```powershell
npm run typecheck
npm run build
```

Apple Optical Library：

```powershell
npx vite design-lab/apple-optical-library --host 127.0.0.1 --port 4178
```

Optical Fidelity Lab：

```powershell
npm --prefix design-lab/optical-fidelity-lab install
node node_modules/vite/bin/vite.js design-lab/optical-fidelity-lab --host 127.0.0.1 --port 4179
```

2026-07-21 本地验证：`npm run typecheck`、正式插件 `npm run build`、Apple Optical Library 构建、Optical Fidelity Lab 构建、`ui-pattern-atlas` 构建均通过。Apple 原型构建只有 Framer Motion `use client` 被忽略的非阻塞警告。

静态构建不能替代 Chrome/Edge 实际验收；公司电脑首次接续后应加载最新 `dist`，至少检查打开工作台、配置状态、提示词生成、收藏、图像工坊、显式保存示例图和可选置顶流程。

已知但本轮不擅自修改的问题：根 `package.json` 版本为 `1.2.0`，`manifest.config.ts` 仍为 `1.0.3`。这是当前代码中的元数据不一致，不影响本地构建，但下次正式发布前必须统一版本号并明确发布策略。

## 不进入 GitHub 的内容

- `node_modules/`、所有 `dist/`、本机 `.claude/`、`.firecrawl/`、临时日志、`.env*`、ZIP 与 DOCX。
- 这些内容是可再生构建产物、本机私有配置或非源码附件；缺少它们不影响公司电脑从仓库恢复项目。
