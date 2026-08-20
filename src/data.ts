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
  price: 25,
  leadTime: 35,
  warranty: 20,
  compliance: 20,
};

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
