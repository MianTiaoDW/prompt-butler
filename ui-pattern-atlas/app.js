import { catalogStats, fullCatalog } from "./catalog-data.js";

const styles = [
  {
    id: "editorial",
    name: "编辑杂志风",
    en: "Editorial",
    family: "内容叙事",
    level: "中级",
    tone: "克制 / 权威 / 有节奏",
    summary: "用强烈的字号反差、严谨网格与留白，把普通页面变成有主编意识的内容编排。",
    tags: ["衬线标题", "非对称网格", "细分隔线"],
    rules: ["标题承担视觉重心，正文保持安静", "版式允许错位，但阅读顺序必须明确", "装饰来自排版关系，不依赖大量卡片"],
    avoid: "不要把每段文字都做成超大标题；不要用无意义的斜体制造“杂志感”。",
    prompt: "采用编辑杂志式界面：高对比衬线展示字体、克制的无衬线正文、非对称十二栏网格、细发丝分隔线与充足负空间。信息层级清晰，装饰仅来自排版与编排。",
    accent: "#ef5b32"
  },
  {
    id: "neo-brutal",
    name: "新野兽派",
    en: "Neo Brutalism",
    family: "强表达",
    level: "入门",
    tone: "直接 / 玩味 / 高辨识",
    summary: "用硬边框、实色块和明确层级建立毫不含糊的界面，适合年轻且外向的产品。",
    tags: ["粗边框", "硬阴影", "高饱和点色"],
    rules: ["边界要真实可见，层级不要靠模糊阴影", "颜色数量少而坚定", "交互反馈可以夸张，但不能拖慢任务"],
    avoid: "不要把所有元素都加粗边与硬阴影；密度高时必须保留呼吸空间。",
    prompt: "采用新野兽派界面：高反差实色背景、2px 硬边框、无模糊偏移阴影、粗体几何标题和少量高饱和强调色。保持内容秩序与清晰可点击性。",
    accent: "#d9ff43"
  },
  {
    id: "minimal-flat",
    name: "极简扁平风",
    en: "Minimal Flat",
    family: "效率工具",
    level: "入门",
    tone: "清晰 / 冷静 / 高效率",
    summary: "去掉非必要材质，用排版、间距和语义色建立秩序，适合高频工具与复杂表单。",
    tags: ["语义色", "低装饰", "高可读"],
    rules: ["用间距和字号建立层级，不依赖卡片套卡片", "交互色必须语义稳定", "完整覆盖空、错、载入、禁用状态"],
    avoid: "极简不等于信息缺失；不要用过低对比度换取“高级感”。",
    prompt: "采用极简扁平界面：中性色底、稳定语义色、明确的字号层级和 8pt 间距体系。避免多余阴影、渐变与容器嵌套，完整呈现交互状态。",
    accent: "#2f6dff"
  },
  {
    id: "soft-ui",
    name: "柔和界面风",
    en: "Soft UI",
    family: "亲和体验",
    level: "中级",
    tone: "温和 / 轻盈 / 可信",
    summary: "通过暖中性色、柔软圆角与低刺激反馈降低认知压力，但仍保留清楚的操作边界。",
    tags: ["暖中性", "柔圆角", "轻反馈"],
    rules: ["表面柔和，文字对比度不能随之变弱", "关键按钮需要明确轮廓", "动效以短距离淡入和压感为主"],
    avoid: "不要让按钮与背景融为一体；避免全页面低对比和糖果化渐变。",
    prompt: "采用柔和界面风：温暖的浅中性色、12–18px 圆角、轻量表面层级、清晰的深色正文与短促压感反馈。视觉亲和但操作边界明确。",
    accent: "#e98aa4"
  },
  {
    id: "glass",
    name: "玻璃拟态",
    en: "Glassmorphism",
    family: "空间材质",
    level: "高级",
    tone: "通透 / 数字化 / 空间感",
    summary: "用透明表面表达前后层级，适合少量悬浮控制与沉浸式场景，不适合无差别铺满。",
    tags: ["透明表面", "背景模糊", "亮边"],
    rules: ["只在确有前后关系时使用玻璃", "模糊下方必须有可感知内容", "提供减少透明度时的实色替代"],
    avoid: "不要对整个长列表持续 backdrop-filter；不要在复杂背景上放低对比正文。",
    prompt: "采用克制玻璃拟态：仅在悬浮导航与关键面板使用半透明材质、细亮边和适度背景模糊。正文保持高对比，并为 reduced-transparency 提供实色表面。",
    accent: "#73e0ff"
  },
  {
    id: "bento",
    name: "便当盒布局",
    en: "Bento Grid",
    family: "信息编排",
    level: "中级",
    tone: "模块化 / 直观 / 可扫描",
    summary: "把不同信息密度装进有节奏的模块网格，快速展示产品能力、数据或作品集合。",
    tags: ["模块网格", "跨栏卡片", "密度节奏"],
    rules: ["卡片尺寸必须对应内容优先级", "移动端按阅读顺序重新线性排列", "每张卡只承担一个主叙事"],
    avoid: "不要为了拼图效果制造空卡；不要让所有卡片同权重。",
    prompt: "采用便当盒布局：使用响应式模块网格，以跨栏和面积表达内容优先级。卡片内部各自聚焦一个主题，移动端按语义顺序线性重排。",
    accent: "#ffb52e"
  },
  {
    id: "neo-morph",
    name: "新拟物派",
    en: "Neumorphism",
    family: "空间材质",
    level: "高级",
    tone: "触感 / 安静 / 精密",
    summary: "用同色系高低光制造压入与浮起的触感，适合低密度控制面板中的少量对象。",
    tags: ["同色表面", "双向阴影", "触觉隐喻"],
    rules: ["形态必须有额外边界或对比线索", "pressed 状态要与默认状态明确不同", "只用于低密度局部控件"],
    avoid: "不用于复杂表单、长列表与弱视用户的关键路径。",
    prompt: "采用局部新拟物风格：同色系背景与控件表面、克制的高低光双向阴影、明确的按下态和额外轮廓提示。仅用于少量核心控制。",
    accent: "#8da4b8"
  },
  {
    id: "corporate",
    name: "企业简洁风",
    en: "Corporate Clean",
    family: "效率工具",
    level: "入门",
    tone: "可靠 / 专业 / 可扩展",
    summary: "通过稳定网格、保守色彩与可预测组件，为企业服务建立可信和长期可维护的基线。",
    tags: ["稳定网格", "数据优先", "可信蓝"],
    rules: ["优先可预测而非惊喜", "数据与任务路径高于品牌装饰", "组件行为跨页面保持一致"],
    avoid: "不要把专业等同于沉闷；可用排版与内容图形建立记忆点。",
    prompt: "采用企业简洁风：稳定响应式网格、清晰无衬线排版、克制品牌色和一致组件语义。优先数据可读性、任务效率与长期维护。",
    accent: "#4c78d4"
  },
  {
    id: "dark-lab",
    name: "暗色实验室",
    en: "Dark Lab",
    family: "强表达",
    level: "高级",
    tone: "精密 / 沉浸 / 技术感",
    summary: "像仪器界面一样组织暗色层级，用极少的信号色表达状态，适合创作与开发工具。",
    tags: ["近黑层级", "信号色", "数据标签"],
    rules: ["暗色层级靠明度差而非纯黑堆叠", "信号色只服务状态与焦点", "长文本保持舒适行高与非纯白"],
    avoid: "不要全局霓虹发光；不要用过量玻璃和高饱和描边制造廉价科技感。",
    prompt: "采用暗色实验室界面：近黑但可区分的表面层级、暖白正文、紧凑数据标签和单一信号强调色。动效精确短促，避免霓虹与无意义发光。",
    accent: "#41e58a"
  }
];

