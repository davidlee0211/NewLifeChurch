import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#F59E0B",
          light: "#FBBF24",
          dark: "#D97706",
        },
        accent: {
          DEFAULT: "#8B5CF6",
          light: "#A78BFA",
        },
        background: {
          DEFAULT: "#FFFBEB",
          alt: "#FEF3C7",
        },
        success: "#10B981",
        error: "#EF4444",
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        'soft': '0 4px 20px rgba(245, 158, 11, 0.15)',
        'soft-lg': '0 8px 30px rgba(245, 158, 11, 0.2)',
        'glow': '0 0 20px rgba(245, 158, 11, 0.3)',
      },
    },
  },
  plugins: [],
};
export default config;
