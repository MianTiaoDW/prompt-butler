const titleCase = (slug) => slug
  .split("-")
  .map((word) => ({ ui: "UI", ux: "UX", ai: "AI", css: "CSS", html: "HTML", js: "JS", macos: "macOS", y2k: "Y2K", vhs: "VHS", crt: "CRT", jrpg: "JRPG", saas: "SaaS", web3: "Web3", "3d": "3D" }[word] || word.charAt(0).toUpperCase() + word.slice(1)))
  .join(" ");

const STYLE_NAMES = {
  "neo-brutalist": "新野兽派", editorial: "编辑杂志风", neumorphism: "新拟物派", glassmorphism: "玻璃拟态",
  "bento-grid": "便当盒网格", "corporate-clean": "企业简洁风", "minimalist-flat": "极简扁平风", "soft-ui": "柔和界面风",
  "natural-organic": "自然有机风", "modern-gradient": "现代渐变", "retro-vintage": "复古怀旧", "dark-mode": "暗色模式",
  "macos-vibrancy": "macOS 鲜活材质", "geometric-bold": "几何粗体", "masonry-flow": "瀑布流", "split-screen": "分屏布局",
  "full-page-scroll": "全页滚动", "timeline-vertical": "垂直时间轴", "card-stack": "卡片堆叠", "sidebar-fixed": "固定侧栏",
  "magazine-grid": "杂志网格", "hero-fullscreen": "全屏首屏", claymorphism: "黏土拟态", "notion-style": "Notion 风格",
  "stripe-style": "Stripe 风格", "apple-style": "Apple 风格", "pixel-art": "像素艺术", vaporwave: "蒸汽波",
  memphis: "孟菲斯", "art-deco": "装饰艺术", bauhaus: "包豪斯", skeuomorphism: "拟物设计", "swiss-style": "瑞士风格",
  "ghibli-style": "吉卜力风", "material-design": "Material Design", "fluent-design": "Fluent Design", "comic-style": "漫画风",
  "sketch-style": "手绘草图", "watercolor-style": "水彩风", "dashboard-layout": "仪表盘布局", "cyberpunk-neon": "赛博朋克霓虹",
  synthwave: "合成器浪潮", "art-nouveau": "新艺术运动", surrealism: "超现实主义", "ukiyo-e-digital": "数字浮世绘",
  gothic: "哥特风", outrun: "Outrun 复古未来", "dark-academia": "暗黑学院", cottagecore: "乡村田园",
  risograph: "孔版印刷", mecha: "机甲风", "cyber-chinese": "赛博国风", "acid-graphics": "酸性图形",
  "hand-drawn-doodle": "手绘涂鸦", "swiss-poster": "瑞士海报", "watercolor-art": "水彩艺术", "impressionist-oil": "印象派油画",
  "collage-art": "拼贴艺术", "glitch-art": "故障艺术", "visual-novel": "视觉小说", "shoujo-manga": "少女漫画",
  "cyber-anime": "赛博动漫", "pixel-anime": "像素动漫", "japanese-fresh": "日系清新", "neon-samurai": "霓虹武士",
  "magic-circle": "魔法阵", "cyber-wafuu": "赛博和风", steampunk: "蒸汽朋克", "pop-art": "波普艺术",
  solarpunk: "太阳朋克", "asymmetric-grid": "非对称网格", "parallax-sections": "视差分区", "warm-dashboard": "暖色仪表盘",
  "neon-gradient": "霓虹渐变", "liquid-glass": "液态玻璃", scandinavian: "斯堪的纳维亚", "cel-shading": "赛璐璐渲染",
  "wabi-sabi": "侘寂", "zen-garden": "禅意庭院", "sci-fi-hud": "科幻 HUD", "kawaii-minimal": "可爱极简",
  "film-noir": "黑色电影", "arcade-crt": "街机 CRT", "frutiger-aero": "Frutiger Aero", "anti-design": "反设计",
  holographic: "全息质感", "generative-art": "生成艺术", particle: "粒子视觉", "vhs-aesthetic": "VHS 美学",
  "ink-wash": "水墨", monochrome: "单色设计", terracotta: "陶土色系", "brutalist-web": "野兽派网页",
  "mid-century-modern": "世纪中期现代", constructivism: "构成主义", "op-art": "欧普艺术", "islamic-geometric": "伊斯兰几何",
  "indian-festive": "印度节庆", "african-textile": "非洲织物", "korean-minimal": "韩系极简", "pastel-goth": "粉彩哥特",
  maximalism: "极繁主义", "medieval-manuscript": "中世纪手稿", "graffiti-street": "街头涂鸦", "marble-luxury": "大理石奢华",
  "victorian-botanical": "维多利亚植物", cubism: "立体主义", "tropical-paradise": "热带天堂", "github-style": "GitHub 风格",
  witchcore: "女巫核", "neon-tokyo": "霓虹东京", "paper-craft": "纸艺", blueprint: "蓝图风",
  "dopamine-design": "多巴胺设计", "linear-style": "Linear 风格", "shopify-clean": "Shopify 简洁风", "luxury-retail": "奢华零售",
  "fresh-market": "生鲜市场", "data-dense": "高密度数据", "oversized-typography": "超大排版", "developer-terminal": "开发者终端",
  "horizontal-gallery": "横向画廊", "latex-paper": "LaTeX 论文", "distill-style": "Distill 学术风", "gallery-dark": "暗色画廊",
  "studio-bold": "工作室粗体", "warm-organic": "温暖有机"
};

