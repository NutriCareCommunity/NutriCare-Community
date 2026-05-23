import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { motion, AnimatePresence } from "framer-motion";
import { translations } from "../../constants/translations";
import { 
  Settings, 
  ChevronRight, 
  LogOut, 
  User, 
  Bell, 
  Shield, 
  Users, 
  Award, 
  CreditCard, 
  Trophy,
  Activity,
  ArrowUpRight,
  Plus,
  Heart,
  Share2,
  Globe,
  HelpCircle,
  Sun,
  Moon,
  Smartphone,
  Sparkles
} from "lucide-react";
import { auth } from "../../lib/firebase";

export default function ProfileView() {
  const { profile, user, language, setLanguage, theme, setTheme, appMode, setAppMode } = useApp();
  const [activeTab, setActiveTab] = useState("profile");
  const t = translations[language] || translations.en;

  const badges = [
    { name: "Early Bird", icon: "🌅", level: "Gold" },
    { name: "Water Master", icon: "💧", level: "Bronze" },
    { name: "Village Hero", icon: "🤝", level: "Silver" },
  ];

  return (
    <div className="space-y-8 pb-32">
      <header className="flex justify-between items-center px-4">
        <h2 className="text-3xl font-black text-gray-800 tracking-tight">{t.dashboard.profile || "Account"}</h2>
        <div className="flex gap-2">
            <button className="p-3 bg-white rounded-2xl border border-gray-100 shadow-sm text-gray-400 hover:text-indigo-500 transition-colors"><Bell className="w-5 h-5" /></button>
            <button className="p-3 bg-white rounded-2xl border border-gray-100 shadow-sm text-gray-400 hover:text-indigo-500 transition-colors"><Settings className="w-5 h-5" /></button>
        </div>
      </header>

      {/* Profile Header Card */}
      <section className="bg-white rounded-[48px] p-8 border border-gray-100 shadow-sm text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-indigo-500/5 opacity-50" />
        <div className="relative z-10 flex flex-col items-center">
            <div className="relative w-32 h-32 mb-6">
                <div className="absolute inset-0 bg-indigo-500 rounded-full blur-xl opacity-20" />
                <div className="w-full h-full gradient-indigo rounded-full border-4 border-white shadow-xl flex items-center justify-center text-5xl text-white font-black">
                    {profile?.displayName?.[0] || <User className="w-12 h-12" />}
                </div>
                <div className="absolute bottom-0 right-0 w-10 h-10 gradient-orange rounded-2xl border-4 border-white flex items-center justify-center text-white shadow-lg">
                    <Trophy className="w-5 h-5" />
                </div>
            </div>
            <h3 className="text-2xl font-black text-gray-800">{profile?.displayName || "Health Champion"}</h3>
            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">Village Impact Level: <span className="text-indigo-500">Elite</span></p>
            
            <div className="flex gap-4 mt-8 w-full">
                <div className="flex-1 bg-gray-50 p-4 rounded-3xl border border-gray-100">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Streak</p>
                    <p className="text-xl font-black text-gray-800">{profile?.streak || 5} Days</p>
                </div>
                <div className="flex-1 bg-gray-50 p-4 rounded-3xl border border-gray-100">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Health Points</p>
                    <p className="text-xl font-black text-emerald-500">{profile?.points || 842}</p>
                </div>
            </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex gap-2 p-2 bg-white rounded-[32px] border border-gray-100 shadow-sm">
        {['profile', 'family', 'badges'].map(tab => (
            <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-indigo-900 text-white shadow-lg shadow-indigo-100' : 'text-gray-400 hover:bg-gray-50'}`}
            >
                {tab}
            </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-6"
        >
            {activeTab === 'profile' && (
                <div className="space-y-4">
                    {/* Language Preference Card */}
                    <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center justify-between group">
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center"><Globe className="w-6 h-6" /></div>
                            <span className="font-bold text-gray-800">Language</span>
                        </div>
                        <select 
                            value={language} 
                            onChange={(e) => setLanguage(e.target.value)}
                            className="bg-gray-100 text-[10px] font-black text-gray-600 px-4 py-2 rounded-full outline-none border-none focus:ring-0 uppercase tracking-widest"
                        >
                            {Object.keys(translations).map(l => (
                                <option key={l} value={l}>{l.toUpperCase()}</option>
                            ))}
                        </select>
                    </div>

                    {/* Theme Preference Card */}
                    <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center justify-between group">
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 bg-gray-50 md:bg-indigo-50/20 text-indigo-500 rounded-2xl flex items-center justify-center">
                              {theme === 'light' ? <Sun className="w-6 h-6" /> : theme === 'dark' ? <Moon className="w-6 h-6" /> : <Smartphone className="w-6 h-6" />}
                            </div>
                            <span className="font-bold text-gray-800">{t.profilePage?.chooseTheme || "Theme Mode"}</span>
                        </div>
                        <select 
                            value={theme} 
                            onChange={(e) => setTheme(e.target.value as any)}
                            className="bg-gray-100 text-[10px] font-black text-gray-600 px-4 py-2 rounded-full outline-none border-none focus:ring-0 uppercase tracking-widest"
                        >
                            <option value="light">{t.profilePage?.light || "Light"}</option>
                            <option value="dark">{t.profilePage?.dark || "Dark"}</option>
                            <option value="device">{t.profilePage?.device || "Device"}</option>
                        </select>
                    </div>

                    {/* App Audience Edition Preference Card */}
                    <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center justify-between group">
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 bg-blue-50 text-emerald-500 rounded-2xl flex items-center justify-center"><Sparkles className="w-6 h-6" /></div>
                            <span className="font-bold text-gray-800">{t.profilePage?.chooseAppMode || "Audience Edition"}</span>
                        </div>
                        <select 
                            value={appMode} 
                            onChange={(e) => setAppMode(e.target.value as any)}
                            className="bg-gray-100 text-[10px] font-black text-gray-600 px-4 py-2 rounded-full outline-none border-none focus:ring-0 uppercase tracking-widest"
                        >
                            <option value="standard">{t.profilePage?.standard || "Standard"}</option>
                            <option value="child">{t.profilePage?.child || "Child"}</option>
                            <option value="elder">{t.profilePage?.elder || "Elderly"}</option>
                        </select>
                    </div>

                    <ProfileItem icon={<User />} label="Personal Information" sub="Manage your height, weight & goals" />
                    <ProfileItem icon={<Shield />} label="Security & Privacy" sub="Manage your health data access" />
                    <ProfileItem icon={<Activity />} label="Expert Consultation" sub="Premium health advice (Pro)" premium />
                    <button 
                        onClick={() => auth.signOut()}
                        className="w-full flex items-center justify-center gap-3 p-6 bg-rose-50 text-rose-500 rounded-[32px] font-black text-xs uppercase tracking-widest border border-rose-100 hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-95"
                    >
                        <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                </div>
            )}

            {activeTab === 'family' && (
                <div className="space-y-4">
                    <div className="p-8 bg-slate-900 rounded-[48px] text-white space-y-8 shadow-2xl">
                        <div className="flex justify-between items-start px-2">
                            <div>
                                <h4 className="text-2xl font-black">Family Circle</h4>
                                <p className="text-slate-400 text-xs font-bold mt-1">Shared health accountability</p>
                            </div>
                            <Plus className="w-10 h-10 p-2 bg-white/10 rounded-2xl cursor-pointer hover:bg-white/20 transition-colors" />
                        </div>
                        <div className="space-y-4">
                            <FamilyRow name="Rahul (Dad)" icon="🧔" role="Admin" status="92%" />
                            <FamilyRow name="Aarav (Child)" icon="👦" role="Member" status="65%" alert="Low Iron" />
                            <FamilyRow name="Priya (Mom)" icon="👩" role="Member" status="88%" />
                        </div>
                        <button className="w-full py-5 bg-white text-indigo-950 rounded-[28px] font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-[0.98] transition-all">Invite accountability partner</button>
                    </div>
                </div>
            )}

            {activeTab === 'badges' && (
                <div className="grid grid-cols-2 gap-4">
                    {badges.map(badge => (
                        <div key={badge.name} className="bg-white p-6 rounded-[40px] border border-gray-100 shadow-sm flex flex-col items-center text-center space-y-3 group hover:border-indigo-100 transition-all">
                            <div className="text-4xl group-hover:scale-125 transition-transform">{badge.icon}</div>
                            <h4 className="font-black text-gray-800 text-sm leading-tight">{badge.name}</h4>
                            <span className="bg-gray-100 text-gray-400 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">{badge.level}</span>
                        </div>
                    ))}
                    <div className="bg-gray-50 p-6 rounded-[40px] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center space-y-2">
                        <Trophy className="w-8 h-8 text-gray-200" />
                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest leading-tight">12 More until<br/>"Grand Master"</span>
                    </div>
                </div>
            )}
        </motion.div>
      </AnimatePresence>

      <section className="bg-gradient-to-br from-indigo-900 to-indigo-950 rounded-[48px] p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12 scale-150"><Share2 className="w-48 h-48" /></div>
        <div className="relative z-10 space-y-8 h-full flex flex-col justify-between">
            <div>
                <h3 className="text-3xl font-black tracking-tight leading-tight">Spread Health Awareness</h3>
                <p className="text-indigo-200/60 font-medium text-sm mt-2">Earn 500 bonus points for every family you onboard to the Health Loop.</p>
            </div>
            <button className="flex items-center gap-2 bg-indigo-500 text-white px-8 py-4 rounded-[28px] font-black text-xs uppercase tracking-widest w-fit hover:bg-indigo-400 transition-all group active:scale-95 shadow-xl shadow-indigo-950">
                Share Referral Link <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </button>
        </div>
      </section>

      <p className="text-center text-[8px] font-black text-gray-300 uppercase tracking-[0.4em] pb-8">Community Health Loop • v2.0 Enterprise</p>
    </div>
  );
}

function ProfileItem({ icon, label, sub, premium }: any) {
  return (
    <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center justify-between group hover:border-indigo-100 transition-all cursor-pointer">
      <div className="flex items-center gap-5">
        <div className="w-12 h-12 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center group-hover:bg-indigo-900 group-hover:text-white transition-all shadow-inner">
            {React.cloneElement(icon, { className: "w-5 h-5" })}
        </div>
        <div>
            <div className="flex items-center gap-2">
                <h4 className="font-black text-gray-800 text-sm">{label}</h4>
                {premium && <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest shadow-sm">Pro</span>}
            </div>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1 leading-tight">{sub}</p>
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-200 group-hover:text-indigo-500 transition-colors" />
    </div>
  );
}

function FamilyRow({ name, icon, role, status, alert }: any) {
    return (
        <div className="flex items-center justify-between p-5 bg-white/5 rounded-3xl border border-white/5 group hover:border-white/10 transition-all">
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-2xl shadow-inner">{icon}</div>
                <div>
                    <h5 className="font-bold text-sm text-white">{name}</h5>
                    <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mt-0.5">{role}</p>
                </div>
            </div>
            <div className="text-right">
                <div className="flex items-center gap-2 justify-end">
                    {alert && <span className="bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest">{alert}</span>}
                    <span className="font-black text-white/50 text-xs">{status}</span>
                </div>
                <div className="h-1 w-24 bg-white/10 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: status }} />
                </div>
            </div>
        </div>
    )
}
