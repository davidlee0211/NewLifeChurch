import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "red" | "yellow" | "green" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", children, ...props }, ref) => {
    // 로블록스 스타일 베이스
    const baseStyles = `
      font-bold rounded-lg transition-all duration-100
      focus:outline-none focus:ring-2 focus:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
      shadow-roblox hover:brightness-110
      active:shadow-roblox-pressed active:translate-y-1
    `;

    const variants = {
      primary: "bg-primary text-white border-b-4 border-primary-dark focus:ring-primary",
      secondary: "bg-white text-gray-700 border-2 border-gray-300 border-b-4 focus:ring-gray-400",
      red: "bg-google-red text-white border-b-4 border-red-700 focus:ring-red-400",
      yellow: "bg-google-yellow text-gray-800 border-b-4 border-yellow-600 focus:ring-yellow-400",
      green: "bg-google-green text-white border-b-4 border-green-700 focus:ring-green-400",
      ghost: "bg-transparent text-gray-600 hover:bg-gray-100 border-none shadow-none focus:ring-gray-400",
    };

    const sizes = {
      sm: "px-4 py-2 text-sm",
      md: "px-5 py-2.5 text-base",
      lg: "px-8 py-3.5 text-lg",
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
