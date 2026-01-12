import { HTMLAttributes, forwardRef } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "bordered" | "blue" | "red" | "yellow" | "green";
  hover?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = "", variant = "default", hover = false, children, ...props }, ref) => {
    // 로블록스 스타일 카드
    const variants = {
      default: "bg-white border-2 border-gray-200",
      bordered: "bg-white border-2 border-primary",
      blue: "bg-google-blue text-white border-b-4 border-blue-700",
      red: "bg-google-red text-white border-b-4 border-red-700",
      yellow: "bg-google-yellow text-gray-800 border-b-4 border-yellow-600",
      green: "bg-google-green text-white border-b-4 border-green-700",
    };

    const hoverStyles = hover ? "hover:border-primary hover:-translate-y-1 transition-all duration-200 cursor-pointer" : "";

    return (
      <div
        ref={ref}
        className={`rounded-xl p-6 shadow-block ${variants[variant]} ${hoverStyles} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = "", children, ...props }, ref) => {
    return (
      <div ref={ref} className={`mb-4 ${className}`} {...props}>
        {children}
      </div>
    );
  }
);

CardHeader.displayName = "CardHeader";

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className = "", children, ...props }, ref) => {
    return (
      <h3 ref={ref} className={`text-lg font-bold text-gray-800 ${className}`} {...props}>
        {children}
      </h3>
    );
  }
);

CardTitle.displayName = "CardTitle";

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = "", children, ...props }, ref) => {
    return (
      <div ref={ref} className={className} {...props}>
        {children}
      </div>
    );
  }
);

CardContent.displayName = "CardContent";
