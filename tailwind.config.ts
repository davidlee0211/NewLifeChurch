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
        // 구글 컬러 팔레트
        google: {
          red: "#EA4335",
          yellow: "#FBBC05",
          green: "#34A853",
          blue: "#4285F4",
        },
        // Primary는 파란색 (메인 액션)
        primary: {
          DEFAULT: "#4285F4",
          light: "#5A95F5",
          dark: "#3367D6",
        },
        // 배경
        background: {
          DEFAULT: "#FFFFFF",
          alt: "#F8F9FA",
        },
        // 상태 색상
        success: "#34A853",
        warning: "#FBBC05",
        error: "#EA4335",
      },
      borderRadius: {
        'none': '0',
        'sm': '4px',
        'DEFAULT': '8px',
        'lg': '12px',
        'xl': '16px',
      },
      boxShadow: {
        // 로블록스 스타일 3D 그림자
        'roblox': '0 4px 0 0 rgba(0, 0, 0, 0.2)',
        'roblox-lg': '0 6px 0 0 rgba(0, 0, 0, 0.2)',
        'roblox-pressed': '0 2px 0 0 rgba(0, 0, 0, 0.2)',
        'block': '4px 4px 0 0 rgba(0, 0, 0, 0.1)',
      },
      fontFamily: {
        'game': ['Nunito', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
