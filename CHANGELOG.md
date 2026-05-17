# 更新日志

本文件记录每次版本更新的主要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)。

---

## [1.0.2] - 2026-05-17

### 修复
- 修复 Edge 浏览器中点击"配置中心"按钮无法打开设置页面的问题
- 打开选项页增加回调检测，失败时自动降级为 `window.open` 方式

---

## [1.0.1] - 2026-05-16

### 修复
- 修复 Service Worker 启动失败导致"连接测试"报错的问题
- 消息发送增加自动重试机制（最多 3 次），解决 Service Worker 未就绪时的连接失败
- 后台脚本增加 try-catch 保护，防止未捕获异常导致 Service Worker 崩溃
- 新增启动日志，便于排查问题

---

## [1.0.0] - 2026-05-16

### 首次发布

#### 核心功能
- **角色设定扩写** — 输入角色预设 + 用户需求，调用大模型生成中文段落、英文 Prompt、结构化 JSON 三种格式
- **收藏夹管理** — 文件夹分类、全文搜索、导入/导出备份、AI 一键优化已有提示词
- **图像生成** — 提示词直出图片，支持单张/批量下载
- **自定义标签** — 自由创建分类，独立管理各自收藏体系

#### 配置中心
- 支持 10+ AI 服务商：Claude / Gemini / ChatGPT / 火山引擎 / Kimi / Deepseek / Minimax / 阿里云百炼 / 小米 / 腾讯云
- API Key 密码框输入，Base URL 自动填充 + 手动修改
- 模型配置支持手填 ID 或下拉预设（推理大模型、视觉模型、生图模型）
- 分辨率（2K/4K）与生成数量（1~4张）参数配置

#### 界面与交互
- 暗黑毛玻璃（Glassmorphism）UI 设计
- 全局悬浮窗，支持拖拽定位
- 实时状态联动（配置未就绪 / 服务已就绪）
- 加载骨架屏动画

#### 技术架构
- Chrome Extension Manifest V3（Service Worker + Content Script + Options Page）
- React 18 + TypeScript + Vite + Tailwind CSS
- chrome.storage.local 本地存储
- Background Service Worker 代理所有 API 请求