const styleSlugs = `neo-brutalist,editorial,neumorphism,glassmorphism,bento-grid,corporate-clean,minimalist-flat,soft-ui,natural-organic,modern-gradient,retro-vintage,dark-mode,macos-vibrancy,geometric-bold,masonry-flow,split-screen,full-page-scroll,timeline-vertical,card-stack,sidebar-fixed,magazine-grid,hero-fullscreen,claymorphism,notion-style,stripe-style,apple-style,pixel-art,vaporwave,y2k,memphis,art-deco,bauhaus,skeuomorphism,swiss-style,ghibli-style,material-design,fluent-design,comic-style,sketch-style,watercolor-style,f-pattern-layout,z-pattern-layout,holy-grail-layout,dashboard-layout,cyberpunk-neon,synthwave,neo-brutalist-soft,neo-brutalist-playful,art-nouveau,surrealism,ukiyo-e-digital,gothic,outrun,dark-academia,cottagecore,risograph,mecha,gothic-lolita,cyber-chinese,acid-graphics,hand-drawn-doodle,swiss-poster,watercolor-art,impressionist-oil,collage-art,glitch-art,visual-novel,shoujo-manga,cyber-anime,pixel-anime,japanese-fresh,neon-samurai,magic-circle,cyber-wafuu,steampunk,pop-art,solarpunk,jrpg,asymmetric-grid,parallax-sections,warm-dashboard,neon-gradient,liquid-glass,scandinavian,cel-shading,wabi-sabi,zen-garden,sci-fi-hud,kawaii-minimal,film-noir,arcade-crt,frutiger-aero,anti-design,holographic,generative-art,particle,vhs-aesthetic,ink-wash,monochrome,terracotta,brutalist-web,mid-century-modern,constructivism,op-art,islamic-geometric,indian-festive,african-textile,korean-minimal,pastel-goth,maximalism,medieval-manuscript,graffiti-street,marble-luxury,victorian-botanical,cubism,tropical-paradise,github-style,witchcore,neon-tokyo,paper-craft,blueprint,dopamine-design,linear-style,shopify-clean,luxury-retail,fresh-market,data-dense,oversized-typography,developer-terminal,horizontal-gallery,latex-paper,distill-style,gallery-dark,studio-bold,warm-organic`.split(",");

const inferStyleFamily = (slug) => {
  if (/(grid|layout|sidebar|timeline|stack|scroll|gallery|dashboard|split-screen|masonry|hero)/.test(slug)) return "布局结构";
  if (/(cyber|neon|synth|holographic|particle|terminal|sci-fi|glitch|vhs|crt|pixel|generative|blueprint)/.test(slug)) return "数字未来";
  if (/(japanese|korean|chinese|islamic|indian|african|scandinavian|ukiyo|wabi|zen)/.test(slug)) return "地域美学";
  if (/(art|bauhaus|swiss|comic|sketch|watercolor|surreal|gothic|risograph|manga|anime|collage|construct|cubism|graffiti|manuscript|botanical|op-)/.test(slug)) return "艺术文化";
  if (/(corporate|stripe|github|shopify|retail|market|data|studio|luxury|docs|latex|distill)/.test(slug)) return "品牌商业";
  if (/(retro|vintage|dark|noir|outrun|vaporwave|y2k|arcade|medieval|witch)/.test(slug)) return "暗色复古";
  return "基础体系";
};

