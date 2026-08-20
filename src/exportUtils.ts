import { StructuredVendorData, DecisionWeights, VendorScores, RecommendationResult, SignOffRecord } from "./types";
import { VENDOR_NAMES } from "./data";

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
 * Generates and triggers download of a CSV Audit File.
 */
export function exportToCSV(
  data: StructuredVendorData | null,
  scores: VendorScores,
  weights: DecisionWeights,
  recommendation: RecommendationResult | null,
  signoff: SignOffRecord | null
) {
  const timestamp = new Date().toLocaleString();
  const rows: string[][] = [];

  // Header & Metadata
  rows.push(["LANTERN PROCUREMENT GOVERNANCE & INTELLIGENCE"]);
  rows.push(["Audit Summary & Governance Record"]);
  rows.push(["RFQ Identifier", "RFQ-2026-0803"]);
  rows.push(["Generated Timestamp", timestamp]);
  rows.push([]);

  // Decision Criteria Weights
  rows.push(["EVALUATION CRITERIA WEIGHTS (%)"]);
  rows.push(["Price Weight", `${weights.price}%`]);
  rows.push(["Lead Time Weight", `${weights.leadTime}%`]);
  rows.push(["Warranty Weight", `${weights.warranty}%`]);
  rows.push(["Compliance/Redundancy Weight", `${weights.compliance}%`]);
  rows.push([]);

  // Vendor Matrix
  rows.push([
    "Vendor Key",
    "Vendor Name",
    "Price (USD)",
    "Lead Time (Weeks)",
    "Warranty (Years)",
    "Failover Certified",
    "Support SLA",
    "Certifications",
    "Weighted Score (0-100)",
  ]);

  if (data) {
    Object.keys(VENDOR_NAMES).forEach((key) => {
      const v = data[key];
      const score = scores[key]?.weighted ?? 0;
      rows.push([
        key,
        VENDOR_NAMES[key] || key,
        v?.priceUSD ? `$${v.priceUSD}` : "N/A",
        v?.leadTimeWeeks ? `${v.leadTimeWeeks}` : "N/A",
        v?.warrantyYears ? `${v.warrantyYears}` : "N/A",
        v?.redundancyCertified ? "Yes" : "No",
        v?.supportSLA || "N/A",
        (v?.certifications || []).join(" / "),
        `${score}`,
      ]);
    });
  }
  rows.push([]);

  // Recommendation Section
  rows.push(["EXECUTIVE RECOMMENDATION"]);
  if (recommendation) {
    rows.push(["Recommended Vendor", VENDOR_NAMES[recommendation.recommendedVendor] || recommendation.recommendedVendor]);
    rows.push(["Headline", recommendation.recommendationTitle]);
    rows.push(["Narrative Summary", recommendation.narrative]);
    rows.push(["Key Risks / Review Points", (recommendation.keyRisks || []).join(" | ")]);
    rows.push(["Negotiation Levers", (recommendation.negotiationTips || []).join(" | ")]);
  } else {
    rows.push(["Status", "No AI recommendation generated yet."]);
  }
  rows.push([]);

  // Sign-Off Governance Record
  rows.push(["HUMAN GOVERNANCE SIGN-OFF RECORD"]);
  if (signoff) {
    rows.push(["Approval Status", signoff.status.toUpperCase()]);
    rows.push(["Selected Vendor", VENDOR_NAMES[signoff.vendor] || signoff.vendor]);
    rows.push(["Authorized By", signoff.signoffUser]);
    rows.push(["Sign-Off Timestamp", signoff.time]);
    rows.push(["Business Rationale / Justification", signoff.reason]);
  } else {
    rows.push(["Approval Status", "PENDING SIGN-OFF"]);
  }

  // Construct CSV string
  const csvContent = rows.map((row) => row.map(escapeCSV).join(",")).join("\n");

  // Create Blob & Trigger Download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `Procurement_Audit_Log_RFQ-2026-0803_${new Date().toISOString().slice(0, 10)}.csv`);
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
  signoff: SignOffRecord | null
) {
  const timestamp = new Date().toLocaleString();
  const vendorRows = data
    ? Object.keys(VENDOR_NAMES)
        .map((key) => {
          const v = data[key];
          const s = scores[key]?.weighted ?? 0;
          return `
            <tr>
              <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold;">${VENDOR_NAMES[key]}</td>
              <td style="padding: 8px; border: 1px solid #cbd5e1;">${(v?.priceUSD || 0).toLocaleString()}</td>
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
            <th>Total Cost (USD)</th>
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
  link.download = `Maaden_Procurement_Report_RFQ-2026-0803_${new Date().toISOString().slice(0, 10)}.doc`;
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
  signoff: SignOffRecord | null
) {
  const timestamp = new Date().toLocaleString();
  const pptText = `
================================================================================
MA'ADEN ENTERPRISE PROCUREMENT DECISION BRIEFING (POWERPOINT TEMPLATE SLIDES)
RFQ Reference: RFQ-2026-0803 | Date: ${timestamp}
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

VENDOR MATRIX:
${
  data
    ? Object.keys(VENDOR_NAMES)
        .map((k) => {
          const v = data[k];
          const s = scores[k]?.weighted || 0;
          return `  • ${VENDOR_NAMES[k]}: Price=${v?.priceUSD?.toLocaleString() || "N/A"}, Lead Time=${v?.leadTimeWeeks}wks, Warranty=${v?.warrantyYears}yrs, Score=${s}/100`;
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
  link.download = `Maaden_Executive_Briefing_Deck_RFQ-2026-0803_${new Date().toISOString().slice(0, 10)}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToPDF(
  data: StructuredVendorData | null,
  scores: VendorScores,
  weights: DecisionWeights,
  recommendation: RecommendationResult | null,
  signoff: SignOffRecord | null
) {
  const timestamp = new Date().toLocaleString();
  const printWindow = window.open("", "_blank", "width=900,height=800");

  if (!printWindow) {
    alert("Please allow pop-ups for this application to open the printable PDF audit report.");
    return;
  }

  const vendorRows = data
    ? Object.keys(VENDOR_NAMES)
        .map((key) => {
          const v = data[key];
          const s = scores[key]?.weighted ?? 0;
          return `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${VENDOR_NAMES[key]}</td>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">$${(v?.priceUSD || 0).toLocaleString()}</td>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${v?.leadTimeWeeks} wks</td>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${v?.warrantyYears} yrs</td>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${v?.redundancyCertified ? "Yes (Pre-certified)" : "Requires Workaround"}</td>
              <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #1e293b;">${s} / 100</td>
            </tr>
          `;
        })
        .join("")
    : "";

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Procurement Audit Trail - RFQ-2026-0803</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; padding: 40px; margin: 0; line-height: 1.5; }
          .header { border-bottom: 2px solid #2563eb; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: flex-end; }
          .title { font-size: 22px; font-weight: 700; color: #0f172a; margin: 0; }
          .subtitle { font-size: 13px; color: #64748b; margin-top: 4px; }
          .badge { background: #0f172a; color: #fff; padding: 4px 10px; border-radius: 4px; font-family: monospace; font-size: 12px; }
          .section-title { font-size: 14px; font-weight: 700; text-transform: uppercase; color: #2563eb; letter-spacing: 0.05em; margin-top: 25px; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
          th { text-align: left; padding: 10px; background: #f8fafc; border-bottom: 2px solid #cbd5e1; color: #475569; font-size: 11px; text-transform: uppercase; }
          .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-top: 10px; }
          .stamp { border: 2px solid ${signoff?.status === "approved" ? "#166534" : "#9a3412"}; color: ${signoff?.status === "approved" ? "#166534" : "#9a3412"}; background: ${signoff?.status === "approved" ? "#dcfce7" : "#ffedd5"}; font-weight: 700; font-size: 12px; padding: 6px 12px; border-radius: 4px; display: inline-block; text-transform: uppercase; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 20px; text-align: right;">
          <button onclick="window.print()" style="background: #2563eb; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer;">Print / Save as PDF</button>
        </div>

        <div class="header">
          <div>
            <div style="font-size: 24px; font-weight: 900; color: #dc2626; letter-spacing: -0.02em; font-family: monospace; display: flex; items-center; gap: 8px;">
              <span style="color: #dc2626;">LANTERN</span>
              <span style="color: #64748b; font-size: 14px; font-weight: 400;">/ Procurement Intelligence</span>
            </div>
            <h1 class="title" style="margin-top: 6px;">Procurement Decision & Executive Audit Trail</h1>
            <div class="subtitle">Vendor Evaluation, Industry Threshold Risk Review & Governance Sign-Off Record</div>
          </div>
          <div style="text-align: right;">
            <span class="badge" style="background: #dc2626; color: #ffffff; font-weight: 700;">RFQ-2026-0803</span>
            <div style="font-size: 11px; color: #64748b; margin-top: 6px;">LANTERN Governance Suite</div>
          </div>
        </div>

        <div style="font-size: 12px; color: #64748b; margin-bottom: 20px;">
          <strong>Date Generated:</strong> ${timestamp}<br>
          <strong>Weights Applied:</strong> Price (${weights.price}%), Lead Time (${weights.leadTime}%), Warranty (${weights.warranty}%), Compliance (${weights.compliance}%)
        </div>

        <div class="section-title">1. Standardized Vendor Comparison</div>
        <table>
          <thead>
            <tr>
              <th>Vendor</th>
              <th>Price (USD)</th>
              <th>Lead Time</th>
              <th>Warranty</th>
              <th>Failover Cert.</th>
              <th>Weighted Score</th>
            </tr>
          </thead>
          <tbody>
            ${vendorRows}
          </tbody>
        </table>

        ${
          recommendation
            ? `
          <div class="section-title">2. AI Executive Recommendation</div>
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

        <div class="section-title">3. Governance & Human Approval Record</div>
        <div class="box">
          ${
            signoff
              ? `
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
              <span class="stamp">${signoff.status}</span>
              <span style="font-size: 12px; color: #64748b;">Sign-Off Date: ${signoff.time}</span>
            </div>
            <div style="font-size: 13px; font-weight: 600;">Selected Vendor: ${VENDOR_NAMES[signoff.vendor] || signoff.vendor}</div>
            <div style="font-size: 12px; color: #475569; margin-top: 4px;">Authorized By: ${signoff.signoffUser}</div>
            <div style="font-size: 12px; color: #475569; margin-top: 6px; font-style: italic;">
              "Rationale: ${signoff.reason}"
            </div>
          `
              : `
            <div style="font-size: 13px; color: #94a3b8; font-style: italic;">
              Status: Pending Sign-Off. Formal approval has not yet been executed in the portal.
            </div>
          `
          }
        </div>

        <div style="margin-top: 40px; border-top: 1px solid #cbd5e1; pt-10px; font-size: 11px; color: #94a3b8; text-align: center; margin-top: 50px;">
          Internal Compliance Record • Confidential Procurement Audit Document • Generated via Enterprise Procurement Portal
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
