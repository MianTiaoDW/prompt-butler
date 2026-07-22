import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  ArrowDown2,
  ArrowLeft,
  Book,
  CloseCircle,
  Copy,
  Edit2,
  Filter,
  Folder2,
  Gallery,
  Heart,
  More,
  SearchNormal,
  Setting2,
  Sort,
  Trash,
} from "iconsax-reactjs";

type RibbonIconName = "ai-spark" | "upload" | "processing" | "success" | "warning" | "command-entry";
type LayoutMode = "compact" | "split" | "triple";
type AiState = "closed" | "open" | "processing" | "complete";
type UploadState = "idle" | "uploading" | "success" | "error";
type PromptCardState = "default" | "hover" | "selected";
type Workspace = "creator" | "library";

const ribbonIcons: Array<{ id: RibbonIconName; label: string; use: string; version: string }> = [
  { id: "ai-spark", label: "AI Spark", use: "AI 优化与 Inspector", version: "V11" },
  { id: "upload", label: "Upload", use: "参考图与资产上传", version: "V11" },
  { id: "processing", label: "Processing", use: "AI 与生图处理中", version: "V11" },
  { id: "success", label: "Success", use: "任务与保存完成", version: "V12" },
  { id: "warning", label: "Warning", use: "配置错误与提醒", version: "V12" },
  { id: "command-entry", label: "Command Entry", use: "关键命令入口", version: "V12" },
];

const prompts = [
  {
    id: "portrait-rain",
    title: "雨夜电影感侧脸",
    category: "人像摄影",
    kind: "portrait",
    tags: ["电影感", "85mm", "低照度"],
    content: "雨夜街道，人物侧脸由冷白轮廓光勾勒。湿润路面反射远处蓝色霓虹，使用 85mm 镜头与浅景深，保留细腻胶片颗粒和真实肤质。",
    favorite: true,
  },
  {
    id: "skincare-still",
    title: "极简护肤品静物",
    category: "电商产品",
    kind: "product",
    tags: ["静物", "柔光", "留白"],
    content: "哑光白色护肤品瓶置于浅灰石材台面，柔和侧逆光控制边缘反射，画面保留充足留白，材质真实，标签清晰但不过度锐化。",
    favorite: false,
  },
  {
    id: "toy-turnaround",
    title: "潮玩角色三视图",
    category: "角色设定",
    kind: "character",
    tags: ["潮玩", "三视图", "白底"],
    content: "原创潮玩角色的正面、侧面与背面视图，统一比例与材质，白色无缝背景，中性站姿，便于后续建模和结构检查。",
    favorite: true,
  },
  {
    id: "architecture-entry",
    title: "住宅入口光影",
    category: "空间设计",
    kind: "space",
    tags: ["建筑", "黄昏", "材质"],
    content: "现代住宅入口在黄昏环境光下呈现，深色金属、清水混凝土和暖木形成克制对比，强调真实尺度、路径引导与入口安全感。",
    favorite: false,
  },
  {
    id: "perfume-macro",
    title: "香水广告微距",
    category: "广告创意",
    kind: "product",
    tags: ["微距", "玻璃", "水雾"],
    content: "透明香水瓶的微距产品摄影，冷色环境光沿玻璃边缘折射，细小水雾保持真实，避免夸张光效，背景安静且不抢夺产品标签。",
    favorite: false,
  },
];

const libraryGroups = [
  { label: "全部提示词", count: 42, Icon: Book },
  { label: "收藏", count: 12, Icon: Heart },
  { label: "人像摄影", count: 9, Icon: Gallery },
  { label: "电商产品", count: 8, Icon: Folder2 },
  { label: "空间设计", count: 7, Icon: Folder2 },
  { label: "视频分镜", count: 6, Icon: Folder2 },
];

