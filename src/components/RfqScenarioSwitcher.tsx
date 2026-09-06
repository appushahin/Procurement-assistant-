import React from "react";
import { Layers, CheckCircle2, ChevronRight, Server, ShieldCheck, Factory } from "lucide-react";
import { RFQ_SCENARIOS } from "../data";
import { AppLanguage, TRANSLATIONS } from "../translations";

interface Props {
  activeScenarioId: string;
  onSelectScenario: (scenario: (typeof RFQ_SCENARIOS)[0]) => void;
  lang?: AppLanguage;
}

const SCENARIO_ICONS: Record<string, React.ReactNode> = {
  "security-command-center": <Server size={18} className="text-cyan-400" />,
  "enterprise-cloud-dr": <ShieldCheck size={18} className="text-emerald-400" />,
  "mining-machinery-fleet": <Factory size={18} className="text-amber-400" />,
};

const SCENARIO_TRANSLATIONS: Record<string, { ar: { category: string; name: string; description: string } }> = {
  "security-command-center": {
    ar: {
      category: "بنية تحتية حرجة ومهمات حيوية",
      name: "خوادم تجاوز الأعطال لمركز القيادة والتحكم الأمني",
      description: "منظومة خوادم مزدوجة فائقة التوافر تدعم أنظمة المراقبة المرئية والتحكم في الدخول على مدار الساعة طوال أيام الأسبوع.",
    },
  },
  "enterprise-cloud-dr": {
    ar: {
      category: "تقنية المعلومات والاتصالات",
      name: "بوابة التعافي من الكوارث السحابية والتخزين المزدوج",
      description: "أجهزة تخزين احتياطية عالية السعة مع نسخ متماثل فوري وتصفير لمخاطر فقدان البيانات.",
    },
  },
  "mining-machinery-fleet": {
    ar: {
      category: "التعدين الثقيل والطاقة",
      name: "أنظمة الطاقة الاحتياطية ووحدات UPS لمواقع التعدين",
      description: "مجموعات مفاتيح كهربائية ووحدات UPS صناعية مزدوجة التغذية مطابقة لمواصفات البيئة القاسية لشركتي معادن وأرامكو.",
    },
  },
};

export function RfqScenarioSwitcher({ activeScenarioId, onSelectScenario, lang = "en" }: Props) {
  const isAr = lang === "ar";
  const t = TRANSLATIONS[lang];

  return (
    <div className="bg-zinc-950/80 p-4 rounded-2xl border border-white/10 mb-8 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-2.5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-cyan-400" />
          <span className="font-mono text-xs uppercase tracking-wider text-zinc-300 font-bold">
            {t.scenariosTitle}
          </span>
        </div>
        <span className="text-[11px] font-mono text-zinc-400">
          {t.scenariosSubtitle}
        </span>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        {RFQ_SCENARIOS.map((scen) => {
          const isSelected = activeScenarioId === scen.id;
          const icon = SCENARIO_ICONS[scen.id] || <Server size={18} className="text-cyan-400" />;
          const arData = SCENARIO_TRANSLATIONS[scen.id]?.ar;

          const categoryText = isAr && arData ? arData.category : scen.category;
          const nameText = isAr && arData ? arData.name : scen.name;
          const descText = isAr && arData ? arData.description : scen.description;

          return (
            <button
              key={scen.id}
              onClick={() => onSelectScenario(scen)}
              className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                isAr ? "text-right" : "text-left"
              } ${
                isSelected
                  ? "bg-cyan-950/50 border-cyan-500 shadow-md shadow-cyan-950/50"
                  : "bg-zinc-900/50 border-white/5 hover:bg-zinc-900 hover:border-white/15"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-zinc-800 border border-white/10">
                      {icon}
                    </div>
                    <span className="text-[10px] font-mono text-cyan-300 uppercase font-semibold">
                      {categoryText}
                    </span>
                  </div>
                  {isSelected && (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded-full border border-cyan-500/40">
                      <CheckCircle2 size={10} /> {t.activeBadge}
                    </span>
                  )}
                </div>
                <h4 className="font-sans font-bold text-sm text-white mb-1">{nameText}</h4>
                <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                  {descText}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-zinc-400">
                <span>{t.competingVendorsCount}</span>
                <span className="text-cyan-400 font-semibold flex items-center gap-0.5">
                  {t.loadSpecsBtn} <ChevronRight size={11} className={isAr ? "rotate-180" : ""} />
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
