# Codex 跨设备交接

更新日期：2026-07-21
工作分支：`codex/optical-fidelity-lab`

## 版本基准

- 以家用电脑当前本地 `main`（`b2c3f04`）已经构建出的功能与视觉效果为准。
- GitHub `origin/main`（核对时为 `01eec13`）是旧版，不得用远端旧文件覆盖当前本地实现。
- 当前工作分支已经快进到本地 `main`，因此同时保留现有正式插件功能基线，并在其上增加隔离 Optical Fidelity Lab。
- 后续如发现文档、截图或远端代码与当前本地运行效果冲突，以当前本地实现和用户最新明确决定为准；冲突必须先报告，不得静默回退。

## 当前目标

继续建立“提示词生成管家”的 Optical Hero Icon System。本阶段只处理隔离视觉原型和图标资产，不迁移到正式浏览器扩展。

## 严格边界

- 不修改 Manifest、Content Script、Background、拖动缩放、存储或 API。
- 不把 Lab 组件或资产自动接入正式插件。
- 不新增账号、同步、云存储、容量等不存在的产品能力。
- 不提交本机临时附件、Codex 对话数据库、密钥或浏览器数据。

## 已确认的视觉方向

- 产品名称使用“提示词生成管家”。
- Hero 图标使用深黑 / 深蓝黑的大圆角光学底板；保留早期版本厚实、暗色、带细密表面纹理和局部折射边缘的质感。
- 内部符号以冷蓝为主，混入少量紫色；冰白只用于高光和透光核心。
- 禁止整块偏紫、平均紫色外圈、全局紫色蒙层、绿色幕布成品和廉价线性图标库造型。
- 内部符号必须优先保证用户可理解，再增加克制的两层树脂、折射、遮挡和细微纹理。
- 图标不能过大、过度立体或持续强发光，不能抢过页面主操作。

## 六枚 Hero 图标语义

1. AI Spark：AI 生成 / AI 优化。
2. Warning：警告 / 需要注意。
3. Success：完成 / 成功。
4. Upload：上传文件或素材。
5. Processing：处理中 / 生成中。
6. Command Entry：进入命令、提交指令或启动操作。

## 形态决策

- AI Spark：保留两枚相扣弧形主体与右上圆点的方向。
- Upload：保留文件穿过水平轨道 / 门环并带底部圆点的方向。
- Processing：保留三个旋转弧段；中心必须干净，不得出现意外小箭头。
- Warning、Success、Command Entry 已完成新一轮语义化重设计，但仍需结合小尺寸可读性继续验收。
- 黑色大圆角底板作为系列统一容器，后续只允许精修材质，不随意改变比例和轮廓。

## 当前候选稿

- 最新高亮候选：`design-lab/optical-fidelity-lab/artifacts/hero-icon-material-bright-v7.png`
- 小尺寸检查图：`design-lab/optical-fidelity-lab/artifacts/hero-icon-material-bright-v7-small.png`
- 上一版保留稿：`design-lab/optical-fidelity-lab/artifacts/hero-icon-full-redesign-v6.png`

`v7` 只提高了内部符号的亮度、冰蓝乳白透光核心和背景分离度。它尚未被用户明确宣布为最终稿，不得据此直接拆分正式资产。

## 当前完成情况

- 隔离 Lab 页面、组件状态、截图和实现规范已存在。
- 六枚 Hero 图标已形成汇总候选稿。
- 图标方向经过多轮参考与语义调整。
- 最新亮色版本已保存，同时保留上一版用于回退。
- 当前资产与代码没有迁移到正式插件。

## 下一步

1. 让用户确认 `v7` 的亮度是否合适，以及 Warning、Success、Command Entry 是否足够直观。
2. 如需修改，只改用户指出的形态或颜色，不重做已经锁定的底板。
3. 用户明确说“OK”后，再将最终汇总稿拆分为六枚透明背景资产。
4. 为每枚图标导出 1x / 2x / 3x PNG，并按需要补充 WebP / AVIF。
5. 检查透明边缘、暗色背景适配、小尺寸识别性和系列一致性。
6. 更新来源说明与人工微调清单；停止，不自动迁移正式插件。

## 接续任务的启动提示

在另一台电脑打开本仓库和本分支后，对 Codex 说：

> 请完整阅读 `AGENTS.md`、`docs/CODEX_HANDOFF.md`、`design-lab/optical-fidelity-lab/README.md` 和 `design-lab/optical-fidelity-lab/IMPLEMENTATION_SPEC.md`，再检查 Git 状态和最新候选图。继续 Optical Hero Icon System，不要迁移正式插件，也不要推翻已经锁定的底板和三枚核心形态。

## 本地验证

从仓库根目录执行：

```powershell
npm install
node node_modules/vite/bin/vite.js design-lab/optical-fidelity-lab --host 127.0.0.1 --port 4179
```

Lab 自身依赖位于 `design-lab/optical-fidelity-lab/package.json`。正式插件构建通过与否不能替代本轮视觉资产验收。
