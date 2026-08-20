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
}

export type VendorScores = Record<string, VendorScoreDetail>;

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
