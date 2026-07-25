export const MOTION = {
  pressMs: 120,
  fastMs: 160,
  pageMs: 190,
  modalMs: 220,
  toastEnterMs: 180,
  toastExitMs: 160,
  easeOutCss: "cubic-bezier(0.22, 1, 0.36, 1)",
  easeInOutCss: "cubic-bezier(0.77, 0, 0.175, 1)",
  easeOut: [0.22, 1, 0.36, 1] as const
} as const;
