import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cupid: {
          pink: "#FF6B9D",
          hotPink: "#FF69B4",
          pinkLight: "#FFB8D0",
          pinkSoft: "#FFE5EE",
          pinkDark: "#E84D7A",
          white: "#FFFFFF",
          cream: "#FFF8FA",
          gray: "#8E8E93",
          grayLight: "#F2F2F7",
        },
      },
      fontFamily: {
        sans: ["var(--font-pretendard)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
