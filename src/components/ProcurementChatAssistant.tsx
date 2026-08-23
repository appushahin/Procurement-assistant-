import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  MessageSquare,
  X,
  Send,
  Bot,
  User,
  Sparkles,
  Minimize2,
  Maximize2,
  RefreshCw,
  HelpCircle,
  ChevronRight,
  CornerDownRight,
  RotateCcw,
  ArrowRight,
  History,
  Clock,
  Search,
  Copy,
  Check,
  ExternalLink,
  ChevronLeft,
  Filter,
} from "lucide-react";
import { StructuredVendorData, VendorScores, DecisionWeights, RecommendationResult, SignOffRecord, VendorRawQuotes, BackgroundTheme, VendorBinaryGateMap } from "../types";
import { VENDOR_NAMES } from "../data";
import { LanternLogo } from "./LanternLogo";

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  time: string;
  followUps?: string[];
}

interface ChatSessionArchive {
  id: string;
  title: string;
  timestamp: string;
  messages: Message[];
}

interface Props {
  structuredData: StructuredVendorData | null;
  scores: VendorScores;
  weights: DecisionWeights;
  recommendation: RecommendationResult | null;
  signoff: SignOffRecord | null;
  quotes: VendorRawQuotes;
  bgTheme?: BackgroundTheme;
  binaryGates?: VendorBinaryGateMap;
}

const TOPIC_PRESETS = [
  { label: "🛑 Mandatory Gates (YES/NO)", query: "Summarize the compliance and failover verification gate statuses for all vendors. Which are disqualified and why?" },
  { label: "💰 Price & TCO Analysis", query: "Give me a deep dive breakdown on pricing, 5-year TCO, and ROI across all vendors" },
  { label: "⏱️ Delivery Lead Times", query: "Analyze deployment schedules and lead time risks for each vendor" },
  { label: "🛡️ Warranties & Support SLAs", query: "Detailed comparison of warranty length and support SLAs" },
  { label: "⚠️ Risk & Failover", query: "What are the major technical, redundancy, and compliance risks for each vendor?" },
  { label: "✍️ Multi-Tier Sign-Off", query: "What is the current 3-tier governance sign-off status and approval trail?" },
];

