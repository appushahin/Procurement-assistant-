/**
 * LANTRA Procurement & Market Intelligence Knowledge Base
 * Complete A-to-Z domain data, software specs, global procurement economics,
 * and Saudi Vision 2030 regulatory framework.
 */

export interface MarketIndicator {
  id: string;
  name: string;
  nameAr: string;
  value: string;
  change: string;
  trend: "up" | "down" | "stable";
  impactSummary: string;
  impactSummaryAr: string;
  category: "forex" | "hardware" | "software" | "logistics" | "saudi_macro";
}

export interface ProcurementNewsItem {
  id: string;
  title: string;
  titleAr: string;
  source: string;
  date: string;
  category: "Saudi Vision 2030" | "Global Supply Chain" | "Semiconductor Market" | "Regulatory & Compliance" | "Enterprise Software" | "Server Hardware";
  categoryAr: "رؤية السعودية 2030" | "سلاسل الإمداد العالمية" | "سوق الرقائق والخوادم" | "الأنظمة والحوكمة" | "برمجيات المؤسسات" | "عتاد الخوادم";
  summary: string;
  summaryAr: string;
  rfqImpact: string;
  rfqImpactAr: string;
  recommendedAction: string;
  recommendedActionAr: string;
}

export const LANTRA_MARKET_INDICATORS: MarketIndicator[] = [
  {
    id: "sar-usd-peg",
    name: "SAR / USD Exchange Peg",
    nameAr: "سعر صرف الريال مقابل الدولار",
    value: "3.7500 SAR",
    change: "0.00% (Fixed Peg)",
    trend: "stable",
    impactSummary: "Zero currency fluctuation risk for USD-denominated hardware imports.",
    impactSummaryAr: "انعدام مخاطر تقلب العملة لواردات الخوادم المقومة بالدولار الأمريكي.",
    category: "forex",
  },
  {
    id: "vmware-licensing-index",
    name: "Enterprise Virtualization Index (VMware/KVM)",
    nameAr: "مؤشر تراخيص المحاكاة الافتراضية المؤسسية",
    value: "+35.4% OPEX",
    change: "Subscription Shift",
    trend: "up",
    impactSummary: "Per-core subscription models triple multi-year support costs; favor open KVM/Nutanix bundles (Meridian).",
    impactSummaryAr: "تراخيص الأنوية السنوية ترفع تكاليف الدعم لثلاثة أضعاف؛ يُفضل اعتماد بدائل KVM/Nutanix المضمنة لدى ميريديان.",
    category: "software",
  },
  {
    id: "server-memory-index",
    name: "Enterprise DDR5 ECC Spot Index",
    nameAr: "مؤشر أسعار ذاكرة الخوادم المؤسسية DDR5",
    value: "$142 / 64GB",
    change: "+14.2% QoQ",
    trend: "up",
    impactSummary: "Memory fabrication capacity constraints: Favor suppliers with pre-allocated component inventory (Meridian / Ironclad).",
    impactSummaryAr: "ارتفاع أسعار الذاكرة عالمياً: يُفضل التعاقد مع الموردين ذوي المخزون المحجوز مسبقاً (ميريديان وآيرون كلاد).",
    category: "hardware",
  },
  {
    id: "database-core-licensing",
    name: "Enterprise Database Core Licensing Multiplier",
    nameAr: "معامل تراخيص أنوية قواعد البيانات (أوراكل/مايكروسوفت)",
    value: "$9,500 / Core",
    change: "+7.5% YoY",
    trend: "up",
    impactSummary: "Dense multi-socket hardware multiplies database licensing exposure; Meridian balanced core config minimizes liability.",
    impactSummaryAr: "كثافة الأنوية العالية تضاعف رسوم تراخيص قواعد البيانات؛ بنية ميريديان المتوازنة تقلل المخاطر المالية.",
    category: "software",
  },
  {
    id: "gcc-freight-transit",
    name: "Air & Sea Cargo Lead Times to KSA",
    nameAr: "مدد الشحن الجوي والبحري للمملكة",
    value: "14 - 28 Days",
    change: "-2 Days",
    trend: "down",
    impactSummary: "Air freight lanes via King Khalid International Airport (RUH) operating at nominal velocity.",
    impactSummaryAr: "مسارات الشحن الجوي عبر مطار الملك خالد الدولي بالرياض تعمل بكفاءة منتظمة.",
    category: "logistics",
  },
  {
    id: "sama-repo-rate",
    name: "SAMA Reverse Repo / Financing Rate",
    nameAr: "معدل اتفاقيات إعادة الشراء (ساما)",
    value: "5.50%",
    change: "Holding Stable",
    trend: "stable",
    impactSummary: "Direct CAPEX cash-flow purchases yield higher net present value than deferred multi-year financing.",
    impactSummaryAr: "الشراء الرأسمالي المباشر (CAPEX) يحقق وفراً مالياً أعلى مقارنة بالتمويل المؤجل طويل الأجل.",
    category: "saudi_macro",
  },
  {
    id: "lcgpa-mandatory-tech-list",
    name: "LCGPA Local Content Tech Threshold",
    nameAr: "معيار المحتوى المحلي للأجهزة والشبكات",
    value: "35.0% Min",
    change: "Mandatory Gate",
    trend: "stable",
    impactSummary: "Mandatory preference given to bids exceeding 35% local content under Government Tender & Procurement Law.",
    impactSummaryAr: "أفضلية إلزامية للعروض التي تتجاوز 35% محتوى محلي بموجب نظام المنافسات والمشتريات الحكومية.",
    category: "saudi_macro",
  },
];

