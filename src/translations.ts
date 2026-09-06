export type AppLanguage = "en" | "ar";

export interface TranslationDict {
  // Brand & Header
  appTitle: string;
  appSubtitle: string;
  roleLabel: string;
  themeLabel: string;
  proAssistBtn: string;
  lantraBtn: string;
  lantraHubTitle: string;
  lantraSubTitle: string;
  outlookMailBtn: string;
  exportCsvBtn: string;
  pdfSummaryBtn: string;
  exportWordBtn: string;
  exportPptBtn: string;
  previewExportBtn: string;
  rfqIdLabel: string;

  // Scenarios Header
  scenariosTitle: string;
  scenariosSubtitle: string;
  activeBadge: string;
  loadSpecsBtn: string;
  competingVendorsCount: string;

  // Roles
  roleProcurementOfficer: string;
  roleApprover: string;
  roleClientViewer: string;

  // Themes
  themeWhiteGlow: string;
  themeMidnightObsidian: string;
  themeEnterprisePorcelain: string;
  themeReset: string;

  // Tabs & Sections
  standardizedLedger: string;
  riskAssessment: string;
  saudiCompliance: string;
  weightsMatrix: string;
  radarComparison: string;
  tcoLifecycle: string;
  negotiationSim: string;
  signoffGovernance: string;
  localContentModule: string;
  bafoRevisionTracker: string;

  // Common Actions
  generateRecommendation: string;
  generatingRecommendation: string;
  approveAward: string;
  overrideRecommendation: string;
  resetSignoff: string;
  simulateScenario: string;
  createCounterOffer: string;
  exportAuditDossier: string;
  compareVersions: string;
  switchLanguage: string;

  // Local Content & KSA
  localContentScore: string;
  iktvaScore: string;
  minLocalContentRequired: string;
  hcisApproved: string;
  sasoHomologated: string;
  ncaEccCertified: string;
  ksaDataSovereignty: string;

  // Metrics
  price: string;
  leadTime: string;
  warranty: string;
  failoverCertified: string;
  weightedScore: string;
  disqualified: string;
  winner: string;
  weeks: string;
  years: string;
}

