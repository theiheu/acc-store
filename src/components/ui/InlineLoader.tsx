import LoadingSpinner from "./LoadingSpinner";

interface InlineLoaderProps {
  text?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function InlineLoader({ 
  text = "Đang tải...", 
  size = "sm",
  className = "" 
}: InlineLoaderProps) {
  return (
    <div className={`flex items-center gap-2 text-gray-600 dark:text-gray-400 ${className}`}>
      <LoadingSpinner size={size} />
      <span className="text-sm">{text}</span>
    </div>
  );
}