const patterns = [
  { id: "lightbox", name: "灯箱预览", en: "Lightbox", category: "覆盖层", definition: "在暗色遮罩上放大查看图片或媒体，同时保留返回原上下文的路径。", use: "作品、生成结果、商品图等需要沉浸查看但不值得离开当前页面的场景。", anatomy: ["触发缩略图", "全屏或容器遮罩", "媒体舞台", "关闭按钮", "上一张 / 下一张（可选）"], states: ["opening", "ready", "closing", "load error"], a11y: "使用 dialog 语义、Esc 关闭、焦点循环、关闭后把焦点还给触发缩略图。", debug: "如果关闭后键盘焦点丢失，记录触发元素并在退出动画完成后 focus()。" },
  { id: "skeleton", name: "骨架屏", en: "Skeleton", category: "加载反馈", definition: "用与最终内容几何尺寸一致的占位块表示内容正在到达。", use: "最终布局已知，且用户需要理解将出现什么内容时。", anatomy: ["固定几何容器", "标题占位", "媒体占位", "低刺激光带（可选）"], states: ["loading", "content", "error"], a11y: "给结果区域设置 aria-busy；骨架本身通常隐藏于辅助技术，真实结果到达后一次替换。", debug: "若加载完成时页面跳动，说明骨架与最终内容的宽高、边距或字体行高不一致。" },
  { id: "spinner", name: "进度转轮", en: "Spinner", category: "加载反馈", definition: "表示时间未知、无法映射到具体内容几何的短暂等待。", use: "按钮提交、独立后台动作或无法预测结果结构的等待。", anatomy: ["旋转指示", "可选状态文案", "稳定容器"], states: ["idle", "busy", "success", "error"], a11y: "配合可读状态文本或 aria-label，避免只靠旋转图形传达含义。", debug: "若按钮加载时宽度跳动，给标签与 spinner 预留相同的稳定布局槽位。" },
  { id: "segmented", name: "分段控制器", en: "Segmented Control", category: "导航选择", definition: "在少量互斥选项之间快速切换，并用连续底板保留空间关系。", use: "2–5 个同级视图或过滤模式，且用户会频繁往返切换。", anatomy: ["容器轨道", "选项标签", "选中底板", "焦点态"], states: ["default", "hover", "selected", "focus", "disabled"], a11y: "使用 radiogroup、tablist 或一组语义按钮，方向键行为与所选模式一致。", debug: "快速连点卡顿时，让底板从当前屏幕位置重新 transition，不要用 setTimeout 串行动画。" },
  { id: "toast", name: "轻提示", en: "Toast", category: "操作反馈", definition: "在不打断当前任务的前提下确认短暂结果或可恢复错误。", use: "复制、保存、收藏、连接状态等无需用户立即决策的反馈。", anatomy: ["状态图标", "用户语言消息", "可选操作", "自动消失计时"], states: ["enter", "hold", "exit", "replace"], a11y: "成功用 polite live region；需要马上处理的错误再考虑 assertive，且不可只靠颜色。", debug: "连续消息重叠时，统一由单一队列管理，并允许新消息打断旧消息退出。" },
  { id: "accordion", name: "折叠区", en: "Accordion", category: "内容组织", definition: "按需展开次级信息，让主任务保持简洁而不永久隐藏内容。", use: "技术详情、高级设置、常见问题和结构化数据。", anatomy: ["触发标题", "状态箭头", "内容容器", "分隔边界"], states: ["collapsed", "expanding", "expanded", "collapsing"], a11y: "按钮关联 aria-expanded 与 aria-controls；内容隐藏后不可继续 Tab 进入。", debug: "中途反向跳闪时，使用可测量高度或 grid rows，避免固定大 max-height。" },
  { id: "sticky-toolbar", name: "粘性工具栏", en: "Sticky Toolbar", category: "导航选择", definition: "在内容滚动时保留高频搜索与筛选，仅在发生覆盖关系时提升材质层级。", use: "长列表、素材库和需要反复调整条件的浏览页面。", anatomy: ["搜索", "筛选", "结果计数", "滚动阴影或边界"], states: ["rest", "stuck", "scrolled"], a11y: "保持自然 DOM 顺序，不遮住锚点目标；缩放后仍能完整显示关键控件。", debug: "若始终像一块厚玻璃，改为只有内容从下方经过时才显示背景与细分隔线。" },
  { id: "command", name: "命令面板", en: "Command Palette", category: "导航选择", definition: "通过键盘优先的搜索界面快速定位功能、页面或动作。", use: "功能密集、专家用户占比高，且导航层级较深的产品。", anatomy: ["快捷键触发", "输入框", "分组结果", "键盘选中态", "空状态"], states: ["closed", "searching", "result", "empty"], a11y: "用 combobox/listbox 语义，宣布结果数量并保证上下键、Enter、Esc 行为可预测。", debug: "若筛选输入卡顿，先减少同步渲染，再考虑防抖；不要延迟本地小数据集。" },
  { id: "modal", name: "模态对话框", en: "Modal Dialog", category: "覆盖层", definition: "暂时中断底层界面，要求用户完成一个聚焦任务或做出明确决定。", use: "编辑详情、确认危险操作、必须完成的小型工作流。", anatomy: ["遮罩", "标题", "正文", "主次操作", "关闭入口"], states: ["opening", "open", "submitting", "error", "closing"], a11y: "aria-modal、标题关联、焦点循环、Esc 和关闭后焦点恢复都是必需项。", debug: "不要从 scale(0) 打开；使用 opacity + 0.96 scale + 6px 位移并支持中途反向。" },
  { id: "empty", name: "空状态", en: "Empty State", category: "系统状态", definition: "解释为什么没有内容，并给出下一步，而不是只留下一块空白。", use: "首次使用、筛选无结果、数据被清空或权限不足。", anatomy: ["原因标题", "简短解释", "主要行动", "可选示例"], states: ["first use", "no result", "cleared", "permission"], a11y: "信息顺序应先解释状态，再提供动作；插图不可代替文本。", debug: "区分“还没有数据”和“搜索无结果”，它们需要不同文案与行动。" },
  { id: "focus-ring", name: "焦点环", en: "Focus Ring", category: "可访问性", definition: "显示键盘当前操作位置，是交互状态而不是装饰。", use: "所有可聚焦控件，尤其是自定义按钮、卡片与弹窗。", anatomy: ["控件边界", "外圈偏移", "高对比颜色"], states: ["mouse focus", "keyboard focus", "invalid focus"], a11y: "优先 :focus-visible，确保在深浅背景上都有至少清楚可辨的轮廓。", debug: "不要用 outline: none 直接移除；若视觉冲突，重新设计而不是隐藏。" },
  { id: "masonry", name: "瀑布流", en: "Masonry", category: "内容组织", definition: "按列紧密排列不同高度内容，强调浏览发现而非横向比较。", use: "灵感图、照片和高度差异大、无需逐行对齐的内容集合。", anatomy: ["等宽列", "不等高项目", "稳定加载占位", "分页或增量加载"], states: ["loading", "loaded", "filtering", "end"], a11y: "DOM 阅读顺序必须合理；不要让视觉列顺序和键盘顺序产生不可理解的跳跃。", debug: "筛选时滚动突跳，先保留容器锚点并用稳定 key，不要让全部卡片飞入。" }
];

