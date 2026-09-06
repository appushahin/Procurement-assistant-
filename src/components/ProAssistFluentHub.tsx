import React, { useRef, useState, useCallback } from "react";
import {
  ShieldCheck,
  AppWindow,
  History,
  Activity,
  Network,
  Sparkles,
  Award,
  AlertTriangle,
  ChevronRight,
  Bot,
  ArrowRight,
  Check,
  Clock,
  CheckCircle2,
} from "lucide-react";
import {
  StructuredVendorData,
  VendorScores,
  DecisionWeights,
  RecommendationResult,
  SignOffRecord,
  VendorBinaryGateMap,
  BackgroundTheme,
} from "../types";
import { LantraAvatar } from "./LantraAvatar";
import { AppLanguage, TRANSLATIONS } from "../translations";

interface ProAssistFluentHubProps {
  structuredData: StructuredVendorData | null;
  scores: VendorScores;
  weights?: DecisionWeights;
  recommendation: RecommendationResult | null;
  signoff: SignOffRecord | null;
  binaryGates?: VendorBinaryGateMap;
  bgTheme?: BackgroundTheme;
  onOpenChatWithPrompt?: (prompt: string) => void;
  onOpenAuditHistory?: () => void;
  lang?: AppLanguage;
}

interface FluentCardData {
  id: string;
  title: string;
  subtitle: string;
  statusText: string;
  icon: React.ReactNode;
  badgeType: "success" | "warning" | "error" | "info";
  spotlightColor: string;
  borderColor: string;
  prompt: string;
  metric: string;
}

interface CardMouseState {
  x: number;
  y: number;
}

