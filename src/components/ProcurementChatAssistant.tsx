import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
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
  ShieldCheck,
  AppWindow,
  Activity,
  Network,
  LayoutGrid,
  Columns,
  Globe,
  TrendingUp,
  TrendingDown,
  Minus,
  Newspaper,
  Flame,
  FileCheck,
  Building2,
  Scale,
  Zap,
  Radio,
  Loader2,
  Tag,
  BookOpen,
} from "lucide-react";
import {
  StructuredVendorData,
  VendorScores,
  DecisionWeights,
  RecommendationResult,
  SignOffRecord,
  VendorRawQuotes,
  BackgroundTheme,
  VendorBinaryGateMap,
} from "../types";
import { VENDOR_NAMES } from "../data";
import { LanternLogo } from "./LanternLogo";
import { FluentSpotlightCard } from "./FluentSpotlightCard";
import { LantraAvatar, LantraHeroCard } from "./LantraAvatar";
import {
  LANTRA_MARKET_INDICATORS,
  LANTRA_PROCUREMENT_NEWS,
  generateLantraStateInsights,
  MarketIndicator,
  ProcurementNewsItem,
} from "../services/lantraKnowledge";
import { MarketMaterialAlert } from "../services/marketAlertEngine";
import { AppLanguage, TRANSLATIONS } from "../translations";

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  time: string;
  followUps?: string[];
  newsCitation?: {
    headline: string;
    source: string;
    category: string;
  };
}

export interface RealtimeNewsArticle {
  id: string;
  title: string;
  source: string;
  timeAgo: string;
  category: "software" | "hardware" | "saudi" | "logistics" | "finance" | "all";
  categoryLabel?: string;
  summary: string;
  impactOnRFQ: string;
  recommendedAction: string;
  chatSummaryPrompt: string;
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
  isOpenControlled?: boolean;
  onOpenChange?: (open: boolean) => void;
  externalTriggerPrompt?: string | null;
  onClearTriggerPrompt?: () => void;
  lang?: AppLanguage;
  activeMarketAlert?: MarketMaterialAlert | null;
  onTriggerMarketAlert?: (alert: MarketMaterialAlert) => void;
}

const TOPIC_PRESETS_EN = [
  { label: "💻 Software & SaaS Licensing", query: "Analyze enterprise software, hypervisor licensing (VMware Broadcom shift), database core pricing, and Saudi NCA cybersecurity compliance across vendor bids" },
  { label: "🖥️ Hardware & Server Specs", query: "Evaluate enterprise server hardware, DDR5 ECC memory allocations, NVMe Gen5 SSDs, and processor lead times across all vendors" },
  { label: "🛑 Mandatory Gates (YES/NO)", query: "Summarize the compliance and failover verification gate statuses for all vendors. Which are disqualified and why?" },
  { label: "💰 5-Year TCO & Price Variance", query: "Give me a deep dive breakdown on pricing, 5-year TCO, and ROI across all vendors" },
  { label: "🇸🇦 Saudi Local Content (LCGPA)", query: "Analyze how Saudi Local Content (LCGPA 35% threshold) and IKTVA ratios impact the vendor rankings and tender award eligibility" },
  { label: "⏱️ Delivery Lead Times & Red Sea", query: "Analyze deployment schedules, factory staging, and cargo transit lead time risks for each vendor" },
  { label: "🛡️ Warranties & 24/7 SLAs", query: "Detailed comparison of warranty length, replacement parts SLAs, and response times" },
  { label: "⚠️ Risk & Failover Architecture", query: "What are the major technical redundancy, active-active failover, and NCA cybersecurity compliance risks?" },
  { label: "✍️ 3-Tier Multi-Sign-Off", query: "What is the current 3-tier governance sign-off status and approval audit trail?" },
  { label: "📈 Global Chip & Memory Market", query: "How do global enterprise DDR5 memory prices and semiconductor lead times affect our BAFO negotiations?" },
];

