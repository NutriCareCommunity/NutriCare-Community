import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calculator, 
  Droplet, 
  ChevronRight, 
  History, 
  TrendingUp, 
  Target, 
  Plus, 
  Activity, 
  AlertCircle,
  Baby,
  Heart,
  Calendar,
  Lock,
  ArrowRight,
  Stethoscope,
  PieChart as PieIcon,
  BarChart as BarIcon,
  Search,
  Scaling,
  Minus,
  Award,
  Trophy,
  CheckCircle2,
  Phone,
  Volume2,
  Smartphone,
  Watch,
  Users,
  Cpu,
  Unlink,
  Wifi,
  Battery,
  BatteryLow
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { translations } from "../../constants/translations";
import { db, handleFirestoreError, OperationType } from "../../lib/firebase";
import { collection, query, orderBy, onSnapshot, where, getDocs, addDoc, serverTimestamp, limit } from "firebase/firestore";
import { 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    AreaChart,
    Area
} from "recharts";

export default function TrackersView() {
    const { activeTrackerModule: activeModule, setActiveTrackerModule: setActiveModule, language } = useApp();
    const t = translations[language] || translations.en;
    const tt = t.trackers || translations.en.trackers;

    const modules = [
        { id: "overview", label: tt.dashboard, icon: <PieIcon /> },
        { id: "bmi", label: tt.bmiTrack, icon: <Calculator /> },
        { id: "water", label: tt.hydration, icon: <Droplet /> },
        { id: "child", label: tt.childDiet, icon: <Baby /> },
        { id: "women", label: tt.womenNutrition, icon: <Heart /> },
        { id: "disease", label: tt.conditionDiet, icon: <Activity /> },
        { id: "family", label: tt.familyLoop, icon: <Users className="w-4 h-4" /> },
    ];

    return (
        <div className="space-y-8 pb-32">
            <header className="flex justify-between items-center px-2">
                <div>
                    <h2 className="text-3xl font-black text-gray-800 tracking-tight">{tt.title}</h2>
                    <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">{tt.subtitle}</p>
                </div>
            </header>

            {/* Module Selector */}
            <div className="flex gap-2 p-2 bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-x-auto no-scrollbar md:p-3">
                {modules.map((m) => (
                    <button
                        key={m.id}
                        onClick={() => setActiveModule(m.id)}
                        className={`flex items-center justify-center gap-3 px-6 py-4 rounded-2xl text-[10px] uppercase tracking-widest font-black transition-all whitespace-nowrap ${
                            activeModule === m.id 
                            ? 'bg-indigo-900 text-white shadow-lg shadow-indigo-100' 
                            : 'text-gray-400 hover:bg-gray-50'
                        }`}
                    >
                        {m.label}
                    </button>
                ))}
            </div>

            <main>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeModule}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="space-y-8"
                    >
                        {activeModule === "overview" && <AnalyticsOverview />}
                        {activeModule === "family" && <FamilyManagementModule />}
                        {activeModule === "bmi" && <BMITracker />}
                        {activeModule === "water" && <WaterTracker />}
                        {activeModule === "child" && <ChildNutritionModule />}
                        {activeModule === "women" && <WomenHealthModule />}
                        {activeModule === "disease" && <DiseaseDietModule />}
                        {activeModule === "elder" && <ElderWellnessModule />}
                        {activeModule === "devices" && <DeviceManagementModule />}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
}

