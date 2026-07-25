import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  ArrowDown2,
  Book,
  ClipboardTick,
  Copy,
  Edit2,
  Gallery,
  Heart,
  More,
  Setting2,
  TickCircle,
} from "iconsax-reactjs";

type RibbonName = "ai-spark" | "upload" | "command-entry" | "processing" | "success" | "warning";
type Phase = "idle" | "loading" | "success" | "error";
type SnapshotState = "default" | "hover" | "focus" | "loading" | "disabled" | "error" | "success";

const initialBrief = "为一款东方茶饮设计高端商业海报。主产品悬浮在晨雾山谷中，柔和冷白逆光穿过茶叶与水汽，画面克制精致，并为品牌标题预留干净区域。";
const zhPrompt = "东方高端茶饮商业海报，主产品悬浮于清晨薄雾覆盖的山谷中央，瓶身略低于视平线并保持真实比例。柔和冷白逆光由左后方穿过半透明茶叶与细腻水汽，在玻璃边缘形成克制的冷蓝折射；远处山体沉入深蓝黑负空间，仅在雾层末端保留少量紫色污染光。使用 85mm 商业摄影镜头、浅景深、真实材质与细腻颗粒，品牌标签清晰但不过度锐化。画面上方保留约 28% 干净留白用于标题，避免大面积荧光、廉价霓虹和夸张光晕。";
const enPrompt = "Premium oriental tea campaign poster. The hero bottle floats above a mist-filled mountain valley at dawn, slightly below eye level and kept at a believable scale. Soft cool-white backlight passes through translucent tea leaves and fine vapor, producing restrained blue refraction along the glass edge. Distant mountains dissolve into deep blue-black negative space with only a trace of violet contamination at the far edge of the fog. Shot with an 85mm commercial lens and shallow depth of field, preserving realistic materials, subtle grain, a crisp label, and 28% clean headline space. Avoid oversized bloom, cheap neon, and synthetic gloss.";

function getSnapshotState(): SnapshotState {
  const value = new URLSearchParams(window.location.search).get("state");
  return (["hover", "focus", "loading", "disabled", "error", "success"] as const).includes(value as never)
    ? value as SnapshotState
    : "default";
}

function RibbonIcon({ name, size = 42 }: { name: RibbonName; size?: number }) {
  const base = `./assets/ribbon-icons/${name}`;
  return <picture className="ribbon-icon" style={{ "--icon-size": `${size}px` } as CSSProperties}>
    <source srcSet={`${base}.webp`} type="image/webp" />
    <img src={`${base}.png`} width={size} height={size} alt="" />
  </picture>;
}

function TopNavigation() {
  return <header className="topbar">
    <div className="brand"><RibbonIcon name="ai-spark" size={34} /><strong>提示词生成管家</strong><span>PRODUCT</span></div>
    <nav aria-label="主导航">
      <button className="active"><Edit2 size={17} variant="Bulk" />创作</button>
      <button><Book size={17} />提示词库</button>
      <button><Gallery size={17} />图像工坊</button>
      <button><Setting2 size={17} />设置</button>
    </nav>
    <button className="icon-button" aria-label="更多"><More size={20} /></button>
  </header>;
}

function SelectField({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode }) {
  return <label className="select-field"><span>{label}</span><span className="select-wrap"><select value={value} onChange={(event) => onChange(event.target.value)}>{children}</select><ArrowDown2 size={15} /></span></label>;
}

function ResultBlock({ language, title, content, open, onToggle, onCopy, copied }: {
  language: string; title: string; content: string; open: boolean; onToggle: () => void; onCopy: () => void; copied: boolean;
}) {
  return <article className={`result-block ${open ? "is-open" : ""}`}>
    <header>
      <button className="result-toggle" onClick={onToggle} aria-expanded={open}>
        <span className="language-chip">{language}</span><span><strong>{title}</strong><small>{content.length} 字符</small></span><ArrowDown2 size={17} />
      </button>
      <div className="result-tools"><button aria-label={`编辑${title}`}><Edit2 size={16} /></button><button onClick={onCopy} aria-label={`复制${title}`}>{copied ? <ClipboardTick size={16} /> : <Copy size={16} />}</button></div>
    </header>
    {open ? <div className="result-copy"><p>{content}</p><footer><button><Heart size={15} />保存到提示词库</button><span>{copied ? "已复制" : "已完成结构与长度检查"}</span></footer></div> : null}
  </article>;
}

