import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, User, Sparkles, Minimize2, Maximize2, RefreshCw, HelpCircle, ChevronRight, CornerDownRight, RotateCcw, ArrowRight } from "lucide-react";
import { StructuredVendorData, VendorScores, DecisionWeights, RecommendationResult, SignOffRecord, VendorRawQuotes } from "../types";
import { VENDOR_NAMES } from "../data";
import { LanternLogo } from "./LanternLogo";

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  time: string;
  followUps?: string[];
}

interface Props {
  structuredData: StructuredVendorData | null;
  scores: VendorScores;
  weights: DecisionWeights;
  recommendation: RecommendationResult | null;
  signoff: SignOffRecord | null;
  quotes: VendorRawQuotes;
}

const TOPIC_PRESETS = [
  { label: "💰 Price Analysis", query: "Give me a deep dive breakdown on pricing and ROI across all vendors" },
  { label: "⏱️ Delivery Lead Times", query: "Analyze deployment schedules and lead time risks for each vendor" },
  { label: "🛡️ Warranties & Support SLAs", query: "Detailed comparison of warranty length and support SLAs" },
  { label: "⚠️ Risk Assessment", query: "What are the major technical and compliance risks for each vendor?" },
  { label: "✍️ Sign-Off Status", query: "What is the current governance sign-off status and approval trail?" },
];

