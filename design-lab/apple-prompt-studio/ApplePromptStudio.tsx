import { useEffect, useMemo, useState } from "react";
import {
  Add,
  ArrowDown2,
  ArrowLeft,
  ArrowRight2,
  ArrowUp2,
  ArchiveTick,
  Activity,
  Book,
  CloseCircle,
  CloudConnection,
  Copy,
  DocumentDownload,
  Edit2,
  Eye,
  EyeSlash,
  Filter,
  Folder2,
  Gallery,
  Heart,
  Import,
  Magicpen,
  More,
  Moon,
  Refresh,
  Save2,
  SearchNormal,
  Setting2,
  Slider,
  Sort,
  Sun1,
  TickCircle,
  Trash
} from "iconsax-reactjs";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

type Workspace = "create" | "library" | "images" | "settings";
type Theme = "light" | "dark";
type Format = "zh" | "en" | "json";
type LibraryFilter = "全部" | "收藏" | "我的收藏夹";

const calmSpring = { type: "spring" as const, bounce: 0, duration: 0.28 };
const quickFade = { duration: 0.16, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] };

const generatedPrompt: Record<Format, string> = {
  zh: "东方高山茶饮产品悬浮于清晨云雾山谷中央，鲜嫩茶叶与细密水汽围绕瓶身形成轻盈层次。柔和逆光从侧后方穿透，保留自然材质与大面积负空间，为品牌标题留下清晰区域。商业产品摄影，真实质感，克制高级。",
  en: "Premium oriental tea campaign, hero product floating above a misty mountain valley. Soft cool-white backlight passes through translucent tea leaves and fine vapor. Restrained negative space for the brand title, tactile materials, refined commercial photography.",
  json: `{
  "subject": "oriental tea product",
  "scene": "misty mountain valley",
  "lighting": "soft morning backlight",
  "composition": "centered with title-safe space",
  "mood": "calm, natural, premium"
}`
};

const inspirations = [
  { title: "商业主视觉", subtitle: "产品与品牌画面", tone: "amber" },
  { title: "角色设定", subtitle: "保持人物一致性", tone: "blue" },
  { title: "视频运镜", subtitle: "设计镜头与节奏", tone: "green" },
  { title: "空间概念", subtitle: "建筑与室内氛围", tone: "violet" }
];

const libraryCards = [
  { id: 1, title: "东方茶饮 · 晨雾山谷", note: "产品精修", tone: "tea", favorite: true, folder: "品牌视觉", content: generatedPrompt.zh },
  { id: 2, title: "雨夜电影感肖像", note: "品牌设计", tone: "portrait", favorite: false, folder: "人物灵感", content: "雨夜街道，人物侧脸由冷白轮廓光勾勒，湿润路面反射远处蓝色霓虹，85mm 浅景深与细腻胶片颗粒。" },
  { id: 3, title: "静默未来空间", note: "空间概念", tone: "space", favorite: false, folder: "空间灵感", content: "极简未来建筑内部，柔和天光穿过高耸狭缝，细腻混凝土与金属形成克制、安静的空间秩序。" },
  { id: 4, title: "气泡护肤品陈列", note: "产品精修", tone: "skincare", favorite: true, folder: "品牌视觉", content: "半透明护肤品瓶体置于清透水面，细密气泡与柔和折射环绕产品，留出干净品牌区。" },
  { id: 5, title: "海岸公路镜头脚本", note: "视频生成", tone: "coast", favorite: false, folder: "视频脚本", content: "沿海公路低机位跟拍，清晨薄雾与金色侧光交错，镜头缓慢推近后升高揭示海岸线。" }
];

const categories = ["全部", "产品精修", "品牌设计", "视频生成", "空间概念"];
const recentPrompts = ["逆向提示词专家", "徕卡电影质感", "极简产品海报"];