function FamilyManagementModule() {
    const { familyMembers, language } = useApp();
    const t = translations[language] || translations.en;
    const tt = t.trackers || translations.en.trackers;
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="bg-white rounded-[48px] p-8 md:p-12 border border-gray-100 shadow-xl space-y-10">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-3xl font-black text-gray-900 tracking-tighter">{tt.familyLoopTitle}</h3>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">{tt.managingProfiles}</p>
                    </div>
                    <div className="w-16 h-16 bg-indigo-50 rounded-[28px] flex items-center justify-center text-3xl shadow-inner border-2 border-white">👪</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {familyMembers.map((member, i) => (
                        <div key={i} className="p-8 bg-gray-50 rounded-[40px] border border-gray-100 flex items-center justify-between group hover:bg-white hover:border-indigo-100 transition-all cursor-pointer">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 bg-white rounded-[32px] flex items-center justify-center text-4xl shadow-xl transition-transform group-hover:scale-110">{member.icon}</div>
                                <div>
                                    <h4 className="text-xl font-black text-gray-800 tracking-tight">{member.name}</h4>
                                    <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">Age: {member.age || 'Unknown'}</p>
                                    <div className={`mt-3 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest inline-block ${member.healthStatus === 'Critical' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'}`}>
                                        {member.healthStatus || 'Stable'}
                                    </div>
                                </div>
                            </div>
                            <ChevronRight className="w-8 h-8 text-gray-200 group-hover:text-indigo-400 transition-colors" />
                        </div>
                    ))}
                    
                    <button className="p-8 border-4 border-dashed border-gray-100 rounded-[40px] flex flex-col items-center justify-center gap-4 text-gray-300 hover:border-indigo-100 hover:text-indigo-400 transition-all group">
                        <div className="w-16 h-16 bg-gray-50 rounded-[28px] flex items-center justify-center transition-transform group-hover:scale-110">
                            <Plus className="w-8 h-8" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest">Invite Member</span>
                    </button>
                </div>
            </div>

            <div className="p-10 gradient-indigo rounded-[56px] text-white flex flex-col md:flex-row items-center gap-8 shadow-3xl shadow-indigo-100">
                <div className="flex-1 space-y-4 text-center md:text-left">
                    <h4 className="text-2xl font-black tracking-tight">AI Health Synchronizer</h4>
                    <p className="text-indigo-200 text-sm font-bold leading-relaxed">
                        Our backend analyzes regional patterns and alerts you if multiple family members show similar deficiency symptoms.
                    </p>
                </div>
                <button className="px-10 py-5 bg-white text-indigo-900 rounded-[28px] font-black text-[13px] uppercase tracking-widest shadow-xl whitespace-nowrap active:scale-95 transition-all">
                    Sync Family Data
                </button>
            </div>
        </motion.div>
    );
}
function DeviceManagementModule() {
    const { devices, connectDevice } = useApp();
    const [pairing, setPairing] = useState(false);

    const handleConnect = async () => {
        setPairing(true);
        // Simulate pairing delay
        setTimeout(async () => {
            const nextId = devices.length + 1;
            await connectDevice({
                deviceName: `Family Monitor ${nextId}`,
                deviceType: "BP Monitor",
                status: "connected"
            });
            setPairing(false);
        }, 2000);
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="bg-indigo-900 rounded-[56px] p-12 text-white relative overflow-hidden shadow-3xl shadow-indigo-100 border-4 border-white">
                <div className="absolute -top-10 -right-10 opacity-10 rotate-45"><Wifi className="w-64 h-64" /></div>
                
                <div className="flex flex-col items-center text-center space-y-6 relative z-10">
                    <div className="w-24 h-24 bg-white/10 rounded-[32px] flex items-center justify-center backdrop-blur-xl border border-white/20">
                        <Smartphone className="w-12 h-12" />
                    </div>
                    <div>
                        <h3 className="text-4xl font-black tracking-tighter">Device Hub</h3>
                        <p className="text-indigo-300 font-bold text-xs uppercase tracking-[0.3em] mt-4">Multi-Device Connectivity</p>
                    </div>
                    <p className="text-indigo-100/70 text-[13px] font-bold max-w-xs leading-relaxed">
                        Connect your smartwatches, scales, and blood monitors for automated health insights.
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center px-6">
                    <h4 className="text-sm font-black text-gray-800 uppercase tracking-widest">Linked Hardware</h4>
                    <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full">{devices.length} Devices</span>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {devices.map((dev) => (
                        <div key={dev.id} className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm flex items-center justify-between group hover:border-indigo-100 transition-all">
                            <div className="flex items-center gap-6">
                                <div className={`w-16 h-16 rounded-[28px] flex items-center justify-center text-2xl shadow-inner ${
                                    dev.deviceType === 'Watch' ? 'bg-indigo-50 text-indigo-600' : 
                                    dev.deviceType === 'Scale' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                }`}>
                                    {dev.deviceType === 'Watch' ? <Watch /> : dev.deviceType === 'Scale' ? <Scaling /> : <Activity />}
                                </div>
                                <div>
                                    <h5 className="text-lg font-black text-gray-800 leading-tight">{dev.deviceName}</h5>
                                    <div className="flex items-center gap-3 mt-1.5">
                                        <div className="flex items-center gap-1">
                                            {dev.batteryLevel > 20 ? <Battery className="w-3 h-3 text-emerald-500" /> : <BatteryLow className="w-3 h-3 text-rose-500" />}
                                            <span className="text-[9px] font-black text-gray-400">{dev.batteryLevel}%</span>
                                        </div>
                                        <span className="w-1 h-1 rounded-full bg-gray-200" />
                                        <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Last Sync: {dev.lastSync}</span>
                                    </div>
                                </div>
                            </div>
                            <button className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 hover:text-rose-500 hover:bg-rose-50 transition-all">
                                <Unlink className="w-6 h-6" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <button 
                onClick={handleConnect}
                disabled={pairing}
                className={`w-full py-6 rounded-[32px] font-black uppercase text-xs tracking-[0.3em] shadow-2xl transition-all flex items-center justify-center gap-4 ${
                    pairing ? 'bg-gray-100 text-gray-400 shadow-none' : 'gradient-indigo text-white shadow-indigo-100 active:scale-95'
                }`}
            >
                {pairing ? (
                    <>
                        <Wifi className="w-6 h-6 animate-pulse" />
                        Pairing...
                    </>
                ) : (
                    <>
                        <Plus className="w-6 h-6" />
                        Connect New Device
                    </>
                )}
            </button>

            <div className="p-8 bg-slate-50 rounded-[40px] border border-gray-100">
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-white rounded-2xl shadow-sm"><Wifi className="w-6 h-6 text-indigo-500" /></div>
                    <h5 className="text-xs font-black text-gray-800 uppercase tracking-widest">Automated Tracking</h5>
                </div>
                <p className="text-[11px] font-bold text-gray-400 leading-relaxed">
                    By connecting multiple devices, NutriCare can automatically detect your heart rate, sleep quality, and daily steps to provide better nutrition advice.
                </p>
            </div>
        </motion.div>
    );
}