const TOPIC_PRESETS_AR = [
  { label: "💻 تراخيص البرمجيات والمحاكاة", query: "حلل أثر تحولات تراخيص برمجيات المؤسسات والمحاكاة الافتراضية (VMware/KVM، قواعد البيانات، واشتراكات التشغيل) على عروض الموردين" },
  { label: "🖥️ عتاد الخوادم والذاكرة المؤسسية", query: "قيم مواصفات عتاد الخوادم، وذاكرة DDR5 ECC، ووحدات تخزين NVMe Gen5، وجداول توريد المعالجات لدى الموردين" },
  { label: "🛑 بوابات الامتثال الإلزامية", query: "لخص حالة بوابات الامتثال وتجاوز الأعطال لجميع الموردين. من تم استبعاده ولماذا؟" },
  { label: "💰 السعر وتكلفة الملكية TCO", query: "قدم تحليلاً مالياً شاملاً للأسعار، والتكلفة الإجمالية للملكية على مدار 5 سنوات وعائد الاستثمار" },
  { label: "🇸🇦 المحتوى المحلي (LCGPA)", query: "حلل أثر معايير هيئة المحتوى المحلي (نسبة 35% الإلزامية) وبرنامج اكتفاء على تقييم وترسية المنافسة" },
  { label: "⏱️ مدد التوريد والشحن", query: "حلل الجداول الزمنية للتوريد ومسارات الشحن الجوي والبحري ومخاطر التأخير لكل مورد" },
  { label: "🛡️ فترات الضمان والدعم 24/7", query: "مقارنة تفصيلية لفترات الضمان، قطع الغيار، واتفاقيات مستوى الخدمة (SLA)" },
  { label: "⚠️ تقييم المخاطر وتجاوز الأعطال", query: "ما هي أهم المخاطر الفنية ومخاطر استمرارية الأعمال وضوابط الهيئة الوطنية للأمن السيبراني NCA؟" },
  { label: "✍️ سجل الاعتماد ثلاثي المستويات", query: "ما هي حالة الاعتماد الحالية وسجل التوقيعات الثلاثية المكتملة؟" },
  { label: "📈 أسواق الرقائق والذاكرة عالمياً", query: "كيف تؤثر تقلبات أسعار ذاكرة الخوادم وسلاسل الإمداد العالمية على مفاوضات العرض النهائي BAFO؟" },
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
  isOpenControlled,
  onOpenChange,
  externalTriggerPrompt,
  onClearTriggerPrompt,
  lang = "en",
  activeMarketAlert,
  onTriggerMarketAlert,
}: Props) {
  const isAr = lang === "ar";
  const t = TRANSLATIONS[lang];
  const TOPIC_PRESETS = isAr ? TOPIC_PRESETS_AR : TOPIC_PRESETS_EN;

  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = isOpenControlled !== undefined ? isOpenControlled : internalIsOpen;
  const setIsOpen = (open: boolean) => {
    setInternalIsOpen(open);
    onOpenChange?.(open);
  };

  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"fluent-hub" | "chat" | "market-intel" | "history">("fluent-hub");
  const [showSplitView, setShowSplitView] = useState(false);
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  const [copiedTurnId, setCopiedTurnId] = useState<string | null>(null);
  const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null);
  const [pastSessions, setPastSessions] = useState<ChatSessionArchive[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [drawerMouse, setDrawerMouse] = useState({ x: -1000, y: -1000 });
  const [isDrawerHovered, setIsDrawerHovered] = useState(false);

  // Real-time Google Search Grounded News State
  const [newsArticles, setNewsArticles] = useState<RealtimeNewsArticle[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsMarketPulse, setNewsMarketPulse] = useState<string>("");
  const [newsLastUpdated, setNewsLastUpdated] = useState<string | null>(null);
  const [selectedNewsCategory, setSelectedNewsCategory] = useState<"all" | "software" | "hardware" | "saudi" | "logistics" | "finance">("all");
  const [newsSearchInput, setNewsSearchInput] = useState("");
  const [activeNewsQuery, setActiveNewsQuery] = useState("");
  const [isLiveStreaming, setIsLiveStreaming] = useState(true);

  // Fetch real-time Google Search grounded procurement news
  const fetchRealtimeNews = useCallback(async (cat = selectedNewsCategory, customQuery = "", forceRefresh = false) => {
    setNewsLoading(true);
    try {
      const res = await fetch("/api/realtime-procurement-news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: cat,
          query: customQuery,
          lang,
          refresh: forceRefresh,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to fetch news");
      }

      const data = await res.json();
      if (Array.isArray(data.articles)) {
        setNewsArticles(data.articles);
      }
      if (data.marketPulse) {
        setNewsMarketPulse(data.marketPulse);
      }
      setNewsLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } catch (err) {
      console.warn("Failed to fetch real-time news, falling back to knowledge base:", err);
    } finally {
      setNewsLoading(false);
    }
  }, [selectedNewsCategory, lang]);

  // Initial load of news when opening or changing language
  useEffect(() => {
    fetchRealtimeNews("all", "");
  }, [lang]);

  // Live real-time background news polling (every 60s when live stream is active)
  useEffect(() => {
    if (!isLiveStreaming) return;
    const interval = setInterval(() => {
      // Background silent refresh
      fetchRealtimeNews(selectedNewsCategory, newsSearchInput, false);
    }, 60000);
    return () => clearInterval(interval);
  }, [isLiveStreaming, selectedNewsCategory, newsSearchInput, fetchRealtimeNews]);

  // Proactive State Insights
  const stateInsights = useMemo(() => {
    return generateLantraStateInsights({
      structuredData,
      scores,
      weights: weights as unknown as Record<string, number>,
      recommendation,
      signoff,
      binaryGates,
    });
  }, [structuredData, scores, weights, recommendation, signoff, binaryGates]);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "assistant",
      text: isAr
        ? "مرحباً بك! أنا لانـتـرا (LANTRA)، مساعدك الذكي المتكامل للمشتريات والذكاء السوقي لتقييم RFQ-2026 وحوكمة رؤية 2030. كيف يمكنني مساعدتك اليوم؟"
        : "Hello! I am LANTRA, your AI Procurement & Market Intelligence Copilot for RFQ-2026. What specific vendor aspect or market trend would you like to explore?",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      followUps: isAr
        ? [
            "مقارنة الأسعار وتكلفة الملكية TCO",
            "تحليل الامتثال لمعايير المحتوى المحلي LCGPA",
            "عرض مخاطر بوابات الامتثال الإلزامية",
            "استعراض توصية الترسية التنفيذية",
          ]
        : [
            "Compare prices & 5-year TCO",
            "Analyze Saudi Local Content (LCGPA)",
            "Show mandatory binary gate risks",
            "What is the recommended winner?",
          ],
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen && activeTab === "chat") {
      scrollToBottom();
    }
  }, [messages, isOpen, activeTab]);

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

        const qLower = userMsg.text.toLowerCase();
        let topicTag = isAr ? "عام" : "General";
        if (qLower.includes("price") || qLower.includes("cost") || qLower.includes("budget") || qLower.includes("saving") || qLower.includes("tco") || qLower.includes("سعر") || qLower.includes("تكلفة")) {
          topicTag = isAr ? "الأسعار والتكلفة" : "Pricing & TCO";
        } else if (qLower.includes("lead") || qLower.includes("time") || qLower.includes("deliver") || qLower.includes("schedule") || qLower.includes("توريد") || qLower.includes("شحن")) {
          topicTag = isAr ? "مدد التوريد" : "Lead Time";
        } else if (qLower.includes("local") || qLower.includes("lcgpa") || qLower.includes("iktva") || qLower.includes("محتوى") || qLower.includes("سعودي")) {
          topicTag = isAr ? "المحتوى المحلي" : "Local Content";
        } else if (qLower.includes("warranty") || qLower.includes("sla") || qLower.includes("support") || qLower.includes("ضمان") || qLower.includes("دعم")) {
          topicTag = isAr ? "الضمان والدعم" : "Warranty & SLA";
        } else if (qLower.includes("risk") || qLower.includes("failover") || qLower.includes("compliance") || qLower.includes("مخاطر") || qLower.includes("أعطال")) {
          topicTag = isAr ? "المخاطر والامتثال" : "Risk & Failover";
        } else if (qLower.includes("sign") || qLower.includes("approve") || qLower.includes("governance") || qLower.includes("اعتماد") || qLower.includes("توقيع")) {
          topicTag = isAr ? "الحوكمة والاعتماد" : "Governance";
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
  }, [messages, isAr]);

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

  // Derive dynamic theme styling tokens
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
          tabActive: "bg-blue-600 text-white shadow-blue-600/30",
          tabInactive: "text-slate-400 hover:text-white hover:bg-blue-950/40",
          messagesBg: "bg-slate-950/70",
          botMsgBox: "bg-slate-900 text-slate-100 border-slate-800 hover:border-blue-500/50 shadow-sm",
          userMsgBox: "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-600/25",
          followUpChip: "bg-slate-800/90 hover:bg-gradient-to-r hover:from-blue-600 hover:to-indigo-600 text-slate-200 hover:text-white border-slate-700",
          inputBarBg: "bg-slate-900/90 border-t border-slate-800",
          inputField: "bg-slate-800/80 text-slate-100 placeholder:text-slate-500 border-slate-700 hover:border-blue-500/50 focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500",
          sendBtn: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/30",
        };
      case "light-porcelain":
        return {
          launcherBtn: "bg-white hover:bg-slate-50 border-slate-300 hover:border-blue-500 text-slate-800 ring-1 ring-slate-200/80 hover:ring-blue-400/40 shadow-xl",
          launcherHalo: "bg-gradient-to-r from-blue-500/40 to-cyan-400/40",
          launcherIcon: "text-blue-600 group-hover:text-blue-500 drop-shadow-[0_0_6px_rgba(37,99,235,0.4)]",
          drawerContainer: "bg-white/98 border-slate-200 hover:border-blue-400/70 shadow-2xl text-slate-800",
          topLightBar: "bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600",
          headerBg: "bg-slate-50/95 border-b border-slate-200 text-slate-800",
          badge: "bg-blue-50 text-blue-700 border-blue-200 shadow-[0_0_8px_rgba(37,99,235,0.1)]",
          badgePing: "bg-blue-500",
          tabActive: "bg-blue-600 text-white shadow-blue-600/30",
          tabInactive: "text-slate-600 hover:text-blue-600 hover:bg-blue-50",
          messagesBg: "bg-slate-50/70",
          botMsgBox: "bg-white text-slate-800 border-slate-200 hover:border-blue-400/50 shadow-xs",
          userMsgBox: "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-blue-600/20",
          followUpChip: "bg-white hover:bg-gradient-to-r hover:from-blue-600 hover:to-cyan-600 text-slate-700 hover:text-white border-slate-200",
          inputBarBg: "bg-slate-50/95 border-t border-slate-200",
          inputField: "bg-white text-slate-800 placeholder:text-slate-400 border-slate-200 hover:border-blue-400/50 focus:bg-white focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500",
          sendBtn: "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-blue-600/30",
        };
      default:
        return {
          launcherBtn: "bg-zinc-950/95 hover:bg-black border-cyan-500/40 hover:border-cyan-400 text-white ring-1 ring-cyan-500/30 shadow-[0_0_25px_rgba(6,182,212,0.3)]",
          launcherHalo: "bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500",
          launcherIcon: "text-cyan-400 group-hover:text-cyan-300 drop-shadow-[0_0_10px_rgba(6,182,212,0.9)]",
          drawerContainer: "bg-zinc-950/95 border-zinc-700/80 hover:border-cyan-500/60 text-zinc-100 shadow-[0_20px_60px_rgba(0,0,0,0.85)]",
          topLightBar: "bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500",
          headerBg: "bg-zinc-900/90 border-b border-white/10 text-zinc-100",
          badge: "bg-cyan-950/60 text-cyan-400 border-cyan-800/50 shadow-[0_0_8px_rgba(6,182,212,0.2)]",
          badgePing: "bg-cyan-400",
          tabActive: "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-sm shadow-blue-600/30",
          tabInactive: "text-zinc-400 hover:text-white hover:bg-white/5",
          messagesBg: "bg-zinc-950/80",
          botMsgBox: "bg-zinc-900 text-zinc-100 border-white/10 hover:border-cyan-500/40 shadow-sm",
          userMsgBox: "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-blue-600/25",
          followUpChip: "bg-zinc-900 hover:bg-gradient-to-r hover:from-blue-600 hover:to-cyan-600 text-zinc-300 hover:text-white border-white/10 hover:border-cyan-400",
          inputBarBg: "bg-zinc-900/95 border-t border-white/10",
          inputField: "bg-zinc-950/90 text-zinc-100 placeholder:text-zinc-500 border-zinc-700/80 hover:border-cyan-500/50 focus:bg-zinc-900 focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500",
          sendBtn: "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold shadow-cyan-500/30",
        };
    }
  }, [bgTheme]);

  const handleResetChat = () => {
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
        text: isAr
          ? "تمت إعادة تشغيل المحادثة. أنا لانـتـرا (LANTRA)، كيف يمكنني مساعدتك الآن في تحليل المنافسة واستراتيجيات الشراء؟"
          : "Conversation restarted. I am LANTRA, ready to assist with RFQ-2026 vendor evaluations, 5-year TCO, and Saudi Vision 2030 compliance.",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        followUps: isAr
          ? ["مقارنة الأسعار وتكلفة الملكية TCO", "تحليل معايير هيئة المحتوى المحلي LCGPA", "فحص بوابات الامتثال الإلزامية"]
          : ["Compare prices & 5-year TCO", "Analyze Saudi Local Content (LCGPA)", "Check mandatory binary gates"],
      },
    ]);
    setActiveTab("fluent-hub");
  };

  const handleRestoreSession = (archive: ChatSessionArchive) => {
    setMessages(archive.messages);
    setActiveTab("chat");
  };

  const handleJumpToTurn = (messageId: string) => {
    setActiveTab("chat");
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
    const textToCopy = `User: ${turn.userMessage.text}\n\nLANTRA: ${turn.assistantMessage?.text || "No response"}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedTurnId(turn.userMessage.id);
    setTimeout(() => setCopiedTurnId(null), 2000);
  };

  // Helper to parse follow-ups from raw AI response text
  const parseMessageAndFollowups = (rawText: string): { mainText: string; followUps: string[] } => {
    const followUpMarker = /(Suggested follow-ups?:?|الأسئلة المقترحة:?)/i;
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

  // Fallback local response generator
  const generateFallbackAnswer = (query: string): { mainText: string; followUps: string[] } => {
    const q = query.toLowerCase();

    if (!structuredData) {
      return {
        mainText: isAr
          ? "لم يتم تحميل بيانات الموردين القياسية بعد. يرجى الضغط على 'استخراج وتوحيد العروض' لتحميل البيانات."
          : "No standardized vendor data is currently loaded. Please load proposal data.",
        followUps: isAr ? ["تحميل عروض تجريبية", "ضبط الأوزان الافتراضية"] : ["Extract sample quotes", "Load default weights"],
      };
    }

    if (q.includes("price") || q.includes("cost") || q.includes("tco") || q.includes("سعر") || q.includes("تكلفة")) {
      return {
        mainText: isAr
          ? `### 💰 التحليل المالي وتكلفة الملكية الإجمالية (TCO على مدى 5 سنوات)

• **آيرون كلاد (Ironclad Tech)**: **$118,500** (444,375 ريال) — *الأقل تكلفة مبدئية*
  - الأجهزة: $98,500 | التركيب والدعم لـ 3 سنوات: $20,000
  - التوفير الأولي مقارنة بميريديان: **10.2% ($13,500)**

• **فانتاج سيستمز (Vantage Systems)**: **$124,000** (465,000 ريال)
  - الأجهزة: $108,000 | التوريد المعجل: $16,000
  - ⚠️ تكلفة الملكية لـ 5 سنوات ترتفع بسبب رسوم الصيانة الإضافية ($60,000 بعد السنة الثانية).

• **ميريديان سوليوشنز (Meridian Solutions)**: **$132,000** (495,000 ريال) — *العرض الشامل الأفضل TCO*
  - يشمل **5 سنوات ضمان شامل ودعم 24/7 بموقع العمل**، مما يوفر $24,000+ في عقود الصيانة الممتدة.`
          : `### 💰 5-Year TCO & Price Variance Analysis

• **Ironclad Tech**: **$118,500** (SAR 444,375) — *Lowest Upfront Cost*
  - Hardware: $98,500 | 3-Year Support: $20,000
  - Initial savings vs Meridian: **$13,500 (10.2%)**

• **Vantage Systems**: **$124,000** (SAR 465,000)
  - Hardware: $108,000 | Fast Deployment: $16,000
  - ⚠️ Disqualified under continuous failover gate; 5-Year TCO surges due to $60,000 extended maintenance.

• **Meridian Solutions**: **$132,000** (SAR 495,000) — *Best 5-Year Net Value*
  - Includes **5 years full onsite 24/7 SLA**, saving $24,000+ compared to procuring annual maintenance separately.`,
        followUps: isAr
          ? ["مقارنة المحتوى المحلي LCGPA", "تحليل مدد التوريد والشحن", "عرض مسودة خطاب التفاوض BAFO"]
          : ["Compare Saudi Local Content", "Analyze lead times & shipping", "Draft BAFO counter-offer"],
      };
    }

    if (q.includes("local") || q.includes("lcgpa") || q.includes("iktva") || q.includes("محتوى") || q.includes("سعودي")) {
      return {
        mainText: isAr
          ? `### 🇸🇦 الامتثال لهيئة المحتوى المحلي (LCGPA) وبرنامج اكتفاء (IKTVA)

• **ميريديان سوليوشنز (Meridian Solutions)**: **48.0% محتوى محلي** | **62% اكتفاء (IKTVA)** 🏆
  - تتجاوز الحد الإلزامي لهيئة المحتوى المحلي (35%) بهامش **+13.0%**.
  - مؤهلة للحصول على أفضلية سعرية بنسبة 10% بموجب نظام المنافسات والمشتريات الحكومية.
  - مركز صيانة محلي معتمد في الرياض وجدة مع مهندسين سعوديين مرخصين.

• **آيرون كلاد (Ironclad Tech)**: **32.0% محتوى محلي** | **45% اكتفاء (IKTVA)** ⚠️
  - أقل من الحد الأدنى الإلزامي (35%) بنسبة 3%، مما يعرضها للاستبعاد في المنافسات الحكومية الكبرى ما لم تقدم خطة توطين تعويضية.

• **فانتاج سيستمز (Vantage Systems)**: **18.0% محتوى محلي** | **22% اكتفاء (IKTVA)** ❌
  - نسبة متدنية جداً (استيراد مباشر دون وجود شراكات تصنيع أو خدمات محلية).`
          : `### 🇸🇦 Saudi Vision 2030 Local Content & LCGPA Regulatory Analysis

• **Meridian Solutions**: **48.0% Local Content** | **62% IKTVA Ratio** 🏆
  - Exceeds LCGPA mandatory 35% baseline by **+13.0%**.
  - Qualifies for 10% price preference under Saudi Government Tender & Procurement Law (GTPL).
  - Riyadh & Jeddah local repair centers with certified Saudi support engineers.

• **Ironclad Tech**: **32.0% Local Content** | **45% IKTVA Ratio** ⚠️
  - Falls 3.0% below the 35% mandatory threshold; requires a local subcontracting commitment.

• **Vantage Systems**: **18.0% Local Content** | **22% IKTVA Ratio** ❌
  - Non-compliant with statutory local content mandates.`,
        followUps: isAr
          ? ["تعديل وزن المحتوى المحلي إلى 25%", "فحص بوابات الامتثال الإلزامية", "استعراض التوصية النهائية"]
          : ["Increase Local Content weight to 25%", "Check mandatory binary gates", "View executive recommendation"],
      };
    }

    if (
      q.includes("software") ||
      q.includes("برمج") ||
      q.includes("ترخيص") ||
      q.includes("vmware") ||
      q.includes("broadcom") ||
      q.includes("licens") ||
      q.includes("saas") ||
      q.includes("oracle") ||
      q.includes("افتراض")
    ) {
      return {
        mainText: isAr
          ? `### 💻 التحليل الاستراتيجي لتراخيص البرمجيات المؤسسية والمحاكاة الافتراضية

بصفتي المستشار الاستباقي للمشتريات (LANTRA)، قمت بتحليل أثر تحول سياسات التراخيص العالمية (مثل فرض اشتراكات VMware لكل نواة بنسبة +35%) على عروض RFQ-2026:

1. **تقييم الموردين في حزم البرمجيات والمحاكاة الافتراضية**:
   - **شركة ميريديان (Meridian Solutions) — 🟢 الأكثر مرونة وتوفيراً**:
     - تدعم الخوادم بنية المحاكاة المفتوحة KVM وحلول Nutanix، وتتضمن رخص OEM مدمجة توفر قرابة $42,000 من نفقات التشغيل (OPEX) خلال 5 سنوات.
   - **شركة آيرون كلاد (Ironclad Systems) — 🟡 حزمة جيدة مع مخاطر تجديد**:
     - تشمل برمجيات إدارة العتاد لـ 3 سنوات؛ يتطلب التفاوض وضع سقف لزيادة التجديد للعامين 4 و5.
   - **أنظمة فانتاج (Vantage Systems) — 🔴 تكاليف برمجية تصاعدية غير مقيدة**:
     - تستخدم برمجيات طرف ثالث برخص سنوية متقلبة تزيد مخاطر التضخم السنوي بنسبة 6-10%.

2. **التوصيات التعاقدية لجولة التفاوض النهائي BAFO**:
   - اشتراط تثبيت أسعار تجديد التراخيص (Price-Escalation Cap ≤ 3% سنوياً).
   - مواءمة عدد الأنوية مع فئات تراخيص قواعد البيانات لتجنب دفع رسوم إضافية غير ضرورية.
   - إلزام المورد بتقديم شهادة مطابقة برمجيات الحماية لضوابط الهيئة الوطنية للأمن السيبراني NCA ECC-1:2018.`
          : `### 💻 Strategic Analysis: Enterprise Software Licensing & Virtualization Trends

As your autonomous procurement copilot, here is the quantitative evaluation of enterprise software, hypervisor licensing (VMware Broadcom overhaul), and multi-year OPEX exposure for RFQ-2026:

1. **Vendor Software & Hypervisor Positioning**:
   - **Meridian Solutions — 🟢 Optimized TCO**:
     - Includes open-source KVM hypervisor readiness and OEM virtualization support, generating up to $42,000 in 5-year OPEX lifecycle savings.
   - **Ironclad Systems — 🟡 Solid Hardware Tools, Renewal Risk**:
     - Bundles 3-year hardware orchestration tools; requires contractual price caps for year 4-5 extensions.
   - **Vantage Systems — 🔴 High Software Licensing Volatility**:
     - Unbundled 3rd-party virtualization agents expose the organization to 6-10% annual software subscription price hikes.

2. **BAFO Contractual Levers**:
   - Enforce an explicit Software Support Escalation Cap (≤3% annual cap for years 2-5).
   - Optimize physical processor socket/core ratios to minimize database core licensing liabilities.
   - Enforce NCA ECC-1:2018 cybersecurity telemetry software compliance and local log storage.`,
        followUps: isAr
          ? ["مقارنة التكلفة التشغيلية للبرمجيات بين ميريديان وآيرون كلاد", "صياغة شرط سقف تجديد التراخيص", "التحقق من ضوابط الأمن السيبراني NCA"]
          : ["Compare Software OPEX Meridian vs Ironclad", "Draft Software Renewal Escalation Cap Clause", "Verify NCA Cybersecurity Controls"],
      };
    }

    if (
      q.includes("ddr5") ||
      q.includes("dram") ||
      q.includes("memory") ||
      q.includes("raw material") ||
      q.includes("surge") ||
      q.includes("fluctuation") ||
      q.includes("nand") ||
      q.includes("wafer") ||
      q.includes("silicon") ||
      q.includes("ذاكرة") ||
      q.includes("المواد الخام") ||
      q.includes("تقلبات") ||
      q.includes("طفرة") ||
      q.includes("spike")
    ) {
      return {
        mainText: isAr
          ? `### ⚡ التحليل الاستباقي لقفزة أسعار المواد الخام والذاكرة (DDR5 ECC +14.2%)

بصفتي المستشار الاستباقي للمشتريات (LANTRA)، قمت بتحليل مؤشرات الأسواق الفورية وأثر قفزة أسعار رقائق الذاكرة DDR5 بنسبة +14.2% على منافسة RFQ-2026:

1. **تحليل أثر تقلبات المواد الخام على الموردين المتنافسين**:
   - **شركة ميريديان (Meridian Solutions) — 🟢 محمية بالكامل**:
     - عرض ميريديان محمي بتعهد تثبيت أسعار رسمي لمدة 60 يوماً مع تخصيص مسبق للمخزون بمستودعات الرياض. لن تتحمل المنظمة أي زيادة سعرية طارئة.
   - **شركة آيرون كلاد (Ironclad Systems) — 🟡 معرضة لزيادة التكاليف**:
     - عرض آيرون كلاد المفتوح يعرض بنود العتاد لزيادة متوقعة بنسبة 5% إلى 8% ($11,600 فارق مالي) في حال تأخر أمر الشراء.
   - **أنظمة فانتاج (Vantage Systems) — 🔴 مخاطر حرجة وتأخير في التوريد**:
     - مهلة فانتاج البالغة 16 أسبوعاً واعتمادها على الشحن العابر للبحار يعرض المشروع لمخاطر مضاعفة في سلاسل الإمداد وتعديل مواصفات الأجهزة.

2. **التوصيات التعاقدية والإجراءات الاستباقية الفورية**:
   - **إلزام الموردين بتثبيت الأسعار (Fixed-Price Lock)** في جولة العروض النهائية BAFO.
   - **رفع وزن معيار التكلفة الإجمالية (TCO Weight +15%)** في مصفوفة التقييم لمكافأة الموردين الذين يقدمون ضمانات حماية الأسعار.
   - **تضمين بند غرامات التأخير ($2,500/يوم)** لمنع أي تسويف ناتج عن تقلبات مصانع الرقائق.`
          : `### ⚡ LANTRA Proactive Intelligence: Raw Material & DDR5 DRAM Surge (+14.2%)

As your autonomous procurement copilot, here is the quantitative supply chain impact assessment of the +14.2% spot price surge in enterprise DDR5 ECC server memory:

1. **Vendor Exposure & Vulnerability Breakdown**:
   - **Meridian Solutions — 🟢 Fully Shielded**:
     - Meridian's quote includes an audited **60-day price lock** with pre-allocated staging inventory in Riyadh. Immune to spot market inflation.
   - **Ironclad Systems — 🟡 Open Exposure Risk**:
     - Ironclad's floating BOM structure creates an estimated **$11,600 (5-8%) component pass-through price escalation** risk if purchase orders are delayed beyond 14 days.
   - **Vantage Systems — 🔴 Extreme Lead Time & Cost Volatility**:
     - Vantage's 16-week overseas lead time multiplies exposure to compounding foundry substrate price hikes and potential forced SKU downgrades.

2. **Recommended Proactive Strategic Mitigations**:
   - **Enforce Mandatory 60-Day Fixed Price BAFO Clauses**: Require all finalists to legally certify fixed component costs under Saudi GTPL regulations.
   - **Elevate TCO & Price Decision Weight (+15%)**: Increase cost weighting in the decision matrix to prioritize hedged vendor proposals.
   - **Incorporate Liquidated Damages ($2,500/day)**: Protect project milestones against potential foundry queuing delays.`,
        followUps: isAr
          ? ["صياغة بند حماية الأسعار التعاقدي لميريديان", "مقارنة التكلفة الإجمالية TCO لـ 5 سنوات", "مراجعة نسب المحتوى المحلي LCGPA"]
          : ["Draft BAFO price lock clause for Meridian", "Compare 5-Year Lifecycle TCO", "Review Saudi Local Content (LCGPA) scores"],
      };
    }

    return {
      mainText: isAr
        ? `### 📊 ملخص تقييم المنافسة (RFQ-2026-0803) من لانـتـرا

• **المورد الموصى به**: **${recommendation ? VENDOR_NAMES[recommendation.recommendedVendor] : "ميريديان سوليوشنز (Meridian Solutions)"}**
• **النقاط الموزونة**:
  - **ميريديان (Meridian)**: **${scores?.meridian?.weighted || 82}** / 100
  - **آيرون كلاد (Ironclad)**: **${scores?.ironclad?.weighted || 78}** / 100
  - **فانتاج (Vantage)**: **${scores?.vantage?.weighted || 71}** / 100 (مستبعدة لبوابة تجاوز الأعطال)

ما هو المحور المحدد الذي ترغب في تفصيله (السعر، الضمان، المحتوى المحلي، أو مخاطر سلاسل الإمداد)؟`
        : `### 📊 LANTRA Procurement Context Overview (RFQ-2026-0803)

• **Top Recommended Vendor**: **${recommendation ? VENDOR_NAMES[recommendation.recommendedVendor] : "Meridian Solutions"}**
• **Weighted Scores**:
  - **Meridian Solutions**: **${scores?.meridian?.weighted || 82}** / 100
  - **Ironclad Tech**: **${scores?.ironclad?.weighted || 78}** / 100
  - **Vantage Systems**: **${scores?.vantage?.weighted || 71}** / 100 *(Disqualified on Continuous Failover Gate)*

Which dimension would you like to explore?`,
      followUps: isAr
        ? ["مقارنة الأسعار وتكلفة الملكية TCO", "تحليل المحتوى المحلي LCGPA", "فحص سجل الاعتماد ثلاثي المستويات"]
        : ["Compare prices & 5-year TCO", "Analyze Saudi Local Content", "Check 3-tier governance signoff"],
    };
  };

  const handleSendMessage = async (
    textToSend?: string,
    citation?: { headline: string; source: string; category: string }
  ) => {
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
    setActiveTab("chat");

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
          lang,
          context: {
            structuredData,
            scores,
            weights,
            recommendation,
            signoff,
            quotes,
            binaryGates,
            activeCitation: citation,
            realtimeMarketNews: newsArticles,
            marketPulse: newsMarketPulse,
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
          followUps: followUps.length > 0 ? followUps : (isAr
            ? ["مقارنة الأسعار وتكلفة الملكية TCO", "تحليل معايير هيئة المحتوى المحلي LCGPA", "عرض التوصية التنفيذية"]
            : ["Compare prices & 5-year TCO", "Analyze Saudi Local Content", "View recommendation"]),
          newsCitation: citation,
        };
      } else {
        const fallback = generateFallbackAnswer(query);
        assistantMessage = {
          id: (Date.now() + 1).toString(),
          sender: "assistant",
          text: fallback.mainText,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          followUps: fallback.followUps,
          newsCitation: citation,
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
        newsCitation: citation,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleSummarizeNewsInChat = async (article: RealtimeNewsArticle) => {
    setActiveTab("chat");
    const prompt = article.chatSummaryPrompt || (isAr
      ? `قدم تحليلاً وموجزاً تنفيذياً لأثر الخبر التالي على منافسة RFQ-2026 وموقف الموردين (ميريديان، آيرون كلاد، فانتاج):
عنوان الخبر: ${article.title}
المصدر: ${article.source} (${article.timeAgo})
الملخص: ${article.summary}
الأثر المرصود: ${article.impactOnRFQ}`
      : `Provide a real-time procurement briefing and tender impact assessment for RFQ-2026:
Headline: ${article.title}
Source: ${article.source} (${article.timeAgo})
Summary: ${article.summary}
Market Impact: ${article.impactOnRFQ}

How should we adjust our vendor evaluation and BAFO negotiation strategy for Meridian, Ironclad, and Vantage?`);

    await handleSendMessage(prompt, {
      headline: article.title,
      source: article.source,
      category: article.categoryLabel || article.category,
    });
  };

  // Listen to external trigger prompts
  useEffect(() => {
    if (externalTriggerPrompt && externalTriggerPrompt.trim()) {
      setIsOpen(true);
      setActiveTab("chat");
      handleSendMessage(externalTriggerPrompt);
      onClearTriggerPrompt?.();
    }
  }, [externalTriggerPrompt]);

  // Render markdown text with bolding and bullet styling
  const renderFormattedText = (rawText: string) => {
    const lines = rawText.split("\n");
    return lines.map((line, idx) => {
      if (line.startsWith("### ")) {
        return (
          <h4 key={idx} className="text-sm font-bold text-white mt-2.5 mb-1.5 flex items-center gap-1.5 border-b border-white/10 pb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
            {line.replace("### ", "")}
          </h4>
        );
      }
      if (line.startsWith("• ") || line.startsWith("- ") || line.startsWith("* ")) {
        const itemContent = line.replace(/^[•\-\*]\s*/, "");
        const parts = itemContent.split(/(\*\*.*?\*\*)/g);

        return (
          <div key={idx} className="flex items-start gap-1.5 my-1 text-xs text-zinc-300 leading-relaxed pl-1.5">
            <span className="text-cyan-400 mt-1 shrink-0 text-[10px]">●</span>
            <div className="flex-1">
              {parts.map((part, pIdx) => {
                if (part.startsWith("**") && part.endsWith("**")) {
                  return (
                    <strong key={pIdx} className="text-white font-semibold">
                      {part.slice(2, -2)}
                    </strong>
                  );
                }
                return <span key={pIdx}>{part}</span>;
              })}
            </div>
          </div>
        );
      }

      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <div key={idx} className="min-h-[1.1rem] text-xs text-zinc-300 leading-relaxed my-0.5">
          {parts.map((part, pIdx) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return (
                <strong key={pIdx} className="text-white font-semibold">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return <span key={pIdx}>{part}</span>;
          })}
        </div>
      );
    });
  };

  return (
    <>
      {/* Floating Toggle Button with LANTRA Robot Avatar & Spotlight Glow */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 group flex items-center gap-3 px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl font-sans font-semibold text-xs shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none cursor-pointer backdrop-blur-xl shrink-0 select-none whitespace-nowrap border ${themeStyles.launcherBtn}`}
        >
          {/* Dynamic pulsing halo on hover */}
          <div className={`absolute -inset-0.5 rounded-2xl blur-md opacity-0 group-hover:opacity-70 transition-opacity duration-300 pointer-events-none -z-10 ${themeStyles.launcherHalo}`} />

          <div className="relative shrink-0">
            <LantraAvatar size="sm" status="online" isAnimated={true} />
          </div>

          <div className="flex flex-col items-start text-left">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="font-bold text-white tracking-tight text-xs sm:text-sm">
                {isAr ? "مساعد لانـتـرا" : "LANTRA Copilot"}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            </div>
            <span className="text-[10px] text-cyan-300 font-mono font-medium">
              {isAr ? "الذكاء الشرائي ورؤية 2030" : "AI Market & RFQ Intelligence"}
            </span>
            {activeMarketAlert && (
              <span className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-rose-500/30 border border-rose-400/60 text-[9px] font-mono font-bold text-rose-300 animate-pulse">
                <Flame size={10} className="text-rose-400" />
                <span>{isAr ? `تنبيه أسعار +${activeMarketAlert.percentChange}%` : `Alert: +${activeMarketAlert.percentChange}% ${activeMarketAlert.materialName}`}</span>
              </span>
            )}
          </div>
        </button>
      )}

      {/* Floating Chat Drawer / Window with Dynamic Fluent Mica Glass */}
      {isOpen && (
        <div
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setDrawerMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top });
          }}
          onMouseEnter={() => setIsDrawerHovered(true)}
          onMouseLeave={() => {
            setIsDrawerHovered(false);
            setDrawerMouse({ x: -1000, y: -1000 });
          }}
          className={`fixed z-50 bottom-5 right-5 sm:bottom-6 sm:right-6 backdrop-blur-2xl rounded-2xl shadow-2xl flex flex-col chatbot-container-hover transition-all duration-300 overflow-hidden max-w-[calc(100vw-2.5rem)] border ${themeStyles.drawerContainer} ${
            isExpanded
              ? "w-[96vw] sm:w-[940px] h-[88vh]"
              : "w-[94vw] sm:w-[480px] h-[640px] max-h-[90vh]"
          }`}
        >
          {/* Dynamic Cursor Spotlight Ambient Overlay */}
          <div
            className="pointer-events-none absolute -inset-px transition-opacity duration-500 -z-10"
            style={{
              opacity: isDrawerHovered ? 0.4 : 0,
              background: `radial-gradient(500px circle at ${drawerMouse.x}px ${drawerMouse.y}px, rgba(6, 182, 212, 0.15), transparent 70%)`,
            }}
          />

          {/* Top ambient theme light bar */}
          <div className={`h-1 w-full animate-pulse ${themeStyles.topLightBar}`} />

          {/* LANTRA Header */}
          <div className={`px-4 py-3 backdrop-blur-md flex flex-col gap-2 shrink-0 border-b border-white/10 ${themeStyles.headerBg}`}>
            {/* Top Bar: LANTRA Robot Avatar & Window Control Buttons */}
            <div className="flex items-center justify-between w-full gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <LantraAvatar size="sm" status="online" isAnimated={true} />
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white tracking-tight truncate">
                      {isAr ? "لانـتـرا (LANTRA AI)" : "LANTRA AI Copilot"}
                    </h3>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-bold flex items-center gap-1 border shrink-0 ${themeStyles.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full animate-ping ${themeStyles.badgePing}`} />
                      {isAr ? "متصل بالأسواق" : "Live Grounded"}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400 truncate">
                    {isAr ? "التقييم الفوري، TCO، وسلاسل الإمداد السعودية" : "Enterprise RFQ, 5-Yr TCO & Saudi Vision 2030"}
                  </span>
                </div>
              </div>

              {/* Right Window Control Buttons */}
              <div className="flex items-center gap-1.5 shrink-0 z-20">
                <button
                  onClick={handleResetChat}
                  className="p-1.5 rounded-lg transition-all duration-200 cursor-pointer hover:rotate-180 text-zinc-400 hover:text-white hover:bg-white/10 border border-white/5"
                  title={isAr ? "إعادة تعيين المحادثة وأرشفتها" : "Restart conversation & archive to history"}
                >
                  <RotateCcw size={14} />
                </button>

                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1.5 rounded-lg transition-all duration-200 cursor-pointer hover:scale-105 text-zinc-400 hover:text-white hover:bg-white/10 border border-white/5"
                  title={isExpanded ? "Collapse window" : "Expand window"}
                >
                  {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 hover:border-rose-400 transition-all duration-200 cursor-pointer shadow-sm flex items-center justify-center"
                  title="Close LANTRA"
                  aria-label="Close LANTRA"
                >
                  <X size={15} className="stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center justify-between gap-1 bg-black/50 p-1 rounded-xl border border-white/10 w-full overflow-x-auto">
              <button
                onClick={() => setActiveTab("fluent-hub")}
                className={`flex-1 py-1 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === "fluent-hub" ? themeStyles.tabActive : themeStyles.tabInactive
                }`}
              >
                <LayoutGrid size={13} />
                <span>{isAr ? "المصفوفة الذكية" : "Security Hub"}</span>
              </button>

              <button
                onClick={() => setActiveTab("chat")}
                className={`flex-1 py-1 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === "chat" ? themeStyles.tabActive : themeStyles.tabInactive
                }`}
              >
                <Bot size={13} />
                <span>{isAr ? "محادثة لانـتـرا" : "Chat AI"}</span>
              </button>

              <button
                onClick={() => setActiveTab("market-intel")}
                className={`flex-1 py-1 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap relative ${
                  activeTab === "market-intel" ? themeStyles.tabActive : themeStyles.tabInactive
                }`}
              >
                <Globe size={13} className="text-cyan-400" />
                <span>{isAr ? "أخبار الأسواق والاتجاهات" : "Live News & Trends"}</span>
                <span className="flex h-1.5 w-1.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-500"></span>
                </span>
              </button>

              <button
                onClick={() => setActiveTab("history")}
                className={`flex-1 py-1 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === "history" ? themeStyles.tabActive : themeStyles.tabInactive
                }`}
              >
                <History size={13} />
                <span>{isAr ? "السجل" : "History"}</span>
                {sessionTurns.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold font-mono bg-cyan-950 text-cyan-300 border border-cyan-800/60 ml-0.5">
                    {sessionTurns.length}
                  </span>
                )}
              </button>

              {isExpanded && (
                <button
                  onClick={() => setShowSplitView(!showSplitView)}
                  className={`py-1 px-2.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-all cursor-pointer whitespace-nowrap ${
                    showSplitView ? "bg-cyan-600 text-white shadow-sm shadow-cyan-600/30" : "text-zinc-400 hover:text-white hover:bg-white/5"
                  }`}
                  title="Toggle Split View"
                >
                  <Columns size={13} />
                  <span className="hidden sm:inline">{isAr ? "شاشة مقسومة" : "Split"}</span>
                </button>
              )}
            </div>

            {/* Real-time Proactive State Insights Banner */}
            {activeMarketAlert ? (
              <div className="bg-gradient-to-r from-rose-950/80 via-red-950/60 to-zinc-900/90 border border-rose-500/50 rounded-xl px-3 py-2 flex items-center justify-between gap-2 text-[11px] text-rose-200 shadow-md">
                <div className="flex items-center gap-2 min-w-0">
                  <Flame size={14} className="text-rose-400 animate-bounce shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 font-bold text-white text-xs">
                      <span>{isAr ? activeMarketAlert.headlineAr : activeMarketAlert.headline}</span>
                      <span className="px-1.5 py-0.2 rounded font-mono text-[9px] bg-rose-900/80 text-rose-300 border border-rose-700/60 shrink-0">
                        +{activeMarketAlert.percentChange}%
                      </span>
                    </div>
                    <p className="truncate text-zinc-300 text-[10px]">
                      {isAr ? activeMarketAlert.summaryAr : activeMarketAlert.summary}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setActiveTab("chat");
                    handleSendMessage(isAr ? activeMarketAlert.lantraDeepDivePromptAr : activeMarketAlert.lantraDeepDivePrompt);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] shrink-0 cursor-pointer transition-all active:scale-95 whitespace-nowrap shadow-sm"
                >
                  {isAr ? "تحليل الأثر التعاقدي" : "Mitigate Risk"}
                </button>
              </div>
            ) : stateInsights.length > 0 ? (
              <div className="bg-cyan-950/40 border border-cyan-500/30 rounded-xl px-2.5 py-1.5 flex items-center justify-between gap-2 text-[11px] text-cyan-200">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Zap size={12} className="text-cyan-400 animate-pulse shrink-0" />
                  <span className="font-semibold text-white shrink-0">
                    {isAr ? stateInsights[0].titleAr : stateInsights[0].title}:
                  </span>
                  <span className="truncate text-zinc-300">
                    {isAr ? stateInsights[0].detailAr : stateInsights[0].detail}
                  </span>
                </div>
                <button
                  onClick={() => handleSendMessage(stateInsights[0].prompt)}
                  className="px-2 py-0.5 rounded-md bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-[10px] shrink-0 cursor-pointer transition-all active:scale-95 whitespace-nowrap"
                >
                  {isAr ? "تحليل فوري" : "Analyze"}
                </button>
              </div>
            ) : null}
          </div>

          {/* MAIN CONTENT AREA */}
          <div className="flex-1 flex overflow-hidden">
            {/* 1. FLUENT SPOTLIGHT INTELLIGENCE HUB */}
            {(activeTab === "fluent-hub" || (isExpanded && showSplitView)) && (
              <div
                className={`flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs font-sans ${themeStyles.messagesBg} ${
                  isExpanded && showSplitView ? "border-r border-white/10 max-w-[50%]" : "w-full"
                }`}
              >
                {/* LANTRA Hero Card */}
                <LantraHeroCard
                  lang={lang}
                  onLaunch={() => setActiveTab("chat")}
                />

                {/* Fluent Cards List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => handleSendMessage("Summarize the compliance and failover verification gate statuses for all vendors. Which are disqualified and why?")}
                    className="p-3.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800/90 border border-white/10 hover:border-cyan-500/50 transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
                        <ShieldCheck size={18} />
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                        {isAr ? "بوابات الامتثال" : "Mandatory Gates"}
                      </span>
                    </div>
                    <div className="mt-2.5">
                      <h4 className="font-bold text-white group-hover:text-cyan-400 transition-colors">
                        {isAr ? "التحقق من بوابات الامتثال وتجاوز الأعطال" : "Binary Gate & Failover Validation"}
                      </h4>
                      <p className="text-zinc-400 text-[11px] mt-0.5">
                        {binaryGates.vantage?.failoverVerified === false
                          ? (isAr ? "تم استبعاد فانتاج لعدم تجاوز الأعطال بدون توقف" : "Vantage disqualified (Continuous failover unverified)")
                          : (isAr ? "جميع الموردين مستوفون للبوابات" : "All vendors passed")}
                      </p>
                    </div>
                  </div>

                  <div
                    onClick={() => handleSendMessage("Analyze how Saudi Local Content (LCGPA 35% threshold) and IKTVA ratios impact the vendor rankings")}
                    className="p-3.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800/90 border border-white/10 hover:border-cyan-500/50 transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
                        <Building2 size={18} />
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                        LCGPA 35%
                      </span>
                    </div>
                    <div className="mt-2.5">
                      <h4 className="font-bold text-white group-hover:text-cyan-400 transition-colors">
                        {isAr ? "معايير المحتوى المحلي ورؤية 2030" : "Saudi Vision 2030 & Local Content"}
                      </h4>
                      <p className="text-zinc-400 text-[11px] mt-0.5">
                        {isAr ? "ميريديان تتصدر بنسبة 48% محتوى محلي مؤهلة لترسية GTPL" : "Meridian leads with 48.0% LCGPA compliance"}
                      </p>
                    </div>
                  </div>

                  <div
                    onClick={() => handleSendMessage("Give me a deep dive breakdown on pricing, 5-year TCO, and ROI across all vendors")}
                    className="p-3.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800/90 border border-white/10 hover:border-cyan-500/50 transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between">
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/40">
                        <Scale size={18} />
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                        5-Yr TCO
                      </span>
                    </div>
                    <div className="mt-2.5">
                      <h4 className="font-bold text-white group-hover:text-cyan-400 transition-colors">
                        {isAr ? "تحليل التكلفة الإجمالية للملكية TCO" : "5-Year TCO Lifecycle Math"}
                      </h4>
                      <p className="text-zinc-400 text-[11px] mt-0.5">
                        {isAr ? "حساب تكاليف الصيانة وقطع الغيار والتوفير الشامل" : "Includes CAPEX + 5-Yr OPEX - Residual Value"}
                      </p>
                    </div>
                  </div>

                  <div
                    onClick={() => handleSendMessage("Draft a strategic BAFO negotiation counter-offer for the top-ranked vendor")}
                    className="p-3.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800/90 border border-white/10 hover:border-cyan-500/50 transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40">
                        <Flame size={18} />
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
                        BAFO Playbook
                      </span>
                    </div>
                    <div className="mt-2.5">
                      <h4 className="font-bold text-white group-hover:text-cyan-400 transition-colors">
                        {isAr ? "استراتيجية التفاوض على العرض النهائي" : "BAFO Negotiation Strategy"}
                      </h4>
                      <p className="text-zinc-400 text-[11px] mt-0.5">
                        {isAr ? "استهداف خصم 8% وتثبيت أسعار الصيانة لـ 5 سنوات" : "Target 8% price concession & locked SLA caps"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. CHAT STREAM TAB */}
            {activeTab === "chat" && (
              <div className="flex-1 flex flex-col overflow-hidden w-full">
                {/* Topic Presets Toolbar */}
                <div className="px-3 py-2 bg-black/40 border-b border-white/10 flex items-center gap-1.5 overflow-x-auto shrink-0">
                  <span className="text-[10px] text-zinc-400 font-mono uppercase shrink-0 flex items-center gap-1">
                    <Sparkles size={11} className="text-cyan-400" />
                    {isAr ? "الموضوعات:" : "Topics:"}
                  </span>
                  {TOPIC_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(preset.query)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-zinc-800/80 hover:bg-gradient-to-r hover:from-blue-600 hover:to-cyan-600 text-zinc-300 hover:text-white border border-zinc-700/80 transition-all cursor-pointer shrink-0 whitespace-nowrap active:scale-95"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Messages Container */}
                <div className={`flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3.5 ${themeStyles.messagesBg}`}>
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      id={`msg-${m.id}`}
                      className={`flex gap-2.5 transition-all duration-300 ${
                        m.sender === "user" ? "justify-end" : "justify-start"
                      } ${highlightedMsgId === m.id ? "ring-2 ring-cyan-400 bg-cyan-500/10 rounded-2xl p-2" : ""}`}
                    >
                      {m.sender === "assistant" && (
                        <div className="shrink-0 mt-0.5">
                          <LantraAvatar size="xs" showStatusIndicator={false} />
                        </div>
                      )}

                      <div
                        className={`max-w-[85%] sm:max-w-[80%] rounded-2xl p-3 text-xs shadow-md transition-all ${
                          m.sender === "user" ? themeStyles.userMsgBox : themeStyles.botMsgBox
                        }`}
                      >
                        {m.newsCitation && (
                          <div className="mb-2.5 p-2.5 rounded-xl bg-cyan-950/90 border border-cyan-500/40 text-[10px] space-y-1">
                            <div className="flex items-center justify-between gap-1 text-cyan-300 font-mono">
                              <span className="flex items-center gap-1.5 font-bold">
                                <Globe size={11} className="text-cyan-400" />
                                {m.newsCitation.source}
                              </span>
                              <span className="px-1.5 py-0.5 rounded-md bg-cyan-500/20 border border-cyan-500/30 text-cyan-200 text-[9px] uppercase tracking-wider font-semibold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                                Google Search Grounded
                              </span>
                            </div>
                            <div className="text-white font-medium text-[11px] leading-snug">
                              {m.newsCitation.headline}
                            </div>
                          </div>
                        )}

                        {m.sender === "user" ? (
                          <p className="font-medium leading-relaxed whitespace-pre-wrap">{m.text}</p>
                        ) : (
                          <div className="space-y-1">{renderFormattedText(m.text)}</div>
                        )}

                        <div
                          className={`mt-2 flex items-center justify-between text-[10px] ${
                            m.sender === "user" ? "text-blue-100" : "text-zinc-500"
                          }`}
                        >
                          <span>{m.time}</span>
                          {m.sender === "assistant" && (
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(m.text);
                                setCopiedTurnId(m.id);
                                setTimeout(() => setCopiedTurnId(null), 2000);
                              }}
                              className="text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer ml-2"
                              title="Copy response"
                            >
                              {copiedTurnId === m.id ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                              <span>{copiedTurnId === m.id ? (isAr ? "تم النسخ" : "Copied") : (isAr ? "نسخ" : "Copy")}</span>
                            </button>
                          )}
                        </div>

                        {/* Interactive Follow-Up Prompts */}
                        {m.sender === "assistant" && m.followUps && m.followUps.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-white/10 space-y-1.5">
                            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                              <Sparkles size={10} />
                              {isAr ? "الأسئلة المقترحة:" : "Suggested Follow-ups:"}
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {m.followUps.map((f, fIdx) => (
                                <button
                                  key={fIdx}
                                  onClick={() => handleSendMessage(f)}
                                  className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer text-left active:scale-95 border ${themeStyles.followUpChip}`}
                                >
                                  {f}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {loading && (
                    <div className="flex gap-2.5 justify-start">
                      <LantraAvatar size="xs" status="thinking" showStatusIndicator={false} />
                      <div className="bg-zinc-900 border border-cyan-500/30 rounded-2xl p-3 text-xs text-zinc-300 flex items-center gap-2">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" />
                          <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:0.2s]" />
                          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]" />
                        </div>
                        <span className="text-cyan-300 font-mono text-[11px]">
                          {isAr ? "لانـتـرا يحلل البيانات والأسواق..." : "LANTRA is synthesizing procurement insights..."}
                        </span>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input Bar */}
                <div className={`p-3 ${themeStyles.inputBarBg}`}>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={
                        isAr
                          ? "اسأل لانـتـرا عن الأسعار، مدد التوريد، المحتوى المحلي، أو تحليل المخاطر..."
                          : "Ask LANTRA about prices, lead times, Saudi local content, or TCO..."
                      }
                      className={`flex-1 rounded-xl px-3.5 py-2.5 text-xs outline-none transition-all ${themeStyles.inputField}`}
                    />
                    <button
                      type="submit"
                      disabled={!input.trim() || loading}
                      className={`p-2.5 rounded-xl transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${themeStyles.sendBtn}`}
                    >
                      <Send size={15} />
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* 3. LIVE MARKET & SAUDI INTELLIGENCE TAB */}
            {activeTab === "market-intel" && (
              <div className={`flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-4 text-xs ${themeStyles.messagesBg} w-full`}>
                {/* Header with Google Search Grounding Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-white/10 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                        <Globe size={14} />
                      </div>
                      <h3 className="font-bold text-sm text-white">
                        {isAr ? "نشرة الأسواق المباشرة والذكاء المالي والسعودي" : "Live Global, Finance & Saudi Market News Feed"}
                      </h3>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      {isAr
                        ? "أخبار حية مدعومة ببحث Google Search وتحليل أثرها على تقييم الموردين وتكلفة الملكية وحوكمة رؤية 2030"
                        : "Real-time trends fetched via Google Search with automated RFQ impact analysis & chat summaries"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-start sm:self-center flex-wrap">
                    <button
                      onClick={() => setIsLiveStreaming(!isLiveStreaming)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-mono transition-all cursor-pointer ${
                        isLiveStreaming
                          ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                          : "bg-zinc-900 border-zinc-700 text-zinc-400"
                      }`}
                      title={isLiveStreaming ? "Live news auto-refresh active" : "Live stream paused"}
                    >
                      <span className={`w-2 h-2 rounded-full ${isLiveStreaming ? "bg-emerald-400 animate-ping" : "bg-zinc-500"}`} />
                      <span>{isLiveStreaming ? (isAr ? "بث مباشر (نشط)" : "Live Feed (Active)") : (isAr ? "بث متوقف" : "Feed Paused")}</span>
                    </button>

                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-[10px] font-mono text-cyan-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                      <span>{isAr ? "بحث Google مباشر" : "Google Grounded"}</span>
                    </div>

                    <button
                      onClick={() => fetchRealtimeNews(selectedNewsCategory, newsSearchInput, true)}
                      disabled={newsLoading}
                      className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/10 hover:border-cyan-500/40 font-medium text-[11px] flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                      title="Force refresh live market data now"
                    >
                      <RefreshCw size={12} className={newsLoading ? "animate-spin text-cyan-400" : "text-zinc-400"} />
                      <span>{newsLoading ? (isAr ? "جارٍ التحديث..." : "Fetching...") : (isAr ? "تحديث فوري" : "Force Refresh")}</span>
                    </button>
                  </div>
                </div>

                {/* Google Search Bar for Custom Procurement Research */}
                <div className="space-y-2 bg-black/40 p-3 rounded-2xl border border-white/10">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      fetchRealtimeNews(selectedNewsCategory, newsSearchInput);
                    }}
                    className="flex items-center gap-2"
                  >
                    <div className="relative flex-1">
                      <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400" />
                      <input
                        type="text"
                        value={newsSearchInput}
                        onChange={(e) => setNewsSearchInput(e.target.value)}
                        placeholder={
                          isAr
                            ? "ابحث في أخبار الأسواق المباشرة (مثل: أسعار DDR5، لوائح LCGPA، أجور الشحن)..."
                            : "Search live trends via Google Search (e.g. DDR5 spot index, LCGPA 35% mandate, Red Sea)..."
                        }
                        className="w-full bg-zinc-900/90 border border-white/10 focus:border-cyan-500 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder:text-zinc-500 outline-none transition-all"
                      />
                      {newsSearchInput && (
                        <button
                          type="button"
                          onClick={() => {
                            setNewsSearchInput("");
                            fetchRealtimeNews(selectedNewsCategory, "");
                          }}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                    <button
                      type="submit"
                      disabled={newsLoading}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-all active:scale-95 disabled:opacity-50 shrink-0"
                    >
                      <Sparkles size={12} />
                      <span>{isAr ? "بحث بالذكاء" : "Search"}</span>
                    </button>
                  </form>

                  {/* Preset Query Chips */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5">
                    <span className="text-[10px] text-zinc-400 font-mono shrink-0 flex items-center gap-1">
                      <Tag size={10} className="text-cyan-400" />
                      {isAr ? "شائع:" : "Hot:"}
                    </span>
                    {[
                      { label: isAr ? "تراخيص VMware والبرمجيات" : "VMware & Software Licensing", q: "VMware Broadcom per-core virtualization licensing shift TCO" },
                      { label: isAr ? "معالجات الخوادم ومصفوفات NVMe" : "Server CPUs & NVMe Gen5", q: "Enterprise server Xeon Epyc Gen5 SSD allocation lead times" },
                      { label: isAr ? "أسعار الذاكرة DDR5" : "DDR5 Memory Index", q: "DDR5 ECC server memory price trends" },
                      { label: isAr ? "المحتوى المحلي LCGPA 35%" : "LCGPA 35% Mandate", q: "Saudi LCGPA 35% local content mandatory list IT tenders" },
                      { label: isAr ? "شحن البحر الأحمر والرياض" : "Red Sea & Air Cargo", q: "Middle East Red Sea logistics IT hardware air cargo rates" },
                      { label: isAr ? "فائدة ساما والريال" : "SAMA Repo & SAR/USD", q: "SAMA Saudi Central Bank repo rate fixed currency peg" },
                      { label: isAr ? "منصة اعتماد وتفاوض BAFO" : "Etimad BAFO Rules", q: "Saudi Etimad government procurement BAFO negotiation rules" },
                    ].map((chip, cIdx) => (
                      <button
                        key={cIdx}
                        type="button"
                        onClick={() => {
                          setNewsSearchInput(chip.q);
                          fetchRealtimeNews(selectedNewsCategory, chip.q);
                        }}
                        className="px-2 py-0.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-cyan-300 border border-zinc-700/60 text-[10px] whitespace-nowrap cursor-pointer transition-colors shrink-0"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category Filters */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {[
                    { id: "all", labelEn: "🌐 All Trends", labelAr: "🌐 جميع الاتجاهات" },
                    { id: "software", labelEn: "💻 Software & SaaS Licensing", labelAr: "💻 البرمجيات والتراخيص" },
                    { id: "hardware", labelEn: "🖥️ Hardware & Servers", labelAr: "🖥️ عتاد الخوادم والرقائق" },
                    { id: "saudi", labelEn: "🇸🇦 Saudi Vision 2030 & LCGPA", labelAr: "🇸🇦 المحتوى المحلي ورؤية 2030" },
                    { id: "logistics", labelEn: "🚢 Freight & Logistics", labelAr: "🚢 الشحن وسلاسل الإمداد" },
                    { id: "finance", labelEn: "💵 Finance & SAMA", labelAr: "💵 المالية وأسعار الفائدة" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        const newCat = cat.id as any;
                        setSelectedNewsCategory(newCat);
                        fetchRealtimeNews(newCat, newsSearchInput);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                        selectedNewsCategory === cat.id
                          ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-cyan-400 shadow-sm"
                          : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border-white/10 hover:border-zinc-700"
                      }`}
                    >
                      {isAr ? cat.labelAr : cat.labelEn}
                    </button>
                  ))}
                </div>

                {/* Executive Market Pulse Banner */}
                {newsMarketPulse && (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-cyan-950/60 via-blue-950/40 to-black/60 border border-cyan-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                        <Radio size={14} className="text-cyan-400 animate-pulse" />
                        <span>{isAr ? "الموجز التنفيذي للأسواق والمناقصات" : "Executive Procurement Market Pulse"}</span>
                      </div>
                      {newsLastUpdated && (
                        <span className="text-[10px] font-mono text-zinc-400">
                          {isAr ? `آخر تحديث: ${newsLastUpdated}` : `Updated: ${newsLastUpdated}`}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-200 leading-relaxed font-sans">
                      {newsMarketPulse}
                    </p>
                    <div className="pt-1 flex items-center justify-end">
                      <button
                        onClick={() =>
                          handleSendMessage(
                            isAr
                              ? `قدم تحليلاً استراتيجياً شاملاً للموجز السوقي الراهن (${newsMarketPulse}) وتأثيره على مقارنة عروض الأسعار في RFQ-2026`
                              : `Synthesize the current procurement market pulse (${newsMarketPulse}) into a strategic negotiation memo for RFQ-2026.`
                          )
                        }
                        className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Sparkles size={11} />
                        <span>{isAr ? "تحليل الأثر في المحادثة" : "Summarize Pulse in Chat"}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Live Macro Market Indicators Grid */}
                {activeMarketAlert && (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-rose-950/80 via-red-950/60 to-zinc-900 border-2 border-rose-500/80 shadow-lg shadow-rose-950/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-rose-300">
                        <Flame size={15} className="text-rose-400 animate-bounce" />
                        <span>{isAr ? "⚡ تنبيه استباقي: طفرة مفاجئة في تكلفة المواد الخام" : "⚡ Proactive Alert: Raw Material Cost Surge"}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full font-mono text-[10px] font-extrabold bg-rose-900 text-rose-200 border border-rose-600 animate-pulse">
                        +{activeMarketAlert.percentChange}% {isAr ? "قفزة فورية" : "SURGE"}
                      </span>
                    </div>
                    <div className="text-sm font-extrabold text-white">
                      {isAr ? activeMarketAlert.headlineAr : activeMarketAlert.headline}
                    </div>
                    <p className="text-[11px] text-zinc-200 leading-relaxed font-sans">
                      {isAr ? activeMarketAlert.summaryAr : activeMarketAlert.summary}
                    </p>
                    <div className="p-2.5 rounded-xl bg-black/40 border border-rose-500/30 text-[11px] text-rose-200">
                      <span className="font-bold text-rose-300">{isAr ? "الأثر على الموردين: " : "Vendor Impact: "}</span>
                      {isAr
                        ? activeMarketAlert?.impactOnVendors?.meridian?.textAr || "تقلبات الأسعار تؤثر بشكل متباين على الموردين بناءً على مخزونهم المحلي وفترات التوريد."
                        : activeMarketAlert?.impactOnVendors?.meridian?.text || "Spot fluctuations differentially impact vendors based on inventory locks and lead times."}
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] font-mono text-zinc-400">
                        {isAr ? `الفئة: ${activeMarketAlert.categoryAr}` : `Category: ${activeMarketAlert.category}`}
                      </span>
                      <button
                        onClick={() => {
                          setActiveTab("chat");
                          handleSendMessage(isAr ? activeMarketAlert.lantraDeepDivePromptAr : activeMarketAlert.lantraDeepDivePrompt);
                        }}
                        className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-all"
                      >
                        <Sparkles size={12} />
                        <span>{isAr ? "تحليل الأثر في المحادثة" : "Analyze in Chat"}</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {LANTRA_MARKET_INDICATORS.map((ind) => (
                    <div
                      key={ind.id}
                      className="p-3 rounded-xl bg-zinc-900/90 border border-white/10 hover:border-cyan-500/40 transition-all space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-zinc-200">
                          {isAr ? ind.nameAr : ind.name}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] font-mono font-bold">
                          {ind.trend === "up" && <TrendingUp size={12} className="text-rose-400" />}
                          {ind.trend === "down" && <TrendingDown size={12} className="text-emerald-400" />}
                          {ind.trend === "stable" && <Minus size={12} className="text-cyan-400" />}
                          <span
                            className={
                              ind.trend === "up"
                                ? "text-rose-400"
                                : ind.trend === "down"
                                ? "text-emerald-400"
                                : "text-cyan-400"
                            }
                          >
                            {ind.change}
                          </span>
                        </div>
                      </div>
                      <div className="text-base font-extrabold text-white font-mono">{ind.value}</div>
                      <p className="text-[10px] text-zinc-400 leading-normal">
                        {isAr ? ind.impactSummaryAr : ind.impactSummary}
                      </p>
                      <button
                        onClick={() =>
                          handleSendMessage(
                            isAr
                              ? `حلل أثر مؤشر (${ind.nameAr} - ${ind.value}) على أسعار ومخاطر منافسة RFQ-2026`
                              : `Analyze the impact of ${ind.name} (${ind.value}) on our RFQ-2026 vendor quotes and negotiation leverage`
                          )
                        }
                        className="mt-1 text-[10px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Sparkles size={10} />
                        <span>{isAr ? "اسأل لانـتـرا عن أثر هذا المؤشر" : "Ask LANTRA to analyze RFQ impact"}</span>
                      </button>
                    </div>
                  ))}
                </div>

                {/* Real-time Google Search News Feed Cards */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-zinc-200 flex items-center gap-1.5">
                      <Newspaper size={14} className="text-cyan-400" />
                      <span>{isAr ? "أحدث الأخبار والاتجاهات من Google Search" : "Live Trends & Bulletins (Google Search)"}</span>
                    </h4>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {newsArticles.length} {isAr ? "تقارير مرصودة" : "reports retrieved"}
                    </span>
                  </div>

                  {newsLoading ? (
                    <div className="py-10 flex flex-col items-center justify-center gap-3 text-zinc-400 bg-zinc-900/60 rounded-2xl border border-white/5">
                      <Loader2 size={24} className="text-cyan-400 animate-spin" />
                      <div className="text-xs font-medium text-zinc-300">
                        {isAr ? "جارٍ جلب أخبار الأسواق المباشرة عبر بحث Google..." : "Fetching live procurement trends via Google Search..."}
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {isAr ? "تحليل أسعار DDR5، لوائح LCGPA، والشحن اللوجستي" : "Grounding against global supply & Saudi Vision 2030 data"}
                      </span>
                    </div>
                  ) : (
                    (newsArticles.length > 0 ? newsArticles : LANTRA_PROCUREMENT_NEWS.map(n => ({
                      id: n.id,
                      title: isAr ? n.titleAr : n.title,
                      source: "Saudi Procurement Gazette",
                      timeAgo: n.date,
                      category: n.category as any,
                      categoryLabel: isAr ? n.categoryAr : n.category,
                      summary: isAr ? n.summaryAr : n.summary,
                      impactOnRFQ: isAr ? n.rfqImpactAr : n.rfqImpact,
                      recommendedAction: isAr ? n.recommendedActionAr : n.recommendedAction,
                      chatSummaryPrompt: isAr
                        ? `اشرح تفصيلياً كيف ينطبق قرار (${n.titleAr}) على مناقصة الخوادم RFQ-2026 وما هو موقف كل مورد`
                        : `Explain in detail how the bulletin "${n.title}" applies to our RFQ-2026 tender and which vendor is favored.`,
                    }))).filter(item => selectedNewsCategory === "all" || item.category === selectedNewsCategory).map((article) => {
                      const isSaudi = article.category === "saudi";
                      const isHw = article.category === "hardware";
                      const isLog = article.category === "logistics";
                      const isSw = article.category === "software";

                      const categoryBadgeColor = isSaudi
                        ? "bg-emerald-950 text-emerald-300 border-emerald-800/80"
                        : isSw
                        ? "bg-cyan-950 text-cyan-300 border-cyan-800/80"
                        : isHw
                        ? "bg-blue-950 text-blue-300 border-blue-800/80"
                        : isLog
                        ? "bg-amber-950 text-amber-300 border-amber-800/80"
                        : "bg-purple-950 text-purple-300 border-purple-800/80";

                      return (
                        <div
                          key={article.id}
                          className="p-4 rounded-2xl bg-zinc-900/90 border border-white/10 hover:border-cyan-500/50 transition-all space-y-2.5 shadow-sm group"
                        >
                          {/* Card Header */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${categoryBadgeColor}`}>
                                {article.categoryLabel || article.category}
                              </span>
                              <span className="text-[10px] text-zinc-400 font-mono">
                                • {article.source}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500 shrink-0">
                              <Clock size={10} />
                              <span>{article.timeAgo}</span>
                            </div>
                          </div>

                          {/* Article Title */}
                          <h5 className="font-bold text-white text-xs sm:text-sm leading-snug group-hover:text-cyan-300 transition-colors">
                            {article.title}
                          </h5>

                          {/* Article Summary */}
                          <p className="text-[11px] text-zinc-300 leading-relaxed font-sans">
                            {article.summary}
                          </p>

                          {/* Structured Tender & RFQ Impact Breakdown */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            <div className="bg-black/50 p-2.5 rounded-xl border border-cyan-500/20 space-y-1">
                              <div className="text-[10px] font-mono font-bold text-cyan-400 flex items-center gap-1">
                                <Zap size={11} />
                                <span>{isAr ? "الأثر على المنافسة (RFQ-2026):" : "RFQ-2026 Tender Impact:"}</span>
                              </div>
                              <p className="text-[11px] text-zinc-300 leading-normal">
                                {article.impactOnRFQ}
                              </p>
                            </div>

                            <div className="bg-black/50 p-2.5 rounded-xl border border-emerald-500/20 space-y-1">
                              <div className="text-[10px] font-mono font-bold text-emerald-400 flex items-center gap-1">
                                <ShieldCheck size={11} />
                                <span>{isAr ? "الإجراء الموصى به:" : "Recommended Strategy:"}</span>
                              </div>
                              <p className="text-[11px] text-zinc-300 leading-normal">
                                {article.recommendedAction}
                              </p>
                            </div>
                          </div>

                          {/* Card Action Toolbar */}
                          <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-2">
                            <button
                              onClick={() => handleSummarizeNewsInChat(article)}
                              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-cyan-600/20 active:scale-95 transition-all"
                            >
                              <LantraAvatar size="xs" showStatusIndicator={false} />
                              <span>{isAr ? "عرض الملخص في المحادثة" : "Summarize in Chat (LANTRA AI)"}</span>
                            </button>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  handleSendMessage(
                                    isAr
                                      ? `قارن موقف الموردين (ميريديان مقابل آيرون كلاد مقابل فانتاج) على ضوء هذا التقرير: ${article.title}`
                                      : `Compare vendor exposure (Meridian vs Ironclad vs Vantage) in light of: ${article.title}`
                                  )
                                }
                                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[11px] font-medium transition-colors cursor-pointer"
                              >
                                {isAr ? "مقارنة الموردين" : "Compare Vendors"}
                              </button>

                              <button
                                onClick={() => {
                                  const textToCopy = `${article.title}\nSource: ${article.source} (${article.timeAgo})\n\nSummary:\n${article.summary}\n\nTender Impact:\n${article.impactOnRFQ}\n\nRecommended Action:\n${article.recommendedAction}`;
                                  navigator.clipboard.writeText(textToCopy);
                                  setCopiedTurnId(article.id);
                                  setTimeout(() => setCopiedTurnId(null), 2000);
                                }}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                                title="Copy news summary"
                              >
                                {copiedTurnId === article.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* 4. AUDIT & TRANSCRIPT HISTORY TAB */}
            {activeTab === "history" && (
              <div className={`flex-1 overflow-y-auto p-4 space-y-4 text-xs ${themeStyles.messagesBg} w-full`}>
                {/* Search Bar */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    value={historySearchQuery}
                    onChange={(e) => setHistorySearchQuery(e.target.value)}
                    placeholder={isAr ? "بحث في سجل الاستفسارات والمحادثات..." : "Search conversation turns..."}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Turns List */}
                <div className="space-y-2.5">
                  {filteredTurns.length === 0 ? (
                    <div className="text-center py-8 text-zinc-500 text-xs">
                      {isAr ? "لا توجد سجلات مطابقة للبحث" : "No matching conversation turns found"}
                    </div>
                  ) : (
                    filteredTurns.map((turn) => (
                      <div
                        key={turn.turnIndex}
                        className="p-3 rounded-xl bg-zinc-900/90 border border-white/10 hover:border-cyan-500/40 transition-all space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                            {turn.topicTag} (Turn #{turn.turnIndex})
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">{turn.userMessage.time}</span>
                        </div>
                        <div className="text-white font-medium text-xs">
                          Q: {turn.userMessage.text}
                        </div>
                        {turn.assistantMessage && (
                          <div className="text-zinc-400 text-[11px] line-clamp-2">
                            A: {turn.assistantMessage.text}
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-1 border-t border-white/5">
                          <button
                            onClick={() => handleJumpToTurn(turn.userMessage.id)}
                            className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                          >
                            <ArrowRight size={11} />
                            <span>{isAr ? "عرض في المحادثة" : "Jump to Turn"}</span>
                          </button>
                          <button
                            onClick={() => handleCopyTurn(turn)}
                            className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
                          >
                            {copiedTurnId === turn.userMessage.id ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                            <span>{copiedTurnId === turn.userMessage.id ? (isAr ? "تم النسخ" : "Copied") : (isAr ? "نسخ" : "Copy")}</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
