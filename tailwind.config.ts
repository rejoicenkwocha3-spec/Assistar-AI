import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        forest: { DEFAULT: "#123D32", deep: "#082C25" },
        sage: "#A8BFA8",
        lime: "#C7DE72",
        cream: "#F7F5ED",
        surface: "#F5F7F3",
        ink: { DEFAULT: "#172C27", muted: "#718078" },
        line: "#E5EAE4",
        success: "#3E9B70",
      },
      fontFamily: {
        heading: ["var(--font-manrope)", "system-ui", "sans-serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: { card: "0 1px 2px rgba(18,61,50,0.04), 0 8px 24px rgba(18,61,50,0.06)" },
    },
  },
  plugins: [],
};
export default config;
