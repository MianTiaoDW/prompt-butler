import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, ChevronDown, Copy, Heart, Image, PencilLine, Sparkles, X } from "lucide-react";

import type { PromptLinkedImage, PromptOutputFormat, SavedPromptRecord } from "../types/prompt";
import { useModalFocus } from "../hooks/useModalFocus";
import { MOTION } from "../lib/motion";

interface PromptPreviewModalProps {
  record: SavedPromptRecord | null;
  isCopied: boolean;
  isFavorite: boolean;
  onClose: () => void;
  onCopy: () => void;
  onSave: (content: string) => void;
  onToggleFavorite: () => void;
  onUsePrompt?: () => void;
  onOptimize?: () => void;
  sourceLabel?: string;
  showLibraryActions?: boolean;
  allowEditing?: boolean;
}

const sectionLabels: Record<PromptOutputFormat, string> = {
  cnPrompt: "中文提示词",
  enPrompt: "English Prompt",
  structuredPrompt: "高级结构 JSON"
};

function formatCaseDate(value: string) {
  const date = new Date(value);
  const today = new Date();
  const dayDiff = Math.floor((new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() - new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()) / 86400000);
  if (dayDiff === 0) return "今天";
  if (dayDiff === 1) return "昨天";
  return date.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" });
}

export function PromptPreviewModal({
  record,
  isCopied,
  isFavorite,
  onClose,
  onCopy,
  onSave,
  onToggleFavorite,
  onUsePrompt,
  onOptimize,
  sourceLabel,
  showLibraryActions = true,
  allowEditing = true
}: PromptPreviewModalProps) {
  const [expandedSections, setExpandedSections] = useState<PromptOutputFormat[]>(["cnPrompt"]);
  const [isEditing, setIsEditing] = useState(false);
  const [draftContent, setDraftContent] = useState("");
  const [previewLinkedImage, setPreviewLinkedImage] = useState<PromptLinkedImage | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const dialogRef = useModalFocus<HTMLElement>(Boolean(record), onClose);
  const imageDialogRef = useModalFocus<HTMLDivElement>(Boolean(previewLinkedImage), () => setPreviewLinkedImage(null));
  const linkedImages = record?.linkedImages?.filter((item): item is PromptLinkedImage => typeof item !== "string" && Boolean(item.imageUrl)) ?? [];

  useEffect(() => {
    if (!record) return;
    setDraftContent(record.content);
    setIsEditing(false);
    setPreviewLinkedImage(null);
    setExpandedSections(["cnPrompt"]);
  }, [record]);

  const toggleSection = (format: PromptOutputFormat) => {
    setExpandedSections((current) =>
      current.includes(format)
        ? current.filter((item) => item !== format)
        : [...current, format]
    );
  };

  return (
    <AnimatePresence>
      {record ? (
        <motion.div
          className="prompt-preview-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: shouldReduceMotion ? 0.12 : MOTION.modalMs / 1000 }}
          onMouseDown={onClose}
        >
          <motion.section
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="prompt-preview-title"
            tabIndex={-1}
            className="prompt-preview-modal"
            initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.96, y: shouldReduceMotion ? 0 : 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.96, y: shouldReduceMotion ? 0 : 6 }}
            transition={{ duration: shouldReduceMotion ? 0.12 : MOTION.modalMs / 1000, ease: MOTION.easeOut }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="prompt-preview-header">
              <div className="min-w-0 flex-1">
                <h2 id="prompt-preview-title">{record.title || record.content.slice(0, 32)}</h2>
                <div className="prompt-asset-tags">
                  {record.tags.slice(0, 4).map((tag) => <span key={tag}>{tag}</span>)}
                </div>
                <div className="prompt-preview-meta">
                  <span>{record.category.split("/").slice(-1)[0]}</span>
                  <span>使用 {record.usageCount ?? record.usedCount ?? 0} 次</span>
                  <span>{record.lastUsed ?? record.lastUsedAt ? `最近使用 ${new Date(record.lastUsed ?? record.lastUsedAt ?? "").toLocaleDateString("zh-CN")}` : "尚未使用"}</span>
                  <span>v{record.version ?? "1.0"}</span>
                </div>
                <p className="prompt-preview-source">来源：{sourceLabel ?? (record.source === "ai-generated" ? "AI 生成" : record.source === "system-template" || record.id.startsWith("seed-") ? "系统模板" : "用户创建")}</p>
              </div>
              {showLibraryActions ? <button type="button" className={`prompt-preview-favorite ${isFavorite ? "is-favorite" : ""}`} onClick={onToggleFavorite} aria-label={isFavorite ? "取消收藏" : "收藏"}><Heart className="h-4 w-4" fill={isFavorite ? "currentColor" : "none"} /></button> : null}
              <button type="button" onClick={onClose} aria-label="关闭预览"><X className="h-4 w-4" /></button>
            </header>

            <div className="prompt-preview-content">
              {(["cnPrompt", "enPrompt", "structuredPrompt"] as PromptOutputFormat[]).map((format) => {
                const sectionContent = record.contentVariants?.[format] ?? (record.format === format ? record.content : "");
                const hasContent = Boolean(sectionContent);
                const isExpanded = expandedSections.includes(format);
                return (
                  <section key={format} className="prompt-preview-section">
                    <button type="button" onClick={() => toggleSection(format)} aria-expanded={isExpanded}>
                      <span>{sectionLabels[format]}</span>
                      <ChevronDown className={`h-4 w-4 ${isExpanded ? "rotate-180" : ""}`} />
                    </button>
                    <AnimatePresence initial={false}>
                      {isExpanded ? (
                        <motion.div
                          className="prompt-preview-collapsible"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: shouldReduceMotion ? 0 : MOTION.fastMs / 1000, ease: MOTION.easeOut }}
                        >
                          {hasContent ? isEditing ? (
                            <textarea value={draftContent} onChange={(event) => setDraftContent(event.target.value)} className="form-field prompt-preview-editor" />
                          ) : (
                            <pre>{sectionContent}</pre>
                          ) : (
                            <p>该资产暂未包含{sectionLabels[format]}版本。</p>
                          )}
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </section>
                );
              })}
              <section className="prompt-preview-cases">
                <div className="prompt-preview-cases-heading"><span>生成案例</span><small>{linkedImages.length}</small></div>
                {linkedImages.length > 0 ? (
                  <div className="prompt-case-masonry">
                    {linkedImages.map((image, index) => (
                      <button key={image.imageId ?? `${image.imageUrl}-${index}`} type="button" onClick={() => setPreviewLinkedImage(image)}>
                        <img src={image.imageUrl} alt={`${record.title || "Prompt"} 生成案例`} loading="lazy" decoding="async" />
                        <span><strong>{image.model}</strong><small>{image.ratio} · {formatCaseDate(image.createdAt)}</small></span>
                      </button>
                    ))}
                  </div>
                ) : <p>这个 Prompt 还没有关联生成案例。</p>}
              </section>
            </div>

            <footer className="prompt-preview-actions">
              <button type="button" onClick={onCopy}>{isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{isCopied ? "已复制" : "一键复制 Prompt"}</button>
              {allowEditing ? isEditing ? (
                <button type="button" onClick={() => { onSave(draftContent); setIsEditing(false); }}><Check className="h-4 w-4" />保存编辑</button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setExpandedSections((current) => current.includes(record.format) ? current : [...current, record.format]);
                    setIsEditing(true);
                  }}
                >
                  <PencilLine className="h-4 w-4" />编辑
                </button>
              ) : null}
              {onUsePrompt ? <button type="button" className="prompt-preview-primary" onClick={onUsePrompt}><Image className="h-4 w-4" />发送到图像工坊</button> : null}
              {onOptimize ? <button type="button" className="prompt-preview-primary" onClick={onOptimize}><Sparkles className="h-4 w-4" />AI 优化 Prompt</button> : null}
            </footer>
          </motion.section>
          {previewLinkedImage ? (
            <div ref={imageDialogRef} role="dialog" aria-modal="true" aria-label="生成案例大图预览" tabIndex={-1} className="prompt-case-preview" onMouseDown={(event) => { event.stopPropagation(); setPreviewLinkedImage(null); }}>
              <img src={previewLinkedImage.imageUrl} alt="生成案例大图预览" />
              <div><strong>{previewLinkedImage.model}</strong><span>{previewLinkedImage.ratio} · {previewLinkedImage.resolution} · {formatCaseDate(previewLinkedImage.createdAt)}</span></div>
            </div>
          ) : null}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
