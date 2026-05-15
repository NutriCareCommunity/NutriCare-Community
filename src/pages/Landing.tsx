import React from "react";
import { auth } from "../lib/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { motion } from "framer-motion";
import { translations } from "../constants/translations";
import { useApp } from "../context/AppContext";
import { ShieldCheck, HeartPulse, Apple, Users, Languages } from "lucide-react";

export default function Landing() {
  const { language, setLanguage } = useApp();
  const t = translations[language] || translations.en;

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAF9] text-gray-800">
      {/* Hero Section */}
      <header className="relative px-6 pt-16 pb-24 lg:pt-32 lg:pb-32 overflow-hidden bg-white/50 backdrop-blur-md">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-green-200/20 rounded-full blur-3xl rounded-full" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl rounded-full" />
        
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mb-8 bg-green-50 px-5 py-2 rounded-full border border-green-100 shadow-sm"
          >
            <ShieldCheck className="w-4 h-4 text-green-600" />
            <span className="text-xs font-bold text-green-700 tracking-[0.15em] uppercase">Dedicated to India's Health</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl lg:text-8xl font-black text-gray-900 tracking-tight leading-none mb-8"
          >
            {t.appTitle}
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg lg:text-2xl text-gray-500 max-w-3xl mx-auto mb-12 font-medium leading-relaxed"
          >
            {t.tagline}. A multilingual platform built for every family in India.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto"
          >
            <button
              onClick={handleLogin}
              className="px-10 py-5 gradient-green text-white rounded-[24px] font-bold text-lg shadow-2xl shadow-green-200 hover:scale-105 active:scale-95 transition-all"
            >
              {t.onboarding.getStarted}
            </button>
            <div className="flex bg-white/80 backdrop-blur-sm border border-gray-100 rounded-[24px] overflow-hidden p-1.5 shadow-xl shadow-gray-200/50">
                {['en', 'hi', 'te'].map((l) => (
                    <button
                        key={l}
                        onClick={() => setLanguage(l)}
                        className={`px-6 py-3 rounded-[18px] text-[10px] font-bold tracking-widest transition-all ${language === l ? 'bg-gray-800 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}
                    >
                        {l.toUpperCase()}
                    </button>
                ))}
            </div>
          </motion.div>
        </div>
      </header>

      {/* Features Grid */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-10">
            <FeatureCard 
                icon={<HeartPulse className="w-8 h-8 text-rose-500" />}
                title="AI Health Guide"
                desc="Get personalized nutrition advice in your local language powered by Gemini AI."
                color="rose"
            />
            <FeatureCard 
                icon={<Apple className="w-8 h-8 text-green-500" />}
                title="Budget Meals"
                desc="Affordable Indian meal plans tailored to your nutritional needs and daily budget."
                color="green"
            />
            <FeatureCard 
                icon={<Languages className="w-8 h-8 text-blue-500" />}
                title="Multilingual"
                desc="Building inclusivity with Telugu, Hindi, Tamil, Kannada, and English support."
                color="blue"
            />
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold mb-12">Empowering Every Indian Community</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <Stat icon={<Users />} val="India" label="Localized" />
                <Stat icon={<ShieldCheck />} val="Secure" label="Private Data" />
                <Stat icon={<HeartPulse />} val="Free" label="Accessible" />
                <Stat icon={<Apple />} val="Smart" label="AI Powered" />
            </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, desc, color }: any) {
  const bgColors: any = {
    rose: "bg-rose-50 text-rose-500",
    green: "bg-green-50 text-green-500",
    blue: "bg-blue-50 text-blue-500"
  }
  return (
    <motion.div 
        whileHover={{ y: -5 }}
        className="p-10 bg-white border border-gray-100 rounded-[40px] shadow-sm hover:shadow-2xl transition-all"
    >
      <div className={`p-4 rounded-[20px] w-fit mb-8 ${bgColors[color]}`}>{icon}</div>
      <h3 className="text-xl font-bold mb-4 text-gray-800">{title}</h3>
      <p className="text-gray-500 leading-relaxed font-semibold text-sm">{desc}</p>
    </motion.div>
  );
}

function Stat({ icon, val, label }: any) {
    return (
        <div className="flex flex-col items-center">
            <div className="p-4 bg-green-50 rounded-[20px] mb-4 text-green-600 shadow-sm">{icon}</div>
            <div className="text-2xl font-black text-gray-800 tracking-tight">{val}</div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{label}</div>
        </div>
    )
}