export const styleIndex = styleSlugs.map((slug) => ({
  id: `style-${slug}`,
  name: STYLE_NAMES[slug] || titleCase(slug),
  en: titleCase(slug),
  family: inferStyleFamily(slug),
  kind: "设计风格",
  source: "StyleKit",
  sourceUrl: `https://www.stylekit.top/zh/styles/${slug}`
}));

const UI_NAMES = {
  "menu-bar": "菜单栏", "context-menu": "上下文菜单", "disclosure-triangle": "展开三角", "dock-badge": "程序坞徽标",
  "focus-ring": "焦点环", inspector: "检查器", "insertion-caret": "插入光标", "menu-bar-extra": "菜单栏附加项",
  panel: "面板", popover: "弹出浮层", "popup-pulldown-combo": "弹出/下拉组合控件", "segmented-control": "分段控制器",
  sheet: "附着式面板", sidebar: "侧边栏", stepper: "步进器", toolbar: "工具栏", "traffic-lights": "窗口交通灯",
  vibrancy: "鲜活材质", window: "窗口", "split-view": "分栏视图", "scroll-view": "滚动视图", "search-field": "搜索框",
  "save-panel": "保存面板", "token-field": "令牌输入框", "combo-button": "组合按钮", "level-indicator": "等级指示器",
  "column-view": "分栏浏览", "outline-view": "大纲视图", pointer: "指针", alert: "警告框", slider: "滑块", "color-well": "颜色井",
  "three-dots": "更多菜单", "drag-and-drop": "拖放", divider: "分隔线", "progress-indicators": "进度指示器", toast: "轻提示",
  "dialog-drawer-sheet": "对话框/抽屉/底部面板", "popover-dropdown-tooltip": "浮层/下拉/提示气泡", scrim: "遮罩层",
  "skeleton-spinner": "骨架屏与转轮", combobox: "组合框", "command-palette": "命令面板", accordion: "折叠区", tabs: "标签页",
  "badge-chip-pill": "徽标/标签/胶囊", breadcrumbs: "面包屑", "sticky-fixed": "粘性与固定定位", "focus-ring-web": "网页焦点环",
  "empty-state": "空状态", "hover-card": "悬停卡片", "switch-checkbox-radio": "开关/复选/单选", "toggle-group": "切换组",
  "form-field": "表单字段", truncation: "文本截断", "hamburger-menu": "汉堡菜单", lightbox: "灯箱预览", marquee: "跑马灯",
  "bento-grid": "便当盒网格", masonry: "瀑布流", easing: "缓动曲线", spring: "弹簧动画", "text-scramble": "文字扰动",
  carousel: "轮播", "header-navbar": "页眉与导航栏", card: "卡片", "resize-handle": "缩放手柄",
  skeuomorphism: "拟物设计", neumorphism: "新拟物", glassmorphism: "玻璃拟态", "liquid-glass": "液态玻璃",
  "web-brutalism": "网页野兽派", neobrutalism: "新野兽派", y2k: "Y2K", "frutiger-aero": "Frutiger Aero",
  "flat-design": "扁平设计", minimalism: "极简主义", claymorphism: "黏土拟态", "vernacular-web": "本土网络风", aqua: "Aqua",
  "windows-aero": "Windows Aero"
};

const uiGroups = {
  "macOS 控件": `menu-bar,context-menu,disclosure-triangle,dock-badge,focus-ring,inspector,insertion-caret,menu-bar-extra,panel,popover,popup-pulldown-combo,segmented-control,sheet,sidebar,stepper,toolbar,traffic-lights,vibrancy,window,split-view,scroll-view,search-field,save-panel,token-field,combo-button,level-indicator,column-view,outline-view,pointer,alert,slider,color-well`,
  "Web 模式": `three-dots,drag-and-drop,divider,progress-indicators,toast,dialog-drawer-sheet,popover-dropdown-tooltip,scrim,skeleton-spinner,combobox,command-palette,accordion,tabs,badge-chip-pill,breadcrumbs,sticky-fixed,focus-ring-web,empty-state,hover-card,switch-checkbox-radio,toggle-group,form-field,truncation,hamburger-menu,lightbox,marquee,bento-grid,masonry,easing,spring,text-scramble,carousel,header-navbar,card,resize-handle`,
  "视觉流派": `skeuomorphism,neumorphism,glassmorphism,liquid-glass,web-brutalism,neobrutalism,y2k,frutiger-aero,flat-design,minimalism,claymorphism,vernacular-web,aqua,windows-aero`
};