export function ProAssistFluentHub({
  structuredData,
  scores,
  weights,
  recommendation,
  signoff,
  binaryGates = {},
  bgTheme = "glowing-red",
  onOpenChatWithPrompt,
  onOpenAuditHistory,
  lang = "en",
}: ProAssistFluentHubProps) {
  const isAr = lang === "ar";
  const t = TRANSLATIONS[lang];
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerMouse, setContainerMouse] = useState<{ x: number; y: number }>({ x: -2000, y: -2000 });
  const [isContainerHovered, setIsContainerHovered] = useState(false);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [cardMouseMap, setCardMouseMap] = useState<Record<string, CardMouseState>>({});

  const handleContainerMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setContainerMouse({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  const handleCardMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>, cardId: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCardMouseMap((prev) => ({
      ...prev,
      [cardId]: {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      },
    }));
  }, []);

  const handleCardMouseEnter = useCallback((cardId: string) => {
    setHoveredCardId(cardId);
  }, []);

  const handleCardMouseLeave = useCallback((cardId: string) => {
    setHoveredCardId((prev) => (prev === cardId ? null : prev));
  }, []);

  const vantageGateIssue = binaryGates.vantage?.failoverVerified === false;
  const isSignedOff = !!signoff;

  const cards: FluentCardData[] = [
    {
      id: "card-gate-control",
      title: "App & browser control",
      subtitle: vantageGateIssue
        ? "1 failover gate risk flagged for Vantage. Meridian & Ironclad verified."
        : "No action needed. ISO-9001, compliance gates, and failover verified.",
      statusText: vantageGateIssue ? "Gate Flagged" : "No action needed",
      badgeType: vantageGateIssue ? "warning" : "success",
      icon: <AppWindow size={20} />,
      spotlightColor: "rgba(59, 130, 246, 0.28)",
      borderColor: "rgba(96, 165, 250, 0.9)",
      prompt: "Summarize the compliance and failover verification gate statuses for all vendors. Which are disqualified and why?",
      metric: "3/3 Gates Checked",
    },
    {
      id: "card-protection-history",
      title: "Protection history",
      subtitle: "View latest evaluation logs, risk scoring trails, and AI governance recommendations.",
      statusText: "Live Audit Trail",
      badgeType: "info",
      icon: <History size={20} />,
      spotlightColor: "rgba(6, 182, 212, 0.28)",
      borderColor: "rgba(34, 211, 238, 0.9)",
      prompt: "Show me the full timeline and history of scoring iterations and vendor evaluation changes.",
      metric: "Continuous Tracking",
    },
    {
      id: "card-account-protection",
      title: "Account protection & Sign-Off",
      subtitle: isSignedOff
        ? `Signed off by ${signoff?.signoffUser || "Approver"}. Cryptographically verified.`
        : "3-tier cryptographic executive sign-off pending authorization.",
      statusText: isSignedOff ? "Certified" : "Action Needed",
      badgeType: isSignedOff ? "success" : "warning",
      icon: <ShieldCheck size={20} />,
      spotlightColor: isSignedOff ? "rgba(16, 185, 129, 0.28)" : "rgba(245, 158, 11, 0.28)",
      borderColor: isSignedOff ? "rgba(52, 211, 153, 0.9)" : "rgba(251, 191, 36, 0.9)",
      prompt: "What is the current 3-tier governance sign-off status and approval trail?",
      metric: isSignedOff ? "Tier 3 Approved" : "Tier 1 Pending",
    },
    {
      id: "card-vendor-health",
      title: "Vendor performance & health",
      subtitle: "5-year lifecycle TCO, SLA maintenance coverage, and warranty optimization.",
      statusText: "TCO Optimal",
      badgeType: "success",
      icon: <Activity size={20} />,
      spotlightColor: "rgba(168, 85, 247, 0.28)",
      borderColor: "rgba(192, 132, 252, 0.9)",
      prompt: "Give me a deep dive breakdown on pricing, 5-year TCO, and ROI across all vendors",
      metric: "5-Yr Lifecycle Model",
    },
    {
      id: "card-failover-protection",
      title: "Network & failover protection",
      subtitle: "Active-active dual controller failover and 24/7 onsite SLA verification.",
      statusText: "24/7 SLA",
      badgeType: "success",
      icon: <Network size={20} />,
      spotlightColor: "rgba(59, 130, 246, 0.28)",
      borderColor: "rgba(147, 197, 253, 0.9)",
      prompt: "What are the major technical, redundancy, and compliance risks for each vendor?",
      metric: "99.999% SLA",
    },
    {
      id: "card-negotiation-leverage",
      title: "Negotiation leverage & strategy",
      subtitle: "Target discount benchmarks, payment term optimizations, and counter-proposals.",
      statusText: "AI Playbook",
      badgeType: "info",
      icon: <Sparkles size={20} />,
      spotlightColor: "rgba(236, 72, 153, 0.28)",
      borderColor: "rgba(244, 114, 182, 0.9)",
      prompt: "Analyze vendor price margins and outline the top 3 tactical negotiation levers for the highest scoring vendor",
      metric: "12-18% Target Savings",
    },
    {
      id: "card-saudi-compliance",
      title: "Saudi Local Content & Vision 2030",
      subtitle: "MISA licensing, regional headquarters verification, and local workforce quota.",
      statusText: "Local Content Verified",
      badgeType: "success",
      icon: <Award size={20} />,
      spotlightColor: "rgba(16, 185, 129, 0.28)",
      borderColor: "rgba(52, 211, 153, 0.9)",
      prompt: "Detail the Saudi regulatory compliance, MISA licenses, and local content scores for all vendors.",
      metric: "Vision 2030 Aligned",
    },
    {
      id: "card-risk-outlier",
      title: "Risk Assessment & Outlier Detection",
      subtitle: "Standard deviation outlier alerts and commercial penalty clause auditing.",
      statusText: "Heatmap Active",
      badgeType: "info",
      icon: <AlertTriangle size={20} />,
      spotlightColor: "rgba(239, 68, 68, 0.28)",
      borderColor: "rgba(248, 113, 113, 0.9)",
      prompt: "Which metrics exhibit the highest standard deviation or outlier spread across vendor submissions?",
      metric: "Z-Score Analyzed",
    },
  ];

  return (
    <div
      ref={containerRef}
      onMouseMove={handleContainerMouseMove}
      onMouseEnter={() => setIsContainerHovered(true)}
      onMouseLeave={() => {
        setIsContainerHovered(false);
        setContainerMouse({ x: -2000, y: -2000 });
        setHoveredCardId(null);
      }}
      className="relative rounded-2xl bg-zinc-950/90 border border-white/10 p-5 sm:p-6 text-zinc-100 shadow-2xl backdrop-blur-2xl overflow-hidden transition-all duration-300"
    >
      {/* Dynamic Ambient Background Illumination tracking the mouse across the whole panel */}
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300 -z-10"
        style={{
          opacity: isContainerHovered ? 0.3 : 0,
          background: `radial-gradient(700px circle at ${containerMouse.x}px ${containerMouse.y}px, rgba(59, 130, 246, 0.15), transparent 70%)`,
        }}
      />

      {/* Header Section (Windows Security Center Style with LANTRA Robot) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 mb-5 border-b border-white/10">
        <div className="flex items-center gap-3.5">
          <LantraAvatar size="md" status="online" isAnimated={true} />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {isAr ? "مركز لانـتـرا للأمن والحوكمة والذكاء الشرائي" : "LANTRA: Security & Evaluation Intelligence Center"}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-950 text-blue-400 border border-blue-800 flex items-center gap-1 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
                {isAr ? "محرك الذكاء الفوري نشط" : "Fluent Spotlight Active"}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              {isAr
                ? "مصفوفة الحوكمة التفاعلية بنمط Windows Security مع محاكاة إضاءة المؤشر الديناميكية ومتابعة المخاطر"
                : "Windows Security style interactive telemetry matrix with dynamic cursor spotlight illumination."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onOpenAuditHistory && (
            <button
              onClick={onOpenAuditHistory}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <History size={13} className="text-cyan-400" />
              <span>{isAr ? "سجل التدقيق" : "Audit Log"}</span>
            </button>
          )}

          <button
            onClick={() =>
              onOpenChatWithPrompt?.(
                isAr
                  ? "قدم تحليلاً شاملاً وتوليفاً تنفيذياً لكافة عروض الموردين وبوابات المخاطر والتوصية النهائية"
                  : "Provide a comprehensive executive synthesis of all vendor proposals, risk gates, and recommendation"
              )
            }
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-blue-600/30 cursor-pointer active:scale-95 hover:shadow-blue-500/40"
          >
            <LantraAvatar size="xs" showStatusIndicator={false} />
            <span>{isAr ? "تشغيل مساعد لانـتـرا" : "Launch LANTRA Copilot"}</span>
          </button>
        </div>
      </div>

      {/* Fluent Spotlight Cards Grid (Exact Windows Security 4x2 Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {cards.map((card) => {
          const isCardHovered = hoveredCardId === card.id;
          const cardMouse = cardMouseMap[card.id] || { x: 140, y: 80 };

          return (
            <div
              key={card.id}
              id={card.id}
              onClick={() => onOpenChatWithPrompt?.(card.prompt)}
              onMouseMove={(e) => handleCardMouseMove(e, card.id)}
              onMouseEnter={() => handleCardMouseEnter(card.id)}
              onMouseLeave={() => handleCardMouseLeave(card.id)}
              className={`relative group rounded-xl p-4 select-none cursor-pointer transition-all duration-200 overflow-hidden border ${
                isCardHovered
                  ? "bg-zinc-900/95 border-blue-500/80 shadow-[0_10px_25px_rgba(0,0,0,0.6)] scale-[1.01]"
                  : "bg-zinc-900/60 hover:bg-zinc-900/80 border-white/10 hover:border-white/20"
              }`}
              style={{
                transform: isCardHovered ? "translateY(-3px)" : "translateY(0)",
              }}
            >
              {/* 1. Precise Card-Local Dynamic Cursor Spotlight Radial Background Fill */}
              <div
                className="pointer-events-none absolute -inset-px transition-opacity duration-200"
                style={{
                  opacity: isCardHovered ? 1 : 0,
                  background: `radial-gradient(220px circle at ${cardMouse.x}px ${cardMouse.y}px, ${card.spotlightColor}, transparent 80%)`,
                }}
              />

              {/* 2. Precise Card-Local Dynamic Border Reveal Highlight (Windows 11 Fluent Reveal Effect) */}
              <div
                className="pointer-events-none absolute inset-0 rounded-xl transition-opacity duration-200"
                style={{
                  opacity: isCardHovered ? 1 : 0,
                  padding: "1px",
                  background: `radial-gradient(180px circle at ${cardMouse.x}px ${cardMouse.y}px, ${card.borderColor}, rgba(255, 255, 255, 0.15) 35%, transparent 75%)`,
                  WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                  WebkitMaskComposite: "xor",
                  maskComposite: "exclude",
                }}
              />

              {/* Card Header: Icon with Windows Security style checkmark badge */}
              <div className="relative z-10 flex items-start justify-between mb-3">
                <div className="relative inline-flex items-center justify-center">
                  <div className="w-10 h-10 rounded-lg bg-blue-950/70 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:text-blue-300 group-hover:scale-105 transition-all duration-300 shadow-[0_0_12px_rgba(59,130,246,0.25)]">
                    {card.icon}
                  </div>

                  {/* Corner Status Check/Alert Badge */}
                  <div
                    className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shadow-md border border-zinc-950 ${
                      card.badgeType === "success"
                        ? "bg-emerald-500 text-black shadow-emerald-500/40"
                        : card.badgeType === "warning"
                        ? "bg-amber-400 text-black shadow-amber-400/40"
                        : card.badgeType === "error"
                        ? "bg-rose-500 text-white shadow-rose-500/40"
                        : "bg-blue-500 text-white shadow-blue-500/40"
                    }`}
                  >
                    {card.badgeType === "warning" ? (
                      <span className="text-[10px] font-black leading-none">!</span>
                    ) : (
                      <Check size={10} className="stroke-[3.5]" />
                    )}
                  </div>
                </div>

                {card.metric && (
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-400 group-hover:text-zinc-200 transition-colors">
                    {card.metric}
                  </span>
                )}
              </div>

              {/* Title and Subtitle */}
              <div className="relative z-10 space-y-1">
                <h4 className="text-sm font-semibold text-white tracking-tight group-hover:text-blue-200 transition-colors flex items-center justify-between">
                  <span>{card.title}</span>
                  <ChevronRight
                    size={14}
                    className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-blue-400"
                  />
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed group-hover:text-zinc-300 transition-colors line-clamp-2">
                  {card.subtitle}
                </p>
              </div>

              {/* Bottom Quick Action Link */}
              <div className="relative z-10 mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] font-medium text-blue-400 group-hover:text-blue-300">
                <span className="flex items-center gap-1 group-hover:underline">
                  <span>Inspect with AI</span>
                  <ArrowRight size={11} className="group-hover:translate-x-1 transition-transform" />
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {card.statusText}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
