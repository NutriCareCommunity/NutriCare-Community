import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { getMealPlan } from "../../services/gemini";
import { motion, AnimatePresence } from "framer-motion";
import { 
  IndianRupee, 
  Sparkles, 
  Coffee, 
  Sun, 
  Moon, 
  Cookie,
  Target,
  RefreshCw
} from "lucide-react";
import { translations } from "../../constants/translations";

export default function MealPlannerView() {
  const { language, profile, appMode } = useApp();
  const [budget, setBudget] = useState(150);
  const [goal, setGoal] = useState("Weight Loss");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<any>(null);

  const t = translations[language] || translations.en;
  const mpt = t.mealPlanner || translations.en.mealPlanner;

  const goalLabels: Record<string, string> = {
    "Weight Loss": language === "te" ? "బరువు తగ్గడం" : language === "hi" ? "वजन घटाना" : language === "ta" ? "எடை இழப்பு" : language === "kn" ? "ತೂಕ ಇಳಿಕೆ" : "Weight Loss",
    "Muscle Gain": language === "te" ? "కండరాల పెరుగుదల" : language === "hi" ? "मांसपेशियों का निर्माण" : language === "ta" ? "தசை அதிகரிப்பு" : language === "kn" ? "ಸ್ನಾಯುಗಳ ಬೆಳವಣಿಗೆ" : "Muscle Gain",
    "Diabetes Friendly": language === "te" ? "డయాబెటిస్ స్నేహపూర్వక" : language === "hi" ? "मधुमेह अनुकूल" : language === "ta" ? "நீரிழிவு நோய்க்கு உகந்தது" : language === "kn" ? "ಮಧುಮೇಹ ಸ್ನೇಹಿ" : "Diabetes Friendly",
    "Balanced Diet": language === "te" ? "సమతుల్య ఆహారం" : language === "hi" ? "संतुलित आहार" : language === "ta" ? "சீரான உணவு" : language === "kn" ? "ಸಮತೋಲನ ಆಹಾರ" : "Balanced Diet"
  };

  const handleGenerate = async () => {
    setLoading(true);
    const result = await getMealPlan(language, budget, goal, appMode);
    setPlan(result);
    setLoading(false);
  };

  return (
    <div className="space-y-8">
      {/* Configuration */}
      {!plan && (
        <section className="bg-white/40 glass-card rounded-[48px] p-10 border-white shadow-3xl shadow-indigo-100/50 space-y-10">
            <div className="space-y-4">
                <h2 className="text-4xl font-black text-indigo-900 leading-[0.9] tracking-tighter">{mpt.configTitle}</h2>
                <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">{mpt.configSubtitle}</p>
            </div>
            
            <div className="space-y-6">
                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] flex items-center gap-3">
                    <IndianRupee className="w-5 h-5 p-1 bg-indigo-50 rounded-lg" /> {mpt.dailyBudget}
                </label>
                <div className="relative pt-8">
                    <input 
                        type="range" min="50" max="500" step="10" value={budget}
                        onChange={(e) => setBudget(Number(e.target.value))}
                        className="w-full h-3 bg-gray-100 rounded-full appearance-none cursor-pointer accent-indigo-600"
                    />
                    <div className="absolute -top-4 right-0 bg-indigo-600 text-white text-[15px] font-black px-5 py-2 rounded-2xl shadow-xl shadow-indigo-100 border-2 border-white">
                        ₹{budget}
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] flex items-center gap-3">
                    <Target className="w-5 h-5 p-1 bg-indigo-50 rounded-lg" /> {mpt.healthFocus}
                </label>
                <div className="grid grid-cols-2 gap-4">
                    {["Weight Loss", "Muscle Gain", "Diabetes Friendly", "Balanced Diet"].map((g) => (
                        <button
                            key={g} onClick={() => setGoal(g)}
                            className={`p-5 rounded-[28px] text-[11px] font-black uppercase tracking-widest transition-all border-2 ${goal === g ? 'bg-indigo-900 border-indigo-900 text-white shadow-2xl shadow-indigo-200' : 'bg-white border-indigo-50 text-indigo-300 hover:border-indigo-100'}`}
                        >
                            {goalLabels[g] || g}
                        </button>
                    ))}
                </div>
            </div>

            <button
                onClick={handleGenerate} disabled={loading}
                className="w-full py-6 gradient-indigo text-white rounded-[32px] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-indigo-100 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4"
            >
                {loading ? <RefreshCw className="w-6 h-6 animate-spin" /> : <><Sparkles className="w-6 h-6" /> {mpt.createMenu}</>}
            </button>
        </section>
      )}

      {/* Plan Output */}
      <AnimatePresence>
        {plan && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-3xl font-black text-indigo-950 tracking-tighter">{mpt.yourJoyMenu}</h2>
                    <button onClick={() => setPlan(null)} className="w-14 h-14 bg-white/40 glass-card rounded-2xl flex items-center justify-center text-gray-400 hover:text-indigo-600 transition-all"><RefreshCw className="w-6 h-6" /></button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <MealCard icon={<Coffee className="w-6 h-6 md:w-8 md:h-8" />} label={mpt.breakfast} meal={plan.breakfast} color="orange" />
                    <MealCard icon={<Sun className="w-6 h-6 md:w-8 md:h-8" />} label={mpt.lunch} meal={plan.lunch} color="emerald" />
                    <MealCard icon={<Cookie className="w-6 h-6 md:w-8 md:h-8" />} label={mpt.snacks} meal={plan.snacks} color="sky" />
                    <MealCard icon={<Moon className="w-6 h-6 md:w-8 md:h-8" />} label={mpt.dinner} meal={plan.dinner} color="indigo" />
                </div>

                {plan.caringTip && (
                    <div className="p-10 bg-indigo-900 rounded-[56px] text-white relative overflow-hidden shadow-3xl shadow-indigo-100">
                        <div className="absolute top-0 right-0 p-8 opacity-20 rotate-12 scale-150 font-black">✨</div>
                        <h4 className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] mb-6 text-indigo-300">
                             {mpt.caringTip}
                        </h4>
                        <p className="text-xl font-bold leading-relaxed">{plan.caringTip}</p>
                    </div>
                )}
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MealCard({ icon, label, meal, color }: any) {
    const bgColors: any = {
        orange: "bg-orange-50 text-orange-500",
        emerald: "bg-emerald-50 text-emerald-500",
        sky: "bg-sky-50 text-sky-500",
        indigo: "bg-indigo-50 text-indigo-500"
    };

    return (
        <div className="bg-white p-6 md:p-8 rounded-[40px] border border-gray-100 shadow-sm flex items-center gap-6 group hover:border-indigo-100 transition-all">
            <div className={`w-14 h-14 md:w-20 md:h-20 ${bgColors[color]} rounded-3xl flex items-center justify-center shadow-inner flex-shrink-0 transition-transform group-hover:scale-110`}>{icon}</div>
            <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">{label}</span>
                <p className="text-gray-800 font-bold leading-tight md:text-lg">{meal}</p>
            </div>
            <div className="ml-auto hidden sm:block">
                 <button className="p-3 bg-gray-50 rounded-2xl text-gray-300 hover:text-indigo-500 transition-all">
                    <RefreshCw className="w-5 h-5" />
                 </button>
            </div>
        </div>
    )
}