export const TRANSLATIONS: Record<AppLanguage, TranslationDict> = {
  en: {
    appTitle: "Lantern Procurement Intelligence",
    appSubtitle: "Enterprise Governance, TCO Lifecycle & Binary Gate Verification",
    roleLabel: "Role:",
    themeLabel: "Theme",
    proAssistBtn: "LANTRA Copilot",
    lantraBtn: "LANTRA AI Copilot",
    lantraHubTitle: "LANTRA: Security & Evaluation Intelligence Center",
    lantraSubTitle: "Real-time enterprise RFQ evaluation, 5-year TCO analytics & Saudi market intelligence",
    outlookMailBtn: "Outlook Mail",
    exportCsvBtn: "Export CSV",
    pdfSummaryBtn: "PDF Summary",
    exportWordBtn: "Word Dossier",
    exportPptBtn: "PowerPoint Deck",
    previewExportBtn: "Preview & Export",
    rfqIdLabel: "RFQ-2026-0803",

    scenariosTitle: "PRE-SEEDED PROCUREMENT RFQ SCENARIOS",
    scenariosSubtitle: "Switch test packages to stress-test binary gates & scoring algorithms",
    activeBadge: "Active",
    loadSpecsBtn: "Load Specs",
    competingVendorsCount: "3 Competing Vendors",

    roleProcurementOfficer: "Procurement Officer",
    roleApprover: "Approver (VP Level)",
    roleClientViewer: "Client Viewer (Read-Only)",

    themeWhiteGlow: "White Glow (Default)",
    themeMidnightObsidian: "Midnight Obsidian",
    themeEnterprisePorcelain: "Enterprise Porcelain",
    themeReset: "Reset",

    standardizedLedger: "Standardized Comparison Ledger",
    riskAssessment: "Risk Assessment & Outlier Heatmap",
    saudiCompliance: "Saudi Regulatory & Local Content Engine",
    weightsMatrix: "Decision Weights & Evaluative Scoring",
    radarComparison: "Multi-Dimensional Radar Chart",
    tcoLifecycle: "3-to-5 Year Total Cost of Ownership (TCO)",
    negotiationSim: "BAFO Negotiation & Sensitivity Simulator",
    signoffGovernance: "Recommendation & Multi-Tier Signoff",
    localContentModule: "LCGPA & IKTVA Local Content Weighted Criterion",
    bafoRevisionTracker: "BAFO Quote Amendment Diff Inspector",

    generateRecommendation: "Generate Executive Recommendation",
    generatingRecommendation: "Synthesizing Multi-Vendor Proposal Data...",
    approveAward: "Authorize Award & Sign Off",
    overrideRecommendation: "Override & Award Alternative Vendor",
    resetSignoff: "Reset Sign-Off Record",
    simulateScenario: "Simulate Negotiation Sensitivity",
    createCounterOffer: "Generate AI Counter-Offer Playbook",
    exportAuditDossier: "Export Executive Audit Dossier (PDF)",
    compareVersions: "Compare Quote Revision (BAFO Diff)",
    switchLanguage: "العربية (Arabic)",

    localContentScore: "Local Content (LCGPA / IKTVA)",
    iktvaScore: "IKTVA Ratio",
    minLocalContentRequired: "Min Threshold Required",
    hcisApproved: "HCIS Directive Approved",
    sasoHomologated: "SASO / CST Homologated",
    ncaEccCertified: "NCA ECC Cybersecurity Compliant",
    ksaDataSovereignty: "KSA Cloud Data Sovereignty",

    price: "Price",
    leadTime: "Lead Time",
    warranty: "Warranty",
    failoverCertified: "Failover Pre-Certified",
    weightedScore: "Weighted Score",
    disqualified: "Disqualified",
    winner: "Top Ranked Awardee",
    weeks: "weeks",
    years: "years",
  },
  ar: {
    appTitle: "منصة فانوس للذكاء الشرائي والحوكمة",
    appSubtitle: "نظام حوكمة المشتريات المؤسسية، التكلفة الإجمالية للملكية (TCO)، وبوابات الامتثال الصارمة",
    roleLabel: "الدور:",
    themeLabel: "المظهر",
    proAssistBtn: "مساعد لانـتـرا (LANTRA)",
    lantraBtn: "لانـتـرا (LANTRA AI)",
    lantraHubTitle: "مركز لانـتـرا للأمن والحوكمة والذكاء الشرائي",
    lantraSubTitle: "التقييم الفوري لعروض الموردين، حساب التكلفة الإجمالية (TCO)، والذكاء السوقي السعودي",
    outlookMailBtn: "بريد أوتلوك",
    exportCsvBtn: "تصدير CSV",
    pdfSummaryBtn: "الملف التنفيذي (PDF)",
    exportWordBtn: "تقرير وورد (Word)",
    exportPptBtn: "عرض بوربوينت (PPT)",
    previewExportBtn: "معاينة وتدقيق التقرير",
    rfqIdLabel: "طلب عروض RFQ-2026-0803",

    scenariosTitle: "سيناريوهات وحزم طلبات العروض (RFQ) المجهزة مسبقاً",
    scenariosSubtitle: "تبديل حزم الاختبار لفحص بوابات الامتثال الإلزامية وخوارزميات التقييم الموزون",
    activeBadge: "النشط حالياً",
    loadSpecsBtn: "تحميل المواصفات",
    competingVendorsCount: "3 عروض موردين متنافسين",

    roleProcurementOfficer: "مسؤول المشتريات والتفاوض",
    roleApprover: "المعتمد التنفيذي (مستوى نائب الرئيس)",
    roleClientViewer: "مراقب الحوكمة (قراءة فقط)",

    themeWhiteGlow: "التوهج الأبيض (الافتراضي)",
    themeMidnightObsidian: "سبج منتصف الليل المظلم",
    themeEnterprisePorcelain: "البورسلين المؤسسي الفاتح",
    themeReset: "إعادة ضبط",

    standardizedLedger: "جدول المقارنة المعياري الموحد",
    riskAssessment: "مصفوفة تحليل المخاطر والنقاط الشاذة",
    saudiCompliance: "محرك الامتثال للأنظمة السعودية والمحتوى المحلي",
    weightsMatrix: "أوزان معايير التقييم والترجيح",
    radarComparison: "مخطط الرادار متعدد الأبعاد",
    tcoLifecycle: "تحليل التكلفة الإجمالية للملكية (3-5 سنوات)",
    negotiationSim: "محاكي حساسية التفاوض والعروض النهائية (BAFO)",
    signoffGovernance: "التوصية التنفيذية والاعتماد متعدد المستويات",
    localContentModule: "معيار المحتوى المحلي الموزون (هيئة المحتوى المحلي واكتفاء)",
    bafoRevisionTracker: "فاحص الفروقات بين مراجعات عروض الأسعار (BAFO Diff)",

    generateRecommendation: "توليد التوصية التنفيذية الذكية",
    generatingRecommendation: "جاري تحليل ومطابقة عروض الموردين...",
    approveAward: "اعتماد الترسية والتوقيع النهائي",
    overrideRecommendation: "تجاوز التوصية والترسية على مورد بديل",
    resetSignoff: "إعادة ضبط سجل الاعتماد",
    simulateScenario: "محاكاة سيناريوهات التفاوض",
    createCounterOffer: "إنشاء خطة التفاوض ومسودة العرض المقابل",
    exportAuditDossier: "تصدير الملف التنفيذي للتدقيق (PDF)",
    compareVersions: "مقارنة تعديلات عروض الأسعار",
    switchLanguage: "English",

    localContentScore: "نسبة المحتوى المحلي (LCGPA / اكتفاء)",
    iktvaScore: "مؤشر اكتفاء",
    minLocalContentRequired: "الحد الأدنى الإلزامي للمحتوى المحلي",
    hcisApproved: "معتمد من الهيئة العليا للأمن الصناعي (HCIS)",
    sasoHomologated: "مطابق للمواصفات السعودية وهيئة الاتصالات (SASO/CST)",
    ncaEccCertified: "ملتزم بضوابط الأمن السيبراني (NCA ECC)",
    ksaDataSovereignty: "استضافة البيانات داخل المملكة (السيادة الرقمية)",

    price: "السعر",
    leadTime: "مدة التوريد",
    warranty: "فترة الضمان",
    failoverCertified: "جاهزية تجاوز الأعطال المعتمدة",
    weightedScore: "الدرجة المرجحة",
    disqualified: "مستبعد لعدم استيفاء البوابة الإلزامية",
    winner: "المورد الفائز الموصى به",
    weeks: "أسابيع",
    years: "سنوات",
  },
};