const motions = [
  { id: "press", name: "即时压感", en: "Press Feedback", category: "微交互", purpose: "在 pointer-down 当帧确认控件已被按下，不等待 click。", spec: "scale 0.98 · 110ms · ease-out", fallback: "reduced-motion 下保留颜色与边框反馈。" },
  { id: "indicator", name: "连续选中底板", en: "Shared Indicator", category: "导航", purpose: "在互斥选项间保留空间连续性，快速反向时从当前位置重新定向。", spec: "transform 190ms · cubic-bezier(.22,1,.36,1)", fallback: "直接切换底色，不移动底板。" },
  { id: "reveal", name: "内容揭示", en: "Content Reveal", category: "进入", purpose: "建立轻微层级，不让整张长页面从远处飞入。", spec: "opacity + translateY(6px) · 200ms", fallback: "60–100ms 纯淡入。" },
  { id: "skeleton-motion", name: "骨架光带", en: "Skeleton Sweep", category: "加载", purpose: "在已知最终几何时表达等待，并保持结果容器尺寸稳定。", spec: "linear-gradient · 1.6s · low contrast", fallback: "静态中性色占位。" },
  { id: "spotlight", name: "指针聚光", en: "Pointer Spotlight", category: "环境", purpose: "用局部光照回应指针位置，只用于大面积展示区而非任务控件。", spec: "pointermove → CSS vars · 1:1 tracking", fallback: "隐藏聚光层。" },
  { id: "modal-motion", name: "模态物化", en: "Modal Materialize", category: "覆盖层", purpose: "从触发语境进入聚焦任务，关闭时沿相反路径返回。", spec: "opacity 0→1 · scale .96→1 · y 6→0 · 220ms", fallback: "极短淡入淡出。" },
  { id: "toast-motion", name: "提示替换", en: "Toast Replace", category: "反馈", purpose: "连续操作时由新消息接管当前提示，不让多个通知争夺注意力。", spec: "enter 180ms · hold 1800ms · exit 160ms", fallback: "即时替换文本。" },
  { id: "sticky-motion", name: "粘性层级", en: "Sticky Elevation", category: "滚动", purpose: "只有内容从工具栏下方经过时才出现材质和边界。", spec: "background + border opacity · 160ms", fallback: "固定实色背景与分隔线。" }
];

