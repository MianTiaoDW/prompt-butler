# 项目目录结构说明

```text
.
├─ manifest.config.ts        # Chrome Extension Manifest V3 配置
├─ options.html              # Options Page 的 HTML 入口
├─ package.json              # 项目依赖与脚本
├─ postcss.config.js         # PostCSS 配置
├─ tailwind.config.ts        # Tailwind 主题与扫描配置
├─ tsconfig.json             # TypeScript 配置
├─ vite.config.ts            # Vite + CRX 插件配置
└─ src
   ├─ assets                 # 静态资源占位，后续可放 logo / icon / mock 图
   ├─ background
   │  ├─ index.ts            # Background Service Worker 入口
   │  └─ provider-health.ts  # 服务商连接测试逻辑
   │  └─ model-discovery.ts  # 模型自动识别与分类
   │  └─ prompt-generator.ts # 提示词生成请求编排与结果解析
   │  └─ image-generator.ts  # 生图请求与下载逻辑
   ├─ components             # 通用 UI 组件
   ├─ content
   │  ├─ index.tsx           # Content Script 入口
   │  └─ OverlayApp.tsx      # 悬浮窗基础壳子
   │  └─ RolePromptStudio.tsx # 角色设定与提示词生成工作台
   │  └─ FavoritesStudio.tsx # 收藏夹列表、编辑与 AI 优化
   │  └─ ImageStudio.tsx     # 图像生成与下载工作台
   ├─ features               # 按业务拆分的功能模块
   ├─ hooks                  # 自定义 hooks，如 storage 封装
   ├─ lib                    # 常量、工具函数、服务封装
   │  └─ image-library.ts    # 生图区工作台存储
   │  └─ prompt-library.ts   # 收藏存储与标签推荐
   │  └─ runtime.ts          # runtime message 发送封装
   ├─ options
   │  ├─ main.tsx            # Options Page React 入口
   │  └─ OptionsApp.tsx      # 配置中心基础页面
   ├─ styles
   │  └─ tailwind.css        # 全局 Tailwind 与玻璃态样式
   ├─ types                  # TS 类型定义
   │  ├─ image.ts            # 生图结果与工作台类型
   │  ├─ prompt.ts           # 提示词生成、收藏与工作台类型
   │  ├─ runtime.ts          # runtime 消息与连接测试结果类型
   │  └─ settings.ts         # 插件配置与服务商类型
   └─ vite-env.d.ts          # Vite 类型声明
```

## 当前阶段完成内容

- 已完成 `Vite + React 18 + TypeScript` 基础工程。
- 已接入 `@crxjs/vite-plugin`，具备 Manifest V3 插件构建基础。
- 已接入 `Tailwind CSS`，并写入暗黑毛玻璃风格的基础样式。
- 已创建 `Background`、`Options`、`Content Script` 三个核心入口。
- 已提供一个最小可见的悬浮窗壳子和配置中心落地页。
- 已封装 `chrome.storage.local` 的读写与订阅 hook。
- 已建立 AI 服务商预设常量表与统一配置类型。
- 已打通 Options 页面与悬浮窗之间的实时状态联动。
- 已将 Options 页面升级为显式保存的配置工作台，支持草稿态编辑与回滚。
- 已接入 Background Service Worker 消息协议与真实连接测试入口。
- 已支持火山引擎与 OpenAI 兼容中转站的模型自动识别。
- 已完成角色设定工作台、可选参考图上传、提示词生成请求链路与三种格式输出。
- 已提供最小可用的“保存到收藏”本地入库能力与标签推荐。
- 已完成收藏夹卡片列表、编辑修改与 AI 一键优化。
- 已完成图像生成 Tab、加载骨架、结果网格以及单张/批量下载。

## 下一步建议

- 第三步进入完整配置中心：
  - 继续拆分表单模块与视觉组件
  - 增加分类文件夹与本地搜索
  - 打通更多服务商的官方生图端点差异
  - 补全收藏分类导航与文件夹管理
