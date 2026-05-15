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

function AppContent() {
  const { user, profile, loading, language } = useApp();
  const t = translations[language] || translations.en;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <motion.div
           animate={{ rotate: 360 }}
           transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
           className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full"
        />
        <p className="mt-4 text-emerald-600 font-medium animate-pulse">{t.appTitle}...</p>
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
      <div className="min-h-screen bg-[#F8FAF9] font-sans selection:bg-emerald-100 selection:text-emerald-900">
        <AppContent />
      </div>
    </AppProvider>
  );
}

