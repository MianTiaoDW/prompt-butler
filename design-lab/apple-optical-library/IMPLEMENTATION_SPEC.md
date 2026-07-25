# Apple Optical Prompt Library 实现规范

本规范只描述视觉原型的前端落地方式，不代表已迁移到正式插件。所有数据、数量和状态仍为 Mock。

## 1. 颜色 Token

| Token | 值 | 用途 |
| --- | --- | --- |
| `--canvas` | `#07080A` | 页面最底层画布 |
| `--app-shell` | `#0B0D10` | 插件外壳 |
| `--surface-1` | `#101318` | 正文和普通资产表面 |
| `--surface-2` | `#151920` | Hover 表面 |
| `--surface-3` | `#1B2028` | 高一级实色表面 |
| `--text-primary` | `rgb(248 250 252 / .96)` | 标题和重要正文 |
| `--text-secondary` | `rgb(225 229 236 / .66)` | 正文和摘要 |
| `--text-tertiary` | `rgb(210 216 226 / .42)` | 辅助信息 |
| `--green-primary` | `#62D791` | 主按钮、成功、当前选中 |
| `--green-secondary` | `rgb(72 233 138 / .16)` | 缩略图环境光、品牌微光 |
| `--green-tertiary` | `#56A878` | 辅助小标题 |
| `--favorite` | `#FF6B9B` | 仅用于收藏状态 |
| `--ai-processing` | `#8177FF` | 仅用于 AI 优化和处理中 |

同一视口只保留一个高亮绿色主按钮。粉色不得用于非收藏操作；蓝紫不得用于普通导航和内容标签。

## 2. 圆角 Token

| Token | 值 | 建议对象 |
| --- | --- | --- |
| `--radius-sm` | `10px` | 图标按钮、搜索框 |
| `--radius-md` | `14px` | Prompt 卡片、正文块 |
| `--radius-lg` | `20px` | Modal 内部大区域 |
| `--radius-xl` | `26px` | 插件外壳 |
| `--radius-pill` | `999px` | 工作区选中底板、主按钮 |

## 3. 阴影 Token

```css
--shadow-shell:
  0 32px 80px rgb(0 0 0 / .58),
  0 1px 0 rgb(255 255 255 / .04) inset;

--shadow-floating:
  0 24px 60px rgb(0 0 0 / .52),
  0 1px 0 rgb(255 255 255 / .12) inset,
  0 -1px 0 rgb(0 0 0 / .48) inset;

--shadow-control:
  0 9px 24px rgb(0 0 0 / .26),
  0 1px 0 rgb(255 255 255 / .09) inset;
```

- 普通卡片默认不使用外部阴影。
- Hover 卡片使用 `0 10px 22px rgb(0 0 0 / .20)`，并上移 `2px`。
- Selected 卡片保持原位，只使用内侧柔光和状态光带。
- 不在普通正文区域使用彩色外发光。

## 4. 描边透明度

| 层级 | 建议值 |
| --- | --- |
| 外壳边缘 | 白色 `6%–7%` |
| 光学控件顶部高光 | 白色 `8%–12%` |
| 普通正文容器 | 白色 `3%–4%` |
| Selected 边缘 | 绿色 `10%–14%` |
| AI 默认按钮 | 蓝紫 `18%–22%` |
| AI Processing | 蓝紫 `30%–36%` |

一级区域优先用背景明暗、间距、渐变分隔和阴影，不要默认补一圈完整 `1px` 白边。

## 5. 光学材质实现

只允许顶部品牌栏、当前工作区导航项、Modal、AI Inspector 和主按钮使用明显光学材质。

```css
.optical-surface {
  background:
    linear-gradient(110deg, rgb(255 255 255 / .025), transparent 42%),
    rgb(18 22 27 / .86);
  border: 1px solid rgb(255 255 255 / .065);
  box-shadow:
    0 1px 0 rgb(255 255 255 / .08) inset,
    0 -1px 0 rgb(0 0 0 / .44) inset,
    0 18px 44px rgb(0 0 0 / .34);
  backdrop-filter: blur(20px) saturate(125%);
}

@media (prefers-reduced-transparency: reduce) {
  .optical-surface {
    background: #151920;
    backdrop-filter: none;
  }
}
```

不要给 Prompt 卡片和 Prompt 正文添加 `backdrop-filter`。它们使用实色表面，保证长文本清晰且降低 GPU 开销。

## 6. 交互状态与动效

| 状态 | 时长 | Easing | 实现 |
| --- | --- | --- | --- |
| 卡片 Hover | `160ms` | `cubic-bezier(.23,1,.32,1)` | `translateY(-2px)`＋阴影 |
| 卡片 Pressed | `80ms` | 同上 | `scale(.985)` |
| 主按钮 Hover | `180ms` | `ease` | 增强内部高光，不改变尺寸 |
| 主按钮 Pressed | `90ms` | `cubic-bezier(.23,1,.32,1)` | `scale(.98)`＋光团下压 |
| Modal / Inspector | `280–340ms` | 临界阻尼 Spring、`bounce: 0` | 从当前呈现值重定向 |
| Loading 柔光 | `2200–2600ms` | `linear` / `ease-in-out` | 仅移动伪元素的 `transform` 和 `opacity` |

- Pointer Down 立即进入 Pressed；不要等到 `click`。
- 高频列表选择不做弹跳、不逐项飞入。
- Loading 保持按钮宽高不变，文案为“正在发送”，spinner 位于文案左侧。
- `prefers-reduced-motion: reduce` 下停止位移动画和循环柔光，仅保留不超过 `120ms` 的颜色/透明度反馈。

## 7. 响应式断点行为

### 420px（`< 600px`）

- 单列 Prompt 资产列表。
- 顶栏高度 `50px`，品牌只保留名称，隐藏副说明。
- 搜索层高度约 `44px`，标题与 Mock 数量同行。
- 点击卡片打开居中 Modal；详情不常驻。
- 快捷图标触控区域至少 `34 × 34px`。

### 680px（`600px–839px`）

- Prompt 列表与详情双栏，列表约 `42%`。
- 分类进入收纳面板，列表与详情分别滚动。
- 右侧操作栏固定在详情区底部，长 Prompt 只滚动正文。
- 栏间用弱渐变和阴影分隔，不使用硬白线。

### 980px（`≥ 840px`）

- 左侧资料库 `186px`、资产列表 `322px`、详情自适应。
- 左侧显示现有产品分类名称，不显示重复 Mock 标签。
- 品牌栏统一说明“视觉原型 · Mock 数据”。
- 详情保持最多三张示例图，并为长文本保留独立滚动区域。

## 8. 轻量实现边界

- 动态交互优先 CSS transition；Modal/Inspector 的可中断空间过渡使用现有 Framer Motion。
- 只动画 `transform` 和 `opacity`；不要动画宽高、padding 或大面积 blur。
- 不增加账号、同步、容量或其他未接入能力。
- 真实迁移前需将 Mock 数据替换为现有 `chrome.storage.local` 数据流，但本 Design Lab 不接入该数据层。
