import { useId, useMemo, useState } from "react";
import type { ComponentType } from "react";
import type { IconProps } from "iconsax-reactjs";
import {
  ArrowDown,
  Book,
  Brush2,
  Clock,
  CloseCircle,
  Copy,
  DocumentUpload,
  Edit2,
  Folder2,
  Gallery,
  Heart,
  Image,
  LampCharge,
  Magicpen,
  More,
  SearchNormal,
  Send2,
  Setting2,
} from "iconsax-reactjs";

type UploadState = "idle" | "uploading" | "generating" | "success" | "error";
type CardState = "default" | "hover" | "selected" | "pressed";
type AiState = "closed" | "ready" | "processing" | "complete" | "error";
type OpticalIcon = ComponentType<IconProps>;
type HeroIconKind = "ai" | "upload" | "processing" | "success" | "warning" | "command";

const uploadLabels: Record<UploadState, string> = {
  idle: "等待上传",
  uploading: "上传中…",
  generating: "正在生成…",
  success: "上传完成",
  error: "上传失败",
};

const iconInventory: Array<{ label: string; Icon: OpticalIcon }> = [
  { label: "创作", Icon: Magicpen },
  { label: "提示词库", Icon: Book },
  { label: "图像工坊", Icon: Gallery },
  { label: "搜索", Icon: SearchNormal },
  { label: "文件夹", Icon: Folder2 },
  { label: "收藏", Icon: Heart },
  { label: "复制", Icon: Copy },
  { label: "编辑", Icon: Edit2 },
  { label: "AI 优化", Icon: LampCharge },
  { label: "设置", Icon: Setting2 },
  { label: "发送", Icon: Send2 },
  { label: "关闭", Icon: CloseCircle },
  { label: "展开", Icon: ArrowDown },
  { label: "上传", Icon: DocumentUpload },
  { label: "历史", Icon: Clock },
  { label: "更多", Icon: More },
  { label: "图像", Icon: Image },
  { label: "改写", Icon: Brush2 },
];

const stateAssetMap = {
  ai: "ai-processing",
  warning: "warning",
  success: "success",
  upload: "upload",
} as const;

const heroIconKinds: Array<{ kind: HeroIconKind; label: string; meta: string }> = [
  { kind: "ai", label: "AI Spark", meta: "AI 生成 / 优化" },
  { kind: "upload", label: "Upload", meta: "参考图 / 资产上传" },
  { kind: "processing", label: "Processing", meta: "生成中 / 优化中" },
  { kind: "success", label: "Success", meta: "完成 / 已应用" },
  { kind: "warning", label: "Warning", meta: "失败 / 需要处理" },
  { kind: "command", label: "Command Entry", meta: "输入 / 提交指令" },
];

const gradientRibbonAssets: Record<HeroIconKind, string> = {
  ai: new URL("./artifacts/ai-spark-gradient-ribbon-v11.png", import.meta.url).href,
  upload: new URL("./artifacts/upload-gradient-ribbon-v11.png", import.meta.url).href,
  processing: new URL("./artifacts/processing-gradient-ribbon-v11.png", import.meta.url).href,
  success: new URL("./artifacts/success-gradient-ribbon-v11.png", import.meta.url).href,
  warning: new URL("./artifacts/warning-gradient-ribbon-v11.png", import.meta.url).href,
  command: new URL("./artifacts/command-entry-gradient-ribbon-v11.png", import.meta.url).href,
};

