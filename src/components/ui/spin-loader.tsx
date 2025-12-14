import { cn } from "@/lib/utils";

interface SpinLoaderProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function SpinLoader({ className, size = "md" }: SpinLoaderProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <div
      className={cn(
        "animate-spin-loader rounded-full border-2 border-current border-t-transparent",
        sizeClasses[size],
        className
      )}
    />
  );
}
