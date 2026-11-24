import type { Config } from "tailwindcss";
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: { extend: {
    colors: { navy: "#102A43", deep: "#071C2C", brand: "#2563EB", teal: "#14B8A6", ink: "#172B4D", muted: "#697586", line: "#E5EAF1", soft: "#F6F8FC", tint: "#EAF2FF" },
    fontFamily: { sans: ["Inter", "system-ui", "sans-serif"], display: ["Manrope", "Inter", "sans-serif"] },
  } },
  plugins: [],
} satisfies Config;