function AppleOpticalHeroIcon({ kind, size = 128 }: { kind: HeroIconKind; size?: number }) {
  const id = useId().replace(/:/g, "");
  const rim = `${id}-rim`;
  const cool = `${id}-cool`;
  const status = kind === "success" ? "#54d693" : kind === "warning" ? "#ff7f91" : "#f7faff";

  const glyph = (() => {
    if (kind === "ai") return <>
      <path className="hero-glyph-depth" d="M45 91 C48 60 75 42 104 51 C82 56 67 70 62 90 C58 105 62 119 73 131" />
      <path className="hero-glyph-rim" d="M45 91 C48 60 75 42 104 51 C82 56 67 70 62 90 C58 105 62 119 73 131" />
      <path className="hero-glyph-depth" d="M115 69 C112 100 85 118 56 109 C78 104 93 90 98 70 C102 55 98 41 87 29" />
      <path className="hero-glyph-rim" d="M115 69 C112 100 85 118 56 109 C78 104 93 90 98 70 C102 55 98 41 87 29" />
      <path d="M80 65 C83 73 87 77 95 80 C87 83 83 87 80 95 C77 87 73 83 65 80 C73 77 77 73 80 65 Z" fill="#f7faff" />
      <circle cx="123" cy="37" r="5.5" fill={`url(#${cool})`} />
    </>;
    if (kind === "upload") return <>
      <path className="hero-glyph-depth" d="M80 105 V45 M58 67 L80 45 L102 67" />
      <path className="hero-glyph-rim" d="M80 105 V45 M58 67 L80 45 L102 67" />
      <path className="hero-tray-depth" d="M38 104 C49 121 63 128 80 128 C97 128 111 121 122 104" />
      <path className="hero-tray-rim" d="M38 104 C49 121 63 128 80 128 C97 128 111 121 122 104" />
    </>;
    if (kind === "processing") return <>
      <path className="hero-glyph-depth" d="M48 118 A53 53 0 1 1 121 101" />
      <path className="hero-glyph-rim" d="M48 118 A53 53 0 1 1 121 101" />
      <circle cx="121" cy="101" r="8" fill={`url(#${cool})`} />
      <circle cx="121" cy="101" r="3" fill="#f7faff" />
    </>;
    if (kind === "success") return <>
      <path className="hero-ring-depth" d="M118 53 A50 50 0 1 0 128 91" />
      <path className="hero-ring-rim" d="M118 53 A50 50 0 1 0 128 91" />
      <path className="hero-glyph-depth" d="M50 82 L71 103 L112 59" />
      <path className="hero-glyph-rim" d="M50 82 L71 103 L112 59" />
      <circle cx="128" cy="91" r="4" fill={status} />
    </>;
    if (kind === "warning") return <>
      <path className="hero-warning-depth" d="M80 35 L129 120 Q134 129 123 129 H37 Q26 129 31 120 Z" />
      <path className="hero-warning-rim" d="M80 35 L129 120 Q134 129 123 129 H37 Q26 129 31 120 Z" />
      <path d="M80 61 V96" stroke="#f7faff" strokeWidth="10" strokeLinecap="round" />
      <circle cx="80" cy="114" r="5" fill={status} />
    </>;
    return <>
      <rect className="hero-command-depth" x="36" y="45" width="88" height="70" rx="24" />
      <rect className="hero-command-rim" x="36" y="45" width="88" height="70" rx="24" />
      <path className="hero-command-arrow-depth" d="M49 80 H90 M77 66 L91 80 L77 94" />
      <path className="hero-command-arrow-rim" d="M49 80 H90 M77 66 L91 80 L77 94" />
    </>;
  })();

  return <svg className="apple-optical-hero-icon" width={size} height={size} viewBox="0 0 160 160" role="img" aria-label={kind}>
    <defs>
      <linearGradient id={rim} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#f7faff" />
        <stop offset=".24" stopColor="#b9c8e8" />
        <stop offset=".68" stopColor="#547dbf" />
        <stop offset="1" stopColor="#1e4e9b" />
      </linearGradient>
      <radialGradient id={cool} cx="35%" cy="25%" r="78%">
        <stop offset="0" stopColor="#f7faff" />
        <stop offset=".42" stopColor="#7fb4ff" />
        <stop offset="1" stopColor="#1554b6" />
      </radialGradient>
    </defs>
    <g style={{ "--hero-rim": `url(#${rim})` } as React.CSSProperties}>{glyph}</g>
  </svg>;
}

