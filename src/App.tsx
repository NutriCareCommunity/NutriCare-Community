/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { translations } from "./constants/translations";
import Landing from "./pages/Landing";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import { motion, AnimatePresence } from "framer-motion";
import { SpeedInsights } from '@vercel/speed-insights/react';

function AppContent() {
  const { user, profile, loading, language } = useApp();
  const t = translations[language] || translations.en;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0B0F19]">
        <motion.div
           animate={{ rotate: 360 }}
           transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
           className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full shadow-lg shadow-emerald-500/20"
        />
        <p className="mt-4 text-emerald-400 font-bold tracking-widest text-xs uppercase animate-pulse">{t.appTitle}...</p>
      </div>
    );
  }

  // Auth gate
  if (!user) {
    return <Landing />;
  }

  // Onboarding gate
  if (!profile || !profile.onboarded) {
    return <Onboarding />;
  }

  return <Dashboard />;
}

export default function App() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-[#0B0F19] text-slate-100 font-sans selection:bg-emerald-800 selection:text-white">
        <AppContent />
        <SpeedInsights />
      </div>
    </AppProvider>
  );
}

