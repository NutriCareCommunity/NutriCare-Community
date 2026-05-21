import React, { useState } from "react";
import { auth } from "../lib/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import { translations } from "../constants/translations";
import { useApp } from "../context/AppContext";
import { ShieldCheck, HeartPulse, Apple, Users, Languages, AlertTriangle, ExternalLink, Copy, Check, X } from "lucide-react";

export default function Landing() {
  const { language, setLanguage } = useApp();
  const t = translations[language] || translations.en;
  
  const [authError, setAuthError] = useState<{ code: string; message: string; domain: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleLogin = async () => {
    setAuthError(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error("Login failed:", err);
      setAuthError({
        code: err?.code || "unknown",
        message: err?.message || "An unexpected authentication error occurred.",
        domain: window.location.hostname
      });
    }
  };

  const copyDomain = () => {
    if (authError) {
      navigator.clipboard.writeText(authError.domain);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const firebaseProjectId = auth.app.options.projectId;

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAF9] text-gray-800">
      {/* Auth Error Notification Modal/Banner */}
      <AnimatePresence>
        {authError && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed inset-x-0 top-0 z-50 p-4 max-w-2xl mx-auto mt-6"
          >
            <div className="bg-white rounded-[32px] border-2 border-amber-200 p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-amber-500" />
              <button 
                onClick={() => setAuthError(null)} 
                className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-all text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="flex gap-5 items-start">
                <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl flex-shrink-0">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <div className="space-y-4 flex-1">
                  <h3 className="text-xl font-black text-gray-900 tracking-tight">
                    Firebase Auth Configuration Required
                  </h3>
                  
                  {authError.code === "auth/unauthorized-domain" ? (
                    <div className="space-y-4 text-sm text-gray-600 leading-relaxed font-semibold">
                      <p>
                        Since you are hosting on Vercel, Firebase needs to authorize your production domain before Google sign-in works.
                      </p>
                      <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between gap-4">
                        <code className="text-xs font-mono font-black text-gray-800 select-all">{authError.domain}</code>
                        <button 
                          onClick={copyDomain}
                          className="px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-xs font-bold text-gray-700 flex items-center gap-2 shadow-sm whitespace-nowrap active:scale-95 transition-all"
                        >
                          {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                          {copied ? "Copied" : "Copy "}
                        </button>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest">How to Authorize with 3 Clicks:</h4>
                        <ol className="list-decimal list-inside space-y-1.5 pl-1">
                          <li>Open your Firebase Console by clicking <strong>Open Settings</strong> below</li>
                          <li>Go to the <strong>Settings tab</strong>, then click <strong>Authorized Domains</strong></li>
                          <li>Click <strong>Add Domain</strong> and paste your copied Vercel domain</li>
                        </ol>
                      </div>

                      <div className="pt-2 flex gap-3">
                        <a 
                          href={`https://console.firebase.google.com/project/${firebaseProjectId}/authentication/settings`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-amber-200 transition-all"
                        >
                          Open Firebase Settings <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button 
                          onClick={handleLogin}
                          className="px-6 py-3 bg-gray-100 font-black text-xs text-gray-800 rounded-xl hover:bg-gray-200 transition-all uppercase tracking-widest"
                        >
                          Try Again
                        </button>
                      </div>
                    </div>
                  ) : authError.code === "auth/popup-blocked" ? (
                    <div className="space-y-4 text-sm text-gray-600 leading-relaxed font-semibold">
                      <p>
                        Your browser blocked the Google Authentication window from opening.
                      </p>
                      <div className="space-y-1 text-xs">
                        <p>💡 Close any active blockers, or enable popups for this site in your address bar.</p>
                        <p>💡 If nesting inside an iframe, please open the direct deployment URL in a separate Tab.</p>
                      </div>
                      <button 
                        onClick={handleLogin}
                        className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-amber-200 transition-all"
                      >
                        Try Launching Pop-up Again
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 text-sm text-gray-600 leading-relaxed font-semibold">
                      <p>Error details returned from Firebase:</p>
                      <p className="p-3 bg-rose-50 text-rose-700 rounded-xl font-mono text-xs break-all">{authError.message}</p>
                      <p className="text-xs text-gray-400">Code: {authError.code}</p>
                      <button 
                        onClick={handleLogin}
                        className="mt-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all"
                      >
                        Retry Sign-In
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