function ElderWellnessModule() {
    const reminders = [
        { time: "08:00 AM", task: "Blood Pressure Medicine", icon: "💊", color: "rose" },
        { time: "10:30 AM", task: "Drink 2 Glasses Water", icon: "💧", color: "blue" },
        { time: "01:00 PM", task: "Lunch (Soft Khichdi)", icon: "🥣", color: "orange" },
    ];

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="bg-slate-900 rounded-[48px] p-10 text-white shadow-2xl relative overflow-hidden ring-8 ring-slate-100">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-3xl font-black tracking-tight">Dada's Health</h3>
                    <div className="px-5 py-2 bg-emerald-500 rounded-full text-xs font-black uppercase tracking-widest">Steady</div>
                </div>
                
                <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="p-6 bg-white/10 rounded-[32px] border border-white/10">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Sugar Level</p>
                        <p className="text-2xl font-black text-white">110 mg/dL</p>
                    </div>
                    <div className="p-6 bg-white/10 rounded-[32px] border border-white/10">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">BP</p>
                        <p className="text-2xl font-black text-white">120/80</p>
                    </div>
                </div>

                <button className="w-full py-6 bg-white text-slate-900 rounded-[32px] font-black text-xl flex items-center justify-center gap-4 shadow-xl active:scale-95 transition-all">
                    <Phone className="w-6 h-6 text-emerald-500" />
                    Emergency Card
                </button>
            </div>

            <div className="bg-white rounded-[48px] p-8 space-y-6 border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center px-4">
                    <h4 className="text-xl font-black text-gray-800">Daily Reminders</h4>
                    <Calendar className="w-6 h-6 text-gray-300" />
                </div>
                
                <div className="space-y-4">
                    {reminders.map((r, i) => (
                        <div key={i} className="flex items-center gap-6 p-6 bg-gray-50 rounded-[36px] border border-gray-100 group hover:border-indigo-100 hover:bg-white transition-all cursor-pointer">
                            <div className="text-4xl">{r.icon}</div>
                            <div className="flex-1">
                                <p className="text-lg font-black text-gray-800 leading-tight">{r.task}</p>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{r.time}</p>
                            </div>
                            <button className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-gray-300 hover:text-emerald-500 hover:shadow-lg transition-all">
                                <CheckCircle2 className="w-6 h-6" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="p-10 gradient-indigo rounded-[56px] text-white text-center shadow-3xl shadow-indigo-100">
                <p className="text-lg font-bold mb-6 opacity-90 leading-relaxed">
                    "Soft foods like Dalia and Soups are best for today's digestion."
                </p>
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/20 rounded-full font-black text-[10px] uppercase tracking-widest border border-white/20 backdrop-blur-md">
                    <Volume2 className="w-4 h-4" /> Listen to advice
                </div>
            </div>
        </motion.div>
    )
}

function AnalyticsOverview() {
    const data = [
        { day: 'Mon', water: 2.1, nutriScore: 78 },
        { day: 'Tue', water: 3.2, nutriScore: 82 },
        { day: 'Wed', water: 2.5, nutriScore: 80 },
        { day: 'Thu', water: 3.8, nutriScore: 84 },
        { day: 'Fri', water: 1.5, nutriScore: 79 },
        { day: 'Sat', water: 3.0, nutriScore: 85 },
        { day: 'Sun', water: 3.5, nutriScore: 88 },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#131B2A] p-8 rounded-[48px] border border-slate-800 shadow-md">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Hydration</p>
                    <h4 className="text-3xl font-black text-white tracking-tight">21.6L</h4>
                    <p className="text-emerald-400 text-[10px] font-black uppercase mt-1">↑ 12% vs last week</p>
                </div>
                <div className="bg-[#131B2A] p-8 rounded-[48px] border border-slate-800 shadow-md">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">NutriScore Avg</p>
                    <h4 className="text-3xl font-black text-white tracking-tight">84.5</h4>
                    <p className="text-emerald-400 text-[10px] font-black uppercase mt-1">↑ Optimal Range</p>
                </div>
                <div className="bg-[#131B2A] p-8 rounded-[48px] border border-slate-800 shadow-md hidden md:block">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Meals Logged</p>
                    <h4 className="text-3xl font-black text-white tracking-tight">3 Today</h4>
                    <p className="text-indigo-400 text-[10px] font-black uppercase mt-1">100% Protein Target</p>
                </div>
                <div className="bg-[#131B2A] p-8 rounded-[48px] border border-slate-800 shadow-md hidden lg:block text-indigo-200">
                    <p className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-60">Reward Points</p>
                    <h4 className="text-3xl font-black text-white tracking-tight">240</h4>
                    <p className="text-[10px] font-black uppercase mt-1 text-indigo-400">Diet Streak 🥈</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-[#131B2A] p-8 rounded-[48px] border border-slate-800 shadow-md space-y-6 lg:col-span-2">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-black text-white">Weekly Performance</h3>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> <span className="text-[10px] font-bold text-slate-400 uppercase">Water (L)</span></div>
                            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-orange-400" /> <span className="text-[10px] font-bold text-slate-400 uppercase">NutriScore</span></div>
                        </div>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data}>
                                <defs>
                                    <linearGradient id="colorWater" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B" />
                                <XAxis 
                                    dataKey="day" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 10, fontWeight: 900, fill: '#64748B' }} 
                                />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0F172A', borderRadius: '24px', border: '1px solid #334155', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 'black', color: '#F1F5F9' }}
                                />
                                <Area type="monotone" dataKey="water" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorWater)" />
                                <Line type="monotone" dataKey="nutriScore" stroke="#fb923c" strokeWidth={4} dot={{ r: 6, fill: '#fb923c', strokeWidth: 4, stroke: '#1E293B' }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-indigo-900 rounded-[48px] p-10 text-white relative overflow-hidden shadow-3xl shadow-indigo-100 flex flex-col justify-center text-center">
                    <div className="absolute top-0 left-0 p-8 opacity-10 rotate-12 scale-150">✨</div>
                    <h3 className="text-2xl font-black tracking-tight mb-4">India Health AI</h3>
                    <p className="text-indigo-200 text-sm font-bold leading-relaxed mb-8 italic">
                        "Your village consumes 20% more protein than neighboring areas. Your family is contributing well!"
                    </p>
                    <button className="w-full py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest">
                        Read Analytics Report
                    </button>
                </div>
            </div>
        </div>
    );
}

