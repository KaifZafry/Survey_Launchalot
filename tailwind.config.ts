// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}", 
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#1c2d59",
          hover: "#f27b21",
        },
      },
      fontFamily: {
        georgia: ["Georgia", "serif"],
      },
      boxShadow: {
        soft: "0 2px 10px rgba(0,0,0,0.06)",
      },
      
      animation: {
        "spin-slow": "spin 18s linear infinite",
      },
      
      borderRadius: {
        "2xl": "1rem",
      },
    },
  },
 
  plugins: [],
};

export default config;
