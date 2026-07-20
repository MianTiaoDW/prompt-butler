import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Edit3,
  Folder,
  Heart,
  Library,
  Menu,
  Plus,
  Search,
  Send,
  Settings2,
  Sparkles,
  WandSparkles,
  X
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

type PromptItem = {
  id: number;
  title: string;
  summary: string;
  tags: string[];
  chinese: string;
  english: string;
  json: string;
  favorite: boolean;
  visual: "prism" | "portrait" | "architecture" | "product";
};

const prompts: PromptItem[] = [
  {
    id: 1,
    title: "折射玻璃产品主视觉",
    summary: "黑色光学设备置于冷调空间，边缘折射一束克制的翡翠绿光。",
    tags: ["商业摄影", "光学材质", "产品"],
    chinese: "一台精密的黑色光学设备，悬浮在深蓝黑背景中。硬朗轮廓由极细的翡翠绿边缘光勾勒，透明镜片内部出现一团柔和、非均匀的薄荷绿色光团。控制高光范围，保留大面积负空间，商业产品摄影，真实材质，微距细节，低噪点。",
    english: "A precision black optical device suspended in a deep blue-black environment. Its silhouette is traced by a restrained emerald rim light, while a soft non-uniform mint glow lives inside the transparent lens. Generous negative space, tactile materials, macro detail, premium commercial photography.",
    json: '{\n  "subject": "black optical device",\n  "light": ["emerald rim", "soft mint core"],\n  "mood": "quiet precision",\n  "camera": "85mm macro"\n}',
    favorite: true,
    visual: "prism"
  },
  {
    id: 2,
    title: "电影感夜景人物肖像",
    summary: "潮湿夜街中的半身人物，局部蓝紫环境光与自然肤色保持平衡。",
    tags: ["肖像", "电影感", "夜景"],
    chinese: "潮湿夜街中的半身人物肖像，背景霓虹被压成柔和散景，人物面部保持自然肤色与清晰眼神光。蓝紫环境光只出现在轮廓和阴影过渡，不污染主体。",
    english: "Half-length portrait on a wet night street, soft neon bokeh, natural skin tone and a precise catchlight. Blue-violet ambience stays at the silhouette and shadow transitions without contaminating the subject.",
    json: '{\n  "subject": "night portrait",\n  "light": "soft blue-violet ambience",\n  "lens": "50mm"\n}',
    favorite: false,
    visual: "portrait"
  },
  {
    id: 3,
    title: "静默未来建筑空间",
    summary: "石墨黑建筑体块、薄雾与单一竖向天光构成安静的未来空间。",
    tags: ["建筑", "概念", "极简"],
    chinese: "一处静默的未来建筑内部，石墨黑体块形成清晰的远近层级，单一竖向天光切入薄雾。避免巨型光柱和过度科幻符号，用尺度、材质和负空间建立庄重感。",
    english: "A silent future interior where graphite volumes form precise depth. A single vertical skylight enters a thin haze. Avoid oversized light beams and sci-fi symbols; build gravity through scale, material, and negative space.",
    json: '{\n  "space": "future interior",\n  "material": "graphite stone",\n  "light": "single skylight"\n}',
    favorite: false,
    visual: "architecture"
  },
  {
    id: 4,
    title: "薄荷气泡护肤品陈列",
    summary: "柔白瓶身与透明气泡形成清爽层次，绿色仅作为局部品牌信号。",
    tags: ["美妆", "静物", "清透"],
    chinese: "柔白护肤品瓶身立于透明气泡之间，冷灰背景保持平静，薄荷绿色只作为局部品牌信号。边缘高光干净、材质真实，画面轻盈但不甜腻。",
    english: "Soft white skincare bottles arranged among transparent bubbles, with a quiet cool-gray background. Mint green appears only as a local brand signal. Clean edge highlights, tactile material, airy but not sugary.",
    json: '{\n  "product": "skincare",\n  "palette": ["soft white", "cool gray", "mint accent"]\n}',
    favorite: true,
    visual: "product"
  }
];

const groups = [
  { label: "全部", icon: Library },
  { label: "收藏", icon: Heart },
  { label: "我的收藏夹", icon: Folder },
  { label: "Nano精修", icon: Folder },
  { label: "AI视频运镜", icon: Folder }
];

const spring = { type: "spring" as const, bounce: 0, duration: 0.34 };

