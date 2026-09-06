import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, AlertCircle, Shield, Award, Clock, DollarSign, Columns, LayoutGrid, ArrowRightLeft, Zap, Edit3, ListOrdered, Trophy, Sparkles, Globe, RefreshCw } from "lucide-react";
import { StructuredVendorData, VendorScores, VendorMetrics, CurrencyCode, ExchangeRates, VendorBinaryGateMap } from "../types";
import { VENDOR_NAMES } from "../data";
import { EditVendorModal } from "./EditVendorModal";
import { LanternLogo } from "./LanternLogo";
import { AppLanguage, TRANSLATIONS } from "../translations";

interface Props {
  data: StructuredVendorData;
  scores: VendorScores;
  isSimulated?: boolean;
  onUpdateVendorData?: (vendorKey: string, updatedMetrics: VendorMetrics) => void;
  binaryGates?: VendorBinaryGateMap;
  onToggleBinaryGate?: (vendorKey: string, gateKey: "failoverVerified" | "complianceCertified") => void;
  lang?: AppLanguage;
}

export function StandardizedLedgerTable({
  data,
  scores,
  isSimulated,
  onUpdateVendorData,
  binaryGates = {},
  onToggleBinaryGate,
  lang = "en",
}: Props) {
  const vendorKeys = Object.keys(VENDOR_NAMES);
  const [viewMode, setViewMode] = useState<"ranked" | "matrix" | "split">("ranked");
  const [editingVendorKey, setEditingVendorKey] = useState<string | null>(null);

  const isAr = lang === "ar";
  const t = TRANSLATIONS[lang];

  // Multi-Currency & Automated Exchange Rate State
  const [currency, setCurrency] = useState<CurrencyCode>("SAR");
  const [isFetchingRates, setIsFetchingRates] = useState<boolean>(false);
  const [ratesData, setRatesData] = useState<ExchangeRates>({
    base: "USD",
    rates: {
      USD: 1.0,
      SAR: 3.75, // SAMA Fixed Peg
      EUR: 0.918,
    },
    lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    source: "SAMA Peg / ECB Benchmark",
  });

  // Automated Exchange Rate Fetcher
  const fetchExchangeRates = async () => {
    setIsFetchingRates(true);
    try {
      const res = await fetch("/api/exchange-rates");
      if (res.ok) {
        const result = await res.json();
        if (result && result.rates) {
          setRatesData({
            base: "USD",
            rates: {
              USD: 1.0,
              SAR: Number(result.rates.SAR) || 3.75,
              EUR: Number(result.rates.EUR) || 0.918,
            },
            lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            source: result.source || "Automated Rates Feed",
          });
        }
      }
    } catch (err) {
      console.error("Exchange rate lookup error, using SAMA peg fallback", err);
    } finally {
      setIsFetchingRates(false);
    }
  };

  useEffect(() => {
    fetchExchangeRates();
  }, []);

  // Price conversion & formatting utility
  const convertPrice = (priceUSD: number, targetCurrency: CurrencyCode) => {
    const rate = ratesData.rates[targetCurrency] || 1.0;
    return priceUSD * rate;
  };

  const formatCurrency = (priceUSD: number, targetCurrency: CurrencyCode) => {
    const converted = convertPrice(priceUSD, targetCurrency);
    if (targetCurrency === "SAR") {
      return `${Math.round(converted).toLocaleString()} SAR`;
    } else if (targetCurrency === "EUR") {
      return `€${Math.round(converted).toLocaleString()}`;
    } else {
      return `$${Math.round(converted).toLocaleString()}`;
    }
  };

  // Sort vendors by weighted score (highest score first)
  const sortedVendorKeys = useMemo(() => {
    return [...vendorKeys].sort(
      (a, b) => (scores[b]?.weighted || 0) - (scores[a]?.weighted || 0)
    );
  }, [vendorKeys, scores]);

  // Find top scoring vendor
  const topVendor = sortedVendorKeys[0] || vendorKeys[0];

  // Split screen selected vendors
  const [vendorA, setVendorA] = useState<string>(sortedVendorKeys[0] || vendorKeys[0] || "meridian");
  const [vendorB, setVendorB] = useState<string>(
    sortedVendorKeys[1] || vendorKeys.find((k) => k !== vendorKeys[0]) || "ironclad"
  );

  const metricsA = data[vendorA];
  const metricsB = data[vendorB];
  const scoreA = scores[vendorA];
  const scoreB = scores[vendorB];

  // Helper deltas calculation in selected currency
  const priceUSD_A = metricsA?.priceUSD || 0;
  const priceUSD_B = metricsB?.priceUSD || 0;
  const priceDiffUSD = priceUSD_A - priceUSD_B;
  const priceDiffConverted = convertPrice(Math.abs(priceDiffUSD), currency);
  const leadDiff = (metricsA?.leadTimeWeeks || 0) - (metricsB?.leadTimeWeeks || 0);
  const warrantyDiff = (metricsA?.warrantyYears || 0) - (metricsB?.warrantyYears || 0);

  return (
    <div className="glass-card p-6 rounded-2xl mb-8 border border-white/10 shadow-2xl relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="font-mono text-[11px] uppercase tracking-wider text-cyan-300 font-semibold bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-0.5 rounded-full">
              {isAr ? "الخطوة 2: جدول المقارنة المعياري الموحد" : "Step 2: Normalized Procurement Ledger"}
            </span>
            <LanternLogo size="sm" showTagline={false} animated={true} className="hidden sm:inline-flex ml-2 opacity-90" />
          </div>
          <h3 className="font-sans text-xl font-bold text-white tracking-tight mt-0.5">
            {isAr ? "مقارنة عروض الموردين المعيارية" : "Standardized Vendor Comparison"}
          </h3>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-between lg:justify-end">
          {isSimulated && (
            <span className="font-mono text-xs px-2.5 py-1 rounded-full bg-zinc-900 text-zinc-300 border border-white/10">
              {isAr ? "الوضع غير المتصل — تمت المعايرة محلياً" : "Offline Mode — Standardized locally"}
            </span>
          )}

          {/* View Mode Switcher */}
          <div className="w-full sm:w-auto flex rounded-xl border border-white/10 bg-zinc-950/80 p-1 backdrop-blur-md overflow-x-auto">
            <button
              onClick={() => setViewMode("ranked")}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer whitespace-nowrap ${
                viewMode === "ranked"
                  ? "bg-cyan-600 text-white shadow-md font-semibold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <ListOrdered size={14} />
              <span>{isAr ? "الترتيب حسب النقاط" : "Ranked Rows"}</span>
            </button>

            <button
              onClick={() => setViewMode("matrix")}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer whitespace-nowrap ${
                viewMode === "matrix"
                  ? "bg-cyan-600 text-white shadow-md font-semibold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <LayoutGrid size={14} />
              <span>{isAr ? "المصفوفة الكاملة" : "Full Matrix"}</span>
            </button>

            <button
              onClick={() => setViewMode("split")}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer whitespace-nowrap ${
                viewMode === "split"
                  ? "bg-cyan-600 text-white shadow-md font-semibold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Columns size={14} />
              <span>{isAr ? "مقارنة ثنائية متوازية" : "Split-Screen"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Multi-Currency Conversion Control Bar */}
      <div className="bg-zinc-950/90 p-3.5 rounded-xl border border-white/10 mb-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 font-mono text-xs shadow-inner">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-zinc-300 font-bold uppercase tracking-wider text-[11px]">
            <Globe size={15} className="text-emerald-400" />
            <span>Display Currency:</span>
          </div>

          {/* Currency Toggle Tabs */}
          <div className="inline-flex p-1 rounded-xl bg-zinc-900 border border-white/10">
            <button
              onClick={() => setCurrency("SAR")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                currency === "SAR"
                  ? "bg-emerald-600 text-white shadow-md scale-105"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <span>🇸🇦 SAR (ر.س)</span>
            </button>

            <button
              onClick={() => setCurrency("USD")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                currency === "USD"
                  ? "bg-emerald-600 text-white shadow-md scale-105"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <span>🇺🇸 USD ($)</span>
            </button>

            <button
              onClick={() => setCurrency("EUR")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                currency === "EUR"
                  ? "bg-emerald-600 text-white shadow-md scale-105"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <span>🇪🇺 EUR (€)</span>
            </button>
          </div>
        </div>

        {/* Live Automated Exchange Rates Ticker */}
        <div className="flex items-center justify-between sm:justify-start gap-3 text-[11px] text-zinc-400 bg-zinc-900/80 px-3 py-1.5 rounded-lg border border-white/10">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span>
              1 USD = <strong className="text-emerald-300">{ratesData.rates.SAR} SAR</strong> |{" "}
              <strong className="text-emerald-300">€{ratesData.rates.EUR}</strong>
            </span>
            <span className="text-zinc-500 hidden md:inline">({ratesData.source})</span>
          </div>

          <button
            onClick={fetchExchangeRates}
            disabled={isFetchingRates}
            className="p-1 rounded hover:bg-white/10 text-zinc-300 transition-colors cursor-pointer"
            title="Refresh Live Exchange Rates"
          >
            <RefreshCw size={13} className={isFetchingRates ? "animate-spin text-emerald-400" : ""} />
          </button>
        </div>
      </div>

      {/* Mode 1: Ranked Vendor Rows (Animated with Framer Motion layout) */}
      {viewMode === "ranked" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400 bg-zinc-950/60 p-3 rounded-xl border border-white/10">
            <div className="flex items-center gap-2 text-zinc-300 font-semibold">
              <Sparkles size={14} className="text-cyan-400 animate-pulse" />
              <span>Smooth Dynamic Reordering: Sorted by weighted score.</span>
            </div>
            <span className="text-[11px] text-zinc-500 font-normal hidden sm:inline">
              Sorted by Score (High → Low)
            </span>
          </div>

          {/* MOBILE VIEW CARDS (< sm screens) */}
          <div className="block sm:hidden space-y-3">
            <AnimatePresence mode="popLayout">
              {sortedVendorKeys.map((key, index) => {
                const score = scores[key]?.weighted || 0;
                const metrics = data[key];
                const isWinner = index === 0;

                return (
                  <motion.div
                    key={key}
                    layout
                    initial={{ opacity: 0, x: -24, filter: "blur(4px)" }}
                    animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: 0.95, filter: "blur(2px)" }}
                    transition={{
                      layout: { type: "spring", stiffness: 350, damping: 28 },
                      opacity: { duration: 0.35, delay: index * 0.06 },
                      x: { type: "spring", stiffness: 280, damping: 24, delay: index * 0.06 },
                      filter: { duration: 0.25, delay: index * 0.06 },
                    }}
                    className={`glass-card p-4 rounded-2xl border transition-all ${
                      isWinner
                        ? "bg-red-950/40 border-red-500/60 shadow-lg shadow-red-950/40"
                        : "bg-zinc-900/60 border-white/10"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 pb-3 border-b border-white/10">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-mono font-bold shadow-sm ${
                            isWinner
                              ? "bg-gradient-to-br from-red-500 to-rose-700 text-white shadow-red-600/40"
                              : index === 1
                              ? "bg-zinc-800 text-zinc-200 border border-zinc-700"
                              : "bg-zinc-900 text-zinc-400 border border-zinc-800"
                          }`}
                        >
                          #{index + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-sans font-bold text-white text-base">
                              {VENDOR_NAMES[key]}
                            </h4>
                            {isWinner && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] bg-red-600 text-white px-2 py-0.5 rounded-full font-bold shadow-sm uppercase">
                                <Trophy size={10} /> Top
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-zinc-400">
                            SLA: {metrics?.supportSLA || "Standard"}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setEditingVendorKey(key)}
                        className="p-2 rounded-lg text-zinc-300 hover:text-white bg-zinc-800/80 border border-white/10 hover:bg-zinc-700 transition-colors"
                        title={`Edit ${VENDOR_NAMES[key]}`}
                      >
                        <Edit3 size={14} className="text-red-400" />
                      </button>
                    </div>

                    <div className="py-3 space-y-2.5">
                      {/* Score Bar */}
                      <div>
                        <div className="flex items-center justify-between text-xs font-mono mb-1">
                          <span className="text-zinc-400">Weighted Score</span>
                          <span className={`font-extrabold text-sm ${isWinner ? "text-red-400" : "text-white"}`}>
                            {score} <span className="text-xs text-zinc-500 font-normal">/ 100</span>
                          </span>
                        </div>
                        <div className="w-full bg-zinc-950 rounded-full h-2 overflow-hidden border border-white/10">
                          <motion.div
                            className={`h-full rounded-full ${
                              isWinner ? "bg-gradient-to-r from-red-500 to-rose-400" : "bg-zinc-500"
                            }`}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                          />
                        </div>
                      </div>

                      {/* 2x2 Grid for Key Metrics */}
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                        <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-white/5">
                          <span className="text-[10px] text-zinc-400 block">Price ({currency})</span>
                          <span className="font-bold text-emerald-400 text-sm">
                            {formatCurrency(metrics?.priceUSD || 0, currency)}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-white/5">
                          <span className="text-[10px] text-zinc-400 block">Lead Time</span>
                          <span className="font-bold text-white text-sm">
                            {metrics?.leadTimeWeeks} <span className="text-xs text-zinc-400 font-normal">weeks</span>
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-white/5">
                          <span className="text-[10px] text-zinc-400 block">Warranty</span>
                          <span className="font-bold text-white text-sm">
                            {metrics?.warrantyYears} <span className="text-xs text-zinc-400 font-normal">years</span>
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-white/5 flex flex-col justify-center">
                          <span className="text-[10px] text-zinc-400 block">Failover</span>
                          {metrics?.redundancyCertified ? (
                            <span className="text-emerald-400 text-[11px] font-bold flex items-center gap-1">
                              <CheckCircle2 size={11} /> Certified
                            </span>
                          ) : (
                            <span className="text-red-400 text-[11px] font-bold flex items-center gap-1">
                              <AlertCircle size={11} /> Workaround
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* DESKTOP / TABLET TABLE VIEW (sm+ screens) */}
          <div className="hidden sm:block overflow-x-auto rounded-xl border border-white/10 shadow-2xl">
            <table className={`w-full text-xs font-mono border-collapse min-w-[750px] ${isAr ? "text-right" : "text-left"}`}>
              <thead>
                <tr className="border-b border-white/10 text-zinc-400 bg-zinc-950/90 uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4 font-semibold w-16">{isAr ? "الترتيب" : "Rank"}</th>
                  <th className="py-3.5 px-4 font-semibold">{isAr ? "اسم المورد" : "Vendor Name"}</th>
                  <th className="py-3.5 px-4 font-semibold">{isAr ? "الدرجة الموزونة" : "Weighted Score"}</th>
                  <th className="py-3.5 px-4 font-semibold">{isAr ? `السعر (${currency})` : `Price (${currency})`}</th>
                  <th className="py-3.5 px-4 font-semibold">{isAr ? "مدة التوريد" : "Lead Time"}</th>
                  <th className="py-3.5 px-4 font-semibold">{isAr ? "فترة الضمان" : "Warranty"}</th>
                  <th className="py-3.5 px-4 font-semibold">{isAr ? "بوابة تجاوز الأعطال" : "Failover Gate"}</th>
                  <th className="py-3.5 px-4 font-semibold">{isAr ? "بوابة الامتثال" : "Compliance Gate"}</th>
                  <th className={`py-3.5 px-4 font-semibold ${isAr ? "text-left" : "text-right"}`}>{isAr ? "الإجراءات" : "Actions"}</th>
                </tr>
              </thead>
              <motion.tbody layout className="divide-y divide-white/5 bg-zinc-900/40">
                <AnimatePresence mode="popLayout">
                  {sortedVendorKeys.map((key, index) => {
                    const score = scores[key]?.weighted || 0;
                    const isDisqualified = scores[key]?.isDisqualified ?? false;
                    const metrics = data[key];
                    const isWinner = index === 0 && !isDisqualified;
                    const gates = binaryGates[key] || {
                      failoverVerified: metrics?.redundancyCertified ?? false,
                      complianceCertified: true,
                    };

                    return (
                      <motion.tr
                        key={key}
                        layout
                        initial={{ opacity: 0, x: -20, filter: "blur(4px)" }}
                        animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, scale: 0.95, filter: "blur(2px)" }}
                        transition={{
                          layout: { type: "spring", stiffness: 350, damping: 28 },
                          opacity: { duration: 0.35, delay: index * 0.05 },
                          x: { type: "spring", stiffness: 280, damping: 24, delay: index * 0.05 },
                          filter: { duration: 0.25, delay: index * 0.05 },
                        }}
                        className={`group hover:bg-white/5 transition-colors ${
                          isDisqualified
                            ? "bg-red-950/20 opacity-85 border-l-4 border-l-red-500"
                            : isWinner
                            ? "bg-cyan-950/30 border-l-4 border-l-cyan-500"
                            : "border-l-4 border-l-transparent"
                        }`}
                      >
                        {/* Rank Badge */}
                        <td className="py-4 px-4 font-bold">
                          <div className="flex items-center gap-1.5">
                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-mono font-bold shadow-sm ${
                              isDisqualified
                                ? "bg-red-950 text-red-400 border border-red-500/40"
                                : isWinner
                                ? "bg-gradient-to-br from-cyan-500 to-blue-700 text-white shadow-cyan-600/40"
                                : index === 1
                                ? "bg-zinc-800 text-zinc-200 border border-zinc-700"
                                : "bg-zinc-900 text-zinc-400 border border-zinc-800"
                            }`}>
                              {isDisqualified ? "✕" : `#${index + 1}`}
                            </span>
                          </div>
                        </td>

                        {/* Vendor Name */}
                        <td className="py-4 px-4 font-sans font-bold text-white text-sm">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span>{VENDOR_NAMES[key]}</span>
                            {isDisqualified ? (
                              <span className="inline-flex items-center gap-1 text-[10px] bg-red-950/80 text-red-400 px-2 py-0.5 rounded-full font-bold border border-red-500/50 uppercase tracking-wide">
                                ✕ Disqualified (Gate)
                              </span>
                            ) : isWinner ? (
                              <span className="inline-flex items-center gap-1 text-[10px] bg-cyan-600 text-white px-2.5 py-0.5 rounded-full font-bold shadow-sm shadow-cyan-600/50 uppercase tracking-wide animate-pulse">
                                <Trophy size={11} /> Top Qualified
                              </span>
                            ) : null}
                          </div>
                          <div className="text-[11px] font-mono text-zinc-400 font-normal mt-0.5">
                            SLA: {metrics?.supportSLA || "Standard"}
                          </div>
                        </td>

                        {/* Weighted Score */}
                        <td className="py-4 px-4 font-mono">
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-zinc-950 rounded-full h-2.5 overflow-hidden border border-white/10 p-0.5">
                              <motion.div
                                className={`h-full rounded-full ${
                                  isDisqualified
                                    ? "bg-red-500"
                                    : isWinner
                                    ? "bg-gradient-to-r from-cyan-500 to-blue-400"
                                    : "bg-zinc-500"
                                }`}
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                                transition={{ duration: 0.4, ease: "easeOut" }}
                              />
                            </div>
                            <span className={`text-base font-extrabold ${isDisqualified ? "text-red-400 line-through" : isWinner ? "text-cyan-400" : "text-white"}`}>
                              {score}
                            </span>
                            <span className="text-xs text-zinc-500 font-normal">/ 100</span>
                          </div>
                        </td>

                        {/* Price (Multi-currency formatted) */}
                        <td className="py-4 px-4 font-mono font-bold text-white text-sm">
                          <div>
                            <span className="text-emerald-400">{formatCurrency(metrics?.priceUSD || 0, currency)}</span>
                            {currency !== "USD" && (
                              <span className="block text-[10px] text-zinc-400 font-normal">
                                Base: ${Number(metrics?.priceUSD || 0).toLocaleString()} USD
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Lead Time */}
                        <td className="py-4 px-4 font-mono text-zinc-200">
                          <span className="font-semibold text-white">{metrics?.leadTimeWeeks}</span> wks
                        </td>

                        {/* Warranty */}
                        <td className="py-4 px-4 font-mono text-zinc-200">
                          <span className="font-semibold text-white">{metrics?.warrantyYears}</span> yrs
                        </td>

                        {/* Failover Pre-certified Gate */}
                        <td className="py-4 px-4">
                          <button
                            onClick={() => onToggleBinaryGate?.(key, "failoverVerified")}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold transition-all cursor-pointer ${
                              gates.failoverVerified
                                ? "bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900"
                                : "bg-red-950/80 text-red-300 border border-red-500/40 hover:bg-red-900"
                            }`}
                            title="Click to toggle failover certification gate"
                          >
                            {gates.failoverVerified ? (
                              <>
                                <CheckCircle2 size={12} className="text-emerald-400" />
                                <span>YES (Certified)</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle size={12} className="text-red-400" />
                                <span>NO (Failed)</span>
                              </>
                            )}
                          </button>
                        </td>

                        {/* Compliance Certified Gate */}
                        <td className="py-4 px-4">
                          <button
                            onClick={() => onToggleBinaryGate?.(key, "complianceCertified")}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold transition-all cursor-pointer ${
                              gates.complianceCertified
                                ? "bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900"
                                : "bg-red-950/80 text-red-300 border border-red-500/40 hover:bg-red-900"
                            }`}
                            title="Click to toggle compliance certification gate"
                          >
                            {gates.complianceCertified ? (
                              <>
                                <CheckCircle2 size={12} className="text-emerald-400" />
                                <span>YES (Compliant)</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle size={12} className="text-red-400" />
                                <span>NO (Non-Compliant)</span>
                              </>
                            )}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-4 text-right">
                          <button
                            onClick={() => setEditingVendorKey(key)}
                            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                            title={`Edit ${VENDOR_NAMES[key]}`}
                          >
                            <Edit3 size={15} />
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </motion.tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mode 2: Full Matrix Comparison View */}
      {viewMode === "matrix" && (
        <div className="overflow-x-auto rounded-xl border border-white/10 shadow-2xl">
          <table className="w-full text-left text-xs font-mono border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-white/10 text-zinc-400 bg-zinc-950/90">
                <th className="py-3.5 px-4 font-semibold uppercase tracking-wider w-1/4">Criteria</th>
                {sortedVendorKeys.map((key) => {
                  const isWinner = key === topVendor;
                  return (
                    <th
                      key={key}
                      className={`py-3.5 px-4 font-semibold uppercase tracking-wider text-sm transition-colors ${
                        isWinner ? "bg-red-950/50 text-red-200 border-x border-red-500/30" : "text-white"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <span>{VENDOR_NAMES[key]}</span>
                          {isWinner && (
                            <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full font-bold shadow-sm shadow-red-600/50 animate-pulse">
                              TOP
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => setEditingVendorKey(key)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                          title={`Edit ${VENDOR_NAMES[key]} Information`}
                        >
                          <Edit3 size={13} />
                        </button>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-zinc-900/40">
              <motion.tr
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.04 }}
                className="hover:bg-white/5 transition-colors"
              >
                <td className="py-3.5 px-4 font-sans font-medium text-zinc-300 flex items-center gap-2">
                  <DollarSign size={14} className="text-red-400" />
                  Price (Total {currency})
                </td>
                {sortedVendorKeys.map((key) => {
                  const price = data[key]?.priceUSD;
                  return (
                    <td key={key} className="py-3.5 px-4 text-sm font-bold text-white">
                      {price != null ? (
                        <div>
                          <span className="text-emerald-400">{formatCurrency(price, currency)}</span>
                          {currency !== "USD" && (
                            <span className="block text-[10px] text-zinc-400 font-normal">
                              ${price.toLocaleString()} USD
                            </span>
                          )}
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                  );
                })}
              </motion.tr>

              <motion.tr
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.08 }}
                className="hover:bg-white/5 transition-colors"
              >
                <td className="py-3.5 px-4 font-sans font-medium text-zinc-300 flex items-center gap-2">
                  <Clock size={14} className="text-red-400" />
                  Lead Time (Weeks)
                </td>
                {sortedVendorKeys.map((key) => {
                  const weeks = data[key]?.leadTimeWeeks;
                  return (
                    <td key={key} className="py-3.5 px-4 text-sm font-semibold text-zinc-200">
                      {weeks != null ? `${weeks} weeks` : "—"}
                    </td>
                  );
                })}
              </motion.tr>

              <motion.tr
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.12 }}
                className="hover:bg-white/5 transition-colors"
              >
                <td className="py-3.5 px-4 font-sans font-medium text-zinc-300 flex items-center gap-2">
                  <Shield size={14} className="text-red-400" />
                  Warranty (Years)
                </td>
                {sortedVendorKeys.map((key) => {
                  const yrs = data[key]?.warrantyYears;
                  return (
                    <td key={key} className="py-3.5 px-4 text-sm text-zinc-200">
                      {yrs != null ? `${yrs} years` : "—"}
                    </td>
                  );
                })}
              </motion.tr>

              <motion.tr
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.16 }}
                className="hover:bg-white/5 transition-colors"
              >
                <td className="py-3.5 px-4 font-sans font-medium text-zinc-300 flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-red-400" />
                  Failover Pre-Certified
                </td>
                {sortedVendorKeys.map((key) => {
                  const cert = data[key]?.redundancyCertified;
                  return (
                    <td key={key} className="py-3.5 px-4">
                      {cert ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs bg-emerald-950/50 text-emerald-300 font-medium border border-emerald-500/30">
                          <CheckCircle2 size={12} /> Yes (Pre-certified)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs bg-red-950/50 text-red-300 font-medium border border-red-500/30">
                          <AlertCircle size={12} /> Requires Workaround
                        </span>
                      )}
                    </td>
                  );
                })}
              </motion.tr>

              <motion.tr
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.20 }}
                className="hover:bg-white/5 transition-colors"
              >
                <td className="py-3.5 px-4 font-sans font-medium text-zinc-300">Support SLA</td>
                {sortedVendorKeys.map((key) => (
                  <td key={key} className="py-3.5 px-4 text-xs text-zinc-300 leading-relaxed">
                    {data[key]?.supportSLA || "—"}
                  </td>
                ))}
              </motion.tr>

              <motion.tr
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.24 }}
                className="hover:bg-white/5 transition-colors"
              >
                <td className="py-3.5 px-4 font-sans font-medium text-zinc-300 flex items-center gap-2">
                  <Award size={14} className="text-red-400" />
                  Certifications
                </td>
                {sortedVendorKeys.map((key) => (
                  <td key={key} className="py-3.5 px-4 text-xs">
                    <div className="flex flex-wrap gap-1">
                      {(data[key]?.certifications || []).map((c, i) => (
                        <span key={i} className="bg-zinc-950/80 text-zinc-300 border border-white/10 px-2 py-0.5 rounded text-[11px]">
                          {c}
                        </span>
                      ))}
                    </div>
                  </td>
                ))}
              </motion.tr>

              <motion.tr
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.28 }}
                className="hover:bg-white/5 transition-colors"
              >
                <td className="py-3.5 px-4 font-sans font-medium text-zinc-300">Key Config Specs</td>
                {sortedVendorKeys.map((key) => (
                  <td key={key} className="py-3.5 px-4 text-xs text-zinc-400 leading-normal italic">
                    {data[key]?.specsSummary || "—"}
                  </td>
                ))}
              </motion.tr>

              {/* Score Breakdown Rows */}
              <motion.tr
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: 0.32 }}
                className="bg-zinc-950/90 font-bold border-t-2 border-white/10"
              >
                <td className="py-4 px-4 text-sm font-sans text-white">
                  Weighted Total Score (0-100)
                </td>
                {sortedVendorKeys.map((key) => {
                  const score = scores[key]?.weighted ?? 0;
                  const isWinner = key === topVendor;
                  return (
                    <td
                      key={key}
                      className={`py-4 px-4 text-base ${
                        isWinner ? "text-red-400 bg-red-950/40" : "text-white"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-lg font-extrabold">{score}</span>
                        <span className="text-xs text-zinc-500 font-normal">/ 100</span>
                      </div>
                    </td>
                  );
                })}
              </motion.tr>
            </tbody>
            </table>
        </div>
      )}

      {/* Mode 3: Split-Screen Head-to-Head Comparison View */}
      {viewMode === "split" && (
        <div className="space-y-6">
          {/* Vendor Selector Bar */}
          <div className="bg-zinc-950/80 p-4 rounded-2xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 backdrop-blur-md">
            <div className="flex-1 w-full">
              <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-1.5 font-semibold">
                Select Primary Vendor A
              </label>
              <select
                value={vendorA}
                onChange={(e) => setVendorA(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-white/10 bg-zinc-900 font-sans text-sm font-semibold text-white shadow-sm focus:ring-2 focus:ring-red-500 cursor-pointer"
              >
                {sortedVendorKeys.map((k) => (
                  <option key={k} value={k}>
                    {VENDOR_NAMES[k]} ({scores[k]?.weighted ?? 0} pts)
                  </option>
                ))}
              </select>
            </div>

            <div className="shrink-0 flex items-center justify-center p-3 rounded-full bg-zinc-900 border border-white/10 text-red-400 shadow-md">
              <ArrowRightLeft size={18} />
            </div>

            <div className="flex-1 w-full">
              <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-1.5 font-semibold">
                Select Comparison Vendor B
              </label>
              <select
                value={vendorB}
                onChange={(e) => setVendorB(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-white/10 bg-zinc-900 font-sans text-sm font-semibold text-white shadow-sm focus:ring-2 focus:ring-red-500 cursor-pointer"
              >
                {sortedVendorKeys.map((k) => (
                  <option key={k} value={k}>
                    {VENDOR_NAMES[k]} ({scores[k]?.weighted ?? 0} pts)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Side-by-Side Comparison Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Vendor A Card */}
            <motion.div
              layout
              initial={{ opacity: 0, x: -24, filter: "blur(3px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
              className={`glass-card-interactive rounded-2xl border p-5 shadow-2xl space-y-4 ${
                (scoreA?.weighted || 0) >= (scoreB?.weighted || 0)
                  ? "border-red-500/50 bg-red-950/20 ring-1 ring-red-500/30"
                  : "border-white/10 bg-zinc-900/50"
              }`}
            >
              <div className="flex items-start justify-between pb-3 border-b border-white/10">
                <div>
                  <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-widest">
                    Vendor A
                  </span>
                  <h4 className="font-sans font-bold text-lg text-white">
                    {VENDOR_NAMES[vendorA]}
                  </h4>
                  <button
                    onClick={() => setEditingVendorKey(vendorA)}
                    className="font-sans text-[11px] px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold flex items-center gap-1 border border-white/10 transition-colors mt-1.5 cursor-pointer"
                  >
                    <Edit3 size={12} className="text-red-400" />
                    <span>Edit Vendor Info</span>
                  </button>
                </div>

                <div className="text-right">
                  <div className="font-mono text-2xl font-extrabold text-white">
                    {scoreA?.weighted || 0}
                    <span className="text-xs font-normal text-zinc-500">/100</span>
                  </div>
                  {(scoreA?.weighted || 0) >= (scoreB?.weighted || 0) && (
                    <span className="inline-block mt-1 font-mono text-[10px] font-bold bg-red-600 text-white px-2 py-0.5 rounded-full shadow-sm">
                      HIGHER SCORE
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-zinc-950/80 border border-white/10">
                  <div className="text-zinc-400 text-[11px] mb-0.5">Total Quote Price ({currency})</div>
                  <div className="text-lg font-bold text-emerald-400">
                    {formatCurrency(priceUSD_A, currency)}
                  </div>
                  {currency !== "USD" && (
                    <div className="text-[10px] text-zinc-400 font-normal">
                      Base Valuation: ${priceUSD_A.toLocaleString()} USD
                    </div>
                  )}
                  <div className="text-[11px] mt-1 font-medium">
                    {priceDiffUSD < 0 ? (
                      <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                        <Zap size={12} /> {currency === "SAR" ? `${Math.round(priceDiffConverted).toLocaleString()} SAR` : formatCurrency(Math.abs(priceDiffUSD), currency)} lower than {VENDOR_NAMES[vendorB]}
                      </span>
                    ) : priceDiffUSD > 0 ? (
                      <span className="text-red-400">
                        {currency === "SAR" ? `${Math.round(priceDiffConverted).toLocaleString()} SAR` : formatCurrency(Math.abs(priceDiffUSD), currency)} higher than {VENDOR_NAMES[vendorB]}
                      </span>
                    ) : (
                      <span className="text-zinc-400">Equal price</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-white/10">
                    <div className="text-zinc-400 text-[10px]">Lead Time</div>
                    <div className="text-sm font-bold text-white">{metricsA?.leadTimeWeeks} weeks</div>
                    <div className="text-[10px] mt-0.5">
                      {leadDiff < 0 ? (
                        <span className="text-emerald-400 font-semibold">{Math.abs(leadDiff)} wks faster</span>
                      ) : leadDiff > 0 ? (
                        <span className="text-red-400">{Math.abs(leadDiff)} wks slower</span>
                      ) : (
                        <span className="text-zinc-400">Same lead time</span>
                      )}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-white/10">
                    <div className="text-zinc-400 text-[10px]">Warranty</div>
                    <div className="text-sm font-bold text-white">{metricsA?.warrantyYears} years</div>
                    <div className="text-[10px] mt-0.5">
                      {warrantyDiff > 0 ? (
                        <span className="text-emerald-400 font-semibold">+{warrantyDiff} yr warranty</span>
                      ) : warrantyDiff < 0 ? (
                        <span className="text-red-400">{warrantyDiff} yr warranty</span>
                      ) : (
                        <span className="text-zinc-400">Same warranty</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950/80 border border-white/10">
                  <div className="text-zinc-400 text-[11px] mb-1 font-semibold">Failover & Compliance</div>
                  {metricsA?.redundancyCertified ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs bg-emerald-950/50 text-emerald-300 font-bold border border-emerald-500/30">
                      <CheckCircle2 size={12} /> Factory Pre-Certified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs bg-red-950/50 text-red-300 font-bold border border-red-500/30">
                      <AlertCircle size={12} /> Workaround Required
                    </span>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-zinc-950/80 border border-white/10">
                  <div className="text-zinc-400 text-[11px] mb-0.5 font-semibold">Support SLA</div>
                  <div className="text-xs text-zinc-200 leading-normal">{metricsA?.supportSLA}</div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950/80 border border-white/10">
                  <div className="text-zinc-400 text-[11px] mb-0.5 font-semibold font-sans">Detailed Technical Specs</div>
                  <div className="text-xs text-zinc-400 italic leading-relaxed">{metricsA?.specsSummary}</div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950/80 border border-white/10">
                  <div className="text-zinc-400 text-[11px] mb-1.5 font-semibold">Certifications</div>
                  <div className="flex flex-wrap gap-1">
                    {(metricsA?.certifications || []).map((c, i) => (
                      <span key={i} className="bg-zinc-900 text-zinc-300 border border-white/10 px-2 py-0.5 rounded text-[11px] font-medium">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Vendor B Card */}
            <motion.div
              layout
              initial={{ opacity: 0, x: 24, filter: "blur(3px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1], delay: 0.08 }}
              className={`glass-card-interactive rounded-2xl border p-5 shadow-2xl space-y-4 ${
                (scoreB?.weighted || 0) >= (scoreA?.weighted || 0)
                  ? "border-red-500/50 bg-red-950/20 ring-1 ring-red-500/30"
                  : "border-white/10 bg-zinc-900/50"
              }`}
            >
              <div className="flex items-start justify-between pb-3 border-b border-white/10">
                <div>
                  <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-widest">
                    Vendor B
                  </span>
                  <h4 className="font-sans font-bold text-lg text-white">
                    {VENDOR_NAMES[vendorB]}
                  </h4>
                  <button
                    onClick={() => setEditingVendorKey(vendorB)}
                    className="font-sans text-[11px] px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold flex items-center gap-1 border border-white/10 transition-colors mt-1.5 cursor-pointer"
                  >
                    <Edit3 size={12} className="text-red-400" />
                    <span>Edit Vendor Info</span>
                  </button>
                </div>

                <div className="text-right">
                  <div className="font-mono text-2xl font-extrabold text-white">
                    {scoreB?.weighted || 0}
                    <span className="text-xs font-normal text-zinc-500">/100</span>
                  </div>
                  {(scoreB?.weighted || 0) >= (scoreA?.weighted || 0) && (
                    <span className="inline-block mt-1 font-mono text-[10px] font-bold bg-red-600 text-white px-2 py-0.5 rounded-full shadow-sm">
                      HIGHER SCORE
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-zinc-950/80 border border-white/10">
                  <div className="text-zinc-400 text-[11px] mb-0.5">Total Quote Price ({currency})</div>
                  <div className="text-lg font-bold text-emerald-400">
                    {formatCurrency(priceUSD_B, currency)}
                  </div>
                  {currency !== "USD" && (
                    <div className="text-[10px] text-zinc-400 font-normal">
                      Base Valuation: ${priceUSD_B.toLocaleString()} USD
                    </div>
                  )}
                  <div className="text-[11px] mt-1 font-medium">
                    {priceDiffUSD > 0 ? (
                      <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                        <Zap size={12} /> {currency === "SAR" ? `${Math.round(priceDiffConverted).toLocaleString()} SAR` : formatCurrency(Math.abs(priceDiffUSD), currency)} lower than {VENDOR_NAMES[vendorA]}
                      </span>
                    ) : priceDiffUSD < 0 ? (
                      <span className="text-red-400">
                        {currency === "SAR" ? `${Math.round(priceDiffConverted).toLocaleString()} SAR` : formatCurrency(Math.abs(priceDiffUSD), currency)} higher than {VENDOR_NAMES[vendorA]}
                      </span>
                    ) : (
                      <span className="text-zinc-400">Equal price</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-white/10">
                    <div className="text-zinc-400 text-[10px]">Lead Time</div>
                    <div className="text-sm font-bold text-white">{metricsB?.leadTimeWeeks} weeks</div>
                    <div className="text-[10px] mt-0.5">
                      {leadDiff > 0 ? (
                        <span className="text-emerald-400 font-semibold">{Math.abs(leadDiff)} wks faster</span>
                      ) : leadDiff < 0 ? (
                        <span className="text-red-400">{Math.abs(leadDiff)} wks slower</span>
                      ) : (
                        <span className="text-zinc-400">Same lead time</span>
                      )}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-white/10">
                    <div className="text-zinc-400 text-[10px]">Warranty</div>
                    <div className="text-sm font-bold text-white">{metricsB?.warrantyYears} years</div>
                    <div className="text-[10px] mt-0.5">
                      {warrantyDiff < 0 ? (
                        <span className="text-emerald-400 font-semibold">+{Math.abs(warrantyDiff)} yr warranty</span>
                      ) : warrantyDiff > 0 ? (
                        <span className="text-red-400">-{warrantyDiff} yr warranty</span>
                      ) : (
                        <span className="text-zinc-400">Same warranty</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950/80 border border-white/10">
                  <div className="text-zinc-400 text-[11px] mb-1 font-semibold">Failover & Compliance</div>
                  {metricsB?.redundancyCertified ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs bg-emerald-950/50 text-emerald-300 font-bold border border-emerald-500/30">
                      <CheckCircle2 size={12} /> Factory Pre-Certified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs bg-red-950/50 text-red-300 font-bold border border-red-500/30">
                      <AlertCircle size={12} /> Workaround Required
                    </span>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-zinc-950/80 border border-white/10">
                  <div className="text-zinc-400 text-[11px] mb-0.5 font-semibold">Support SLA</div>
                  <div className="text-xs text-zinc-200 leading-normal">{metricsB?.supportSLA}</div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950/80 border border-white/10">
                  <div className="text-zinc-400 text-[11px] mb-0.5 font-semibold font-sans">Detailed Technical Specs</div>
                  <div className="text-xs text-zinc-400 italic leading-relaxed">{metricsB?.specsSummary}</div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-950/80 border border-white/10">
                  <div className="text-zinc-400 text-[11px] mb-1.5 font-semibold">Certifications</div>
                  <div className="flex flex-wrap gap-1">
                    {(metricsB?.certifications || []).map((c, i) => (
                      <span key={i} className="bg-zinc-900 text-zinc-300 border border-white/10 px-2 py-0.5 rounded text-[11px] font-medium">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {editingVendorKey && data[editingVendorKey] && (
        <EditVendorModal
          vendorKey={editingVendorKey}
          metrics={data[editingVendorKey]}
          isOpen={!!editingVendorKey}
          onClose={() => setEditingVendorKey(null)}
          onSave={(key, updatedMetrics) => {
            if (onUpdateVendorData) {
              onUpdateVendorData(key, updatedMetrics);
            }
          }}
        />
      )}
    </div>
  );
}