function BMITracker() {
    const [weight, setWeight] = useState(70);
    const [height, setHeight] = useState(175);
    const bmi = (weight / ((height / 100) ** 2)).toFixed(1);

    return (
        <div className="bg-white rounded-[48px] p-8 space-y-8 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center px-2">
                <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tighter">BMI Calculator</h3>
                <Scaling className="w-8 h-8 text-indigo-200" />
            </div>

            <div className="space-y-12">
                <div className="relative pt-6">
                    <div className="flex justify-between mb-4 px-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Weight (kg)</label>
                        <span className="text-indigo-600 font-black bg-indigo-50 px-4 py-1.5 rounded-full text-xs shadow-sm">{weight} kg</span>
                    </div>
                    <input type="range" min="30" max="150" value={weight} onChange={(e) => setWeight(Number(e.target.value))} className="w-full h-2 bg-gray-100 rounded-full appearance-none cursor-pointer accent-indigo-600" />
                </div>
                <div className="relative pt-6">
                    <div className="flex justify-between mb-4 px-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Height (cm)</label>
                        <span className="text-indigo-600 font-black bg-indigo-50 px-4 py-1.5 rounded-full text-xs shadow-sm">{height} cm</span>
                    </div>
                    <input type="range" min="100" max="220" value={height} onChange={(e) => setHeight(Number(e.target.value))} className="w-full h-2 bg-gray-100 rounded-full appearance-none cursor-pointer accent-indigo-600" />
                </div>
            </div>

            <div className="p-12 gradient-indigo rounded-[48px] flex flex-col items-center text-white shadow-2xl shadow-indigo-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 translate-x-1/4 -translate-y-1/4 w-32 h-32 bg-white/10 rounded-full blur-2xl font-black" />
                <span className="text-[10px] font-black opacity-80 uppercase tracking-widest mb-1">Your Body Mass Index</span>
                <span className="text-7xl font-black mb-6 tracking-tighter">{bmi}</span>
                <div className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/20 border border-white/30 backdrop-blur-md shadow-lg`}>
                    {Number(bmi) < 18.5 ? 'Underweight' : Number(bmi) < 25 ? 'Normal Weight' : 'Overweight'}
                </div>
            </div>
        </div>
    )
}

function WaterTracker() {
    const { user } = useApp();
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!user) return;
        const path = `users/${user.uid}/habits`;
        const q = query(
            collection(db, "users", user.uid, "habits"),
            where("type", "==", "water"),
            orderBy("timestamp", "desc"),
            limit(10)
        );
        return onSnapshot(q, (snap) => {
            setHistory(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, (error) => {
            handleFirestoreError(error, OperationType.GET, path);
        });
    }, [user]);

    const addWater = async (val: number) => {
        if (!user || loading) return;
        setLoading(true);
        const path = `users/${user.uid}/habits`;
        try {
            await addDoc(collection(db, "users", user.uid, "habits"), {
                userId: user.uid,
                type: "water",
                value: val,
                timestamp: serverTimestamp()
            });
        } catch (e) {
            handleFirestoreError(e, OperationType.WRITE, path);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="bg-white rounded-[48px] p-8 space-y-8 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center px-2">
                <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tighter">Hydration Flow</h3>
                <Droplet className="w-8 h-8 text-blue-300" />
            </div>

            <div className="flex justify-center gap-6 py-6">
                <motion.button 
                    whileTap={{ scale: 0.9 }}
                    onClick={() => addWater(-0.25)}
                    className="w-20 h-20 bg-gray-50 rounded-[32px] flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-all shadow-inner"
                >
                    <Minus className="w-8 h-8" />
                </motion.button>
                <motion.button 
                    whileTap={{ scale: 0.9 }}
                    onClick={() => addWater(0.25)}
                    className="w-20 h-20 gradient-blue rounded-[32px] flex items-center justify-center text-white shadow-2xl shadow-blue-100 hover:scale-105 transition-all"
                >
                    <Plus className="w-8 h-8" />
                </motion.button>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center px-4">
                    <h4 className="text-lg font-black text-gray-800">Recent Logs</h4>
                    <History className="w-5 h-5 text-gray-300" />
                </div>
                <div className="space-y-3">
                    {history.length > 0 ? history.map((log) => (
                        <div key={log.id} className="flex justify-between items-center p-5 bg-blue-50/30 rounded-[32px] border border-blue-50">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-500 shadow-sm">
                                    <Droplet className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-gray-800">{log.value} Liters</p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Logged: {new Date(log.timestamp?.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                            </div>
                            <Award className="w-5 h-5 text-blue-200" />
                        </div>
                    )) : (
                        <div className="p-12 text-center text-gray-300 font-bold uppercase tracking-widest text-xs">No entries today</div>
                    )}
                </div>
            </div>
        </div>
    )
}

function DiseaseDietModule() {
    const commonConditions = [
        { title: "Diabetes Management", val: "Controlled", icon: "🩸", color: "blue" },
        { title: "High Blood Pressure", val: "Caution", icon: "💓", color: "rose" },
        { title: "Anemia Control", val: "Good", icon: "🩸", color: "red" }
    ];

    return (
        <div className="bg-white rounded-[40px] p-8 space-y-8 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center px-2">
                <h2 className="text-2xl font-bold text-gray-800">Condition Monitor</h2>
                <div className="p-3 bg-red-100 text-red-600 rounded-2xl"><Activity className="w-6 h-6" /></div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {commonConditions.map(cond => (
                    <div key={cond.title} className="p-6 bg-gray-50 rounded-[32px] border border-gray-100 flex items-center justify-between group hover:border-indigo-100 transition-all">
                        <div className="flex items-center gap-4">
                            <span className="text-3xl grayscale group-hover:grayscale-0 transition-all">{cond.icon}</span>
                            <div>
                                <h4 className="font-bold text-gray-800 text-sm">{cond.title}</h4>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Status: <span className={cond.val === 'Caution' ? 'text-rose-500' : 'text-green-500'}>{cond.val}</span></p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-300" />
                    </div>
                ))}
            </div>

            <div className="p-8 bg-indigo-900 rounded-[40px] text-white relative overflow-hidden shadow-xl shadow-indigo-100">
                <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12"><Lock className="w-16 h-16" /></div>
                <h4 className="font-bold mb-2">Personalized Diet Plan</h4>
                <p className="text-indigo-200 text-xs font-medium leading-relaxed">
                    Based on your monitored conditions, we recommend limiting salt intake to 5g/day.
                </p>
                <div className="mt-6 flex items-center gap-2 text-[10px] font-black uppercase text-white/40">
                    <History className="w-3 h-3" /> Updated: Today, 10:30 AM
                </div>
            </div>
        </div>
    )
}

function ChildNutritionModule() {
    return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
            {/* Cartoon Coach - "Cartoon nutrition coach" requirement */}
            <div className="bg-orange-400 rounded-[48px] p-8 text-white relative overflow-hidden shadow-2xl shadow-orange-100 border-4 border-white/20">
                <div className="absolute top-0 right-0 p-8 opacity-20 rotate-12 scale-150">🍎</div>
                <div className="flex gap-6 items-center relative z-10">
                    <motion.div 
                        animate={{ y: [0, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-5xl shadow-2xl"
                    >
                        🦁
                    </motion.div>
                    <div>
                        <h3 className="text-2xl font-black tracking-tight">Meet Simbe!</h3>
                        <p className="text-orange-900/80 font-black text-xs uppercase tracking-widest leading-none mt-1">Your Nutrition Coach</p>
                        <p className="text-white/90 text-[13px] font-bold mt-4 leading-relaxed bg-white/10 p-4 rounded-[28px] border border-white/20 backdrop-blur-md">
                            "Hey Champ! Eating spinach gives you super strength! Ready for today's mission?"
                        </p>
                    </div>
                </div>
            </div>

            {/* Daily Missions - "Daily missions" requirement */}
            <div className="bg-white rounded-[40px] p-8 border border-orange-100 shadow-sm space-y-6">
                <div className="flex justify-between items-center px-2">
                    <h4 className="text-sm font-black text-gray-800 uppercase tracking-widest">Growth Quest</h4>
                    <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-orange-400" />
                        <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Tier 2</span>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                    <QuestItem label="Drink 4 glasses of water" progress={75} reward="⚡ Super Hydration" />
                    <QuestItem label="Finish your green lunch" progress={0} reward="🛡️ Vitamin Shield" />
                    <QuestItem label="Eat a whole seasonal fruit" progress={100} completed reward="✨ Energy Blast" />
                </div>
            </div>

            {/* Achievement Badges - "Achievement badges" requirement */}
            <div className="bg-slate-900 rounded-[48px] p-8 text-white">
                <h4 className="text-sm font-black uppercase tracking-[0.2em] mb-8 text-slate-500 text-center">My Power Badges</h4>
                <div className="flex justify-around gap-4 overflow-x-auto no-scrollbar py-4">
                    <Badge icon="🥛" label="Calcium King" unlocked />
                    <Badge icon="🥗" label="Veggie Hero" unlocked />
                    <Badge icon="🍊" label="C-Power" />
                    <Badge icon="🍎" label="Red Spark" />
                </div>
            </div>

            <button className="w-full py-6 gradient-orange text-white rounded-[32px] font-black uppercase text-xs tracking-[0.3em] shadow-2xl shadow-orange-100 active:scale-95 transition-all">
                Update Growth Book
            </button>
        </motion.div>
    )
}

function QuestItem({ label, progress, reward, completed }: any) {
    return (
        <div className={`p-6 rounded-[32px] border-2 transition-all ${completed ? 'bg-orange-50 border-orange-100' : 'bg-gray-50 border-transparent'}`}>
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className={`font-black text-sm ${completed ? 'text-orange-900' : 'text-gray-700'}`}>{label}</p>
                    <p className="text-[9px] font-black uppercase text-indigo-500 tracking-widest mt-1">Reward: {reward}</p>
                </div>
                {completed && <CheckCircle2 className="w-5 h-5 text-orange-500" />}
            </div>
            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full gradient-orange" />
            </div>
        </div>
    )
}

function Badge({ icon, label, unlocked }: any) {
    return (
        <div className={`flex flex-col items-center gap-3 transition-opacity ${unlocked ? 'opacity-100' : 'opacity-20'}`}>
            <div className="w-16 h-16 rounded-[24px] bg-white text-3xl flex items-center justify-center shadow-xl border-2 border-white/20">
                {icon}
            </div>
            <span className="text-[8px] font-black uppercase tracking-widest text-center whitespace-nowrap">{label}</span>
        </div>
    )
}

function WomenHealthModule() {
    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[40px] p-8 space-y-8 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center px-2">
                <h2 className="text-2xl font-bold text-gray-800 uppercase tracking-tighter">Women's Wellness</h2>
                <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl shadow-lg shadow-rose-50"><Heart className="w-8 h-8" /></div>
            </div>

            <div className="bg-rose-50 p-8 rounded-[48px] border border-rose-100 relative overflow-hidden shadow-inner">
                <div className="absolute top-0 right-0 p-6 opacity-30 rotate-12"><Activity className="w-24 h-24 text-rose-300" /></div>
                <h3 className="font-black text-rose-800 uppercase tracking-widest text-xs mb-4">Anemia Defense</h3>
                <p className="text-rose-700/70 text-sm font-medium leading-relaxed mb-6">
                    Consistent iron intake is the foundation of blood health and energy levels.
                </p>
                <div className="h-3 bg-white/50 rounded-full overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: "65%" }}
                        className="h-full bg-rose-500 rounded-full" 
                    />
                </div>
                <p className="mt-4 text-[10px] font-black text-rose-800 uppercase tracking-widest leading-none">Monthly Progress: Optimal Range</p>
            </div>

            <div className="space-y-4">
                <h3 className="text-xl font-black text-gray-800 px-2 tracking-tight">Dietary Focus</h3>
                <div className="grid grid-cols-1 gap-4">
                    <DietItem title="Spinach & Jaggery" benefit="High Iron Content" icon="🥬" />
                    <DietItem title="Pomegranate / Beetroot" benefit="Boosts Blood Count" icon="🍎" />
                </div>
            </div>

            <button className="w-full py-6 bg-slate-900 text-white rounded-[32px] font-black uppercase text-xs tracking-widest shadow-xl shadow-slate-200 hover:scale-[1.01] transition-all active:scale-95">
                View Iron-Rich Recipes
            </button>
        </motion.div>
    )
}

function CheckItem({ label }: { label: string }) {
    return (
        <div className="flex items-center gap-4 p-5 bg-gray-50 rounded-[28px] border border-gray-100 group cursor-pointer hover:border-green-100 hover:bg-white transition-all">
            <div className="w-6 h-6 rounded-xl border-2 border-gray-200 group-hover:border-green-500 group-hover:bg-green-50 transition-all flex items-center justify-center">
                <div className="w-3 h-3 rounded-md bg-green-500 scale-0 group-hover:scale-100 transition-transform" />
            </div>
            <span className="text-sm font-black text-gray-600">{label}</span>
        </div>
    )
}

function DietItem({ title, benefit, icon }: any) {
    return (
        <div className="flex items-center gap-4 p-5 bg-white border border-gray-100 rounded-[32px] shadow-sm hover:shadow-xl hover:border-rose-100 transition-all group">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-4xl shadow-inner group-hover:scale-110 transition-transform">{icon}</div>
            <div className="flex-1">
                <h4 className="font-black text-gray-800 text-sm leading-tight">{title}</h4>
                <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest leading-none mt-1">{benefit}</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-200" />
        </div>
    )
}
