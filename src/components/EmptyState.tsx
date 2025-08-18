"use client";

import Link from "next/link";
import { ReactNode } from "react";

interface Action {
  label: string;
  onClick?: () => void;
  href?: string;
}

interface EmptyStateProps {
  icon?: ReactNode | string;
  title: string;
  description?: string;
  primaryAction?: Action;
  secondaryAction?: Action;
}

export default function EmptyState({
  icon = "📦",
  title,
  description,
  primaryAction,
  secondaryAction,
}: EmptyStateProps) {
  const renderAction = (action?: Action, variant: "primary" | "secondary" = "primary") => {
    if (!action) return null;
    const className =
      variant === "primary"
        ? "inline-flex items-center gap-2 px-4 py-2 text-sm bg-amber-300 text-gray-900 hover:bg-amber-400 rounded-lg transition-colors"
        : "inline-flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors";

    if (action.href) {
      return (
        <Link href={action.href} className={className}>
          {action.label}
        </Link>
      );
    }
    return (
      <button type="button" onClick={action.onClick} className={className}>
        {action.label}
      </button>
    );
  };

  return (
    <div className="w-full py-16 px-4 flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-gray-200 dark:border-gray-800 bg-white/30 dark:bg-gray-900/30">
      <div className="text-6xl mb-4" aria-hidden>
        {typeof icon === "string" ? <span>{icon}</span> : icon}
      </div>
      <h2 className="text-lg font-semibold mb-1">{title}</h2>
      {description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mb-4">{description}</p>
      )}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {renderAction(primaryAction, "primary")}
        {renderAction(secondaryAction, "secondary")}
      </div>
    </div>
  );
}

