# Productization Phase 1 — 980 Prompt Creator Master

单一 980px 生产候选页面。它复用 Visual Integration Lab V1.3 已确认的视觉语言与冻结 Ribbon Icons，但不属于 Visual Lab，也不接入 Manifest、Background、Content Script、存储或 API。

```powershell
npm install
npm run dev
npm run build
```

状态截图入口：`?state=hover`、`focus`、`loading`、`disabled`、`error`、`success`。默认入口为完整主页面。

页面具备真实输入、参数选择、结果折叠、复制、页面内生成/优化状态和独立滚动；生成与优化目前使用本地短时状态机，等待后续产品化阶段接入正式扩展业务逻辑。