export function ProcurementChatAssistant({
  structuredData,
  scores,
  weights,
  recommendation,
  signoff,
  quotes,
  bgTheme = "glowing-red",
  binaryGates = {},
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  const [copiedTurnId, setCopiedTurnId] = useState<string | null>(null);
  const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null);
  const [pastSessions, setPastSessions] = useState<ChatSessionArchive[]>([]);
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
    if (isOpen && !showHistory) {
      scrollToBottom();
    }
  }, [messages, isOpen, showHistory]);

  // Derive conversation turns from current session messages
  const sessionTurns = useMemo(() => {
    const turns: Array<{
      turnIndex: number;
      userMessage: Message;
      assistantMessage?: Message;
      topicTag: string;
    }> = [];

    let currentTurnIndex = 1;
    for (let i = 0; i < messages.length; i++) {
      if (messages[i].sender === "user") {
        const userMsg = messages[i];
        const assistantMsg = messages[i + 1]?.sender === "assistant" ? messages[i + 1] : undefined;

        // Auto-tag topic based on query text
        const qLower = userMsg.text.toLowerCase();
        let topicTag = "General";
        if (qLower.includes("price") || qLower.includes("cost") || qLower.includes("budget") || qLower.includes("saving") || qLower.includes("roi")) {
          topicTag = "Pricing";
        } else if (qLower.includes("lead") || qLower.includes("time") || qLower.includes("deliver") || qLower.includes("schedule") || qLower.includes("week")) {
          topicTag = "Lead Time";
        } else if (qLower.includes("warranty") || qLower.includes("sla") || qLower.includes("support")) {
          topicTag = "Warranty & SLA";
        } else if (qLower.includes("risk") || qLower.includes("failover") || qLower.includes("compliance") || qLower.includes("issue")) {
          topicTag = "Risk";
        } else if (qLower.includes("sign") || qLower.includes("approve") || qLower.includes("governance")) {
          topicTag = "Sign-Off";
        } else if (qLower.includes("weight") || qLower.includes("score") || qLower.includes("rank")) {
          topicTag = "Scoring";
        }

        turns.push({
          turnIndex: currentTurnIndex++,
          userMessage: userMsg,
          assistantMessage: assistantMsg,
          topicTag,
        });
      }
    }

    return turns;
  }, [messages]);

  // Filtered turns based on search query in history view
  const filteredTurns = useMemo(() => {
    if (!historySearchQuery.trim()) return sessionTurns;
    const q = historySearchQuery.toLowerCase();
    return sessionTurns.filter(
      (t) =>
        t.userMessage.text.toLowerCase().includes(q) ||
        (t.assistantMessage && t.assistantMessage.text.toLowerCase().includes(q)) ||
        t.topicTag.toLowerCase().includes(q)
    );
  }, [sessionTurns, historySearchQuery]);

  // Derive dynamic theme styling tokens based on active bgTheme
  const themeStyles = useMemo(() => {
    switch (bgTheme) {
      case "dark-obsidian":
        return {
          launcherBtn: "bg-slate-950/95 hover:bg-black border-blue-500/50 hover:border-blue-400 text-white ring-1 ring-blue-500/20 hover:ring-blue-400/50",
          launcherHalo: "bg-gradient-to-r from-blue-600 to-indigo-600",
          launcherIcon: "text-blue-400 group-hover:text-blue-300 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]",
          drawerContainer: "bg-slate-950/95 border-blue-500/40 hover:border-blue-400/80 shadow-blue-950/50 text-slate-100",
          topLightBar: "bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600",
          headerBg: "bg-slate-900/90 border-b border-blue-900/50 text-slate-100",
          badge: "bg-blue-950/80 text-blue-400 border-blue-800/60 shadow-[0_0_8px_rgba(59,130,246,0.2)]",
          badgePing: "bg-blue-500",
          historyBtnActive: "bg-blue-600 text-white shadow-blue-600/30",
          historyBtnInactive: "text-slate-400 hover:text-blue-400 hover:bg-blue-950/40",
          historyTurnBadge: "bg-blue-950 text-blue-400 border-blue-800",
          iconHover: "text-slate-400 hover:text-blue-400 hover:bg-blue-950/40",
          topicToolbarBg: "bg-slate-900/60 border-b border-blue-950/40",
          topicIcon: "text-blue-400",
          topicChip: "bg-slate-800 text-slate-200 border-slate-700 hover:bg-blue-600 hover:text-white hover:border-blue-500",
          messagesBg: "bg-slate-950/70",
          historyContainerBg: "bg-slate-950/80",
          botAvatar: "bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-blue-600/40",
          botMsgBox: "bg-slate-900 text-slate-100 border-slate-800 hover:border-blue-500/50 shadow-sm",
          userMsgBox: "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-600/25",
          followUpChip: "bg-slate-800/90 hover:bg-gradient-to-r hover:from-blue-600 hover:to-indigo-600 text-slate-200 hover:text-white border-slate-700",
          followUpIcon: "text-blue-400",
          thinkingBox: "bg-slate-900 text-slate-200 border-blue-900/50",
          thinkingDot1: "bg-blue-500",
          thinkingDot2: "bg-indigo-500",
          thinkingDot3: "bg-cyan-400",
          thinkingText: "text-blue-400",
          inputBarBg: "bg-slate-900/90 border-t border-slate-800",
          inputField: "bg-slate-800/80 text-slate-100 placeholder:text-slate-500 border-slate-700 hover:border-blue-500/50 focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500",
          sendBtn: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/30 hover:shadow-blue-600/50",
          historyCard: "bg-slate-900 border-slate-800 hover:border-blue-500/60",
          historyTurnTag: "bg-blue-950/60 text-blue-400 border-blue-900/40",
          historyUserSnippet: "bg-slate-950/60 border-slate-800/80 text-slate-200",
          historyJumpBtn: "bg-blue-950/60 hover:bg-blue-600 hover:text-white text-blue-400 border-blue-900/40",
          historyJumpIcon: "text-blue-400 group-hover:text-white",
          highlightRing: "ring-2 ring-blue-500 shadow-blue-500/30 bg-blue-500/5",
        };
      case "light-porcelain":
        return {
          launcherBtn: "bg-white hover:bg-slate-50 border-slate-300 hover:border-red-500 text-slate-800 ring-1 ring-slate-200/80 hover:ring-red-400/40 shadow-xl",
          launcherHalo: "bg-gradient-to-r from-red-500/40 to-rose-400/40",
          launcherIcon: "text-red-600 group-hover:text-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.4)]",
          drawerContainer: "bg-white/98 border-slate-200 hover:border-red-400/70 shadow-2xl text-slate-800",
          topLightBar: "bg-gradient-to-r from-red-600 via-rose-500 to-red-600",
          headerBg: "bg-slate-50/95 border-b border-slate-200 text-slate-800",
          badge: "bg-red-50 text-red-700 border-red-200 shadow-[0_0_8px_rgba(239,68,68,0.1)]",
          badgePing: "bg-red-500",
          historyBtnActive: "bg-red-600 text-white shadow-red-600/30",
          historyBtnInactive: "text-slate-600 hover:text-red-600 hover:bg-red-50",
          historyTurnBadge: "bg-red-100 text-red-700 border-red-200",
          iconHover: "text-slate-600 hover:text-red-600 hover:bg-red-50",
          topicToolbarBg: "bg-slate-100/90 border-b border-slate-200",
          topicIcon: "text-red-500",
          topicChip: "bg-white text-slate-700 border-slate-200 hover:bg-red-600 hover:text-white hover:border-red-500 shadow-2xs",
          messagesBg: "bg-slate-50/70",
          historyContainerBg: "bg-slate-50/90",
          botAvatar: "bg-gradient-to-br from-red-600 to-rose-700 text-white shadow-red-500/20",
          botMsgBox: "bg-white text-slate-800 border-slate-200 hover:border-red-400/50 shadow-xs",
          userMsgBox: "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-red-600/20",
          followUpChip: "bg-white hover:bg-gradient-to-r hover:from-red-600 hover:to-rose-600 text-slate-700 hover:text-white border-slate-200",
          followUpIcon: "text-red-500",
          thinkingBox: "bg-white text-slate-700 border-red-200/80 shadow-xs",
          thinkingDot1: "bg-red-500",
          thinkingDot2: "bg-rose-500",
          thinkingDot3: "bg-red-400",
          thinkingText: "text-red-600",
          inputBarBg: "bg-slate-50/95 border-t border-slate-200",
          inputField: "bg-white text-slate-800 placeholder:text-slate-400 border-slate-200 hover:border-red-400/50 focus:bg-white focus:ring-2 focus:ring-red-500/40 focus:border-red-500",
          sendBtn: "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-red-600/30 hover:shadow-red-600/50",
          historyCard: "bg-white border-slate-200 hover:border-red-400/60 shadow-xs",
          historyTurnTag: "bg-red-50 text-red-700 border-red-200",
          historyUserSnippet: "bg-slate-50 border-slate-100 text-slate-800",
          historyJumpBtn: "bg-red-50 hover:bg-red-600 hover:text-white text-red-600 border-red-200/70",
          historyJumpIcon: "text-red-600 group-hover:text-white",
          highlightRing: "ring-2 ring-red-500 shadow-red-500/30 bg-red-500/10",
        };
      case "glowing-red":
      default:
        return {
          launcherBtn: "bg-zinc-950/95 hover:bg-black border-zinc-700/80 hover:border-red-500/90 text-white ring-1 ring-white/15 hover:ring-red-500/50",
          launcherHalo: "bg-gradient-to-r from-red-600 to-rose-600",
          launcherIcon: "text-red-500 group-hover:text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]",
          drawerContainer: "bg-white/95 dark:bg-zinc-950/95 border-red-500/30 hover:border-red-500/70 text-slate-900 dark:text-zinc-100",
          topLightBar: "bg-gradient-to-r from-red-600 via-rose-500 to-red-600",
          headerBg: "bg-white/80 dark:bg-zinc-900/80 border-b border-red-100 dark:border-red-950/40 text-slate-900 dark:text-zinc-100",
          badge: "bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/50 shadow-[0_0_8px_rgba(239,68,68,0.15)]",
          badgePing: "bg-red-500",
          historyBtnActive: "bg-red-600 text-white shadow-red-600/30",
          historyBtnInactive: "text-slate-600 dark:text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40",
          historyTurnBadge: "bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800",
          iconHover: "text-slate-500 dark:text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40",
          topicToolbarBg: "bg-slate-50/90 dark:bg-zinc-900/50 border-b border-red-100 dark:border-red-950/30",
          topicIcon: "text-red-500",
          topicChip: "bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border-slate-200/90 dark:border-zinc-700/60 hover:bg-red-600 hover:text-white hover:border-red-500 shadow-2xs",
          messagesBg: "bg-slate-50/40 dark:bg-zinc-950/60",
          historyContainerBg: "bg-slate-50/70 dark:bg-zinc-950/80",
          botAvatar: "bg-gradient-to-br from-red-500 to-rose-700 text-white shadow-red-500/30",
          botMsgBox: "bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 border-slate-200/90 dark:border-zinc-800 hover:border-red-400/50 shadow-sm",
          userMsgBox: "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-red-600/25",
          followUpChip: "bg-white dark:bg-zinc-800/90 hover:bg-gradient-to-r hover:from-red-600 hover:to-rose-600 text-slate-700 dark:text-zinc-200 hover:text-white border-slate-200 dark:border-zinc-700",
          followUpIcon: "text-red-500",
          thinkingBox: "bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 border-red-200/70 dark:border-red-900/50 shadow-md",
          thinkingDot1: "bg-red-500",
          thinkingDot2: "bg-rose-500",
          thinkingDot3: "bg-red-400",
          thinkingText: "text-red-600 dark:text-red-400",
          inputBarBg: "bg-white/90 dark:bg-zinc-900/90 border-t border-slate-200 dark:border-zinc-800",
          inputField: "bg-slate-50 dark:bg-zinc-800/80 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 border-slate-200 dark:border-zinc-700 hover:border-red-400/50 focus:bg-white dark:focus:bg-zinc-800 focus:ring-2 focus:ring-red-500/50 focus:border-red-500",
          sendBtn: "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-red-600/30 hover:shadow-red-600/50",
          historyCard: "bg-white dark:bg-zinc-900 border-slate-200/90 dark:border-zinc-800 hover:border-red-400/60 shadow-xs",
          historyTurnTag: "bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border-red-200/60 dark:border-red-900/40",
          historyUserSnippet: "bg-slate-50 dark:bg-zinc-950/60 border-slate-100 dark:border-zinc-800/80 text-slate-800 dark:text-zinc-200",
          historyJumpBtn: "bg-red-50 dark:bg-red-950/60 hover:bg-red-600 hover:text-white text-red-600 dark:text-red-400 border-red-200/60 dark:border-red-900/40",
          historyJumpIcon: "text-red-600 dark:text-red-400 group-hover:text-white",
          highlightRing: "ring-2 ring-red-500 shadow-red-500/30 bg-red-500/5",
        };
    }
  }, [bgTheme]);

  const handleResetChat = () => {
    // Archive previous non-empty session to session history
    const userMessageCount = messages.filter((m) => m.sender === "user").length;
    if (userMessageCount > 0) {
      const firstUserMsg = messages.find((m) => m.sender === "user");
      const title = firstUserMsg ? firstUserMsg.text.slice(0, 32) + "..." : `Session with ${userMessageCount} turns`;
      const archive: ChatSessionArchive = {
        id: "session-" + Date.now(),
        title,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        messages: [...messages],
      };
      setPastSessions((prev) => [archive, ...prev.slice(0, 9)]);
    }

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
    setShowHistory(false);
  };

  const handleRestoreSession = (archive: ChatSessionArchive) => {
    setMessages(archive.messages);
    setShowHistory(false);
  };

  const handleJumpToTurn = (messageId: string) => {
    setShowHistory(false);
    setHighlightedMsgId(messageId);
    setTimeout(() => {
      const element = document.getElementById(`msg-${messageId}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 150);

    setTimeout(() => {
      setHighlightedMsgId(null);
    }, 2500);
  };

  const handleCopyTurn = (turn: { userMessage: Message; assistantMessage?: Message }) => {
    const textToCopy = `User: ${turn.userMessage.text}\n\nCopilot: ${turn.assistantMessage?.text || "No response"}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedTurnId(turn.userMessage.id);
    setTimeout(() => setCopiedTurnId(null), 2000);
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
          <h5 key={lineIdx} className={`font-bold text-xs mt-1.5 mb-1 flex items-center gap-1.5 ${bgTheme === "light-porcelain" ? "text-slate-900" : "text-white"}`}>
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
          {isBullet && (
            <span className={`font-bold shrink-0 ${bgTheme === "dark-obsidian" ? "text-blue-400" : "text-red-500"}`}>
              •
            </span>
          )}
          <div className="flex-1">
            {parts.map((part, pIdx) => {
              if (part.startsWith("**") && part.endsWith("**")) {
                return (
                  <strong key={pIdx} className={`font-semibold ${bgTheme === "light-porcelain" ? "text-slate-900" : "text-zinc-100"}`}>
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
      {/* Floating Toggle Button with Dynamic Theme Styling */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 group flex items-center gap-3 px-4 py-2.5 sm:px-5 sm:py-3 rounded-full font-sans font-semibold text-xs shadow-2xl transition-all duration-300 chatbot-button-pulse focus:outline-none cursor-pointer backdrop-blur-xl shrink-0 select-none whitespace-nowrap ${themeStyles.launcherBtn}`}
        >
          {/* Dynamic pulsing halo on hover */}
          <div className={`absolute -inset-1 rounded-full blur-md opacity-0 group-hover:opacity-75 transition-opacity duration-500 pointer-events-none -z-10 animate-pulse-glow ${themeStyles.launcherHalo}`}></div>

          <div className={`relative flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 shrink-0 ${themeStyles.launcherIcon}`}>
            <Bot size={19} />
          </div>

          <div className="flex items-center shrink-0">
            <LanternLogo size="sm" showTagline={false} animated={true} />
          </div>
        </button>
      )}

      {/* Floating Chat Drawer / Window with Dynamic Theme Theming */}
      {isOpen && (
        <div
          className={`fixed z-50 bottom-5 right-5 sm:bottom-6 sm:right-6 backdrop-blur-2xl rounded-2xl shadow-2xl flex flex-col chatbot-container-hover transition-all duration-300 overflow-hidden max-w-[calc(100vw-2.5rem)] border ${themeStyles.drawerContainer} ${
            isExpanded ? "w-[94vw] sm:w-[580px] h-[82vh]" : "w-[92vw] sm:w-[420px] h-[580px] max-h-[85vh]"
          }`}
        >
          {/* Top ambient theme light bar */}
          <div className={`h-1 w-full animate-pulse ${themeStyles.topLightBar}`}></div>

          {/* Chat Header */}
          <div className={`px-4 py-3 backdrop-blur-md flex items-center justify-between shrink-0 shadow-xs ${themeStyles.headerBg}`}>
            <div className="flex items-center gap-2.5">
              <LanternLogo size="sm" showTagline={false} animated={true} />
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold flex items-center gap-1 border ${themeStyles.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full animate-ping ${themeStyles.badgePing}`}></span>
                RFQ-2026 AI
              </span>
            </div>

            <div className="flex items-center gap-1">
              {/* Chat Session History Toggle Button with Turn Badge */}
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`p-1.5 px-2.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
                  showHistory ? themeStyles.historyBtnActive : themeStyles.historyBtnInactive
                }`}
                title={showHistory ? "Return to active chat" : "View session turn history"}
              >
                <History size={13} />
                <span className="text-[11px] font-sans font-medium">{showHistory ? "Chat" : "History"}</span>
                {sessionTurns.length > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold font-mono ${
                      showHistory
                        ? "bg-white text-slate-900"
                        : themeStyles.historyTurnBadge
                    }`}
                  >
                    {sessionTurns.length}
                  </span>
                )}
              </button>

              <button
                onClick={handleResetChat}
                className={`p-1.5 rounded-lg transition-all duration-200 cursor-pointer hover:rotate-180 ${themeStyles.iconHover}`}
                title="Restart conversation & archive to history"
              >
                <RotateCcw size={14} />
              </button>

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`p-1.5 rounded-lg transition-all duration-200 cursor-pointer hover:scale-110 ${themeStyles.iconHover}`}
                title={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-rose-600 transition-all duration-200 cursor-pointer hover:rotate-90"
                title="Close chat"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Quick Interactive Topic Toolbar (Visible only when in active chat view) */}
          {!showHistory && (
            <div className={`px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 ${themeStyles.topicToolbarBg}`}>
              <span className="text-[10px] font-mono font-semibold uppercase shrink-0 flex items-center gap-1 text-slate-400">
                <Sparkles size={10} className={themeStyles.topicIcon} />
                Topics:
              </span>
              {TOPIC_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(preset.query)}
                  disabled={loading}
                  className={`shrink-0 text-[10px] font-sans px-2.5 py-1 rounded-md border transition-all duration-200 font-medium cursor-pointer shadow-2xs chatbot-chip-hover ${themeStyles.topicChip}`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          )}

          {/* CHAT SESSION HISTORY VIEW */}
          {showHistory ? (
            <div className={`flex-1 overflow-y-auto p-4 space-y-4 text-xs font-sans ${themeStyles.historyContainerBg}`}>
              {/* History Search & Stats Header */}
              <div className="space-y-2.5 pb-3 border-b border-slate-200/40 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold">
                    <History size={14} className={themeStyles.topicIcon} />
                    <span>Session Turn History</span>
                  </div>
                  <span className="font-mono text-[11px] opacity-70">
                    {sessionTurns.length} {sessionTurns.length === 1 ? "turn recorded" : "turns recorded"}
                  </span>
                </div>

                {/* History Search Input */}
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
                  <input
                    type="text"
                    value={historySearchQuery}
                    onChange={(e) => setHistorySearchQuery(e.target.value)}
                    placeholder="Search previous queries or topics..."
                    className={`w-full pl-8 pr-8 py-2 text-xs rounded-xl border outline-none transition-all ${themeStyles.inputField}`}
                  />
                  {historySearchQuery && (
                    <button
                      onClick={() => setHistorySearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* Turn List */}
              {sessionTurns.length === 0 ? (
                <div className="py-12 text-center space-y-2 opacity-70">
                  <div className="w-10 h-10 mx-auto rounded-full bg-slate-500/10 flex items-center justify-center">
                    <Clock size={18} />
                  </div>
                  <p className="font-medium text-xs">No conversation turns recorded yet.</p>
                  <p className="text-[11px] max-w-xs mx-auto opacity-75">
                    Ask Copilot questions in the chat to build up an audit trail of evaluation turns.
                  </p>
                  <button
                    onClick={() => setShowHistory(false)}
                    className={`mt-2 text-xs font-semibold hover:underline cursor-pointer inline-flex items-center gap-1 ${bgTheme === "dark-obsidian" ? "text-blue-400" : "text-red-500"}`}
                  >
                    Start asking now <ArrowRight size={12} />
                  </button>
                </div>
              ) : filteredTurns.length === 0 ? (
                <div className="py-8 text-center opacity-70">
                  <p className="text-xs">No matching turns found for "{historySearchQuery}"</p>
                  <button
                    onClick={() => setHistorySearchQuery("")}
                    className={`text-xs underline mt-1.5 cursor-pointer ${bgTheme === "dark-obsidian" ? "text-blue-400" : "text-red-500"}`}
                  >
                    Clear search filter
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTurns.map((turn) => {
                    const isCopied = copiedTurnId === turn.userMessage.id;
                    return (
                      <div
                        key={turn.userMessage.id}
                        className={`rounded-xl p-3.5 shadow-xs hover:shadow-md transition-all duration-200 space-y-2.5 border ${themeStyles.historyCard}`}
                      >
                        {/* Turn Header */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-white">
                              Turn #{turn.turnIndex}
                            </span>
                            <span className={`font-mono text-[10px] px-2 py-0.5 rounded-md border ${themeStyles.historyTurnTag}`}>
                              {turn.topicTag}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono opacity-60">
                            {turn.userMessage.time}
                          </span>
                        </div>

                        {/* User Prompt */}
                        <div className={`p-2.5 rounded-lg border ${themeStyles.historyUserSnippet}`}>
                          <div className="flex items-start gap-2">
                            <User size={13} className="opacity-60 shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold line-clamp-2">
                                {turn.userMessage.text}
                              </p>
                              <div className="flex items-center gap-1 mt-1.5 text-[10px] font-mono opacity-60">
                                <Clock size={10} className="shrink-0" />
                                <span>Sent at {turn.userMessage.time}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Assistant Answer Preview */}
                        {turn.assistantMessage && (
                          <div className="pl-1 pt-1">
                            <div className="flex items-start gap-2 text-[11px] opacity-85">
                              <Bot size={13} className={`shrink-0 mt-0.5 ${themeStyles.topicIcon}`} />
                              <div className="flex-1 min-w-0">
                                <p className="line-clamp-3 leading-relaxed">
                                  {turn.assistantMessage.text.replace(/###|\*|•/g, "").slice(0, 180)}...
                                </p>
                                <div className="flex items-center gap-1 mt-1.5 text-[10px] font-mono opacity-60">
                                  <Clock size={10} className="shrink-0" />
                                  <span>Replied at {turn.assistantMessage.time}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Turn Action Bar */}
                        <div className="pt-2 border-t border-slate-200/30 dark:border-zinc-800/80 flex items-center justify-between gap-2">
                          <button
                            onClick={() => handleCopyTurn(turn)}
                            className="text-[11px] font-mono flex items-center gap-1 opacity-70 hover:opacity-100 transition-colors cursor-pointer"
                            title="Copy query and answer to clipboard"
                          >
                            {isCopied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                            <span>{isCopied ? "Copied" : "Copy Q&A"}</span>
                          </button>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setShowHistory(false);
                                handleSendMessage(turn.userMessage.text);
                              }}
                              className={`text-[11px] font-mono flex items-center gap-1 opacity-70 hover:opacity-100 transition-colors cursor-pointer`}
                              title="Re-run this query"
                            >
                              <RotateCcw size={11} />
                              <span>Re-run</span>
                            </button>

                            <button
                              onClick={() => handleJumpToTurn(turn.userMessage.id)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer flex items-center gap-1 shadow-2xs ${themeStyles.historyJumpBtn}`}
                            >
                              <span>Jump to message</span>
                              <ArrowRight size={11} className={themeStyles.historyJumpIcon} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Archived Past Sessions (If user reset previously) */}
              {pastSessions.length > 0 && (
                <div className="pt-4 border-t border-slate-200/40 dark:border-zinc-800 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-semibold opacity-75">
                    <span>Archived Sessions from this Visit</span>
                    <span className="font-mono text-[10px] opacity-60">{pastSessions.length} saved</span>
                  </div>

                  <div className="space-y-2">
                    {pastSessions.map((session) => (
                      <div
                        key={session.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs ${themeStyles.historyCard}`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{session.title}</p>
                          <p className="text-[10px] font-mono opacity-60">
                            {session.messages.length} messages • {session.timestamp}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRestoreSession(session)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border transition-all cursor-pointer ${themeStyles.topicChip}`}
                        >
                          Restore
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ACTIVE MESSAGES SCROLL AREA */
            <div className={`flex-1 overflow-y-auto p-4 space-y-4 text-xs font-sans ${themeStyles.messagesBg}`}>
              {messages.map((msg) => {
                const isAssistant = msg.sender === "assistant";
                const isHighlighted = highlightedMsgId === msg.id;

                return (
                  <div
                    key={msg.id}
                    id={`msg-${msg.id}`}
                    className={`space-y-2 group/msg rounded-2xl transition-all duration-500 ${
                      isHighlighted ? themeStyles.highlightRing : ""
                    }`}
                  >
                    <div className={`flex gap-2.5 ${isAssistant ? "justify-start" : "justify-end"}`}>
                      {isAssistant && (
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 group-hover/msg:scale-110 transition-transform duration-300 ${themeStyles.botAvatar}`}>
                          <Bot size={14} className="drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]" />
                        </div>
                      )}

                      <div
                        className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 leading-relaxed transition-all duration-300 border ${
                          isAssistant
                            ? `rounded-tl-xs ${themeStyles.botMsgBox}`
                            : `rounded-tr-xs ${themeStyles.userMsgBox}`
                        }`}
                      >
                        <div>{renderFormattedText(msg.text)}</div>
                        <div
                          className={`text-[10px] font-mono mt-1.5 pt-1 flex items-center gap-1 border-t ${
                            isAssistant
                              ? "border-slate-200/40 dark:border-zinc-800/60 opacity-60 justify-start"
                              : "border-white/20 text-white/90 justify-end"
                          }`}
                        >
                          <Clock size={9} className="shrink-0 opacity-75" />
                          <span>{msg.time}</span>
                        </div>
                      </div>

                      {!isAssistant && (
                        <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm group-hover/msg:scale-110 transition-transform duration-300">
                          <User size={14} />
                        </div>
                      )}
                    </div>

                    {/* Interactive Follow-Up Chips for Assistant Message */}
                    {isAssistant && msg.followUps && msg.followUps.length > 0 && (
                      <div className="pl-9 pr-2 pt-1 flex flex-wrap items-center gap-1.5 animate-fadeIn">
                        <span className="text-[10px] font-mono font-medium opacity-60 flex items-center gap-1">
                          <Sparkles size={11} className={themeStyles.followUpIcon} />
                          <span>Suggested follow-ups:</span>
                        </span>
                        {msg.followUps.map((chip, chipIdx) => (
                          <button
                            key={chipIdx}
                            onClick={() => handleSendMessage(chip)}
                            disabled={loading}
                            className={`text-[11px] font-sans px-3 py-1 rounded-full border transition-all duration-200 flex items-center gap-1.5 shadow-2xs chatbot-chip-hover text-left cursor-pointer ${themeStyles.followUpChip}`}
                          >
                            <span>{chip}</span>
                            <ArrowRight size={10} className={`${themeStyles.followUpIcon} group-hover:text-white group-hover:translate-x-0.5 transition-all`} />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {loading && (
                <div className="flex gap-2.5 justify-start items-start animate-fadeIn">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 relative group ${themeStyles.botAvatar}`}>
                    <Bot size={14} className="drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]" />
                    <span className="absolute -inset-0.5 rounded-full bg-white/30 animate-ping pointer-events-none"></span>
                  </div>
                  <div className={`rounded-2xl rounded-tl-xs px-4 py-3 flex flex-col gap-1.5 max-w-[88%] border ${themeStyles.thinkingBox}`}>
                    {/* Pulsing Dots Row */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 px-1 py-0.5">
                        <span className={`w-2 h-2 rounded-full animate-thinking-dot-1 ${themeStyles.thinkingDot1}`}></span>
                        <span className={`w-2 h-2 rounded-full animate-thinking-dot-2 ${themeStyles.thinkingDot2}`}></span>
                        <span className={`w-2 h-2 rounded-full animate-thinking-dot-3 ${themeStyles.thinkingDot3}`}></span>
                      </div>
                      <span className={`font-mono text-[11px] font-semibold uppercase tracking-wider ${themeStyles.thinkingText}`}>
                        AI is thinking...
                      </span>
                    </div>

                    {/* Context note */}
                    <p className="text-[11px] font-sans opacity-70 leading-snug">
                      Synthesizing quote parameters, SLAs, and governance constraints...
                    </p>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Input Bar with Dynamic Theme Colors */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className={`p-3 backdrop-blur-md flex items-center gap-2 shrink-0 shadow-xs ${themeStyles.inputBarBg}`}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Copilot about pricing, warranties, lead times..."
              className={`flex-1 px-3.5 py-2.5 text-xs font-sans rounded-xl border transition-all outline-none ${themeStyles.inputField}`}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className={`p-2.5 rounded-xl disabled:opacity-40 transition-all hover:scale-105 active:scale-95 shrink-0 cursor-pointer ${themeStyles.sendBtn}`}
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