function usePageVisibility() {
  const [visible, setVisible] = useState(() => !document.hidden);

  useEffect(() => {
    const update = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  return visible;
}

function RibbonIcon({ name, assetSize = 64, displaySize = assetSize, className = "" }: {
  name: RibbonIconName;
  assetSize?: 48 | 64 | 96 | 128;
  displaySize?: number;
  className?: string;
}) {
  const base = `./assets/ribbon-icons/v1/${assetSize}/${name}`;
  return <picture className={`ribbon-glyph ${className}`} style={{ "--glyph-size": `${displaySize}px` } as CSSProperties}>
    <source srcSet={`${base}.webp`} type="image/webp" />
    <img src={`${base}.png`} width={displaySize} height={displaySize} alt="" decoding="async" />
  </picture>;
}

function CategoryThumbnail({ kind, compact = false }: { kind: string; compact?: boolean }) {
  return <div className={`category-thumbnail is-${kind} ${compact ? "is-compact" : ""}`} aria-label="暂无示例图片">
    <Gallery size={compact ? 22 : 32} variant="Bulk" />
  </div>;
}

function TopNavigation({ compact = false, activeWorkspace, onWorkspaceChange }: {
  compact?: boolean;
  activeWorkspace: Workspace;
  onWorkspaceChange: (workspace: Workspace) => void;
}) {
  const navItems = [
    { label: "创作", Icon: Edit2, workspace: "creator" as const },
    { label: "提示词库", Icon: Book, workspace: "library" as const },
    { label: "图像工坊", Icon: Gallery },
    { label: "设置", Icon: Setting2 },
  ];
  const selected = activeWorkspace === "creator" ? 0 : 1;
  const [inputMethod, setInputMethod] = useState<"pointer" | "keyboard">("pointer");

  return <nav className={`workbench-nav ${compact ? "is-compact" : ""}`} aria-label="主导航">
    <div className="brand-lockup"><RibbonIcon name="ai-spark" assetSize={48} displaySize={compact ? 30 : 34} /><span>提示词管家</span></div>
    <div
      className={`nav-items is-${inputMethod}-input`}
      style={{ "--selected-index": selected } as CSSProperties}
      onPointerDown={() => setInputMethod("pointer")}
      onKeyDown={() => setInputMethod("keyboard")}
    >
      <span className="nav-selection" aria-hidden="true" />
      {navItems.map(({ label, Icon, workspace }, index) => <button key={label} className={selected === index ? "is-selected" : ""} onClick={() => workspace && onWorkspaceChange(workspace)} aria-current={selected === index ? "page" : undefined}>
        <Icon size={18} variant={selected === index ? "Bulk" : "Linear"} />
        {!compact ? <span>{label}</span> : null}
      </button>)}
    </div>
  </nav>;
}

const creatorBrief = "为一款东方茶饮设计商业海报。产品悬浮在晨雾山谷中，柔和逆光穿过茶叶与水汽，画面克制高级，并为品牌标题预留干净区域。";

function CreatorSettingRow({ title, value }: { title: string; value: string }) {
  return <button className="creator-setting-row-v1"><span><strong>{title}</strong><small>{value}</small></span><ArrowDown2 size={17} /></button>;
}

function CreatorOutputCard({ language, title, content, compact = false }: {
  language: string;
  title: string;
  content: string;
  compact?: boolean;
}) {
  return <article className={`creator-output-card ${compact ? "is-compact" : ""}`}>
    <header><span><small>{language}</small><strong>{title}</strong></span><div><button aria-label="编辑"><Edit2 size={16} /></button><button aria-label="复制"><Copy size={16} /></button></div></header>
    <p>{content}</p>
    <footer><button><Heart size={15} />保存到提示词库</button><button>用于图像创作</button></footer>
  </article>;
}

function CreatorWorkspace({ mode }: { mode: LayoutMode }) {
  const [generationState, setGenerationState] = useState<"ready" | "processing" | "complete">("complete");
  const compact = mode === "compact";
  const startGeneration = () => {
    if (generationState === "processing") return;
    setGenerationState("processing");
    window.setTimeout(() => setGenerationState("complete"), 720);
  };

  return <main className={`creator-workspace-v1 is-${mode}`}>
    <section className="creator-compose-pane">
      <header className="creator-hero-v1"><div><small>CREATE WITH AI</small><h1>创作提示词</h1><p>描述你的想法，让 AI 帮你生成专业提示词。</p></div><RibbonIcon name="ai-spark" assetSize={64} displaySize={compact ? 48 : 58} /></header>

      <section className="creator-idea-surface-v1">
        <header><div><strong>创意描述</strong><small>写下主体、场景、风格或想表达的氛围</small></div><span>{creatorBrief.length} 字</span></header>
        <textarea defaultValue={creatorBrief} aria-label="创意描述" />
        <footer><button className="creator-upload-action"><RibbonIcon name="upload" assetSize={48} displaySize={34} /><span>添加参考图</span><small>0 / 8</small></button><div className="creator-recents"><span>最近使用</span><button>产品海报</button><button>电影人像</button></div></footer>
      </section>

      <section className="creator-config-v1" aria-label="智能配置">
        <CreatorSettingRow title="专家身份" value="视觉创作专家" />
        <CreatorSettingRow title="专业工作流" value="电影级图像提示词" />
        <CreatorSettingRow title="模型" value="gpt-5.6-luna" />
      </section>

      <section className="creator-generate-v1">
        <div><span className={`creator-status-dot is-${generationState}`} /><span>{generationState === "processing" ? "正在通过 AI 扩写并收敛提示词" : generationState === "complete" ? "生成结果已就绪" : "填写完成后开始生成"}</span></div>
        <PrimaryButton state={generationState === "processing" ? "loading" : "default"} onClick={startGeneration}>{generationState === "processing" ? "正在生成" : generationState === "complete" ? "重新生成" : "开始生成"}</PrimaryButton>
      </section>
    </section>

    <section className="creator-result-pane">
      <header className="creator-result-heading"><div><small>OUTPUT WORKBENCH</small><h2>{generationState === "processing" ? "正在生成提示词" : "本次生成结果"}</h2></div>{generationState === "processing" ? <RibbonIcon name="processing" assetSize={64} displaySize={54} /> : <RibbonIcon name="success" assetSize={64} displaySize={52} />}</header>
      <div className="creator-result-scroll">
        <CreatorOutputCard language="ZH" title="中文提示词" compact={compact} content="东方高端茶饮商业海报，主产品悬浮于晨雾山谷中央。柔和冷白逆光穿透半透明茶叶与细腻水汽，瓶身边缘保持真实折射与清晰标签，背景留出克制的品牌标题区域。" />
        <CreatorOutputCard language="EN" title="English Prompt" compact={compact} content="Premium oriental tea campaign, hero product floating above a misty mountain valley, soft cool-white backlight passing through translucent tea leaves and fine vapor, realistic bottle refraction, restrained negative space for the brand title." />
        <button className="creator-structured-row"><span><small>JSON</small><strong>高级结构化数据</strong></span><ArrowDown2 size={17} /></button>
      </div>
      <footer className="creator-result-actions"><button>保存全部</button><PrimaryButton><Gallery size={17} />开始图像创作</PrimaryButton></footer>
    </section>
  </main>;
}

function CommandBar({ forceFocus = false }: { forceFocus?: boolean }) {
  const [focused, setFocused] = useState(false);
  const [query, setQuery] = useState("");
  const active = forceFocus || focused;

  return <form className={`command-bar-v1 ${active ? "is-focused" : ""}`} onSubmit={(event) => event.preventDefault()}>
    <SearchNormal size={20} variant="Linear" />
    <label className="sr-only" htmlFor={forceFocus ? "focus-command" : "main-command"}>搜索提示词</label>
    <input id={forceFocus ? "focus-command" : "main-command"} value={query} onChange={(event) => setQuery(event.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} placeholder="搜索标题、标签或输入命令" />
    <kbd>⌘ K</kbd>
    <button className="command-submit" aria-label="执行命令"><RibbonIcon name="command-entry" assetSize={48} displaySize={38} /></button>
  </form>;
}

function LibraryRail() {
  return <aside className="library-rail">
    <header><span>资料库</span><button aria-label="更多"><More size={18} /></button></header>
    <div className="library-groups">
      {libraryGroups.map(({ label, count, Icon }, index) => <button key={label} className={index === 0 ? "is-selected" : ""}>
        <Icon size={18} variant={index === 0 ? "Bulk" : "Linear"} />
        <span>{label}</span><small>{count}</small>
      </button>)}
    </div>
    <button className="library-manage"><Folder2 size={18} />管理文件夹</button>
  </aside>;
}

function PromptCard({ prompt, state = "default", onOpen, compact = false }: {
  prompt: typeof prompts[number];
  state?: PromptCardState;
  onOpen?: () => void;
  compact?: boolean;
}) {
  const [favorite, setFavorite] = useState(prompt.favorite);

  return <article className={`prompt-card is-${state} ${compact ? "is-compact" : ""}`}>
    <button className="prompt-card-main" onClick={onOpen}>
      <CategoryThumbnail kind={prompt.kind} compact={compact} />
      <span className="prompt-card-copy"><strong>{prompt.title}</strong><small>{prompt.category}</small><p>{prompt.content}</p></span>
    </button>
    <footer>
      <div className="prompt-tags">{prompt.tags.slice(0, compact ? 2 : 3).map((tag) => <span key={tag}>{tag}</span>)}</div>
      <div className="prompt-actions">
        <button aria-label="复制"><Copy size={16} /></button>
        <button aria-label="编辑"><Edit2 size={16} /></button>
        <button className={favorite ? "is-favorite" : ""} aria-label={favorite ? "取消收藏" : "收藏"} aria-pressed={favorite} onClick={() => setFavorite((value) => !value)}><Heart size={16} variant={favorite ? "Bold" : "Linear"} /></button>
        <button aria-label="删除"><Trash size={16} /></button>
      </div>
    </footer>
  </article>;
}

function PromptList({ selectedId, onSelect, compact = false }: { selectedId: string; onSelect: (id: string) => void; compact?: boolean }) {
  return <section className="prompt-list-pane">
    <header className="pane-heading"><div><strong>全部提示词</strong><span>42 项</span></div><div><button aria-label="筛选"><Filter size={18} /></button><button aria-label="排序"><Sort size={18} /></button></div></header>
    <div className="prompt-list-scroll">
      {prompts.map((prompt, index) => <PromptCard key={prompt.id} prompt={prompt} compact={compact} state={prompt.id === selectedId ? "selected" : index === 1 ? "hover" : "default"} onOpen={() => onSelect(prompt.id)} />)}
    </div>
  </section>;
}

function PrimaryButton({ state = "default", children, onClick }: { state?: "default" | "hover" | "pressed" | "loading"; children: ReactNode; onClick?: () => void }) {
  return <button className={`primary-button is-${state}`} disabled={state === "loading"} onClick={onClick}>{state === "loading" ? <span className="loading-indicator" /> : null}{children}</button>;
}

function AiInspector({ forcedState, compact = false }: { forcedState?: AiState; compact?: boolean }) {
  const [localState, setLocalState] = useState<AiState>("open");
  const state = forcedState ?? localState;
  if (state === "closed") return <button className="ai-inspector-closed" onClick={() => setLocalState("open")}><RibbonIcon name="ai-spark" assetSize={48} displaySize={42} /><span><strong>AI Inspector</strong><small>检查并优化当前 Prompt</small></span></button>;

  return <aside className={`ai-inspector is-${state} ${compact ? "is-compact" : ""}`}>
    <header><RibbonIcon name={state === "processing" ? "processing" : state === "complete" ? "success" : "ai-spark"} assetSize={64} displaySize={compact ? 52 : 60} /><span><small>AI Inspector</small><strong>{state === "processing" ? "正在收敛提示词" : state === "complete" ? "优化建议已完成" : "提示词结构检查"}</strong></span><button onClick={() => setLocalState("closed")} aria-label="关闭"><CloseCircle size={18} /></button></header>
    <div className="inspector-findings">
      <p><span>镜头语言</span><strong>85mm · 浅景深</strong></p>
      <p><span>主光方向</span><strong>左后侧冷白轮廓光</strong></p>
      <p><span>可优化</span><strong>减少泛化氛围词</strong></p>
    </div>
    <footer><button>查看差异</button><PrimaryButton state={state === "processing" ? "loading" : "default"}>{state === "complete" ? "应用建议" : "开始优化"}</PrimaryButton></footer>
  </aside>;
}

function DetailPane({ prompt, inspectorState = "open" }: { prompt: typeof prompts[number]; inspectorState?: AiState }) {
  return <section className="detail-pane">
    <header className="detail-header"><div><small>{prompt.category}</small><h2>{prompt.title}</h2><div className="prompt-tags">{prompt.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div><button aria-label="更多"><More size={20} /></button></header>
    <div className="detail-scroll">
      <CategoryThumbnail kind={prompt.kind} />
      <section className="prompt-content"><header><span>中文提示词</span><button><Copy size={16} />复制</button></header><p>{prompt.content}</p></section>
      <AiInspector forcedState={inspectorState} compact />
    </div>
    <footer className="detail-actions"><button><Edit2 size={18} />编辑</button><button><Copy size={18} />复制 Prompt</button><PrimaryButton><RibbonIcon name="ai-spark" assetSize={48} displaySize={34} />AI 优化</PrimaryButton></footer>
  </section>;
}

function PromptModal({ prompt, onClose }: { prompt: typeof prompts[number]; onClose: () => void }) {
  return <div className="modal-backdrop" onMouseDown={onClose}>
    <section className="prompt-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onMouseDown={(event) => event.stopPropagation()}>
      <header><div><small>{prompt.category}</small><h2 id="modal-title">{prompt.title}</h2></div><button onClick={onClose} aria-label="关闭"><CloseCircle size={20} /></button></header>
      <div className="modal-content"><CategoryThumbnail kind={prompt.kind} /><section className="prompt-content"><header><span>中文提示词</span></header><p>{prompt.content}</p></section><AiInspector compact /></div>
      <footer><button><Edit2 size={18} />编辑</button><button><Copy size={18} />复制 Prompt</button><PrimaryButton><RibbonIcon name="ai-spark" assetSize={48} displaySize={32} />AI 优化</PrimaryButton></footer>
    </section>
  </div>;
}

function Workbench({ width, mode, forceModal = false, forceCommandFocus = false, inspectorState = "open" }: {
  width: 420 | 680 | 980;
  mode: LayoutMode;
  forceModal?: boolean;
  forceCommandFocus?: boolean;
  inspectorState?: AiState;
}) {
  const [workspace, setWorkspace] = useState<Workspace>("library");
  const [selectedId, setSelectedId] = useState(prompts[0].id);
  const [modalPrompt, setModalPrompt] = useState<typeof prompts[number] | null>(forceModal ? prompts[0] : null);
  const selectedPrompt = prompts.find((prompt) => prompt.id === selectedId) ?? prompts[0];

  const selectPrompt = (id: string) => {
    const next = prompts.find((prompt) => prompt.id === id) ?? prompts[0];
    setSelectedId(id);
    if (mode === "compact") setModalPrompt(next);
  };

  return <div className={`workbench-shell mode-${mode} workspace-${workspace}`} style={{ width }}>
    <TopNavigation compact={mode === "compact"} activeWorkspace={workspace} onWorkspaceChange={setWorkspace} />
    {workspace === "library" ? <><div className="workbench-command"><CommandBar forceFocus={forceCommandFocus} /></div>
      <div className="workbench-content">
        {mode === "triple" ? <LibraryRail /> : null}
        <PromptList selectedId={selectedId} onSelect={selectPrompt} compact={mode !== "compact"} />
        {mode !== "compact" ? <DetailPane prompt={selectedPrompt} inspectorState={inspectorState} /> : null}
      </div></> : <CreatorWorkspace mode={mode} />}
    {modalPrompt ? <PromptModal prompt={modalPrompt} onClose={() => setModalPrompt(null)} /> : null}
  </div>;
}

function CreatorWorkbench({ width, mode }: { width: 420 | 680 | 980; mode: LayoutMode }) {
  const [workspace, setWorkspace] = useState<Workspace>("creator");
  return <div className={`workbench-shell mode-${mode} workspace-${workspace}`} style={{ width }}>
    <TopNavigation compact={mode === "compact"} activeWorkspace={workspace} onWorkspaceChange={setWorkspace} />
    {workspace === "creator" ? <CreatorWorkspace mode={mode} /> : <div className="creator-library-redirect"><Book size={24} /><span>提示词库母版已单独完成</span></div>}
  </div>;
}

function UploadPanel({ state }: { state: UploadState }) {
  const copy = {
    idle: ["等待上传", "选择参考图或拖入资产"],
    uploading: ["正在上传", "正在校验文件并写入临时资产"],
    success: ["上传完成", "参考图已关联到当前 Prompt"],
    error: ["上传失败", "文件未写入，请检查格式后重试"],
  }[state];
  const icon: RibbonIconName = state === "idle" ? "upload" : state === "uploading" ? "processing" : state === "success" ? "success" : "warning";

  return <article className={`upload-panel-v1 is-${state}`}>
    <header><RibbonIcon name={icon} assetSize={96} displaySize={86} /><div><small>参考资产</small><h3>{copy[0]}</h3><p>{copy[1]}</p></div></header>
    <div className="progress-chamber-v1"><div><span>{state === "uploading" ? "演示进度" : state === "success" ? "已完成" : state === "error" ? "需要处理" : "未开始"}</span><strong>{state === "uploading" ? "68%" : state === "success" ? "100%" : ""}</strong></div><span className="progress-track-v1"><i /></span></div>
    <footer><button>{state === "error" ? "重新选择" : "选择文件"}</button><PrimaryButton state={state === "uploading" ? "loading" : "default"}>{state === "success" ? "继续" : "上传资产"}</PrimaryButton></footer>
  </article>;
}

function StatusPanel({ kind }: { kind: "success" | "warning" }) {
  return <article className={`status-panel is-${kind}`}><RibbonIcon name={kind} assetSize={64} displaySize={58} /><div><strong>{kind === "success" ? "Prompt 已保存" : "生图配置需要处理"}</strong><p>{kind === "success" ? "当前版本已写入提示词库。" : "尚未设置可用的生图模型。"}</p></div><button>{kind === "success" ? "查看" : "检查配置"}</button></article>;
}

function IconOverview() {
  return <section className="icon-overview">
    <header><div><span>Frozen geometry</span><h1>Gradient Ribbon Icons</h1></div><p>透明 Glyph，不烘焙底框。暗色、浅色和 48px 实际尺寸同时验证。</p></header>
    <div className="icon-overview-grid">{ribbonIcons.map((icon) => <article key={icon.id}><div className="icon-proof"><span className="proof-dark"><RibbonIcon name={icon.id} assetSize={128} /></span><span className="proof-light"><RibbonIcon name={icon.id} assetSize={128} /></span><span className="proof-48"><RibbonIcon name={icon.id} assetSize={48} /><small>48</small></span></div><h3>{icon.label}<small>{icon.version}</small></h3><p>{icon.use}</p></article>)}</div>
  </section>;
}

function StateShowcase({ kind }: { kind: "cards" | "ai" | "upload" | "status" | "buttons" }) {
  if (kind === "cards") return <section className="state-showcase card-showcase">{(["default", "hover", "selected"] as PromptCardState[]).map((state) => <div key={state}><span>{state}</span><PromptCard prompt={prompts[state === "selected" ? 0 : state === "hover" ? 1 : 2]} state={state} /></div>)}</section>;
  if (kind === "ai") return <section className="state-showcase ai-showcase">{(["closed", "open", "processing", "complete"] as AiState[]).map((state) => <div key={state}><span>{state}</span><AiInspector forcedState={state} /></div>)}</section>;
  if (kind === "upload") return <section className="state-showcase upload-showcase">{(["idle", "uploading", "success", "error"] as UploadState[]).map((state) => <div key={state}><span>{state}</span><UploadPanel state={state} /></div>)}</section>;
  if (kind === "status") return <section className="state-showcase status-showcase"><StatusPanel kind="success" /><StatusPanel kind="warning" /></section>;
  return <section className="state-showcase button-showcase">{(["default", "hover", "pressed", "loading"] as const).map((state) => <div key={state}><span>{state}</span><PrimaryButton state={state}>主要操作</PrimaryButton></div>)}</section>;
}

const integrationSummaryImages = {
  referenceA: new URL("./assets/references/reference-a.png", import.meta.url).href,
  referenceB: new URL("./assets/references/reference-b.png", import.meta.url).href,
  generatedUpload: new URL("./assets/references/generated-upload-panel.png", import.meta.url).href,
  generatedCommand: new URL("./assets/references/generated-command-bar.png", import.meta.url).href,
  creator420: new URL("./output/playwright/42-creator-420.png", import.meta.url).href,
  creator680: new URL("./output/playwright/43-creator-680.png", import.meta.url).href,
  creator980: new URL("./output/playwright/44-creator-980.png", import.meta.url).href,
  master420: new URL("./output/playwright/34-master-420-optical-authority.png", import.meta.url).href,
  master680: new URL("./output/playwright/33-master-680-optical-authority.png", import.meta.url).href,
  master980: new URL("./output/playwright/32-master-980-optical-authority.png", import.meta.url).href,
  icons: new URL("./output/playwright/01-ribbon-icons-overview.png", import.meta.url).href,
  cards: new URL("./output/playwright/38-card-states-optical-authority.png", import.meta.url).href,
  ai: new URL("./output/playwright/36-ai-states-optical-authority.png", import.meta.url).href,
  upload: new URL("./output/playwright/37-upload-states-optical-authority.png", import.meta.url).href,
};

function SummaryPanel({ number, title, subtitle, children, className = "" }: {
  number: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  className?: string;
}) {
  return <section className={`summary-panel ${className}`}>
    <header><span>{number}</span><div><h2>{title}</h2><p>{subtitle}</p></div></header>
    <div className="summary-panel-body">{children}</div>
  </section>;
}

function IntegrationSummary() {
  return <main className="integration-summary-board">
    <header className="summary-board-header"><div><small>提示词生成管家 · 隔离视觉整合实验</small><h1>Visual Integration Lab V1.3 · Creator Restored</h1></div><span>Creation + Library / Frozen Ribbon Glyphs</span></header>

    <div className="summary-board-top">
      <SummaryPanel number="01" title="Reference → Optical Component" subtitle="参考图与依据参考图生成的真实光学组件并排对照">
        <div className="reference-comparisons">
          <figure><img src={integrationSummaryImages.referenceA} alt="Upload 参考图" /><figcaption>Reference A · Upload</figcaption></figure>
          <figure><img src={integrationSummaryImages.generatedUpload} alt="生成的 Upload Panel" /><figcaption>Generated · Upload Panel</figcaption></figure>
          <figure><img src={integrationSummaryImages.referenceB} alt="Command Bar 参考图" /><figcaption>Reference B · Command</figcaption></figure>
          <figure><img src={integrationSummaryImages.generatedCommand} alt="生成的 Optical Command Bar" /><figcaption>Generated · Command Bar</figcaption></figure>
        </div>
      </SummaryPanel>

      <SummaryPanel number="02" title="980 Prompt Creator Master" subtitle="真实创作流程 · 创意描述、配置、生成与结果工作台" className="summary-master-panel">
        <img className="summary-master-image" src={integrationSummaryImages.creator980} alt="980px 提示词创作视觉母版" />
      </SummaryPanel>
    </div>

    <SummaryPanel number="03" title="Responsive Prompt Creator" subtitle="恢复正式源码中的原始创作流程，并为 420 / 680 / 980 分别排版">
      <div className="responsive-master-grid">
        <figure className="is-420"><img src={integrationSummaryImages.creator420} alt="420px 创作母版" /><figcaption>420 · Compose + Scroll Results</figcaption></figure>
        <figure className="is-680"><img src={integrationSummaryImages.creator680} alt="680px 创作母版" /><figcaption>680 · Compose + Output</figcaption></figure>
        <figure className="is-980"><img src={integrationSummaryImages.creator980} alt="980px 创作母版" /><figcaption>980 · Full Creation Workbench</figcaption></figure>
      </div>
    </SummaryPanel>

    <SummaryPanel number="04" title="Responsive Prompt Library" subtitle="保留 420 / 680 / 980 既定提示词库信息架构，不与创作页混合">
      <div className="responsive-master-grid">
        <figure className="is-420"><img src={integrationSummaryImages.master420} alt="420px 单栏母版" /><figcaption>420 · List + Modal</figcaption></figure>
        <figure className="is-680"><img src={integrationSummaryImages.master680} alt="680px 双栏母版" /><figcaption>680 · List + Detail</figcaption></figure>
        <figure className="is-980"><img src={integrationSummaryImages.master980} alt="980px 三栏母版" /><figcaption>980 · Library + List + Detail</figcaption></figure>
      </div>
    </SummaryPanel>

    <div className="summary-board-bottom">
      <div className="summary-board-column">
        <SummaryPanel number="05" title="Frozen Ribbon Icon Assets" subtitle="透明 Glyph · 48px 真实显示 · 统一视觉占位">
          <img className="summary-proof-image" src={integrationSummaryImages.icons} alt="六枚 Ribbon 图标资产" />
        </SummaryPanel>
        <SummaryPanel number="06" title="Prompt Card States" subtitle="Default / Hover / Selected · Rose 仅用于收藏">
          <img className="summary-proof-image" src={integrationSummaryImages.cards} alt="Prompt Card 状态" />
        </SummaryPanel>
      </div>
      <div className="summary-board-column">
        <SummaryPanel number="07" title="AI Inspector States" subtitle="Closed / Open / Processing / Complete">
          <img className="summary-proof-image" src={integrationSummaryImages.ai} alt="AI Inspector 状态" />
        </SummaryPanel>
        <SummaryPanel number="08" title="Upload / Processing States" subtitle="Idle / Uploading / Success / Error">
          <img className="summary-proof-image" src={integrationSummaryImages.upload} alt="上传与处理状态" />
        </SummaryPanel>
      </div>
    </div>
  </main>;
}

function LabOverview() {
  return <main className="lab-overview">
    <header><span>Visual Integration Lab V1.3</span><h1>创作与提示词库视觉母版</h1><p>创作工作区回归真实产品流程；提示词库保留既定 420 / 680 / 980 信息架构，冻结 Ribbon Glyph。</p></header>
    <IconOverview />
    <section className="master-preview-row"><CreatorWorkbench width={420} mode="compact" /><CreatorWorkbench width={680} mode="split" /><CreatorWorkbench width={980} mode="triple" /></section>
    <section className="master-preview-row"><Workbench width={420} mode="compact" /><Workbench width={680} mode="split" /><Workbench width={980} mode="triple" /></section>
  </main>;
}

function Shot({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <main className={`shot-shell ${className}`}>{children}</main>;
}

export function VisualIntegrationLab() {
  const shot = useMemo(() => new URLSearchParams(window.location.search).get("shot"), []);
  const pageVisible = usePageVisibility();
  const content = (() => {
    if (shot === "icons") return <Shot><IconOverview /></Shot>;
    if (shot === "master-420") return <Shot><Workbench width={420} mode="compact" /></Shot>;
    if (shot === "master-680") return <Shot><Workbench width={680} mode="split" /></Shot>;
    if (shot === "master-980") return <Shot><Workbench width={980} mode="triple" /></Shot>;
    if (shot === "creator-420") return <Shot><CreatorWorkbench width={420} mode="compact" /></Shot>;
    if (shot === "creator-680") return <Shot><CreatorWorkbench width={680} mode="split" /></Shot>;
    if (shot === "creator-980") return <Shot><CreatorWorkbench width={980} mode="triple" /></Shot>;
    if (shot === "prompt-modal") return <Shot><Workbench width={420} mode="compact" forceModal /></Shot>;
    if (shot === "command-focus") return <Shot><Workbench width={680} mode="split" forceCommandFocus /></Shot>;
    if (shot === "card-states") return <Shot><StateShowcase kind="cards" /></Shot>;
    if (shot === "ai-processing") return <Shot><StateShowcase kind="ai" /></Shot>;
    if (shot === "upload-states") return <Shot><StateShowcase kind="upload" /></Shot>;
    if (shot === "status-states") return <Shot><StateShowcase kind="status" /></Shot>;
    if (shot === "button-states") return <Shot><StateShowcase kind="buttons" /></Shot>;
    if (shot === "reduced-motion") return <Shot className="force-reduced-motion"><Workbench width={680} mode="split" inspectorState="processing" /></Shot>;
    if (shot === "reduced-transparency") return <Shot className="force-reduced-transparency"><Workbench width={680} mode="split" inspectorState="processing" /></Shot>;
    if (shot === "integration-summary") return <IntegrationSummary />;
    return <LabOverview />;
  })();

  return <div className="visual-lab" data-page-visible={pageVisible}>{content}</div>;
}