function StatusNotice({ phase }: { phase: Phase }) {
  if (phase === "idle") return null;
  const isError = phase === "error";
  return <div className={`status-notice is-${phase}`} role="status">
    <RibbonIcon name={isError ? "warning" : phase === "loading" ? "processing" : "success"} size={46} />
    <span><strong>{isError ? "生成未完成" : phase === "loading" ? "正在生成专业提示词" : "两种语言版本已生成"}</strong><small>{isError ? "当前为错误状态验证，输入内容仍已保留。" : phase === "loading" ? "正在整理镜头、光线、材质与负面约束。" : "中文与英文 Prompt 已通过完整性检查。"}</small></span>
  </div>;
}

export function PromptCreatorMaster() {
  const snapshotState = useMemo(getSnapshotState, []);
  const [brief, setBrief] = useState(snapshotState === "disabled" ? "" : initialBrief);
  const [model, setModel] = useState("GPT-5.6 Luna");
  const [workflow, setWorkflow] = useState("电影级商业图像");
  const [ratio, setRatio] = useState("4:5 竖版海报");
  const [requirements, setRequirements] = useState("保留品牌标题区；标签必须清晰；不要绿色主光；避免过度光晕与塑料质感。");
  const [phase, setPhase] = useState<Phase>(snapshotState === "loading" ? "loading" : snapshotState === "error" ? "error" : snapshotState === "success" ? "success" : "idle");
  const [openResult, setOpenResult] = useState<"zh" | "en" | null>("zh");
  const [copied, setCopied] = useState<"zh" | "en" | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [inspectorLoading, setInspectorLoading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const canGenerate = brief.trim().length >= 12 && phase !== "loading";

  useEffect(() => {
    if (snapshotState === "focus") inputRef.current?.focus();
  }, [snapshotState]);

  const generate = () => {
    if (!canGenerate) return;
    setPhase("loading");
    window.setTimeout(() => setPhase("success"), 900);
  };

  const copy = async (kind: "zh" | "en", content: string) => {
    try { await navigator.clipboard.writeText(content); setCopied(kind); }
    catch { setPhase("error"); }
  };

  const optimize = () => {
    setInspectorLoading(true);
    window.setTimeout(() => setInspectorLoading(false), 760);
  };

  return <div className={`product-page snapshot-${snapshotState}`}>
    <div className="ambient-light" aria-hidden="true" />
    <main className="product-shell">
      <TopNavigation />
      <div className="workspace-heading">
        <div><span className="eyebrow">CREATE WITH AI</span><h1>创作提示词</h1><p>把创意整理成可直接用于生产的中英文 Prompt。</p></div>
        <div className="session-meta"><span><i />服务可用</span><small>草稿已保留在当前页面</small></div>
      </div>

      <div className="creator-layout">
        <section className="compose-pane" aria-label="创作输入区">
          <div className="scroll-region compose-scroll" data-testid="compose-scroll">
            <section className="input-chamber">
              <header><div><strong>创意描述</strong><small>主体、场景、光线、材质与画面目的</small></div><span>{brief.length} / 1200</span></header>
              <textarea ref={inputRef} value={brief} onChange={(event) => setBrief(event.target.value)} placeholder="描述你想创作的画面……" />
              <footer><label className="upload-action"><RibbonIcon name="upload" size={32} /><span>添加参考图</span><small>0 / 8</small><input type="file" accept="image/*" multiple /></label><button className="recent-chip">产品海报</button><button className="recent-chip">电影人像</button></footer>
            </section>

            <section className="configuration-panel">
              <header><div><strong>生成配置</strong><small>选择模型与交付规格</small></div><button className="icon-button" aria-label="配置更多选项"><More size={18} /></button></header>
              <div className="config-grid">
                <SelectField label="生成模型" value={model} onChange={setModel}><option>GPT-5.6 Luna</option><option>GPT-5.5 Pro</option></SelectField>
                <SelectField label="专业工作流" value={workflow} onChange={setWorkflow}><option>电影级商业图像</option><option>产品静物摄影</option><option>空间概念设计</option></SelectField>
                <SelectField label="画面比例" value={ratio} onChange={setRatio}><option>4:5 竖版海报</option><option>16:9 横版画面</option><option>1:1 方形画面</option></SelectField>
                <SelectField label="输出强度" value="专业 · 完整" onChange={() => {}}><option>专业 · 完整</option></SelectField>
              </div>
              <label className="requirements-field"><span>附加要求</span><textarea value={requirements} onChange={(event) => setRequirements(event.target.value)} /></label>
            </section>

            <section className={`ai-inspector ${inspectorOpen ? "is-open" : ""}`}>
              <button className="inspector-heading" onClick={() => setInspectorOpen((value) => !value)} aria-expanded={inspectorOpen}>
                <RibbonIcon name={inspectorLoading ? "processing" : "ai-spark"} size={42} /><span><small>AI INSPECTOR</small><strong>{inspectorLoading ? "正在检查描述" : "创作完整性检查"}</strong></span><ArrowDown2 size={17} />
              </button>
              {inspectorOpen ? <div className="inspector-body"><div><span>主体与场景</span><strong><TickCircle size={15} />清晰</strong></div><div><span>光线与材质</span><strong><TickCircle size={15} />可执行</strong></div><div><span>建议</span><p>补充产品瓶身的具体材质，可提高折射描述的一致性。</p></div><button onClick={optimize} disabled={inspectorLoading}>{inspectorLoading ? "正在优化" : "AI 优化描述"}</button></div> : null}
            </section>
          </div>

          <footer className="generate-dock">
            <div><span className={`status-dot is-${phase}`} /><span>{phase === "loading" ? "模型正在处理" : canGenerate ? `${model} · ${workflow}` : "至少输入 12 个字符后生成"}</span></div>
            <button className="primary-action" disabled={!canGenerate} onClick={generate}><RibbonIcon name={phase === "loading" ? "processing" : "command-entry"} size={34} /><span>{phase === "loading" ? "正在生成" : "生成专业提示词"}</span></button>
          </footer>
        </section>

        <section className="output-pane" aria-label="输出结果区">
          <header className="output-heading"><div><span className="eyebrow">OUTPUT WORKBENCH</span><h2>本次生成结果</h2></div><span className="output-badge">2 FORMATS</span></header>
          <StatusNotice phase={phase} />
          <div className="scroll-region output-scroll" data-testid="output-scroll">
            <ResultBlock language="ZH" title="中文 Prompt" content={zhPrompt} open={openResult === "zh"} onToggle={() => setOpenResult(openResult === "zh" ? null : "zh")} onCopy={() => void copy("zh", zhPrompt)} copied={copied === "zh"} />
            <ResultBlock language="EN" title="English Prompt" content={enPrompt} open={openResult === "en"} onToggle={() => setOpenResult(openResult === "en" ? null : "en")} onCopy={() => void copy("en", enPrompt)} copied={copied === "en"} />
            <section className="delivery-notes"><header><strong>交付检查</strong><span>READY</span></header><ul><li>主体与构图描述完整</li><li>包含镜头、光线、材质与负面约束</li><li>中英文版本语义一致</li></ul></section>
            <section className="production-metadata"><header><strong>生产参数</strong><span>已写入 Prompt</span></header><dl><div><dt>镜头</dt><dd>85mm · 浅景深</dd></div><div><dt>主光</dt><dd>左后方冷白逆光</dd></div><div><dt>材质</dt><dd>透明玻璃 · 真实折射</dd></div><div><dt>构图</dt><dd>4:5 · 上方 28% 留白</dd></div><div><dt>色彩约束</dt><dd>冷蓝为主 · 紫色仅作末端污染光</dd></div><div><dt>负面约束</dt><dd>无大面积荧光、绿色主光与塑料高光</dd></div></dl></section>
            <section className="long-content-proof"><strong>真实内容长度验证</strong><p>输出区域保持独立滚动。展开英文 Prompt 后，内容高度会超过当前视口，但顶部状态和底部交付操作不会被挤出页面。该区域用于验证长 Prompt、不同语言密度及连续编辑时的阅读节奏。</p></section>
          </div>
          <footer className="output-actions"><button><Heart size={17} />保存全部</button><button className="image-studio-action"><Gallery size={17} variant="Bulk" />发送到图像工坊</button></footer>
        </section>
      </div>
    </main>
  </div>;
}
