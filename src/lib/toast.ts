type ToastListener = (message: string) => void;

let listener: ToastListener | null = null;

export function subscribeToast(fn: ToastListener) {
  listener = fn;
  return () => {
    listener = null;
  };
}

export function showToast(message: string) {
  listener?.(message);
}
