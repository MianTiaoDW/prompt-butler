# 界面图谱设计规范

## 方向

- 名称：暗色编辑图谱 + 仪器面板精度 + 设计知识库高密度。
- 情绪：冷静、可信、带一点策展感；让用户觉得每个设计决定都可以被命名和验证。
- 标志特征：暖白大号衬线标题、近黑分层表面、橙红索引与酸绿色行动点。
- 明确避免：通用紫色 AI 渐变、全局毛玻璃、霓虹光污染、卡片套卡片、长距离滚动飞入。

## Tokens

| Token | Value | Use |
| --- | --- | --- |
| canvas | `#11110f` | 页面底色 |
| surface-1 | `#171714` | 卡片与模态表面 |
| surface-2 | `#0b0b09` | 演示舞台与深层表面 |
| text | `#ece9df` | 主文字 |
| text-muted | `#bcb9af` | 说明与元数据 |
| border | `rgba(236,233,223,.17)` | 常规分隔 |
| border-strong | `rgba(236,233,223,.34)` | 交互边界 |
| signal | `#ff5b35` | 索引、警示和研究标签 |
| action | `#d9ff43` | 主行动、键盘焦点和成功确认 |

## Typography

- 展示标题：Iowan Old Style / Palatino / Baskerville / Georgia；`font-weight: 500`；紧行高与负字距。
- 界面正文：Aptos / Segoe UI Variable / Microsoft YaHei UI；正文行高 1.7–1.85。
- 数据标签：Cascadia Mono / SFMono / Consolas；8–10px；大写英文使用正字距。
- 大标题仅承担一个视觉重心；正文不使用纯白，以降低暗色界面的眩光。

## Layout

- 桌面首屏：叙事文案与图谱标本双栏；知识区使用 220px 索引轨道加弹性内容区。
- 风格图鉴：桌面三栏、中屏两栏、手机单栏。
- 同构对比：桌面最多三栏；中屏与手机线性排列。
- 390px 手机宽度必须无文档级横向滚动，五个主栏目同屏可见。
- 卡片面积必须表达信息优先级，不为装饰制造空模块。

## Components and States

- 风格卡：整卡单一按钮，内部预览不可再嵌套交互元素。
- 模式行：名称、英文术语、定义、分类与进入指示；详情使用原生 `dialog`。
- 模态：Esc、遮罩和关闭按钮均可关闭；浏览器负责焦点循环与触发点恢复。
- 搜索：栏目切换时清空查询，避免旧过滤条件制造空视图歧义。
- Toast：单一表面替换消息；复制失败使用用户语言。
- 空状态：解释无结果原因，并提供清除筛选入口。

## Motion

| Interaction | Properties | Timing | Interruption | Reduced motion |
| --- | --- | --- | --- | --- |
| Button press | transform | 110–120ms | pointer-down 即时重定向 | 保留颜色与边界 |
| Card hover | transform | 180ms | 从当前 transform 继续 | 移除位移 |
| Modal | opacity, scale, translateY | 220ms · `cubic-bezier(.22,1,.36,1)` | 关闭可立即发生 | 极短淡入 |
| Segmented demo | transform | 190ms | 从当前底板位置反向 | 直接切换底色 |
| Skeleton | background-position | 1.6s linear | 结果到达立即替换 | 静态占位 |
| Toast | opacity, translateY | 160–180ms | 新消息接管旧表面 | 即时替换文本 |

环境动效只出现在“动效实验”或首屏标本区域。隐藏页面和 reduced-motion 下停止所有循环。

## Accessibility and Performance

- 所有交互使用原生按钮、链接、搜索框或对话框语义。
- `:focus-visible` 使用 2px 酸绿色轮廓，偏移 3px。
- 支持 `prefers-reduced-motion` 与 `prefers-contrast: more`。
- 主要动画仅使用 transform、opacity 或小范围 background-position。
- 背景模糊仅用于粘性顶栏和玻璃风格样本，不铺满长列表。
- 资源总库包含 553 条站内知识卡，搜索与筛选同步执行，列表每次只追加 120 条，避免一次性制造过多 DOM。
- 每条知识卡提供原创中文说明、场景、规则、实现提示、避坑和可复制规范；来源链接降为详情末尾引用。
- 不镜像第三方源码、付费提示词或受版权保护的视觉资产。

## Acceptance

1. 桌面 1440px 与手机 390px 均无文档级横向滚动。
2. 五个栏目可通过鼠标与键盘切换，选中态语义同步。
3. 搜索“骨架”只返回 Skeleton 条目；切换栏目后搜索自动清空。
4. 风格详情与模式详情能通过 Esc 关闭，并把焦点返回触发卡片。
5. 同构对比最多选择三种风格，并始终使用完全相同的示例内容。
6. 动效实验包含用途、参数、可中断原则与 reduced-motion 替代。
7. 生产构建无错误，页面无重复交互嵌套。
8. 资源总库支持按来源筛选、关键词检索、分批载入，并能回到原始来源。
