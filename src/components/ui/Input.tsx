import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          ref={ref}
          className={`
            w-full px-4 py-3
            border-2 rounded-lg
            bg-white
            font-semibold text-gray-700
            placeholder:text-gray-400 placeholder:font-normal
            focus:outline-none focus:border-primary
            transition-colors duration-200
            ${error ? "border-error" : "border-gray-300 hover:border-gray-400"}
            ${className}
          `}
          {...props}
        />
        {error && <p className="mt-2 text-sm text-error font-medium">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
