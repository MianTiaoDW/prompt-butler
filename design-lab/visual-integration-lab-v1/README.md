# Visual Integration Lab V1.3

这是创作工作区与提示词库的独立视觉整合实验室，不是正式插件页面。它只组合冻结的 Gradient Ribbon Glyph、Design Token、实验组件和 420 / 680 / 980 既定信息架构；不读取或写入 Chrome Storage、IndexedDB、API、Manifest、Content Script 或 Background。

V1.2 明确以 `design-lab/optical-fidelity-lab/artifacts/optical-fidelity-lab-summary.png` 及其真实 React/CSS 组件为唯一视觉基准。响应式母版保留黑紫内凹表面、紫蓝污染光、冰白核心高光、Violet Upload Panel、Optical Command Bar、Prompt Asset Card 与 AI Processing Panel 的材质关系；不再另起冷蓝扁平视觉语言。六枚 Ribbon Glyph 的几何轮廓、符号含义、构图与源资产没有修改。

## 运行

```powershell
cd design-lab/visual-integration-lab-v1
npm install
npm run assets
npm run build
npm run dev
```

## 截图路由

| Query | 内容 |
| --- | --- |
| `?shot=icons` | 六枚透明 Ribbon Glyph、浅/深背景及 48px 证明 |
| `?shot=master-420` | 420px 单列提示词资产列表 |
| `?shot=master-680` | 680px 列表 + 详情双栏 |
| `?shot=master-980` | 980px 资料库 + 列表 + 详情三栏 |
| `?shot=creator-420` | 420px 创作输入 + 纵向结果流 |
| `?shot=creator-680` | 680px 创作输入 + 生成结果双栏 |
| `?shot=creator-980` | 980px 完整创作工作台 |
| `?shot=prompt-modal` | 420px Prompt 详情 Modal |
| `?shot=command-focus` | Optical Command Bar Focus |
| `?shot=card-states` | Prompt Card Default / Hover / Selected |
| `?shot=ai-processing` | AI Inspector Closed / Open / Processing / Complete |
| `?shot=upload-states` | Upload Idle / Uploading / Success / Error |
| `?shot=status-states` | Success / Warning 信息状态 |
| `?shot=button-states` | 主按钮 Default / Hover / Pressed / Loading |
| `?shot=reduced-motion` | Reduced Motion 强制预览 |
| `?shot=reduced-transparency` | Reduced Transparency 强制预览 |
| `?shot=functional-motion-icons` | 搜索、设置、复制、收藏、删除、展开、显隐、下载功能动态图标 |
| `?shot=functional-motion-icons-reduced` | 功能图标 Reduced Motion 强制预览 |
| `?shot=integration-summary` | 参考图、生成组件、响应式母版、冻结图标与状态的单张成果汇总板 |

## Ribbon Icon 冻结与资产路径

- 黑底原始批准稿：`assets/ribbon-icons/v1/source/`
- 透明高分辨率母版：`assets/ribbon-icons/v1/master/`
- 运行时 PNG / WebP：`assets/ribbon-icons/v1/48/`、`64/`、`96/`、`128/`
- 来源哈希、透明度校验及尺寸归一记录：`assets/ribbon-icons/v1/manifest.json`
- 可复现构建脚本：`scripts/build-ribbon-assets.mjs`

几何轮廓、符号含义与构图保持冻结。构建脚本只执行黑底透明度恢复、等比缩放、居中、小尺寸 Lanczos 重采样与轻度锐化。六枚 Glyph 的有效视觉长边统一为 880px；Warning 仅按该规则等比放大，不改变内部几何。PNG 与 WebP 的画布均透明，不含底框。

## Token

全部实验组件的色彩、表面、阴影、圆角、间距、排版和动画来自 `tokens.css`。主色结构为：

- 深蓝黑与负空间：页面、外壳、列表表面；
- 冷蓝：交互焦点、选中、进度和关键动作；
- 紫色：仅位于光学渐变末端及局部折射；
- 冰白：核心高光与关键进度；
- 绿色：仅 Success 语义；
- Rose：仅收藏语义；
- Warning / Error：各自独立的克制语义色。

普通搜索、设置、复制、编辑、收藏、删除、文件夹、筛选、排序、返回和更多继续使用 IconSax。Ribbon Glyph 只用于 AI、上传、处理、成功、警告和命令入口。

## Functional Motion Icons V1

首批功能图标覆盖搜索、设置、复制、收藏、删除、展开 / 收起、显示 / 隐藏和下载。实现直接建立在实验室已有 IconSax 上，没有安装完整 AnimateIcons 运行时，也没有改动正式插件图标依赖。动效只承担语义反馈：Hover 轻探、短距离旋转、状态交叉淡入、持久方向切换和一次性完成反馈；不自动循环，不使用弹簧弹跳，不修改六枚冻结 Ribbon Glyph。

Pointer Down 会立即缩放反馈；Hover 动效只在精确指针设备上启用；Reduced Motion 模式会去除旋转、位移和缩放，仅保留 120ms 的颜色与透明度状态变化。

## 信息架构与滚动

- 创作页复用正式源码 `src/content/RolePromptStudio.tsx` 的真实流程：创意描述、参考图、最近使用、专家身份、专业工作流、模型、生成操作、中文/英文/结构化结果、保存与进入图像创作。
- 创作页与提示词库是两个独立 Workspace，不再用只有选中样式、没有页面内容的假入口。
- 420px：单列资产列表；点击卡片打开详情 Modal。
- 680px：提示词列表与详情双栏；两侧滚动容器独立，详情操作栏固定。
- 980px：资料库、资产列表、详情三栏；列表与详情独立滚动，详情操作栏固定。

示例图片为空的条目使用低对比类别占位图，不伪造 AI 作品。占位视觉只承担内容结构提示，不与标题争夺注意力。

## 性能与无障碍

- 列表卡片不使用 `backdrop-filter`；仅 Modal 遮罩使用一次模糊。
- Ribbon Glyph 加载与显示尺寸匹配的静态 WebP / PNG，不加载高分辨率母版。
- 交互动效只使用 `transform`、`opacity`、局部 `filter`，Pointer Down 立即缩放反馈，过渡可被新状态中断。
- 页面不可见时通过 `visibilitychange` 暂停所有循环动画。
- `prefers-reduced-motion` 和强制预览类会关闭循环与长过渡。
- `prefers-reduced-transparency` 和强制预览类会取消模糊并使用实色深蓝黑表面。
- 系统字体、400 / 600 字重和至少 44px 的主要点击目标用于保持浏览器浮层中的可读性与触控容错。

## 验收证据

真实 Chromium 截图保存在 `output/playwright/`。这些截图只属于实验室交付，不会被正式插件运行时加载。

- 创作母版：`42-creator-420.png`、`43-creator-680.png`、`44-creator-980.png`
- 提示词库母版：`32-master-980-optical-authority.png`、`33-master-680-optical-authority.png`、`34-master-420-optical-authority.png`
- 组件状态：`35-command-focus-optical-authority.png`、`36-ai-states-optical-authority.png`、`37-upload-states-optical-authority.png`、`38-card-states-optical-authority.png`
- 无障碍预览：`39-reduced-motion-optical-authority.png`、`40-reduced-transparency-optical-authority.png`
- V1.3 汇总板：`45-visual-integration-summary-v13.png`

键盘切换导航时，选中底板的位移过渡为 `0s`；Reduced Motion 下循环动画关闭，同时保留 `120ms` 的颜色、边框和透明度反馈。