const viewMeta = {
  styles: { kicker: "STYLE INDEX", title: "风格图鉴", filters: ["全部", "内容叙事", "强表达", "效率工具", "亲和体验", "空间材质", "信息编排"] },
  compare: { kicker: "CONTROLLED COMPARISON", title: "同构对比", filters: ["全部", "内容叙事", "强表达", "效率工具", "亲和体验", "空间材质", "信息编排"] },
  patterns: { kicker: "PATTERN DICTIONARY", title: "模式词典", filters: ["全部", "覆盖层", "加载反馈", "操作反馈", "导航选择", "内容组织", "系统状态", "可访问性"] },
  motion: { kicker: "MOTION LAB", title: "动效实验", filters: ["全部", "微交互", "导航", "进入", "加载", "环境", "覆盖层", "反馈", "滚动"] },
  library: { kicker: "FULL PUBLIC INDEX", title: "资源总库", filters: ["全部", "StyleKit", "NameThatUI", "React Bits", "Motion Sites", "Aura"] }
};

let currentView = "styles";
let currentFilter = "全部";
let query = "";
let compareIds = ["editorial", "minimal-flat", "neo-brutal"];
let libraryLimit = 120;
let toastTimer;

const root = document.querySelector("#viewRoot");
const count = document.querySelector("#resultCount");
const filterRow = document.querySelector("#filterRow");
const searchInput = document.querySelector("#searchInput");
const dialog = document.querySelector("#detailDialog");
const dialogContent = document.querySelector("#dialogContent");
const toast = document.querySelector("#toast");

