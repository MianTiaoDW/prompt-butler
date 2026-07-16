import type { Config } from "tailwindcss";

export default {
  content: ["./options.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "var(--bg-canvas)",
        app: "var(--bg-app)",
        interactive: "var(--bg-interactive)",
        input: "var(--bg-input-core)",
        surface: {
          1: "var(--bg-surface-1)",
          2: "var(--bg-surface-2)",
          3: "var(--bg-surface-3)",
          elevated: "var(--bg-elevated)"
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          tertiary: "var(--text-tertiary)",
          disabled: "var(--text-disabled)"
        },
        border: {
          subtle: "var(--border-subtle)",
          DEFAULT: "var(--border-default)",
          strong: "var(--border-strong)"
        },
        panel: {
          900: "var(--bg-surface-1)",
          800: "var(--bg-surface-2)",
          700: "var(--bg-surface-3)"
        },
        accent: {
          DEFAULT: "var(--accent-primary)",
          hover: "var(--accent-hover)",
          pressed: "var(--accent-pressed)",
          soft: "var(--accent-soft)",
          border: "var(--accent-border)"
        },
        status: {
          online: "var(--status-online)"
        }
      },
      boxShadow: {
        glass: "var(--shadow-panel)"
      },
      borderRadius: {
        sm: "var(--radius-small)",
        md: "var(--radius-medium)",
        lg: "var(--radius-large)",
        xl: "var(--radius-xlarge)",
        pill: "var(--radius-pill)"
      }
    }
  },
  plugins: []
} satisfies Config;
