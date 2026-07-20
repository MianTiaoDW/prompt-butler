# Black Violet Optical UI 实现规范

> 状态说明：本文保留页面组件的 Black Violet Optical 实现研究。Hero Icon System 后续已调整为冷蓝主导、少量紫色点缀；其最新语义、形态与交付边界以 [`../../docs/CODEX_HANDOFF.md`](../../docs/CODEX_HANDOFF.md) 为准。

## 1. 语义颜色 Token

| 语义 | Token | 值 |
| --- | --- | --- |
| 最深背景 | `--ink-1000` | `#02030A` |
| 主背景 | `--ink-950` | `#050611` |
| Raised 表面 | `--surface-raised` | `rgba(16,18,33,.94)` |
| Recessed 表面 | `--surface-recessed` | `rgba(3,4,14,.82)` |
| 品牌主紫 | `--violet-500` | `#7868FF` |
| 选中 / 强调紫 | `--violet-400` | `#9C91FF` |
| 环境蓝 | `--blue-500` | `#4D67FF` |
| 冰白核心 | `--ice-100` | `#FFFFFF` |
| 主文字 | `--text-primary` | `#F6F5FF` |
| 次文字 | `--text-secondary` | `#B8BAD0` |
| 收藏 | `--rose-500` | `#F05F9B` |
| 真实成功 | `--success-500` | `#46C989` |
| 警告 | `--warning-500` | `#D9A154` |
| 错误 | `--error-500` | `#D75F8E` |

绿色只出现在真实 Success；不承担品牌、选中或主按钮含义。

## 2. 圆角、描边与阴影

- `--radius-sm: 10px`：小按钮、Tag
- `--radius-md: 15px`：图标底、普通控件
- `--radius-lg: 22px`：命令栏、进度腔
- `--radius-xl: 30px`：Inspector / 展示面
- `--radius-optical: 38px`：Violet Upload Panel 外壳
- 普通发丝描边：`rgba(221,221,255,.10)`；仅作为材质边缘，不画完整高亮白框。
- 光学描边：`rgba(164,153,255,.25)`；只用于关键组件。
- 折射高光：顶部 / 左侧局部 `rgba(246,245,255,.14–.34)`。
- Raised：`0 18px 44px rgba(0,0,0,.34)`。
- Optical：`0 34px 86px rgba(0,0,0,.58)` + 局部紫蓝下方 Bloom。

## 3. CSS 层级结构

Violet Upload Panel 不允许退化成一层 `background + border + box-shadow`：

1. `upload-ambient`：组件外部大范围蓝紫环境场。
2. `upload-lower-bloom`：底部体积光，只提供空间锚点。
3. `upload-shell`：厚实黑色外壳和整体阴影。
4. `upload-shell::before`：用 mask 形成非均匀折射边缘。
5. `upload-volume`：外壳内部暗紫体积光。
6. `upload-refractive-edge`：顶部 / 侧边的局部折射线。
7. `upload-content`：文字、静态 3D 图标和操作层。
8. `progress-chamber`：内凹腔体。
9. `progress-violet`：紫色外晕。
10. `progress-core`：2–4px 冰白发光核心。

AI Processing Panel 复用 3–7 层，但只在 Processing 增强 `ai-volume`；Complete / Error 收敛为状态描边，不持续发光。

## 4. 状态与动画

| 状态 | 规则 | 时长 / easing |
| --- | --- | --- |
| Hover | `translateY(-2–5px)`、底色提亮一级、阴影增强、操作显现 | `200ms cubic-bezier(.16,1,.3,1)` |
| Selected | 不浮动；稳定紫蓝归属面、3px 低饱和光带、IconSax Bulk | `200ms` 颜色 / 阴影过渡 |
| Pressed | 即刻压至 `scale(.97–.985)`；阴影缩短 | `120ms cubic-bezier(.2,0,0,1)` |
| Focus | 内部紫蓝光轻微增长，不做强外发光 | `320ms cubic-bezier(.16,1,.3,1)` |
| Processing | 仅 transform / opacity / spinner；白紫核心可循环 | spinner `800ms linear`，体积光 `2.8s` alternate |
| Complete | 循环光效停止，允许真实 Success 绿 | `200ms` 收敛 |
| Error | 紫红而非纯红；不闪烁 | `200ms` |

动态状态必须可被新输入覆盖；CSS transition 从当前呈现值继续，不锁定交互。Hover 仅在 `(hover:hover) and (pointer:fine)` 启用。

## 5. 图标

- 默认：IconSax Linear。
- 选中：同一图标的 Bulk 或 Bold。
- AI 特殊状态：TwoTone。
- 小操作 18px，普通控制 20px，主导航 22px。
- 不给每个 SVG 加发光滤镜；只允许状态容器承担局部光。
- AI Processing / Warning / Success / Upload 使用 1x/2x WebP/AVIF 静态 3D 资产；本体不持续动画。

## 6. 性能影响

- 长列表卡片不使用 `backdrop-filter`；Prompt Asset Card 由预计算渐变和阴影构成。
- 模糊只出现在 Violet Upload Panel、Command Bar、AI Processing Panel 这些关键组件；每个视口建议同时不超过 2 个活跃光学面。
- 3D 图标采用 AVIF/WebP：1x 约 2.7–3.7 KB，2x 约 5.8–10.9 KB；浏览器优先 AVIF。
- 互动动画只改 `transform` / `opacity`；不逐帧改 CSS 继承变量，不运行 Canvas / WebGL。
- Processing 循环在面板关闭、完成、错误、页面不可见或 Reduced Motion 下停止。真实落地时用 `visibilitychange` 暂停任何 JS timer。
- `iconsax-reactjs` 源包较大，必须保持具名 import 和 tree-shaking；不得 `import * as Icons`。

## 7. Reduced modes

- `prefers-reduced-motion: reduce`：取消扫光、漂移、弹性位移；保留静态状态色和短淡化反馈。
- `prefers-reduced-transparency: reduce`：关键表面改为近实色 `#0B0C19`，禁用 blur；环境 Bloom 降至约 24%。
- `prefers-contrast: more`：表面改用更明确的冰白描边，不依赖透明度区分。

## 8. 轻量落地边界

这套规范可作为真实前端的组件实现依据，但当前 Lab 不会自动迁移。迁移前必须单独通过五个组件视觉验收，并另开实现任务；不得顺带修改 Manifest、Content Script、Background、拖动缩放、存储或 API。
