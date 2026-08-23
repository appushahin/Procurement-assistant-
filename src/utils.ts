import {
  StructuredVendorData,
  DecisionWeights,
  VendorScores,
  VendorScoreDetail,
  VendorBinaryGateMap,
  VendorTcoMetrics,
} from "./types";

/**
 * Calculates normalized scores (0 - 100) for each vendor based on metrics,
 * trade-off decision weights, and STRICT Binary Gatekeeper verification (YES/NO).
 */
export function calculateVendorScores(
  data: StructuredVendorData,
  weights: DecisionWeights,
  binaryGates?: VendorBinaryGateMap
): VendorScores {
  const keys = Object.keys(data);
  if (keys.length === 0) return {};

  const prices = keys.map((k) => Number(data[k]?.priceUSD || 0));
  const leadTimes = keys.map((k) => Number(data[k]?.leadTimeWeeks || 0));
  const warranties = keys.map((k) => Number(data[k]?.warrantyYears || 0));

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  const minLead = Math.min(...leadTimes);
  const maxLead = Math.max(...leadTimes);

  const minWarranty = Math.min(...warranties);
  const maxWarranty = Math.max(...warranties);

  // Decision weights now distribute across evaluative criteria (Price, Lead, Warranty)
  const totalWeight = weights.price + weights.leadTime + weights.warranty || 1;

  const scores: VendorScores = {};

  keys.forEach((key) => {
    const v = data[key] || {
      priceUSD: 0,
      leadTimeWeeks: 0,
      warrantyYears: 0,
      supportSLA: "",
      redundancyCertified: false,
      certifications: [],
      specsSummary: "",
    };

    // Evaluate Mandatory Binary Gates (Crucial Go / No-Go Gate)
    const gates = binaryGates?.[key] || {
      failoverVerified: v.redundancyCertified,
      complianceCertified: (v.certifications || []).length > 0,
    };

    const disqualificationReasons: string[] = [];
    if (!gates.failoverVerified) {
      disqualificationReasons.push("Failover / Redundancy verification is NOT certified (Mandatory Gate Failed)");
    }
    if (!gates.complianceCertified) {
      disqualificationReasons.push("Mandatory regulatory & quality compliance standards NOT verified");
    }

    const isDisqualified = disqualificationReasons.length > 0;

    // Evaluative Dimension Scores (0 - 100)
    // Lower price = higher score
    const priceScore =
      maxPrice === minPrice
        ? 100
        : (100 * (maxPrice - Number(v.priceUSD || 0))) / (maxPrice - minPrice);

    // Lower lead time = higher score
    const leadScore =
      maxLead === minLead
        ? 100
        : (100 * (maxLead - Number(v.leadTimeWeeks || 0))) / (maxLead - minLead);

    // Higher warranty = higher score
    const warrantyScore =
      maxWarranty === minWarranty
        ? 100
        : (100 * (Number(v.warrantyYears || 0) - minWarranty)) / (maxWarranty - minWarranty);

    // Compliance score is binary: 100 if passed both gates, 0 if disqualified
    const complianceScore = isDisqualified ? 0 : 100;

    // Weighted trade-off score across evaluative dimensions
    const baseWeighted =
      (weights.price * priceScore +
        weights.leadTime * leadScore +
        weights.warranty * warrantyScore) /
      totalWeight;

    scores[key] = {
      priceScore: Math.round(priceScore),
      leadScore: Math.round(leadScore),
      warrantyScore: Math.round(warrantyScore),
      complianceScore,
      weighted: Math.round(baseWeighted * 10) / 10,
      isDisqualified,
      disqualificationReasons,
    };
  });

  return scores;
}

/**
 * Total Cost of Ownership (TCO) 3-5 Year Lifecycle Engine
 */
export function calculateVendorTco(
  data: StructuredVendorData,
  binaryGates?: VendorBinaryGateMap,
  vendorNames?: Record<string, string>
): Record<string, VendorTcoMetrics> {
  const result: Record<string, VendorTcoMetrics> = {};
  const keys = Object.keys(data);

  keys.forEach((key) => {
    const v = data[key];
    const vName = vendorNames?.[key] || key;
    const initialCapex = Number(v?.priceUSD || 0);

    const gates = binaryGates?.[key] || {
      failoverVerified: v?.redundancyCertified ?? false,
      complianceCertified: (v?.certifications || []).length > 0,
    };

    // Integration Workaround Cost
    const integrationWorkaroundCost = gates.failoverVerified ? 1500 : 8500;

    // Support SLA Annual Cost
    let annualSlaOpex = 4500;
    const slaLower = (v?.supportSLA || "").toLowerCase();
    if (slaLower.includes("24/7") && slaLower.includes("4-hour")) {
      annualSlaOpex = 6800;
    } else if (slaLower.includes("8-hour")) {
      annualSlaOpex = 5200;
    } else if (slaLower.includes("email")) {
      annualSlaOpex = 2800;
    }

    // Downtime Risk Contingency Cost (Severe penalty for unverified failover)
    const contingencyRiskCost = gates.failoverVerified ? 2000 : 18500;

    // Year 1 Total
    const totalYear1 = initialCapex + integrationWorkaroundCost + annualSlaOpex + (gates.failoverVerified ? 500 : 6000);

    // 3-Year Total (with warranty coverage consideration)
    const warrantyYears = Number(v?.warrantyYears || 3);
    const postWarrantyYearCost = 3800; // Average parts & repairs out of warranty
    const outOfWarrantyYears3 = Math.max(0, 3 - warrantyYears);
    const total3Year =
      initialCapex +
      integrationWorkaroundCost +
      annualSlaOpex * 3 +
      contingencyRiskCost * 0.5 +
      outOfWarrantyYears3 * postWarrantyYearCost;

    // 5-Year Total
    const outOfWarrantyYears5 = Math.max(0, 5 - warrantyYears);
    const total5Year =
      initialCapex +
      integrationWorkaroundCost +
      annualSlaOpex * 5 +
      contingencyRiskCost +
      outOfWarrantyYears5 * postWarrantyYearCost;

    result[key] = {
      vendorKey: key,
      vendorName: vName,
      initialCapex,
      integrationWorkaroundCost,
      annualSlaOpex,
      contingencyRiskCost,
      totalYear1: Math.round(totalYear1),
      total3Year: Math.round(total3Year),
      total5Year: Math.round(total5Year),
    };
  });

  return result;
}

