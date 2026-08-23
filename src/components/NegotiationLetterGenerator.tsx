import React, { useState } from "react";
import {
  FileText,
  Copy,
  Check,
  Printer,
  Download,
  X,
  Sparkles,
  Sliders,
  Send,
  Building,
  Mail,
  ShieldCheck,
  DollarSign,
  Clock,
} from "lucide-react";
import { StructuredVendorData, VendorBinaryGateMap, CurrencyCode } from "../types";
import { VENDOR_NAMES } from "../data";
import { LanternLogo } from "./LanternLogo";

interface Props {
  vendorKey: string;
  data: StructuredVendorData;
  binaryGates: VendorBinaryGateMap;
  currency: CurrencyCode;
  formatCurrency: (priceUSD: number, targetCurrency: CurrencyCode) => string;
  onClose: () => void;
}

type LetterTemplate = "bafo_counter" | "failover_clarification" | "saudi_commercial";

export function NegotiationLetterGenerator({
  vendorKey,
  data,
  binaryGates,
  currency,
  formatCurrency,
  onClose,
}: Props) {
  const [template, setTemplate] = useState<LetterTemplate>("bafo_counter");
  const [requestedDiscount, setRequestedDiscount] = useState<number>(8);
  const [targetLeadTime, setTargetLeadTime] = useState<number>(8);
  const [recipientName, setRecipientName] = useState<string>("Commercial Accounts Lead");
  const [copied, setCopied] = useState<boolean>(false);

  const vendorName = VENDOR_NAMES[vendorKey] || vendorKey;
  const v = data[vendorKey];
  const originalPrice = v?.priceUSD || 70000;
  const targetPrice = Math.round(originalPrice * (1 - requestedDiscount / 100));
  const isFailoverUnverified = !binaryGates[vendorKey]?.failoverVerified;

  // Generate Letter Text based on selected template
  const generateLetterBody = (): string => {
    const today = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    if (template === "failover_clarification") {
      return `LANTERN STRATEGIC PROCUREMENT & INFRASTRUCTURE GOVERNANCE
COMMERCIAL & TECHNICAL EVALUATION COMMITTEE
Date: ${today}
Reference: RFQ-2026-0803 / TECHNICAL CLARIFICATION NOTICE

To: ${vendorName} Commercial Sales & Engineering
Attention: ${recipientName}
Subject: Formal Technical Clarification – Mission-Critical Continuous-Availability Failover Certification

Dear ${recipientName},

Following our technical committee's preliminary audit of your quotation for the Command Center Server Infrastructure pair, we are issuing this formal Technical Clarification Notice regarding your proposed redundancy architecture.

CURRENT EVALUATION STATUS:
1. Equipment Proposed: ${v?.specsSummary || "Twin-Node Server Configuration"}
2. Quoted Price: ${formatCurrency(originalPrice, currency)}
3. Redundancy Gate: MANDATORY BINARY REQUIREMENT (Continuous-Availability Zero-Downtime Clustering)

OBSERVATION & AUDIT REQUIREMENT:
Our RFP specification explicitly mandates factory pre-certified active/standby automated failover. Your submission indicates either an uncertified third-party driver approach or workaround engineering days, which currently fails our mandatory Go/No-Go binary gate.

ACTION REQUIRED WITHIN 5 BUSINESS DAYS:
Please provide formal written confirmation and official manufacturer engineering documentation validating:
- Compliance with continuous-availability zero-data-loss failover without manual administrative intervention.
- Clarification whether factory pre-certification is included in the base bid or can be upgraded at no additional cost.
- Detailed support response times (confirming 24/7 on-site SLA commitments).

Failure to provide certified failover documentation will result in formal gate disqualification from contract award.

Sincerely,

Senior Procurement Specialist & Technical Evaluation Board
Lantern Procurement Intelligence & Governance Division`;
    }

    if (template === "saudi_commercial") {
      return `LANTERN STRATEGIC PROCUREMENT & ENTERPRISE ASSETS
KSA REGIONAL INFRASTRUCTURE COMMITTEE
Date: ${today}
Reference: RFQ-2026-0803 / KSA LOCAL CONTENT & COMMERCIAL NOTICE

To: ${vendorName} Saudi Arabia Operations
Attention: ${recipientName}
Subject: Commercial Counter-Offer & In-Kingdom Total Value Add (IKTVA/LCGPA) Alignment

Dear ${recipientName},

We appreciate ${vendorName}'s participation in RFQ-2026-0803 for our critical infrastructure program. We have evaluated your commercial offer and wish to engage in Best and Final Offer (BAFO) negotiations.

COMMERCIAL COUNTER-OFFER:
- Current Quoted Base Price: ${formatCurrency(originalPrice, currency)}
- Counter-Offer Target Price: ${formatCurrency(targetPrice, currency)} (reflecting a ${requestedDiscount}% commercial adjustment)
- Delivery Schedule Target: ${targetLeadTime} weeks ex-works/DDP Riyadh
- Warranty & Support: 5 Years 24/7 on-site parts and engineering response

MANDATORY REGULATORY & LOCAL CONTENT REQUIREMENTS:
To finalize the award contract, please certify the following:
1. LCGPA / IKTVA Local Content Score: Minimum 35% local manufacturing or engineering contribution.
2. HCIS Security Directives: Compliance with High Commission for Industrial Security standards.
3. SASO / CST Homologation: Certified regulatory approval for all power and network hardware.

Please confirm acceptance of this counter-offer structure and submit your formal revised BAFO document by the end of this week.

Sincerely,

Director of Strategic Sourcing & Local Content Development
Lantern Strategic Asset Management`;
    }

    // Default: BAFO Counter Offer
    return `LANTERN STRATEGIC PROCUREMENT & ASSET MANAGEMENT
GLOBAL STRATEGIC SOURCING DEPARTMENT
Date: ${today}
Reference: RFQ-2026-0803 / BAFO COUNTER-OFFER REQUEST

To: ${vendorName} Corporate Accounts
Attention: ${recipientName}
Subject: Best and Final Offer (BAFO) Invitation & Commercial Counter-Offer

Dear ${recipientName},

Thank you for your quotation in response to RFQ-2026-0803 for our Mission-Critical Command Center Server Infrastructure.

Following comprehensive total cost of ownership (TCO) modeling, ${vendorName} remains in active contention for final contract award, subject to resolving the key commercial and operational items below:

1. COMMERCIAL ADJUSTMENT:
   - Initial Quoted Amount: ${formatCurrency(originalPrice, currency)}
   - Strategic Counter-Offer: ${formatCurrency(targetPrice, currency)} (Targeting a ${requestedDiscount}% discount)

2. DELIVERY SCHEDULE COMMITMENT:
   - Initial Quoted Lead Time: ${v?.leadTimeWeeks || 10} weeks
   - Required Milestone Lead Time: ${targetLeadTime} weeks maximum

3. WARRANTY & SLA ASSURANCE:
   - Minimum 4–5 Year Advance Hardware Replacement warranty.
   - 24/7 mission-critical emergency support with 4-hour on-site response.
   ${isFailoverUnverified ? "- Factory pre-certification for continuous-availability failover clustering." : ""}

We invite ${vendorName} to submit your formal Best and Final Offer (BAFO) incorporating these terms. Confirmation of these parameters will enable our executive sign-off committee to proceed directly with purchase order execution.

Sincerely,

Lead Sourcing Executive & Procurement Committee
Lantern Enterprise Procurement`;
  };

  const letterText = generateLetterBody();

  const handleCopy = () => {
    navigator.clipboard.writeText(letterText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Procurement Letter - ${vendorName}</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #111; line-height: 1.6; }
              pre { white-space: pre-wrap; font-family: inherit; font-size: 14px; }
            </style>
          </head>
          <body>
            <pre>${letterText}</pre>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-white/20 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-zinc-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="font-sans font-bold text-white text-lg">
                Official Negotiation & Clarification Letter Generator
              </h3>
              <p className="text-xs text-zinc-400 font-mono">
                Target Vendor: <strong className="text-cyan-300">{vendorName}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="grid md:grid-cols-12 gap-6 p-6 overflow-y-auto">
          {/* Controls Column */}
          <div className="md:col-span-5 space-y-4">
            {/* Template Selector */}
            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-zinc-300 font-semibold block mb-2">
                Letter Type / Intent
              </label>
              <div className="space-y-2">
                <button
                  onClick={() => setTemplate("bafo_counter")}
                  className={`w-full p-3 rounded-xl text-left text-xs font-sans border transition-all cursor-pointer ${
                    template === "bafo_counter"
                      ? "bg-cyan-950/70 border-cyan-500 text-white font-semibold shadow-md shadow-cyan-900/30"
                      : "bg-zinc-900/60 border-white/5 text-zinc-300 hover:bg-zinc-800"
                  }`}
                >
                  <span className="block font-bold text-cyan-300">1. Commercial BAFO Counter-Offer</span>
                  <span className="text-[11px] text-zinc-400">
                    Propose specific price target and lead time commitment.
                  </span>
                </button>

                <button
                  onClick={() => setTemplate("failover_clarification")}
                  className={`w-full p-3 rounded-xl text-left text-xs font-sans border transition-all cursor-pointer ${
                    template === "failover_clarification"
                      ? "bg-cyan-950/70 border-cyan-500 text-white font-semibold shadow-md shadow-cyan-900/30"
                      : "bg-zinc-900/60 border-white/5 text-zinc-300 hover:bg-zinc-800"
                  }`}
                >
                  <span className="block font-bold text-amber-300">2. Failover Verification Demand</span>
                  <span className="text-[11px] text-zinc-400">
                    Strict clarification for uncertified redundancy or workaround drivers.
                  </span>
                </button>

                <button
                  onClick={() => setTemplate("saudi_commercial")}
                  className={`w-full p-3 rounded-xl text-left text-xs font-sans border transition-all cursor-pointer ${
                    template === "saudi_commercial"
                      ? "bg-cyan-950/70 border-cyan-500 text-white font-semibold shadow-md shadow-cyan-900/30"
                      : "bg-zinc-900/60 border-white/5 text-zinc-300 hover:bg-zinc-800"
                  }`}
                >
                  <span className="block font-bold text-emerald-300">3. KSA IKTVA / LCGPA Local Content</span>
                  <span className="text-[11px] text-zinc-400">
                    Negotiate local content score, HCIS standards, and SASO compliance.
                  </span>
                </button>
              </div>
            </div>

            {/* Customization Parameters */}
            {template === "bafo_counter" && (
              <div className="p-4 rounded-xl bg-zinc-900/80 border border-white/10 space-y-3">
                <span className="text-xs font-mono uppercase tracking-wider text-zinc-300 font-semibold block">
                  Negotiation Parameters
                </span>
                <div>
                  <div className="flex justify-between text-xs font-mono text-zinc-400 mb-1">
                    <span>Discount Target</span>
                    <strong className="text-cyan-300">{requestedDiscount}% ({formatCurrency(targetPrice, currency)})</strong>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="20"
                    step="1"
                    value={requestedDiscount}
                    onChange={(e) => setRequestedDiscount(Number(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono text-zinc-400 mb-1">
                    <span>Delivery Target</span>
                    <strong className="text-cyan-300">{targetLeadTime} Weeks</strong>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="12"
                    step="1"
                    value={targetLeadTime}
                    onChange={(e) => setTargetLeadTime(Number(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Letter Preview Column */}
          <div className="md:col-span-7 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                Official Letter Preview
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-mono text-zinc-200 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  <span>{copied ? "Copied!" : "Copy Text"}</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-mono text-zinc-200 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Printer size={13} />
                  <span>Print</span>
                </button>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-zinc-950 border border-white/10 flex-1 overflow-y-auto font-mono text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed shadow-inner">
              {letterText}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