function AppleOpticalHeroSystem() {
  return <div className="apple-hero-system">
    <header><div><span>Apple Optical · V10</span><h3>单件雕塑，轮廓先于材质</h3></div><p>Pin 灵感审计后收敛：黑芯、银蓝薄边、单侧高光、极少状态色。</p></header>
    <div className="apple-hero-grid">
      {heroIconKinds.map(({ kind, label, meta }) => <article key={kind}>
        <div className="hero-icon-stage"><AppleOpticalHeroIcon kind={kind} /><div className="hero-size-check"><AppleOpticalHeroIcon kind={kind} size={48} /><span>48</span></div></div>
        <h4>{label}</h4><p>{meta}</p>
      </article>)}
    </div>
  </div>;
}

function GradientRibbonHeroSystem() {
  return <div className="gradient-ribbon-system">
    <header><div><span>Gradient Ribbon · V11</span><h3>功能语义藏进同一条光学缎带</h3></div><p>粗轮廓负责识别，黑色负空间负责巧思；每枚同时接受 48px 浏览器尺度检查。</p></header>
    <div className="gradient-ribbon-grid">
      {heroIconKinds.map(({ kind, label, meta }) => <article key={kind}>
        <div className="ribbon-icon-stage">
          <img className="ribbon-icon-large" src={gradientRibbonAssets[kind]} alt={`${label} 渐变缎带图标`} />
          <div className="ribbon-size-check"><span><img src={gradientRibbonAssets[kind]} alt="" /></span><small>48 px</small></div>
        </div>
        <h4>{label}</h4><p>{meta}</p>
      </article>)}
    </div>
  </div>;
}

function StatusAsset({ kind, size = 112 }: { kind: keyof typeof stateAssetMap; size?: number }) {
  const file = stateAssetMap[kind];
  return (
    <picture className="status-asset" style={{ width: size, height: size }}>
      <source srcSet={`./assets/${file}.avif 1x, ./assets/${file}@2x.avif 2x`} type="image/avif" />
      <img src={`./assets/${file}.webp`} srcSet={`./assets/${file}.webp 1x, ./assets/${file}@2x.webp 2x`} alt="" />
    </picture>
  );
}

function StateRail<T extends string>({ values, value, onChange }: { values: readonly T[]; value: T; onChange: (next: T) => void }) {
  return (
    <div className="state-rail" role="tablist" aria-label="组件状态">
      {values.map((item) => (
        <button key={item} className={item === value ? "is-active" : ""} onClick={() => onChange(item)} role="tab" aria-selected={item === value}>
          {item}
        </button>
      ))}
    </div>
  );
}