function normalizedMatch(values) {
  if (!query) return true;
  return values.join(" ").toLowerCase().includes(query.toLowerCase());
}

function filteredStyles() {
  return styles.filter((item) => (currentFilter === "全部" || item.family === currentFilter) && normalizedMatch([item.name, item.en, item.family, item.tone, item.summary, ...item.tags]));
}

function filteredPatterns() {
  return patterns.filter((item) => (currentFilter === "全部" || item.category === currentFilter) && normalizedMatch([item.name, item.en, item.category, item.definition, item.use, ...item.anatomy]));
}

function filteredMotions() {
  return motions.filter((item) => (currentFilter === "全部" || item.category === currentFilter) && normalizedMatch([item.name, item.en, item.category, item.purpose, item.spec, item.fallback]));
}

function filteredLibrary() {
  return fullCatalog.filter((item) => (currentFilter === "全部" || item.source === currentFilter)
    && normalizedMatch([item.name, item.en, item.family, item.kind, item.source]));
}

function renderFilters() {
  filterRow.innerHTML = viewMeta[currentView].filters.map((filter) => `<button type="button" class="filter-chip ${filter === currentFilter ? "is-active" : ""}" data-filter="${filter}" aria-pressed="${filter === currentFilter}">${filter}</button>`).join("");
}

function stylePreview(item) {
  return `<div class="style-preview preview-${item.id}" style="--accent:${item.accent}">
    <div class="preview-top"><span>NO.${String(styles.indexOf(item) + 1).padStart(2, "0")}</span><i></i></div>
    <div class="preview-copy"><strong>Less noise.<br />More meaning.</strong><p>Designing an interface language that stays clear under pressure.</p></div>
    <span class="preview-cta">Explore <i>↗</i></span>
  </div>`;
}

function renderStyles() {
  const items = filteredStyles();
  count.textContent = String(items.length).padStart(2, "0");
  if (!items.length) return renderEmpty();
  root.innerHTML = `<div class="style-grid">${items.map((item) => `<article class="style-entry">
    <button class="style-open" type="button" data-style="${item.id}" aria-label="查看${item.name}详情">
      ${stylePreview(item)}
      <div class="entry-heading"><div><span>${item.en}</span><h3>${item.name}</h3></div><b>↗</b></div>
    </button>
    <p>${item.summary}</p>
    <div class="tag-row">${item.tags.map((tag) => `<span>${tag}</span>`).join("")}</div>
  </article>`).join("")}</div>`;
}

