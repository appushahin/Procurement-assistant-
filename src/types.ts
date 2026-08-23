export interface VendorRawQuotes {
  meridian: string;
  ironclad: string;
  vantage: string;
}

export interface VendorMetrics {
  priceUSD: number;
  leadTimeWeeks: number;
  warrantyYears: number;
  supportSLA: string;
  redundancyCertified: boolean;
  certifications: string[];
  specsSummary: string;
}

export type StructuredVendorData = Record<string, VendorMetrics>;

export interface DecisionWeights {
  price: number;
  leadTime: number;
  warranty: number;
  compliance: number;
}

export interface VendorScoreDetail {
  priceScore: number;
  leadScore: number;
  warrantyScore: number;
  complianceScore: number;
  weighted: number;
  isDisqualified?: boolean;
  disqualificationReasons?: string[];
}

export type VendorScores = Record<string, VendorScoreDetail>;

// Strict Binary Go / No-Go Gate Criteria
export interface VendorBinaryGates {
  failoverVerified: boolean; // Strict YES / NO for Mission-Critical Clustering / Failover
  complianceCertified: boolean; // Strict YES / NO for Mandatory Industry & Quality Standards
}

export type VendorBinaryGateMap = Record<string, VendorBinaryGates>;

// Total Cost of Ownership (TCO) 3-5 Year Lifecycle Breakdown
export interface VendorTcoMetrics {
  vendorKey: string;
  vendorName: string;
  initialCapex: number;
  integrationWorkaroundCost: number;
  annualSlaOpex: number;
  contingencyRiskCost: number; // High if failover is unverified / slow SLA
  totalYear1: number;
  total3Year: number;
  total5Year: number;
}

// "What-If" Sensitivity & Negotiation Simulator
export interface VendorNegotiationSim {
  priceDiscountPercent: number; // e.g. 0 to 25
  leadTimeExpediteWeeks: number; // e.g. 0 to 6
  warrantyExtensionYears: number; // e.g. 0 to 3
  failoverVerified: boolean;
  complianceCertified: boolean;
}

export type NegotiationSimMap = Record<string, VendorNegotiationSim>;

// Multi-Tier Sequential Approval Hierarchy
export interface ApprovalStep {
  role: "Technical Lead" | "Finance Director" | "VP of Procurement";
  title: string;
  status: "pending" | "approved";
  signeeName: string;
  timestamp: string | null;
  comments?: string;
}

export interface MultiTierSignoff {
  tier1Tech: ApprovalStep;
  tier2Finance: ApprovalStep;
  tier3Executive: ApprovalStep;
  awardedVendorKey: string;
  isOverridden: boolean;
  overrideRationale?: string;
}

// Project RFQ Scenarios
export interface RfqScenario {
  id: string;
  name: string;
  category: string;
  description: string;
  quotes: VendorRawQuotes;
  weights: DecisionWeights;
  initialGates: VendorBinaryGateMap;
}

export type UserRole = "Procurement Officer" | "Approver" | "Client Viewer";

export interface SourceExcerpt {
  fieldKey: keyof VendorMetrics | string;
  fieldLabel: string;
  extractedValue: string | number | boolean | string[];
  sourceExcerpt: string;
  confidence: number; // e.g. 95 for 95%
  verified: boolean;
}

export interface VendorSourceVerification {
  vendorKey: string;
  vendorName: string;
  excerpts: SourceExcerpt[];
}

export interface WeightAdjustmentLog {
  id: string;
  timestamp: string;
  userRole: UserRole;
  previousWeights: DecisionWeights;
  newWeights: DecisionWeights;
  topVendorBefore: string;
  topVendorAfter: string;
}

export interface StructuredReasoning {
  recommendedVendor: string;
  recommendationTitle: string;
  drivingCriteria: string[];
  excludedVendors: Array<{
    vendorKey: string;
    vendorName: string;
    reason: string;
  }>;
  narrative: string;
  keyRisks: string[];
  negotiationTips: string[];
}

export interface RecommendationResult extends StructuredReasoning {}

export interface ComplianceAuditMetadata {
  checkTimestamp: string;
  rulesetVersion: string;
  evaluatedBy: string; // e.g., "System Evaluated (Automated)" or "Manually Overridden by [User]"
}

export interface SignOffRecord {
  status: "approved" | "overridden";
  vendor: string;
  reason: string;
  signoffUser: string;
  time: string;
}

// Multi-Currency & Exchange Rate Types
export type CurrencyCode = "SAR" | "USD" | "EUR";

export interface ExchangeRates {
  base: "USD";
  rates: Record<CurrencyCode, number>;
  lastUpdated: string;
  source: string;
}

export interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  label: string;
  suffix: string;
  flag: string;
}

// Saudi Compliance & Regulatory Engine (KSA Procurement Gate) Types
export type KsaProjectSector =
  | "Government/Critical Infrastructure"
  | "Commercial"
  | "Defense & Security"
  | "Energy & Oil (Aramco)";

export interface KsaPillarCheck {
  required: boolean;
  pass: boolean;
  badge: string;
  details: string;
}

export interface KsaVendorCompliance {
  vendorKey: string;
  vendorName: string;
  
  // Pillar 1: IKTVA / LCGPA (In-Kingdom Total Value Add / Local Content)
  lcgpaScorePercent: number; // e.g. 42
  lcgpaCertified: boolean;
  ikvtALcgpaPass: boolean;

  // Pillar 2: HCIS (High Commission for Industrial Security)
  hcisClassApproved: boolean;
  hcisDirectives: string[]; // e.g. ["SEC-01", "SAF-01"]
  hcisPass: boolean;

  // Pillar 3: CST / SASO Homologation (Telecom, RF, Wireless, Spectrum)
  cstTypeApproved: boolean;
  sasoIeceeCertified: boolean;
  cstSasoPass: boolean;

  // Pillar 4: NCA ECC (National Cybersecurity Authority Essential Cybersecurity Controls)
  ncaEccCertified: boolean;
  ksaDataSovereignty: boolean; // In-Kingdom Data Center Hosting
  ncaEccPass: boolean;

  // Strict Binary Pass/Fail Logic Gate Status
  overallGateStatus: "APPROVE_PURCHASE_ORDER" | "FLAG_AND_BLOCK_PO";
  blockingReasons: string[];
  overrideRecord?: {
    user: string;
    reason: string;
    crNumber: string;
    timestamp: string;
  };
}

export interface KsaProjectConfig {
  projectSector: KsaProjectSector;
  includesWireless: boolean;
  includesCloudSoftware: boolean;
  minLcgpaThreshold: number; // e.g., 35%
}

export type BackgroundTheme = "glowing-red" | "dark-obsidian" | "light-porcelain";