/**
 * Generates fallback recommendation narrative locally with strict binary gate enforcement.
 */
export function generateFallbackRecommendation(
  data: StructuredVendorData,
  scores: VendorScores,
  topVendorKey: string,
  secondVendorKey: string,
  vendorNames: Record<string, string>
) {
  // Check if all vendors are disqualified
  const allKeys = Object.keys(data);
  const qualifiedKeys = allKeys.filter((k) => !scores[k]?.isDisqualified);

  if (qualifiedKeys.length === 0) {
    return {
      recommendedVendor: topVendorKey || allKeys[0],
      recommendationTitle: "MANDATORY GATE FAILURE: No Compliant Vendors Qualified",
      drivingCriteria: [
        "Strict Binary Gatekeeper Block: All submitted vendor quotes failed mandatory failover or compliance criteria.",
        "Halting contract award recommendation until vendors submit certified compliance documents.",
      ],
      excludedVendors: allKeys.map((k) => ({
        vendorKey: k,
        vendorName: vendorNames[k] || k,
        reason: scores[k]?.disqualificationReasons?.join("; ") || "Failed mandatory gate verification.",
      })),
      narrative: `CRITICAL PROCUREMENT NOTICE: None of the submitted proposals satisfy the mandatory binary criteria for failover certification and compliance. In accordance with organizational governance policy, non-compliant bids cannot be recommended for award regardless of price. Re-tendering or formal RFQ clarification is required.`,
      keyRisks: [
        "Operational risk of deploying uncertified continuous-availability clustering.",
        "Unbudgeted engineering and downtime expenses resulting from workaround architectures.",
        "Regulatory audit breach under critical infrastructure mandates.",
      ],
      negotiationTips: [
        "Issue formal RFP Clarification Notice requesting factory-certified redundancy test reports.",
        "Solicit revised BAFO (Best and Final Offer) requiring pre-certified failover software.",
      ],
    };
  }

  // Effective top vendor is the highest-scoring QUALIFIED vendor
  const effectiveTopKey = qualifiedKeys.includes(topVendorKey)
    ? topVendorKey
    : qualifiedKeys.sort((a, b) => (scores[b]?.weighted || 0) - (scores[a]?.weighted || 0))[0];

  const topData = data[effectiveTopKey];
  const topName = vendorNames[effectiveTopKey] || effectiveTopKey;
  const topPrice = topData?.priceUSD || 0;
  const topLead = topData?.leadTimeWeeks ?? 0;

  const otherVendorKeys = allKeys.filter((k) => k !== effectiveTopKey);
  const excludedVendors = otherVendorKeys.map((k) => {
    const vName = vendorNames[k] || k;
    const vScore = scores[k];
    const vData = data[k];

    let reason = "";
    if (vScore?.isDisqualified) {
      reason = `DISQUALIFIED AT MANDATORY GATE: ${vScore.disqualificationReasons?.join(", ")}.`;
    } else {
      if (vData && vData.leadTimeWeeks > 12) {
        reason = `Extended lead time (${vData.leadTimeWeeks} weeks) trails the project milestone schedule.`;
      } else if (vData && vData.warrantyYears < (topData?.warrantyYears || 3)) {
        reason = `Shorter warranty period (${vData.warrantyYears} yrs vs ${topData?.warrantyYears} yrs) increases multi-year TCO.`;
      } else {
        reason = `Evaluated score (${vScore?.weighted}/100) trails the recommended option under active weights.`;
      }
    }

    return {
      vendorKey: k,
      vendorName: vName,
      reason,
    };
  });

  const drivingCriteria = [
    `Mandatory Gate Passed: 100% Verified for Mission-Critical Redundancy & Regulatory Compliance.`,
    `Schedule Alignment: ${topLead}-week delivery committed to project milestone targets.`,
    `Comprehensive Coverage: ${topData?.warrantyYears || 5}-year warranty reduces 5-Year TCO liability.`,
  ];

  return {
    recommendedVendor: effectiveTopKey,
    recommendationTitle: `Recommended Choice: ${topName}`,
    drivingCriteria,
    excludedVendors,
    narrative: `${topName} is the definitive recommended selection. It successfully satisfies all mandatory binary gates (pre-certified failover clustering and ISO/IEC regulatory standards) while achieving the highest overall weighted score (${scores[effectiveTopKey]?.weighted || 0}/100). Competitor bids failed mandatory redundancy verification or carry elevated multi-year TCO risks.`,
    keyRisks: [
      `Confirm vendor's 24/7 on-site response SLA commitment with logistics engineering.`,
      `Lock in price quote against currency fluctuations prior to purchase order issuance.`,
      `Schedule witness testing for active/standby automated failover during factory staging.`,
    ],
    negotiationTips: [
      `Leverage multi-year support commitment to request 5% bundle discount on spare modules.`,
      `Request complimentary advance parts stocking at the local regional depot.`,
      `Include strict SLA penalty terms for unexpected cluster downtime.`,
    ],
  };
}