function renderCompare() {
  const candidates = filteredStyles();
  count.textContent = String(candidates.length).padStart(2, "0");
  root.innerHTML = `<div class="compare-intro"><div><b>固定内容，只替换设计语言</b><p>最多选择三种风格。相同的信息结构能帮你看清真正来自视觉系统的差异。</p></div><span>${compareIds.length} / 3 SELECTED</span></div>
    <div class="compare-picker">${candidates.map((item) => `<button type="button" class="compare-option ${compareIds.includes(item.id) ? "is-selected" : ""}" data-compare="${item.id}" aria-pressed="${compareIds.includes(item.id)}"><i style="background:${item.accent}"></i><span>${item.name}<small>${item.en}</small></span><b>${compareIds.includes(item.id) ? "✓" : "+"}</b></button>`).join("")}</div>
    <div class="comparison-board">${compareIds.map((id) => {
      const item = styles.find((style) => style.id === id);
      return `<article class="comparison-column"><header><span>${item.en}</span><b>${item.name}</b></header>${stylePreview(item)}<ul>${item.rules.slice(0, 2).map((rule) => `<li>${rule}</li>`).join("")}</ul><button class="copy-button" type="button" data-copy="${item.id}">复制风格提示词</button></article>`;
    }).join("")}</div>`;
}

function renderPatterns() {
  const items = filteredPatterns();
  count.textContent = String(items.length).padStart(2, "0");
  if (!items.length) return renderEmpty();
  root.innerHTML = `<div class="pattern-list">${items.map((item, index) => `<button class="pattern-row" type="button" data-pattern="${item.id}">
    <span class="pattern-index">${String(index + 1).padStart(2, "0")}</span>
    <span class="pattern-title"><b>${item.name}</b><small>${item.en}</small></span>
    <span class="pattern-definition">${item.definition}</span>
    <span class="pattern-category">${item.category}</span>
    <span class="pattern-arrow">↗</span>
  </button>`).join("")}</div>`;
}

function motionDemo(item) {
  if (item.id === "press") return `<button class="demo-press" type="button">按住试试 <span>↗</span></button>`;
  if (item.id === "indicator") return `<div class="demo-segments" data-demo-segments><button class="is-active" type="button">图鉴</button><button type="button">词典</button><i></i></div>`;
  if (item.id === "reveal") return `<div class="demo-reveal"><i></i><i></i><i></i></div>`;
  if (item.id === "skeleton-motion") return `<div class="demo-skeleton"><i></i><i></i><i></i></div>`;
  if (item.id === "spotlight") return `<div class="demo-spotlight"><i></i><span>MOVE POINTER</span></div>`;
  if (item.id === "modal-motion") return `<div class="demo-modal"><i></i><div><span></span><span></span><b></b></div></div>`;
  if (item.id === "toast-motion") return `<div class="demo-toast"><span>✓</span><b>已保存到图谱</b></div>`;
  return `<div class="demo-sticky"><header>FILTERS <i></i><i></i></header><span></span><span></span><span></span></div>`;
}

function renderMotions() {
  const items = filteredMotions();
  count.textContent = String(items.length).padStart(2, "0");
  if (!items.length) return renderEmpty();
  root.innerHTML = `<div class="motion-notice"><span>APPLE PRINCIPLE / 01</span><b>先响应，再动画；所有运动都必须能被用户打断。</b><p>这里展示的是可以解释、可以降级的行为规则，不是装饰特效目录。</p></div>
    <div class="motion-grid">${items.map((item, index) => `<article class="motion-card">
      <div class="motion-demo" data-motion-id="${item.id}">${motionDemo(item)}</div>
      <div class="motion-copy"><header><span>${String(index + 1).padStart(2, "0")} / ${item.category}</span><small>${item.en}</small></header><h3>${item.name}</h3><p>${item.purpose}</p><dl><div><dt>参数</dt><dd>${item.spec}</dd></div><div><dt>降级</dt><dd>${item.fallback}</dd></div></dl></div>
    </article>`).join("")}</div>`;
}