export function OpticalLibraryPrototype() {
  const systemReducedMotion = useReducedMotion();
  const [workspace, setWorkspace] = useState("提示词库");
  const [selectedId, setSelectedId] = useState(1);
  const [favorites, setFavorites] = useState(() => new Set(prompts.filter((item) => item.favorite).map((item) => item.id)));
  const [copied, setCopied] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [mobileModalOpen, setMobileModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [compactNavOpen, setCompactNavOpen] = useState(false);
  const [simulateReducedMotion, setSimulateReducedMotion] = useState(false);
  const [simulateReducedTransparency, setSimulateReducedTransparency] = useState(false);

  const reduceMotion = Boolean(systemReducedMotion) || simulateReducedMotion;
  const selected = useMemo(() => prompts.find((item) => item.id === selectedId) ?? prompts[0], [selectedId]);
  const isButtonShowcase = new URLSearchParams(window.location.search).get("showcase") === "buttons";

  const selectPrompt = (id: number) => {
    setSelectedId(id);
    if (window.matchMedia("(max-width: 599px)").matches) setMobileModalOpen(true);
  };

  const toggleFavorite = (id: number) => {
    setFavorites((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyText = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Design-lab fallback for non-secure preview origins.
    }
    setCopied(key);
  };

  if (isButtonShowcase) return <ButtonStateShowcase />;

  return (
    <main
      className="prototype-canvas"
      data-reduced-motion={simulateReducedMotion}
      data-reduced-transparency={simulateReducedTransparency}
    >
      <section className="app-shell" aria-label="提示词库视觉母版">
        <div className="shell-glow" aria-hidden="true" />
        <Header workspace={workspace} onWorkspaceChange={setWorkspace} reduceMotion={reduceMotion} />

        <div className="workspace-frame">
          <LibraryRail compactOpen={compactNavOpen} onCompactClose={() => setCompactNavOpen(false)} />

          <section className="asset-column">
            <div className="search-layer">
              <button className="icon-button compact-menu" type="button" aria-label="打开分类" onClick={() => setCompactNavOpen(true)}>
                <Menu size={17} />
              </button>
              <label className="search-field">
                <Search size={16} />
                <input aria-label="搜索提示词" placeholder="搜索标题、正文或标签" />
                <kbd>⌘ K</kbd>
              </label>
              <button className="filter-button" type="button">
                最近使用 <ChevronDown size={14} />
              </button>
            </div>

            <div className="list-heading">
              <div>
                <p className="eyebrow">提示词资产</p>
                <h1>提示词库</h1>
              </div>
              <span>Mock · {prompts.length} 项</span>
            </div>

            <div className="prompt-list">
              {prompts.map((item) => (
                <PromptCard
                  key={item.id}
                  item={item}
                  selected={item.id === selectedId}
                  favorite={favorites.has(item.id)}
                  copied={copied === `card-${item.id}`}
                  onSelect={() => selectPrompt(item.id)}
                  onFavorite={() => toggleFavorite(item.id)}
                  onCopy={() => void copyText(`card-${item.id}`, item.chinese)}
                  onOptimize={() => {
                    setSelectedId(item.id);
                    setInspectorOpen(true);
                  }}
                />
              ))}
            </div>
          </section>

          <PromptDetail
            item={selected}
            favorite={favorites.has(selected.id)}
            copied={copied}
            expanded={expanded}
            loading={loading}
            onFavorite={() => toggleFavorite(selected.id)}
            onCopy={copyText}
            onExpand={() => setExpanded((value) => !value)}
            onInspector={() => setInspectorOpen(true)}
            onLoading={() => setLoading((value) => !value)}
          />
        </div>
      </section>

      <AnimatePresence>
        {mobileModalOpen ? (
          <MobilePromptModal
            item={selected}
            favorite={favorites.has(selected.id)}
            loading={loading}
            reduceMotion={reduceMotion}
            onClose={() => setMobileModalOpen(false)}
            onFavorite={() => toggleFavorite(selected.id)}
            onInspector={() => {
              setMobileModalOpen(false);
              setInspectorOpen(true);
            }}
            onLoading={() => setLoading((value) => !value)}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {inspectorOpen ? (
          <AiInspector item={selected} reduceMotion={reduceMotion} onClose={() => setInspectorOpen(false)} />
        ) : null}
      </AnimatePresence>

      <div className="a11y-preview-dock" aria-label="无障碍预览开关">
        <span>预览降级</span>
        <button type="button" aria-pressed={simulateReducedMotion} onClick={() => setSimulateReducedMotion((value) => !value)}>
          动态
        </button>
        <button type="button" aria-pressed={simulateReducedTransparency} onClick={() => setSimulateReducedTransparency((value) => !value)}>
          透明度
        </button>
      </div>
    </main>
  );
}

function Header({ workspace, onWorkspaceChange, reduceMotion }: { workspace: string; onWorkspaceChange: (value: string) => void; reduceMotion: boolean }) {
  return (
    <header className="brand-bar optical-control">
      <div className="brand-lockup">
        <div className="brand-mark"><Sparkles size={18} strokeWidth={1.8} /></div>
        <div>
          <strong>提示词生成管家</strong>
          <span>视觉原型 · Mock 数据</span>
        </div>
      </div>
      <nav className="workspace-nav" aria-label="工作区">
        {["创作", "提示词库", "图像工坊"].map((item) => (
          <button key={item} className={workspace === item ? "is-active" : ""} type="button" onClick={() => onWorkspaceChange(item)}>
            {workspace === item ? (
              <motion.span className="workspace-selection" layoutId="workspace-selection" transition={reduceMotion ? { duration: 0 } : spring} />
            ) : null}
            <span>{item}</span>
          </button>
        ))}
      </nav>
      <div className="header-tools">
        <button className="icon-button" type="button" aria-label="设置"><Settings2 size={17} /></button>
      </div>
    </header>
  );
}

function LibraryRail({ compactOpen, onCompactClose }: { compactOpen: boolean; onCompactClose: () => void }) {
  return (
    <>
      <aside className="library-rail">
        <div className="rail-title"><span>资料库</span><button className="icon-button" type="button" aria-label="新建资料夹"><Plus size={15} /></button></div>
        <nav>
          {groups.map(({ label, icon: Icon }, index) => (
            <button className={index === 0 ? "is-active" : ""} type="button" key={label}>
              <Icon size={16} fill={label === "收藏" ? "currentColor" : "none"} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="rail-spacer" />
        <button className="rail-create" type="button"><Plus size={15} /> 新建文件夹</button>
      </aside>
      <AnimatePresence>
        {compactOpen ? (
          <motion.div className="compact-nav-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.aside className="compact-nav optical-float" initial={{ transform: "translateX(-102%)" }} animate={{ transform: "translateX(0%)" }} exit={{ transform: "translateX(-102%)" }} transition={{ ...spring, duration: 0.28 }}>
              <div className="rail-title"><span>资料库</span><button className="icon-button" type="button" onClick={onCompactClose}><X size={16} /></button></div>
              {groups.map(({ label, icon: Icon }, index) => <button className={index === 0 ? "is-active" : ""} type="button" key={label}><Icon size={16} /><span>{label}</span></button>)}
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

function PromptCard({ item, selected, favorite, copied, onSelect, onFavorite, onCopy, onOptimize }: {
  item: PromptItem; selected: boolean; favorite: boolean; copied: boolean; onSelect: () => void; onFavorite: () => void; onCopy: () => void; onOptimize: () => void;
}) {
  return (
    <article className={`prompt-card ${selected ? "is-selected" : ""}`} onClick={onSelect} tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onSelect(); }}>
      <div className={`prompt-thumb visual-${item.visual}`} aria-hidden="true"><span /><i /></div>
      <div className="card-content">
        <div className="card-title-row">
          <h2>{item.title}</h2>
          <button className={`heart-button ${favorite ? "is-favorite" : ""}`} type="button" aria-label={favorite ? "取消收藏" : "收藏"} onClick={(event) => { event.stopPropagation(); onFavorite(); }}>
            <Heart size={15} fill={favorite ? "currentColor" : "none"} />
          </button>
        </div>
        <p>{item.summary}</p>
        <div className="card-foot">
          <div className="tag-row">{item.tags.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}</div>
          <div className="quick-actions">
            <button type="button" aria-label="复制" onClick={(event) => { event.stopPropagation(); onCopy(); }}>{copied ? <Check size={14} /> : <Copy size={14} />}</button>
            <button type="button" aria-label="AI 优化" onClick={(event) => { event.stopPropagation(); onOptimize(); }}><WandSparkles size={14} /></button>
          </div>
        </div>
      </div>
    </article>
  );
}

function PromptDetail({ item, favorite, copied, expanded, loading, onFavorite, onCopy, onExpand, onInspector, onLoading }: {
  item: PromptItem; favorite: boolean; copied: string | null; expanded: boolean; loading: boolean; onFavorite: () => void; onCopy: (key: string, value: string) => void; onExpand: () => void; onInspector: () => void; onLoading: () => void;
}) {
  return (
    <section className="detail-panel">
      <div className="detail-scroll">
        <header className="detail-heading">
          <div className="detail-kicker"><span>当前工作对象</span></div>
          <div className="detail-title-row"><h2>{item.title}</h2><button className={`heart-button ${favorite ? "is-favorite" : ""}`} type="button" onClick={onFavorite}><Heart size={18} fill={favorite ? "currentColor" : "none"} /></button></div>
          <div className="tag-row large">{item.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
        </header>
        <div className="hero-visuals">
          {[item.visual, "architecture", "product"].map((visual, index) => <div key={`${visual}-${index}`} className={`effect-image visual-${visual}`}><span>{index === 0 ? "示例效果" : `变体 0${index}`}</span><i /></div>)}
        </div>
        <PromptBlock title="中文 Prompt" text={item.chinese} expanded={expanded} copied={copied === "zh"} onExpand={onExpand} onCopy={() => void onCopy("zh", item.chinese)} />
        <PromptBlock title="English Prompt" text={item.english} expanded={expanded} copied={copied === "en"} onExpand={onExpand} onCopy={() => void onCopy("en", item.english)} />
        <section className="json-block"><header><span>结构化参数</span><button type="button" onClick={() => void onCopy("json", item.json)}>{copied === "json" ? <Check size={14} /> : <Copy size={14} />}</button></header><pre>{item.json}</pre></section>
      </div>
      <ActionBar loading={loading} onInspector={onInspector} onLoading={onLoading} />
    </section>
  );
}

function PromptBlock({ title, text, expanded, copied, onExpand, onCopy }: { title: string; text: string; expanded: boolean; copied: boolean; onExpand: () => void; onCopy: () => void }) {
  return (
    <section className="prompt-block">
      <header><button type="button" onClick={onExpand}><ChevronRight className={expanded ? "is-rotated" : ""} size={15} /><span>{title}</span></button><button className="text-action" type="button" onClick={onCopy}>{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? "已复制" : "复制"}</button></header>
      <div className={`prompt-copy ${expanded ? "is-expanded" : ""}`}><p>{text}</p></div>
    </section>
  );
}

function ActionBar({ loading, onInspector, onLoading }: { loading: boolean; onInspector: () => void; onLoading: () => void }) {
  return (
    <footer className="action-bar">
      <div className="secondary-actions"><button type="button"><Copy size={15} />复制</button><button type="button"><Edit3 size={15} />编辑</button><button className="ai-outline" type="button" onClick={onInspector}><WandSparkles size={15} />AI 优化</button></div>
      <button className={`aurora-button ${loading ? "is-loading" : ""}`} type="button" onClick={onLoading} aria-busy={loading}>
        {loading ? <><i className="loading-dot" /><span>正在发送</span></> : <><span>发送到图像工坊</span><Send size={16} /></>}
      </button>
    </footer>
  );
}

function MobilePromptModal({ item, favorite, loading, reduceMotion, onClose, onFavorite, onInspector, onLoading }: {
  item: PromptItem; favorite: boolean; loading: boolean; reduceMotion: boolean; onClose: () => void; onFavorite: () => void; onInspector: () => void; onLoading: () => void;
}) {
  return (
    <motion.div className="modal-backdrop mobile-only" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduceMotion ? 0.12 : 0.2 }} onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
      <motion.section className="mobile-modal optical-float" initial={{ opacity: 0, transform: reduceMotion ? "none" : "translateY(28px) scale(.97)" }} animate={{ opacity: 1, transform: "translateY(0) scale(1)" }} exit={{ opacity: 0, transform: reduceMotion ? "none" : "translateY(18px) scale(.98)" }} transition={reduceMotion ? { duration: 0.12 } : spring}>
        <header><button className="icon-button" type="button" onClick={onClose}><ArrowLeft size={18} /></button><span>提示词详情</span><button className={`heart-button ${favorite ? "is-favorite" : ""}`} type="button" onClick={onFavorite}><Heart size={17} fill={favorite ? "currentColor" : "none"} /></button></header>
        <div className={`effect-image visual-${item.visual}`}><span>示例效果</span><i /></div>
        <h2>{item.title}</h2><div className="tag-row large">{item.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
        <section className="mobile-copy"><span>中文 Prompt</span><p>{item.chinese}</p></section>
        <div className="mobile-modal-actions"><button className="ai-outline" type="button" onClick={onInspector}><WandSparkles size={15} />AI 优化</button><button className={`aurora-button ${loading ? "is-loading" : ""}`} type="button" onClick={onLoading}>{loading ? <><i className="loading-dot" /><span>正在发送</span></> : <><span>发送到图像工坊</span><Send size={16} /></>}</button></div>
      </motion.section>
    </motion.div>
  );
}

function AiInspector({ item, reduceMotion, onClose }: { item: PromptItem; reduceMotion: boolean; onClose: () => void }) {
  const [strength, setStrength] = useState("平衡");
  const [status, setStatus] = useState<"idle" | "processing" | "complete">("idle");
  const advanceStatus = () => setStatus((current) => current === "idle" ? "processing" : current === "processing" ? "complete" : "idle");
  return (
    <motion.aside className={`ai-inspector optical-float is-${status}`} initial={{ opacity: 0, transform: reduceMotion ? "none" : "translateX(102%)" }} animate={{ opacity: 1, transform: "translateX(0%)" }} exit={{ opacity: 0, transform: reduceMotion ? "none" : "translateX(102%)" }} transition={reduceMotion ? { duration: 0.12 } : spring}>
      <div className="inspector-energy" aria-hidden="true" />
      <header><div className="ai-symbol"><WandSparkles size={18} /></div><div><p>AI 优化</p><h2>优化面板</h2></div><button className="icon-button" type="button" onClick={onClose}><X size={17} /></button></header>
      <div className="inspector-context"><span>正在优化</span><strong>{item.title}</strong><small>{item.summary}</small><em className={`inspector-status is-${status}`}>{status === "processing" ? "处理中" : status === "complete" ? "优化完成" : "等待设置"}</em></div>
      <section><label>优化目标</label><div className="choice-grid"><button className="is-active" type="button">画面质感</button><button type="button">构图控制</button><button type="button">语言精炼</button><button type="button">模型适配</button></div></section>
      <section><label>优化强度</label><div className="segmented">{["轻微", "平衡", "重构"].map((value) => <button className={strength === value ? "is-active" : ""} type="button" key={value} onClick={() => setStrength(value)}>{value}</button>)}</div></section>
      <section className="inspector-note"><label>补充要求</label><textarea defaultValue="保留黑色光学设备的安静质感，增强边缘折射层次，避免扩大绿色外发光。" /></section>
      <div className="optimization-preview"><header><span><Sparkles size={14} />结果预览</span><small>Mock</small></header><div className="preview-change"><span>材质描述</span><strong>更具体</strong></div><div className="preview-change"><span>环境光线</span><strong>更克制</strong></div><div className="preview-change"><span>镜头约束</span><strong>已补足</strong></div></div>
      <footer className="inspector-footer"><small>视觉原型状态演示</small><button className={`ai-run-button is-${status}`} type="button" onClick={advanceStatus}><Sparkles size={16} />{status === "processing" ? "完成模拟" : status === "complete" ? "重新设置" : "开始优化"}</button></footer>
    </motion.aside>
  );
}

function ButtonStateShowcase() {
  return (
    <main className="button-showcase-canvas">
      <section className="button-showcase-panel optical-float">
        <header><div><span>组件状态规范</span><h1>Emerald Aurora Button</h1></div><small>Design Lab · Mock</small></header>
        <div className="button-state-grid">
          <article><span>Default</span><button className="aurora-button" type="button"><span>发送到图像工坊</span><Send size={16} /></button><p>默认克制，不持续强光</p></article>
          <article><span>Hover</span><button className="aurora-button is-demo-hover" type="button"><span>发送到图像工坊</span><Send size={16} /></button><p>增强奶白高光与内部绿光</p></article>
          <article><span>Pressed</span><button className="aurora-button is-demo-pressed" type="button"><span>发送到图像工坊</span><Send size={16} /></button><p>缩放至 0.98，光团向下压</p></article>
          <article><span>Loading</span><button className="aurora-button is-loading" type="button" aria-busy="true"><i className="loading-dot" /><span>正在发送</span></button><p>尺寸不变，柔光缓慢流动</p></article>
        </div>
      </section>
    </main>
  );
}
