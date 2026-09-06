import React, { useState, useMemo } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Building2,
  Radio,
  Cloud,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Unlock,
  ChevronRight,
  FileCheck2,
  Sparkles,
  HelpCircle,
  RefreshCw,
  HardDrive,
  Cpu,
  Layers,
  ArrowDown,
  ArrowRight,
  Shield,
  Clock,
  Info
} from "lucide-react";
import { StructuredVendorData, KsaProjectConfig, KsaProjectSector, KsaVendorCompliance } from "../types";
import { VENDOR_NAMES } from "../data";
import { LanternLogo } from "./LanternLogo";
import { StatusBadge } from "./StatusBadge";
import { AppLanguage, TRANSLATIONS } from "../translations";

interface Props {
  data: StructuredVendorData;
  onUpdateVendorData?: (vendorKey: string, updatedMetrics: any) => void;
  lang?: AppLanguage;
}

export function SaudiComplianceEngine({ data, lang = "en" }: Props) {
  const isAr = lang === "ar";
  const t = TRANSLATIONS[lang];

  // Project-level KSA Regulatory Config State
  const [config, setConfig] = useState<KsaProjectConfig>({
    projectSector: "Government/Critical Infrastructure",
    includesWireless: false,
    includesCloudSoftware: false,
    minLcgpaThreshold: 35,
  });

  const [selectedVendorKey, setSelectedVendorKey] = useState<string>("meridian");
  const [overrideModalVendor, setOverrideModalVendor] = useState<string | null>(null);

  // Form state for Regulatory Override
  const [overrideForm, setOverrideForm] = useState({
    approverName: "Procurement Director (KSA Operations)",
    crNumber: "1010689402",
    justification: "Critical project timeline exception approved by Ministry steering committee under Royal Decree Article 42.",
  });

  const isJustificationValid = overrideForm.justification.trim().length >= 5;

  // Stored Overrides
  const [overrides, setOverrides] = useState<Record<string, { user: string; reason: string; crNumber: string; timestamp: string }>>({});

  // AI Compliance Scan State
  const [isScanningAi, setIsScanningAi] = useState<boolean>(false);
  const [aiScanResult, setAiScanResult] = useState<{ vendorKey: string; summary: string; riskLevel: string } | null>(null);

  // Default Compliance Profile Mock Generator mapped to Vendors
  const vendorProfiles = useMemo<Record<string, KsaVendorCompliance>>(() => {
    const keys = Object.keys(data);
    const result: Record<string, KsaVendorCompliance> = {};

    keys.forEach((key) => {
      const vName = VENDOR_NAMES[key] || key;

      // Default baseline values based on vendor
      let lcgpa = 42;
      let lcgpaCert = true;
      let hcisApproved = true;
      let hcisDirs = ["SEC-01 (Physical)", "SAF-01 (Fire Safety)", "SEC-02 (Perimeter)"];
      let cstApproved = true;
      let sasoCert = true;
      let ncaCert = true;
      let ksaDataHost = true;

      // ESG & Green Mining Defaults
      let esgPueRating = 1.18;
      let esgEwasteCertified = true;
      let esgCarbonOffsetPledge = true;
      let esgHarshEnvironmentRating = "IP66 / NEMA 4X";
      let esgScorePercent = 92;
      let esgPass = true;

      if (key === "meridian") {
        lcgpa = 68;
        lcgpaCert = true;
        esgPueRating = 1.15;
        esgEwasteCertified = true;
        esgCarbonOffsetPledge = true;
        esgHarshEnvironmentRating = "IP66 / NEMA 4X Mining Sealed";
        esgScorePercent = 96;
        esgPass = true;
      } else if (key === "apex") {
        lcgpa = 54;
        lcgpaCert = true;
        esgPueRating = 1.22;
        esgEwasteCertified = true;
        esgCarbonOffsetPledge = false;
        esgHarshEnvironmentRating = "IP54 Industrial";
        esgScorePercent = 84;
        esgPass = true;
      } else if (key === "horizon") {
        lcgpa = 42;
        lcgpaCert = true;
        esgPueRating = 1.32;
        esgEwasteCertified = false;
        esgCarbonOffsetPledge = false;
        esgHarshEnvironmentRating = "IP42 Standard Enclosure";
        esgScorePercent = 68;
        esgPass = false;
      } else if (key === "ironclad") {
        lcgpa = 18;
        lcgpaCert = false;
        hcisApproved = false;
        hcisDirs = ["SEC-01 (Non-compliant enclosure)"];
        cstApproved = false;
        sasoCert = false;
        ncaCert = false;
        ksaDataHost = false;
        esgPueRating = 1.55;
        esgEwasteCertified = false;
        esgCarbonOffsetPledge = false;
        esgHarshEnvironmentRating = "IP20 Commercial";
        esgScorePercent = 38;
        esgPass = false;
      } else if (key === "vantage") {
        lcgpa = 38;
        lcgpaCert = true;
        hcisApproved = true;
        hcisDirs = ["SEC-01 (Class-B Approved)"];
        cstApproved = true;
        sasoCert = true;
        ncaCert = true;
        ksaDataHost = false; // Violates Data Sovereignty if Cloud is true
        esgPueRating = 1.28;
        esgEwasteCertified = true;
        esgCarbonOffsetPledge = false;
        esgHarshEnvironmentRating = "IP52 Ruggedized";
        esgScorePercent = 74;
        esgPass = true;
      }

      // LCGPA Tier calculation
      let lcgpaTier: "Gold Champion" | "Silver Tier" | "Bronze Compliant" | "Non-Compliant" = "Bronze Compliant";
      if (lcgpa >= 65) lcgpaTier = "Gold Champion";
      else if (lcgpa >= 50) lcgpaTier = "Silver Tier";
      else if (lcgpa >= config.minLcgpaThreshold) lcgpaTier = "Bronze Compliant";
      else lcgpaTier = "Non-Compliant";

      // Check Pillar 1: IKTVA / LCGPA
      const ikvtALcgpaPass = lcgpa >= config.minLcgpaThreshold && lcgpaCert;

      // Check Pillar 2: HCIS (Applies if Gov or Energy or Defense)
      const hcisRequired =
        config.projectSector === "Government/Critical Infrastructure" ||
        config.projectSector === "Defense & Security" ||
        config.projectSector === "Energy & Oil (Aramco)";
      const hcisPass = !hcisRequired || hcisApproved;

      // Check Pillar 3: CST / SASO (Applies if Wireless is enabled)
      const cstPass = !config.includesWireless || (cstApproved && sasoCert);

      // Check Pillar 4: NCA ECC (Applies if Cloud software is enabled or Gov sector)
      const ncaRequired = config.includesCloudSoftware || hcisRequired;
      const ncaPass = !ncaRequired || (ncaCert && (!config.includesCloudSoftware || ksaDataHost));

      // Check Pillar 5: Saudi Green Initiative ESG (if enabled)
      const esgCheckPass = !config.enforceGreenMiningEsg || esgPass;

      // Calculate Binary Gate Status
      const blockingReasons: string[] = [];

      if (!ikvtALcgpaPass) {
        blockingReasons.push(
          `IKTVA/LCGPA Violation: Local content score is ${lcgpa}% (Required minimum: ${config.minLcgpaThreshold}% under LCGPA Directive).`
        );
      }

      if (hcisRequired && !hcisPass) {
        blockingReasons.push(
          `HCIS Violation: Equipment lacks High Commission for Industrial Security Class-A SEC-01 enclosure approval.`
        );
      }

      if (config.includesWireless && !cstPass) {
        blockingReasons.push(
          `CST/SASO Violation: Wireless radio hardware lacks Saudi CITC Spectrum Type Approval or SASO IECEE certification.`
        );
      }

      if (ncaRequired && !ncaPass) {
        if (config.includesCloudSoftware && !ksaDataHost) {
          blockingReasons.push(
            `NCA ECC Data Sovereignty Violation: Cloud software stores telemetry outside KSA jurisdiction (Riyadh/Jeddah region required).`
          );
        } else {
          blockingReasons.push(
            `NCA ECC Violation: Lacks National Cybersecurity Authority Essential Cybersecurity Controls (NCA ECC-1:2018) compliance.`
          );
        }
      }

      if (config.enforceGreenMiningEsg && !esgPass) {
        blockingReasons.push(
          `Saudi Green Initiative (SGI) ESG Breach: PUE of ${esgPueRating} exceeds 1.25 ceiling or lacks certified NCEC e-waste circularity agreement.`
        );
      }

      const hasOverride = !!overrides[key];
      const overallGateStatus =
        blockingReasons.length === 0 || hasOverride ? "APPROVE_PURCHASE_ORDER" : "FLAG_AND_BLOCK_PO";

      result[key] = {
        vendorKey: key,
        vendorName: vName,
        lcgpaScorePercent: lcgpa,
        lcgpaCertified: lcgpaCert,
        ikvtALcgpaPass,
        lcgpaTier,
        hcisClassApproved: hcisApproved,
        hcisDirectives: hcisDirs,
        hcisPass,
        cstTypeApproved: cstApproved,
        sasoIeceeCertified: sasoCert,
        cstSasoPass: cstPass,
        ncaEccCertified: ncaCert,
        ksaDataSovereignty: ksaDataHost,
        ncaEccPass: ncaPass,
        esgPueRating,
        esgEwasteCertified,
        esgCarbonOffsetPledge,
        esgHarshEnvironmentRating,
        esgScorePercent,
        esgPass,
        overallGateStatus,
        blockingReasons,
        overrideRecord: overrides[key],
      };
    });

    return result;
  }, [data, config, overrides]);

  const activeVendorCompliance = vendorProfiles[selectedVendorKey] || vendorProfiles["meridian"];

  // Helper to trigger AI Audit
  const handleRunAiAudit = async (vendorKey: string) => {
    setIsScanningAi(true);
    try {
      const vData = data[vendorKey];
      const res = await fetch("/api/procurement-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Perform a strict Saudi Regulatory Audit (IKTVA/LCGPA, HCIS, CST/SASO, NCA ECC) for vendor "${VENDOR_NAMES[vendorKey] || vendorKey}". Evaluate specs: ${JSON.stringify(vData)}. Project sector: ${config.projectSector}. Wireless: ${config.includesWireless}. Cloud: ${config.includesCloudSoftware}.`,
          context: { structuredData: data },
        }),
      });

      const resData = await res.json();
      setAiScanResult({
        vendorKey,
        summary: resData.reply || "Audit scan completed with compliance alerts.",
        riskLevel: activeVendorCompliance.overallGateStatus === "APPROVE_PURCHASE_ORDER" ? "LOW RISK" : "HIGH REGULATORY RISK",
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsScanningAi(false);
    }
  };

  // Submit Override
  const handleConfirmOverride = () => {
    if (!overrideModalVendor || !isJustificationValid) return;
    setOverrides((prev) => ({
      ...prev,
      [overrideModalVendor]: {
        user: overrideForm.approverName,
        reason: overrideForm.justification.trim(),
        crNumber: overrideForm.crNumber,
        timestamp: new Date().toLocaleString() + " (AST)",
      },
    }));
    setOverrideModalVendor(null);
  };

  return (
    <div className="glass-card p-6 rounded-2xl mb-8 border border-white/10 shadow-2xl relative overflow-hidden font-sans">
      {/* Background Glow */}
      <div className="absolute top-0 right-1/3 w-96 h-48 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-mono text-[11px] uppercase tracking-wider text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/40 px-3 py-0.5 rounded-full flex items-center gap-1.5">
              <ShieldCheck size={13} />
              <span>{isAr ? "محرك بوابات الامتثال التنظيمي السعودي" : "KSA Regulatory Logic Gate Engine"}</span>
            </span>
            <span className="font-mono text-[10px] bg-zinc-900 text-zinc-300 border border-white/10 px-2 py-0.5 rounded-md hidden sm:inline-block">
              {isAr ? "معايير المشتريات الحكومية بالمملكة العربية السعودية" : "Kingdom of Saudi Arabia Procurement Standards"}
            </span>
            <LanternLogo size="sm" showTagline={false} animated={true} className="hidden sm:inline-flex ml-2 opacity-90" />
          </div>

          <h2 className="font-sans text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span>{isAr ? "الامتثال للأنظمة السعودية وبوابات الترخيص الإلزامية" : "Saudi Compliance & Binary Regulatory Gate"}</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-3xl leading-relaxed">
            {isAr
              ? "تطبيق قواعد النجاح/الرسوب الصارمة لمنع إصدار أوامر الشراء (PO) للمعدات غير الممتثلة لمعايير إكتفاء، المحتوى المحلي (LCGPA)، الهيئة العليا للأمن الصناعي (HCIS)، وهيئة الاتصالات (CST)."
              : "Strict binary pass/fail enforcement preventing Purchase Order (PO) issuance for non-compliant equipment across IKTVA/LCGPA, HCIS, CST/SASO, and NCA ECC pillars."}
          </p>
        </div>

        {/* Global Gate Status Pill with Requirement #3 Audit Fields */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <div
            className={`p-3 rounded-2xl border flex items-center gap-3 shadow-lg ${
              activeVendorCompliance.overallGateStatus === "APPROVE_PURCHASE_ORDER"
                ? "bg-emerald-950/70 border-emerald-500/50 text-emerald-300 shadow-emerald-950/50"
                : "bg-red-950/70 border-red-500/50 text-red-300 shadow-red-950/50"
            }`}
          >
            {activeVendorCompliance.overallGateStatus === "APPROVE_PURCHASE_ORDER" ? (
              <ShieldCheck size={28} className="text-emerald-400 shrink-0" />
            ) : (
              <ShieldAlert size={28} className="text-red-400 shrink-0 animate-bounce" />
            )}
            <div>
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block font-semibold">
                {isAr ? "نتيجة بوابة أمر الشراء" : "PO Logic Gate Outcome"}
              </span>
              <span className="font-sans font-extrabold text-xs sm:text-sm tracking-tight block">
                {activeVendorCompliance.overallGateStatus === "APPROVE_PURCHASE_ORDER"
                  ? activeVendorCompliance.overrideRecord
                    ? (isAr ? "تجاوز معتمد — مسموح بأمر الشراء" : "OVERRIDDEN — PO PERMITTED")
                    : (isAr ? "ناجح — مسموح بإصدار أمر الشراء" : "PASS — PURCHASE ORDER PERMITTED")
                  : (isAr ? "محظور ومرفوض — ممنوع إصدار أمر الشراء" : "FLAGGED & BLOCKED — NO PO ISSUANCE")}
              </span>
            </div>
          </div>

          {/* Requirement #3: Three Audit Fields */}
          <div className="bg-zinc-950/90 border border-white/10 px-3 py-1.5 rounded-xl font-mono text-[10px] text-zinc-300 flex flex-wrap items-center gap-2 shadow-inner">
            <span className="flex items-center gap-1 text-cyan-300">
              <Clock size={11} />
              <span>Checked: {activeVendorCompliance.overrideRecord ? activeVendorCompliance.overrideRecord.timestamp : "Just Now (2026-08-09 12:00 AST)"}</span>
            </span>
            <span className="text-zinc-600">|</span>
            <span className="text-amber-300">Ruleset: KSA Regulatory v2026.4</span>
            <span className="text-zinc-600">|</span>
            <span className={activeVendorCompliance.overrideRecord ? "text-red-400 font-bold" : "text-emerald-400 font-bold"}>
              {activeVendorCompliance.overrideRecord ? "Manual Override" : "System Evaluated"}
            </span>
          </div>
        </div>
      </div>

      {/* Project Regulatory Configuration Controls Bar */}
      <div className="bg-zinc-950/80 p-4 rounded-xl border border-white/10 mb-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <span className="font-mono text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
            <Building2 size={15} className="text-emerald-400" />
            <span>Project Sector & Technical Profile Toggles</span>
          </span>
          <span className="text-[10px] font-mono text-zinc-400">
            Rules dynamically re-route logic gate requirements
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Project Sector Select */}
          <div>
            <label className="text-[11px] font-mono text-zinc-300 font-semibold block mb-1.5">
              Project Sector (KSA Regulatory Scope)
            </label>
            <select
              value={config.projectSector}
              onChange={(e) => setConfig({ ...config, projectSector: e.target.value as KsaProjectSector })}
              className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-xs font-mono font-semibold text-white focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="Government/Critical Infrastructure">Government / Critical Infrastructure (HCIS Mandate)</option>
              <option value="Energy & Oil (Aramco)">Energy & Oil (Saudi Aramco / SEC)</option>
              <option value="Defense & Security">Defense & National Security</option>
              <option value="Commercial">Commercial / Private Enterprise</option>
            </select>
          </div>

          {/* Min LCGPA Score Threshold */}
          <div>
            <label className="text-[11px] font-mono text-zinc-300 font-semibold block mb-1.5 flex items-center justify-between">
              <span>Min LCGPA Threshold %</span>
              <span className="text-emerald-400 font-bold">{config.minLcgpaThreshold}%</span>
            </label>
            <input
              type="range"
              min="20"
              max="60"
              step="5"
              value={config.minLcgpaThreshold}
              onChange={(e) => setConfig({ ...config, minLcgpaThreshold: Number(e.target.value) })}
              className="w-full accent-emerald-500 cursor-pointer mt-2"
            />
          </div>

          {/* Includes Wireless Toggle */}
          <div className="flex items-center justify-between bg-zinc-900/80 px-3 py-2 rounded-xl border border-white/10">
            <div>
              <span className="text-xs font-mono font-bold text-white block flex items-center gap-1.5">
                <Radio size={14} className="text-rose-400" />
                <span>Wireless / RF?</span>
              </span>
              <span className="text-[10px] font-mono text-zinc-400 block">CST / SASO Homologation</span>
            </div>
            <button
              onClick={() => setConfig({ ...config, includesWireless: !config.includesWireless })}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                config.includesWireless ? "bg-emerald-600" : "bg-zinc-700"
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform shadow-md ${
                  config.includesWireless ? "right-0.5" : "left-0.5"
                }`}
              ></span>
            </button>
          </div>

          {/* Includes Cloud Software Toggle */}
          <div className="flex items-center justify-between bg-zinc-900/80 px-3 py-2 rounded-xl border border-white/10">
            <div>
              <span className="text-xs font-mono font-bold text-white block flex items-center gap-1.5">
                <Cloud size={14} className="text-sky-400" />
                <span>Cloud Software?</span>
              </span>
              <span className="text-[10px] font-mono text-zinc-400 block">NCA Data Sovereignty</span>
            </div>
            <button
              onClick={() => setConfig({ ...config, includesCloudSoftware: !config.includesCloudSoftware })}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                config.includesCloudSoftware ? "bg-emerald-600" : "bg-zinc-700"
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform shadow-md ${
                  config.includesCloudSoftware ? "right-0.5" : "left-0.5"
                }`}
              ></span>
            </button>
          </div>

          {/* Saudi Green Initiative (SGI) ESG Toggle */}
          <div className="flex items-center justify-between bg-zinc-900/80 px-3 py-2 rounded-xl border border-white/10">
            <div>
              <span className="text-xs font-mono font-bold text-white block flex items-center gap-1.5">
                <Sparkles size={14} className="text-emerald-400" />
                <span>SGI Green Mining?</span>
              </span>
              <span className="text-[10px] font-mono text-zinc-400 block">PUE &lt; 1.25 &amp; E-Waste</span>
            </div>
            <button
              onClick={() => setConfig({ ...config, enforceGreenMiningEsg: !config.enforceGreenMiningEsg })}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                config.enforceGreenMiningEsg ? "bg-emerald-600" : "bg-zinc-700"
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform shadow-md ${
                  config.enforceGreenMiningEsg ? "right-0.5" : "left-0.5"
                }`}
              ></span>
            </button>
          </div>
        </div>
      </div>

      {/* Vendor Switcher Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 border-b border-white/10">
        <span className="text-xs font-mono text-zinc-400 font-semibold mr-2 shrink-0">
          Select Vendor Proposal:
        </span>
        {Object.keys(vendorProfiles).map((vKey) => {
          const profile = vendorProfiles[vKey];
          const isSelected = selectedVendorKey === vKey;
          const isPassed = profile.overallGateStatus === "APPROVE_PURCHASE_ORDER";

          return (
            <button
              key={vKey}
              onClick={() => setSelectedVendorKey(vKey)}
              className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 border ${
                isSelected
                  ? "bg-zinc-800 text-white border-white/30 shadow-lg scale-[1.02]"
                  : "bg-zinc-950/60 text-zinc-400 border-white/10 hover:text-white hover:bg-zinc-900"
              }`}
            >
              <StatusBadge status={isPassed ? "low" : "high"} label={profile.vendorName} size="sm" />
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                  isPassed ? "bg-emerald-950 text-emerald-300" : "bg-red-950 text-red-300"
                }`}
              >
                {isPassed ? "PASS" : "BLOCKED"}
              </span>
            </button>
          );
        })}
      </div>

      {/* FLOWCHART DIAGRAM SECTION (Matching KSA Procurement Compliance Routing Diagram) */}
      <div className="bg-zinc-950 p-6 rounded-2xl border border-white/10 mb-6 space-y-4 overflow-x-auto shadow-inner">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Layers size={18} className="text-emerald-400" />
            <h3 className="font-sans font-bold text-white text-sm">
              KSA Procurement Compliance Routing Flowchart — <span className="text-emerald-400">{activeVendorCompliance.vendorName}</span>
            </h3>
          </div>
          <span className="text-xs font-mono text-zinc-400 bg-zinc-900 px-3 py-1 rounded-lg border border-white/10">
            Active Sector: <strong>{config.projectSector}</strong>
          </span>
        </div>

        {/* Visual Node Diagram */}
        <div className="py-6 flex flex-col items-center justify-center min-w-[650px] font-mono text-xs">
          {/* Top Node: Vendor Proposal */}
          <div className="px-6 py-2.5 rounded-xl bg-cyan-700 text-white font-bold shadow-lg shadow-cyan-700/30 border border-cyan-400 flex items-center gap-2 mb-6">
            <HardDrive size={16} />
            <span>Vendor Proposal ({activeVendorCompliance.vendorName})</span>
          </div>

          <ArrowDown size={20} className="text-zinc-500 mb-2" />

          {/* Node 1: IKTVA/LCGPA Check */}
          <div className="w-full max-w-md flex flex-col items-center">
            <div
              className={`w-full p-3 rounded-xl border text-center font-bold flex items-center justify-between shadow-md transition-all ${
                activeVendorCompliance.ikvtALcgpaPass
                  ? "bg-zinc-900 border-emerald-500/50 text-emerald-300"
                  : "bg-red-950/60 border-red-500 text-red-200"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-emerald-400" />
                <span>1. IKTVA / LCGPA Check</span>
              </span>
              <span className="text-[11px] bg-zinc-950 px-2.5 py-1 rounded border border-white/10">
                Score: {activeVendorCompliance.lcgpaScorePercent}% (Req: {config.minLcgpaThreshold}%)
              </span>
              <StatusBadge status={activeVendorCompliance.ikvtALcgpaPass ? "low" : "high"} label={activeVendorCompliance.ikvtALcgpaPass ? "PASS" : "FAIL"} size="sm" />
            </div>

            {/* Sub Branches */}
            <div className="flex items-center justify-between w-full px-8 text-[10px] text-zinc-400 my-1">
              <span className="text-red-400 font-bold">Fail ↙</span>
              <span className="text-emerald-400 font-bold">↘ Pass</span>
            </div>
          </div>

          <ArrowDown size={20} className="text-zinc-500 mb-2" />

          {/* Node 2: HCIS Equipment Check (If Required) */}
          {(config.projectSector === "Government/Critical Infrastructure" ||
            config.projectSector === "Defense & Security" ||
            config.projectSector === "Energy & Oil (Aramco)") && (
            <div className="w-full max-w-md flex flex-col items-center mb-4">
              <div
                className={`w-full p-3 rounded-xl border text-center font-bold flex items-center justify-between shadow-md transition-all ${
                  activeVendorCompliance.hcisPass
                    ? "bg-zinc-900 border-emerald-500/50 text-emerald-300"
                    : "bg-red-950/60 border-red-500 text-red-200"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Building2 size={16} className="text-amber-400" />
                  <span>2. HCIS Equipment Clearance</span>
                </span>
                <span className="text-[10px] text-zinc-400">
                  {activeVendorCompliance.hcisClassApproved ? "Class-A SEC-01 Approved" : "Non-approved Enclosure"}
                </span>
                <StatusBadge status={activeVendorCompliance.hcisPass ? "low" : "high"} label={activeVendorCompliance.hcisPass ? "PASS" : "FAIL"} size="sm" />
              </div>
              <ArrowDown size={18} className="text-zinc-500 my-1" />
            </div>
          )}

          {/* Node 3: CST / SASO Homologation (If Wireless) */}
          {config.includesWireless && (
            <div className="w-full max-w-md flex flex-col items-center mb-4">
              <div
                className={`w-full p-3 rounded-xl border text-center font-bold flex items-center justify-between shadow-md transition-all ${
                  activeVendorCompliance.cstSasoPass
                    ? "bg-zinc-900 border-emerald-500/50 text-emerald-300"
                    : "bg-red-950/60 border-red-500 text-red-200"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Radio size={16} className="text-rose-400" />
                  <span>3. CST / SASO Homologation</span>
                </span>
                <span className="text-[10px] text-zinc-400">CITC Spectrum Type Approval</span>
                <StatusBadge status={activeVendorCompliance.cstSasoPass ? "low" : "high"} label={activeVendorCompliance.cstSasoPass ? "PASS" : "FAIL"} size="sm" />
              </div>
              <ArrowDown size={18} className="text-zinc-500 my-1" />
            </div>
          )}

          {/* Node 4: NCA ECC Certification (If Cloud or Gov) */}
          {(config.includesCloudSoftware || config.projectSector !== "Commercial") && (
            <div className="w-full max-w-md flex flex-col items-center mb-4">
              <div
                className={`w-full p-3 rounded-xl border text-center font-bold flex items-center justify-between shadow-md transition-all ${
                  activeVendorCompliance.ncaEccPass
                    ? "bg-zinc-900 border-emerald-500/50 text-emerald-300"
                    : "bg-red-950/60 border-red-500 text-red-200"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Cloud size={16} className="text-sky-400" />
                  <span>4. NCA ECC Cybersecurity & Data Sovereignty</span>
                </span>
                <span className="text-[10px] text-zinc-400">
                  {activeVendorCompliance.ksaDataSovereignty ? "In-Kingdom KSA Hosting" : "Foreign Cloud Hosting"}
                </span>
                <StatusBadge status={activeVendorCompliance.ncaEccPass ? "low" : "high"} label={activeVendorCompliance.ncaEccPass ? "PASS" : "FAIL"} size="sm" />
              </div>
              <ArrowDown size={18} className="text-zinc-500 my-1" />
            </div>
          )}

          {/* Terminal Decision Gate Nodes */}
          <div className="grid grid-cols-2 gap-8 w-full max-w-xl pt-4">
            {/* Fail Terminal */}
            <div
              className={`p-4 rounded-xl border text-center flex flex-col items-center justify-center space-y-1.5 transition-all ${
                activeVendorCompliance.overallGateStatus === "FLAG_AND_BLOCK_PO"
                  ? "bg-red-950 border-red-500 text-red-200 ring-4 ring-red-500/30 scale-105 shadow-2xl"
                  : "bg-zinc-900/50 border-white/10 text-zinc-500 opacity-60"
              }`}
            >
              <XCircle size={24} className="text-red-400" />
              <span className="font-bold text-xs uppercase tracking-wider block">Flag & Block PO</span>
              <span className="text-[10px] font-mono">PO Issuance Forbidden</span>
            </div>

            {/* Pass Terminal */}
            <div
              className={`p-4 rounded-xl border text-center flex flex-col items-center justify-center space-y-1.5 transition-all ${
                activeVendorCompliance.overallGateStatus === "APPROVE_PURCHASE_ORDER"
                  ? "bg-emerald-950 border-emerald-500 text-emerald-200 ring-4 ring-emerald-500/30 scale-105 shadow-2xl"
                  : "bg-zinc-900/50 border-white/10 text-zinc-500 opacity-60"
              }`}
            >
              <CheckCircle2 size={24} className="text-emerald-400" />
              <span className="font-bold text-xs uppercase tracking-wider block">Approve Purchase Order</span>
              <span className="text-[10px] font-mono">Governed PO Issue Ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* DETAILED 4 PILLARS BREAKDOWN CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Pillar 1: IKTVA / LCGPA */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            activeVendorCompliance.ikvtALcgpaPass
              ? "bg-zinc-950/80 border-emerald-500/30"
              : "bg-red-950/20 border-red-500/50"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-zinc-900 text-emerald-400 border border-white/10">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h4 className="font-sans font-bold text-white text-xs">Pillar 1: IKTVA / LCGPA Local Content</h4>
                <span className="text-[10px] font-mono text-zinc-400">Local Content & Gov Procurement Authority</span>
              </div>
            </div>
            <StatusBadge status={activeVendorCompliance.ikvtALcgpaPass ? "low" : "high"} label={activeVendorCompliance.ikvtALcgpaPass ? "PASSED" : "VIOLATION"} size="sm" />
          </div>

          <div className="space-y-2 text-xs font-mono bg-zinc-900/60 p-3 rounded-xl border border-white/10">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Certified LCGPA Score:</span>
              <span className="text-white font-bold">{activeVendorCompliance.lcgpaScorePercent}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Required Sector Threshold:</span>
              <span className="text-emerald-400 font-bold">{config.minLcgpaThreshold}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Audited Certificate:</span>
              <span className="text-zinc-200">
                {activeVendorCompliance.lcgpaCertified ? "Active (LCGPA-2026-KSA)" : "Expired / Missing"}
              </span>
            </div>
          </div>
        </div>

        {/* Pillar 2: HCIS Industrial Security */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            activeVendorCompliance.hcisPass
              ? "bg-zinc-950/80 border-emerald-500/30"
              : "bg-red-950/20 border-red-500/50"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-zinc-900 text-amber-400 border border-white/10">
                <Building2 size={18} />
              </div>
              <div>
                <h4 className="font-sans font-bold text-white text-xs">Pillar 2: HCIS Directives Clearance</h4>
                <span className="text-[10px] font-mono text-zinc-400">High Commission for Industrial Security</span>
              </div>
            </div>
            <StatusBadge status={activeVendorCompliance.hcisPass ? "low" : "high"} label={activeVendorCompliance.hcisPass ? "PASSED" : "VIOLATION"} size="sm" />
          </div>

          <div className="space-y-2 text-xs font-mono bg-zinc-900/60 p-3 rounded-xl border border-white/10">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Class-A Enclosure Approved:</span>
              <span className={activeVendorCompliance.hcisClassApproved ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                {activeVendorCompliance.hcisClassApproved ? "Yes (SEC-01 Validated)" : "No Approval"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Directives Cleared:</span>
              <span className="text-zinc-200">{activeVendorCompliance.hcisDirectives.join(", ")}</span>
            </div>
          </div>
        </div>

        {/* Pillar 3: CST / SASO Homologation */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            activeVendorCompliance.cstSasoPass
              ? "bg-zinc-950/80 border-emerald-500/30"
              : "bg-red-950/20 border-red-500/50"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-zinc-900 text-rose-400 border border-white/10">
                <Radio size={18} />
              </div>
              <div>
                <h4 className="font-sans font-bold text-white text-xs">Pillar 3: CST / SASO Homologation</h4>
                <span className="text-[10px] font-mono text-zinc-400">Spectrum & CITC Type Approval</span>
              </div>
            </div>
            <StatusBadge status={activeVendorCompliance.cstSasoPass ? "low" : "high"} label={activeVendorCompliance.cstSasoPass ? "PASSED" : "VIOLATION"} size="sm" />
          </div>

          <div className="space-y-2 text-xs font-mono bg-zinc-900/60 p-3 rounded-xl border border-white/10">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">CST Type Approval:</span>
              <span className={activeVendorCompliance.cstTypeApproved ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                {activeVendorCompliance.cstTypeApproved ? "CST-TA-2026-SA" : "Missing Type Approval"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">SASO IECEE Certificate:</span>
              <span className="text-zinc-200">{activeVendorCompliance.sasoIeceeCertified ? "Certified ✓" : "Pending"}</span>
            </div>
          </div>
        </div>

        {/* Pillar 4: NCA ECC & Data Sovereignty */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            activeVendorCompliance.ncaEccPass
              ? "bg-zinc-950/80 border-emerald-500/30"
              : "bg-red-950/20 border-red-500/50"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-zinc-900 text-sky-400 border border-white/10">
                <Cloud size={18} />
              </div>
              <div>
                <h4 className="font-sans font-bold text-white text-xs">Pillar 4: NCA ECC & Data Sovereignty</h4>
                <span className="text-[10px] font-mono text-zinc-400">National Cybersecurity Authority</span>
              </div>
            </div>
            <StatusBadge status={activeVendorCompliance.ncaEccPass ? "low" : "high"} label={activeVendorCompliance.ncaEccPass ? "PASSED" : "VIOLATION"} size="sm" />
          </div>

          <div className="space-y-2 text-xs font-mono bg-zinc-900/60 p-3 rounded-xl border border-white/10">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">NCA ECC-1:2018 Certified:</span>
              <span className={activeVendorCompliance.ncaEccCertified ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                {activeVendorCompliance.ncaEccCertified ? "Certified ✓" : "Non-compliant"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">In-Kingdom Data Center:</span>
              <span className={activeVendorCompliance.ksaDataSovereignty ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                {activeVendorCompliance.ksaDataSovereignty ? "Riyadh / Jeddah Region" : "Foreign Territory"}
              </span>
            </div>
          </div>
        </div>

        {/* Pillar 5: Saudi Vision 2030 & ESG Green Mining Standards */}
        <div
          className={`p-4 rounded-2xl border transition-all md:col-span-2 ${
            activeVendorCompliance.esgPass
              ? "bg-zinc-950/80 border-emerald-500/30"
              : "bg-amber-950/20 border-amber-500/50"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-zinc-900 text-emerald-400 border border-white/10">
                <Sparkles size={18} />
              </div>
              <div>
                <h4 className="font-sans font-bold text-white text-xs">Pillar 5: Saudi Vision 2030 &amp; ESG Green Mining Standards</h4>
                <span className="text-[10px] font-mono text-zinc-400">Saudi Green Initiative (SGI) • Circular Economy &amp; PUE Compliance</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold border ${
                activeVendorCompliance.lcgpaTier === "Gold Champion"
                  ? "bg-amber-950 text-amber-300 border-amber-500/50"
                  : activeVendorCompliance.lcgpaTier === "Silver Tier"
                  ? "bg-zinc-800 text-zinc-200 border-zinc-600"
                  : "bg-emerald-950 text-emerald-300 border-emerald-500/40"
              }`}>
                {activeVendorCompliance.lcgpaTier || "Bronze Compliant"}
              </span>
              <StatusBadge status={activeVendorCompliance.esgPass ? "low" : "medium"} label={activeVendorCompliance.esgPass ? "SGI COMPLIANT" : "SGI DEFICIENT"} size="sm" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono bg-zinc-900/60 p-3 rounded-xl border border-white/10">
            <div>
              <span className="text-[10px] text-zinc-400 block mb-0.5">PUE Datacenter Energy:</span>
              <span className={`font-bold ${activeVendorCompliance.esgPueRating && activeVendorCompliance.esgPueRating <= 1.25 ? "text-emerald-400" : "text-amber-400"}`}>
                {activeVendorCompliance.esgPueRating} {activeVendorCompliance.esgPueRating && activeVendorCompliance.esgPueRating <= 1.25 ? "✓ (<1.25 SGI)" : "⚠ (>1.25 High)"}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 block mb-0.5">NCEC Circular E-Waste:</span>
              <span className={activeVendorCompliance.esgEwasteCertified ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                {activeVendorCompliance.esgEwasteCertified ? "Certified Take-Back ✓" : "No Circular Agreement"}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 block mb-0.5">KSA Scope 2 Solar Offset:</span>
              <span className={activeVendorCompliance.esgCarbonOffsetPledge ? "text-emerald-400 font-bold" : "text-zinc-400 font-bold"}>
                {activeVendorCompliance.esgCarbonOffsetPledge ? "100% Solar Pledged ✓" : "Uncommitted"}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 block mb-0.5">Harsh Mining Enclosure:</span>
              <span className="text-cyan-300 font-bold">
                {activeVendorCompliance.esgHarshEnvironmentRating || "IP66 / NEMA 4X"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Blocking Reasons & Override Section */}
      {activeVendorCompliance.blockingReasons.length > 0 && (
        <div className="p-5 bg-red-950/40 border border-red-500/50 rounded-2xl mb-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="text-red-400 shrink-0" size={20} />
              <h4 className="font-sans font-bold text-red-200 text-sm">
                Active Regulatory Violations — Purchase Order Blocked
              </h4>
            </div>

            {!activeVendorCompliance.overrideRecord && (
              <button
                onClick={() => setOverrideModalVendor(selectedVendorKey)}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition-all shadow-md shadow-cyan-600/30 cursor-pointer flex items-center gap-1.5"
              >
                <Unlock size={14} />
                <span>Issue Executive Override</span>
              </button>
            )}
          </div>

          <ul className="space-y-1.5 font-mono text-xs text-red-300 pl-6 list-disc">
            {activeVendorCompliance.blockingReasons.map((reason, idx) => (
              <li key={idx}>{reason}</li>
            ))}
          </ul>

          {activeVendorCompliance.overrideRecord && (
            <div className="p-3 bg-zinc-950 rounded-xl border border-amber-500/40 text-amber-200 text-xs font-mono space-y-1 mt-2">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                <Lock size={14} />
                <span>Regulatory Override Executed & Logged</span>
              </div>
              <p>Approver: {activeVendorCompliance.overrideRecord.user} (KSA CR: {activeVendorCompliance.overrideRecord.crNumber})</p>
              <p>Reason: {activeVendorCompliance.overrideRecord.reason}</p>
              <p className="text-[10px] text-zinc-400">Timestamp: {activeVendorCompliance.overrideRecord.timestamp}</p>
            </div>
          )}
        </div>
      )}

      {/* AI Compliance Scan Button (Cyan Action Button) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-zinc-950 rounded-xl border border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-cyan-600 to-teal-700 text-white rounded-xl shadow-md">
            <Sparkles size={18} />
          </div>
          <div>
            <span className="font-sans font-bold text-white text-xs block">AI Kingdom Regulatory Audit Assistant</span>
            <span className="font-mono text-[11px] text-zinc-400 block">
              Analyze raw proposal details against KSA Ministry of Communications & Security Directives.
            </span>
          </div>
        </div>

        <button
          onClick={() => handleRunAiAudit(selectedVendorKey)}
          disabled={isScanningAi}
          className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-600/20 disabled:opacity-50"
        >
          {isScanningAi ? (
            <>
              <RefreshCw size={14} className="animate-spin text-cyan-200" />
              <span>Scanning KSA Regulatory Directives...</span>
            </>
          ) : (
            <>
              <Sparkles size={14} className="text-amber-300" />
              <span>Run AI KSA Audit on {activeVendorCompliance.vendorName}</span>
            </>
          )}
        </button>
      </div>

      {/* AI Scan Results Drawer */}
      {aiScanResult && aiScanResult.vendorKey === selectedVendorKey && (
        <div className="mt-4 p-4 bg-zinc-950 border border-cyan-500/40 rounded-xl space-y-2 animate-fadeIn font-mono text-xs">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-cyan-300 font-bold flex items-center gap-1.5">
              <ShieldCheck size={16} />
              <span>AI Regulatory Audit Scan Report</span>
            </span>
            <StatusBadge status={activeVendorCompliance.overallGateStatus === "APPROVE_PURCHASE_ORDER" ? "low" : "high"} label={aiScanResult.riskLevel} size="sm" />
          </div>
          <p className="text-zinc-200 leading-relaxed whitespace-pre-line">{aiScanResult.summary}</p>
        </div>
      )}

      {/* Regulatory Override Modal with Requirement #4 Mandatory Reason */}
      {overrideModalVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-zinc-950 border border-red-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <div className="p-2 bg-red-950 text-red-400 rounded-xl border border-red-500/40">
                <ShieldAlert size={22} />
              </div>
              <div>
                <h3 className="font-sans font-bold text-white text-base">
                  Issue Executive Regulatory Override
                </h3>
                <span className="text-xs font-mono text-zinc-400">
                  Target Vendor: {VENDOR_NAMES[overrideModalVendor] || overrideModalVendor}
                </span>
              </div>
            </div>

            <p className="text-xs font-mono text-zinc-300 leading-relaxed">
              Issuing an emergency override bypasses the strict binary PO block. This action will be permanently recorded in the immutable KSA Procurement Audit Log with your Commercial Registration (CR) details.
            </p>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-zinc-400 block mb-1">Approver Full Name & Role</label>
                <input
                  type="text"
                  value={overrideForm.approverName}
                  onChange={(e) => setOverrideForm({ ...overrideForm, approverName: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Saudi Commercial Registration (CR Number)</label>
                <input
                  type="text"
                  value={overrideForm.crNumber}
                  onChange={(e) => setOverrideForm({ ...overrideForm, crNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg text-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-zinc-400 block">Royal Decree / Steering Committee Justification <span className="text-red-400 font-bold">*</span></label>
                  <span className={`text-[10px] ${isJustificationValid ? "text-emerald-400" : "text-amber-400"}`}>
                    {isJustificationValid ? "Justification Valid" : "Mandatory (Min 5 chars)"}
                  </span>
                </div>
                <textarea
                  value={overrideForm.justification}
                  onChange={(e) => setOverrideForm({ ...overrideForm, justification: e.target.value })}
                  className={`w-full h-24 px-3 py-2 bg-zinc-900 rounded-lg text-white resize-none border ${
                    isJustificationValid ? "border-emerald-500/50 focus:ring-emerald-500" : "border-red-500/50 focus:ring-red-500"
                  }`}
                  placeholder="Enter detailed justification reason for audit log..."
                />
                {!isJustificationValid && (
                  <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1">
                    <Info size={11} /> Text justification is mandatory before override submission.
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
              <button
                onClick={() => setOverrideModalVendor(null)}
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-mono text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmOverride}
                disabled={!isJustificationValid}
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-cyan-600/30"
              >
                Confirm & Sign Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

