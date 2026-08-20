import { StructuredVendorData, DecisionWeights, VendorScores, VendorScoreDetail } from "./types";

/**
 * Calculates normalized scores (0 - 100) for each vendor based on metrics and user decision weights.
 */
export function calculateVendorScores(
  data: StructuredVendorData,
  weights: DecisionWeights
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

  const totalWeight = (weights.price + weights.leadTime + weights.warranty + weights.compliance) || 1;

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

    // Compliance: 50 pts for certified failover, up to 50 pts for certifications count
    const certsCount = (v.certifications || []).length;
    const complianceScore = (v.redundancyCertified ? 50 : 0) + Math.min(certsCount, 3) * 16.66;

    const weighted =
      (weights.price * priceScore +
        weights.leadTime * leadScore +
        weights.warranty * warrantyScore +
        weights.compliance * complianceScore) /
      totalWeight;

    scores[key] = {
      priceScore: Math.round(priceScore),
      leadScore: Math.round(leadScore),
      warrantyScore: Math.round(warrantyScore),
      complianceScore: Math.round(complianceScore),
      weighted: Math.round(weighted * 10) / 10,
    };
  });

  return scores;
}

/**
 * Generates fallback recommendation narrative locally if offline or API unavailable.
 */
export function generateFallbackRecommendation(
  data: StructuredVendorData,
  scores: VendorScores,
  topVendorKey: string,
  secondVendorKey: string,
  vendorNames: Record<string, string>
) {
  const topData = data[topVendorKey];
  const secondData = data[secondVendorKey];
  const topName = vendorNames[topVendorKey] || topVendorKey;
  const secondName = vendorNames[secondVendorKey] || secondVendorKey;

  const topPrice = topData?.priceUSD || 0;
  const secondPrice = secondData?.priceUSD || 0;
  const priceDiff = topPrice - secondPrice;

  const priceComp =
    priceDiff > 0
      ? `costs $${Math.abs(priceDiff).toLocaleString()} more upfront than ${secondName}`
      : priceDiff < 0
      ? `saves $${Math.abs(priceDiff).toLocaleString()} relative to ${secondName}`
      : `is priced identically to ${secondName}`;

  const topLead = topData?.leadTimeWeeks ?? 0;
  const topCert = topData?.redundancyCertified ? "factory pre-certified" : "requires engineering workaround";

  const otherVendorKeys = Object.keys(data).filter((k) => k !== topVendorKey);
  const excludedVendors = otherVendorKeys.map((k) => {
    const vName = vendorNames[k] || k;
    const vData = data[k];
    const vScore = scores[k]?.weighted || 0;
    let reason = `Score ${vScore}/100 trails recommended vendor.`;

    if (vData) {
      if (vData.leadTimeWeeks > 12) {
        reason = `Extended lead time (${vData.leadTimeWeeks} weeks) breaches optimal operational schedule.`;
      } else if (!vData.redundancyCertified) {
        reason = `Failover software not factory pre-certified; requires manual engineering workaround.`;
      } else if (vData.warrantyYears < topData?.warrantyYears) {
        reason = `Shorter warranty period (${vData.warrantyYears} yrs vs ${topData?.warrantyYears} yrs) increases TCO risk.`;
      }
    }
    return {
      vendorKey: k,
      vendorName: vName,
      reason,
    };
  });

  const drivingCriteria = [
    `Delivery Lead Time: ${topLead} weeks schedule matches project milestone requirements.`,
    `Redundancy Certification: ${topCert} for mission-critical command center failover.`,
    `Comprehensive Warranty: ${topData?.warrantyYears || 3}-year coverage reduces long-term maintenance TCO.`,
  ];

  return {
    recommendedVendor: topVendorKey,
    recommendationTitle: `Recommended Choice: ${topName}`,
    drivingCriteria,
    excludedVendors,
    narrative: `${topName} scores highest overall (${scores[topVendorKey]?.weighted}/100) under the active criteria weights, outperforming ${secondName} (${scores[secondVendorKey]?.weighted}/100). It ${priceComp} with a ${topLead}-week delivery schedule. Importantly, its failover configuration is ${topCert}, providing lower operational deployment risk for the critical command center.`,
    keyRisks: [
      `Verify delivery schedule commitment (${topLead} weeks) with procurement logistics.`,
      `Confirm ${topName}'s support SLA coverage aligns with 24/7 mission-critical uptime targets.`,
      `Ensure integration scope covers all required continuous-availability clustering tests.`,
    ],
    negotiationTips: [
      `Request a 5% bundle discount or free expedited freight in exchange for multi-year maintenance commitment.`,
      `Negotiate SLA penalty clauses for on-site hardware response times.`,
    ],
  };
}
