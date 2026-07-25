# Dark Optical Workspace · 第一版视觉母版

> 这是完整 Prompt Library 响应式视觉原型，作为可追溯母版保留。后续更聚焦的光学组件与 Hero Icon 研究位于相邻的 `optical-fidelity-lab/`；两者均未迁移到正式插件。

## 范围

本目录是“提示词库”视觉原型，只使用 Mock 数据。它不依赖 `chrome.*`、存储、后台服务、Prompt 正式数据结构或 API。

产品名称使用正式名称“提示词生成管家”。左侧分类沿用正式产品已有的信息架构名称；所有数量、资产内容、收藏状态和效果图均明确属于 Mock，不表示正式能力或运行状态。

独立启动：

```powershell
npx vite design-lab/apple-optical-library --host 127.0.0.1
```

根项目的 `vite.config.ts`、`manifest.config.ts`、HTML 入口和 `src/` 均不引用此目录，因此 `npm run build` 不会打包该原型。

前端实现参数见 [`IMPLEMENTATION_SPEC.md`](./IMPLEMENTATION_SPEC.md)。主按钮四态可通过 `?showcase=buttons` 独立预览。

## 视觉转译

- 光学材质只承担品牌栏、搜索层、浮层、Inspector 与主按钮等控制层级。
- 普通 Prompt 卡片是低边框的实色资产表面，靠层级、排版和选中光带表达状态。
- 内部光团被限制在品牌标识、示例图、Inspector 与 Emerald Aurora Button 内。
- 非均匀边缘通过多层 inset highlight、侧向渐变与底部内阴影实现，不用整块强发光。
- 980px 为三栏资产工作台，680px 升级为列表 + 详情双栏，420px 变为单列 + 详情 Modal。
- 高频列表切换只做即时提亮与 1px 位移；Modal/Inspector 使用可中断状态过渡，无弹跳。
- AI Inspector 的等待、处理、完成由用户点击切换，不使用定时器伪造异步流程。
- `prefers-reduced-motion` 使用短淡入或立即切换；`prefers-reduced-transparency` 使用近实色表面并关闭模糊。

指定的 `design-references/apple-optical/` 和正式界面截图在本轮开始时并不存在于仓库或附件中，因此本版依据需求文本定义与现有正式组件代码提炼，而不是宣称读取了缺失素材。
