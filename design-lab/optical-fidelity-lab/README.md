# Optical Fidelity Lab

“提示词生成管家”的隔离视觉实验。本目录只验证 Black Violet Optical UI 的五个核心组件，不是完整提示词库页面，也不连接正式插件的 Manifest、Content Script、Background、拖动缩放、存储或 API。

> 当前 Hero Icon 的最新决策以仓库根目录下的 [`docs/CODEX_HANDOFF.md`](../../docs/CODEX_HANDOFF.md) 为准。页面组件仍保留 Black Violet Optical 研究记录，但 Hero 图标已经调整为冷蓝主导、少量紫色点缀。

## 组件

1. Violet Upload Panel
2. Optical Command Bar
3. Optical Icon System
4. Prompt Asset Card V2
5. AI Processing Panel

界面中的文件、Prompt 和处理结果均标记为视觉原型或 Mock，不代表真实存储或正式能力。

## 本地预览

从仓库根目录运行：

```powershell
node node_modules/vite/bin/vite.js design-lab/optical-fidelity-lab --host 127.0.0.1 --port 4179
```

独立截图路由：

- `?shot=upload`：参考 A / Violet Upload Panel 对比
- `?shot=command`：参考 B / Optical Command Bar 对比
- `?shot=icons`：IconSax 状态与图标清单
- `?shot=hero-icons-v10`：Apple Optical 六枚生成型 Hero 图标与 48px 检查
- `?shot=hero-icons-v11`：Gradient Ribbon 六枚生成型 Hero 图标与 48px 检查
- `?shot=card`：Prompt Asset Card V2
- `?shot=card-hover`：可由真实指针触发 Hover 的 Prompt Asset Card V2
- `?shot=ai`：AI Processing Panel
- `?shot=states`：五个组件的完整状态
- `?shot=reduced`：Reduced Motion / Reduced Transparency

## Hero Icon 候选资产

当前系统包含 AI Spark、Warning、Success、Upload、Processing、Command Entry 六种语义。统一使用深黑 / 深蓝黑大圆角光学底板，内部符号以冷蓝为主、少量紫色点缀，冰白只用于折射高光和透光核心。

最新候选汇总图位于 `artifacts/hero-icon-material-bright-v7.png`，小尺寸检查图位于 `artifacts/hero-icon-material-bright-v7-small.png`。该版本尚未被用户确认为最终稿，不能直接视为正式插件资产。

最新结构探索位于 `artifacts/hero-icon-shape-study-v8.svg` 和 `artifacts/hero-icon-shape-study-v8.png`。该稿使用手工 SVG 锁定符号轮廓，包含 64px / 48px 检查样本，只用于确认语义、比例和系列感，不代表最终材质。

V11 生成型候选位于 `artifacts/*-gradient-ribbon-v11.png`，整组与 48px 汇总检查位于 `artifacts/gradient-ribbon-icon-system-v11.png`。该组用连续渐变缎带、负空间和局部折叠表达六种功能语义，目前仍是实验室候选，未迁移到正式插件。

早期整套组件成果总览归档为 `artifacts/optical-fidelity-lab-overview-legacy.png`，只用于追溯，不代表当前图标方向。

`assets/` 同时保留早期 AI Processing、Warning、Success、Upload 的 WebP / AVIF、透明抠图与原始生产 Sprite，用于追溯设计迭代。绿色底图是生产过程中的抠图源，不是交付成品。图标本体不持续动画，CSS 只负责容器环境光和状态反馈。

## 文档

- [IMPLEMENTATION_SPEC.md](./IMPLEMENTATION_SPEC.md)：Token、CSS 层级、状态与性能规范
- [SOURCE_AND_LICENSE_AUDIT.md](./SOURCE_AND_LICENSE_AUDIT.md)：公开资源代码、依赖与许可证核查
