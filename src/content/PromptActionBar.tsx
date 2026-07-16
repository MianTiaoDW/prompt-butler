import { Check, Copy, Image, Library, Zap } from "lucide-react";

interface PromptActionBarProps {
  copied?: boolean;
  saved?: boolean;
  frequent?: boolean;
  onCopy: () => void;
  onSave: () => void;
  onFrequent: () => void;
  onSendToImage: () => void;
}

export function PromptActionBar(props: PromptActionBarProps) {
  const actions = [
    { label: props.copied ? "已复制" : "复制", icon: props.copied ? Check : Copy, onClick: props.onCopy },
    { label: props.saved ? "已保存到提示词库" : "保存到提示词库", icon: Library, onClick: props.onSave, active: props.saved },
    { label: props.frequent ? "已加入常用" : "加入常用", icon: Zap, onClick: props.onFrequent, active: props.frequent },
    { label: "发送到图像工坊", icon: Image, onClick: props.onSendToImage }
  ];

  return (
    <div className="prompt-action-bar" aria-label="提示词操作">
      {actions.map((action) => (
        <button
          key={action.label}
          type="button"
          title={action.label}
          aria-label={action.label}
          className={action.active ? "is-active" : ""}
          onClick={action.onClick}
        >
          <action.icon className="h-4 w-4" fill={action.label.includes("常用") && action.active ? "currentColor" : "none"} />
        </button>
      ))}
    </div>
  );
}