export function ApplePromptStudio() {
  const reduceMotion = Boolean(useReducedMotion());
  const [workspace, setWorkspace] = useState<Workspace>("create");
  const [theme, setTheme] = useState<Theme>("light");
  const [prompt, setPrompt] = useState("为一款东方茶饮设计商业海报。产品悬浮在晨雾山谷中，柔和逆光穿过茶叶与水汽，画面克制高级，并为品牌标题预留干净区域。");
  const [hasResult, setHasResult] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [format, setFormat] = useState<Format>("zh");
  const [copied, setCopied] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [favoriteIds, setFavoriteIds] = useState(() => new Set(libraryCards.filter((card) => card.favorite).map((card) => card.id)));
  const [deletedIds, setDeletedIds] = useState(() => new Set<number>());
  const [imagePrompt, setImagePrompt] = useState(generatedPrompt.zh);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1100);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const selectedCard = useMemo(
    () => libraryCards.find((card) => card.id === selectedCardId) ?? null,
    [selectedCardId]
  );

  const generate = () => {
    if (generating || !prompt.trim()) return;
    setGenerating(true);
    window.setTimeout(() => {
      setHasResult(true);
      setGenerating(false);
    }, reduceMotion ? 180 : 620);
  };

  const toggleFavorite = (id: number) => setFavoriteIds((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  return (
    <main className="studio-canvas" data-theme={theme}>
      <section className="studio-window" aria-label="提示词生成管家 Apple 风格个人创作空间">
        <div className="ambient ambient-one" aria-hidden="true" />
        <div className="ambient ambient-two" aria-hidden="true" />

        <header className="app-header">
          <button className="brand-lockup" type="button" onClick={() => setWorkspace("create")}>
            <span className="app-icon"><Magicpen size={19} variant="Bulk" /></span>
            <span><strong>提示词管家</strong><small>你的 AI 创作搭档</small></span>
          </button>
          <div className="header-actions">
            <span className="ready-pill"><i />模型已就绪</span>
            <button className="circle-button" type="button" aria-label={theme === "light" ? "切换深色外观" : "切换浅色外观"} onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
              {theme === "light" ? <Moon size={17} /> : <Sun1 size={17} />}
            </button>
            <button className={`circle-button motion-settings ${workspace === "settings" ? "is-active" : ""}`} type="button" aria-label="设置" onClick={() => setWorkspace(workspace === "settings" ? "create" : "settings")}><Setting2 size={17} /></button>
          </div>
        </header>

        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            className="workspace-scroll"
            key={workspace}
            initial={{ opacity: 0, y: reduceMotion ? 0 : 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduceMotion ? 0 : -2 }}
            transition={reduceMotion ? { duration: 0.08 } : quickFade}
          >
            {workspace === "create" ? (
              <CreateSpace
                prompt={prompt}
                onPromptChange={setPrompt}
                generating={generating}
                onGenerate={generate}
                hasResult={hasResult}
                format={format}
                onFormatChange={setFormat}
                copied={copied}
                onCopy={() => { void navigator.clipboard?.writeText(generatedPrompt[format]); setCopied(true); }}
                onOpenImages={() => setWorkspace("images")}
                onUsePrompt={(value) => setPrompt(value)}
                reduceMotion={reduceMotion}
              />
            ) : workspace === "library" ? (
              <LibrarySpace favoriteIds={favoriteIds} deletedIds={deletedIds} onSelect={setSelectedCardId} onToggleFavorite={toggleFavorite} />
            ) : workspace === "images" ? (
              <ImageSpace prompt={imagePrompt} onPromptChange={setImagePrompt} onBackToPrompt={() => setWorkspace("create")} reduceMotion={reduceMotion} />
            ) : (
              <SettingsSpace onBack={() => setWorkspace("create")} />
            )}
          </motion.div>
        </AnimatePresence>

        {workspace !== "settings" ? <FloatingDock workspace={workspace} onChange={setWorkspace} reduceMotion={reduceMotion} /> : null}

        <AnimatePresence>
          {selectedCard ? (
            <PromptSheet
              card={selectedCard}
              favorite={favoriteIds.has(selectedCard.id)}
              reduceMotion={reduceMotion}
              onClose={() => setSelectedCardId(null)}
              onToggleFavorite={() => toggleFavorite(selectedCard.id)}
              onDelete={() => { setDeletedIds((current) => new Set(current).add(selectedCard.id)); setSelectedCardId(null); }}
              onUse={() => { setPrompt(selectedCard.content); setSelectedCardId(null); setWorkspace("create"); }}
              onImage={() => { setImagePrompt(selectedCard.content); setSelectedCardId(null); setWorkspace("images"); }}
            />
          ) : null}
        </AnimatePresence>

      </section>
    </main>
  );
}

function FloatingDock({ workspace, onChange, reduceMotion }: { workspace: Workspace; onChange: (workspace: Workspace) => void; reduceMotion: boolean }) {
  const items = [
    { id: "create" as const, label: "创作", icon: Magicpen },
    { id: "library" as const, label: "提示词库", icon: Book },
    { id: "images" as const, label: "图像工坊", icon: Gallery }
  ];

  return (
    <nav className="floating-dock" aria-label="创作空间">
      {items.map(({ id, label, icon: Icon }) => (
        <button className={workspace === id ? "is-active" : ""} type="button" key={id} onClick={() => onChange(id)}>
          {workspace === id ? <motion.span className="dock-selection" layoutId="dock-selection" transition={reduceMotion ? { duration: 0 } : calmSpring} /> : null}
          <Icon size={16} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

function CreateSpace({
  prompt,
  onPromptChange,
  generating,
  onGenerate,
  hasResult,
  format,
  onFormatChange,
  copied,
  onCopy,
  onOpenImages,
  onUsePrompt,
  reduceMotion
}: {
  prompt: string;
  onPromptChange: (value: string) => void;
  generating: boolean;
  onGenerate: () => void;
  hasResult: boolean;
  format: Format;
  onFormatChange: (format: Format) => void;
  copied: boolean;
  onCopy: () => void;
  onOpenImages: () => void;
  onUsePrompt: (value: string) => void;
  reduceMotion: boolean;
}) {
  const [referenceCount, setReferenceCount] = useState(0);
  const [expert, setExpert] = useState("全能 AI 绘画提示词创意专家");
  const [workflow, setWorkflow] = useState("电影级视觉提示词");
  const [model, setModel] = useState("gpt-5.6-luna");
  const [saved, setSaved] = useState(false);
  const [frequent, setFrequent] = useState(false);
  const [optimizing, setOptimizing] = useState(false);

  const cycle = (value: string, values: string[], setter: (value: string) => void) => {
    setter(values[(values.indexOf(value) + 1) % values.length]);
  };

  return (
    <section className={`create-space ${hasResult ? "has-result" : ""}`}>
      <header className="hero-copy">
        <span><Magicpen size={14} /> Prompt Intelligence</span>
        <h1>今天，想创造什么？</h1>
        <p>说出你的想法，剩下的交给提示词管家。</p>
      </header>

      <section className={`intelligence-composer ${generating ? "is-thinking" : ""}`}>
        <div className="composer-glow" aria-hidden="true" />
        <textarea value={prompt} onChange={(event) => onPromptChange(event.target.value)} aria-label="描述你的创意" />
        <footer>
          <div className="composer-tools">
            <button className={referenceCount ? "is-active" : ""} type="button" onClick={() => setReferenceCount((value) => value >= 8 ? 0 : value + 1)}>
              {referenceCount ? <TickCircle size={15} variant="Bold" /> : <Gallery size={15} />}<span>{referenceCount ? `参考图 ${referenceCount}/8` : "参考图 0/8"}</span>
            </button>
            <button type="button" onClick={() => cycle(expert, ["全能 AI 绘画提示词创意专家", "逆向提示词专家", "品牌视觉创意总监"], setExpert)}><Magicpen size={15} /><span>{expert}</span><ArrowDown2 size={12} /></button>
          </div>
          <span className="character-count">{prompt.length}</span>
          <button className="send-orb" type="button" aria-label="生成提示词" aria-busy={generating} onClick={onGenerate}>
            {generating ? <i /> : <ArrowUp2 size={19} />}
          </button>
        </footer>
      </section>

      <section className="creator-context-strip" aria-label="创作配置">
        <button type="button" onClick={() => cycle(expert, ["全能 AI 绘画提示词创意专家", "逆向提示词专家", "品牌视觉创意总监"], setExpert)}><span><small>专家身份</small><strong>{expert}</strong></span><ArrowRight2 size={14} /></button>
        <button type="button" onClick={() => cycle(workflow, ["电影级视觉提示词", "商业产品精修", "视频分镜脚本"], setWorkflow)}><span><small>专业工作流</small><strong>{workflow}</strong></span><ArrowRight2 size={14} /></button>
        <button type="button" onClick={() => cycle(model, ["gpt-5.6-luna", "gpt-4.1", "claude-sonnet"], setModel)}><span><small>模型</small><strong>{model}</strong></span><ArrowRight2 size={14} /></button>
      </section>

      <div className="recent-prompt-row"><span>最近使用</span>{recentPrompts.map((item) => <button type="button" key={item} onClick={() => onUsePrompt(`${item}：${prompt}`)}>{item}</button>)}</div>

      <AnimatePresence initial={false}>
        {hasResult ? (
          <motion.section
            className="prompt-result-card"
            initial={{ opacity: 0, y: reduceMotion ? 0 : 14, scale: reduceMotion ? 1 : 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: reduceMotion ? 0 : 8, scale: reduceMotion ? 1 : 0.995 }}
            transition={reduceMotion ? { duration: 0.12 } : calmSpring}
          >
            <header>
              <div><span className="result-mark"><TickCircle size={17} variant="Bold" /></span><span><small>为你整理好了</small><strong>专业提示词</strong></span></div>
              <div className="format-pills" role="tablist" aria-label="提示词格式">
                {(["zh", "en", "json"] as Format[]).map((item) => <button className={format === item ? "is-active" : ""} type="button" role="tab" key={item} onClick={() => onFormatChange(item)}>{item === "zh" ? "中文" : item === "en" ? "English" : "JSON"}</button>)}
              </div>
            </header>
            <div className="result-text"><p>{generatedPrompt[format]}</p></div>
            <footer>
              <span className="completion-note"><TickCircle size={13} variant="Bold" />已补全构图、光线、镜头与材质</span>
              <div>
                <button className={`motion-copy ${copied ? "is-complete" : ""}`} type="button" onClick={onCopy}>
                  <span className="motion-icon-stack"><Copy className="is-primary" size={15} /><TickCircle className="is-confirm" size={15} variant="Bold" /></span>{copied ? "已复制" : "复制"}
                </button>
                <button className={`motion-favorite ${saved ? "is-active" : ""}`} type="button" onClick={() => setSaved((value) => !value)}><Heart size={15} variant={saved ? "Bold" : "Linear"} />{saved ? "已收藏" : "收藏"}</button>
                <button className={frequent ? "is-active" : ""} type="button" onClick={() => setFrequent((value) => !value)}><ArchiveTick size={15} />{frequent ? "已常用" : "常用"}</button>
                <button type="button" disabled={optimizing} onClick={() => { setOptimizing(true); window.setTimeout(() => setOptimizing(false), reduceMotion ? 120 : 520); }}><Refresh size={15} />{optimizing ? "优化中" : "AI 优化"}</button>
                <button className="blue-action" type="button" onClick={onOpenImages}><Gallery size={15} />开始创作</button>
              </div>
            </footer>
          </motion.section>
        ) : null}
      </AnimatePresence>

      <section className="inspiration-shelf">
        <header><h2>灵感起点</h2><button type="button">查看全部</button></header>
        <div>
          {inspirations.map((item) => (
            <button className={`inspiration-card tone-${item.tone}`} type="button" key={item.title}>
              <i aria-hidden="true" /><span><strong>{item.title}</strong><small>{item.subtitle}</small></span><ArrowUp2 size={15} />
            </button>
          ))}
        </div>
      </section>
    </section>
  );
}

function LibrarySpace({ favoriteIds, deletedIds, onSelect, onToggleFavorite }: { favoriteIds: Set<number>; deletedIds: Set<number>; onSelect: (id: number) => void; onToggleFavorite: (id: number) => void }) {
  const [filter, setFilter] = useState<LibraryFilter>("全部");
  const [category, setCategory] = useState("全部");
  const [query, setQuery] = useState("");
  const [sortNewest, setSortNewest] = useState(true);
  const [folders, setFolders] = useState(["品牌视觉", "人物灵感", "空间灵感", "视频脚本"]);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [folderDraft, setFolderDraft] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 1200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const visibleCards = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const cards = libraryCards.filter((card) => !deletedIds.has(card.id))
      .filter((card) => filter !== "收藏" || favoriteIds.has(card.id))
      .filter((card) => category === "全部" || card.note === category)
      .filter((card) => !normalized || `${card.title}${card.note}${card.content}`.toLowerCase().includes(normalized));
    return sortNewest ? cards : [...cards].reverse();
  }, [category, deletedIds, favoriteIds, filter, query, sortNewest]);

  const createFolder = () => {
    const name = folderDraft.trim();
    if (!name || folders.includes(name)) return;
    setFolders((current) => [...current, name]);
    setFolderDraft("");
    setCreatingFolder(false);
  };

  return (
    <section className="library-space">
      <header className="centered-heading">
        <span>提示词库</span>
        <h1>灵感，随时回来。</h1>
        <p>搜索、收藏、整理和复用你积累起来的创作语言。</p>
      </header>
      <div className="library-controls">
        <label className="motion-search"><SearchNormal size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="搜索灵感" placeholder="搜索提示词、标签、关键词" /></label>
        <div>{(["全部", "收藏", "我的收藏夹"] as LibraryFilter[]).map((item) => <button className={filter === item ? "is-active" : ""} type="button" key={item} onClick={() => setFilter(item)}>{item}</button>)}</div>
        <button className="add-button" type="button" aria-label="新建收藏夹" onClick={() => { setFilter("我的收藏夹"); setCreatingFolder(true); }}><Add size={17} /></button>
      </div>

      <div className="library-tool-row">
        <div className="category-scroller">{categories.map((item) => <button className={category === item ? "is-active" : ""} type="button" key={item} onClick={() => { setCategory(item); setFilter("全部"); }}>{item}{item !== "全部" ? <small>{libraryCards.filter((card) => card.note === item).length}</small> : null}</button>)}</div>
        <button type="button" aria-label="筛选"><Filter size={15} /></button>
        <button type="button" aria-label="切换排序" onClick={() => setSortNewest((value) => !value)}><Sort size={15} /></button>
      </div>

      {filter === "我的收藏夹" ? (
        <section className="folder-browser">
          <header><div><Folder2 size={17} /><strong>我的收藏夹</strong><span>{folders.length}</span></div><div><button type="button" title="导入" onClick={() => setNotice("已读取导入文件")}><Import size={16} /></button><button type="button" title="导出" onClick={() => setNotice("收藏夹已导出")}><DocumentDownload size={16} /></button><button type="button" title="新建收藏夹" onClick={() => setCreatingFolder(true)}><Add size={16} /></button></div></header>
          {creatingFolder ? <div className="folder-create-row"><input autoFocus value={folderDraft} onChange={(event) => setFolderDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") createFolder(); }} placeholder="收藏夹名称" /><button type="button" onClick={createFolder}><TickCircle size={16} /></button><button type="button" onClick={() => setCreatingFolder(false)}><CloseCircle size={16} /></button></div> : null}
          <div className="folder-grid">{folders.map((folder) => <article key={folder}><button type="button" onClick={() => { setQuery(folder); setFilter("全部"); }}><Folder2 size={19} /><span><strong>{folder}</strong><small>{libraryCards.filter((card) => card.folder === folder).length} 条提示词</small></span></button><div><button type="button" aria-label={`重命名 ${folder}`} onClick={() => { setFolderDraft(folder); setCreatingFolder(true); }}><Edit2 size={14} /></button><button type="button" aria-label={`删除 ${folder}`} onClick={() => setFolders((current) => current.filter((item) => item !== folder))}><Trash size={14} /></button></div></article>)}</div>
          {notice ? <p className="inline-notice"><TickCircle size={13} variant="Bold" />{notice}</p> : null}
        </section>
      ) : (
        <>
          <div className="library-results-heading"><div><strong>{filter === "收藏" ? "收藏" : category === "全部" ? "全部提示词" : category}</strong><span>{visibleCards.length}</span></div><button type="button" aria-label="更多操作"><More size={17} /></button></div>
          <div className="memory-gallery">
            {visibleCards.map((card, index) => (
              <article className={`memory-card memory-${card.tone} ${index === 0 && filter === "全部" && !query ? "is-featured" : ""}`} key={card.id}>
                <button className="memory-open" type="button" onClick={() => onSelect(card.id)}><span className="memory-art" aria-hidden="true"><i /><b /></span><span className="memory-overlay"><small>{card.note}</small><strong>{card.title}</strong><span className={favoriteIds.has(card.id) ? "motion-favorite is-active" : ""}>{favoriteIds.has(card.id) ? <Heart size={14} variant="Bold" /> : <Magicpen size={14} />}</span></span></button>
                <button className={`memory-favorite ${favoriteIds.has(card.id) ? "is-active" : ""}`} type="button" aria-label={favoriteIds.has(card.id) ? "取消收藏" : "收藏"} onClick={() => onToggleFavorite(card.id)}><Heart size={15} variant={favoriteIds.has(card.id) ? "Bold" : "Linear"} /></button>
              </article>
            ))}
          </div>
          {visibleCards.length === 0 ? <div className="empty-state"><SearchNormal size={23} /><strong>没有找到匹配的提示词</strong><span>试试其他关键词或筛选条件。</span></div> : null}
        </>
      )}
    </section>
  );
}

function ImageSpace({ prompt, onPromptChange, onBackToPrompt, reduceMotion }: { prompt: string; onPromptChange: (value: string) => void; onBackToPrompt: () => void; reduceMotion: boolean }) {
  const [ratio, setRatio] = useState("1:1");
  const [resolution, setResolution] = useState("2K");
  const [count, setCount] = useState(4);
  const [downloaded, setDownloaded] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [savedPrompt, setSavedPrompt] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyCount, setHistoryCount] = useState(2);
  const [exampleIds, setExampleIds] = useState(() => new Set<number>());

  useEffect(() => {
    if (downloaded === null) return;
    const timer = window.setTimeout(() => setDownloaded(null), 1100);
    return () => window.clearTimeout(timer);
  }, [downloaded]);

  const regenerate = () => {
    if (generating || !prompt.trim()) return;
    setGenerating(true);
    window.setTimeout(() => { setGenerating(false); setHistoryCount((value) => value + 1); }, reduceMotion ? 180 : 720);
  };

  return (
    <section className="image-space">
      <header className="centered-heading">
        <span>图像工坊</span>
        <h1>让想法，被看见。</h1>
        <p>提示词已经就绪，只需选择你想要的画面。</p>
      </header>
      <div className="prompt-capsule">
        <Magicpen size={17} />
        <span>{prompt}</span>
        <button type="button" onClick={onBackToPrompt}><Edit2 size={13} />编辑</button>
      </div>
      <section className="image-compose-panel">
        <div className="image-parameter-row">
          <label><span>图像比例</span><select value={ratio} onChange={(event) => setRatio(event.target.value)}>{["1:1", "4:5", "16:9"].map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span>分辨率</span><select value={resolution} onChange={(event) => setResolution(event.target.value)}>{["1K", "2K", "4K"].map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span>生成数量</span><select value={count} onChange={(event) => setCount(Number(event.target.value))}>{[1, 2, 4].map((item) => <option value={item} key={item}>{item} 张</option>)}</select></label>
        </div>
        <textarea value={prompt} onChange={(event) => onPromptChange(event.target.value)} aria-label="图像生成提示词" />
        <footer><span>{generating ? "正在生成新图片，完成后将在下方显示" : "本次结果为临时内容，明确保存后才会保留。"}</span><button className="blue-action" type="button" onClick={regenerate} disabled={generating}>{generating ? <i /> : <Magicpen size={15} />}{generating ? "生成中" : "生成图片"}</button></footer>
      </section>
      <div className="image-results-heading"><div><strong>本次生成结果</strong><span>临时结果 · 关闭后不保留</span></div><div><button type="button" onClick={() => setDownloaded(0)}><DocumentDownload size={15} />{downloaded === 0 ? "已保存作品" : "保存作品"}</button><button type="button" onClick={() => setSavedPrompt((value) => !value)}><Save2 size={15} />{savedPrompt ? "已保存 Prompt" : "保存 Prompt"}</button></div></div>
      <div className="image-stage-grid">
        {Array.from({ length: count }, (_, index) => index + 1).map((item) => (
          <article className={`generated-image generated-${item} ${generating ? "is-generating" : ""}`} key={item}>
            <span>0{item}</span><i aria-hidden="true" /><b aria-hidden="true" />
            <button className={`motion-download ${downloaded === item ? "is-complete" : ""}`} type="button" aria-label={`下载图像 ${item}`} onClick={() => setDownloaded(item)}>
              {downloaded === item ? <TickCircle size={16} variant="Bold" /> : <DocumentDownload size={16} />}
            </button>
            <button className={`example-image-button ${exampleIds.has(item) ? "is-complete" : ""}`} type="button" aria-label={exampleIds.has(item) ? "已设为示例图" : "设为示例图"} onClick={() => setExampleIds((current) => { const next = new Set(current); if (next.has(item)) next.delete(item); else next.add(item); return next; })}><ArchiveTick size={15} /></button>
          </article>
        ))}
      </div>
      <div className="image-floating-tools">
        <div className="ratio-picker">{["1:1", "4:5", "16:9"].map((item) => <button className={ratio === item ? "is-active" : ""} type="button" key={item} onClick={() => setRatio(item)}>{item}</button>)}</div>
        <button type="button" onClick={() => document.querySelector<HTMLTextAreaElement>('[aria-label="图像生成提示词"]')?.focus()}><Slider size={15} />调整</button>
        <button className="blue-action" type="button" onClick={regenerate} disabled={generating}><Refresh size={15} />再生成一组</button>
      </div>
      <section className="history-panel">
        <button type="button" onClick={() => setHistoryOpen((value) => !value)} aria-expanded={historyOpen}><span><ArchiveTick size={16} /><strong>创作历史</strong><small>{historyCount}</small></span><ArrowDown2 className={historyOpen ? "is-open" : ""} size={16} /></button>
        <AnimatePresence initial={false}>{historyOpen ? <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}><article><span className="history-thumb generated-2" /><span><strong>东方茶饮 · 4 张</strong><small>{ratio} · {resolution} · 刚刚</small></span><button type="button" onClick={() => setDownloaded(9)}><DocumentDownload size={15} /></button></article><article><span className="history-thumb generated-4" /><span><strong>海岸公路镜头 · 2 张</strong><small>16:9 · 2K · 昨天</small></span><button type="button"><Eye size={15} /></button></article><button className="clear-history" type="button" onClick={() => setHistoryCount(0)}><Trash size={14} />清空历史</button></motion.div> : null}</AnimatePresence>
      </section>
    </section>
  );
}

function SettingsSpace({ onBack }: { onBack: () => void }) {
  const [provider, setProvider] = useState("OpenAI 兼容中转站");
  const [apiKey, setApiKey] = useState("sk-demo-local-key");
  const [baseUrl, setBaseUrl] = useState("https://xinghe.xin/");
  const [imageKey, setImageKey] = useState("sk-image-demo-key");
  const [imageUrl, setImageUrl] = useState("https://xinghe.xin/");
  const [textModel, setTextModel] = useState("gpt-5.6-luna");
  const [visionModel, setVisionModel] = useState("gpt-5.6-luna");
  const [imageModel, setImageModel] = useState("gpt-image-2");
  const [showKeys, setShowKeys] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [storageUsed, setStorageUsed] = useState(0.8);

  const save = () => {
    localStorage.setItem("apple-prompt-studio-settings", JSON.stringify({ provider, apiKey, baseUrl, imageKey, imageUrl, textModel, visionModel, imageModel }));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1200);
  };

  const test = () => {
    setTesting(true);
    window.setTimeout(() => setTesting(false), 720);
  };

  return (
    <section className="settings-space">
      <header className="settings-heading"><button className="circle-button" type="button" onClick={onBack} aria-label="返回主界面"><ArrowLeft size={17} /></button><div><span>设置</span><h1>模型连接</h1><p>配置提示词、视觉理解和图像生成使用的模型。</p></div><span className="ready-pill"><i />{testing ? "正在测试" : "连接成功"}</span></header>
      <div className="settings-layout">
        <section className="settings-form-card">
          <header><div><small>连接配置</small><h2>服务连接与模型</h2></div><span><CloudConnection size={16} />{provider}</span></header>
          <div className="settings-section"><div className="settings-section-title"><strong>服务连接</strong><span>用于连接模型服务的服务商、凭证与地址。</span></div><label><span>服务商</span><select value={provider} onChange={(event) => setProvider(event.target.value)}><option>OpenAI 兼容中转站</option><option>OpenAI 官方</option><option>自定义服务</option></select></label><div className="settings-two-col"><label><span>API Key <em>已保存</em></span><div className="secure-input"><input type={showKeys ? "text" : "password"} value={apiKey} onChange={(event) => setApiKey(event.target.value)} /><button type="button" onClick={() => setShowKeys((value) => !value)}>{showKeys ? <EyeSlash size={16} /> : <Eye size={16} />}</button></div></label><label><span>Base URL</span><input value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} /></label></div></div>
          <div className="settings-section"><div className="settings-section-title"><strong>生图专用配置</strong><span>留空时自动回退使用上方通用配置。</span></div><div className="settings-two-col"><label><span>生图 API Key <em>已保存</em></span><div className="secure-input"><input type={showKeys ? "text" : "password"} value={imageKey} onChange={(event) => setImageKey(event.target.value)} /><button type="button" onClick={() => setShowKeys((value) => !value)}>{showKeys ? <EyeSlash size={16} /> : <Eye size={16} />}</button></div></label><label><span>生图 Base URL</span><input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} /></label></div></div>
          <div className="settings-section"><div className="settings-section-title"><strong>模型用途</strong><span>选择识别结果，或直接填写模型 ID。</span></div><div className="settings-model-grid"><label><span>推理模型</span><select value={textModel} onChange={(event) => setTextModel(event.target.value)}><option>gpt-5.6-luna</option><option>gpt-4.1</option></select></label><label><span>视觉模型</span><select value={visionModel} onChange={(event) => setVisionModel(event.target.value)}><option>gpt-5.6-luna</option><option>gpt-4o</option></select></label><label><span>生图模型</span><select value={imageModel} onChange={(event) => setImageModel(event.target.value)}><option>gpt-image-2</option><option>gpt-image-1</option></select></label></div></div>
          <div className="settings-section"><div className="settings-section-title"><strong>图像输出</strong><span>作为图像工坊的默认生成参数。</span></div><div className="settings-model-grid"><label><span>图像比例</span><select><option>1:1</option><option>4:5</option><option>16:9</option></select></label><label><span>分辨率</span><select><option>2K</option><option>1K</option><option>4K</option></select></label><label><span>生成数量</span><select><option>1 张</option><option>2 张</option><option>4 张</option></select></label></div></div>
          <div className="storage-row"><div><strong>示例图存储</strong><span>已使用 {storageUsed.toFixed(1)}MB / 30.0MB · 3 张示例图</span></div><button type="button" onClick={() => setStorageUsed(0)}>清理无效数据</button></div>
          <footer><button className="blue-action" type="button" onClick={save}><Save2 size={16} />{saved ? "已保存配置" : "保存配置"}</button><button type="button" onClick={test} disabled={testing}><CloudConnection size={16} />{testing ? "测试中" : "测试连接"}</button><button type="button" onClick={() => { setTextModel("gpt-5.6-luna"); setVisionModel("gpt-5.6-luna"); setImageModel("gpt-image-2"); }}><Refresh size={16} />自动识别模型</button></footer>
        </section>
        <aside className="status-stack"><section><header><CloudConnection size={18} /><div><strong>状态快照</strong><span>当前设备中的实时配置状态</span></div></header>{[["当前服务商", provider], ["配置状态", "已填写完整"], ["连接状态", testing ? "测试中" : "连接成功"], ["最近测试", "2026/07/24 现在"], ["已识别模型", "推理 394 / 视觉 394 / 生图 23"]].map(([label, value]) => <div className="status-row" key={label}><span>{label}</span><strong>{value}</strong></div>)}</section><section><header><Activity size={18} /><div><strong>模型能力</strong><span>当前启用的三条通道</span></div></header><div className="status-row"><span>文本模型</span><strong>{textModel}</strong></div><div className="status-row"><span>视觉模型</span><strong>{visionModel}</strong></div><div className="status-row"><span>图像模型</span><strong>{imageModel}</strong></div></section></aside>
      </div>
    </section>
  );
}

function PromptSheet({ card, favorite, reduceMotion, onClose, onToggleFavorite, onDelete, onUse, onImage }: { card: (typeof libraryCards)[number]; favorite: boolean; reduceMotion: boolean; onClose: () => void; onToggleFavorite: () => void; onDelete: () => void; onUse: () => void; onImage: () => void }) {
  const [deleteArmed, setDeleteArmed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(card.content);
  const [optimizing, setOptimizing] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1100);
    return () => window.clearTimeout(timer);
  }, [copied]);

  return (
    <motion.div className="sheet-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduceMotion ? 0.1 : 0.16 }} onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
      <motion.section className="prompt-sheet" initial={{ opacity: 0, y: reduceMotion ? 0 : 18, scale: reduceMotion ? 1 : 0.985 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: reduceMotion ? 0 : 12, scale: reduceMotion ? 1 : 0.99 }} transition={reduceMotion ? { duration: 0.1 } : calmSpring}>
        <header><span className="sheet-header-spacer" aria-hidden="true" /><span>{card.note}</span><button className="circle-button" type="button" aria-label="关闭" onClick={onClose}><CloseCircle size={17} /></button></header>
        <div className={`sheet-art memory-${card.tone}`}><span className="memory-art"><i /><b /></span></div>
        <h2>{card.title}</h2>
        {editing ? <textarea className="sheet-editor" value={content} onChange={(event) => setContent(event.target.value)} aria-label="编辑提示词" /> : <p>{content}</p>}
        <div className="sheet-motion-tools" aria-label="提示词功能操作">
          <button className={`favorite-button motion-favorite ${favorite ? "is-active" : ""}`} type="button" aria-label={favorite ? "取消收藏" : "收藏"} aria-pressed={favorite} onClick={onToggleFavorite}><Heart size={16} variant={favorite ? "Bold" : "Linear"} /></button>
          <button className={editing ? "is-active" : ""} type="button" aria-label={editing ? "保存编辑" : "编辑提示词"} onClick={() => setEditing((value) => !value)}>{editing ? <TickCircle size={16} /> : <Edit2 size={16} />}</button>
          <button className={`motion-delete ${deleteArmed ? "is-armed" : ""}`} type="button" aria-label={deleteArmed ? "确认删除" : "删除提示词"} aria-pressed={deleteArmed} onClick={() => { if (deleteArmed) onDelete(); else setDeleteArmed(true); }}><Trash size={16} /></button>
          <span>{deleteArmed ? "再次点按删除" : editing ? "编辑后自动保存" : favorite ? "已收藏" : "提示词操作"}</span>
        </div>
        <footer><button className={`motion-copy ${copied ? "is-complete" : ""}`} type="button" onClick={() => { void navigator.clipboard?.writeText(content); setCopied(true); }}><span className="motion-icon-stack"><Copy className="is-primary" size={15} /><TickCircle className="is-confirm" size={15} variant="Bold" /></span>{copied ? "已复制" : "复制"}</button><button type="button" disabled={optimizing} onClick={() => { setOptimizing(true); window.setTimeout(() => { setContent((value) => `${value} 强化主体层次、光线方向与材质细节。`); setOptimizing(false); }, reduceMotion ? 120 : 560); }}><Refresh size={15} />{optimizing ? "优化中" : "AI 优化"}</button><button type="button" onClick={onImage}><Gallery size={15} />图像工坊</button><button className="blue-action" type="button" onClick={onUse}><Magicpen size={15} />用于新创作</button></footer>
      </motion.section>
    </motion.div>
  );
}
