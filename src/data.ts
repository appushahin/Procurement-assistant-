import { VendorRawQuotes, StructuredVendorData, DecisionWeights } from "./types";

export const VENDOR_NAMES: Record<string, string> = {
  meridian: "HP (Meridian)",
  ironclad: "DELL (Ironclad)",
  vantage: "LENOVO (Vantage)",
};

export const INITIAL_QUOTES: VendorRawQuotes = {
  meridian: `HP — Quotation Q-2291
Subject: Redundant Security Command-Center Server Pair

Per your RFQ for the twin-node failover server configuration supporting your access-control and video-management platform, we are pleased to quote the following:

Unit: HP R7 Rugged Rackmount Server (2x, active/standby pair)
CPU: Dual Xeon Gold, 32 cores total per node
Memory: 256GB ECC per node
Storage: 8TB NVMe RAID-10 per node
Failover software: Pre-certified for continuous-availability clustering, validated against your stated redundancy requirement
Price: USD 84,500 for the pair, inclusive of rack integration
Delivery: 9 weeks ex-works from order confirmation
Warranty: 5 years, next-business-day parts replacement
Support SLA: 24/7, 4-hour on-site response, dedicated account engineer
Certifications: ISO 9001, IEC 60950 enclosure rating for elevated ambient temperature environments

We understand your schedule pressure and can expedite to 7 weeks for a 4% surcharge.`,

  ironclad: `From: sales@dell.example
Subject: RE: Server pair for security operations center — Quote DL-5561

Thank you for considering DELL. Quote below for the dual-node configuration you described:

Model: DELL Vault-7 (2 units)
CPU: Dual Xeon Gold, 28 cores total per node
Memory: 192GB ECC per node
Storage: 6TB NVMe RAID-10 per node
Redundancy: Compatible with most third-party continuous-availability software via a manual driver install; not factory pre-certified
Price: USD 61,200 total for both units
Lead time: 16 weeks from PO, subject to component availability (current global lead times are elevated)
Warranty: 3 years, return-to-depot
Support: Business-hours email support included; 24/7 phone support available as a paid add-on
Certifications: ISO 9001

Happy to answer any technical questions before you finalize.`,

  vantage: `LENOVO — Formal Quotation LN-Q-0847
Re: Twin-server failover pair, security systems application

Configuration offered:
- 2x LENOVO RS-500 rack servers
- CPU: Dual Xeon Silver, 24 cores total per node
- RAM: 224GB ECC per node
- Storage: 7TB NVMe RAID-10 per node
- Failover clustering: supported via open-source stack; our engineers will assist with a compatibility workaround for your specified redundancy software, estimated 3 additional engineering days
- Total price: USD 71,800 including workaround engineering support
- Lead time: 11 weeks from confirmed PO
- Warranty: 4 years, advance parts replacement
- Support SLA: 24/7 phone, 8-hour on-site response
- Certifications: ISO 9001, ISO 14001

We are a preferred vendor for two other mining-sector clients and can share references on request.`,
};

export const INITIAL_WEIGHTS: DecisionWeights = {
  price: 40,
  leadTime: 35,
  warranty: 25,
  compliance: 0, // Compliance is now evaluated via Strict Binary Gatekeeper (YES / NO)
};

export const DEFAULT_BINARY_GATES: Record<string, { failoverVerified: boolean; complianceCertified: boolean }> = {
  meridian: {
    failoverVerified: true, // Factory pre-certified for continuous availability clustering
    complianceCertified: true, // ISO 9001 + IEC 60950 full compliance
  },
  ironclad: {
    failoverVerified: false, // Requires manual uncertified driver installation (FAILOVER GATE FAILED)
    complianceCertified: true, // ISO 9001 standard compliance
  },
  vantage: {
    failoverVerified: false, // Requires 3-day engineering workaround (FAILOVER GATE FAILED)
    complianceCertified: true, // ISO 9001 + ISO 14001 compliance
  },
};

