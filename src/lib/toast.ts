export interface ToastEvent {
  id: number;
  message: string;
  tone: "info" | "error";
}

type ToastListener = (event: ToastEvent) => void;

let listener: ToastListener | null = null;

export function subscribeToast(fn: ToastListener) {
  listener = fn;
  return () => {
    listener = null;
  };
}

export function showToast(message: string, tone: ToastEvent["tone"] = "info") {
  listener?.({ id: Date.now(), message, tone });
}
