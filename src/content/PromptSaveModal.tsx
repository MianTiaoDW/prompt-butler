import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";

import { useModalFocus } from "../hooks/useModalFocus";
import { MOTION } from "../lib/motion";

const PROMPT_CATEGORIES = ["角色设计", "产品精修", "品牌设计", "视频生成", "其他"];

export interface PromptSaveValues {
  title: string;
  category: string;
  tags: string[];
}

export function PromptSaveModal(props: {
  open: boolean;
  defaultTitle: string;
  onClose: () => void;
  onSave: (values: PromptSaveValues) => void;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(PROMPT_CATEGORIES[1]);
  const [tags, setTags] = useState("");
  const shouldReduceMotion = useReducedMotion();
  const dialogRef = useModalFocus<HTMLElement>(props.open, props.onClose);

  useEffect(() => {
    if (!props.open) return;
    setTitle(props.defaultTitle);
    setCategory(PROMPT_CATEGORIES[1]);
    setTags("");
  }, [props.defaultTitle, props.open]);

  return (
    <AnimatePresence>
      {props.open ? (
    <motion.div className="prompt-save-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: shouldReduceMotion ? 0.12 : MOTION.modalMs / 1000 }} onMouseDown={props.onClose}>
      <motion.section ref={dialogRef} tabIndex={-1} className="prompt-save-modal" role="dialog" aria-modal="true" aria-labelledby="prompt-save-title" initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.96, y: shouldReduceMotion ? 0 : 6 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.96, y: shouldReduceMotion ? 0 : 6 }} transition={{ duration: shouldReduceMotion ? 0.12 : MOTION.modalMs / 1000, ease: MOTION.easeOut }} onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <h2 id="prompt-save-title">保存提示词</h2>
          <button type="button" onClick={props.onClose} aria-label="关闭"><X className="h-4 w-4" /></button>
        </header>
        <div className="prompt-save-fields">
          <label>Prompt 名称<input className="form-field" value={title} onChange={(event) => setTitle(event.target.value)} autoFocus /></label>
          <label>分类<select className="form-field" value={category} onChange={(event) => setCategory(event.target.value)}>{PROMPT_CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>标签<input className="form-field" value={tags} onChange={(event) => setTags(event.target.value)} placeholder="3D、C4D、商业海报" /></label>
        </div>
        <footer>
          <button type="button" className="ghost-button" onClick={props.onClose}>取消</button>
          <button type="button" className="gradient-button" disabled={!title.trim()} onClick={() => props.onSave({ title: title.trim(), category, tags: tags.split(/[，,]/).map((tag) => tag.trim()).filter(Boolean) })}>保存</button>
        </footer>
      </motion.section>
    </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
