import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { db } from "../lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { translations } from "../constants/translations";
import { Check, ArrowRight, Baby, User, Users, Heart, Baby as Pregnancy } from "lucide-react";

export default function Onboarding() {
  const { user, language, setLanguage, refreshProfile } = useApp();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState("user");
  const [ageGroup, setAgeGroup] = useState("");
  const [loading, setLoading] = useState(false);
  
  const t = translations[language] || translations.en;

  const ageGroups = [
    { id: "child", icon: <Baby />, label: "Child (5-12)" },
    { id: "teen", icon: <User />, label: "Teenager (13-19)" },
    { id: "adult", icon: <Users />, label: "Adult (20-60)" },
    { id: "elderly", icon: <Heart />, label: "Elderly (60+)" },
    { id: "pregnant", icon: <Pregnancy />, label: "Pregnant Woman" },
  ];

  const rolesList = [
    { 
      id: "user", 
      label: t.onboarding.roleUserLabel || "Individual User", 
      desc: t.onboarding.roleUserDesc || "Track personal health, BMI, and hydration", 
      icon: <User className="w-6 h-6" /> 
    },
    { 
      id: "parent", 
      label: t.onboarding.roleParentLabel || "Parent / Guardian", 
      desc: t.onboarding.roleParentDesc || "Track child growth, pediatric diet, and family health", 
      icon: <Users className="w-6 h-6" /> 
    },
    { 
      id: "health_worker", 
      label: t.onboarding.roleHealthWorkerLabel || "Health Worker / NGO", 
      desc: t.onboarding.roleHealthWorkerDesc || "Manage community surveys and local health audits", 
      icon: <Heart className="w-6 h-6" /> 
    },
  ];

  const handleFinish = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        language,
        ageGroup,
        onboarded: true,
        role,
        createdAt: serverTimestamp(),
      });
      await refreshProfile();
    } catch (err) {
      console.error("Onboarding failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-6">
      <motion.div 
        layout
        className="bg-[#131B2A] rounded-[40px] shadow-2xl w-full max-w-md overflow-hidden border border-slate-800/85"
      >
        <div className="h-2 bg-slate-900 relative">
            <motion.div 
                animate={{ width: `${(step / 3) * 100}%` }}
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 to-teal-500" 
            />
        </div>

        <div className="p-10 text-slate-100">
            <AnimatePresence mode="wait">
                {step === 1 ? (
                    <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        <h2 className="text-3xl font-black text-white mb-2 leading-tight">{t.onboarding.selectLanguage}</h2>
                        <p className="text-slate-400 font-bold text-sm mb-10 uppercase tracking-widest">Choose your preference</p>
                        
                        <div className="grid grid-cols-1 gap-4 mb-10">
                            {Object.entries(translations).map(([code, trans]: [string, any]) => (
                                <button
                                    key={code}
                                    onClick={() => setLanguage(code)}
                                    className={`flex items-center justify-between p-5 rounded-[24px] border-2 transition-all font-bold ${language === code ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300 shadow-lg' : 'border-slate-800 bg-[#0E1524] text-slate-400 hover:border-slate-700'}`}
                                >
                                    <span className="uppercase tracking-widest text-xs underline-offset-4">{trans.appTitle} ({code.toUpperCase()})</span>
                                    {language === code && <Check className="w-5 h-5 text-emerald-400" />}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => setStep(2)}
                            className="w-full flex items-center justify-center gap-2 py-5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-[24px] font-bold text-lg shadow-xl shadow-emerald-950/30 hover:scale-[1.02] active:scale-95 transition-all"
                        >
                            Next <ArrowRight className="w-5 h-5" />
                        </button>
                    </motion.div>
                ) : step === 2 ? (
                    <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        <h2 className="text-3xl font-black text-white mb-2 leading-tight">{t.onboarding.selectRole}</h2>
                        <p className="text-slate-400 font-bold text-sm mb-8 uppercase tracking-widest">Tailor your app features</p>

                        <div className="grid grid-cols-1 gap-4 mb-10">
                            {rolesList.map((r) => (
                                <button
                                    key={r.id}
                                    onClick={() => setRole(r.id)}
                                    className={`flex items-start gap-4 p-5 rounded-[24px] text-left border-2 transition-all font-bold ${role === r.id ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300 shadow-lg' : 'border-slate-800 bg-[#0E1524] text-slate-450 hover:border-slate-700'}`}
                                >
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors ${role === r.id ? 'bg-emerald-500 text-slate-900 shadow-md shadow-emerald-900/30' : 'bg-slate-800 text-slate-350'}`}>{r.icon}</div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-black text-white leading-tight block mb-1">{r.label}</h4>
                                        <p className="text-xs text-slate-400 font-medium leading-normal">{r.desc}</p>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setStep(1)}
                                className="flex-1 py-5 bg-slate-800 text-slate-300 rounded-[24px] font-bold hover:bg-slate-700 transition-all uppercase tracking-widest text-xs"
                            >
                                Back
                            </button>
                            <button
                                onClick={() => setStep(3)}
                                className="flex-[2] py-5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-[24px] font-bold text-lg shadow-xl shadow-emerald-950/30 hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                Next
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="step3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        <h2 className="text-3xl font-black text-white mb-2 leading-tight">{t.onboarding.aboutYouTitle}</h2>
                        <p className="text-slate-400 font-bold text-sm mb-10 uppercase tracking-widest">{t.onboarding.aboutYouDesc}</p>
                        
                        <div className="grid grid-cols-1 gap-4 mb-10 max-h-[320px] overflow-y-auto no-scrollbar pr-1">
                            {ageGroups.map((group) => (
                                <button
                                    key={group.id}
                                    onClick={() => setAgeGroup(group.id)}
                                    className={`flex items-center gap-5 p-5 rounded-[24px] border-2 transition-all font-bold ${ageGroup === group.id ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300 shadow-lg' : 'border-slate-800 bg-[#0E1524] text-slate-400 hover:border-slate-700'}`}
                                >
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${ageGroup === group.id ? 'bg-emerald-500 text-slate-900 shadow-md shadow-emerald-900/30' : 'bg-slate-800 text-slate-350'}`}>{group.icon}</div>
                                    <span className="text-sm">{group.label}</span>
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setStep(2)}
                                className="flex-1 py-5 bg-slate-800 text-slate-300 rounded-[24px] font-bold hover:bg-slate-700 transition-all uppercase tracking-widest text-xs"
                            >
                                Back
                            </button>
                            <button
                                disabled={!ageGroup || loading}
                                onClick={handleFinish}
                                className={`flex-[2] py-5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-[24px] font-bold text-lg shadow-xl shadow-emerald-950/30 hover:scale-[1.02] active:scale-95 transition-all ${loading ? 'opacity-50' : ''}`}
                            >
                                {loading ? 'Saving...' : 'Finish'}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