export function ProcurementChatAssistant({
  structuredData,
  scores,
  weights,
  recommendation,
  signoff,
  quotes,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "assistant",
      text: "Hello! I am your AI Procurement Copilot for RFQ-2026. What specific vendor aspect would you like to explore?",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      followUps: [
        "Compare prices & savings",
        "Which vendor has 5-year warranty?",
        "Show vendor risk analysis",
        "What is the recommended vendor?",
      ],
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleResetChat = () => {
    setMessages([
      {
        id: "welcome-" + Date.now(),
        sender: "assistant",
        text: "Conversation restarted. How can I assist with RFQ-2026 evaluation today?",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        followUps: [
          "Compare prices & savings",
          "Which vendor has 5-year warranty?",
          "Show vendor risk analysis",
        ],
      },
    ]);
  };

  // Helper to parse follow-ups from raw AI response text
  const parseMessageAndFollowups = (rawText: string): { mainText: string; followUps: string[] } => {
    const followUpMarker = /Suggested follow-ups?:?/i;
    const match = rawText.match(followUpMarker);

    if (!match || match.index === undefined) {
      return { mainText: rawText.trim(), followUps: [] };
    }

    const mainText = rawText.substring(0, match.index).trim();
    const followUpRaw = rawText.substring(match.index + match[0].length).trim();

    const followUps = followUpRaw
      .split(/\||\n/)
      .map((item) => item.replace(/^[•\-\d\.]+\s*/, "").trim())
      .filter((item) => item.length > 2);

    return { mainText, followUps };
  };

  // Fallback local smart response generator if server API fails or is offline
  const generateFallbackAnswer = (query: string): { mainText: string; followUps: string[] } => {
    const q = query.toLowerCase();

    if (!structuredData) {
      return {
        mainText: "No standardized vendor data is currently loaded. Please click 'Standardize Quotations' in Step 1 to extract vendor proposal data.",
        followUps: ["Extract sample quotes", "Load default weights"],
      };
    }

    const meridian = structuredData.meridian;
    const ironclad = structuredData.ironclad;
    const vantage = structuredData.vantage;

    if (q.includes("price") || q.includes("cheap") || q.includes("cost") || q.includes("roi") || q.includes("budget") || q.includes("saving")) {
      return {
        mainText: `### 💰 In-Depth Pricing & Financial Analysis

• **Ironclad Tech**: **$118,500** *(Lowest Cost — Best Budget Pick)*
  - Hardware: $98,500 | Install & 3-Yr Support: $20,000
  - Total Savings vs. Meridian: **$13,500 (10.2% cheaper)**

• **Vantage Systems**: **$124,000** *(Mid-Tier Cost)*
  - Hardware: $108,000 | Accelerated Install: $16,000
  - Savings vs. Meridian: **$8,000 (6.1% cheaper)**

• **Meridian Solutions**: **$132,000** *(Premium Comprehensive Quote)*
  - Hardware: $105,000 | 5-Yr Onsite Support & Migration: $27,000
  - Highest upfront cost, but includes **5 years full coverage** (saving $12k+ in extended service contracts).`,
        followUps: [
          "Compare lead times for Ironclad vs Meridian",
          "What is the warranty value for Meridian?",
          "Recalculate scores with 50% Price Weight",
        ],
      };
    }

    if (q.includes("lead time") || q.includes("delivery") || q.includes("schedule") || q.includes("week") || q.includes("fast")) {
      return {
        mainText: `### ⏱️ Delivery Lead Time & Schedule Analysis

• **Vantage Systems**: **3 Weeks** ⚡ *(Fastest Deployment)*
  - *Advantage*: Rapid air-freight delivery and local stock. Ideal if project deadline is immediate.
  - *Trade-off*: Requires software workaround for dual failover.

• **Ironclad Tech**: **4 Weeks** 🚚 *(Standard Delivery)*
  - *Advantage*: On-schedule assembly with pre-tested dual failover controllers.

• **Meridian Solutions**: **6 Weeks** 🐢 *(Longest Lead Time)*
  - *Bottleneck*: Custom factory staging, burn-in stress testing, and ISO compliance verification before shipment.`,
        followUps: [
          "Why does Meridian take 6 weeks?",
          "Does Vantage speed compromise quality?",
          "Which vendor fits a 30-day deadline?",
        ],
      };
    }

    if (q.includes("warranty") || q.includes("sla") || q.includes("support") || q.includes("guarantee")) {
      return {
        mainText: `### 🛡️ Warranty & Support SLA Deep Dive

• **Meridian Solutions**: **5 Years Warranty** | **24/7 4-Hour Response SLA** 🏆
  - Includes full onsite spare parts replacement, 24/7 direct senior engineer escalation, and annual health checks.

• **Ironclad Tech**: **3 Years Warranty** | **24/7 Next-Business-Day (24h) SLA**
  - Standard warranty cover. Upgrade to 4-hour response costs an additional $4,500/yr.

• **Vantage Systems**: **2 Years Warranty** | **8x5 Next-Business-Day SLA** ⚠️
  - Basic warranty. Requires additional maintenance agreement beyond Year 2.`,
        followUps: [
          "Compare total cost including 5-year SLA for Ironclad",
          "Which vendor has ISO 9001 certification?",
          "View full score chart",
        ],
      };
    }

    if (q.includes("risk") || q.includes("ironclad") || q.includes("vantage") || q.includes("meridian") || q.includes("issue")) {
      return {
        mainText: `### ⚠️ Technical & Compliance Risk Matrix

• **Ironclad Tech Risks**:
  - *Risk*: 24-hour response SLA could cause prolonged downtime during unscheduled outages.
  - *Mitigation*: Negotiate 4-hour SLA add-on during contract signing.

• **Vantage Systems Risks**:
  - *Risk*: Lacks factory pre-certification for active-active failover; requires custom patch.
  - *Mitigation*: Require pre-delivery staging acceptance testing.

• **Meridian Solutions Risks**:
  - *Risk*: 6-week lead time may delay deployment if facility dates are tight.
  - *Mitigation*: Issue early purchase order for priority factory allocation.`,
        followUps: [
          "What is the recommended vendor?",
          "How do decision weights affect the winner?",
          "How to execute governance sign-off?",
        ],
      };
    }

    if (q.includes("signoff") || q.includes("sign-off") || q.includes("approve") || q.includes("governance") || q.includes("status")) {
      if (signoff) {
        return {
          mainText: `### ✍️ Governance Sign-Off Executed

• **Decision Status**: **APPROVED** (${signoff.status.toUpperCase()})
• **Selected Vendor**: **${VENDOR_NAMES[signoff.vendor] || signoff.vendor}**
• **Authorized By**: ${signoff.signoffUser}
• **Timestamp**: ${signoff.time}
• **Audit Rationale**: "${signoff.reason}"`,
          followUps: [
            "Export procurement report as PDF",
            "Export audit trail as CSV",
            "View score breakdown",
          ],
        };
      }
      return {
        mainText: `### ✍️ Governance Sign-Off Pending

• **Status**: **PENDING APPROVAL**
• **Recommended Choice**: **${
          recommendation ? VENDOR_NAMES[recommendation.recommendedVendor] : "Meridian Solutions"
        }** (Score: ${scores.meridian?.weighted || 82}/100)
• **Next Step**: Scroll to **Step 4: AI Executive Recommendation & Governance Sign-Off** to log your formal decision with audit logging.`,
        followUps: [
          "What is Meridian's weighted score?",
          "How does changing weights switch the winner?",
          "Compare Ironclad vs Meridian",
        ],
      };
    }

    return {
      mainText: `### 📊 Procurement Context Overview (RFQ-2026-0803)

• **Top Recommended Vendor**: **${recommendation ? VENDOR_NAMES[recommendation.recommendedVendor] : "Meridian Solutions"}**
• **Weighted Scores**:
  - **Meridian Solutions**: **${scores.meridian?.weighted || 82}** / 100
  - **Ironclad Tech**: **${scores.ironclad?.weighted || 78}** / 100
  - **Vantage Systems**: **${scores.vantage?.weighted || 71}** / 100

What specific criteria would you like to analyze further?`,
      followUps: [
        "Compare prices & savings",
        "Compare delivery lead times",
        "Compare warranties & SLAs",
        "Check sign-off status",
      ],
    };
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: query,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const historyPayload = messages.map((m) => ({
        role: m.sender === "user" ? "user" : "model",
        text: m.text,
      }));

      const res = await fetch("/api/procurement-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query,
          history: historyPayload,
          context: {
            structuredData,
            scores,
            weights,
            recommendation,
            signoff,
            quotes,
          },
        }),
      });

      if (!res.ok) {
        throw new Error("Chat endpoint error");
      }

      const data = await res.json();
      const rawReply = data.reply || "";

      let assistantMessage: Message;
      if (rawReply) {
        const { mainText, followUps } = parseMessageAndFollowups(rawReply);
        assistantMessage = {
          id: (Date.now() + 1).toString(),
          sender: "assistant",
          text: mainText,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          followUps: followUps.length > 0 ? followUps : [
            "Compare prices & savings",
            "Which vendor has 5-year warranty?",
            "View vendor risk analysis"
          ],
        };
      } else {
        const fallback = generateFallbackAnswer(query);
        assistantMessage = {
          id: (Date.now() + 1).toString(),
          sender: "assistant",
          text: fallback.mainText,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          followUps: fallback.followUps,
        };
      }

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const fallback = generateFallbackAnswer(query);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: "assistant",
        text: fallback.mainText,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        followUps: fallback.followUps,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Simple Markdown text renderer with bolding and headers
  const renderFormattedText = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, lineIdx) => {
      let trimmed = line.trim();

      if (!trimmed) {
        return <div key={lineIdx} className="h-1.5" />;
      }

      // Check header
      if (trimmed.startsWith("### ")) {
        return (
          <h5 key={lineIdx} className="font-bold text-slate-900 text-xs mt-1 mb-1 flex items-center gap-1.5">
            {trimmed.replace("### ", "")}
          </h5>
        );
      }

      // Check bullet point
      const isBullet = trimmed.startsWith("•") || trimmed.startsWith("-");
      if (isBullet) {
        trimmed = trimmed.replace(/^[•\-]\s*/, "");
      }

      // Parse inline bolding (**text**)
      const parts = trimmed.split(/(\*\*.*?\*\*)/g);

      return (
        <div key={lineIdx} className={`my-0.5 leading-relaxed ${isBullet ? "pl-2 flex items-start gap-1.5" : ""}`}>
          {isBullet && <span className="text-blue-600 font-bold shrink-0">•</span>}
          <div className="flex-1">
            {parts.map((part, pIdx) => {
              if (part.startsWith("**") && part.endsWith("**")) {
                return (
                  <strong key={pIdx} className="font-semibold text-slate-900">
                    {part.slice(2, -2)}
                  </strong>
                );
              }
              return <span key={pIdx}>{part}</span>;
            })}
          </div>
        </div>
      );
    });
  };

  return (
    <>
      {/* Floating Toggle Button with Hover Animation & Radiant Red Glow */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 group flex items-center gap-3 px-4 py-2.5 sm:px-5 sm:py-3 rounded-full bg-zinc-950/95 hover:bg-black border border-zinc-700/80 hover:border-red-500/90 text-white font-sans font-semibold text-xs shadow-2xl transition-all duration-300 chatbot-button-pulse focus:outline-none ring-1 ring-white/15 hover:ring-red-500/50 cursor-pointer backdrop-blur-xl shrink-0 select-none whitespace-nowrap"
        >
          {/* Pulsing red halo on hover */}
          <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-rose-600 rounded-full blur-md opacity-0 group-hover:opacity-75 transition-opacity duration-500 pointer-events-none -z-10 animate-pulse-glow"></div>

          <div className="relative flex items-center justify-center text-red-500 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 shrink-0">
            <Bot size={19} className="text-red-500 group-hover:text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-black animate-ping"></span>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-400 rounded-full ring-2 ring-black"></span>
          </div>

          <div className="flex items-center shrink-0">
            <LanternLogo size="sm" showTagline={false} animated={true} />
          </div>

          <span className="text-[11px] font-mono text-zinc-300 group-hover:text-red-300 transition-colors flex items-center gap-1 shrink-0">
            <Sparkles size={11} className="text-red-400 group-hover:rotate-45 transition-transform duration-500 shrink-0" />
            <span>Ask AI</span>
          </span>
        </button>
      )}

      {/* Floating Chat Drawer / Window with Dynamic Hover Border & Crimson Glow */}
      {isOpen && (
        <div
          className={`fixed z-50 bottom-5 right-5 sm:bottom-6 sm:right-6 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-2xl border border-red-500/30 hover:border-red-500/70 rounded-2xl shadow-2xl flex flex-col chatbot-container-hover transition-all duration-300 overflow-hidden max-w-[calc(100vw-2.5rem)] ${
            isExpanded ? "w-[94vw] sm:w-[580px] h-[82vh]" : "w-[92vw] sm:w-[420px] h-[580px] max-h-[85vh]"
          }`}
        >
          {/* Top ambient crimson light bar */}
          <div className="h-1 w-full bg-gradient-to-r from-red-600 via-rose-500 to-red-600 animate-pulse"></div>

          {/* Chat Header */}
          <div className="px-4 py-3 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-red-100 dark:border-red-950/40 text-slate-900 dark:text-zinc-100 flex items-center justify-between shrink-0 shadow-xs">
            <div className="flex items-center gap-2.5">
              <LanternLogo size="sm" showTagline={false} animated={true} />
              <span className="text-[10px] bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50 px-2 py-0.5 rounded-full font-mono font-semibold shadow-[0_0_8px_rgba(239,68,68,0.15)] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                RFQ-2026 AI
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleResetChat}
                className="p-1.5 rounded-lg text-slate-500 dark:text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all duration-200 cursor-pointer hover:rotate-180"
                title="Restart conversation"
              >
                <RotateCcw size={14} />
              </button>

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-lg text-slate-500 dark:text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all duration-200 cursor-pointer hover:scale-110"
                title={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 dark:text-zinc-400 hover:text-white hover:bg-red-600 transition-all duration-200 cursor-pointer hover:rotate-90"
                title="Close chat"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Quick Interactive Topic Toolbar */}
          <div className="bg-slate-50/90 dark:bg-zinc-900/50 border-b border-red-100 dark:border-red-950/30 px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            <span className="text-[10px] font-mono font-semibold text-slate-500 dark:text-zinc-400 uppercase shrink-0 flex items-center gap-1">
              <Sparkles size={10} className="text-red-500" />
              Topics:
            </span>
            {TOPIC_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(preset.query)}
                disabled={loading}
                className="shrink-0 text-[10px] font-sans bg-white dark:bg-zinc-800 hover:bg-red-600 hover:text-white hover:border-red-500 text-slate-700 dark:text-zinc-200 px-2.5 py-1 rounded-md border border-slate-200/90 dark:border-zinc-700/60 transition-all duration-200 font-medium cursor-pointer shadow-2xs chatbot-chip-hover"
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/40 dark:bg-zinc-950/60 text-xs font-sans">
            {messages.map((msg) => {
              const isAssistant = msg.sender === "assistant";
              return (
                <div key={msg.id} className="space-y-2 group/msg">
                  <div className={`flex gap-2.5 ${isAssistant ? "justify-start" : "justify-end"}`}>
                    {isAssistant && (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-500 to-rose-700 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-md shadow-red-500/30 group-hover/msg:scale-110 transition-transform duration-300">
                        <Bot size={14} className="drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]" />
                      </div>
                    )}

                    <div
                      className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 leading-relaxed transition-all duration-300 ${
                        isAssistant
                          ? "bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 border border-slate-200/90 dark:border-zinc-800 hover:border-red-400/50 rounded-tl-xs shadow-sm hover:shadow-md hover:shadow-red-500/10"
                          : "bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-tr-xs shadow-md shadow-red-600/25 hover:shadow-red-600/40"
                      }`}
                    >
                      <div>{renderFormattedText(msg.text)}</div>
                      <div
                        className={`text-[9px] font-mono mt-1.5 ${
                          isAssistant ? "text-slate-400 dark:text-zinc-500" : "text-red-100 text-right"
                        }`}
                      >
                        {msg.time}
                      </div>
                    </div>

                    {!isAssistant && (
                      <div className="w-7 h-7 rounded-full bg-zinc-800 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm group-hover/msg:scale-110 transition-transform duration-300">
                        <User size={14} />
                      </div>
                    )}
                  </div>

                  {/* Interactive Follow-Up Chips for Assistant Message */}
                  {isAssistant && msg.followUps && msg.followUps.length > 0 && (
                    <div className="pl-9 pr-2 pt-1 flex flex-wrap items-center gap-1.5 animate-fadeIn">
                      <span className="text-[10px] font-mono font-medium text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                        <Sparkles size={11} className="text-red-500" />
                        <span>Suggested follow-ups:</span>
                      </span>
                      {msg.followUps.map((chip, chipIdx) => (
                        <button
                          key={chipIdx}
                          onClick={() => handleSendMessage(chip)}
                          disabled={loading}
                          className="text-[11px] font-sans bg-white dark:bg-zinc-800/90 hover:bg-gradient-to-r hover:from-red-600 hover:to-rose-600 text-slate-700 dark:text-zinc-200 hover:text-white px-3 py-1 rounded-full border border-slate-200 dark:border-zinc-700 hover:border-transparent transition-all duration-200 flex items-center gap-1.5 shadow-2xs chatbot-chip-hover text-left cursor-pointer"
                        >
                          <span>{chip}</span>
                          <ArrowRight size={10} className="text-red-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-600 to-rose-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-red-600/40 animate-bounce">
                  <Bot size={14} />
                </div>
                <div className="bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 border border-red-200/60 dark:border-red-900/40 rounded-2xl rounded-tl-xs px-4 py-3 flex items-center gap-2.5 shadow-sm">
                  <RefreshCw size={13} className="animate-spin text-red-600" />
                  <span className="font-mono text-xs text-red-600 dark:text-red-400 font-medium">
                    Analyzing procurement metrics & calculating trade-offs...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar with Glowing Red Focus */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-t border-slate-200 dark:border-zinc-800 flex items-center gap-2 shrink-0 shadow-xs"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Copilot about pricing, warranties, lead times..."
              className="flex-1 px-3.5 py-2.5 text-xs font-sans text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/80 hover:border-red-400/50 focus:bg-white dark:focus:bg-zinc-800 focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-40 text-white transition-all shadow-md shadow-red-600/30 hover:shadow-red-600/50 hover:scale-105 active:scale-95 shrink-0 cursor-pointer"
              title="Send message"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
