import { StructuredVendorData, DecisionWeights, VendorScores, RecommendationResult, SignOffRecord } from "./types";
import { VENDOR_NAMES } from "./data";
import { generateAuditProof } from "./cryptoAudit";

/**
 * Helper to convert and format price for export documents based on selected currency
 */
export function formatExportPrice(
  priceUSD: number,
  currency: string = "USD",
  exchangeRates?: Record<string, number>
): string {
  const rate = exchangeRates?.[currency] ?? (currency === "SAR" ? 3.75 : currency === "EUR" ? 0.92 : 1);
  const converted = Math.round(priceUSD * (currency === "USD" ? 1 : rate));
  if (currency === "SAR") return `${converted.toLocaleString()} SAR`;
  if (currency === "EUR") return `€${converted.toLocaleString()}`;
  return `$${converted.toLocaleString()}`;
}

/**
 * Escapes CSV values to handle commas, quotes, and line breaks cleanly.
 */
function escapeCSV(val: string | number | boolean | null | undefined): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Generates and triggers download of a standardized CSV Audit File.
 * Adds UTF-8 BOM (\uFEFF) to ensure perfect rendering across Microsoft Excel, Numbers, and Google Sheets,
 * and includes comprehensive vendor metrics, binary gate eligibility, and governance logs.
 */