function renderLibrary() {
  const items = filteredLibrary();
  const visible = items.slice(0, libraryLimit);
  count.textContent = String(items.length).padStart(3, "0");
  if (!items.length) return renderEmpty();
  root.innerHTML = `<div class="catalog-stats" aria-label="资源总库统计">
      <article><span>ALL INDEX</span><b>${catalogStats.total}</b><p>公开条目总数</p></article>
      <article><span>STYLE</span><b>${catalogStats.styles}</b><p>视觉与布局风格</p></article>
      <article><span>TERM</span><b>${catalogStats.terms}</b><p>界面组件术语</p></article>
      <article><span>MOTION</span><b>${catalogStats.motion}</b><p>动效与交互案例</p></article>
      <article><span>REFERENCE</span><b>${catalogStats.cases}</b><p>站点与系统参考</p></article>
    </div>
    <div class="catalog-explainer">
      <span>READ IT HERE</span>
      <b>全部条目都能在站内直接阅读和复制规范。</b>
      <p>每条包含原创中文解释、适用场景、实现规则与避坑；原站只作为详情末尾的研究来源，不再充当主要内容。</p>
    </div>
    <div class="library-list">${visible.map((item, index) => `<button class="library-row" type="button" data-catalog="${item.id}" aria-label="查看${item.name}完整内容">
      <span class="library-index">${String(index + 1).padStart(3, "0")}</span>
      <span class="library-name"><b>${item.name}</b><small>${item.en}</small></span>
      <span class="library-kind">${item.kind}</span>
      <span class="library-family">${item.family}</span>
      <span class="library-source">${item.source}</span>
      <span class="library-arrow">↗</span>
    </button>`).join("")}</div>
    ${visible.length < items.length
      ? `<button class="load-more" type="button" id="loadMoreLibrary"><span>继续载入</span><b>${visible.length} / ${items.length}</b></button>`
      : `<div class="catalog-end"><span>END OF INDEX</span><b>已显示全部 ${items.length} 条</b></div>`}`;
}

function renderEmpty() {
  root.innerHTML = `<div class="empty-state"><span>NO MATCH</span><h3>图谱里暂时没有这个词</h3><p>尝试更短的关键词，或清除当前分类筛选。</p><button type="button" id="clearSearch">清除筛选</button></div>`;
}

