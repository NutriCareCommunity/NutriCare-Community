import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  BookOpen, 
  Play, 
  ChevronRight, 
  Star, 
  Clock, 
  ExternalLink,
  Filter,
  CheckCircle2,
  Lock,
  ArrowRight,
  Utensils,
  Leaf,
  ShieldCheck,
  Hand,
  Info
} from "lucide-react";

export default function LearningView() {
    const [searchTerm, setSearchTerm] = useState("");
    const [activeFilter, setActiveFilter] = useState("all");

    const categories = [
        { id: "all", label: "All Topics", icon: <BookOpen />, color: "green" },
        { id: "nutrition", label: "Nutrition", icon: <Utensils />, color: "orange" },
        { id: "hygiene", label: "Hygiene", icon: <Hand />, color: "blue" },
        { id: "budget", label: "Budget Meals", icon: <Utensils />, color: "rose" },
    ];

    const lessons = [
        {
            id: 1,
            title: "Breakfast & Energy",
            desc: "Why skipping breakfast leads to low productivity.",
            category: "nutrition",
            time: "5 min",
            type: "Article",
            icon: <Utensils className="text-orange-500" />,
            color: "orange"
        },
        {
            id: 2,
            title: "Water & Hydration",
            desc: "The 8-glass myth vs actual requirements.",
            category: "nutrition",
            time: "3 min",
            type: "Video",
            icon: <Leaf className="text-blue-500" />,
            color: "blue"
        },
        {
            id: 3,
            title: "Hand Hygiene 101",
            desc: "Prevent common infections with proper technique.",
            category: "hygiene",
            time: "4 min",
            type: "Article",
            icon: <ShieldCheck className="text-emerald-500" />,
            color: "emerald"
        },
        {
            id: 4,
            title: "Iron-Rich Local Foods",
            desc: "Affordable ways to beat anemia.",
            category: "budget",
            time: "6 min",
            type: "Guide",
            icon: <Star className="text-rose-500" />,
            color: "rose"
        }
    ];

    const filteredLessons = lessons.filter(l => 
        (activeFilter === "all" || l.category === activeFilter) &&
        (l.title.toLowerCase().includes(searchTerm.toLowerCase()) || l.desc.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-8 pb-32">
            <header className="px-2">
                <h2 className="text-3xl font-black text-gray-800 tracking-tight">Health Academy</h2>
                <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">Learn to live better</p>
            </header>

            {/* Premium Search */}
            <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-indigo-500 transition-colors" />
                <input 
                    type="text" 
                    placeholder="Search lessons, recipes..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white border border-gray-100 rounded-[32px] pl-16 pr-6 py-5 text-sm font-bold shadow-sm outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-100 transition-all" 
                />
            </div>

            {/* Filter Chips */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveFilter(cat.id)}
                        className={`flex flex-col items-center gap-3 min-w-[100px] p-6 rounded-[32px] border transition-all ${
                            activeFilter === cat.id 
                            ? 'bg-indigo-900 border-indigo-950 text-white shadow-xl shadow-indigo-100 scale-105' 
                            : 'bg-white border-gray-100 text-gray-400 hover:border-indigo-100'
                        }`}
                    >
                        <div className={`p-3 rounded-2xl ${activeFilter === cat.id ? 'bg-white/10' : 'bg-gray-50'}`}>
                            {React.cloneElement(cat.icon as any, { className: "w-5 h-5" })}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-center whitespace-nowrap">{cat.label}</span>
                    </button>
                ))}
            </div>

            {/* Recipe of the Day - "Budget meal planner using local foods" */}
            <section className="relative overflow-hidden bg-emerald-950 rounded-[48px] p-10 text-white shadow-2xl">
                <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12 scale-150"><Utensils className="w-48 h-48" /></div>
                <div className="relative z-10 flex flex-col h-full justify-between space-y-8">
                    <div className="flex justify-between items-start">
                        <span className="bg-white/20 px-4 py-1 rounded-full text-[8px] font-black uppercase tracking-widest backdrop-blur-md border border-white/20">Recipe of the day</span>
                        <div className="flex items-center gap-1 text-orange-400"><Star className="w-4 h-4 fill-orange-400" /><Star className="w-4 h-4 fill-orange-400" /><Star className="w-4 h-4 fill-orange-400" /></div>
                    </div>
                    <div>
                        <h3 className="text-3xl font-black tracking-tight leading-tight">Iron-Rich Bajra Khichdi</h3>
                        <p className="text-emerald-100/60 font-medium text-sm mt-2 max-w-xs">Highly affordable meal using local millets and pulses. Perfect for anemia control.</p>
                    </div>
                    <button className="flex items-center gap-2 bg-emerald-500 text-white px-8 py-4 rounded-[24px] font-black text-xs uppercase tracking-widest w-fit hover:bg-emerald-400 transition-all group active:scale-95 shadow-xl shadow-emerald-900/50">
                        Start Cooking <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </section>

            {/* Lesson Grid */}
            <div className="grid grid-cols-1 gap-4">
                <AnimatePresence mode="popLayout">
                    {filteredLessons.map((lesson, i) => (
                        <motion.div
                            key={lesson.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center gap-6 group hover:shadow-xl hover:border-indigo-100 transition-all cursor-pointer"
                        >
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 shadow-inner bg-gray-50`}>
                                {lesson.icon}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md">{lesson.type}</span>
                                    <span className="text-[8px] font-black uppercase tracking-widest text-gray-300 flex items-center gap-1"><Clock className="w-3 h-3" /> {lesson.time}</span>
                                </div>
                                <h4 className="font-black text-gray-800 text-lg leading-tight group-hover:text-indigo-900 transition-colors">{lesson.title}</h4>
                                <p className="text-gray-400 text-xs font-medium mt-1 line-clamp-1">{lesson.desc}</p>
                            </div>
                            <div className="w-10 h-10 border border-gray-100 rounded-full flex items-center justify-center text-gray-300 group-hover:bg-indigo-900 group-hover:text-white transition-all shadow-sm">
                                <Play className="w-4 h-4 fill-current ml-1" />
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Hygiene Tip Banner */}
            <section className="bg-blue-50 border border-blue-100 p-8 rounded-[40px] flex gap-6 items-start shadow-sm shadow-blue-50">
                <div className="p-4 bg-white rounded-2xl text-blue-600 shadow-sm">
                    <ShieldCheck className="w-8 h-8" />
                </div>
                <div>
                    <h4 className="font-black text-blue-900 text-lg mb-1 tracking-tight">Hygiene Guard</h4>
                    <p className="text-blue-700/70 text-sm font-medium leading-relaxed">
                        Rinse all local vegetables in slightly salted water or vinegar solution to remove potential contaminants safely.
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-[10px] font-black text-blue-400 uppercase tracking-widest">
                        <Info className="w-3 h-3" /> Verified by Health Experts
                    </div>
                </div>
            </section>
        </div>
    );
}
