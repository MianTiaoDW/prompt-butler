# 提示词生成管家 - 项目规范

## 项目简介
Chrome/Edge 浏览器扩展（Manifest V3），用于 AI 提示词生成、收藏管理和图像生成。暗黑毛玻璃风格 UI。

## 技术栈
- React 18 + TypeScript + Vite
- Tailwind CSS + framer-motion
- react-rnd（悬浮窗拖拽）
- @crxjs/vite-plugin（Manifest V3 构建）
- chrome.storage.local（数据持久化）

## 开发命令
```bash
npm install        # 安装依赖
npm run dev        # 开发模式（自动构建到 dist）
npm run build      # 生产构建
```

## 架构要点
- `src/background/` — Service Worker，处理所有 LLM/生图 API 请求（解决跨域）
- `src/options/` — 配置中心页面（Options Page）
- `src/content/` — 注入网页的悬浮窗 UI
- `src/hooks/` — chrome.storage.local 封装
- `src/lib/` — 常量、工具函数、运行时消息封装
- `src/types/` — TypeScript 类型定义

## 编码规范
- 组件用函数式 + hooks，不用 class 组件
- 样式用 Tailwind CSS 工具类，不写自定义 CSS（除非必要）
- 图标统一用 lucide-react
- 状态管理用自定义 hook 封装 chrome.storage.local，不引入外部状态库
- 所有 AI 请求走 background service worker，content script 通过 runtime message 通信

## UI 风格
- 暗黑模式，深灰/黑色背景
- 毛玻璃特效（backdrop-blur + 半透明背景）
- 圆角设计，极简高级感
- 强调色：荧光绿/渐变色

## 验证方式
- `npm run build` 确认构建无报错
- 在 Chrome 中加载 `dist` 目录测试扩展功能
