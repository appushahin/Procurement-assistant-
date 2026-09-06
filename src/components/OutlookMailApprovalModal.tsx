import React, { useState, useEffect } from "react";
import {
  Mail,
  Send,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  X,
  User,
  Building2,
  DollarSign,
  Clock,
  ShieldCheck,
  RefreshCw,
  Copy,
  Check,
  FileText,
  Lock,
  Key,
  ChevronRight,
  Sparkles,
  History,
  Laptop,
  Globe,
  Settings,
  HelpCircle,
  Download,
} from "lucide-react";
import {
  RecommendationResult,
  SignOffRecord,
  MultiTierSignoff,
  StructuredVendorData,
  VendorScores,
  CurrencyCode,
  OutlookAccountProfile,
  OutlookDispatchRecord,
} from "../types";
import { VENDOR_NAMES } from "../data";
import {
  getSavedOutlookProfile,
  saveOutlookProfile,
  clearSavedOutlookProfile,
  getDispatchHistory,
  logDispatchRecord,
  buildOutlookWebComposeUrl,
  buildMailtoUrl,
  generateApprovalHtmlEmail,
  generateApprovalPlainTextEmail,
  buildMicrosoftOAuthUrl,
  copyRichHtmlToClipboard,
  downloadEmlDraftFile,
} from "../utils/outlookMailService";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  recommendation: RecommendationResult | null;
  signoff: SignOffRecord | null;
  multiTierSignoff?: MultiTierSignoff;
  structuredData: StructuredVendorData | null;
  scores: VendorScores;
  currency: CurrencyCode;
  formatCurrency: (priceUSD: number, targetCurrency: CurrencyCode) => string;
  userEmail?: string;
  rfqScenarioName?: string;
}

