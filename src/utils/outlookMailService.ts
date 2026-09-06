import {
  OutlookAccountProfile,
  OutlookApprovalEmailPayload,
  OutlookDispatchRecord,
  CurrencyCode,
} from "../types";

const OUTLOOK_STORAGE_KEY = "lantern_outlook_profile";
const DISPATCH_HISTORY_KEY = "lantern_outlook_dispatch_log";

// Default Azure / Microsoft Client ID for OAuth if none provided (can be customized in UI/env)
export const DEFAULT_MICROSOFT_CLIENT_ID = "00000000-0000-0000-0000-000000000000";

/**
 * Loads stored Outlook profile from localStorage
 */
export function getSavedOutlookProfile(): OutlookAccountProfile | null {
  try {
    const raw = localStorage.getItem(OUTLOOK_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load stored Outlook profile:", e);
    return null;
  }
}

/**
 * Saves Outlook profile to localStorage
 */
export function saveOutlookProfile(profile: OutlookAccountProfile): void {
  try {
    localStorage.setItem(OUTLOOK_STORAGE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error("Failed to save Outlook profile:", e);
  }
}

/**
 * Clears saved Outlook connection
 */
export function clearSavedOutlookProfile(): void {
  try {
    localStorage.removeItem(OUTLOOK_STORAGE_KEY);
  } catch (e) {
    console.error("Failed to clear Outlook profile:", e);
  }
}

/**
 * Loads dispatch audit history log
 */
export function getDispatchHistory(): OutlookDispatchRecord[] {
  try {
    const raw = localStorage.getItem(DISPATCH_HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

/**
 * Adds an entry to dispatch audit history
 */
export function logDispatchRecord(record: OutlookDispatchRecord): void {
  try {
    const current = getDispatchHistory();
    const updated = [record, ...current].slice(0, 50); // keep last 50
    localStorage.setItem(DISPATCH_HISTORY_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to log dispatch record:", e);
  }
}

/**
 * Builds Microsoft OAuth 2.0 Authorization URL for client-side authentication
 */
export function buildMicrosoftOAuthUrl(clientId: string, redirectUri: string): string {
  const scopes = [
    "https://graph.microsoft.com/Mail.Send",
    "https://graph.microsoft.com/User.Read",
    "openid",
    "profile",
    "email",
  ].join(" ");

  const params = new URLSearchParams({
    client_id: clientId || DEFAULT_MICROSOFT_CLIENT_ID,
    response_type: "token",
    redirect_uri: redirectUri,
    scope: scopes,
    response_mode: "fragment",
    prompt: "select_account",
  });

  return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
}

/**
 * Builds Outlook Web (OWA / Office 365) Deep Link URL for 1-click browser compose
 * Uses RFC 3986 percent encoding (%20 for spaces) so Outlook doesn't render '+' characters.
 */
export function buildOutlookWebComposeUrl(
  to: string[],
  subject: string,
  body: string,
  isWorkOffice365 = true
): string {
  const baseUrl = isWorkOffice365
    ? "https://outlook.office.com/mail/deeplink/compose"
    : "https://outlook.live.com/mail/0/deeplink/compose";

  const parts: string[] = [];

  if (to && to.length > 0) {
    const cleanTo = to.filter((e) => e && e.trim()).join("; ");
    if (cleanTo) {
      parts.push(`to=${encodeURIComponent(cleanTo)}`);
    }
  }

  if (subject) {
    parts.push(`subject=${encodeURIComponent(subject)}`);
  }

  if (body) {
    // encodeURIComponent preserves proper %20 spaces and %0A newlines (NOT plus '+')
    parts.push(`body=${encodeURIComponent(body)}`);
  }

  return `${baseUrl}?${parts.join("&")}`;
}

/**
 * Builds Desktop Outlook / Mailto Protocol URL
 * Uses RFC 3986 percent-encoding (%20 for spaces) to prevent literal '+' in mail clients.
 */
export function buildMailtoUrl(to: string[], cc: string[], subject: string, bodyText: string): string {
  const cleanTo = (to || []).filter((e) => e && e.trim()).join(",");
  const params: string[] = [];

  if (cc && cc.length > 0) {
    const cleanCc = cc.filter((e) => e && e.trim()).join(",");
    if (cleanCc) {
      params.push(`cc=${encodeURIComponent(cleanCc)}`);
    }
  }
  if (subject) {
    params.push(`subject=${encodeURIComponent(subject)}`);
  }
  if (bodyText) {
    params.push(`body=${encodeURIComponent(bodyText)}`);
  }

  const query = params.length > 0 ? `?${params.join("&")}` : "";
  return `mailto:${cleanTo}${query}`;
}

/**
 * Copies formatted rich HTML (and fallback plaintext) to clipboard.
 * Allows user to paste directly into Outlook Web or Desktop with tables, colors & styles intact!
 */
export async function copyRichHtmlToClipboard(htmlContent: string, plainTextContent: string): Promise<boolean> {
  try {
    if (typeof ClipboardItem !== "undefined" && navigator.clipboard && navigator.clipboard.write) {
      const htmlBlob = new Blob([htmlContent], { type: "text/html" });
      const textBlob = new Blob([plainTextContent], { type: "text/plain" });
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": htmlBlob,
          "text/plain": textBlob,
        }),
      ]);
      return true;
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(plainTextContent);
      return false;
    }
    return false;
  } catch (err) {
    console.warn("Rich clipboard write failed, falling back to plaintext:", err);
    try {
      await navigator.clipboard.writeText(plainTextContent);
    } catch {}
    return false;
  }
}

/**
 * Downloads a standard RFC 822 / MIME .eml draft file.
 * When opened, Outlook Desktop automatically opens it as a formatted editable draft
 * with rich HTML tables, subject, and recipients fully preserved!
 */
export function downloadEmlDraftFile(params: {
  to: string[];
  cc?: string[];
  subject: string;
  htmlBody: string;
  plainTextBody: string;
  fileName?: string;
}): void {
  const boundary = `----=_NextPart_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  const dateStr = new Date().toUTCString();
  const toStr = params.to.filter(Boolean).join(", ");
  const ccStr = (params.cc || []).filter(Boolean).join(", ");

  const lines = [
    `To: ${toStr}`,
    ccStr ? `Cc: ${ccStr}` : "",
    `Subject: ${params.subject}`,
    `Date: ${dateStr}`,
    `MIME-Version: 1.0`,
    `X-Unsent: 1`, // Signals Outlook to open as an editable draft
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    `Content-Type: text/plain; charset=UTF-8`,
    `Content-Transfer-Encoding: 8bit`,
    "",
    params.plainTextBody,
    "",
    `--${boundary}`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: 8bit`,
    "",
    params.htmlBody,
    "",
    `--${boundary}--`,
  ];

  const emlData = lines.filter((l) => l !== "").join("\r\n");
  const blob = new Blob([emlData], { type: "message/rfc822" });
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = downloadUrl;
  const safeName = params.fileName || `${params.subject.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 45)}.eml`;
  a.download = safeName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);
}

