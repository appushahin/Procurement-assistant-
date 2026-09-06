import React, { useState } from "react";
import { motion } from "motion/react";
import {
  FileText,
  Percent,
  TrendingDown,
  Mail,
  Copy,
  Check,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Send,
  Building2,
  DollarSign,
  Clock,
  Shield,
  HelpCircle,
  FileCheck,
} from "lucide-react";
import { StructuredVendorData, VendorBinaryGateMap, VendorScores, CurrencyCode } from "../types";
import { VENDOR_NAMES } from "../data";
import { AppLanguage, TRANSLATIONS } from "../translations";

interface AiNegotiationPlaybookProps {
  data: StructuredVendorData;
  scores: VendorScores;
  binaryGates: VendorBinaryGateMap;
  currency: CurrencyCode;
  formatCurrency: (priceUSD: number, targetCurrency: CurrencyCode) => string;
  lang?: AppLanguage;
  onOpenLetterGenerator?: (vendorKey: string) => void;
}

export function AiNegotiationPlaybook({
  data,
  scores,
  binaryGates,
  currency,
  formatCurrency,
  lang = "en",
  onOpenLetterGenerator,
}: AiNegotiationPlaybookProps) {
  const [selectedVendor, setSelectedVendor] = useState<string>("meridian");
  const [targetDiscount, setTargetDiscount] = useState<number>(6);
  const [requestExpediteWeeks, setRequestExpediteWeeks] = useState<number>(2);
  const [requestWarrantyYears, setRequestWarrantyYears] = useState<number>(1);
  const [letterLanguage, setLetterLanguage] = useState<"en" | "ar">("en");
  const [copied, setCopied] = useState<boolean>(false);

  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const vendorKeys = Object.keys(data);

  const currentVendorData = data[selectedVendor] || {
    priceUSD: 84500,
    leadTimeWeeks: 9,
    warrantyYears: 5,
    supportSLA: "24/7",
    redundancyCertified: true,
    certifications: ["ISO 9001"],
    specsSummary: "",
  };

  const currentScore = scores[selectedVendor];
  const isDisqualified = currentScore?.isDisqualified;

  // 1. Identify Top-Ranked Qualified Vendor and Flip-to-Win Thresholds
  const qualifiedRanked = Object.keys(scores)
    .filter((k) => !scores[k]?.isDisqualified)
    .sort((a, b) => (scores[b]?.weighted || 0) - (scores[a]?.weighted || 0));

  const topRankedKey = qualifiedRanked[0] || "meridian";
  const runnerUpKey = qualifiedRanked[1] || "apex";
  const topRankedScore = scores[topRankedKey]?.weighted || 0;
  const isCurrentTopRanked = selectedVendor === topRankedKey;

  // Gap to leader
  const scoreGapToLeader = Math.max(0, topRankedScore - (currentScore?.weighted || 0));
  
  // Estimated Concessions needed to flip
  const calculatedFlipDiscount = Math.min(18, Math.max(3, Math.ceil(scoreGapToLeader * 1.35)));
  const calculatedFlipExpedite = Math.min(Math.max(1, currentVendorData.leadTimeWeeks - 5), Math.max(1, Math.ceil(scoreGapToLeader / 3)));
  const calculatedFlipWarranty = Math.min(2, Math.max(1, Math.ceil(scoreGapToLeader / 5)));

  // Apply Flip Target handler
  const handleApplyFlipTargets = () => {
    if (isCurrentTopRanked) {
      setTargetDiscount(5); // Safe defensive discount
      setRequestExpediteWeeks(1);
      setRequestWarrantyYears(1);
    } else {
      setTargetDiscount(calculatedFlipDiscount);
      setRequestExpediteWeeks(calculatedFlipExpedite);
      setRequestWarrantyYears(calculatedFlipWarranty);
    }
  };

  // Find price benchmarks
  const prices = vendorKeys.map((k) => data[k]?.priceUSD || 0);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  const originalPrice = currentVendorData.priceUSD;
  const discountedPrice = originalPrice * (1 - targetDiscount / 100);
  const totalSavings = originalPrice - discountedPrice;

  // Specific negotiation tactical angles
  const tacticalPoints = [
    {
      title: "Price Parity Leverage",
      desc:
        selectedVendor === "meridian"
          ? `Competitor DELL (Ironclad) is priced at ${formatCurrency(data.ironclad?.priceUSD || 61200, currency)} (${Math.round(
              ((originalPrice - (data.ironclad?.priceUSD || 61200)) / originalPrice) * 100
            )}% lower). Ask for a ${targetDiscount}% concession to match enterprise volume budget.`
          : `Market pricing benchmarks indicate an achievable ${targetDiscount}% concession for multi-site commitment.`,
      icon: <DollarSign size={16} className="text-emerald-400" />,
    },
    {
      title: "Delivery Lead-Time Acceleration",
      desc: `Push delivery from ${currentVendorData.leadTimeWeeks} weeks down to ${Math.max(
        1,
        currentVendorData.leadTimeWeeks - requestExpediteWeeks
      )} weeks without expedited fee surcharges.`,
      icon: <Clock size={16} className="text-amber-400" />,
    },
    {
      title: "Service SLA & Warranty Enhancement",
      desc: `Request an additional ${requestWarrantyYears} year comprehensive on-site SLA warranty at zero surcharge to bridge the risk spread.`,
      icon: <Shield size={16} className="text-cyan-400" />,
    },
  ];

  // Generated draft email in English
  const englishDraft = `Subject: Lantern Procurement — RFP-2026-0803: Commercial Clarifications & BAFO Request (${VENDOR_NAMES[selectedVendor] || selectedVendor})

Dear Commercial & Sales Team at ${VENDOR_NAMES[selectedVendor] || selectedVendor},

Thank you for your formal proposal submitted for RFQ-2026-0803 (Mission-Critical Redundant Server Infrastructure). 

Following our technical evaluation committee review, your proposal demonstrated high technical alignment with our operations. However, to achieve final procurement committee award authorization, we request the following Best & Final Offer (BAFO) adjustments:

1. COMMERCIAL ADJUSTMENT:
- Quoted Amount: ${formatCurrency(originalPrice, currency)}
- Target BAFO Amount: ${formatCurrency(discountedPrice, currency)} (Represents a ${targetDiscount}% commercial optimization).

2. DELIVERY SCHEDULE COMMITMENT:
- Target delivery window reduced from ${currentVendorData.leadTimeWeeks} weeks to ${Math.max(1, currentVendorData.leadTimeWeeks - requestExpediteWeeks)} weeks ex-works, with waiver of any expedited processing surcharges.

3. GOVERNANCE & EXTENDED WARRANTY:
- Provide confirmation of ${currentVendorData.warrantyYears + requestWarrantyYears} Years next-business-day on-site SLA support and full ISO / Saudi Regulatory certification dossiers.

Please submit your revised BAFO addendum by Thursday, 5:00 PM AST so we may finalize contract sign-off.

Sincerely,
Procurement Governance Committee
Lantern Procurement Intelligence & Operations
https://www.lantern.com.sa/`;

  // Generated draft email in Arabic
  const arabicDraft = `الموضوع: طلب العرض المالي والتشغيلي النهائي (BAFO) — منافسة RFQ-2026-0803 (${VENDOR_NAMES[selectedVendor] || selectedVendor})

السادة / فريق المبيعات والعقود في شركة ${VENDOR_NAMES[selectedVendor] || selectedVendor} المحترمين،

تحية طيبة وبعد،

نشكركم على تقديم عرضكم الفني والمالي لمشروع البنية التحتية للخوادم المزدوجة فائقة التوافر (RFQ-2026-0803).

بعد استكمال مرحلة التقييم الفني المبدئي من قبل لجنة المشتريات والحوكمة، نود إحاطتكم بأن عرضكم حقق توافقاً فنياً متميزاً، ولغرض استكمال إجراءات الترسية النهائية واعتماد أمر الشراء، نأمل منكم تقديم العرض النهائي والأفضل (BAFO) متضمناً التحسينات التالية:

1. التحسين المالي المستهدف:
- السعر الأساسي المقدم: ${formatCurrency(originalPrice, currency)}
- السعر المستهدف بعد الخصم: ${formatCurrency(discountedPrice, currency)} (بنسبة تحسين تجاري قدرها ${targetDiscount}%).

2. تسريع الجداول الزمنية للتوريد:
- تقليص مدة التوريد من ${currentVendorData.leadTimeWeeks} أسابيع إلى ${Math.max(1, currentVendorData.leadTimeWeeks - requestExpediteWeeks)} أسابيع دون احتساب رسوم تسريع إضافية.

3. الضمان ودعم العمليات:
- تمديد فترة الضمان الشامل لقطع الغيار والدعم الميداني إلى ${currentVendorData.warrantyYears + requestWarrantyYears} سنوات، مع إرفاق شهادات المحتوى المحلي والامتثال التنظيمي المعتمدة.

نرجو التكرم بتزويدنا بخطاب العرض المعدل قبل نهاية دوام يوم الخميس القادم الساعة 5:00 مساءً بتوقيت مكة المكرمة.

وتفضلوا بقبول فائق التحية والتقدير،،
لجنة حوكمة المشتريات وسلاسل الإمداد
منصة فانوس للذكاء الشرائي
https://www.lantern.com.sa/`;

  const activeDraft = letterLanguage === "en" ? englishDraft : arabicDraft;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="glass-card p-5 sm:p-6 rounded-2xl border border-white/10 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-pink-400 animate-pulse" />
            <h3 className="text-base font-bold text-white tracking-wide">
              {lang === "ar" ? "خطة التفاوض الذكية ومولد العروض المقابلة (AI Playbook)" : "AI Negotiation Playbook & Counter-Offer Generator"}
            </h3>
            <span className="px-2 py-0.5 rounded-md bg-pink-500/20 text-pink-300 text-[10px] font-mono border border-pink-500/30">
              BAFO Strategy
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            {lang === "ar"
              ? "تحليل هوامش التفاوض وتوليد خطابات رسمية باللغتين العربية والإنجليزية لخفض التكاليف وتحسين الشروط."
              : "Tactical discount targets, concession points, and ready-to-send bilingual counter-proposal drafts."}
          </p>
        </div>

        {/* Vendor Selector Pill Group */}
        <div className="flex items-center gap-1.5 bg-zinc-950/80 p-1 rounded-xl border border-white/10">
          {vendorKeys.map((key) => (
            <button
              key={key}
              onClick={() => setSelectedVendor(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedVendor === key
                  ? "bg-pink-600 text-white shadow-md shadow-pink-600/40"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {VENDOR_NAMES[key] || key}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Left Controls & Targets, Right Generated Letter */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Simulation Sliders (5 cols) */}
        <div className="lg:col-span-5 space-y-5 bg-zinc-900/40 p-4 rounded-xl border border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
              {lang === "ar" ? "أهداف التفاوض المباشر" : "Negotiation Targets"}
            </span>
            <span className="text-xs font-mono text-pink-400 font-semibold">
              {VENDOR_NAMES[selectedVendor]}
            </span>
          </div>

          {/* Flip-to-Win Recommendation Threshold Card */}
          <div className={`p-3.5 rounded-xl border text-xs space-y-2 ${
            isCurrentTopRanked
              ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200"
              : "bg-gradient-to-r from-pink-950/50 via-zinc-950 to-zinc-950 border-pink-500/40 text-pink-200"
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold flex items-center gap-1.5 uppercase text-[11px]">
                <Sparkles size={14} className={isCurrentTopRanked ? "text-emerald-400" : "text-pink-400"} />
                <span>{isCurrentTopRanked ? "Rank #1 Leader (Defensive Margin)" : "Flip-to-Win Threshold Engine"}</span>
              </span>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-black/40 border border-white/10 text-white">
                {isCurrentTopRanked ? "Leader" : `Trails #${topRankedKey === selectedVendor ? "1" : "1"} by -${scoreGapToLeader.toFixed(1)} pts`}
              </span>
            </div>

            <p className="text-[11px] text-zinc-300 leading-relaxed font-sans">
              {isCurrentTopRanked
                ? `You hold Rank #1 (${topRankedScore} pts). Extract up to 5% (${formatCurrency(originalPrice * 0.05, currency)}) additional savings before risking rank displacement.`
                : `To flip rank and overtake ${VENDOR_NAMES[topRankedKey] || topRankedKey}, target a ${calculatedFlipDiscount}% price concession (${formatCurrency(originalPrice * (calculatedFlipDiscount / 100), currency)}) and ${calculatedFlipExpedite}-week lead time acceleration.`}
            </p>

            <button
              onClick={handleApplyFlipTargets}
              className={`w-full py-1.5 px-3 rounded-lg font-mono text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                isCurrentTopRanked
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                  : "bg-pink-600 hover:bg-pink-500 text-white shadow-pink-600/30"
              }`}
            >
              <ArrowRight size={13} />
              <span>{isCurrentTopRanked ? "Apply 5% Defensive Discount" : `Auto-Apply Flip Target (${calculatedFlipDiscount}% + ${calculatedFlipExpedite}w)`}</span>
            </button>
          </div>

          {/* Current vs Target Financial Card */}
          <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-white/10 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">{lang === "ar" ? "السعر الأساسي المقدم:" : "Quoted Price:"}</span>
              <span className="font-mono text-zinc-200 font-semibold">{formatCurrency(originalPrice, currency)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-emerald-400 font-semibold">{lang === "ar" ? "السعر المستهدف بعد الخصم:" : "Target BAFO Price:"}</span>
              <span className="font-mono text-emerald-400 font-bold text-sm">{formatCurrency(discountedPrice, currency)}</span>
            </div>
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-400">{lang === "ar" ? "الوفر المالي المتوقع:" : "Potential Savings:"}</span>
              <span className="text-pink-400 font-bold">-{formatCurrency(totalSavings, currency)} ({targetDiscount}%)</span>
            </div>
          </div>

          {/* Target Discount Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="text-zinc-300 font-medium">{lang === "ar" ? "نسبة الخصم المستهدفة:" : "Target Discount:"}</label>
              <span className="font-mono text-pink-400 font-bold">{targetDiscount}%</span>
            </div>
            <input
              type="range"
              min={1}
              max={25}
              step={1}
              value={targetDiscount}
              onChange={(e) => setTargetDiscount(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
              <span>1% (Gentle)</span>
              <span>10% (Market Mean)</span>
              <span>25% (Aggressive)</span>
            </div>
          </div>

          {/* Lead Time Expedite Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="text-zinc-300 font-medium">{lang === "ar" ? "تقليص مدة التوريد:" : "Expedite Lead Time:"}</label>
              <span className="font-mono text-amber-400 font-bold">-{requestExpediteWeeks} {lang === "ar" ? "أسابيع" : "Weeks"}</span>
            </div>
            <input
              type="range"
              min={0}
              max={Math.min(6, currentVendorData.leadTimeWeeks - 1)}
              step={1}
              value={requestExpediteWeeks}
              onChange={(e) => setRequestExpediteWeeks(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          {/* Warranty Extension Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="text-zinc-300 font-medium">{lang === "ar" ? "تمديد فترة الضمان:" : "Extend SLA Warranty:"}</label>
              <span className="font-mono text-cyan-400 font-bold">+{requestWarrantyYears} {lang === "ar" ? "سنوات" : "Years"}</span>
            </div>
            <input
              type="range"
              min={0}
              max={3}
              step={1}
              value={requestWarrantyYears}
              onChange={(e) => setRequestWarrantyYears(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          {/* Tactical Leverage Cards */}
          <div className="space-y-2 pt-2">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              {lang === "ar" ? "نقاط قوة الموقف التفاوضي" : "Tactical Negotiation Levers"}
            </span>
            <div className="space-y-2">
              {tacticalPoints.map((pt, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-zinc-950/60 border border-white/5 flex items-start gap-2 text-xs">
                  <div className="shrink-0 mt-0.5">{pt.icon}</div>
                  <div>
                    <div className="font-semibold text-zinc-200">{pt.title}</div>
                    <div className="text-zinc-400 text-[11px] leading-relaxed mt-0.5">{pt.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Ready-to-Send Counter-Offer Draft (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail size={16} className="text-pink-400" />
              <span className="text-xs font-bold text-zinc-200">
                {lang === "ar" ? "مسودة الخطاب الرسمي المقابل" : "Ready-to-Send Official Counter-Proposal"}
              </span>
            </div>

            {/* Language Switcher for Letter */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center bg-zinc-950/80 p-0.5 rounded-lg border border-white/10 text-xs">
                <button
                  onClick={() => setLetterLanguage("en")}
                  className={`px-2.5 py-1 rounded-md transition-all font-medium cursor-pointer ${
                    letterLanguage === "en" ? "bg-zinc-800 text-white font-bold" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => setLetterLanguage("ar")}
                  className={`px-2.5 py-1 rounded-md transition-all font-medium cursor-pointer ${
                    letterLanguage === "ar" ? "bg-zinc-800 text-white font-bold" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  العربية
                </button>
              </div>

              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 border border-white/10 transition-all cursor-pointer shadow-sm"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copied ? (lang === "ar" ? "تم النسخ!" : "Copied!") : (lang === "ar" ? "نسخ المسودة" : "Copy Draft")}</span>
              </button>
            </div>
          </div>

          {/* Letter Text Area Container */}
          <div
            dir={letterLanguage === "ar" ? "rtl" : "ltr"}
            className="flex-1 min-h-[360px] p-4 rounded-xl bg-zinc-950/90 border border-white/10 text-xs font-mono text-zinc-300 leading-relaxed overflow-y-auto whitespace-pre-line shadow-inner select-text"
          >
            {activeDraft}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>{lang === "ar" ? "متوافق مع حوكمة المشتريات ومعايير BAFO" : "Standardized BAFO governance format"}</span>
            </span>

            {onOpenLetterGenerator && (
              <button
                onClick={() => onOpenLetterGenerator(selectedVendor)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold flex items-center gap-1.5 shadow-lg shadow-pink-600/30 transition-all cursor-pointer text-xs"
              >
                <FileCheck size={14} />
                <span>{lang === "ar" ? "فتح محرر الخطابات المتقدم" : "Open Full Letter Builder"}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