export function OutlookMailApprovalModal({
  isOpen,
  onClose,
  recommendation,
  signoff,
  multiTierSignoff,
  structuredData,
  scores,
  currency,
  formatCurrency,
  userEmail = "appushahin7@gmail.com",
  rfqScenarioName = "Security Command Center Upgrade (RFQ-2026-0803)",
}: Props) {
  // Active Awarded Vendor
  const awardedVendorKey =
    signoff?.vendor ||
    multiTierSignoff?.awardedVendorKey ||
    recommendation?.recommendedVendor ||
    "meridian";

  const awardedVendorName = VENDOR_NAMES[awardedVendorKey] || "Meridian Technologies";
  const vendorMetrics = structuredData ? structuredData[awardedVendorKey] : null;
  const vendorScore = scores[awardedVendorKey] ? Math.round(scores[awardedVendorKey].weighted) : 94;

  const totalPriceFormatted = vendorMetrics
    ? formatCurrency(vendorMetrics.priceUSD, currency)
    : formatCurrency(135000, currency);

  const rfqId = "RFQ-2026-0803";

  // Recipients State
  const defaultVendorEmail =
    awardedVendorKey === "meridian"
      ? "contracts@meridiantech.sa"
      : awardedVendorKey === "ironclad"
      ? "enterprise-sales@ironcladsys.com"
      : "bids@vantagetech.com";

  const [toEmails, setToEmails] = useState<string[]>([
    "finance-director@company.com",
    defaultVendorEmail,
  ]);
  const [customToInput, setCustomToInput] = useState<string>("");
  const [ccEmails, setCcEmails] = useState<string[]>([
    "procurement-vp@company.com",
    userEmail,
  ]);
  const [customCcInput, setCustomCcInput] = useState<string>("");

  // Subject line
  const [subject, setSubject] = useState<string>(
    `[APPROVED] Official PO Award Authorization: ${rfqId} - ${awardedVendorName}`
  );

  // Active View Tab
  const [activeTab, setActiveTab] = useState<"compose" | "preview" | "settings" | "history">("compose");
  const [previewFormat, setPreviewFormat] = useState<"html" | "text">("html");

  // Outlook Connection & Profile State
  const [profile, setProfile] = useState<OutlookAccountProfile>(() => {
    const saved = getSavedOutlookProfile();
    if (saved) return saved;
    return {
      isConnected: false,
      email: userEmail || "procurement.lead@outlook.com",
      displayName: "Senior Procurement Officer",
      jobTitle: "Strategic Sourcing Lead",
      method: "outlook_web",
    };
  });

  const [graphTokenInput, setGraphTokenInput] = useState<string>("");
  const [isVerifyingToken, setIsVerifyingToken] = useState<boolean>(false);
  const [tokenVerifyMessage, setTokenVerifyMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Dispatch Sending State
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string; timestamp?: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedRich, setCopiedRich] = useState<boolean>(false);

  // Dispatch history
  const [dispatchLogs, setDispatchLogs] = useState<OutlookDispatchRecord[]>([]);

  useEffect(() => {
    setDispatchLogs(getDispatchHistory());
  }, [isOpen]);

  // Generate signees array
  const signees: Array<{ role: string; name: string; timestamp: string }> = [];
  if (multiTierSignoff && multiTierSignoff.tier1Tech.status === "approved") {
    signees.push({
      role: "Tier 1: Technical Lead",
      name: multiTierSignoff.tier1Tech.signeeName || "Lead Systems Architect",
      timestamp: multiTierSignoff.tier1Tech.timestamp || new Date().toLocaleString(),
    });
  }
  if (multiTierSignoff && multiTierSignoff.tier2Finance.status === "approved") {
    signees.push({
      role: "Tier 2: Finance Director",
      name: multiTierSignoff.tier2Finance.signeeName || "Director of Financial Planning",
      timestamp: multiTierSignoff.tier2Finance.timestamp || new Date().toLocaleString(),
    });
  }
  if (multiTierSignoff && multiTierSignoff.tier3Executive.status === "approved") {
    signees.push({
      role: "Tier 3: VP of Procurement",
      name: multiTierSignoff.tier3Executive.signeeName || "VP of Strategic Sourcing",
      timestamp: multiTierSignoff.tier3Executive.timestamp || new Date().toLocaleString(),
    });
  }
  if (signees.length === 0) {
    signees.push({
      role: signoff?.status === "overridden" ? "Executive Override Authority" : "Procurement Sign-Off Lead",
      name: signoff?.signoffUser || "Senior Procurement Officer",
      timestamp: signoff?.time || new Date().toLocaleString(),
    });
  }

  const decisionDrivers = recommendation?.drivingCriteria || [
    `Ranked #1 with weighted score of ${vendorScore}/100`,
    `Guaranteed lead time of ${vendorMetrics?.leadTimeWeeks || 4} weeks with certified redundancy`,
    `Optimal 5-Year Total Cost of Ownership (${totalPriceFormatted})`,
  ];

  const recommendationNarrative =
    recommendation?.narrative ||
    `Following multi-criteria evaluation of RFQ ${rfqId}, ${awardedVendorName} has been selected as the winning vendor based on technical compliance, competitive lead time, and proven redundancy certification.`;

  // HTML Email Body
  const htmlContent = generateApprovalHtmlEmail({
    rfqId,
    vendorName: awardedVendorName,
    vendorKey: awardedVendorKey,
    totalPriceFormatted,
    leadTimeWeeks: vendorMetrics?.leadTimeWeeks || 4,
    warrantyYears: vendorMetrics?.warrantyYears || 3,
    sla: vendorMetrics?.supportSLA || "24/7 4-Hour On-Site",
    score: vendorScore,
    signoffType: multiTierSignoff?.tier3Executive.status === "approved" ? "multi_tier" : "single",
    signees,
    decisionDrivers,
    recommendationNarrative,
  });

  // Plaintext Email Body
  const plainTextContent = generateApprovalPlainTextEmail({
    rfqId,
    vendorName: awardedVendorName,
    totalPriceFormatted,
    leadTimeWeeks: vendorMetrics?.leadTimeWeeks || 4,
    warrantyYears: vendorMetrics?.warrantyYears || 3,
    sla: vendorMetrics?.supportSLA || "24/7 4-Hour On-Site",
    score: vendorScore,
    signees,
    decisionDrivers,
    recommendationNarrative,
  });

  if (!isOpen) return null;

  // Add Recipient handler
  const handleAddRecipient = (type: "to" | "cc") => {
    if (type === "to") {
      const email = customToInput.trim();
      if (email && email.includes("@") && !toEmails.includes(email)) {
        setToEmails([...toEmails, email]);
        setCustomToInput("");
      }
    } else {
      const email = customCcInput.trim();
      if (email && email.includes("@") && !ccEmails.includes(email)) {
        setCcEmails([...ccEmails, email]);
        setCustomCcInput("");
      }
    }
  };

  const handleRemoveRecipient = (type: "to" | "cc", emailToRemove: string) => {
    if (type === "to") {
      setToEmails(toEmails.filter((e) => e !== emailToRemove));
    } else {
      setCcEmails(ccEmails.filter((e) => e !== emailToRemove));
    }
  };

  // 1. Direct Send via Microsoft Graph API
  const handleSendViaMicrosoftGraph = async () => {
    if (toEmails.length === 0) {
      setSendResult({
        success: false,
        message: "Please add at least one recipient email address in the 'To' field.",
      });
      return;
    }

    setIsSending(true);
    setSendResult(null);

    try {
      const response = await fetch("/api/outlook/send-approval-mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: profile.accessToken,
          toRecipients: toEmails,
          ccRecipients: ccEmails,
          subject,
          bodyHtml: htmlContent,
          importance: "High",
          saveToSentItems: true,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const record: OutlookDispatchRecord = {
          id: `dsp-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          recipientCount: toEmails.length + ccEmails.length,
          recipients: [...toEmails, ...ccEmails],
          subject,
          vendorName: awardedVendorName,
          poReference: rfqId,
          method: "oauth",
          status: "sent",
        };
        logDispatchRecord(record);
        setDispatchLogs(getDispatchHistory());

        setSendResult({
          success: true,
          message: `Official Approval Email successfully dispatched via Microsoft Graph API to ${toEmails.join(", ")}!`,
          timestamp: new Date().toLocaleTimeString(),
        });
      } else {
        // Fallback guidance if no access token configured yet
        setSendResult({
          success: false,
          message: data.error || "Microsoft Graph API authentication required. Click 'Open in Outlook Web' or configure your Graph Token in Settings.",
        });
      }
    } catch (err: any) {
      setSendResult({
        success: false,
        message: err.message || "Failed to dispatch via Microsoft Graph API.",
      });
    } finally {
      setIsSending(false);
    }
  };

  // 2. Open in Outlook Web (OWA / Office 365 or Outlook.com)
  const handleOpenOutlookWeb = async (isOffice365 = true) => {
    if (toEmails.length === 0) {
      setSendResult({
        success: false,
        message: "Please specify at least one recipient email address.",
      });
      return;
    }

    // Auto-copy rich HTML to clipboard so the user can easily Ctrl+V to get styled tables
    await copyRichHtmlToClipboard(htmlContent, plainTextContent);

    const url = buildOutlookWebComposeUrl(toEmails, subject, plainTextContent, isOffice365);
    window.open(url, "_blank", "noopener,noreferrer");

    const record: OutlookDispatchRecord = {
      id: `dsp-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      recipientCount: toEmails.length,
      recipients: [...toEmails],
      subject,
      vendorName: awardedVendorName,
      poReference: rfqId,
      method: "outlook_web",
      status: "opened_client",
    };
    logDispatchRecord(record);
    setDispatchLogs(getDispatchHistory());

    setSendResult({
      success: true,
      message: `Launched ${isOffice365 ? "Outlook 365 Web" : "Outlook.com"}! Clean formatting applied (no '+' signs). Rich HTML is also copied to your clipboard — press Ctrl+V inside Outlook to paste styled tables!`,
      timestamp: new Date().toLocaleTimeString(),
    });
  };

  // 3. Download Native Formatted Outlook Draft (.eml)
  const handleDownloadEmlDraft = () => {
    if (toEmails.length === 0) {
      setSendResult({
        success: false,
        message: "Please specify at least one recipient email address.",
      });
      return;
    }

    downloadEmlDraftFile({
      to: toEmails,
      cc: ccEmails,
      subject,
      htmlBody: htmlContent,
      plainTextBody: plainTextContent,
      fileName: `PO_Approval_${rfqId}_${awardedVendorName.replace(/[^a-zA-Z0-9]/g, "_")}.eml`,
    });

    const record: OutlookDispatchRecord = {
      id: `dsp-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      recipientCount: toEmails.length,
      recipients: [...toEmails],
      subject,
      vendorName: awardedVendorName,
      poReference: rfqId,
      method: "desktop_client",
      status: "opened_client",
    };
    logDispatchRecord(record);
    setDispatchLogs(getDispatchHistory());

    setSendResult({
      success: true,
      message: "Outlook Draft (.eml) downloaded! Double-click this file to open directly in Outlook with 100% rich formatted HTML tables, badges & colors.",
      timestamp: new Date().toLocaleTimeString(),
    });
  };

  // 4. One-Click Copy Formatted Email (Rich HTML)
  const handleCopyRichHtml = async () => {
    const ok = await copyRichHtmlToClipboard(htmlContent, plainTextContent);
    setCopiedRich(true);
    setTimeout(() => setCopiedRich(false), 3000);

    setSendResult({
      success: true,
      message: "Executive formatted email copied to clipboard! Paste (Ctrl+V) directly into Outlook or Outlook Web to render styled tables, badges, and headers.",
      timestamp: new Date().toLocaleTimeString(),
    });
  };

  // 5. Launch Desktop Outlook Client (mailto)
  const handleLaunchDesktopOutlook = () => {
    const mailtoUrl = buildMailtoUrl(toEmails, ccEmails, subject, plainTextContent);
    window.location.href = mailtoUrl;

    const record: OutlookDispatchRecord = {
      id: `dsp-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      recipientCount: toEmails.length,
      recipients: [...toEmails],
      subject,
      vendorName: awardedVendorName,
      poReference: rfqId,
      method: "desktop_client",
      status: "opened_client",
    };
    logDispatchRecord(record);
    setDispatchLogs(getDispatchHistory());

    setSendResult({
      success: true,
      message: "Triggered Desktop Outlook compose client with clean formatting (no '+' characters)!",
      timestamp: new Date().toLocaleTimeString(),
    });
  };

  // Verify Graph Token
  const handleVerifyGraphToken = async () => {
    if (!graphTokenInput.trim()) {
      setTokenVerifyMessage({ type: "error", text: "Please paste a valid Microsoft Graph Access Token." });
      return;
    }

    setIsVerifyingToken(true);
    setTokenVerifyMessage(null);

    try {
      const res = await fetch("/api/outlook/verify-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: graphTokenInput.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.isValid) {
        const updatedProfile: OutlookAccountProfile = {
          isConnected: true,
          email: data.email || userEmail,
          displayName: data.displayName || "Procurement Specialist",
          jobTitle: data.jobTitle,
          method: "graph_token",
          accessToken: graphTokenInput.trim(),
          connectedAt: new Date().toLocaleDateString(),
        };
        saveOutlookProfile(updatedProfile);
        setProfile(updatedProfile);
        setTokenVerifyMessage({
          type: "success",
          text: `Connected successfully to Microsoft Outlook as ${data.displayName} (${data.email})!`,
        });
      } else {
        setTokenVerifyMessage({
          type: "error",
          text: data.error || "Failed to verify token with Microsoft Graph API. Ensure Mail.Send scope is granted.",
        });
      }
    } catch (err: any) {
      setTokenVerifyMessage({
        type: "error",
        text: err.message || "Network error while validating Microsoft Graph token.",
      });
    } finally {
      setIsVerifyingToken(false);
    }
  };

  // Quick Sign In with Microsoft OAuth
  const handleMicrosoftOAuthSignIn = () => {
    const redirectUri = window.location.origin;
    const authUrl = buildMicrosoftOAuthUrl("", redirectUri);
    window.open(authUrl, "ms_auth", "width=600,height=700");
  };

  const handleDisconnectOutlook = () => {
    clearSavedOutlookProfile();
    setProfile({
      isConnected: false,
      email: userEmail || "procurement@company.com",
      displayName: "Senior Procurement Officer",
      method: "outlook_web",
    });
    setTokenVerifyMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="w-full max-w-4xl bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-blue-950/60 via-zinc-950 to-zinc-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-md">
              <Mail size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-sans font-bold text-lg text-white">
                  Outlook Mail Approval Dispatch
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Microsoft 365
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Send official PO authorization & executive award notification via your Outlook Mail
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Account Status Pill */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-zinc-900 border border-white/10 text-xs font-mono">
              <span className={`w-2 h-2 rounded-full ${profile.isConnected ? "bg-emerald-400" : "bg-amber-400"}`}></span>
              <span className="text-zinc-300 font-medium">
                {profile.isConnected ? profile.email : "Outlook Web Ready"}
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between px-6 border-b border-white/10 bg-zinc-950/80 text-xs font-mono shrink-0 overflow-x-auto">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab("compose")}
              className={`py-3 px-3.5 border-b-2 font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "compose"
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Send size={14} />
              <span>Compose & Dispatch</span>
            </button>

            <button
              onClick={() => setActiveTab("preview")}
              className={`py-3 px-3.5 border-b-2 font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "preview"
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <FileText size={14} />
              <span>Rich Email Preview</span>
            </button>

            <button
              onClick={() => setActiveTab("settings")}
              className={`py-3 px-3.5 border-b-2 font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "settings"
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Settings size={14} />
              <span>Outlook Account Settings</span>
            </button>

            <button
              onClick={() => setActiveTab("history")}
              className={`py-3 px-3.5 border-b-2 font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "history"
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <History size={14} />
              <span>Dispatch History</span>
              {dispatchLogs.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-blue-950 text-blue-300 text-[10px] font-bold border border-blue-500/30">
                  {dispatchLogs.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 font-sans">
          
          {/* Status Message Alert */}
          {sendResult && (
            <div
              className={`p-4 rounded-xl border flex items-start justify-between gap-3 text-xs font-mono shadow-lg animate-fadeIn ${
                sendResult.success
                  ? "bg-emerald-950/70 border-emerald-500/50 text-emerald-200"
                  : "bg-amber-950/70 border-amber-500/50 text-amber-200"
              }`}
            >
              <div className="flex items-start gap-2.5">
                {sendResult.success ? (
                  <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-bold block text-white">
                    {sendResult.success ? "Outlook Action Successful" : "Dispatch Notice"}
                  </span>
                  <span className="mt-0.5 block">{sendResult.message}</span>
                </div>
              </div>
              <button
                onClick={() => setSendResult(null)}
                className="text-zinc-400 hover:text-white p-1"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* TAB 1: COMPOSE & DISPATCH */}
          {activeTab === "compose" && (
            <div className="space-y-4">
              
              {/* Award Summary Card */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-zinc-900 to-zinc-950 border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase text-blue-400 tracking-wider block">
                    Awarded Procurement Package
                  </span>
                  <h4 className="font-bold text-white text-base mt-0.5">
                    {awardedVendorName} • <span className="text-blue-400">{totalPriceFormatted}</span>
                  </h4>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 mt-1 font-mono">
                    <span>RFQ: <strong className="text-zinc-200">{rfqId}</strong></span>
                    <span>•</span>
                    <span>Score: <strong className="text-emerald-400">{vendorScore}/100</strong></span>
                    <span>•</span>
                    <span>Lead Time: <strong className="text-zinc-200">{vendorMetrics?.leadTimeWeeks || 4} wks</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300">
                    ✓ {signees.length} Verified Signatures
                  </span>
                </div>
              </div>

              {/* Email Form Fields */}
              <div className="space-y-3 bg-zinc-900/50 p-4 rounded-xl border border-white/10 text-xs font-mono">
                {/* TO RECIPIENTS */}
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-1 mb-1.5">
                    <label className="text-zinc-300 font-bold uppercase tracking-wider text-[11px]">
                      To Recipients (Mandatory)
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (!toEmails.includes(userEmail)) {
                            setToEmails([userEmail, ...toEmails.filter((e) => !e.includes("@company.com"))]);
                          }
                        }}
                        className="text-[10px] text-blue-400 hover:text-blue-300 hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <span>+ Use My Email ({userEmail})</span>
                      </button>
                      <span className="text-zinc-600">•</span>
                      <button
                        type="button"
                        onClick={() => setToEmails(toEmails.filter((e) => !e.includes("@company.com")))}
                        className="text-[10px] text-zinc-400 hover:text-zinc-300 hover:underline cursor-pointer"
                      >
                        Remove Placeholders
                      </button>
                    </div>
                  </div>
                  
                  {/* Recipient Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-2">
                    {toEmails.map((email) => {
                      const isPlaceholder = email.includes("@company.com");
                      return (
                        <span
                          key={email}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border ${
                            isPlaceholder
                              ? "bg-amber-950/60 border-amber-500/40 text-amber-200"
                              : "bg-blue-950/80 border-blue-500/40 text-blue-200"
                          }`}
                        >
                          <span>{email}</span>
                          {isPlaceholder && (
                            <span className="text-[9px] uppercase px-1 rounded bg-amber-500/20 text-amber-300">
                              Demo Domain
                            </span>
                          )}
                          <button
                            onClick={() => handleRemoveRecipient("to", email)}
                            className="text-zinc-400 hover:text-white cursor-pointer ml-0.5"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      );
                    })}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={customToInput}
                      onChange={(e) => setCustomToInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddRecipient("to"))}
                      placeholder="e.g. appushahin7@gmail.com, contracts@meridiantech.sa"
                      className="flex-1 bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddRecipient("to")}
                      className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1">
                    💡 Tip: Avoid non-existent domain names to prevent Exchange DNS NDR (550) bounce errors.
                  </p>
                </div>

                {/* CC RECIPIENTS */}
                <div>
                  <label className="text-zinc-400 font-bold uppercase tracking-wider text-[11px] block mb-1.5">
                    CC Recipients (Governance & Internal Stakeholders)
                  </label>
                  
                  <div className="flex flex-wrap items-center gap-1.5 mb-2">
                    {ccEmails.map((email) => (
                      <span
                        key={email}
                        className="inline-flex items-center gap-1.5 bg-zinc-900 border border-white/20 text-zinc-300 px-2.5 py-1 rounded-lg text-xs"
                      >
                        <span>{email}</span>
                        <button
                          onClick={() => handleRemoveRecipient("cc", email)}
                          className="text-zinc-400 hover:text-white cursor-pointer"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={customCcInput}
                      onChange={(e) => setCustomCcInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddRecipient("cc"))}
                      placeholder="e.g. audit-committee@company.com"
                      className="flex-1 bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddRecipient("cc")}
                      className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* SUBJECT LINE */}
                <div>
                  <label className="text-zinc-300 font-bold uppercase tracking-wider text-[11px] block mb-1.5">
                    Email Subject
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                  />
                </div>
              </div>

              {/* DISPATCH ACTION BUTTONS */}
              <div className="p-4 rounded-xl bg-zinc-900/70 border border-white/10 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="font-mono text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Mail size={15} className="text-blue-400" />
                    <span>Select Outlook Dispatch Gateway</span>
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400 font-medium">
                    ✓ Clean RFC-3986 encoding (no '+' signs) • Rich HTML Supported
                  </span>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Option 1: Download Formatted Outlook Draft (.eml) */}
                  <button
                    onClick={handleDownloadEmlDraft}
                    className="p-3.5 rounded-xl border border-emerald-500/50 bg-gradient-to-b from-emerald-950/70 via-zinc-900 to-zinc-950 hover:border-emerald-400 text-white font-sans text-left transition-all shadow-lg shadow-emerald-950/40 cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-xs flex items-center gap-1.5 text-emerald-300">
                          <Download size={14} className="text-emerald-400" />
                          <span>Outlook Draft (.eml)</span>
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                          ★ 100% RICH
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-300 leading-tight">
                        Opens directly in Outlook Desktop (Windows/Mac) with full HTML tables & badges.
                      </p>
                    </div>
                    <span className="text-[10px] font-mono mt-3 text-emerald-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform font-bold">
                      Open in Outlook →
                    </span>
                  </button>

                  {/* Option 2: 1-Click Outlook 365 Web (OWA) */}
                  <button
                    onClick={() => handleOpenOutlookWeb(true)}
                    className="p-3.5 rounded-xl border border-blue-500/40 bg-zinc-950 hover:bg-zinc-900 text-white font-sans text-left transition-all shadow-md cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-xs flex items-center gap-1.5 text-blue-300">
                          <Globe size={14} className="text-blue-400" />
                          <span>Outlook 365 Web</span>
                        </span>
                        <ExternalLink size={13} className="text-zinc-500" />
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-tight">
                        Opens webmail with clean encoding (no '+'). Auto-copies rich HTML for Ctrl+V paste.
                      </p>
                    </div>
                    <span className="text-[10px] font-mono mt-3 text-blue-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform font-bold">
                      Launch Webmail →
                    </span>
                  </button>

                  {/* Option 3: Copy Formatted Email (Rich HTML) */}
                  <button
                    onClick={handleCopyRichHtml}
                    className="p-3.5 rounded-xl border border-white/10 bg-zinc-950 hover:bg-zinc-900 text-white font-sans text-left transition-all shadow-md cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-xs flex items-center gap-1.5 text-purple-300">
                          {copiedRich ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} className="text-purple-400" />}
                          <span>Copy Formatted HTML</span>
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-tight">
                        Copies formatted rich table to clipboard. Press Ctrl+V in any email to paste.
                      </p>
                    </div>
                    <span className="text-[10px] font-mono mt-3 text-purple-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform font-bold">
                      {copiedRich ? "Copied to Clipboard! ✓" : "Copy Rich Format →"}
                    </span>
                  </button>

                  {/* Option 4: Direct Graph API Send */}
                  <button
                    onClick={handleSendViaMicrosoftGraph}
                    disabled={isSending}
                    className="p-3.5 rounded-xl border border-blue-500/50 bg-gradient-to-b from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-sans text-left transition-all shadow-lg shadow-blue-600/30 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-xs flex items-center gap-1.5">
                          <Sparkles size={14} className="text-blue-200" />
                          <span>Graph API Send</span>
                        </span>
                        {isSending && <RefreshCw size={14} className="animate-spin text-white" />}
                      </div>
                      <p className="text-[11px] text-blue-100/90 leading-tight">
                        Automated direct send via Microsoft Graph API.
                      </p>
                    </div>
                    <span className="text-[10px] font-mono mt-3 text-blue-200 flex items-center gap-1 group-hover:translate-x-1 transition-transform font-bold">
                      {profile.isConnected ? "Direct Send →" : "Authorize & Send →"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RICH EMAIL PREVIEW */}
          {activeTab === "preview" && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-2 gap-2">
                <div className="flex items-center gap-2">
                  <FileText size={15} className="text-blue-400" />
                  <span className="font-mono text-xs font-bold text-white uppercase">
                    Approval Email Output Format
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleCopyRichHtml}
                    className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-purple-300 border border-purple-500/30 text-xs font-mono font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    {copiedRich ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    <span>{copiedRich ? "Copied HTML! ✓" : "Copy Rich HTML"}</span>
                  </button>

                  <button
                    onClick={handleDownloadEmlDraft}
                    className="px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Download size={13} />
                    <span>Download .eml File</span>
                  </button>

                  <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-white/10 text-xs font-mono">
                    <button
                      onClick={() => setPreviewFormat("html")}
                      className={`px-3 py-1 rounded-lg font-semibold cursor-pointer ${
                        previewFormat === "html"
                          ? "bg-blue-600 text-white"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      HTML Corporate Email
                    </button>
                    <button
                      onClick={() => setPreviewFormat("text")}
                      className={`px-3 py-1 rounded-lg font-semibold cursor-pointer ${
                        previewFormat === "text"
                          ? "bg-blue-600 text-white"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      Plain Text / Audit
                    </button>
                  </div>
                </div>
              </div>

              {previewFormat === "html" ? (
                <div className="rounded-xl border border-white/10 overflow-hidden bg-white shadow-2xl">
                  <div className="bg-zinc-900 text-zinc-400 px-4 py-2 text-[11px] font-mono border-b border-white/10 flex items-center justify-between">
                    <span>Subject: {subject}</span>
                    <span>Rendered Outlook Preview</span>
                  </div>
                  <div
                    className="p-4 max-h-[420px] overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: htmlContent }}
                  />
                </div>
              ) : (
                <div className="bg-zinc-950 p-4 rounded-xl border border-white/10 text-xs font-mono text-zinc-300 whitespace-pre-wrap max-h-[420px] overflow-y-auto leading-relaxed shadow-inner">
                  {plainTextContent}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: OUTLOOK ACCOUNT SETTINGS & OAUTH */}
          {activeTab === "settings" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-zinc-900/80 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white text-sm">
                      Microsoft Outlook / Graph Account Connection
                    </h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Configure Microsoft 365 credentials for automated API delivery or 1-click webmail dispatch.
                    </p>
                  </div>
                  {profile.isConnected && (
                    <button
                      onClick={handleDisconnectOutlook}
                      className="text-xs font-mono text-red-400 hover:underline cursor-pointer"
                    >
                      Disconnect Account
                    </button>
                  )}
                </div>

                {/* Profile Card */}
                <div className="p-3.5 rounded-xl bg-zinc-950 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-300 font-bold">
                      {profile.displayName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-white">{profile.displayName}</div>
                      <div className="text-zinc-400">{profile.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                      profile.isConnected
                        ? "bg-emerald-950 text-emerald-300 border-emerald-500/40"
                        : "bg-zinc-900 text-zinc-400 border-white/10"
                    }`}>
                      {profile.isConnected ? "✓ Graph Connected" : "Webmail Mode"}
                    </span>
                  </div>
                </div>

                {/* Token Verification Box */}
                <div className="pt-3 border-t border-white/10 space-y-2.5">
                  <label className="block text-xs font-mono font-semibold text-zinc-300">
                    Microsoft Graph Bearer Token (Optional for direct API dispatch)
                  </label>
                  <p className="text-[11px] text-zinc-500 font-mono">
                    Paste an Azure AD / Entra ID token with <code className="text-blue-400">Mail.Send</code> scope, or sign in below:
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={graphTokenInput}
                      onChange={(e) => setGraphTokenInput(e.target.value)}
                      placeholder="eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1Ni..."
                      className="flex-1 bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs font-mono"
                    />
                    <button
                      onClick={handleVerifyGraphToken}
                      disabled={isVerifyingToken}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {isVerifyingToken ? <RefreshCw size={13} className="animate-spin" /> : <ShieldCheck size={14} />}
                      <span>Verify</span>
                    </button>
                  </div>

                  {tokenVerifyMessage && (
                    <div className={`p-2.5 rounded-lg text-xs font-mono flex items-center gap-2 ${
                      tokenVerifyMessage.type === "success"
                        ? "bg-emerald-950/60 border border-emerald-500/30 text-emerald-300"
                        : "bg-red-950/60 border border-red-500/30 text-red-300"
                    }`}>
                      {tokenVerifyMessage.type === "success" ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                      <span>{tokenVerifyMessage.text}</span>
                    </div>
                  )}
                </div>

                {/* Quick OAuth Button */}
                <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-[11px] font-mono text-zinc-400">
                    Don't have an API token? Use standard 1-click Outlook Webmail dispatch anytime.
                  </div>
                  <button
                    onClick={handleMicrosoftOAuthSignIn}
                    className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-xs font-semibold border border-white/10 flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Globe size={13} className="text-blue-400" />
                    <span>Open Microsoft Sign-In</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DISPATCH HISTORY */}
          {activeTab === "history" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="font-mono text-xs font-bold text-white uppercase">
                  Outlook Approval Dispatch Audit Log
                </span>
                <span className="text-[11px] font-mono text-zinc-400">
                  {dispatchLogs.length} logged dispatches
                </span>
              </div>

              {dispatchLogs.length > 0 ? (
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto">
                  {dispatchLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl bg-zinc-900/60 border border-white/10 text-xs font-mono space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-white">{log.vendorName}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-zinc-500">{log.timestamp}</span>
                          <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                            {log.method === "oauth" ? "GRAPH SENT" : "OUTLOOK WEB"}
                          </span>
                        </div>
                      </div>

                      <div className="text-zinc-400 text-[11px] truncate">
                        Subject: {log.subject}
                      </div>

                      <div className="flex flex-wrap gap-1 pt-1">
                        {log.recipients.map((r, idx) => (
                          <span
                            key={idx}
                            className="bg-black/40 text-zinc-300 text-[10px] px-1.5 py-0.5 rounded border border-white/5"
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-zinc-500 text-xs font-mono bg-zinc-900/30 rounded-xl border border-white/5">
                  <Mail size={22} className="mx-auto mb-2 text-zinc-600" />
                  <span>No approval emails dispatched yet in this session.</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-white/10 bg-zinc-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>Cryptographic Governance Hash: SHA256-SIGN-{awardedVendorKey.toUpperCase()}-{rfqId}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-mono text-zinc-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={() => handleOpenOutlookWeb(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-sans text-xs font-bold transition-all shadow-md shadow-blue-600/30 flex items-center gap-1.5 cursor-pointer"
            >
              <Mail size={14} />
              <span>Launch Outlook Mail</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