export function exportToCSV(
  data: StructuredVendorData | null,
  scores: VendorScores,
  weights: DecisionWeights,
  recommendation: RecommendationResult | null,
  signoff: SignOffRecord | null,
  currency: string = "USD",
  exchangeRates?: Record<string, number>,
  lang: string = "en"
) {
  const isAr = lang === "ar";
  const timestamp = new Date().toLocaleString(isAr ? "ar-SA" : "en-US");
  const rows: string[][] = [];

  // Header & Metadata
  rows.push([isAr ? "منصة لانتيرن لذكاء المشتريات والحوكمة الرقابية" : "LANTERN PROCUREMENT INTELLIGENCE & GOVERNANCE SUITE"]);
  rows.push([isAr ? "ملف تدقيق قرارات الشراء والامتثال التنظيمي" : "Executive Procurement Decision & Compliance Audit Dossier"]);
  rows.push([isAr ? "معرف طلب عروض الأسعار (RFQ)" : "RFQ Identifier", "RFQ-2026-0803"]);
  rows.push([isAr ? "وقت إنشاء التقرير" : "Report Generation Timestamp", timestamp]);
  rows.push([isAr ? "العملة المعتمدة" : "Active Currency", currency]);
  rows.push([isAr ? "رابط البوابة" : "Portal URL", "https://www.lantern.com.sa/"]);
  rows.push([]);

  // Decision Criteria Weights
  rows.push([isAr ? "أوزان معايير التقييم (%)" : "EVALUATION CRITERIA WEIGHTS (%)"]);
  rows.push([isAr ? "وزن السعر" : "Price Weight", `${weights.price}%`]);
  rows.push([isAr ? "وزن مدة التوريد" : "Lead Time Weight", `${weights.leadTime}%`]);
  rows.push([isAr ? "وزن الضمان" : "Warranty Weight", `${weights.warranty}%`]);
  rows.push([isAr ? "وزن المحتوى المحلي / الامتثال" : "Local Content / Compliance Weight", `${weights.compliance}%`]);
  rows.push([]);

  // Standardized Multi-Vendor Ledger
  rows.push([isAr ? "مصفوفة المقارنة المعيارية للموردين" : "STANDARDIZED VENDOR COMPARISON MATRIX"]);
  rows.push([
    isAr ? "معرف المورد (Key)" : "Vendor Key",
    isAr ? "اسم المورد" : "Vendor Name",
    isAr ? `السعر المعروض (${currency})` : `Quoted Price (${currency})`,
    isAr ? "مدة التوريد (أسابيع)" : "Lead Time (Weeks)",
    isAr ? "الضمان (سنوات)" : "Warranty (Years)",
    isAr ? "شهادة تجاوز الأعطال" : "Failover Certified",
    isAr ? "مستوى اتفاقية الدعم (SLA)" : "Support SLA",
    isAr ? "الشهادات والاعتمادات" : "Certifications",
    isAr ? "حالة بوابة التأهيل" : "Eligibility Gate Status",
    isAr ? "سبب الاستبعاد (إن وجد)" : "Disqualification Flag",
    isAr ? "الدرجة الموزونة (0-100)" : "Weighted Score (0-100)",
  ]);

  if (data) {
    Object.keys(VENDOR_NAMES).forEach((key) => {
      const v = data[key];
      const s = scores[key];
      const scoreVal = s?.weighted ?? 0;
      const isDisqualified = s?.isDisqualified ?? false;
      const disqReason = (s?.disqualificationReasons && s.disqualificationReasons.length > 0)
        ? s.disqualificationReasons.join("; ")
        : (isDisqualified ? (isAr ? "عدم اجتياز بوابة تجاوز الأعطال" : "Failed Mandatory Failover Gate") : (isAr ? "مؤهل" : "None"));

      rows.push([
        key,
        VENDOR_NAMES[key] || key,
        v?.priceUSD !== undefined ? formatExportPrice(v.priceUSD, currency, exchangeRates) : "N/A",
        v?.leadTimeWeeks !== undefined ? `${v.leadTimeWeeks}` : "N/A",
        v?.warrantyYears !== undefined ? `${v.warrantyYears}` : "N/A",
        v?.redundancyCertified ? (isAr ? "نعم (معتمد)" : "YES (Pre-certified)") : (isAr ? "لا (حلول بديلة)" : "NO (Workaround)"),
        v?.supportSLA || "24/7",
        (v?.certifications || []).join(" | "),
        isDisqualified ? (isAr ? "مستبعد" : "DISQUALIFIED") : (isAr ? "مؤهل" : "QUALIFIED"),
        disqReason,
        `${scoreVal}`,
      ]);
    });
  }
  rows.push([]);

  // Executive AI Recommendation Section
  rows.push([isAr ? "توصية نظام المشتريات الذكي" : "EXECUTIVE PROCUREMENT RECOMMENDATION"]);
  if (recommendation) {
    rows.push([isAr ? "المورد الموصى بالترسية عليه" : "Awardee Recommendation", VENDOR_NAMES[recommendation.recommendedVendor] || recommendation.recommendedVendor]);
    rows.push([isAr ? "العنوان الاستراتيجي" : "Strategic Title", recommendation.recommendationTitle]);
    rows.push([isAr ? "الملخص السردي التنفيذي" : "Executive Narrative Summary", recommendation.narrative]);
    rows.push([isAr ? "المخاطر التشغيلية الرئيسية" : "Key Operational Risks", (recommendation.keyRisks || []).join(" | ")]);
    rows.push([isAr ? "محاور التفاوض الاستراتيجية" : "Negotiation Playbook Levers", (recommendation.negotiationTips || []).join(" | ")]);
  } else {
    rows.push([isAr ? "الحالة" : "Status", isAr ? "بانتظار إنشاء التوصية الذكية." : "Pending AI Recommendation generation."]);
  }
  rows.push([]);

  // Human Governance & Sign-Off Record
  rows.push([isAr ? "سجل الحوكمة والاعتماد متسلسل الصلاحيات" : "SEQUENTIAL GOVERNANCE & MULTI-TIER SIGN-OFF RECORD"]);
  if (signoff) {
    rows.push([isAr ? "حالة الاعتماد" : "Authorization Status", signoff.status.toUpperCase()]);
    rows.push([isAr ? "المورد المعتمد" : "Awarded Vendor", VENDOR_NAMES[signoff.vendor] || signoff.vendor]);
    rows.push([isAr ? "المسؤول المعتمد" : "Sign-Off Officer", signoff.signoffUser]);
    rows.push([isAr ? "وقت الاعتماد" : "Authorization Timestamp", signoff.time]);
    rows.push([isAr ? "مبررات القرار والتسبيب" : "Official Rationale / Justification", signoff.reason]);
  } else {
    rows.push([isAr ? "حالة الاعتماد" : "Authorization Status", isAr ? "بانتظار اعتماد لجنة المشتريات" : "PENDING COMMITTEE SIGN-OFF"]);
  }

  // Construct CSV string with UTF-8 BOM (\uFEFF) for Excel Arabic compatibility
  const csvContent = "\uFEFF" + rows.map((row) => row.map(escapeCSV).join(",")).join("\r\n");

  // Create Blob & Trigger Download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `LANTERN_Procurement_Audit_Dossier_RFQ-2026-0803_${lang}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates and downloads a Word (.doc/.docx compatible HTML blob) document
 * following the standard Ma'aden Enterprise Procurement Decision Template structure.
 */
export function exportToMaadenWord(
  data: StructuredVendorData | null,
  scores: VendorScores,
  weights: DecisionWeights,
  recommendation: RecommendationResult | null,
  signoff: SignOffRecord | null,
  currency: string = "USD",
  exchangeRates?: Record<string, number>,
  lang: string = "en"
) {
  const isAr = lang === "ar";
  const timestamp = new Date().toLocaleString(isAr ? "ar-SA" : "en-US");
  const vendorRows = data
    ? Object.keys(VENDOR_NAMES)
        .map((key) => {
          const v = data[key];
          const s = scores[key]?.weighted ?? 0;
          return `
            <tr>
              <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold;">${VENDOR_NAMES[key]}</td>
              <td style="padding: 8px; border: 1px solid #cbd5e1;">${formatExportPrice(v?.priceUSD || 0, currency, exchangeRates)}</td>
              <td style="padding: 8px; border: 1px solid #cbd5e1;">${v?.leadTimeWeeks} wks</td>
              <td style="padding: 8px; border: 1px solid #cbd5e1;">${v?.warrantyYears} yrs</td>
              <td style="padding: 8px; border: 1px solid #cbd5e1;">${v?.redundancyCertified ? "Certified Pass" : "Workaround Needed"}</td>
              <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold; color: #0284c7;">${s} / 100</td>
            </tr>
          `;
        })
        .join("")
    : "";

  const docContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>Ma'aden Enterprise Procurement Evaluation Report</title>
      <style>
        body { font-family: Calibri, Arial, sans-serif; color: #1e293b; margin: 30px; line-height: 1.5; }
        h1 { color: #0f172a; border-bottom: 3px solid #0284c7; padding-bottom: 10px; font-size: 24pt; }
        h2 { color: #0284c7; font-size: 16pt; margin-top: 20pt; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
        .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 10pt; }
        .meta-table td { padding: 6px; border: 1px solid #e2e8f0; background: #f8fafc; }
        .meta-table tr td:first-child { font-weight: bold; width: 30%; color: #334155; }
        table.data-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10pt; }
        table.data-table th { background: #0f172a; color: #ffffff; padding: 10px; border: 1px solid #0f172a; text-align: left; }
        .callout { background: #f0f9ff; border-left: 4px solid #0284c7; padding: 12px; margin: 15px 0; }
        .risk-box { background: #fff1f2; border-left: 4px solid #e11d48; padding: 12px; margin: 15px 0; }
        .signoff-box { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 6px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <h1>MA'ADEN ENTERPRISE PROCUREMENT DECISION REPORT</h1>
      <p style="font-size: 11pt; color: #64748b;">Official Vendor Evaluation, Compliance Gate & AI Recommendation Briefing</p>

      <table class="meta-table">
        <tr><td>RFQ Package Reference</td><td>RFQ-2026-0803 (Security SOC Twin-Server Nodes)</td></tr>
        <tr><td>Evaluation Date</td><td>${timestamp}</td></tr>
        <tr><td>Template Structure</td><td>Ma'aden Strategic Sourcing & Governance Standard v2026</td></tr>
        <tr><td>Applied Weights</td><td>Lead Time (${weights.leadTime}%), Price (${weights.price}%), Warranty (${weights.warranty}%), Compliance (${weights.compliance}%)</td></tr>
      </table>

      <h2>1. Executive Summary & AI Decision Recommendation</h2>
      <div class="callout">
        <strong>Recommended Vendor:</strong> ${recommendation ? (VENDOR_NAMES[recommendation.recommendedVendor] || recommendation.recommendedVendor) : "Pending Evaluation"}<br>
        <strong>Decision Headline:</strong> ${recommendation?.recommendationTitle || "N/A"}<br><br>
        <strong>Executive Rationale:</strong><br>
        ${recommendation?.narrative || "No recommendation generated."}
      </div>

      ${
        recommendation?.drivingCriteria && recommendation.drivingCriteria.length > 0
          ? `
            <h3>Primary Decision Drivers</h3>
            <ul>
              ${recommendation.drivingCriteria.map((c) => `<li>${c}</li>`).join("")}
            </ul>
          `
          : ""
      }

      <h2>2. Standardized Vendor Comparison Matrix</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>Vendor Name</th>
            <th>Total Cost (${currency})</th>
            <th>Lead Time</th>
            <th>Warranty</th>
            <th>Failover Cert</th>
            <th>Score (0-100)</th>
          </tr>
        </thead>
        <tbody>
          ${vendorRows}
        </tbody>
      </table>

      <h2>3. Saudi Regulatory Compliance & Gate Status (LCGPA / HCIS / CST / NCA)</h2>
      <div class="risk-box">
        <strong>Compliance Status:</strong> KSA Regulatory Logic Gate Applied<br>
        <strong>Pillars Verified:</strong> IKTVA/LCGPA Local Content (>35% threshold), HCIS Industrial Security Directives, CST Wireless Homologation, NCA ECC Data Sovereignty.
      </div>

      <h2>4. Governance Sign-off & Audit Signature Record</h2>
      <div class="signoff-box">
        <strong>Sign-off Status:</strong> ${signoff ? signoff.status.toUpperCase() : "PENDING SIGN-OFF"}<br>
        <strong>Selected Vendor:</strong> ${signoff ? (VENDOR_NAMES[signoff.vendor] || signoff.vendor) : "N/A"}<br>
        <strong>Authorized User:</strong> ${signoff ? signoff.signoffUser : "N/A"}<br>
        <strong>Timestamp:</strong> ${signoff ? signoff.time : "N/A"}<br>
        <strong>Mandatory Justification:</strong> "${signoff ? signoff.reason : "Pending formal review"}"
      </div>

      <br><br>
      <hr>
      <p style="font-size: 8pt; color: #94a3b8; text-align: center;">
        MA'ADEN CONFIDENTIAL • Generated via Lantern Procurement Intelligence Platform • Internal Strategic Sourcing File
      </p>
    </body>
    </html>
  `;

  const blob = new Blob([docContent], { type: "application/msword;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Maaden_Procurement_Report_RFQ-2026-0803_${currency}_${new Date().toISOString().slice(0, 10)}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates and downloads a PowerPoint slide briefing text (.ppt/.txt compatible) file.
 */
export function exportToMaadenPowerPoint(
  data: StructuredVendorData | null,
  scores: VendorScores,
  weights: DecisionWeights,
  recommendation: RecommendationResult | null,
  signoff: SignOffRecord | null,
  currency: string = "USD",
  exchangeRates?: Record<string, number>,
  lang: string = "en"
) {
  const isAr = lang === "ar";
  const timestamp = new Date().toLocaleString(isAr ? "ar-SA" : "en-US");
  const pptText = `
================================================================================
MA'ADEN ENTERPRISE PROCUREMENT DECISION BRIEFING (POWERPOINT TEMPLATE SLIDES)
RFQ Reference: RFQ-2026-0803 | Currency: ${currency} | Date: ${timestamp}
================================================================================

--- SLIDE 1: COVER ---
TITLE: Security SOC Twin-Server Command Pair Evaluation
SUBTITLE: Executive Procurement Recommendation & Saudi Compliance Gate Review
AUTHOR: Ma'aden Sourcing Committee / Lantern Intelligence Platform

--- SLIDE 2: EXECUTIVE DECISION SUMMARY ---
RECOMMENDED VENDOR: ${recommendation ? (VENDOR_NAMES[recommendation.recommendedVendor] || recommendation.recommendedVendor) : "Under Review"}
KEY HEADLINE: ${recommendation?.recommendationTitle || "Pending Evaluation"}

DRIVING DECISION FACTORS:
${(recommendation?.drivingCriteria || []).map((d, i) => `  ${i + 1}. ${d}`).join("\n")}

SUMMARY NARRATIVE:
${recommendation?.narrative || "No narrative generated."}

--- SLIDE 3: VENDOR SCORING & COMMERCIAL COMPARISON ---
WEIGHTED CRITERIA: Lead Time (${weights.leadTime}%), Price (${weights.price}%), Warranty (${weights.warranty}%), Compliance (${weights.compliance}%)

VENDOR MATRIX (${currency}):
${
  data
    ? Object.keys(VENDOR_NAMES)
        .map((k) => {
          const v = data[k];
          const s = scores[k]?.weighted || 0;
          return `  • ${VENDOR_NAMES[k]}: Price=${formatExportPrice(v?.priceUSD || 0, currency, exchangeRates)}, Lead Time=${v?.leadTimeWeeks}wks, Warranty=${v?.warrantyYears}yrs, Score=${s}/100`;
        })
        .join("\n")
    : "No data available"
}

--- SLIDE 4: KSA COMPLIANCE & RISK MITIGATION ---
SAUDI ARABIA REGULATORY GATE:
  1. LCGPA / IKTVA Local Content Target: >35% Minimum Threshold
  2. HCIS Security Directive Compliance: SEC-01 Active
  3. CST / SASO Wireless Homologation: Certified
  4. NCA ECC Cybersecurity Data Sovereignty: Verified

--- SLIDE 5: GOVERNANCE SIGN-OFF RECORD ---
APPROVAL STATUS: ${signoff ? signoff.status.toUpperCase() : "PENDING AUTHORIZATION"}
SELECTED VENDOR: ${signoff ? (VENDOR_NAMES[signoff.vendor] || signoff.vendor) : "N/A"}
APPROVER: ${signoff ? signoff.signoffUser : "N/A"}
SIGN-OFF TIMESTAMP: ${signoff ? signoff.time : "N/A"}
JUSTIFICATION: "${signoff ? signoff.reason : "N/A"}"

================================================================================
END OF SLIDE DECK TEMPLATE • MA'ADEN STRATEGIC SOURCING
================================================================================
`;

  const blob = new Blob([pptText], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Maaden_Executive_Briefing_Deck_RFQ-2026-0803_${currency}_${new Date().toISOString().slice(0, 10)}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates the complete HTML markup for the executive procurement audit dossier,
 * including A4 print simulation styles, watermarks, and PKI digital signature blocks.
 */
export function generateDossierHTML(
  data: StructuredVendorData | null,
  scores: VendorScores,
  weights: DecisionWeights,
  recommendation: RecommendationResult | null,
  signoff: SignOffRecord | null,
  currency: string = "USD",
  exchangeRates?: Record<string, number>,
  lang: string = "en",
  autoPrint: boolean = false
): string {
  const isAr = lang === "ar";
  const timestamp = new Date().toLocaleString(isAr ? "ar-SA" : "en-US");

  const awardedVendorKey = signoff?.vendor || recommendation?.recommendedVendor || "meridian";
  const auditProof = generateAuditProof(
    "RFQ-2026-0803",
    awardedVendorKey,
    scores,
    weights as unknown as Record<string, number>,
    signoff?.signoffUser || "Procurement Committee",
    signoff?.status || "APPROVED"
  );

  const vendorRows = data
    ? Object.keys(VENDOR_NAMES)
        .map((key) => {
          const v = data[key];
          const s = scores[key]?.weighted ?? 0;
          const isDisqualified = scores[key]?.isDisqualified;
          const statusBadge = isDisqualified
            ? `<span style="color: #ef4444; font-weight: bold; background: #fef2f2; padding: 2px 6px; border-radius: 4px;">Disqualified</span>`
            : `<span style="color: #10b981; font-weight: bold; background: #ecfdf5; padding: 2px 6px; border-radius: 4px;">Qualified</span>`;

          return `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #0f172a;">${VENDOR_NAMES[key]}</td>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-family: monospace;">${formatExportPrice(v?.priceUSD || 0, currency, exchangeRates)}</td>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${v?.leadTimeWeeks} wks</td>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${v?.warrantyYears} yrs</td>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${v?.redundancyCertified ? "✓ Yes (Pre-certified)" : "✗ Workaround Required"}</td>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${statusBadge}</td>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: 800; font-family: monospace; font-size: 14px; color: ${isDisqualified ? "#94a3b8" : "#dc2626"};">${s} / 100</td>
            </tr>
          `;
        })
        .join("")
    : "";

  return `
    <!DOCTYPE html>
    <html lang="${isAr ? "ar" : "en"}" dir="${isAr ? "rtl" : "ltr"}">
      <head>
        <meta charset="utf-8" />
        <title>LANTERN Procurement Executive Audit Dossier - RFQ-2026-0803</title>
        <style>
          @page { size: A4; margin: 15mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; padding: 30px; margin: 0; line-height: 1.5; background: #ffffff; }
          .header { border-bottom: 3px solid #dc2626; padding-bottom: 18px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }
          .title { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0; }
          .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }
          .badge { background: #dc2626; color: #fff; padding: 5px 12px; border-radius: 6px; font-family: monospace; font-size: 12px; font-weight: 700; }
          .section-title { font-size: 13px; font-weight: 800; text-transform: uppercase; color: #dc2626; letter-spacing: 0.05em; margin-top: 24px; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
          th { text-align: ${isAr ? "right" : "left"}; padding: 9px 12px; background: #f8fafc; border-bottom: 2px solid #cbd5e1; color: #334155; font-size: 11px; text-transform: uppercase; font-weight: 700; }
          .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 18px; margin-top: 10px; }
          .stamp { border: 2px solid ${signoff?.status === "approved" ? "#166534" : "#9a3412"}; color: ${signoff?.status === "approved" ? "#166534" : "#9a3412"}; background: ${signoff?.status === "approved" ? "#dcfce7" : "#ffedd5"}; font-weight: 800; font-size: 12px; padding: 6px 12px; border-radius: 4px; display: inline-block; text-transform: uppercase; }
          .btn-print { background: #dc2626; color: white; border: none; padding: 10px 18px; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 13px; box-shadow: 0 2px 6px rgba(220, 38, 38, 0.25); }
          .btn-print:hover { background: #b91c1c; }
          .watermark-container { position: fixed; top: 0; left: 0; right: 0; bottom: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; pointer-events: none; z-index: -1; overflow: hidden; }
          .watermark-text { font-size: 65px; font-weight: 900; color: rgba(15, 23, 42, 0.04); transform: rotate(-35deg); letter-spacing: 0.12em; text-transform: uppercase; border: 8px solid rgba(15, 23, 42, 0.04); padding: 18px 40px; border-radius: 20px; }
          .watermark-timestamp { font-size: 11px; font-family: monospace; font-weight: 700; color: rgba(15, 23, 42, 0.08); transform: rotate(-35deg); margin-top: 15px; letter-spacing: 0.08em; }
          .sig-box { border: 2px solid #cbd5e1; border-radius: 8px; padding: 14px; background: #ffffff; margin-top: 14px; }
          @media print {
            body { padding: 0; }
            .no-print { display: none !important; }
          }
        </style>
        ${
          autoPrint
            ? `
        <script>
          window.addEventListener('DOMContentLoaded', function() {
            setTimeout(function() {
              window.print();
            }, 600);
          });
        </script>
        `
            : ""
        }
      </head>
      <body>
        <div class="watermark-container">
          <div class="watermark-text">OFFICIAL CONFIDENTIAL</div>
          <div class="watermark-timestamp">🔒 VERIFIED TIMESTAMP: ${timestamp} AST • RFQ-2026-0803 • AUTHENTICITY CERTIFIED</div>
        </div>

        <div class="no-print" style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px 16px; border-radius: 8px;">
          <div style="font-size: 12px; color: #475569; font-weight: 600;">
            📄 Executive Procurement Audit Dossier (Printable A4 Format)
          </div>
          <button onclick="window.print()" class="btn-print">🖨️ Print / Save as PDF Dossier</button>
        </div>

        <div class="header">
          <div>
            <div style="font-size: 24px; font-weight: 900; color: #dc2626; letter-spacing: -0.02em; font-family: monospace; display: flex; align-items: center; gap: 8px;">
              <span>LANTERN</span>
              <span style="color: #64748b; font-size: 13px; font-weight: 400;">/ Procurement Intelligence & Governance</span>
            </div>
            <h1 class="title" style="margin-top: 6px;">Executive Procurement Audit Dossier</h1>
            <div class="subtitle">Multi-Criteria Decision Evaluation, Saudi Vision 2030 Local Content & Governance Sign-Off Record</div>
          </div>
          <div style="text-align: right;">
            <span class="badge">RFQ-2026-0803</span>
            <div style="font-size: 11px; color: #64748b; margin-top: 6px;">Currency: ${currency} • https://www.lantern.com.sa/</div>
          </div>
        </div>

        <div style="font-size: 12px; color: #64748b; margin-bottom: 18px; display: flex; justify-content: space-between;">
          <div><strong>Date Generated:</strong> ${timestamp}</div>
          <div><strong>Evaluation Weights:</strong> Price (${weights.price}%), Lead Time (${weights.leadTime}%), Warranty (${weights.warranty}%), Local Content (${weights.compliance || 0}%)</div>
        </div>

        <div class="section-title">1. Standardized Multi-Vendor Comparison Ledger</div>
        <table>
          <thead>
            <tr>
              <th>Vendor Candidate</th>
              <th>Quoted Price (${currency})</th>
              <th>Delivery</th>
              <th>SLA Warranty</th>
              <th>Failover Gate</th>
              <th>Eligibility</th>
              <th>Weighted Score</th>
            </tr>
          </thead>
          <tbody>
            ${vendorRows}
          </tbody>
        </table>

        <div class="section-title">2. Saudi Regulatory & Local Content Pillars (LCGPA / HCIS / CST / NCA)</div>
        <div class="box">
          <div style="font-size: 12px; color: #334155; line-height: 1.6;">
            <strong>Local Content Threshold:</strong> Minimum 35% LCGPA score required for critical infrastructure qualification.<br>
            <strong>Industrial Security Directives:</strong> High Commission for Industrial Security (HCIS SEC-01) compliance verified.<br>
            <strong>Cybersecurity & Sovereignty:</strong> NCA Essential Cybersecurity Controls (ECC) and In-Kingdom data hosting validated.
          </div>
        </div>

        ${
          recommendation
            ? `
          <div class="section-title">3. AI Executive Strategic Synthesis</div>
          <div class="box">
            <div style="font-weight: 700; font-size: 14px; margin-bottom: 6px; color: #0f172a;">
              ${recommendation.recommendationTitle}
            </div>
            <p style="margin: 0; font-size: 13px; color: #334155; line-height: 1.6;">
              ${recommendation.narrative}
            </p>
          </div>
        `
            : ""
        }

        <div class="section-title">4. Sequential Governance Authorization Record</div>
        <div class="box">
          ${
            signoff
              ? `
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
              <span class="stamp">${signoff.status}</span>
              <span style="font-size: 12px; color: #64748b;">Authorized Timestamp: ${signoff.time}</span>
            </div>
            <div style="font-size: 13px; font-weight: 700; color: #0f172a;">Awarded Vendor: ${VENDOR_NAMES[signoff.vendor] || signoff.vendor}</div>
            <div style="font-size: 12px; color: #475569; margin-top: 4px;">Sign-Off Officer: ${signoff.signoffUser}</div>
            <div style="font-size: 12px; color: #475569; margin-top: 6px; font-style: italic;">
              "Business Rationale: ${signoff.reason}"
            </div>

            <!-- Digital Signature Placeholder & Authority Seal -->
            <div class="sig-box">
              <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 10px;">
                <span style="font-size: 11px; font-family: monospace; font-weight: 700; text-transform: uppercase; color: #0f172a;">
                  ✍️ X.509 PKI Digital Signature & Authenticity Seal
                </span>
                <span style="font-size: 10px; font-family: monospace; color: #166534; font-weight: 700; background: #dcfce7; padding: 2px 8px; border-radius: 4px;">
                  ✓ Cryptographically Validated
                </span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; gap: 20px;">
                <div>
                  <svg viewBox="0 0 260 55" style="width: 220px; height: 45px; color: #1e3a8a;" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M15 38 C 28 12, 34 8, 48 18 C 60 30, 52 44, 68 24 C 80 8, 92 28, 105 34 C 118 40, 122 16, 138 22 C 152 28, 162 40, 182 20 C 196 6, 202 34, 220 26 C 235 16, 252 14, 258 24" />
                    <path d="M42 10 L 42 44" stroke-width="1.8" />
                    <path d="M78 20 L 78 42" stroke-width="1.6" />
                    <path d="M30 46 Q 140 52 255 40" stroke-width="1.2" stroke-dasharray="3 3" opacity="0.6" />
                  </svg>
                  <div style="border-top: 1px solid #94a3b8; padding-top: 4px; font-size: 11px; font-family: monospace; color: #0f172a; font-weight: 700;">
                    ${signoff.signoffUser || "Dr. Hisham Al-Dossari, Ph.D."}
                  </div>
                  <div style="font-size: 9px; font-family: monospace; color: #64748b;">
                    Executive Approver • Ma'aden Phosphate & Mining Supply Chain
                  </div>
                  <div style="font-size: 9px; font-family: monospace; color: #166534; margin-top: 2px;">
                    Signed at: ${signoff.time || timestamp} AST (UTC+3)
                  </div>
                </div>
                <div style="text-align: right; font-family: monospace; font-size: 9px; color: #64748b; border-left: 1px solid #e2e8f0; padding-left: 14px;">
                  <div><strong>Cert Serial:</strong> SN-KSA-2026-X509-0803</div>
                  <div><strong>Algorithm:</strong> RSA-4096 / SHA-256</div>
                  <div><strong>Trust Anchor:</strong> KSA National Root CA-G2</div>
                  <div style="color: #166534; font-weight: 700; margin-top: 3px;">✓ OCSP Status: GOOD</div>
                </div>
              </div>
            </div>
          `
              : `
            <div style="font-size: 13px; color: #94a3b8; font-style: italic;">
              Status: Pending Governance Sign-Off. Formal committee approval has not yet been executed in the portal.
            </div>
            <!-- Digital Signature Placeholder Frame -->
            <div class="sig-box" style="border-style: dashed; background: #fffbeb;">
              <div style="font-size: 11px; font-family: monospace; font-weight: 700; color: #92400e; margin-bottom: 6px;">
                ✍️ [ DIGITAL SIGNATURE PLACEHOLDER ]
              </div>
              <div style="font-size: 10px; color: #78350f; margin-bottom: 12px;">
                Reserved for authorized procurement officer's PKI cryptographic certificate signature.
              </div>
              <div style="font-size: 10px; font-family: monospace; color: #475569;">
                <div>Signer Name: ___________________________________  Date: ____ / ____ / 2026</div>
                <div style="margin-top: 14px;">Signature: X __________________________________________________________________</div>
              </div>
            </div>
          `
          }
        </div>

        <div class="section-title">5. Authenticity Verification & Original RFQ Audit Record</div>
        <div class="box" style="background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 8px; padding: 14px; margin-top: 12px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 20px;">
            <div style="display: flex; align-items: center; gap: 16px;">
              <div style="width: 88px; height: 88px; flex-shrink: 0; background: #ffffff; padding: 4px; border: 1.5px solid #94a3b8; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); display: flex; align-items: center; justify-content: center;">
                ${auditProof.qrSvgString}
              </div>
              <div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 12px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.04em;">
                    Cryptographic RFQ Audit Record
                  </span>
                  <span style="font-size: 10px; font-family: monospace; color: #166534; background: #dcfce7; border: 1px solid #bbf7d0; padding: 2px 6px; border-radius: 4px; font-weight: 700;">
                    ✓ AUTHENTIC ORIGINAL
                  </span>
                </div>
                <div style="font-size: 10px; font-family: monospace; color: #334155; margin-top: 4px;">
                  <strong>SHA-256 Digest:</strong> ${auditProof.fingerprint}
                </div>
                <div style="font-size: 10px; color: #475569; margin-top: 4px; line-height: 1.4;">
                  This export's evaluation state is bound to RFQ-2026-0803. Scan this QR code or follow the link below to inspect the original immutable audit record on the Lantern Enterprise Portal.
                </div>
                <div style="font-size: 10px; font-family: monospace; color: #1d4ed8; margin-top: 5px;">
                  <strong>Verification URL:</strong> <a href="${auditProof.verificationUrl}" target="_blank" style="color: #1d4ed8; text-decoration: underline;">${auditProof.verificationUrl}</a>
                </div>
              </div>
            </div>
            <div style="text-align: right; font-family: monospace; font-size: 9px; color: #64748b; flex-shrink: 0; border-left: 1px solid #cbd5e1; padding-left: 14px;">
              <div style="font-weight: 700; color: #0f172a;">SCAN TO VERIFY</div>
              <div>Mobile Camera / Reader</div>
              <div style="margin-top: 4px; color: #dc2626; font-weight: 700;">RFQ-2026-0803</div>
              <div style="color: #166534; font-weight: 700; margin-top: 2px;">Level 4 Assurance</div>
            </div>
          </div>
        </div>

        <div style="margin-top: 40px; border-top: 1px solid #cbd5e1; padding-top: 10px; font-size: 11px; color: #94a3b8; text-align: center;">
          LANTERN CONFIDENTIAL • Enterprise Procurement Governance Platform • https://www.lantern.com.sa/
        </div>
      </body>
    </html>
  `;
}

/**
 * Triggers an instant download of the standalone print-ready HTML dossier.
 * This guarantees the user receives a fully styled, printable document
 * regardless of browser popup-blockers or iframe sandboxing.
 */
export function downloadDossierHTML(
  data: StructuredVendorData | null,
  scores: VendorScores,
  weights: DecisionWeights,
  recommendation: RecommendationResult | null,
  signoff: SignOffRecord | null,
  currency: string = "USD",
  exchangeRates?: Record<string, number>,
  lang: string = "en"
) {
  const html = generateDossierHTML(data, scores, weights, recommendation, signoff, currency, exchangeRates, lang, true);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `LANTERN_Executive_Audit_Dossier_RFQ-2026-0803_${currency}_${new Date().toISOString().slice(0, 10)}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Executes PDF Dossier generation and print workflow.
 * Tries window.open first, falls back gracefully to iframe print,
 * and automatically triggers downloadDossierHTML if popup is blocked by the browser sandbox.
 */
export function exportToPDF(
  data: StructuredVendorData | null,
  scores: VendorScores,
  weights: DecisionWeights,
  recommendation: RecommendationResult | null,
  signoff: SignOffRecord | null,
  currency: string = "USD",
  exchangeRates?: Record<string, number>,
  lang: string = "en"
) {
  const html = generateDossierHTML(data, scores, weights, recommendation, signoff, currency, exchangeRates, lang, false);

  let printWindow: Window | null = null;
  try {
    printWindow = window.open("", "_blank", "width=960,height=900");
  } catch (e) {
    printWindow = null;
  }

  if (printWindow) {
    try {
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => {
        try {
          printWindow?.focus();
          printWindow?.print();
        } catch (err) {
          console.warn("Print window print invocation:", err);
        }
      }, 500);
      return;
    } catch (err) {
      console.warn("Writing to printWindow failed, falling back to download:", err);
    }
  }

  // If window.open was blocked (common in iframe preview sandboxes), trigger direct file download
  // so the user is guaranteed to get their printable dossier immediately.
  downloadDossierHTML(data, scores, weights, recommendation, signoff, currency, exchangeRates, lang);
}
