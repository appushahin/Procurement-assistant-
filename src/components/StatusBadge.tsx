import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, ShieldAlert, ShieldCheck } from "lucide-react";

export type StatusType = "low" | "review" | "high" | "pass" | "warning" | "fail";

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = "sm",
  showIcon = true,
  className = "",
}) => {
  // Normalize status to one of three canonical states
  const isLow = status === "low" || status === "pass";
  const isReview = status === "review" || status === "warning";
  const isHigh = status === "high" || status === "fail";

  const defaultLabel = isLow
    ? "Low Risk"
    : isReview
    ? "Needs Review"
    : "High Risk";

  const displayLabel = label || defaultLabel;

  // Size styling
  const sizeClasses = {
    sm: "px-2.5 py-1 text-[11px] gap-1.2 font-mono",
    md: "px-3 py-1.5 text-xs gap-1.5 font-mono",
    lg: "px-4 py-2 text-sm gap-2 font-mono",
  }[size];

  const iconSize = size === "sm" ? 13 : size === "md" ? 15 : 17;

  // Color & Border mapping - Green (Low Risk), Amber (Needs Review), Red (High Risk)
  let colorClasses = "";
  let IconComponent = CheckCircle2;

  if (isLow) {
    colorClasses = "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-emerald-950/20";
    IconComponent = ShieldCheck;
  } else if (isReview) {
    colorClasses = "bg-amber-500/15 text-amber-300 border-amber-500/30 shadow-amber-950/20";
    IconComponent = AlertTriangle;
  } else {
    colorClasses = "bg-red-500/15 text-red-400 border-red-500/30 shadow-red-950/20";
    IconComponent = ShieldAlert;
  }

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-lg border shadow-sm transition-all whitespace-nowrap ${sizeClasses} ${colorClasses} ${className}`}
    >
      {showIcon && <IconComponent size={iconSize} className="shrink-0" />}
      <span>{displayLabel}</span>
    </span>
  );
};

// Reusable Shared Risk/Status Legend component for panels
export const RiskStatusLegend: React.FC<{ title?: string }> = ({ title = "Standardized Risk & Governance Legend" }) => {
  return (
    <div className="bg-zinc-950/80 p-3 rounded-xl border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
      <div className="text-zinc-400 font-semibold flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
        <span>{title}:</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status="low" label="Low Risk (Pass / Approved)" size="sm" />
        <StatusBadge status="review" label="Needs Review (Warning / Gap)" size="sm" />
        <StatusBadge status="high" label="High Risk (Non-Compliant / Blocked)" size="sm" />
      </div>
    </div>
  );
};