export const LANTRA_PROCUREMENT_NEWS: ProcurementNewsItem[] = [
  {
    id: "news-lcgpa-2026",
    title: "LCGPA Expands Mandatory List for Enterprise Data Center Hardware & Servers",
    titleAr: "هيئة المحتوى المحلي توسع القائمة الإلزامية لمعدات مراكز البيانات والخوادم",
    source: "Saudi Press Agency (SPA) / LCGPA Official",
    date: "August 2026",
    category: "Saudi Vision 2030",
    categoryAr: "رؤية السعودية 2030",
    summary: "The Local Content and Government Procurement Authority has updated guidelines enforcing local assembly, Saudi engineering staffing quotas, and in-Kingdom support presence for enterprise IT tenders.",
    summaryAr: "أعلنت هيئة المحتوى المحلي والمشتريات الحكومية عن تحديث القائمة الإلزامية للمنتجات الوطنية، مشددة على اشتراطات التجميع المحلي ونسب الكوادر الهندسية السعودية ومراكز الدعم داخل المملكة للمنافسات التقنية.",
    rfqImpact: "Meridian Solutions (48% local content) gains a direct statutory advantage over Vantage Systems (18%).",
    rfqImpactAr: "يمنح هذا التحديث أفضلية تنافسية وتنظيمية مباشرة لشركة ميريديان (48% محتوى محلي) مقارنة بشركة فانتاج (18%).",
    recommendedAction: "Weight Saudi Local Content at minimum 20-25% in the multi-criteria decision matrix.",
    recommendedActionAr: "تثبيت وزن معيار المحتوى المحلي بنسبة لا تقل عن 20-25% في مصفوفة المفاضلة والترجيح.",
  },
  {
    id: "news-datacenter-expansion",
    title: "Saudi Cloud Computing & AI Infrastructure Expansion Accelerates Across Riyadh & NEOM",
    titleAr: "تسارع مشاريع البنية التحتية للحوسبة السحابية والذكاء الاصطناعي في الرياض ونيوم",
    source: "Ministry of Communications and Information Technology (MCIT)",
    date: "August 2026",
    category: "Saudi Vision 2030",
    categoryAr: "رؤية السعودية 2030",
    summary: "Over $12B deployed into high-availability sovereign datacenters requiring Tier IV continuous active-active redundancy and strict CST Cloud Data Sovereignty homologation.",
    summaryAr: "ضخ استثمارات تتجاوز 12 مليار دولار في مراكز البيانات السيادية عالية التوافر التي تشترط تصنيف Tier IV وتجاوز الأعطال اللحظي المتزامن والامتزام التام بضوابط هيئة الاتصالات والفضاء والتقنية (CST).",
    rfqImpact: "Confirms our mandatory binary failover gate: Vendor solutions lacking instant failover certification cannot be accepted.",
    rfqImpactAr: "يؤكد صحة بوابة تجاوز الأعطال الإلزامية في نظامنا: استبعاد أي مورد لا يقدم شهادة معتمدة للجاهزية اللحظية.",
    recommendedAction: "Maintain strict disqualification of Vantage Systems until certified failover laboratory validation is submitted.",
    recommendedActionAr: "الإبقاء على استبعاد شركة فانتاج سيستمز ما لم تقدم تقرير اختبار عملي معتمد للتجاوز التلقائي.",
  },
  {
    id: "news-server-semiconductor",
    title: "Global Enterprise CPU & PCIe Gen5 Server Lead Times Stabilize at 6 to 10 Weeks",
    titleAr: "استقرار مهل توريد معالجات الخوادم المؤسسية عالمياً بين 6 إلى 10 أسابيع",
    source: "Global Tech Procurement Index",
    date: "August 2026",
    category: "Global Supply Chain",
    categoryAr: "سلاسل الإمداد العالمية",
    summary: "Factory capacity in major semiconductor fabrication hubs has improved, making 14-16 week vendor lead times an outlier and an indicator of regional stocking inefficiency.",
    summaryAr: "شهدت مصانع الرقائق الإلكترونية استقراراً في خطوط الإنتاج، مما يجعل مهلة التوريد البالغة 16 أسبوعاً نقطة شاذة ومؤشراً على ضعف المخزون الإقليمي للمورد.",
    rfqImpact: "Vantage's 16-week delivery schedule represents an unacceptable project delay risk compared to Meridian's 6 weeks.",
    rfqImpactAr: "مهلة توريد فانتاج (16 أسبوعاً) تشكل خطراً تشغيلياً جسيماً على الجدول الزمني مقارنة بميريديان (6 أسابيع).",
    recommendedAction: "Enforce a liquidated damages clause ($2,500/day) for any vendor exceeding 8 weeks delivery.",
    recommendedActionAr: "تضمين شرط الغرامات المالية التعاقدية في مسودة التفاوض لأي تأخير يتجاوز 8 أسابيع.",
  },
  {
    id: "news-nca-cybersecurity",
    title: "NCA Enforces Mandatory Cybersecurity Controls (ECC-1:2018) for Mission-Critical Infrastructure",
    titleAr: "الهيئة الوطنية للأمن السيبراني تؤكد إلزامية الضوابط الأساسية (ECC-1:2018) للبنى التحتية الحساسة",
    source: "National Cybersecurity Authority (NCA)",
    date: "August 2026",
    category: "Regulatory & Compliance",
    categoryAr: "الأنظمة والحوكمة",
    summary: "Audits by NCA and High Commission for Industrial Security (HCIS) mandate hardware-level TPM 2.0 encryption, zero-trust firmware verification, and local telemetry storage.",
    summaryAr: "توجيهات مشددة تلزم كافة الجهات بتطبيق تشفير العتاد TPM 2.0، والتحقق الآمن من البرمجيات الثابتة (Firmware)، وحفظ السجلات وسلاسل التدقيق داخل المملكة.",
    rfqImpact: "Meridian and Ironclad fulfill full NCA and HCIS directives; Vantage requires third-party security remediation.",
    rfqImpactAr: "ميريديان وآيرون كلاد مستوفيان لجميع متطلبات NCA و HCIS، بينما تتطلب فانتاج تراخيص وبرمجيات أمنية طرف ثالث.",
    recommendedAction: "Verify cryptographic signatures on all multi-tier signoff records before issuing the final Purchase Order.",
    recommendedActionAr: "التأكد من التوقيع الإلكتروني المشفر لكافة مستويات الاعتماد الثلاثية قبل إصدار أمر الشراء النهائي.",
  },
  {
    id: "news-vmware-broadcom-licensing",
    title: "Enterprise Virtualization Shift: VMware/Broadcom Per-Core Licensing Sparks +35% OPEX Surge",
    titleAr: "تحول تراخيص المحاكاة الافتراضية: سياسة برودكوم ترفع تكاليف VMware بنسبة 35% وتدفع نحو حلول KVM وNutanix",
    source: "The Register / Gartner IT Key Metrics",
    date: "August 2026",
    category: "Enterprise Software",
    categoryAr: "برمجيات المؤسسات",
    summary: "Mandatory core-based subscription models have tripled multi-year hypervisor renewal fees, prompting public and private entities across the GCC to migrate toward KVM-based and Nutanix software stacks.",
    summaryAr: "أدى التحول الإلزامي لاشتراكات التراخيص المبنية على عدد الأنوية إلى مضاعفة رسوم الدعم وتجديد التراخيص، مما دفع مؤسسات الخليج لتقييم حلول KVM وNutanix لتقليص نفقات التشغيل.",
    rfqImpact: "Vendors offering pre-integrated KVM hypervisors or bundled OEM virtualization software (Meridian & Ironclad) deliver up to $42,000 in 5-year OPEX savings.",
    rfqImpactAr: "الموردون الذين يقدمون خوادم مهيأة لحزم المحاكاة مفتوحة المصدر وحزم التراخيص الدائمة (ميريديان وآيرون كلاد) يحققون وفراً يصل إلى 42,000 دولار في التكلفة التشغيلية.",
    recommendedAction: "Mandate detailed 5-year virtualization software licensing breakdowns with price-escalation caps in the BAFO submission round.",
    recommendedActionAr: "إلزام الموردين بتقديم تفصيل دقيق لتكاليف تراخيص البرمجيات للسنوات الخمس وتحديد سقف لأي زيادات سنوية في جولة BAFO.",
  },
  {
    id: "news-enterprise-nvme-ssd-allocations",
    title: "PCIe Gen5 NVMe Enterprise SSD Allocations Tighten with 6-8 Week Factory Lead Times",
    titleAr: "قيود توريد وحدات التخزين المؤسسية فائقة السرعة NVMe Gen5 تمدد جداول التسليم إلى 6-8 أسابيع",
    source: "TrendForce / StorageReview",
    date: "August 2026",
    category: "Server Hardware",
    categoryAr: "عتاد الخوادم",
    summary: "Hyperscale AI server builds continue to consume enterprise NAND flash and high-end controller chips, creating spot allocation delays for enterprise data center buyers.",
    summaryAr: "يواصل الطلب الهائل على مراكز بيانات الذكاء الاصطناعي امتصاص الحصص الإنتاجية لرقائق التخزين السريع، مما يفرض تأخيرات في التوريد المباشر من المصانع.",
    rfqImpact: "Meridian's verified in-Kingdom staging warehouse in Riyadh protects the RFQ deployment schedule from global factory delivery slips.",
    rfqImpactAr: "المستودع اللوجستي التابع لميريديان في الرياض يوفر حماية كاملة للمشروع من مخاطر تأخر المصانع العالمية.",
    recommendedAction: "Require proof of warehouse inventory reservation and locked dispatch manifests prior to final contract signing.",
    recommendedActionAr: "اشتراط تقديم إثبات تخصيص المخزون وبوالص الشحن المباشرة قبل توقيع العقد النهائي.",
  },
];

