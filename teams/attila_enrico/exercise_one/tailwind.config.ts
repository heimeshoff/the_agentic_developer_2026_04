import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#fafafa",
        surface: "#ffffff",
        text: "#111111",
        muted: "#6b7280",
        border: "#eeeeee",
        expense: "#c43a3a",
        income: "#2a8a5f",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