export const uiTermIndex = Object.entries(uiGroups).flatMap(([family, csv]) => csv.split(",").filter(Boolean).map((slug) => ({
  id: `term-${family}-${slug}`,
  name: UI_NAMES[slug] || titleCase(slug),
  en: titleCase(slug),
  family,
  kind: "UI 术语",
  source: "NameThatUI",
  sourceUrl: `https://namethatui.com/${family === "macOS 控件" ? "macos" : family === "Web 模式" ? "web" : "styles"}/${slug}`
})));

const reactGroups = {
  "动态背景": `ferrofluid,lightfall,liquid-ether,prism,dark-veil,light-pillar,silk,floating-lines,side-rays,light-rays,pixel-blast,color-bends,evil-eye,line-waves,radar,soft-aurora,aurora,plasma,plasma-wave,particles,gradient-blinds,grainient,grid-scan,beams,pixel-snow,lightning,prismatic-burst,galaxy,dither,faulty-terminal,ripple-grid,dot-field,dot-grid,threads,hyperspeed,iridescence,waves,grid-distortion,ballpit,orb,letter-glitch,grid-motion,shape-grid,liquid-chrome,balatro`,
  "React 组件": `specular-button,option-wheel,curved-input,line-sidebar,animated-list,scroll-stack,bubble-menu,magic-bento,circular-gallery,reflective-card,card-nav,stack,fluid-glass,pill-nav,tilted-card,masonry,glass-surface,dome-gallery,chroma-grid,folder,staggered-menu,model-viewer,lanyard,profile-card,dock,gooey-nav,pixel-card,carousel,spotlight-card,border-glow,flying-posters,card-swap,glass-icons,decay-card,flowing-menu,elastic-slider,counter,infinite-menu,stepper,bounce-cards`,
  "交互动效": `cursor-grid,animated-content,fade-content,electric-border,orbit-images,pixel-transition,glare-hover,antigravity,logo-loop,target-cursor,magic-rings,laser-flow,magnet-lines,ghost-cursor,gradual-blur,click-spark,magnet,strands,sticker-peel,pixel-trail,cubes,metallic-paint,noise,shape-blur,crosshair,image-trail,ribbons,splash-cursor,meta-balls,blob-cursor,star-border`,
  "文字动效": `split-text,blur-text,circular-text,text-type,shuffle,shiny-text,text-pressure,curved-loop,fuzzy-text,gradient-text,falling-text,text-cursor,decrypted-text,true-focus,scroll-float,scroll-reveal,ascii-text,scrambled-text,rotating-text,glitch-text,scroll-velocity,variable-proximity,count-up`
};

const styleKitMotionSlugs = `vocabulary,fade-in-up,scale-in,hover-lift,typewriter,skeleton-pulse,fade-in-down,slide-in-left,hover-glow,scroll-reveal,parallax-float,text-gradient-flow,spinner-dots,background-gradient-shift,stagger-children,blur-in,spotlight-card,magnetic-hover,bounce-in,slide-in-right,rotate-in,shake,flip-card,ripple-click,cursor-aura,cursor-trail,proximity-reveal,text-repulsion,image-distortion,parallax-layers,drag-physics,context-cursor,counter-roll,morph-shape,fade-out-down,zoom-in,marquee-scroll,shimmer,pulse,elastic-snap,border-trace,glitch-text,scale-out,slide-out-right,collapse,crossfade,slide-swap,morph-transition,text-reveal,underline-draw,progress-bar,elastic-scale,pulse-ring,text-scramble,tilt-3d,confetti-burst,scroll-page-turn,scroll-peel-away`.split(",");

export const motionLibrary = [
  ...Object.entries(reactGroups).flatMap(([family, csv]) => csv.split(",").map((slug) => ({
    id: `react-${family}-${slug}`, name: titleCase(slug), en: titleCase(slug), family, kind: "动效组件", source: "React Bits",
    sourceUrl: `https://reactbits.dev/${family === "动态背景" ? "backgrounds" : family === "React 组件" ? "components" : family === "文字动效" ? "text-animations" : "animations"}/${slug}`
  }))),
  ...styleKitMotionSlugs.map((slug) => ({
    id: `stylekit-motion-${slug}`, name: titleCase(slug), en: titleCase(slug), family: "动效配方", kind: "动效规范", source: "StyleKit",
    sourceUrl: `https://www.stylekit.top/zh/animations/${slug}`
  }))
];

