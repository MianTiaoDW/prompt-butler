# 项目目录结构说明

更新日期：2026-07-24。当前跨设备接续状态见 [`docs/CODEX_HANDOFF.md`](docs/CODEX_HANDOFF.md)。

```text
.
├─ manifest.config.ts                 # Manifest V3 配置
├─ vite.config.ts                     # Vite + CRXJS 构建
├─ package.json                       # 正式插件依赖与命令
├─ src/
│  ├─ background/                     # Service Worker、LLM/生图代理、示例图 IndexedDB
│  ├─ content/                        # 网页内工作台、提示词库、图像工坊与 Modal
│  ├─ options/                        # 模型配置中心
│  ├─ popup/                          # 工具栏入口
│  ├─ hooks/                          # Chrome storage 与界面 hooks
│  ├─ lib/                            # 存储、备份、Prompt、图片和消息工具
│  ├─ styles/                         # 正式插件全局样式
│  └─ types/                          # 共享 TypeScript 类型
├─ native/PromptButler.TopMostHost/   # Windows 可选原生置顶辅助程序
├─ scripts/                           # 原生辅助程序安装/卸载脚本
├─ design-lab/
│  ├─ apple-optical-library/          # 420/680/980 Prompt Library 视觉原型
│  ├─ optical-fidelity-lab/           # 光学组件和 Hero Icon 生产实验
│  ├─ visual-integration-lab-v1/      # 历史母版、Ribbon Glyph 与功能动态图标实验
│  └─ apple-prompt-studio/            # 当前认可的 Apple 竖屏交互原型
├─ ui-pattern-atlas/                  # 隔离的 UI 模式知识图谱
├─ docs/
│  ├─ CODEX_HANDOFF.md                # 跨设备唯一交接入口
│  └─ 使用指南.md
└─ icons/                             # 正式扩展图标
```

## 数据边界

- 设置、Prompt、收藏夹：`chrome.storage.local`。
- 临时工作台/窗口会话：`chrome.storage.session` 或当前 React 状态。
- 用户明确保存的示例图片：Background 管理的扩展 Origin IndexedDB Blob；Prompt 记录只保存图片 ID。
- 生图结果默认是临时结果，不因生成成功自动写入长期存储。

## 隔离边界

- 根目录 `npm run build` 只构建正式扩展，不打包 `design-lab/` 或 `ui-pattern-atlas/`。
- 四套 Design Lab 自带入口、规范与截图，用于视觉验收，不连接 Manifest、Background、正式存储或真实 API。
- `dist/`、`node_modules/`、本机设置和临时日志均为可再生或私有内容，不进入 Git。

## 当前完成状态

- 正式插件已包含提示词生成、提示词库/收藏管理、AI 优化、图像工坊、配置中心、示例图显式保存，以及 Windows 可选置顶支持。
- Apple Optical Prompt Library 原型包含 420/680/980 响应式版本、交互状态、降动效/降透明度和实现规范。
- Optical Fidelity Lab 包含光学组件研究、Hero Icon 多轮候选、可编辑 SVG、生产源图和视觉截图。
- Visual Integration Lab 保留历史布局、Ribbon Glyph 研究，以及搜索、设置、复制、收藏等功能动态图标与验收截图。
- Apple Prompt Studio 是当前认可的竖屏视觉方向，包含创作、提示词库、图像工坊、设置、提示词详情和明暗主题的可操作 Mock。
- 当前浏览器真实验收仍应在目标电脑加载最新 `dist` 后执行；构建通过不能替代该步骤。