function render() {
  document.querySelector("#viewKicker").textContent = viewMeta[currentView].kicker;
  document.querySelector("#viewTitle").textContent = viewMeta[currentView].title;
  document.querySelectorAll(".nav-button").forEach((button) => {
    const active = button.dataset.view === currentView;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  renderFilters();
  if (currentView === "styles") renderStyles();
  if (currentView === "compare") renderCompare();
  if (currentView === "patterns") renderPatterns();
  if (currentView === "motion") renderMotions();
  if (currentView === "library") renderLibrary();
}

function openStyle(id) {
  const item = styles.find((style) => style.id === id);
  dialogContent.innerHTML = `<div class="dialog-header"><p>${item.en} / ${item.family}</p><h2>${item.name}</h2><span>${item.tone}</span></div>
    <div class="dialog-preview">${stylePreview(item)}</div>
    <div class="dialog-grid">
      <section><h3>核心规则</h3><ol>${item.rules.map((rule) => `<li>${rule}</li>`).join("")}</ol></section>
      <section><h3>避免</h3><p>${item.avoid}</p><h3>执行标签</h3><div class="tag-row">${item.tags.map((tag) => `<span>${tag}</span>`).join("")}</div></section>
    </div>
    <section class="prompt-block"><div><span>READY-TO-USE SPEC</span><b>可执行提示词</b></div><p>${item.prompt}</p><button class="copy-button" type="button" data-copy="${item.id}">复制提示词</button></section>`;
  dialog.showModal();
}

function openCatalog(id) {
  const item = fullCatalog.find((entry) => entry.id === id);
  if (!item) return;
  dialogContent.innerHTML = `<div class="dialog-header"><p>${item.en} / ${item.kind}</p><h2>${item.name}</h2><span>${item.family}</span></div>
    <p class="pattern-lede">${item.summary}</p>
    <div class="dialog-grid catalog-detail-grid">
      <section><h3>适用场景</h3><ol>${item.useCases.map((useCase) => `<li>${useCase}</li>`).join("")}</ol><h3>实现提示</h3><p>${item.implementation}</p></section>
      <section><h3>核心规则</h3><ol>${item.rules.map((rule) => `<li>${rule}</li>`).join("")}</ol><h3>避免</h3><p>${item.avoid}</p></section>
    </div>
    <section class="prompt-block"><div><span>READY-TO-USE SPEC</span><b>站内可执行规范</b></div><p>${item.prompt}</p><button class="copy-button" type="button" data-copy-catalog="${item.id}">复制规范</button></section>
    <a class="catalog-citation" href="${item.sourceUrl}" target="_blank" rel="noreferrer"><span>SOURCE / ${item.source}</span><b>查看原始研究来源</b><i>↗</i></a>`;
  dialog.showModal();
}

function openPattern(id) {
  const item = patterns.find((pattern) => pattern.id === id);
  dialogContent.innerHTML = `<div class="dialog-header"><p>${item.en} / ${item.category}</p><h2>${item.name}</h2><span>UI PATTERN</span></div>
    <p class="pattern-lede">${item.definition}</p>
    <div class="dialog-grid pattern-detail-grid">
      <section><h3>什么时候使用</h3><p>${item.use}</p><h3>组成结构</h3><ol>${item.anatomy.map((part) => `<li>${part}</li>`).join("")}</ol></section>
      <section><h3>关键状态</h3><div class="state-strip">${item.states.map((state) => `<span>${state}</span>`).join("")}</div><h3>无障碍</h3><p>${item.a11y}</p></section>
    </div>
    <section class="debug-block"><span>DEBUG NOTE</span><b>常见问题怎么查</b><p>${item.debug}</p></section>`;
  dialog.showModal();
}

async function copyPrompt(id) {
  const item = styles.find((style) => style.id === id);
  try {
    await navigator.clipboard.writeText(item.prompt);
    showToast(`已复制「${item.name}」提示词`);
  } catch {
    showToast("复制失败，请手动选择文本");
  }
}

async function copyCatalogPrompt(id) {
  const item = fullCatalog.find((entry) => entry.id === id);
  if (!item) return;
  try {
    await navigator.clipboard.writeText(item.prompt);
    showToast(`已复制「${item.name}」规范`);
  } catch {
    showToast("复制失败，请手动选择文本");
  }
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 1800);
}

function setView(view, shouldScroll = false) {
  currentView = view;
  currentFilter = "全部";
  query = "";
  libraryLimit = 120;
  searchInput.value = "";
  render();
  if (shouldScroll) document.querySelector("#workspace").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
}

document.addEventListener("click", (event) => {
  const nav = event.target.closest("[data-view]");
  if (nav) setView(nav.dataset.view, true);
  const jump = event.target.closest("[data-jump]");
  if (jump) setView(jump.dataset.jump, true);
  const filter = event.target.closest("[data-filter]");
  if (filter) { currentFilter = filter.dataset.filter; libraryLimit = 120; render(); }
  const loadMore = event.target.closest("#loadMoreLibrary");
  if (loadMore) { libraryLimit += 120; renderLibrary(); }
  const style = event.target.closest("[data-style]");
  if (style) openStyle(style.dataset.style);
  const pattern = event.target.closest("[data-pattern]");
  if (pattern) openPattern(pattern.dataset.pattern);
  const catalog = event.target.closest("[data-catalog]");
  if (catalog) openCatalog(catalog.dataset.catalog);
  const copy = event.target.closest("[data-copy]");
  if (copy) copyPrompt(copy.dataset.copy);
  const copyCatalog = event.target.closest("[data-copy-catalog]");
  if (copyCatalog) copyCatalogPrompt(copyCatalog.dataset.copyCatalog);
  const option = event.target.closest("[data-compare]");
  if (option) {
    const id = option.dataset.compare;
    if (compareIds.includes(id)) compareIds = compareIds.filter((item) => item !== id);
    else if (compareIds.length < 3) compareIds = [...compareIds, id];
    else showToast("最多同时比较三种风格");
    renderCompare();
  }
  if (event.target.closest("#clearSearch")) { query = ""; currentFilter = "全部"; libraryLimit = 120; searchInput.value = ""; render(); }
  const segment = event.target.closest("[data-demo-segments] button");
  if (segment) {
    const group = segment.parentElement;
    group.querySelectorAll("button").forEach((button) => button.classList.toggle("is-active", button === segment));
    group.classList.toggle("is-second", segment === group.querySelector("button:last-of-type"));
  }
});

searchInput.addEventListener("input", () => { query = searchInput.value.trim(); libraryLimit = 120; render(); });
document.querySelector("#searchTrigger").addEventListener("click", () => { document.querySelector("#workspace").scrollIntoView({ behavior: "smooth" }); searchInput.focus({ preventScroll: true }); });
document.addEventListener("keydown", (event) => {
  if (event.key === "/" && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { event.preventDefault(); searchInput.focus(); }
});
document.querySelector("#dialogClose").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });

document.addEventListener("pointermove", (event) => {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const spotlight = event.target.closest(".demo-spotlight, .hero-specimen");
  if (!spotlight) return;
  const rect = spotlight.getBoundingClientRect();
  spotlight.style.setProperty("--pointer-x", `${event.clientX - rect.left}px`);
  spotlight.style.setProperty("--pointer-y", `${event.clientY - rect.top}px`);
});

render();