const motionSiteNames = `3D Portfolio|Dreamcore Landing|3D Story|Aetheris Voyage|Urban Jungle|Scroll Landing Page|Prisma Creative Studio|Book Hero|Art Landing|Velorah|Pulse 3D|Web3 EOS Hero|3D Collectible Hero|Solar Energy Hero|Bloom|ASME|Reveal Hero|Future-State|VEX Ventures|Luxury Real Estate|OYLA|Retro-Futurist|Liquid Glass Agency|Innovation|Zenith Realty|Aethera Studio|Mythic Naturecore|EMBER.dsgn|Portfolio Cosmic|Neural Interface|Contact Cybernetic|Securify Data Security|Golden Portal|Bloom AI|FinFlow|AI Designer Portfolio|Space Voyage|Modern Agency|Impressive Hero|Nimbus Grid|Prosthetics Hero|Luxury Hero|Bio-Digital|Apex Pulse|AI Workflow Hero|Gateway Portal|Growth Marketing SaaS|Layered Depth|Cinematic Landing Page|Mindloop Landing|Cursor Follow|Synapse Dark Hero|Automation Machines|Immersive Ocean|Cyberpunk Reveal|Creative Studio|Sentinel AI|Neo Museum|Digital Epoch|Glassmorphism Agency|USD Halo|Orbis NFT|Nexora Automation|Power AI|Transform Data|Organic Odyssey|Weblex Dark Hero|Planet Orbit|Terra Geo Map|Digitwist AI Builder|Neuralyn|Dark Portfolio Hero|Stellar AI|Futuristic Cinematic|Cybersecurity Hero|Framelix 3D Studios|Obsidian Hero|Audio Showcase|Portal|Wellbeing OS|Celestial Renewal|Duolingo Styleguide|Fun 404 Page|AI Image Generator UI`.split("|");

const auraDesignSlugs = `core-autonomous-cognitive-grids-2,nexus-interface,futuristic-fintech-hero,astral-ai-insights,nexus-analytics-dashboard,system-interface-7,aura-mobile-finance,real-time-monitoring-2,core-systems-landing-page-2,authentication-next-gen-architecture,pricing-plans-light-skeuomorphic,paperflow-design-layout,compliance-platform-5,neurosync-cognitive-ai-2,enterprise-data-orchestration-1,auralis-neural-audio-engine,mesh-operations-center,orbit-lunar-pulse,choose-your-reality,monolith-engine,aura-careers-mobile-flow,nexura-high-impact-creatives-2,capital-overview-dashboard,analytics-dashboard-remixed,global-system-dashboard,verified-commerce-login-section-2,auracore-spatial-visualization-system,nexus-advanced-data-analytics,wanderluxe-bespoke-travel-1,secure-network-innovators,digital-instrument-cluster-3,neurosync-master-your-mind,aether-spatial-intelligence-engine,aurora-gl-pure-fullscreen,aura-mesh-ecosystem,nexus-digital-studio,auralis-elite-wealth-command-1,aether-convergence-of-intelligence,process-orchestration-hero,creative-platform,nexus-digital-pioneers-3,lexicon-for-creators,zenith-x-core-systems,nexus-analytics-dashboard-2,system-calibration-framework,neptune-base-seamless-subsea-sync,omnistack-global-infrastructure,space-visual-ideation-workspace,quantum-architecture-features,peakpath,velocity-infrastructure-for-scale,vertex-optimize-quantum-data,voxaura-ai-voice-synthesizer,spatial-exploring-terminal,flowops-surgical-precision,aurora-digital-innovation-studio`.split(",");

export const referenceCases = [
  ...motionSiteNames.map((name, index) => ({ id: `motion-case-${index}`, name, en: name, family: /3D|Orbit|Spatial|Cosmic|Portal/.test(name) ? "3D / 空间" : /SaaS|AI|Data|Security|Fin/.test(name) ? "科技产品" : /Portfolio|Studio|Agency/.test(name) ? "作品集 / 机构" : "落地页", kind: "网站案例", source: "Motion Sites", sourceUrl: "https://motionsites.ai/" })),
  ...auraDesignSlugs.map((slug) => ({ id: `aura-case-${slug}`, name: titleCase(slug.replace(/-\d+$/, "")), en: titleCase(slug.replace(/-\d+$/, "")), family: /dashboard|analytics|monitoring|operations/.test(slug) ? "数据界面" : /mobile|login|pricing/.test(slug) ? "产品页面" : /spatial|quantum|neural|system|interface/.test(slug) ? "未来系统" : "设计系统", kind: "设计案例", source: "Aura", sourceUrl: `https://www.aura.build/design-systems/${slug}` }))
];