/**
 * Generates an Executive HTML Email body for Outlook rendering
 */
export function generateApprovalHtmlEmail(data: {
  rfqId: string;
  vendorName: string;
  vendorKey: string;
  totalPriceFormatted: string;
  leadTimeWeeks: number;
  warrantyYears: number;
  sla: string;
  score: number;
  signoffType: string;
  signees: Array<{ role: string; name: string; timestamp: string }>;
  decisionDrivers: string[];
  recommendationNarrative: string;
  appUrl?: string;
}): string {
  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const signeeRows = data.signees
    .map(
      (s) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px 14px; font-weight: bold; color: #1e293b; font-size: 13px;">${s.role}</td>
        <td style="padding: 10px 14px; color: #0284c7; font-weight: 600; font-size: 13px;">${s.name}</td>
        <td style="padding: 10px 14px; color: #16a34a; font-weight: bold; font-size: 12px;">PASSED & AUTHORIZED</td>
        <td style="padding: 10px 14px; color: #64748b; font-size: 11px; font-family: monospace;">${s.timestamp}</td>
      </tr>
    `
    )
    .join("");

  const driversList = data.decisionDrivers
    .map(
      (d) => `
      <li style="margin-bottom: 6px; color: #334155; font-size: 13px; line-height: 1.5;">
        <strong style="color: #0f172a;">${d}</strong>
      </li>
    `
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Procurement Award Sign-Off Notification</title>
</head>
<body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a;">
  <div style="max-width: 680px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    
    <!-- Header Banner -->
    <div style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); padding: 24px 28px; color: #ffffff;">
      <div style="font-size: 11px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: #bae6fd; margin-bottom: 6px;">
        Formal Procurement Governance & Award Authorization
      </div>
      <h1 style="margin: 0; font-size: 22px; font-weight: 800; line-height: 1.3; color: #ffffff;">
        Purchase Order Award Sign-Off: ${data.vendorName}
      </h1>
      <div style="margin-top: 8px; font-size: 12px; color: #e0f2fe; font-family: monospace;">
        RFQ Reference: <strong>${data.rfqId}</strong> | Date: <strong>${dateStr}</strong>
      </div>
    </div>

    <!-- Award Summary Box -->
    <div style="padding: 24px 28px;">
      <div style="background-color: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px;">
        <div style="font-size: 12px; font-weight: 700; color: #15803d; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">
          ✓ Approved for Binding Purchase Order Contract
        </div>
        <div style="font-size: 14px; color: #166534; line-height: 1.5;">
          This email confirms the formal procurement evaluation sign-off for <strong>${data.vendorName}</strong> regarding RFQ <strong>${data.rfqId}</strong>.
        </div>
      </div>

      <!-- Key Commercial Terms Grid -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
        <tr>
          <td style="padding: 14px 16px; border-bottom: 1px solid #e2e8f0; width: 50%;">
            <div style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600;">Awarded Vendor</div>
            <div style="font-size: 16px; font-weight: 800; color: #0f172a; margin-top: 2px;">${data.vendorName}</div>
          </td>
          <td style="padding: 14px 16px; border-bottom: 1px solid #e2e8f0; width: 50%;">
            <div style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600;">Approved Total Value</div>
            <div style="font-size: 18px; font-weight: 800; color: #0369a1; margin-top: 2px;">${data.totalPriceFormatted}</div>
          </td>
        </tr>
        <tr>
          <td style="padding: 14px 16px; border-bottom: 1px solid #e2e8f0;">
            <div style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600;">Committed Lead Time</div>
            <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 2px;">${data.leadTimeWeeks} Weeks</div>
          </td>
          <td style="padding: 14px 16px; border-bottom: 1px solid #e2e8f0;">
            <div style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600;">Warranty & Support SLA</div>
            <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 2px;">${data.warrantyYears} Years (${data.sla})</div>
          </td>
        </tr>
        <tr>
          <td style="padding: 14px 16px;" colspan="2">
            <div style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600;">Weighted Composite Score</div>
            <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 2px;">${data.score} / 100 Points</div>
          </td>
        </tr>
      </table>

      <!-- Executive Narrative -->
      <div style="margin-bottom: 24px;">
        <h3 style="font-size: 14px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 10px 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px;">
          Executive Recommendation Summary
        </h3>
        <p style="font-size: 13px; color: #334155; line-height: 1.6; background-color: #f8fafc; padding: 14px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 0;">
          ${data.recommendationNarrative}
        </p>
      </div>

      <!-- Decision Drivers -->
      ${
        data.decisionDrivers.length > 0
          ? `
      <div style="margin-bottom: 24px;">
        <h3 style="font-size: 14px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 10px 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px;">
          Key Decision Drivers
        </h3>
        <ul style="padding-left: 20px; margin: 0;">
          ${driversList}
        </ul>
      </div>
      `
          : ""
      }

      <!-- Governance Hierarchy Sign-Off Table -->
      <div style="margin-bottom: 24px;">
        <h3 style="font-size: 14px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 10px 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px;">
          Governance Sign-Off Audit Trail (${data.signoffType === "multi_tier" ? "3-Tier Sequential" : "Executive Sign-Off"})
        </h3>
        <table style="width: 100%; border-collapse: collapse; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background-color: #f1f5f9; text-align: left;">
              <th style="padding: 8px 14px; font-size: 11px; color: #475569; text-transform: uppercase;">Authority Role</th>
              <th style="padding: 8px 14px; font-size: 11px; color: #475569; text-transform: uppercase;">Signee Name</th>
              <th style="padding: 8px 14px; font-size: 11px; color: #475569; text-transform: uppercase;">Status</th>
              <th style="padding: 8px 14px; font-size: 11px; color: #475569; text-transform: uppercase;">Audit Timestamp</th>
            </tr>
          </thead>
          <tbody>
            ${signeeRows}
          </tbody>
        </table>
      </div>

      <!-- Action Note -->
      <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 14px 18px; font-size: 12px; color: #1e40af; line-height: 1.5;">
        <strong>Next Steps for Sourcing & Accounts Payable:</strong><br>
        Please issue formal Purchase Order referencing <strong>${data.rfqId}</strong> to <strong>${data.vendorName}</strong>. Attach this approval certificate to the ERP/SAP contract header.
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 28px; font-size: 11px; color: #64748b; text-align: center;">
      <div>Sent via <strong>Lantern Procurement Intelligence Engine</strong> • Microsoft Outlook Integration</div>
      <div style="margin-top: 4px;">Confidential & Proprietary • For Internal Procurement Governance Use Only</div>
    </div>
  </div>
</body>
</html>
`;
}

/**
 * Generates plaintext email body for mailto URI and plain Outlook previews
 */
export function generateApprovalPlainTextEmail(data: {
  rfqId: string;
  vendorName: string;
  totalPriceFormatted: string;
  leadTimeWeeks: number;
  warrantyYears: number;
  sla: string;
  score: number;
  signees: Array<{ role: string; name: string; timestamp: string }>;
  decisionDrivers: string[];
  recommendationNarrative: string;
}): string {
  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const signoffSummary = data.signees
    .map((s) => `  * ${s.role}: ${s.name} [APPROVED] at ${s.timestamp}`)
    .join("\n");

  const driversText = data.decisionDrivers.map((d, idx) => `  ${idx + 1}. ${d}`).join("\n");

  return `===================================================================
FORMAL PROCUREMENT AWARD APPROVAL & PO AUTHORIZATION
===================================================================
RFQ Reference: ${data.rfqId}
Date: ${dateStr}
Awarded Vendor: ${data.vendorName}
Approved Total Price: ${data.totalPriceFormatted}
Lead Time: ${data.leadTimeWeeks} Weeks
Warranty & SLA: ${data.warrantyYears} Years (${data.sla})
Weighted Evaluation Score: ${data.score} / 100 pts

-------------------------------------------------------------------
EXECUTIVE RECOMMENDATION SUMMARY
-------------------------------------------------------------------
${data.recommendationNarrative}

-------------------------------------------------------------------
KEY DECISION DRIVERS
-------------------------------------------------------------------
${driversText || "  * Technical compliance & optimal TCO"}

-------------------------------------------------------------------
GOVERNANCE SIGN-OFF AUDIT TRAIL
-------------------------------------------------------------------
${signoffSummary}

-------------------------------------------------------------------
NEXT STEPS FOR FINANCE & SOURCING
-------------------------------------------------------------------
Please execute the binding Purchase Order and initiate vendor onboarding.

--
Generated by Lantern Procurement Intelligence Engine
Outlook Mail Governance Gateway
`;
}
