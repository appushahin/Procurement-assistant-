import React, { useState } from "react";
import { motion } from "motion/react";
import {
  History,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Clock,
  Shield,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { StructuredVendorData, CurrencyCode } from "../types";
import { VENDOR_NAMES } from "../data";
import { AppLanguage, TRANSLATIONS } from "../translations";

interface BafoRevisionDiffProps {
  data: StructuredVendorData;
  currency: CurrencyCode;
  formatCurrency: (priceUSD: number, targetCurrency: CurrencyCode) => string;
  lang?: AppLanguage;
  onApplyRevisedOffer?: (vendorKey: string, revisedMetrics: any) => void;
}

interface VendorRevision {
  initialPrice: number;
  revisedPrice: number;
  initialLeadWeeks: number;
  revisedLeadWeeks: number;
  initialWarrantyYears: number;
  revisedWarrantyYears: number;
  status: "submitted" | "pending";
  date: string;
  notes: string;
}

export function BafoRevisionDiff({
  data,
  currency,
  formatCurrency,
  lang = "en",
  onApplyRevisedOffer,
}: BafoRevisionDiffProps) {
  const [selectedVendor, setSelectedVendor] = useState<string>("meridian");
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  // Realistic sample BAFO revisions data
  const [revisions, setRevisions] = useState<Record<string, VendorRevision>>({
    meridian: {
      initialPrice: 84500,
      revisedPrice: 79500,
      initialLeadWeeks: 9,
      revisedLeadWeeks: 7,
      initialWarrantyYears: 5,
      revisedWarrantyYears: 5,
      status: "submitted",
      date: "2026-08-25 16:30 AST",
      notes: "Commercial optimization: 5.9% discount + expedited delivery schedule with waived rush fee.",
    },
    ironclad: {
      initialPrice: 61200,
      revisedPrice: 58900,
      initialLeadWeeks: 16,
      revisedLeadWeeks: 14,
      initialWarrantyYears: 3,
      revisedWarrantyYears: 4,
      status: "submitted",
      date: "2026-08-24 11:15 AST",
      notes: "Added 1-year extended warranty and shaved 2 weeks off manufacturing lead time.",
    },
    vantage: {
      initialPrice: 71800,
      revisedPrice: 67500,
      initialLeadWeeks: 11,
      revisedLeadWeeks: 10,
      initialWarrantyYears: 4,
      revisedWarrantyYears: 5,
      status: "submitted",
      date: "2026-08-25 09:40 AST",
      notes: "Integrated failover software license subsidy into base price and extended parts warranty.",
    },
  });

  const rev = revisions[selectedVendor] || {
    initialPrice: data[selectedVendor]?.priceUSD || 80000,
    revisedPrice: (data[selectedVendor]?.priceUSD || 80000) * 0.95,
    initialLeadWeeks: data[selectedVendor]?.leadTimeWeeks || 10,
    revisedLeadWeeks: Math.max(1, (data[selectedVendor]?.leadTimeWeeks || 10) - 1),
    initialWarrantyYears: data[selectedVendor]?.warrantyYears || 3,
    revisedWarrantyYears: (data[selectedVendor]?.warrantyYears || 3) + 1,
    status: "submitted",
    date: "2026-08-25",
    notes: "Revised BAFO submission",
  };

  const priceDiff = rev.revisedPrice - rev.initialPrice;
  const pricePct = ((priceDiff / rev.initialPrice) * 100).toFixed(1);
  const leadDiff = rev.revisedLeadWeeks - rev.initialLeadWeeks;
  const warrantyDiff = rev.revisedWarrantyYears - rev.initialWarrantyYears;

  const handleApply = () => {
    if (onApplyRevisedOffer) {
      onApplyRevisedOffer(selectedVendor, {
        ...data[selectedVendor],
        priceUSD: rev.revisedPrice,
        leadTimeWeeks: rev.revisedLeadWeeks,
        warrantyYears: rev.revisedWarrantyYears,
      });
    }
  };

  return (
    <div className="glass-card p-5 sm:p-6 rounded-2xl border border-white/10 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <History size={18} className="text-emerald-400 animate-pulse" />
            <h3 className="text-base font-bold text-white tracking-wide">
              {lang === "ar" ? "فاحص الفروقات بين مراجعات عروض الأسعار (BAFO Diff)" : "BAFO Quote Amendment Diff Inspector"}
            </h3>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/30">
              Version Tracker
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            {lang === "ar"
              ? "مقارنة تلقائية تسلط الضوء على الفروقات المالية والتشغيلية بين العرض المبدئي وعرض BAFO المعدل."
              : "Audit trail comparing initial submitted quotes against Best & Final Offers (BAFO)."}
          </p>
        </div>

        {/* Vendor Selector Pill Group */}
        <div className="flex items-center gap-1.5 bg-zinc-950/80 p-1 rounded-xl border border-white/10">
          {Object.keys(data).map((key) => (
            <button
              key={key}
              onClick={() => setSelectedVendor(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedVendor === key
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/40"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {VENDOR_NAMES[key] || key}
            </button>
          ))}
        </div>
      </div>

      {/* 3 Metric Diff Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1: Price Delta */}
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1.5">
              <DollarSign size={14} className="text-emerald-400" />
              <span>{lang === "ar" ? "السعر الإجمالي" : "Total Price"}</span>
            </span>
            <span className="font-mono text-emerald-400 font-bold">{pricePct}%</span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <div className="text-xs line-through text-zinc-500 font-mono">
              {formatCurrency(rev.initialPrice, currency)}
            </div>
            <ArrowRight size={14} className="text-zinc-500" />
            <div className="text-sm font-bold text-white font-mono">
              {formatCurrency(rev.revisedPrice, currency)}
            </div>
          </div>
          <div className="text-[11px] text-emerald-400 font-mono font-medium">
            {priceDiff < 0
              ? `${lang === "ar" ? "توفير تجاري بمقدار" : "Commercial Savings of"} ${formatCurrency(Math.abs(priceDiff), currency)}`
              : "No change"}
          </div>
        </div>

        {/* Metric 2: Lead Time Delta */}
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Clock size={14} className="text-amber-400" />
              <span>{lang === "ar" ? "مدة التوريد" : "Lead Time"}</span>
            </span>
            <span className="font-mono text-amber-400 font-bold">{leadDiff} {lang === "ar" ? "أسابيع" : "wks"}</span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <div className="text-xs line-through text-zinc-500 font-mono">
              {rev.initialLeadWeeks} {lang === "ar" ? "أسابيع" : "weeks"}
            </div>
            <ArrowRight size={14} className="text-zinc-500" />
            <div className="text-sm font-bold text-white font-mono">
              {rev.revisedLeadWeeks} {lang === "ar" ? "أسابيع" : "weeks"}
            </div>
          </div>
          <div className="text-[11px] text-amber-400 font-mono font-medium">
            {leadDiff < 0 ? `${lang === "ar" ? "تسريع الجدول الزمني بمقدار" : "Accelerated delivery by"} ${Math.abs(leadDiff)} ${lang === "ar" ? "أسابيع" : "weeks"}` : "Unchanged"}
          </div>
        </div>

        {/* Metric 3: Warranty Delta */}
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Shield size={14} className="text-cyan-400" />
              <span>{lang === "ar" ? "فترة الضمان" : "Warranty Period"}</span>
            </span>
            <span className="font-mono text-cyan-400 font-bold">+{warrantyDiff} {lang === "ar" ? "سنوات" : "yrs"}</span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <div className="text-xs line-through text-zinc-500 font-mono">
              {rev.initialWarrantyYears} {lang === "ar" ? "سنوات" : "years"}
            </div>
            <ArrowRight size={14} className="text-zinc-500" />
            <div className="text-sm font-bold text-white font-mono">
              {rev.revisedWarrantyYears} {lang === "ar" ? "سنوات" : "years"}
            </div>
          </div>
          <div className="text-[11px] text-cyan-400 font-mono font-medium">
            {warrantyDiff > 0 ? `${lang === "ar" ? "تمديد الضمان بمقدار" : "Extended coverage by"} ${warrantyDiff} ${lang === "ar" ? "سنة إضافية" : "year"}` : "Unchanged"}
          </div>
        </div>
      </div>

      {/* Submission Audit Log Bar */}
      <div className="p-4 rounded-xl bg-zinc-950/80 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={15} className="text-emerald-400" />
            <span className="font-bold text-zinc-200">
              {lang === "ar" ? "مذكرة التعديل الرسمية من المورد:" : "Vendor Official Amendment Note:"}
            </span>
            <span className="text-[11px] font-mono text-zinc-500">{rev.date}</span>
          </div>
          <p className="text-zinc-400 italic pl-6">{rev.notes}</p>
        </div>

        <button
          onClick={handleApply}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all cursor-pointer whitespace-nowrap"
        >
          <Sparkles size={14} />
          <span>{lang === "ar" ? "تطبيق تعديلات BAFO على الجدول النشط" : "Apply BAFO Values to Active Ledger"}</span>
        </button>
      </div>
    </div>
  );
}