const TERM_DEFINITIONS = {
  "Menu Bar": "位于应用或系统顶部、集中承载全局命令与菜单层级的操作区域",
  "Context Menu": "在对象或区域上通过右键或长按出现、只提供当前上下文相关命令的菜单",
  "Disclosure Triangle": "用旋转三角形表示层级内容展开与收起状态的控制",
  "Dock Badge": "附着在 Dock 应用图标上、用数字或标记表达未读与待处理状态的徽标",
  "Focus Ring": "围绕当前键盘焦点元素显示、帮助用户定位操作位置的可视轮廓",
  "Inspector": "在不离开当前对象的情况下查看和修改其属性的持续性面板",
  "Insertion Caret": "在可编辑文本中指示下一次字符输入位置的闪烁光标",
  "Menu Bar Extra": "常驻系统菜单栏、提供应用状态和高频快捷操作的小型入口",
  "Panel": "承载辅助工具、属性或短流程且不取代主窗口的次级表面",
  "Popover": "从触发器附近浮出、用于短内容或少量操作并保留上下文的临时表面",
  "Popup Pulldown Combo": "在有限空间中从候选项选择单值或组合输入的选择控件家族",
  "Segmented Control": "把少量互斥选项并排呈现、在同一视图中快速切换状态的控制",
  "Sheet": "依附父窗口出现、要求先完成或取消当前任务的模态表面",
  "Sidebar": "沿窗口边缘持续展示导航、来源或层级结构的辅助栏",
  "Stepper": "通过加减按钮以固定步长调整数值的紧凑输入控件",
  "Toolbar": "集中放置当前窗口或文档高频命令的操作条",
  "Traffic Lights": "macOS 窗口左上角用于关闭、最小化和缩放窗口的三色控制",
  "Vibrancy": "让前景表面吸收并模糊后方内容色彩、用于表达层级和环境关联的材质",
  "Window": "承载独立任务或文档、可移动缩放并参与系统窗口管理的顶层容器",
  "Split View": "在同一窗口中并排展示两个可调整区域的布局模式",
  "Scroll View": "在固定视口内允许内容沿一个或两个方向滚动的容器",
  "Search Field": "接收查询并即时过滤或提交搜索结果的专用文本输入",
  "Save Panel": "让用户选择名称、格式与保存位置的系统文件保存界面",
  "Token Field": "把多个离散值显示为可单独选择、删除和编辑的令牌输入",
  "Combo Button": "把主要操作与相关备选菜单合并在同一控件中的复合按钮",
  "Level Indicator": "用连续或分段刻度显示容量、强度、评级或范围位置的指示器",
  "Column View": "通过相邻列逐级浏览层级数据、同时保留父级路径的视图",
  "Outline View": "用可展开树状行呈现父子层级和嵌套项目的列表",
  "Pointer": "根据目标与操作语义改变形态、提示可点击、拖动、缩放或输入的指针",
  "Alert": "在任务继续前传达重要结果、风险或需要确认决定的模态提示",
  "Slider": "在连续范围内通过拖动滑块选择近似数值的输入控件",
  "Color Well": "显示当前颜色并打开取色器或颜色面板的颜色选择入口",
  "Three Dots": "用省略号表示还有未展示操作或溢出内容的紧凑入口",
  "Drag And Drop": "通过直接抓取、移动和释放对象完成排序、上传或跨区域移动的交互",
  "Divider": "用线、间距或对比变化区分相邻内容组的视觉分隔",
  "Progress Indicators": "用确定或不确定进度反馈任务正在执行及完成程度的状态组件",
  "Toast": "短暂出现且通常不阻塞操作、用于确认结果或提示轻量错误的消息",
  "Dialog Drawer Sheet": "覆盖或推入当前界面、承载需要集中注意力的短流程与详情的容器家族",
  "Popover Dropdown Tooltip": "锚定触发器显示补充内容、候选操作或简短解释的轻量浮层家族",
  "Scrim": "覆盖在背景内容上、降低其视觉权重并表达前景模态层级的半透明遮罩",
  "Skeleton Spinner": "在等待内容或任务完成时分别用结构占位或循环指示表达加载状态",
  "Combobox": "把文本输入与候选列表结合、支持搜索和选择的复合表单控件",
  "Command Palette": "通过键盘优先的搜索界面快速查找并执行跨页面命令的覆盖层",
  "Accordion": "在有限空间内逐项展开或折叠分组内容的垂直结构",
  "Tabs": "在共享内容区域中切换少量同级视图的导航控件",
  "Badge Chip Pill": "用紧凑标签形态表达数量、状态、属性、筛选条件或可删除令牌的组件家族",
  "Breadcrumbs": "展示当前位置在层级结构中的路径并允许返回上级的辅助导航",
  "Sticky Fixed": "让关键控制随滚动保持在视口或容器边界附近的定位模式",
  "Focus Ring Web": "在 Web 界面中清楚显示键盘焦点位置的可访问性轮廓",
  "Empty State": "当列表或页面没有数据时解释原因并引导下一步的内容状态",
  "Hover Card": "悬停或聚焦目标时显示较丰富预览信息、离开后关闭的浮层卡片",
  "Switch Checkbox Radio": "分别表达即时开关、多选和单选语义的选择控件家族",
  "Toggle Group": "把多个可切换选项组织成单选或多选集合的紧凑控制",
  "Form Field": "由标签、输入、帮助信息、校验和错误反馈组成的完整数据输入单元",
  "Truncation": "在空间不足时有规则地省略文本并提供查看完整内容路径的处理方式",
  "Hamburger Menu": "在窄屏中收纳主要导航并通过菜单图标打开的折叠导航模式",
  "Lightbox": "在遮罩上集中预览图片或媒体、支持关闭与前后切换的覆盖层",
  "Marquee": "让连续内容在受限轨道中滚动或循环展示的运动容器",
  "Bento Grid": "用不同跨度的矩形模块组织异质内容并建立视觉节奏的网格布局",
  "Masonry": "保持列宽一致、按内容高度紧密堆叠卡片的瀑布流布局",
  "Easing": "定义动画随时间加速和减速方式、决定运动性格的时间函数",
  "Spring": "用质量、刚度和阻尼模拟物理回弹与跟随的动画模型",
  "Text Scramble": "在字符短暂替换或重排后收敛到目标文本的揭示动效",
  "Carousel": "在有限视口中横向切换一组同类内容并显示当前位置的组件",
  "Header Navbar": "位于页面顶部、承担品牌、主导航和全局操作的结构区域",
  "Card": "把一个主题的信息与操作组合成可扫描独立单元的内容容器",
  "Resize Handle": "提供明确拖动抓手、允许用户调整区域或对象尺寸的控制"
};

