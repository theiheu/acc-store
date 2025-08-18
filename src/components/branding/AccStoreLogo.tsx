import React from "react";

interface AccStoreLogoProps {
  variant?: "horizontal" | "icon" | "square";
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  width?: number;
  height?: number;
}

const sizeClasses = {
  horizontal: {
    sm: "h-8 w-auto",
    md: "h-10 w-auto",
    lg: "h-12 w-auto",
    xl: "h-14 w-auto",
    "2xl": "h-18 w-auto",
  },
  icon: {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-10 w-10",
    "2xl": "h-12 w-12",
  },
  square: {
    sm: "h-12 w-12",
    md: "h-16 w-16",
    lg: "h-20 w-20",
    xl: "h-24 w-24",
    "2xl": "h-32 w-32",
  },
};

export default function AccStoreLogo({
  variant = "horizontal",
  size = "md",
  className,
  width,
  height,
}: AccStoreLogoProps) {
  const logoSrc =
    variant === "horizontal"
      ? "/branding/logo-horizontal.svg"
      : variant === "square"
      ? "/branding/logo-square.svg"
      : "/branding/logo-icon.svg";

  const defaultClassName = sizeClasses[variant][size];
  const finalClassName = className || defaultClassName;

  return (
    <img
      src={logoSrc}
      alt="ACC Store"
      className={finalClassName}
      width={width}
      height={height}
    />
  );
}
