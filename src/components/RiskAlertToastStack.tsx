import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShieldAlert,
  AlertTriangle,
  Info,
  X,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Bell,
  CheckCircle2,
  SlidersHorizontal,
  Flame,
} from "lucide-react";
import { RiskAlertNotification } from "../types";

interface Props {
  alerts: RiskAlertNotification[];
  onDismiss: (id: string) => void;
  onDismissAll: () => void;
  onInspectVendor?: (vendorKey: string) => void;
}

export function RiskAlertToastStack({
  alerts,
  onDismiss,
  onDismissAll,
  onInspectVendor,
}: Props) {
  if (alerts.length === 0) return null;

  return (
    <div
      id="risk-alert-toast-stack"
      className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-w-md w-[calc(100vw-2rem)] sm:w-[420px] pointer-events-none"
      aria-live="assertive"
    >
      <div className="flex items-center justify-between px-1 pointer-events-auto">
        <div className="flex items-center gap-1.5 bg-zinc-950/90 border border-white/10 px-2.5 py-1 rounded-full text-[11px] font-mono text-zinc-300 backdrop-blur-md shadow-lg">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          <span className="font-semibold text-white">Risk Threshold Monitor</span>
          <span className="text-zinc-500">•</span>
          <span className="text-rose-400 font-bold">{alerts.length} Active {alerts.length === 1 ? "Alert" : "Alerts"}</span>
        </div>

        {alerts.length > 1 && (
          <button
            onClick={onDismissAll}
            className="text-[10px] font-mono text-zinc-400 hover:text-white bg-zinc-900/80 hover:bg-zinc-800 border border-white/10 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
          >
            Clear All
          </button>
        )}
      </div>

      <AnimatePresence mode="popLayout">
        {alerts.map((alert) => (
          <ToastCard
            key={alert.id}
            alert={alert}
            onDismiss={() => onDismiss(alert.id)}
            onInspect={() => onInspectVendor && onInspectVendor(alert.vendorKey)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface ToastCardProps {
  alert: RiskAlertNotification;
  onDismiss: () => void;
  onInspect: () => void;
}

const ToastCard: React.FC<ToastCardProps> = ({
  alert,
  onDismiss,
  onInspect,
}) => {
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const duration = 7000; // 7 seconds auto-dismiss

  useEffect(() => {
    if (isPaused) return;
    const interval = 50;
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= step) {
          clearInterval(timer);
          onDismiss();
          return 0;
        }
        return prev - step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isPaused, onDismiss]);

  const isCritical = alert.severity === "critical";
  const isWarning = alert.severity === "warning";
  const isScoreIncrease = alert.newScore > alert.oldScore;

  const cardStyle = isCritical
    ? "bg-zinc-950/95 border-red-500/70 shadow-2xl shadow-red-950/60 text-zinc-100"
    : isWarning
    ? "bg-zinc-950/95 border-amber-500/70 shadow-2xl shadow-amber-950/60 text-zinc-100"
    : "bg-zinc-950/95 border-cyan-500/70 shadow-2xl shadow-cyan-950/60 text-zinc-100";

  const badgeStyle = isCritical
    ? "bg-red-950/80 text-red-300 border-red-500/50"
    : isWarning
    ? "bg-amber-950/80 text-amber-300 border-amber-500/50"
    : "bg-cyan-950/80 text-cyan-300 border-cyan-500/50";

  const progressBg = isCritical
    ? "bg-gradient-to-r from-red-600 to-rose-500"
    : isWarning
    ? "bg-gradient-to-r from-amber-500 to-yellow-400"
    : "bg-gradient-to-r from-cyan-500 to-blue-500";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.94, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, x: 60, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`pointer-events-auto rounded-2xl border p-4 backdrop-blur-2xl relative overflow-hidden transition-all duration-300 group ${cardStyle}`}
    >
      {/* Top Countdown Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/5 overflow-hidden">
        <div
          className={`h-full transition-all duration-75 ease-linear ${progressBg}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-start gap-3 mt-0.5">
        {/* Severity Icon */}
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
            isCritical
              ? "bg-red-900/40 border-red-500/60 text-red-400"
              : isWarning
              ? "bg-amber-900/40 border-amber-500/60 text-amber-400"
              : "bg-cyan-900/40 border-cyan-500/60 text-cyan-400"
          }`}
        >
          {isCritical ? (
            <ShieldAlert size={18} className="animate-pulse" />
          ) : isWarning ? (
            <AlertTriangle size={18} />
          ) : (
            <Info size={18} />
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 truncate">
              <span className="font-sans font-bold text-sm text-white truncate">
                {alert.vendorName}
              </span>
              <span
                className={`font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border shrink-0 ${badgeStyle}`}
              >
                {isCritical ? "Threshold Breach" : isWarning ? "Risk Elevation" : "Risk Update"}
              </span>
            </div>

            <button
              onClick={onDismiss}
              className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
              title="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>

          {/* Risk Score Metric Pill */}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1 font-mono text-xs">
              <span className="text-zinc-400">Score:</span>
              <span className="text-zinc-500 line-through text-[11px]">{alert.oldScore}</span>
              <span className="text-zinc-400">&rarr;</span>
              <span
                className={`font-bold px-1.5 py-0.5 rounded ${
                  alert.newScore >= alert.threshold
                    ? "text-red-400 bg-red-950/60 border border-red-500/40"
                    : "text-amber-300 bg-amber-950/60 border border-amber-500/40"
                }`}
              >
                {alert.newScore} pts
              </span>
            </div>

            <span className="text-zinc-500 text-[11px]">•</span>

            <div className="flex items-center gap-1 font-mono text-[11px] text-zinc-400">
              <span>Threshold:</span>
              <span className="text-zinc-200 font-semibold">{alert.threshold} pts</span>
            </div>

            {isScoreIncrease ? (
              <span className="inline-flex items-center text-[10px] font-mono text-red-400 bg-red-950/40 px-1.5 py-0.5 rounded font-bold border border-red-500/30">
                <TrendingUp size={11} className="mr-0.5" />
                +{alert.newScore - alert.oldScore}
              </span>
            ) : (
              <span className="inline-flex items-center text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded font-bold border border-emerald-500/30">
                <TrendingDown size={11} className="mr-0.5" />
                {alert.newScore - alert.oldScore}
              </span>
            )}
          </div>

          {/* Alert Message Description */}
          <p className="text-xs text-zinc-300 leading-relaxed mb-2.5 font-sans">
            {alert.message}
          </p>

          {/* Flagged Metrics Tags (if available) */}
          {alert.flaggedMetrics && alert.flaggedMetrics.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {alert.flaggedMetrics.map((tag, idx) => (
                <span
                  key={idx}
                  className="font-mono text-[10px] bg-zinc-900 border border-white/10 text-zinc-300 px-2 py-0.5 rounded-md flex items-center gap-1"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0"></span>
                  <span>{tag}</span>
                </span>
              ))}
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[11px]">
            <span className="font-mono text-[10px] text-zinc-500">
              {alert.timestamp}
            </span>

            <button
              onClick={() => {
                onInspect();
                onDismiss();
              }}
              className="font-sans font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors hover:underline cursor-pointer"
            >
              <span>Inspect in Heatmap</span>
              <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