const catalogBlueprint = (item) => {
  if (item.kind === "UI 术语") {
    const definition = TERM_DEFINITIONS[item.en] || `用于表达${item.family}中特定任务、状态或控制关系的标准界面模式`;
    return {
      summary: `${item.name}（${item.en}）是${definition}。`,
      useCases: [`需要清楚表达${item.family}关系时`, "同类操作需要保持一致命名与位置时", "需要同时兼顾鼠标、键盘和触控输入时"],
      rules: ["先定义触发器、内容区与退出路径，再处理视觉样式", "覆盖默认、悬停、按下、焦点、禁用、加载、错误与空状态", "保持组件名称、行为和视觉反馈一致，避免同形不同义"],
      implementation: `以语义化 HTML 构建 ${item.en}，交互状态由单一状态源驱动；图标按钮提供 aria-label，动态变化使用适当的 aria-live 或状态文本。`,
      avoid: "不要只画静态默认态，也不要用颜色作为唯一状态信号。移动端需要检查触控目标、遮挡和返回行为。",
      prompt: `设计一个 ${item.name}（${item.en}）组件。明确触发器、内容结构、默认/悬停/按下/焦点/禁用/加载/错误状态，支持键盘导航与触控，提供清晰的退出路径和无障碍语义；保持信息层级紧凑，不添加与任务无关的装饰。`
    };
  }

  if (item.kind === "动效组件" || item.kind === "动效规范") {
    return {
      summary: `${item.name} 是一类${item.family}表现手法，价值在于解释状态变化、空间关系或操作结果，而不是单纯制造视觉热闹。`,
      useCases: ["需要让状态切换更连续时", "需要提示元素来源、去向或层级关系时", "短暂反馈不能打断当前任务时"],
      rules: ["用户输入先得到即时反馈，动画不得阻塞下一次输入", "优先使用 transform 与 opacity，并允许从当前屏幕状态反向", "定义进入、稳定、退出三段状态以及 reduced-motion 替代"],
      implementation: `建议以 160–240ms 为基础区间，使用 cubic-bezier(.22,1,.36,1)；循环效果在页面隐藏时暂停，reduced-motion 下改为静态状态或极短淡入。`,
      avoid: "不要用 setTimeout 串联不可中断的队列，不动画大范围布局属性，不让弹簧和视差影响阅读或点击。",
      prompt: `为界面加入 ${item.name}（${item.en}）动效。先说明它传达的状态或空间关系；使用 transform/opacity，160–240ms，可在任意时刻反向或中断；输入立即响应；为 prefers-reduced-motion 提供静态或极短淡入方案，并在页面不可见时停止循环。`
    };
  }

  if (item.kind === "网站案例" || item.kind === "设计案例") {
    return {
      summary: `${item.name} 可作为${item.family}方向的构图研究样本。应提取它的层级、节奏、叙事顺序和交互原则，而不是复制品牌资产或页面外观。`,
      useCases: [`规划${item.family}项目的首屏与内容节奏时`, "建立情绪板并需要可解释的参考维度时", "比较沉浸感与可用性成本时"],
      rules: ["拆解首屏承诺、证据、功能、案例与行动按钮的阅读顺序", "记录字体比例、网格、留白、表面层级与信号色职责", "把动态效果对应到具体信息或操作，不照搬装饰"],
      implementation: "先用低保真内容骨架复现信息顺序，再建立原创令牌与组件；逐项验证首屏性能、滚动稳定、文字对比度和移动端降级。",
      avoid: "不要复制对方的商标、插图、独特构图、文案或源码。参考方向不能凌驾于自己产品的任务效率。",
      prompt: `参考 ${item.name} 的${item.family}方法，为自己的内容创建原创方案。保留可迁移的层级、网格、节奏与交互原则，重新设计品牌、文案、素材和构图；输出桌面与移动布局、组件状态、动效降级、性能预算和验收清单。`
    };
  }

  const familyFocus = {
    "布局结构": "网格、阅读路径与信息密度",
    "数字未来": "深色层级、技术感信号与克制的动态反馈",
    "暗色复古": "年代感排版、纹理与现代可读性的平衡",
    "艺术文化": "历史视觉语法与数字产品可用性的转换",
    "地域美学": "文化特征、材料感与避免符号化挪用",
    "品牌商业": "可信度、转化路径与品牌一致性",
    "基础体系": "颜色、字体、间距、表面和组件状态"
  }[item.family] || "视觉层级、排版、间距与组件一致性";

  return {
    summary: `${item.name}（${item.en}）是一种围绕${familyFocus}建立的界面方向。它应该成为一套可执行的规则，而不只是几张相似风格的图片。`,
    useCases: [`产品需要强化${item.family}气质时`, "现有信息架构稳定、需要统一视觉语言时", "能够为特殊材质和动效提供清晰降级时"],
    rules: [`先用${familyFocus}建立主层级，再添加装饰`, "限制主色、表面层和圆角数量，让组件保持同一语法", "同一内容至少验证桌面、窄屏、键盘与高对比模式"],
    implementation: `建立 canvas/surface/text/muted/border/accent 等语义令牌；用 4 或 8px 间距节奏组织布局，正文保持可读行长，交互状态使用统一组件变量。`,
    avoid: `不要把“${item.name}”简化成一个滤镜或背景特效；避免牺牲文字对比度、触控目标和任务效率。`,
    prompt: `创建一个 ${item.name}（${item.en}）界面系统，重点处理${familyFocus}。输出语义色令牌、字体比例、网格与间距、表面层级、按钮/输入/卡片/导航的完整状态、移动端适配、reduced-motion 与高对比替代；保持原创，不复制任何现有品牌或站点。`
  };
};

export const fullCatalog = [...styleIndex, ...uiTermIndex, ...motionLibrary, ...referenceCases]
  .map((item) => ({ ...item, ...catalogBlueprint(item) }));

export const catalogStats = {
  styles: styleIndex.length,
  terms: uiTermIndex.length,
  motion: motionLibrary.length,
  cases: referenceCases.length,
  total: fullCatalog.length
};
