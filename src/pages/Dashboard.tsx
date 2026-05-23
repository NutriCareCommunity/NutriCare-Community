import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { translations } from "../constants/translations";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Home, 
  MessageSquare, 
  Activity, 
  User, 
  Globe,
  Bell,
  Settings,
  Mic,
  X,
  Speaker,
  ShieldCheck,
  ChevronRight,
  Plus,
  Sparkles
} from "lucide-react";
import HomeView from "./views/HomeView";
import AIChatView from "./views/AIChatView";
import TrackersView from "./views/TrackersView";
import ProfileView from "./views/ProfileView";
import LearningView from "./views/LearningView";
import AdminDashboard from "./AdminDashboard";
import { NotificationEngine, HealthNudge } from "../services/notificationService";
import { auth } from "../lib/firebase";

export default function Dashboard() {
  const { language, profile, appMode, activeTab, setActiveTab } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [nudges, setNudges] = useState<HealthNudge[]>([]);
  const t = translations[language] || translations.en;

  useEffect(() => {
    if (auth.currentUser) {
      const unsubscribe = NotificationEngine.subscribeToNudges(auth.currentUser.uid, (data) => {
        setNudges(data);
      });
      return () => unsubscribe();
    }
  }, []);

  const handleMarkRead = async (id: string) => {
    if (auth.currentUser) {
      await NotificationEngine.markAsRead(auth.currentUser.uid, id);
    }
  };

  const unreadCount = nudges.filter(n => !n.isRead).length;
  const isAdmin = profile?.role === "admin" || profile?.role === "super_admin";

  const tabs = [
    { id: "home", label: t.dashboard.home, icon: <Home className="w-6 h-6" /> },
    { id: "ai", label: t.dashboard.aiChat, icon: <MessageSquare className="w-6 h-6" /> },
    { id: "trackers", label: t.dashboard.tracker, icon: <Activity className="w-6 h-6" /> },
    { id: "learning", label: t.dashboard.academy || "Academy", icon: <Globe className="w-6 h-6" /> },
    { id: "profile", label: t.dashboard.profile, icon: <User className="w-6 h-6" /> },
  ];

  if (isAdmin) {
    tabs.push({ id: "admin", label: t.dashboard.admin || "NGO Portal", icon: <ShieldCheck className="w-6 h-6" /> });
  }

  return (
    <div className={`flex flex-col min-h-screen bg-[#0B0F19] text-slate-100 selection:bg-indigo-950/80 ${appMode === 'elder' ? 'text-xl' : ''}`}>
      {/* Premium Header */}
      <header className="sticky top-0 z-40 bg-[#0B0F19]/80 backdrop-blur-3xl border-b border-slate-800/65 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto w-full">
            <div className="flex items-center gap-3">
                <motion.div 
                    whileHover={{ rotate: 15 }}
                    className="w-12 h-12 bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-950/40 border-2 border-white/20"
                >
                    <Activity className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                    <h1 className="text-xl font-black text-white tracking-tighter leading-none">NutriCare</h1>
                    <div className="flex items-center gap-1.5 mt-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <p className="text-[10px] font-black text-emerald-400 tracking-widest uppercase">{appMode} Edition</p>
                    </div>
                </div>
            </div>
            
            <div className="flex items-center gap-2">
                <div className="relative">
                    <button 
                        onClick={() => setShowNotifications(!showNotifications)}
                        className={`p-3 rounded-2xl transition-all relative ${showNotifications ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-800 text-slate-300 border border-slate-700/60 hover:bg-slate-700/80'}`}
                    >
                        <Bell className="w-5 h-5" />
                        {unreadCount > 0 && <span className="absolute top-2.5 right-2.5 w-3 h-3 bg-rose-500 rounded-full border-2 border-slate-900 flex items-center justify-center text-[6px] font-black text-white">{unreadCount}</span>}
                    </button>
                    
                    <AnimatePresence>
                        {showNotifications && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                                className="absolute right-0 mt-4 w-80 bg-[#121B2A]/95 border border-slate-800 shadow-2xl rounded-[40px] p-6 z-50 overflow-hidden backdrop-blur-2xl"
                            >
                                <div className="flex justify-between items-center mb-6">
                                    <h4 className="font-black text-white text-lg">AI Insights</h4>
                                    <button onClick={() => setShowNotifications(false)} className="p-2 bg-slate-850 rounded-full hover:bg-slate-800 transition-colors"><X className="w-4 h-4 text-slate-300" /></button>
                                </div>
                                <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar">
                                    {nudges.length > 0 ? nudges.map((n) => (
                                        <div 
                                            key={n.id} 
                                            onClick={() => handleMarkRead(n.id)}
                                            className={`p-4 rounded-3xl border flex gap-4 items-start transition-all cursor-pointer ${n.isRead ? 'bg-slate-900/60 border-slate-800/40 opacity-40' : 'bg-[#1D283C] border-slate-700/60 shadow-md hover:border-indigo-500/50'}`}
                                        >
                                            <div className={`w-10 h-10 rounded-xl flex flex-shrink-0 items-center justify-center text-lg ${n.isRead ? 'bg-slate-800 text-slate-400' : 'bg-indigo-950/60 text-indigo-400 border border-indigo-900/40'}`}>
                                                {n.category === 'nutrition' ? <Sparkles className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-slate-100 leading-tight">{n.content}</p>
                                                <p className="text-[10px] font-bold text-slate-450 uppercase tracking-widest mt-1">
                                                    {n.category} • New
                                                </p>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="py-12 text-center text-indigo-300">
                                            <div className="w-16 h-16 bg-indigo-950/80 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-900/30"><ShieldCheck className="w-8 h-8 text-indigo-400" /></div>
                                            <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">No alerts right now</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
      </header>

      {/* Main Experience Viewport */}
      <main className="flex-1 pb-32 bg-[#0B0F19]">
        <div className="max-w-7xl mx-auto w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, scale: 0.98, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -20 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="p-6 h-full"
              >
                {activeTab === "home" && <HomeView />}
                {activeTab === "ai" && <AIChatView />}
                {activeTab === "trackers" && <TrackersView />}
                {activeTab === "learning" && <LearningView />}
                {activeTab === "profile" && <ProfileView />}
                {activeTab === "admin" && <AdminDashboard />}
              </motion.div>
            </AnimatePresence>
        </div>
      </main>

      {/* Voice Assistant Floating Mic */}
      <div className="fixed bottom-28 right-6 z-50">
        <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsListening(!isListening)}
            className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all relative overflow-hidden group ${isListening ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white' : 'bg-slate-800 border-4 border-slate-900'}`}
        >
            {isListening && (
                <motion.div 
                    animate={{ scale: [1, 2, 1], opacity: [0.3, 0.1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="absolute inset-0 bg-white"
                />
            )}
            <Mic className={`w-8 h-8 ${isListening ? 'text-white' : 'text-slate-200'}`} />
            {isListening && <motion.div className="absolute inset-0 border-4 border-white/20 rounded-full animate-ping" />}
        </motion.button>
        <AnimatePresence>
            {isListening && (
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="absolute right-20 top-0 bottom-0 flex items-center pr-4"
                >
                    <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-800 px-6 py-3 rounded-full shadow-2xl flex items-center gap-3">
                        <Speaker className="w-4 h-4 text-rose-400 animate-bounce" />
                        <span className="text-xs font-black text-white uppercase tracking-widest whitespace-nowrap">Listening...</span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      {/* Premium Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-24 bg-[#0F172A]/90 backdrop-blur-3xl border-t border-slate-800/80 flex flex-col justify-center px-4 z-40 nav-shadow">
        <div className="max-w-3xl mx-auto w-full flex items-center justify-around relative">
          {tabs.map((tab, i) => {
            const isActive = activeTab === tab.id;
            if (i === 2) {
              return (
                <div key={tab.id} className="-mt-20 relative px-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveTab(tab.id)}
                    className="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-[24px] flex items-center justify-center shadow-2xl shadow-emerald-500/20 border-4 border-slate-950 relative group transition-all"
                  >
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
                    <Activity className="w-8 h-8 text-white animate-pulse" />
                  </motion.button>
                  <span className={`absolute -bottom-8 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase tracking-tighter transition-colors whitespace-nowrap ${isActive ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {tab.label}
                  </span>
                </div>
              )
            }
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center transition-all ${
                  isActive ? "text-emerald-400" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <div className={`transition-all duration-300 ${isActive ? 'scale-110 -translate-y-1' : ''}`}>
                  {React.cloneElement(tab.icon as any, { className: isActive ? "w-6 h-6 stroke-[3px]" : "w-6 h-6 stroke-[2px]" })}
                </div>
                <span className={`text-[9px] font-black mt-1 uppercase tracking-tighter transition-all ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                  {tab.label}
                </span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  );
}