/**
 * Generate real-time contextual suggestions based on active app state
 */
export function generateLantraStateInsights(context: {
  structuredData?: any;
  scores?: Record<string, any>;
  weights?: Record<string, number>;
  recommendation?: any;
  binaryGates?: Record<string, any>;
  signoff?: any;
  currency?: string;
  lang?: "en" | "ar";
}): Array<{
  id: string;
  type: "warning" | "opportunity" | "regulatory" | "governance";
  title: string;
  titleAr: string;
  detail: string;
  detailAr: string;
  prompt: string;
}> {
  const isAr = context.lang === "ar";
  const insights: Array<{
    id: string;
    type: "warning" | "opportunity" | "regulatory" | "governance";
    title: string;
    titleAr: string;
    detail: string;
    detailAr: string;
    prompt: string;
  }> = [];

  const vantageGateFail = context.binaryGates?.vantage?.failoverVerified === false;
  const isSignedOff = !!context.signoff;
  const localContentWeight = context.weights?.localContent || 0;

  // 1. Vantage Gate Risk
  if (vantageGateFail) {
    insights.push({
      id: "insight-vantage-gate",
      type: "warning",
      title: "Mandatory Gate Disqualification Alert",
      titleAr: "تنبيه استبعاد: بوابة الامتثال الإلزامية",
      detail: "Vantage Systems is disqualified due to unverified continuous failover (99.999% SLA). Although their upfront price is lowest, 5-Yr TCO is higher due to $60k/yr licensing.",
      detailAr: "تم استبعاد شركة فانتاج لعدم التحقق من بوابة تجاوز الأعطال بدون توقف. ورغم انخفاض السعر المبدئي، فإن التكلفة الإجمالية (TCO) ترتفع بسبب رسوم الصيانة الإضافية.",
      prompt: "Explain why Vantage Systems is disqualified under the mandatory continuous failover gate and compare its 5-year TCO against Meridian.",
    });
  }

  // 2. Local Content Weighting Opportunity
  if (localContentWeight < 20) {
    insights.push({
      id: "insight-local-content",
      type: "regulatory",
      title: "Saudi Vision 2030 & LCGPA Optimization",
      titleAr: "تحسين وزن المحتوى المحلي وفق رؤية 2030",
      detail: `Current Local Content weight is ${localContentWeight}%. Increasing it to 25% aligns with LCGPA regulations and widens Meridian's statutory compliance margin.`,
      detailAr: `وزن المحتوى المحلي حالياً ${localContentWeight}%. زيادته إلى 25% يتماشى مع لوائح هيئة المحتوى المحلي ويعزز أولوية الترسية النظامية.`,
      prompt: "How does adjusting the Saudi Local Content weight impact the ranking of Meridian (48%) vs Ironclad (32%) and Vantage (18%)?",
    });
  }

  // 3. Multi-tier Governance Signoff
  if (!isSignedOff) {
    insights.push({
      id: "insight-signoff-pending",
      type: "governance",
      title: "3-Tier Sequential Sign-Off Ready",
      titleAr: "جاهزية الاعتماد والحوكمة متعددة المستويات",
      detail: "Evaluation data is stabilized. Tier 1 (Technical Lead) and Tier 2 (Procurement Director) approvals are recommended before executive CFO sign-off.",
      detailAr: "اكتملت مصفوفة التقييم. يوصى بإجراء اعتماد المستوى الأول (الفني) والمستوى الثاني (المشتريات) قبل التوقيع المالي النهائي.",
      prompt: "What are the remaining sign-off steps required to complete the 3-tier governance audit trail?",
    });
  } else {
    insights.push({
      id: "insight-signoff-complete",
      type: "governance",
      title: "Cryptographic Sign-Off Verified",
      titleAr: "تم توثيق الاعتماد الرقمي المشفر",
      detail: `Evaluation certified by ${context.signoff?.signoffUser || "Executive Approver"}. Audit trail is locked and export-ready.`,
      detailAr: `تم توثيق الترسية وتوقيعها من قِبل ${context.signoff?.signoffUser || "المعتمد التنفيذي"}. السجل جاهز للتصدير والتدقيق.`,
      prompt: "Generate an executive summary of the certified award and sign-off verification hash.",
    });
  }

  // 4. BAFO & Market Advantage
  insights.push({
    id: "insight-bafo-opportunity",
    type: "opportunity",
    title: "BAFO Negotiation Window Active",
    titleAr: "فرصة التفاوض على العرض النهائي (BAFO)",
    detail: "Global DDR5 memory price volatility suggests requesting a locked 5-year fixed maintenance cap and 8% price discount during BAFO rounds.",
    detailAr: "تقلبات أسعار عتاد الخوادم عالمياً تدعم طلب تثبيت أسعار الصيانة لمدة 5 سنوات والحصول على خصم 8% في الجولة النهائية.",
    prompt: "Draft a strategic BAFO negotiation counter-offer for the top-ranked vendor including lead-time compression and warranty protection.",
  });

  return insights;
}