function VioletUploadPanel({ forcedState }: { forcedState?: UploadState }) {
  const [localState, setLocalState] = useState<UploadState>("uploading");
  const state = forcedState ?? localState;
  const assetKind = state === "error" ? "warning" : state === "success" ? "success" : "upload";
  const determinate = state === "uploading" || state === "success";

  return (
    <article className={`upload-specimen is-${state}`} data-component="violet-upload-panel">
      <div className="upload-ambient" aria-hidden="true" />
      <div className="upload-lower-bloom" aria-hidden="true" />
      <div className="upload-shell">
        <div className="upload-volume" aria-hidden="true" />
        <div className="upload-refractive-edge" aria-hidden="true" />
        <div className="upload-content">
          <div className="upload-file-row">
            <StatusAsset kind={assetKind} size={102} />
            <div>
              <span className="eyebrow">Mock 输入</span>
              <h3>提示词资产.json</h3>
              <p>视觉原型文件 · 不连接真实存储</p>
            </div>
            <button className="icon-button" aria-label="关闭上传面板"><CloseCircle size={22} variant="Linear" /></button>
          </div>
          <div className="progress-chamber" aria-label={uploadLabels[state]}>
            <div className="progress-meta">
              <span className="progress-status"><i aria-hidden="true" />{uploadLabels[state]}</span>
              <span>{state === "uploading" ? "演示进度" : state === "generating" ? "不显示伪造百分比" : ""}</span>
            </div>
            <div className={`progress-track ${determinate ? "is-determinate" : "is-indeterminate"}`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={determinate ? (state === "success" ? 100 : 68) : undefined}>
              <span className="progress-violet" />
              <span className="progress-core" />
            </div>
          </div>
        </div>
      </div>
      {!forcedState && <StateRail<UploadState> values={["idle", "uploading", "generating", "success", "error"] as const} value={state} onChange={setLocalState} />}
    </article>
  );
}

function OpticalCommandBar({ compact = false, demoState = "default" }: { compact?: boolean; demoState?: "default" | "hover" | "focus" }) {
  const [value, setValue] = useState("查找电影感人像提示词");
  return (
    <form className={`command-bar ${compact ? "is-compact" : ""} is-demo-${demoState}`} onSubmit={(event) => event.preventDefault()}>
      <SearchNormal size={22} variant="Linear" />
      <label className="sr-only" htmlFor={compact ? "command-compact" : "command-main"}>搜索提示词</label>
      <input id={compact ? "command-compact" : "command-main"} value={value} onChange={(event) => setValue(event.target.value)} />
      <kbd>⌘ K</kbd>
      <button aria-label="发送命令"><Send2 size={21} variant="Bold" /></button>
    </form>
  );
}

function IconStateSystem() {
  const stateExamples: Array<{ label: string; variant: IconProps["variant"]; className: string; Icon: OpticalIcon }> = [
    { label: "Default", variant: "Linear", className: "default", Icon: Book },
    { label: "Hover", variant: "Linear", className: "hover", Icon: SearchNormal },
    { label: "Selected", variant: "Bulk", className: "selected", Icon: Gallery },
    { label: "Processing", variant: "TwoTone", className: "processing", Icon: LampCharge },
    { label: "Disabled", variant: "Linear", className: "disabled", Icon: Setting2 },
  ];
  return (
    <div className="icon-system">
      <div className="icon-state-strip">
        {stateExamples.map(({ label, variant, className, Icon }) => (
          <div className={`icon-state ${className}`} key={label}>
            <span><Icon size={24} variant={variant} /></span>
            <strong>{label}</strong>
            <small>{variant}</small>
          </div>
        ))}
      </div>
      <div className="icon-inventory">
        {iconInventory.map(({ label, Icon }, index) => (
          <button key={label} className={index === 1 ? "is-selected" : index === 8 ? "is-processing" : ""} aria-label={label}>
            <Icon size={index < 3 ? 22 : 20} variant={index === 1 ? "Bulk" : index === 8 ? "TwoTone" : "Linear"} />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function PromptAssetCard({ forcedState, favorite: controlledFavorite }: { forcedState?: CardState; favorite?: boolean }) {
  const [favorite, setFavorite] = useState(controlledFavorite ?? false);
  const state = forcedState ?? "default";
  return (
    <article className={`prompt-card-v2 is-${state}`} aria-current={state === "selected" ? "true" : undefined}>
      <div className="card-selection-rail" aria-hidden="true" />
      <div className="prompt-thumb"><Magicpen size={24} variant={state === "selected" ? "Bulk" : "TwoTone"} /></div>
      <div className="prompt-copy">
        <span className="card-kicker">人像摄影</span>
        <h3>雨夜电影感侧脸</h3>
        <p>湿润街道反射紫蓝霓虹，人物侧脸由冷白轮廓光勾勒，浅景深与细腻胶片颗粒。</p>
        <div className="card-tags"><span>电影感</span><span>低照度</span><span>85mm</span></div>
      </div>
      <div className="card-actions">
        <button className={favorite ? "is-favorite" : ""} onClick={() => setFavorite((current) => !current)} aria-pressed={favorite} aria-label="收藏"><Heart size={18} variant={favorite ? "Bold" : "Linear"} /></button>
        <button aria-label="复制"><Copy size={18} variant="Linear" /></button>
        <button aria-label="更多"><More size={18} variant="Linear" /></button>
      </div>
    </article>
  );
}

function AiProcessingPanel({ forcedState }: { forcedState?: AiState }) {
  const [localState, setLocalState] = useState<AiState>("processing");
  const state = forcedState ?? localState;
  if (state === "closed") {
    return <button className="ai-closed" onClick={() => setLocalState("ready")}><LampCharge size={20} variant="TwoTone" />打开 AI 处理面板</button>;
  }
  const copy = {
    ready: ["准备优化", "将增强光线方向、镜头语言和材质描述。"],
    processing: ["正在优化", "结构已锁定，正在收敛光线与镜头参数。"],
    complete: ["优化完成", "变化已收敛，可预览后应用。"],
    error: ["处理未完成", "本次结果未写入，请重试。"],
  }[state];
  const assetKind = state === "error" ? "warning" : state === "complete" ? "success" : "ai";
  return (
    <article className={`ai-panel is-${state}`}>
      <div className="ai-volume" aria-hidden="true" />
      <header>
        <StatusAsset kind={assetKind} size={86} />
        <div><span className="eyebrow">AI Processing</span><h3>{copy[0]}</h3><p>{copy[1]}</p></div>
        <button className="icon-button" aria-label="关闭" onClick={() => setLocalState("closed")}><CloseCircle size={20} variant="Linear" /></button>
      </header>
      <div className="ai-target"><span>正在处理</span><strong>雨夜电影感侧脸</strong><small>Prompt Asset · Mock</small></div>
      <div className="ai-preview">
        <span>预期变化</span>
        <ul><li>补全主光方向与冷白轮廓光</li><li>将泛化镜头描述收敛为 85mm 浅景深</li><li>保留原始主体、构图与雨夜环境</li></ul>
      </div>
      <footer>
        <button className="secondary-action">预览差异</button>
        <button className="ai-action" disabled={state === "processing"}>{state === "processing" ? <><i />处理中…</> : state === "complete" ? "应用优化" : state === "error" ? "重新处理" : "开始优化"}</button>
      </footer>
      {!forcedState && <StateRail<AiState> values={["closed", "ready", "processing", "complete", "error"] as const} value={state} onChange={setLocalState} />}
    </article>
  );
}

function LabSection({ number, title, note, children, className = "" }: { number: string; title: string; note: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`lab-section ${className}`}>
      <div className="section-heading"><span>{number}</span><div><h2>{title}</h2><p>{note}</p></div></div>
      {children}
    </section>
  );
}

function UploadComparison() {
  return <div className="comparison comparison-a"><figure><img src="./assets/reference-a.png" alt="用户提供的深蓝紫上传面板参考" /><figcaption>用户参考 A</figcaption></figure><div className="comparison-specimen"><VioletUploadPanel /><span className="comparison-label">Violet Upload Panel · 实现样件</span></div></div>;
}

function CommandComparison() {
  return <div className="comparison comparison-b"><figure><img src="./assets/reference-b.png" alt="用户提供的黑紫命令栏参考" /><figcaption>用户参考 B</figcaption></figure><div className="command-stage"><div className="directional-light left" /><div className="directional-light right" /><StatusAsset kind="warning" size={144} /><h3>提示词命令入口</h3><p>黑紫内凹表面、冰白核心文字与非均匀紫蓝污染。</p><OpticalCommandBar /><span className="comparison-label">Optical Command Bar · 实现样件</span></div></div>;
}

function ComponentStateBoard() {
  return (
    <div className="state-board">
      <div className="state-board-group"><h3>Violet Upload Panel</h3><div className="upload-state-grid">{(["idle", "uploading", "generating", "success", "error"] as UploadState[]).map((state) => <div key={state}><span>{state}</span><VioletUploadPanel forcedState={state} /></div>)}</div></div>
      <div className="state-board-group"><h3>Optical Command Bar</h3><div className="command-state-grid">{(["default", "hover", "focus"] as const).map((state) => <div key={state}><span>{state}</span><OpticalCommandBar demoState={state} /></div>)}</div></div>
      <div className="state-board-group"><h3>Optical Icon System</h3><IconStateSystem /></div>
      <div className="state-board-group"><h3>Prompt Asset Card V2</h3><div className="card-state-grid">{(["default", "hover", "selected", "pressed"] as CardState[]).map((state) => <div key={state}><span>{state}</span><PromptAssetCard forcedState={state} favorite={state === "selected"} /></div>)}</div></div>
      <div className="state-board-group"><h3>AI Processing Panel</h3><div className="ai-state-grid">{(["closed", "ready", "processing", "complete", "error"] as AiState[]).map((state) => <div key={state}><span>{state}</span><AiProcessingPanel forcedState={state} /></div>)}</div></div>
    </div>
  );
}

function AccessibilityBoard() {
  return (
    <div className="accessibility-board">
      <div className="force-reduced-motion"><span className="mode-chip">Reduced Motion</span><VioletUploadPanel forcedState="generating" /><AiProcessingPanel forcedState="processing" /></div>
      <div className="force-reduced-transparency"><span className="mode-chip">Reduced Transparency</span><VioletUploadPanel forcedState="uploading" /><OpticalCommandBar /></div>
    </div>
  );
}

export function OpticalFidelityLab() {
  const shot = useMemo(() => new URLSearchParams(window.location.search).get("shot"), []);
  if (shot === "upload") return <main className="shot-page"><UploadComparison /></main>;
  if (shot === "command") return <main className="shot-page"><CommandComparison /></main>;
  if (shot === "icons") return <main className="shot-page shot-icons"><IconStateSystem /></main>;
  if (shot === "hero-icons-v10") return <main className="shot-page shot-hero-icons"><AppleOpticalHeroSystem /></main>;
  if (shot === "hero-icons-v11") return <main className="shot-page shot-ribbon-icons"><GradientRibbonHeroSystem /></main>;
  if (shot === "states") return <main className="shot-page shot-states"><ComponentStateBoard /></main>;
  if (shot === "card") return <main className="shot-page shot-single"><PromptAssetCard forcedState="selected" favorite /></main>;
  if (shot === "card-hover") return <main className="shot-page shot-single"><PromptAssetCard /></main>;
  if (shot === "ai") return <main className="shot-page shot-single"><AiProcessingPanel /></main>;
  if (shot === "reduced") return <main className="shot-page"><AccessibilityBoard /></main>;
  return (
    <main className="lab-shell">
      <header className="lab-header"><div><span>提示词生成管家 · 隔离视觉实验</span><h1>Optical Fidelity Lab</h1><p>只验证五个 Black Violet Optical UI 核心组件。未连接正式插件、账号、同步、存储或 API。</p></div><span className="prototype-badge">视觉原型数据</span></header>
      <LabSection number="01" title="Violet Upload Panel" note="外壳、体积光、内凹进度腔与白色发光核心。" className="upload-section"><UploadComparison /></LabSection>
      <LabSection number="02" title="Optical Command Bar" note="黑紫内凹命令面与定向冰白折射。"><CommandComparison /></LabSection>
      <LabSection number="03" title="Optical Icon System" note="IconSax Linear / Bulk / TwoTone 的同源状态变化。"><IconStateSystem /></LabSection>
      <LabSection number="03A" title="Apple Optical Hero System" note="生成型大图标：黑芯、银蓝薄边、单侧高光与 48px 轮廓验证。"><AppleOpticalHeroSystem /></LabSection>
      <LabSection number="03B" title="Gradient Ribbon Hero System" note="V11：用连续缎带、负空间与折叠关系把功能语义做进轮廓。"><GradientRibbonHeroSystem /></LabSection>
      <LabSection number="04" title="Prompt Asset Card V2" note="信息效率优先；Hover 浮起，Selected 稳定归属。"><div className="card-state-grid">{(["default", "hover", "selected", "pressed"] as CardState[]).map((state) => <div key={state}><span>{state}</span><PromptAssetCard forcedState={state} favorite={state === "selected"} /></div>)}</div></LabSection>
      <LabSection number="05" title="AI Processing Panel" note="仅 Processing 启动白紫发光核心；完成后收敛。"><AiProcessingPanel /></LabSection>
      <LabSection number="A11Y" title="Reduced modes" note="状态语义保留；移除扫光、漂移与实时模糊。"><AccessibilityBoard /></LabSection>
    </main>
  );
}
