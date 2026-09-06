/**
 * LANTRA Proactive Market Intelligence & Raw Material Fluctuation Engine
 * Tracks real-time commodity, semiconductor, component, and raw material spot prices
 * relevant to enterprise server infrastructure and IT procurement categories.
 */

export interface MarketMaterialAlert {
  id: string;
  materialName: string;
  materialNameAr: string;
  category: string;
  categoryAr: string;
  currentSpotPrice: string;
  baselinePrice: string;
  percentChange: number; // e.g. +14.2
  direction: "surge" | "drop";
  severity: "critical" | "warning" | "high";
  detectedAt: string;
  headline: string;
  headlineAr: string;
  summary: string;
  summaryAr: string;
  drivers: string[];
  driversAr: string[];
  impactOnVendors: {
    meridian: {
      status: "shielded" | "vulnerable" | "critical";
      text: string;
      textAr: string;
    };
    ironclad: {
      status: "shielded" | "vulnerable" | "critical";
      text: string;
      textAr: string;
    };
    vantage: {
      status: "shielded" | "vulnerable" | "critical";
      text: string;
      textAr: string;
    };
  };
  recommendedActions: {
    id: string;
    title: string;
    titleAr: string;
    description: string;
    descriptionAr: string;
    actionType: "hedge_contract" | "adjust_weights" | "lock_bafo" | "consult_lantra";
  }[];
  lantraDeepDivePrompt: string;
  lantraDeepDivePromptAr: string;
}

