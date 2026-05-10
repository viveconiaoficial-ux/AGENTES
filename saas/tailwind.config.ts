import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{ts,tsx,js,jsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#09090b",
          deep: "#050507",
          panel: "#0e0e12",
        },
        accent: "#7c9cff",
      },
      fontFamily: {
        sans: [
          "Inter",
          "SF Pro Display",
          "Geist",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      boxShadow: {
        elev: "0 20px 60px -20px rgba(0,0,0,0.7), 0 8px 24px -10px rgba(0,0,0,0.6)",
      },
    },
  },
  plugins: [],
};

export default config;
