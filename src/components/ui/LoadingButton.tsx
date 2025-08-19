import LoadingSpinner from "./LoadingSpinner";

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export default function LoadingButton({
  loading = false,
  loadingText,
  variant = "primary",
  size = "md",
  children,
  disabled,
  className = "",
  ...props
}: LoadingButtonProps) {
  const baseClasses = "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed";
  
  const variantClasses = {
    primary: "bg-amber-300 text-gray-900 hover:brightness-95",
    secondary: "bg-gray-900 text-white dark:bg-white dark:text-gray-900 hover:opacity-90",
    outline: "border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3 text-base"
  };

  const spinnerSize = size === "lg" ? "md" : "sm";

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {loading && (
        <LoadingSpinner 
          size={spinnerSize} 
          className="mr-2" 
        />
      )}
      {loading ? (loadingText || "Đang tải...") : children}
    </button>
  );
}