export const PRESET_MATERIAL_ALERTS: MarketMaterialAlert[] = [
  {
    id: "alert-ddr5-dram-surge-2026",
    materialName: "Enterprise DDR5 ECC Server Memory (DRAM Modules)",
    materialNameAr: "ذاكرة الخوادم المؤسسية DDR5 ECC (رقائق DRAM)",
    category: "Data Center Compute & Server Clusters",
    categoryAr: "مراكز البيانات وخوادم الحوسبة السحابية",
    currentSpotPrice: "$142.50 / 64GB Module",
    baselinePrice: "$124.80 / 64GB Module",
    percentChange: 14.2,
    direction: "surge",
    severity: "critical",
    detectedAt: "Real-time Feed — Live Monitor",
    headline: "LANTRA Alert: Sudden +14.2% Spike in Enterprise DDR5 ECC Memory Spot Prices",
    headlineAr: "تنبيه لانـتـرا: قفزة مفاجئة بنسبة +14.2% في أسعار ذاكرة الخوادم المؤسسية DDR5 عالمياً",
    summary: "Global semiconductor fabs (SK Hynix, Micron, Samsung) have reallocated silicon wafer lines toward high-bandwidth memory (HBM3e) for hyperscale AI accelerators. This has caused immediate spot shortages and a +14.2% QoQ surge in standard DDR5 ECC server DIMMs required for RFQ-2026 server cluster nodes.",
    summaryAr: "قامت كبرى مصانع الرقائق العالمية بإعادة توجيه خطوط الإنتاج نحو رقائق الذاكرة فائقة النطاق (HBM3e) لمسرعات الذكاء الاصطناعي، مما تسبب في نقص فوري وارتفاع أسعار ذواكر DDR5 ECC بنسبة +14.2% وهي المكون الأساسي لخوادم منافسة RFQ-2026.",
    drivers: [
      "Fab capacity shift to high-margin HBM3e AI accelerator packages",
      "Tier-1 cloud hyperscalers locking multi-quarter foundry allocations",
      "Upstream silicon wafer supply tightness pushing module spot premiums",
    ],
    driversAr: [
      "تحويل الطاقة الإنتاجية نحو حزم ذواكر الذكاء الاصطناعي HBM3e",
      "حجز كبرى الشركات السحابية العالمية لحصص المصانع لأرباع قادمة",
      "ارتفاع تكاليف رقائق السيليكون الخام وفرض علاوات سعرية فورية",
    ],
    impactOnVendors: {
      meridian: {
        status: "shielded",
        text: "Meridian's bid includes a certified 60-day price lock and pre-allocated local stock in Riyadh. Completely shielded from spot inflation.",
        textAr: "عرض ميريديان محمي بتثبيت أسعار رسمي لمدة 60 يوماً ومخزون محلي محجوز مسبقاً بالرياض. منعدم التأثر بالزيادة السعرية.",
      },
      ironclad: {
        status: "vulnerable",
        text: "Ironclad's open-quote BOM exposes RFQ-2026 to a potential 5-8% pass-through component price escalation ($11,600 CAPEX delta).",
        textAr: "عرض آيرون كلاد المفتوح يعرض ميزانية المشروع لزيادة محتملة بنسبة 5-8% في تكلفة المكونات (فارق يقارب 11,600 دولار).",
      },
      vantage: {
        status: "critical",
        text: "Vantage's 16-week lead time and overseas sourcing creates extreme exposure to compounding Q3 wafer price increases.",
        textAr: "مهلة توريد فانتاج (16 أسبوعاً) واعتمادها على الشحن الخارجي يعرض العقد لمخاطر تراكمية عالية جداً في تقلبات الأسعار.",
      },
    },
    recommendedActions: [
      {
        id: "act-lock-bafo",
        title: "Enforce 60-Day Fixed Price Lock in BAFO",
        titleAr: "تثبيت الأسعار لمدة 60 يوماً في العرض النهائي BAFO",
        description: "Require all competing vendors to formally certify fixed component pricing in their Best and Final Offer (BAFO) submissions.",
        descriptionAr: "إلزام جميع الموردين المتنافسين بتقديم تعهد كتابي بتثبيت أسعار المكونات في العرض المالي النهائي.",
        actionType: "lock_bafo",
      },
      {
        id: "act-adjust-weights",
        title: "Elevate TCO & Price Weight (+15%)",
        titleAr: "رفع وزن معيار السعر والتكلفة الإجمالية (+15%)",
        description: "Increase TCO weight in the decision matrix to prioritize vendors with guaranteed price protection.",
        descriptionAr: "زيادة وزن معيار التكلفة الإجمالية للملكية في مصفوفة الترجيح لحماية الميزانية من التضخم.",
        actionType: "adjust_weights",
      },
      {
        id: "act-consult-lantra",
        title: "Ask LANTRA to Draft Contract Price Protection Clause",
        titleAr: "استشارة لانـتـرا لصياغة بند حماية الأسعار التعاقدي",
        description: "Generate a custom GTPL-compliant price-cap and liquidated damages clause in the LANTRA Copilot chat.",
        descriptionAr: "توليد بند تعاقدي لحماية الأسعار متوافق مع نظام المنافسات الحكومية عبر مساعد لانـتـرا.",
        actionType: "consult_lantra",
      },
    ],
    lantraDeepDivePrompt: "Analyze the sudden +14.2% DDR5 ECC server memory spot price surge. How does this impact Meridian, Ironclad, and Vantage, and what exact BAFO price-lock clauses should we enforce under Saudi procurement regulations?",
    lantraDeepDivePromptAr: "حلل أثر القفزة المفاجئة في أسعار ذاكرة الخوادم DDR5 ECC بنسبة +14.2%. كيف يؤثر ذلك على ميريديان وآيرون كلاد وفانتاج، وما هي بنود تثبيت الأسعار التي يجب تضمينها في العرض النهائي وفق الأنظمة السعودية؟",
  },
  {
    id: "alert-nvme-nand-surge-2026",
    materialName: "Enterprise NVMe Gen5 NAND Flash Storage",
    materialNameAr: "وحدات التخزين المؤسسية فائقة السرعة NVMe Gen5 (شرائح NAND)",
    category: "High-Throughput Storage & Database Nodes",
    categoryAr: "خوادم قواعد البيانات والتخزين فائق السرعة",
    currentSpotPrice: "$310 / 3.84TB Enterprise U.3 SSD",
    baselinePrice: "$261 / 3.84TB Enterprise U.3 SSD",
    percentChange: 18.5,
    direction: "surge",
    severity: "critical",
    detectedAt: "Real-time Feed — Live Monitor",
    headline: "LANTRA Alert: Sudden +18.5% Surge in Enterprise NVMe NAND Flash Substrates",
    headlineAr: "تنبيه لانـتـرا: قفزة مفاجئة بنسبة +18.5% في أسعار شرائح تخزين الخوادم NVMe عالمياً",
    summary: "Production cutbacks in enterprise 3D TLC NAND wafer fabrication combined with rapid sovereign AI datacenter storage deployments have led to an 18.5% price spike for high-end enterprise NVMe arrays.",
    summaryAr: "تخفيض خطوط إنتاج رقائق 3D TLC NAND وتزامنها مع تدشين مراكز بيانات سيادية كبرى أدى لارتفاع حاد بنسبة 18.5% في أسعار وحدات التخزين المؤسسية NVMe.",
    drivers: [
      "Enterprise storage wafer consolidation by primary flash fabricators",
      "High IOPS storage demand for regional AI clusters in Saudi Arabia",
      "Component lead times stretching from 4 weeks to 9 weeks",
    ],
    driversAr: [
      "تركيز مصانع الرقائق على مصفوفات التخزين المؤسسية ذات السعات الضخمة",
      "طلب هائل على التخزين فائق السرعة لمراكز البيانات والذكاء الاصطناعي بالمملكة",
      "تمدد مهل توريد المكونات من المصانع من 4 أسابيع إلى 9 أسابيع",
    ],
    impactOnVendors: {
      meridian: {
        status: "shielded",
        text: "Meridian has dedicated Tier-1 distributor allocations with fixed pricing agreements covering 100% of required storage arrays.",
        textAr: "ميريديان تمتلك حصص توريد مخصصة لدى الموزعين المعتمدين مع اتفاقيات أسعار ثابتة تغطي 100% من السعات المطلوبة.",
      },
      ironclad: {
        status: "vulnerable",
        text: "Ironclad relies on just-in-time overseas freight which carries a 12% surcharge risk if ordered post-award.",
        textAr: "آيرون كلاد تعتمد على التوريد المباشر عند الطلب، مما يعرضها لزيادة بنسبة 12% في حال تأخر الترسية.",
      },
      vantage: {
        status: "critical",
        text: "Vantage uses non-enterprise grade flash buffers that may face forced SKU substitutions due to raw component shortages.",
        textAr: "فانتاج تستخدم وسائط تخزين قد تضطر لاستبدالها بطرازات أخرى بسبب نقص المكونات الخام.",
      },
    },
    recommendedActions: [
      {
        id: "act-lock-bafo",
        title: "Require Guaranteed Storage BOM SKU Binding",
        titleAr: "إلزام الموردين بتثبيت طرازات وسعات التخزين المحددة",
        description: "Prevent post-award component downgrades by mandating exact enterprise NVMe part numbers in final contracts.",
        descriptionAr: "منع أي استبدال للمواصفات بعد الترسية عبر إلزام الموردين بأرقام القطع الدقيقة لوحدات NVMe.",
        actionType: "lock_bafo",
      },
      {
        id: "act-consult-lantra",
        title: "Generate LANTRA Storage TCO Inflation Assessment",
        titleAr: "استعراض تقييم لانـتـرا لتأثير تضخم أسعار التخزين على TCO",
        description: "Consult LANTRA for a detailed analysis on storage lifecycle replacement costs.",
        descriptionAr: "استشارة لانـتـرا للحصول على تحليل تفصيلي لتكاليف استبدال وسائط التخزين على مدار 5 سنوات.",
        actionType: "consult_lantra",
      },
    ],
    lantraDeepDivePrompt: "Analyze the +18.5% NVMe NAND Flash price surge and its impact on the 5-year storage replacement lifecycle in RFQ-2026. How do we ensure vendor compliance?",
    lantraDeepDivePromptAr: "حلل أثر ارتفاع أسعار شرائح تخزين NVMe بنسبة +18.5% على تكلفة التخزين واستبدال الأقراص لخمس سنوات في RFQ-2026 وكيفية ضمان التزام الموردين؟",
  },
  {
    id: "alert-silicon-wafer-surge-2026",
    materialName: "Semiconductor Silicon Wafers & Enterprise Packaging",
    materialNameAr: "رقائق السيليكون الخام ومعالجات الخوادم المركزية",
    category: "CPU & Core Server Infrastructure",
    categoryAr: "المعالجات المركزية والبنية التحتية الأساسية للخوادم",
    currentSpotPrice: "$3,850 / 300mm Advanced Wafer",
    baselinePrice: "$3,330 / 300mm Advanced Wafer",
    percentChange: 15.6,
    direction: "surge",
    severity: "critical",
    detectedAt: "Real-time Feed — Live Monitor",
    headline: "LANTRA Alert: +15.6% Rise in Advanced Silicon Wafer Raw Fabrication Costs",
    headlineAr: "تنبيه لانـتـرا: ارتفاع تكاليف تصنيع رقائق السيليكون الخام ومعالجات الخوادم بنسبة +15.6%",
    summary: "Leading semiconductor packaging facilities report rising costs for raw high-purity silicon ingots and advanced packaging substrates, triggering a potential 6-9% price adjustment for enterprise x86/ARM server CPUs.",
    summaryAr: "أفادت مصانع معالجة السيليكون المتقدمة بارتفاع تكلفة سبائك السيليكون عالية النقاء، مما ينذر بتعديلات سعرية تتراوح بين 6-9% على معالجات الخوادم المؤسسية.",
    drivers: [
      "Raw polysilicon and energy cost increases across Asian foundries",
      "Record backlogs in advanced substrate packaging (CoWoS / FC-BGA)",
      "High lead times favoring suppliers with in-region warehouse stock",
    ],
    driversAr: [
      "ارتفاع تكاليف البولي سيليكون والطاقة في مصانع الرقائق الآسيوية",
      "تراكم طلبات التغليف المتقدم للرقائق الإلكترونية المتقدمة",
      "أفضلية واضحة للموردين الذين يمتلكون مستودعات ومخزوناً جاهزاً بالمنطقة",
    ],
    impactOnVendors: {
      meridian: {
        status: "shielded",
        text: "Meridian operates with guaranteed factory tier-1 reservations and 4-week delivery SLAs from Riyadh staging.",
        textAr: "ميريديان تعمل بحصص مصنعية محجوزة مسبقاً مع التزام تسليم خلال 4 أسابيع من مستودعات الرياض.",
      },
      ironclad: {
        status: "vulnerable",
        text: "Ironclad's 6-week delivery is vulnerable to factory queuing unless expedited purchase orders are issued immediately.",
        textAr: "مهلة آيرون كلاد (6 أسابيع) معرضة للتأخير في طوابير المصانع ما لم يتم إصدار أمر الترسية فوراً.",
      },
      vantage: {
        status: "critical",
        text: "Vantage's 16-week delivery timeline is at high risk of slipping to 20+ weeks due to backend foundry bottlenecks.",
        textAr: "مهلة فانتاج البالغة 16 أسبوعاً مهددة بالتمدد إلى أكثر من 20 أسبوعاً بسبب اختناقات سلاسل الإنتاج.",
      },
    },
    recommendedActions: [
      {
        id: "act-lock-bafo",
        title: "Mandate Delivery Delay Penalties ($2,500/day)",
        titleAr: "تضمين غرامات التأخير اليومية ($2,500/يوم) في العقد",
        description: "Enforce strict liquidated damages clauses in tender documents to mitigate foundry lead time slippage.",
        descriptionAr: "تضمين شروط الغرامات المالية الصارمة لأي تأخير في التوريد لحماية الجدول الزمني للمشروع.",
        actionType: "lock_bafo",
      },
      {
        id: "act-consult-lantra",
        title: "Ask LANTRA for Supply Chain Delivery Risk Strategy",
        titleAr: "استشارة لانـتـرا بشأن استراتيجية إدارة مخاطر سلاسل الإمداد",
        description: "Get tactical negotiation pointers to lock in delivery commitments.",
        descriptionAr: "الحصول على توصيات تفاوضية لتأمين مواعيد التسليم المحددة بدقة.",
        actionType: "consult_lantra",
      },
    ],
    lantraDeepDivePrompt: "How does the +15.6% silicon wafer cost surge impact lead times and server delivery schedules across Meridian, Ironclad, and Vantage in RFQ-2026?",
    lantraDeepDivePromptAr: "كيف يؤثر ارتفاع تكاليف السيليكون الخام بنسبة +15.6% على مدد توريد الخوادم ومواعيد التسليم لميريديان وآيرون كلاد وفانتاج في منافسة RFQ-2026؟",
  },
];

/**
 * Evaluates current market feeds against procurement category thresholds
 */
export function detectMarketMaterialFluctuations(
  category = "Data Center Compute & Server Clusters",
  thresholdPercent = 10.0
): MarketMaterialAlert[] {
  // Returns material alerts exceeding the volatility threshold
  return PRESET_MATERIAL_ALERTS.filter((alert) => Math.abs(alert.percentChange) >= thresholdPercent);
}