export const RFQ_SCENARIOS = [
  {
    id: "security-command-center",
    name: "Security Command Center Failover Servers",
    category: "Mission-Critical Infrastructure",
    description: "Twin-node continuous availability server pair supporting 24/7 access-control & VMS video management.",
    quotes: INITIAL_QUOTES,
    weights: { price: 40, leadTime: 35, warranty: 25, compliance: 0 },
    initialGates: DEFAULT_BINARY_GATES,
  },
  {
    id: "enterprise-cloud-dr",
    name: "Enterprise Cloud DR & Multi-Region Gateway",
    category: "IT & Telecommunications",
    description: "High-throughput redundant storage appliances with automatic zero-data-loss snapshot replication.",
    quotes: {
      meridian: `HP CloudGateway Twin X9: $92,000 for paired appliances. 8 weeks delivery. 5-year 24/7 SLA. Zero-RPO active-active failover pre-certified. ISO 27001 & SOC 2 certified.`,
      ironclad: `DELL EMC StorageCluster: $68,500. 14 weeks delivery. 3-year warranty. Failover requires custom scripts and manual IP failover daemon. ISO 9001.`,
      vantage: `LENOVO ThinkSystem DR: $79,200. 10 weeks delivery. 4-year warranty. 8-hour support SLA. Failover requires vendor engineering setup plugin (4 days). ISO 27001.`,
    },
    weights: { price: 35, leadTime: 40, warranty: 25, compliance: 0 },
    initialGates: {
      meridian: { failoverVerified: true, complianceCertified: true },
      ironclad: { failoverVerified: false, complianceCertified: true },
      vantage: { failoverVerified: false, complianceCertified: true },
    },
  },
  {
    id: "mining-machinery-fleet",
    name: "Mining Site Auxiliary Power & Redundant UPS",
    category: "Heavy Mining & Energy",
    description: "Industrial dual-feed UPS and generator switchgear meeting Ma'aden / Aramco severe ambient temperature specs.",
    quotes: {
      meridian: `HP Industrial HeavyPower 500kVA: $115,000. 10 weeks delivery. 5-year warranty, next-day site response. Automated dual-bus static transfer switch certified. HCIS & SASO certified.`,
      ironclad: `DELL HeavyPower Titan: $89,000. 18 weeks delivery. 3-year standard warranty. Manual bypass transfer switch, unverified high-temp failover. ISO 9001 only.`,
      vantage: `LENOVO MinePower Pro: $102,000. 12 weeks delivery. 4-year warranty. 24/7 remote SLA. Requires external sync controller for failover. SASO certified.`,
    },
    weights: { price: 45, leadTime: 30, warranty: 25, compliance: 0 },
    initialGates: {
      meridian: { failoverVerified: true, complianceCertified: true },
      ironclad: { failoverVerified: false, complianceCertified: false },
      vantage: { failoverVerified: false, complianceCertified: true },
    },
  },
];

export const FALLBACK_STRUCTURED_DATA: StructuredVendorData = {
  meridian: {
    priceUSD: 84500,
    leadTimeWeeks: 9,
    warrantyYears: 5,
    supportSLA: "24/7, 4-hour on-site response, dedicated account engineer",
    redundancyCertified: true,
    certifications: ["ISO 9001", "IEC 60950 (elevated ambient rating)"],
    specsSummary: "Dual Xeon Gold (32 cores), 256GB ECC RAM, 8TB NVMe RAID-10. Pre-certified continuous-availability clustering.",
  },
  ironclad: {
    priceUSD: 61200,
    leadTimeWeeks: 16,
    warrantyYears: 3,
    supportSLA: "Business-hours email included; 24/7 phone as a paid add-on",
    redundancyCertified: false,
    certifications: ["ISO 9001"],
    specsSummary: "Dual Xeon Gold (28 cores), 192GB ECC RAM, 6TB NVMe RAID-10. Lowest upfront cost, requires manual driver install for failover.",
  },
  vantage: {
    priceUSD: 71800,
    leadTimeWeeks: 11,
    warrantyYears: 4,
    supportSLA: "24/7 phone, 8-hour on-site response",
    redundancyCertified: false,
    certifications: ["ISO 9001", "ISO 14001"],
    specsSummary: "Dual Xeon Silver (24 cores), 224GB ECC RAM, 7TB NVMe RAID-10. Includes 3 days vendor workaround engineering support.",
  },
};
