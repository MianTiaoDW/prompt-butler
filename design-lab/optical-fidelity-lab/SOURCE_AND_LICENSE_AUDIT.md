# 公开资源与许可证核查

核查日期：2026-07-19。结论区分“站点声明”“仓库可验证文件”和“本 Lab 的实际使用”。本 Lab 没有复制 Recent.design 的素材，也没有引入 Componentry 的 WebGL/GSAP 组件或 CSS Cursors 的自定义宿主光标。

| 资源 | 实际代码 / 依赖核查 | 许可证记录 | 本 Lab 的使用 |
| --- | --- | --- | --- |
| [Componentry](https://componentry.dev/) / [GitHub](https://github.com/harshjdhv/componentry) | React 19、Tailwind CSS 4、Framer Motion；monorepo 使用 Turborepo。README 明示 `image-trail`、`layered-stack` 额外依赖 GSAP。 | 仓库根目录存在 MIT `LICENSE`；GSAP 组件另受 GSAP 条款约束。 | 只研究渐变、状态变换与 React 组件组织；未复制组件源码，未引入 GSAP、Canvas 或 WebGL。 |
| [Animated Buttons](https://animatedbuttons.colorion.co/) / [GitHub](https://github.com/ckissi/colorion-animated-buttons) | 实际源码为 Astro 展示站；按钮片段为纯 CSS，无运行时依赖。检查了 Press、Shine Sweep、Double Edge、Inset Fill、Border Draw 及 reduced-motion guard。 | 站点和仓库 README 声明 MIT；核查时仓库根目录未发现独立 `LICENSE` 文件。 | 重新实现 Press 的即时缩放反馈与克制的双边/内凹层次；未逐字复制片段。 |
| [Kinetics](https://kinetics.colorion.co/) / [GitHub](https://github.com/ckissi/kinetics) | Astro 展示站；实际条目提供 CSS、React 与 prompt 版本。检查了 Accordion、状态切换、Pointer Tooltip、Shine Sweep 和中断说明。 | 站点页脚声明 MIT；核查时仓库根目录未发现独立 `LICENSE` 文件。 | 只采用可中断 transform/opacity 状态原则；没有复制源码，避免把站点声明当成完整许可证文件。 |
| [CSS Cursors](https://csscursors.colorion.co/) / [GitHub](https://github.com/ckissi/colorion-css-cursors) | Astro 为开发依赖；实际 tracker 在容器写入 `--x`、`--y`、`--angle`、`--speed`，效果层读取变量。 | 站点 / README 声明 MIT；核查时仓库根目录未发现独立 `LICENSE` 文件。 | 仅研究局部 pointer halo / 速度响应逻辑；本 Lab 未替换系统光标，正式插件更不得替换宿主网页光标。 |
| [IconSax](https://iconsax.io/) / [官方许可说明](https://docs.iconsax.io/license-and-terms/license) | Lab 使用 `iconsax-reactjs@0.0.8`，peer dependency 为 React；npm 解包约 15 MB，`sideEffects:false`，可按组件 tree-shake。状态统一使用 Linear / Bulk / TwoTone。 | React wrapper 的 package metadata 声明 MIT；IconSax 官方现行条款仍保留图标设计权，并禁止把 loose icon pack 再分发。本项目只将免费图标集成为 UI 功能。 | 18 个操作图标来自同一系统；未导出或重新分发整套 loose icons；文档保留 IconSax 来源。 |
| [Recent.design](https://recent.design/) / [Info](https://recent.design/info) | 公开页面是 System 的设计策展 feed；没有发现供复制的组件代码入口。 | 没有找到允许复制站内商业设计代码或素材的公开许可证。 | 仅用于视觉检索；没有复制代码、截图或第三方商业素材。 |

## 依赖落地结论

- 唯一新增的运行依赖位于本隔离目录：`iconsax-reactjs@0.0.8`、`react@18.3.1`、`react-dom@18.3.1`。
- `react` / `react-dom` 在 Lab 内固定为 18.3.1，避免 IconSax peer 自动安装 React 19 后与仓库 React 18 renderer 产生元素协议冲突。
- 未向正式插件的根 `package.json` 添加任何依赖。
- Componentry、Animated Buttons、Kinetics、CSS Cursors 的代码没有直接复制进入 Lab；上述记录说明研究依据和拒绝项。
