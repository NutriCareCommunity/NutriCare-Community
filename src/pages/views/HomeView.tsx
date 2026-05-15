import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { db } from "../../lib/firebase";
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Droplet, 
  Flame, 
  Plus, 
  ChevronRight,
  CheckCircle2,
  Trophy,
  Coffee,
  ShieldCheck,
  Zap,
  Heart,
  ArrowRight,
  TrendingUp,
  LayoutGrid,
  Apple,
  Smartphone
} from "lucide-react";

export default function HomeView() {
  const { profile, user, familyMembers, appMode, setActiveTab, setActiveTrackerModule } = useApp();
  const [streak, setStreak] = useState(0);
  const [waterLevel, setWaterLevel] = useState(0);
  const [checklist, setChecklist] = useState([
    { id: 1, text: "Healthy Breakfast", done: false, icon: "🍳" },
    { id: 2, text: "Morning Water (1L)", done: false, icon: "💧" },
    { id: 3, text: "Elderly Check-in", done: true, icon: "👴" },
    { id: 4, text: "No Sugary Drinks", done: false, icon: "🥤" },
  ]);

  const stories = [
    { id: 1, label: "Superfoods", icon: "🥥", seen: false },
    { id: 2, label: "Child Care", icon: "👶", seen: false },
    { id: 3, label: "Clean Diet", icon: "🥗", seen: true },
    { id: 4, label: "Yoga Tips", icon: "🧘", seen: false },
    { id: 5, label: "Village Pro", icon: "🏘️", seen: true },
  ];

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "users", user.uid, "habits"),
      where("timestamp", ">=", new Date(new Date().setHours(0,0,0,0))),
      orderBy("timestamp", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const todayLogs = snap.docs.map(doc => doc.data());
      const water = todayLogs.filter(l => l.type === 'water').reduce((acc, curr) => acc + curr.value, 0);
      setWaterLevel(Math.min(water, 3.5));
      if (water >= 1) setChecklist(prev => prev.map(item => item.id === 2 ? { ...item, done: true } : item));
      if (todayLogs.some(l => l.type === 'meal')) setChecklist(prev => prev.map(item => item.id === 1 ? { ...item, done: true } : item));
    });

    setStreak(profile?.streak || 5);
    return unsub;
  }, [user, profile]);

  const addHabit = async (type: string, value: number) => {
    if (!user) return;
    try {
      await addDoc(collection(db, "users", user.uid, "habits"), {
        userId: user.uid,
        type,
        value,
        timestamp: serverTimestamp()
      });
    } catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-8">
      {/* Story Circles - Instagram/Duolingo style */}
      <section className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-2 px-2">
        {stories.map(story => (
          <div key={story.id} className="flex flex-col items-center gap-2 flex-shrink-0">
            <motion.div 
              whileTap={{ scale: 0.9 }}
              className={`w-16 h-16 rounded-full p-1 border-2 ${story.seen ? 'border-gray-100' : 'border-indigo-500'}`}
            >
              <div className="w-full h-full rounded-full bg-gray-50 flex items-center justify-center text-2xl shadow-inner">
                {story.icon}
              </div>
            </motion.div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{story.label}</span>
          </div>
        ))}
      </section>

      {/* Main Greeting & Health Status */}
      <section className="relative">
        <h2 className="text-4xl font-serif italic text-indigo-900 leading-tight">Namaste, <br/><span className="not-italic font-black text-gray-900 leading-none">{profile?.displayName?.split(' ')[0]}</span></h2>
        <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute top-0 right-0 flex flex-col items-end"
        >
            <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Village Ranking: #4</span>
            </div>
            <div className="flex -space-x-2">
                {familyMembers.map((m, i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-indigo-50 flex items-center justify-center text-xs shadow-sm" title={m.name}>{m.icon}</div>
                ))}
                <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-900 flex items-center justify-center text-[10px] text-white font-black">+2</div>
            </div>
        </motion.div>
      </section>

      {/* Traffic Light Main Metric */}
      <section className="grid grid-cols-12 gap-4">
        <motion.div 
            whileHover={{ y: -5 }}
            className="col-span-12 bg-white rounded-[40px] p-8 glass-card border border-white shadow-2xl shadow-indigo-100/50"
        >
            <div className="flex justify-between items-start mb-8">
                <div>
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-1">Your NutriScore</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-6xl font-black text-gray-900 tracking-tighter">84</h3>
                        <span className="text-indigo-400 font-black">/ 100</span>
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    <div className="w-12 h-4 rounded-full bg-emerald-500 shadow-lg shadow-emerald-200" />
                    <div className="w-12 h-4 rounded-full bg-gray-100" />
                    <div className="w-12 h-4 rounded-full bg-gray-100" />
                </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-indigo-50/50 rounded-3xl border border-indigo-100/30">
                <div className="w-10 h-10 gradient-indigo rounded-xl flex items-center justify-center text-white p-2">
                    <Zap className="w-full h-full" />
                </div>
                <p className="text-xs font-bold text-indigo-900">Your health is <span className="font-black underline">Improving</span>. Great job on the 5-day streak!</p>
            </div>
        </motion.div>
      </section>

      {/* Quick Action Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <div className="col-span-full md:col-span-full lg:col-span-full flex items-center justify-between px-2">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Health Actions</h4>
            <LayoutGrid className="w-4 h-4 text-gray-300" />
        </div>
        <ActionCard 
            label="Log Meal" 
            sub="Indian Thali" 
            icon={<Apple />} 
            color="indigo" 
            onClick={() => addHabit('meal', 1)}
        />
        <ActionCard 
            label="Drink Water" 
            sub="Add 250ml" 
            icon={<Droplet />} 
            color="blue" 
            onClick={() => addHabit('water', 0.25)}
        />
        <div className="hidden md:flex lg:flex">
             <ActionCard 
                label="Check Weight" 
                sub="Log Morning" 
                icon={<TrendingUp />} 
                color="blue" 
                onClick={() => setActiveTab('trackers')}
            />
        </div>
        <div className="hidden lg:flex">
             <ActionCard 
                label="BP Check" 
                sub="Smart Sync" 
                icon={<Heart />} 
                color="rose" 
                onClick={() => { setActiveTab('trackers'); setActiveTrackerModule('elder'); }}
            />
        </div>
        <div className="col-span-2 md:col-span-1 lg:col-span-1">
            <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => { setActiveTab('trackers'); setActiveTrackerModule('devices'); }}
                className="w-full h-full p-6 rounded-[32px] border border-rose-100 bg-rose-50 flex items-center justify-between md:flex-col md:justify-center md:gap-4 group transition-all hover:shadow-xl"
            >
                <div className="flex items-center md:flex-col gap-4">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-rose-500 shadow-sm transition-transform group-hover:scale-110">
                        <Smartphone className="w-8 h-8" />
                    </div>
                    <div className="text-left md:text-center">
                        <p className="text-sm font-black uppercase tracking-tight text-gray-900">Sync Devices</p>
                        <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">2 Active Sensors</p>
                    </div>
                </div>
                <ArrowRight className="w-6 h-6 text-rose-300 md:hidden" />
            </motion.button>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Family Loop Interactive */}
        <section 
            onClick={() => { setActiveTab('trackers'); setActiveTrackerModule('family'); }}
            className="bg-gray-900 rounded-[48px] p-8 md:p-12 text-white shadow-3xl relative overflow-hidden h-full cursor-pointer hover:scale-[1.01] transition-transform"
        >
            <div className="absolute top-0 right-0 w-32 h-32 gradient-health-glow opacity-50" />
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h3 className="text-2xl font-black tracking-tight">Family Health Loop</h3>
                    <p className="text-gray-400 text-xs font-bold mt-1 uppercase tracking-widest">Protecting 3 Members</p>
                </div>
                <motion.div whileTap={{ scale: 0.9 }} className="w-12 h-12 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/10">
                    <ChevronRight className="w-6 h-6 text-white" />
                </motion.div>
            </div>
            
            <div className="space-y-6">
                {familyMembers.map((member, idx) => (
                    <div key={idx} className="group cursor-pointer">
                        <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-xl">{member.icon}</div>
                                <div>
                                    <h4 className="font-black text-sm">{member.name}</h4>
                                    <p className={`text-[10px] font-black uppercase tracking-widest ${member.status === 'Healthy' ? 'text-emerald-400' : 'text-rose-400'}`}>{member.status}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-gray-500 uppercase">92%</span>
                                <div className="w-16 h-1 hidden sm:block bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 w-[92%]" />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            <button 
                onClick={(e) => { e.stopPropagation(); setActiveTab('trackers'); setActiveTrackerModule('family'); }}
                className="w-full mt-8 py-5 bg-white text-gray-900 rounded-[28px] font-black text-sm flex items-center justify-center gap-3 shadow-xl hover:bg-gray-50 transition-all"
            >
                <Plus className="w-5 h-5" />
                Add Family Member
            </button>
        </section>

        {/* Daily Progress */}
        <section className="bg-gray-50 rounded-[40px] p-8 md:p-12 border border-gray-100 h-full">
            <div className="flex justify-between items-center mb-6">
                <h4 className="text-sm font-black text-gray-800 uppercase tracking-widest">Today's Missions</h4>
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl"><Trophy className="w-4 h-4" /></div>
            </div>
            <div className="space-y-3">
                {checklist.map(item => (
                    <motion.div 
                        key={item.id}
                        layout
                        className={`flex items-center gap-4 p-5 rounded-3xl transition-all ${item.done ? 'bg-white/50 border-white opacity-60' : 'bg-white border-transparent shadow-sm'}`}
                    >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.done ? 'bg-emerald-500 text-white' : 'bg-gray-50 text-gray-400'}`}>
                            {item.done ? <CheckCircle2 className="w-5 h-5" /> : <span className="text-lg">{item.icon}</span>}
                        </div>
                        <span className={`text-[13px] font-bold ${item.done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{item.text}</span>
                        {!item.done && <Plus className="w-4 h-4 text-gray-200 ml-auto" />}
                    </motion.div>
                ))}
            </div>
        </section>
      </div>
    </div>
  );
}

function ActionCard({ label, sub, icon, color, onClick }: any) {
    const colors: any = {
        indigo: "bg-indigo-50 text-indigo-600 border-indigo-100 shadow-indigo-100/50",
        blue: "bg-blue-50 text-blue-600 border-blue-100 shadow-blue-100/50",
        rose: "bg-rose-50 text-rose-600 border-rose-100 shadow-rose-100/50"
    };

    return (
        <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className={`p-6 rounded-[32px] border bg-white flex flex-col items-center gap-4 group transition-all hover:shadow-2xl ${colors[color]}`}
        >
            <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center text-3xl shadow-xl transition-all group-hover:scale-110 ${colors[color]}`}>
                {React.cloneElement(icon as any, { className: "w-8 h-8" })}
            </div>
            <div className="text-center">
                <p className="text-[13px] font-black uppercase tracking-tighter text-gray-900">{label}</p>
                <p className="text-[9px] font-black opacity-50 uppercase tracking-widest mt-1">{sub}</p>
            </div>
        </motion.button>
    )
}

function FamilyMember({ name, progress, icon, health }: any) {
    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-3">
                    <span className="text-xl">{icon}</span>
                    <span className="font-bold">{name}</span>
                </div>
                <div className="flex items-center gap-3">
                    {health && <span className="bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest">{health}</span>}
                    <span className="font-black text-slate-400">{progress}%</span>
                </div>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className={`h-full ${progress > 80 ? 'bg-emerald-500' : progress > 50 ? 'bg-orange-500' : 'bg-rose-500'}`} 
                />
            </div>
        </div>
    )
}

function QuickLog({ label, sub, icon, color, onClick }: any) {
    const colors: any = {
        blue: "bg-blue-50 text-blue-500 hover:gradient-blue hover:text-white",
        green: "bg-green-50 text-green-500 hover:gradient-green hover:text-white",
        rose: "bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white"
    };

    return (
        <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className="flex flex-col items-center gap-3 p-6 bg-white rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl transition-all group"
        >
            <div className={`p-4 rounded-2xl transition-all group-hover:scale-110 ${colors[color]}`}>
                {React.cloneElement(icon as any, { className: "w-6 h-6" })}
            </div>
            <div className="text-center">
                <p className="text-xs font-black text-gray-800 uppercase tracking-tighter">{label}</p>
                <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest mt-0.5">{sub}</p>
            </div>
        </motion.button>
    )
}

function StatCard({ title, val, target, icon, progress, color }: any) {
    const barColors: any = {
        blue: "bg-blue-400",
        green: "bg-green-500",
        orange: "bg-orange-400"
    };

    return (
        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col h-48 transition-all hover:shadow-lg">
            <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{title}</span>
                <div className="p-2 bg-gray-50 rounded-xl">{icon}</div>
            </div>
            <div className="mt-auto">
                <div className="text-3xl font-black text-gray-800">{val} <span className="text-xs font-normal text-gray-400">/ {target.split(' ')[0]}</span></div>
                <div className="w-full bg-gray-100 h-2 mt-4 rounded-full overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className={`h-full ${barColors[color]}`} 
                    />
                </div>
            </div>
        </div>
    )
}
