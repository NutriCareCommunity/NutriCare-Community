import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { db } from "../../lib/firebase";
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, setDoc, increment } from "firebase/firestore";
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
  Smartphone,
  X
} from "lucide-react";

export default function HomeView() {
  const { profile, user, familyMembers, appMode, setActiveTab, setActiveTrackerModule, refreshProfile } = useApp();
  const [streak, setStreak] = useState(0);
  const [waterLevel, setWaterLevel] = useState(0);
  const [checklist, setChecklist] = useState([
    { id: 1, text: "Healthy Breakfast", done: false, icon: "🍳" },
    { id: 2, text: "Morning Water (1L)", done: false, icon: "💧" },
    { id: 3, text: "Eat Fresh Fruit", done: false, icon: "🍎" },
    { id: 4, text: "No Sugary Drinks", done: false, icon: "🥤" },
  ]);

  const [seenStories, setSeenStories] = useState<number[]>(() => {
    const saved = localStorage.getItem("seen_stories");
    return saved ? JSON.parse(saved) : [];
  });

  const [activeStory, setActiveStory] = useState<any | null>(null);
  const [activeStorySlide, setActiveStorySlide] = useState(0);

  const addRewardPoints = async (pointsToAdd: number) => {
    if (!user) {
      const current = parseInt(localStorage.getItem("local_reward_points") || "842");
      localStorage.setItem("local_reward_points", (current + pointsToAdd).toString());
      window.dispatchEvent(new Event("localPointsUpdated"));
      return;
    }
    try {
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, { points: increment(pointsToAdd) }, { merge: true });
      await refreshProfile();
    } catch (e) {
      console.error(e);
    }
  };

  const markStoryAsSeen = (storyId: number) => {
    if (!seenStories.includes(storyId)) {
      const next = [...seenStories, storyId];
      setSeenStories(next);
      localStorage.setItem("seen_stories", JSON.stringify(next));
      addRewardPoints(10);
    }
  };

  const stories = [
    { 
      id: 1, 
      label: "Superfoods", 
      icon: "🥥", 
      slides: [
        { title: "Backyard Wonders 🥥", text: "Superfoods aren't expensive imported berries! They are growing right inside your village gardens.", bg: "bg-emerald-950" },
        { title: "Moringa Magic 🌿", text: "Drumstick (Moringa) leaves contain 7x more Vitamin C than oranges and 3x more iron than spinach! Add a handful to your dal.", bg: "bg-teal-950" },
        { title: "Amla Power 🌳", text: "A single fresh Amla (Gooseberry) contains as much Vitamin C as 20 oranges. It boosts immunity against daily fevers naturally.", bg: "bg-emerald-900" }
      ]
    },
    { 
      id: 2, 
      label: "Kid Diet", 
      icon: "👶", 
      slides: [
        { title: "Growth Foundations 👶", text: "For growing kids, protein and calcium are vital for healthy bones and sharp minds during school months.", bg: "bg-amber-950" },
        { title: "Nature's Snack 🥜", text: "Skip store-bought sugary biscuits. Offer a fistful of soaked chana or peanut chikki cooked with clean organic jaggery.", bg: "bg-orange-950" },
        { title: "Ragi Malt 🌾", text: "Start their day with a warm ragi porridge. It is packed with easy-to-absorb calcium, keeping them full of energy till lunch.", bg: "bg-amber-900" }
      ]
    },
    { 
      id: 3, 
      label: "Clean Diet", 
      icon: "🥗", 
      slides: [
        { title: "Whole & Unprocessed 🥗", text: "Clean eating means choosing local whole grains and fresh foods instead of boxed, chemically enhanced processed items.", bg: "bg-emerald-950" },
        { title: "Better Staples 🌾", text: "Substitute refined white rice with minor millets like Foxtail millet or high-fiber unpolished red brown rice.", bg: "bg-teal-950" },
        { title: "Rainbow Plate 🌈", text: "Aiming for a variety of natural colors (greens, tomatoes, carrots, curd) ensures your body obtains vital minerals.", bg: "bg-emerald-900" }
      ]
    },
    { 
      id: 4, 
      label: "Millets", 
      icon: "🌾", 
      slides: [
        { title: "Heritage Grains 🌾", text: "Millets are ancient, resilient grains requiring very little water. They are packed with protein, fiber, and micronutrients.", bg: "bg-emerald-950" },
        { title: "Finger Millet (Ragi) 🦴", text: "Extremely rich in natural calcium. Consuming Ragi assists bone recovery and helps control modern diabetic blood spikes.", bg: "bg-teal-950" },
        { title: "Pearl Millet (Bajra) 🔥", text: "A powerhouse of active dietary iron and phosphorus. Daily intake helps battle chronic fatigue and is ideal for women's health.", bg: "bg-emerald-900" }
      ]
    },
    { 
      id: 5, 
      label: "Village Pro", 
      icon: "🏘️", 
      slides: [
        { title: "Locally Sourced 🏡", text: "Traditional village diets are naturally superior when simple hygiene and balanced storage rules are practiced.", bg: "bg-emerald-950" },
        { title: "Pure Cooking Oils 🪔", text: "Cook using cold-pressed groundnut, mustard, or sesame oil rather than industrially bleached multi-refined seed oils.", bg: "bg-teal-950" },
        { title: "Backyard Garden 🌱", text: "Plant clean curry leaves, coriander, and green chilies close to home for pesticide-free source of fresh organic folate.", bg: "bg-emerald-900" }
      ]
    }
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
    <div className="space-y-8 text-slate-100">
      {/* Story Circles - Instagram/Duolingo style */}
      <section className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-2 px-2">
        {stories.map(story => {
          const isSeen = seenStories.includes(story.id);
          return (
            <div key={story.id} className="flex flex-col items-center gap-2 flex-shrink-0">
              <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setActiveStory(story);
                  setActiveStorySlide(0);
                }}
                className={`w-16 h-16 rounded-full p-1 border-2 transition-colors ${
                  isSeen
                    ? 'border-slate-850/80 dark:border-slate-800' 
                    : 'border-emerald-500'
                }`}
              >
                <div className="w-full h-full rounded-full bg-[#131B2A] border border-slate-850 flex items-center justify-center text-2xl shadow-lg">
                  {story.icon}
                </div>
              </motion.button>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{story.label}</span>
            </div>
          );
        })}
      </section>

      {/* Main Greeting & Health Status */}
      <section className="relative">
        <h2 className="text-4xl font-serif italic text-indigo-400 leading-tight">Namaste, <br/><span className="not-italic font-black text-white leading-none">{profile?.displayName?.split(' ')[0]}</span></h2>
        <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute top-0 right-0 flex flex-col items-end"
        >
            <div className="flex items-center gap-2 bg-emerald-950/80 px-3 py-1.5 rounded-full border border-emerald-500/20 mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Village Ranking: #4</span>
            </div>
            <div className="flex -space-x-2">
                {familyMembers.map((m, i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-[#1D283C] flex items-center justify-center text-xs shadow-sm" title={m.name}>{m.icon}</div>
                ))}
                <div className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] text-slate-200 font-black">+2</div>
            </div>
        </motion.div>
      </section>

      {/* Traffic Light Main Metric */}
      <section className="grid grid-cols-12 gap-4">
        <motion.div 
            whileHover={{ y: -5 }}
            className="col-span-12 bg-[#131B2A] rounded-[40px] p-8 border border-slate-800 shadow-2xl shadow-indigo-950/10"
        >
            <div className="flex justify-between items-start mb-8">
                <div>
                    <p className="text-[10px] font-black text-slate-450 uppercase tracking-[0.2em] mb-1">Your NutriScore</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-6xl font-black text-white tracking-tighter">84</h3>
                        <span className="text-indigo-400 font-black">/ 100</span>
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    <div className="w-12 h-4 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/20" />
                    <div className="w-12 h-4 rounded-full bg-slate-800" />
                    <div className="w-12 h-4 rounded-full bg-slate-800" />
                </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-indigo-950/40 rounded-3xl border border-indigo-800/20">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white p-2">
                    <Zap className="w-full h-full" />
                </div>
                <p className="text-xs font-bold text-indigo-200">Your health is <span className="font-black underline">Improving</span>. Great job on the 5-day streak!</p>
            </div>
        </motion.div>
      </section>

      {/* Quick Action Grid */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="col-span-full flex items-center justify-between px-2">
            <h4 className="text-xs font-black text-slate-450 uppercase tracking-widest">Nutrition Actions</h4>
            <LayoutGrid className="w-4 h-4 text-slate-650" />
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
        <ActionCard 
            label="BMI & Weight" 
            sub="Log Progress" 
            icon={<TrendingUp />} 
            color="blue" 
            onClick={() => { setActiveTab('trackers'); setActiveTrackerModule('bmi'); }}
        />
        <ActionCard 
            label="Condition Diet" 
            sub="Therapeutic Care" 
            icon={<ShieldCheck />} 
            color="indigo" 
            onClick={() => { setActiveTab('trackers'); setActiveTrackerModule('disease'); }}
        />
        <ActionCard 
            label="Iron Wellness" 
            sub="Anemia Defense" 
            icon={<Flame />} 
            color="rose" 
            onClick={() => { setActiveTab('trackers'); setActiveTrackerModule('women'); }}
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Family Loop Interactive */}
        <section 
            onClick={() => { setActiveTab('trackers'); setActiveTrackerModule('family'); }}
            className="bg-[#131B2A] rounded-[48px] p-8 md:p-12 text-slate-100 shadow-3xl border border-slate-800 relative overflow-hidden h-full cursor-pointer hover:scale-[1.01] transition-all"
        >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl" />
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h3 className="text-2xl font-black tracking-tight text-white">Family Health Loop</h3>
                    <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-widest">Protecting 3 Members</p>
                </div>
                <motion.div whileTap={{ scale: 0.9 }} className="w-12 h-12 bg-slate-800 border-2 border-slate-700/60 rounded-2xl flex items-center justify-center">
                    <ChevronRight className="w-6 h-6 text-white" />
                </motion.div>
            </div>
            
            <div className="space-y-6">
                {familyMembers.map((member, idx) => (
                    <div key={idx} className="group cursor-pointer">
                        <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center text-2xl shadow-xl">{member.icon}</div>
                                <div>
                                    <h4 className="font-black text-sm text-white">{member.name}</h4>
                                    <p className={`text-[10px] font-black uppercase tracking-widest ${member.status === 'Healthy' ? 'text-emerald-400' : 'text-rose-400'}`}>{member.status}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase">92%</span>
                                <div className="w-16 h-1 hidden sm:block bg-slate-850 rounded-full overflow-hidden border border-slate-800">
                                    <div className="h-full bg-emerald-400 w-[92%]" />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            <button 
                onClick={(e) => { e.stopPropagation(); setActiveTab('trackers'); setActiveTrackerModule('family'); }}
                className="w-full mt-8 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-[28px] font-black text-sm flex items-center justify-center gap-3 shadow-xl transition-all"
            >
                <Plus className="w-5 h-5" />
                Add Family Member
            </button>
        </section>

        {/* Daily Progress */}
        <section className="bg-[#101725] rounded-[40px] p-8 md:p-12 border border-slate-800/60 h-full text-slate-100">
            <div className="flex justify-between items-center mb-6">
                <h4 className="text-sm font-black text-white uppercase tracking-widest">Today's Missions</h4>
                <div className="p-2 bg-indigo-950 text-indigo-400 rounded-xl border border-indigo-900/30"><Trophy className="w-4 h-4" /></div>
            </div>
            <div className="space-y-3">
                {checklist.map(item => (
                    <motion.div 
                        key={item.id}
                        layout
                        className={`flex items-center gap-4 p-5 rounded-3xl transition-all ${item.done ? 'bg-slate-900/40 border border-slate-850 opacity-40' : 'bg-slate-900 border border-slate-800 shadow-sm'}`}
                    >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.done ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-850 text-slate-450 border border-slate-800'}`}>
                            {item.done ? <CheckCircle2 className="w-5 h-5 text-white" /> : <span className="text-lg">{item.icon}</span>}
                        </div>
                        <span className={`text-[13px] font-bold ${item.done ? 'text-slate-450 line-through' : 'text-slate-200'}`}>{item.text}</span>
                        {!item.done && <Plus className="w-4 h-4 text-slate-650 ml-auto" />}
                    </motion.div>
                ))}
            </div>
        </section>
      </div>

      {/* Immersive Instagram-style Story Player Overlay */}
      <AnimatePresence>
        {activeStory && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => {
              markStoryAsSeen(activeStory.id);
              setActiveStory(null);
            }}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              className={`w-full max-w-md ${activeStory.slides[activeStorySlide].bg} text-white rounded-[40px] overflow-hidden shadow-2xl relative border border-white/10 flex flex-col h-[600px] justify-between p-8`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Progress Bar Indicators at the Top */}
              <div className="flex gap-1.5 w-full bg-white/10 p-1.5 rounded-full mb-4">
                {activeStory.slides.map((_: any, idx: number) => (
                  <div key={idx} className="h-1.5 flex-1 bg-white/20 rounded-full overflow-hidden relative">
                    <motion.div 
                      className="absolute top-0 left-0 h-full bg-white rounded-full"
                      initial={{ width: "0%" }}
                      animate={{ 
                        width: activeStorySlide > idx 
                          ? "100%" 
                          : activeStorySlide === idx 
                          ? "100%" 
                          : "0%" 
                      }}
                      transition={{ 
                        duration: activeStorySlide === idx ? 5.0 : 0.2,
                        ease: "linear"
                      }}
                      onAnimationComplete={() => {
                        if (activeStorySlide === idx) {
                          if (activeStorySlide < activeStory.slides.length - 1) {
                            setActiveStorySlide(prev => prev + 1);
                          } else {
                            markStoryAsSeen(activeStory.id);
                            setActiveStory(null);
                          }
                        }
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Header with Close option */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{activeStory.icon}</span>
                  <div>
                    <h4 className="font-black tracking-tight text-white leading-none">{activeStory.label}</h4>
                    <span className="text-[9px] font-black uppercase text-white/50 tracking-widest block mt-1.5">Village Story Coach</span>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    markStoryAsSeen(activeStory.id);
                    setActiveStory(null);
                  }}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 flex flex-col justify-center space-y-6 text-center px-4">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40">Healthy Living Mission</span>
                <h3 className="text-3xl font-black leading-snug tracking-tight text-white">
                  {activeStory.slides[activeStorySlide].title}
                </h3>
                <p className="text-white/80 font-semibold text-base leading-relaxed">
                  {activeStory.slides[activeStorySlide].text}
                </p>
              </div>

              {/* Footer navigation */}
              <div className="flex items-center justify-between border-t border-white/10 pt-6">
                <button 
                  disabled={activeStorySlide === 0}
                  onClick={() => setActiveStorySlide(prev => Math.max(0, prev - 1))}
                  className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/15 disabled:opacity-30 disabled:pointer-events-none text-xs font-black uppercase tracking-widest text-white transition-all cursor-pointer"
                >
                  Prev
                </button>
                <div className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">
                  +10 Points Reward
                </div>
                {activeStorySlide < activeStory.slides.length - 1 ? (
                  <button 
                    onClick={() => setActiveStorySlide(prev => prev + 1)}
                    className="px-8 py-3 bg-white text-emerald-950 font-black rounded-full text-xs uppercase tracking-widest hover:bg-slate-100 transition-all shadow-lg flex items-center gap-1 cursor-pointer"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button 
                    onClick={() => {
                      markStoryAsSeen(activeStory.id);
                      setActiveStory(null);
                    }}
                    className="px-8 py-3 bg-emerald-500 text-white font-black rounded-full text-xs uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-lg flex items-center gap-1 cursor-pointer"
                  >
                    Finish ★
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ActionCard({ label, sub, icon, color, onClick }: any) {
    const colors: any = {
        indigo: "bg-[#14233c] text-indigo-400 border-indigo-500/25 shadow-lg shadow-indigo-950/20 hover:bg-[#1a2d4d]",
        blue: "bg-[#0e2744] text-blue-400 border-blue-500/25 shadow-lg shadow-blue-950/20 hover:bg-[#143256]",
        rose: "bg-[#251216] text-rose-400 border-rose-500/25 shadow-lg shadow-rose-950/20 hover:bg-[#32171c]"
    };

    return (
        <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className={`p-6 rounded-[32px] border bg-[#131B2A] flex flex-col items-center gap-4 group transition-all hover:shadow-2xl hover:scale-[1.02] ${colors[color]}`}
        >
            <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center text-3xl shadow-xl transition-all group-hover:scale-110 border ${colors[color]}`}>
                {React.cloneElement(icon as any, { className: "w-8 h-8" })}
            </div>
            <div className="text-center">
                <p className="text-[13px] font-black uppercase tracking-tighter text-white">{label}</p>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{sub}</p>
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
                    <span className="font-bold text-white">{name}</span>
                </div>
                <div className="flex items-center gap-3">
                    {health && <span className="bg-rose-950 text-rose-300 border border-rose-500/20 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest">{health}</span>}
                    <span className="font-black text-slate-450">{progress}%</span>
                </div>
            </div>
            <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-850">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className={`h-full ${progress > 80 ? 'bg-emerald-400' : progress > 50 ? 'bg-orange-400' : 'bg-rose-450'}`} 
                />
            </div>
        </div>
    )
}

function QuickLog({ label, sub, icon, color, onClick }: any) {
    const colors: any = {
        blue: "bg-blue-950/80 text-blue-400 hover:bg-blue-900 hover:text-white",
        green: "bg-emerald-950/80 text-emerald-400 hover:bg-emerald-900 hover:text-white",
        rose: "bg-rose-950/80 text-rose-400 hover:bg-rose-900 hover:text-white"
    };

    return (
        <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className="flex flex-col items-center gap-3 p-6 bg-[#131B2A] rounded-[32px] border border-slate-850 shadow-sm hover:shadow-xl hover:border-slate-700 transition-all group"
        >
            <div className={`p-4 rounded-2xl transition-all group-hover:scale-110 border border-slate-800 ${colors[color]}`}>
                {React.cloneElement(icon as any, { className: "w-6 h-6" })}
            </div>
            <div className="text-center">
                <p className="text-xs font-black text-white uppercase tracking-tighter">{label}</p>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{sub}</p>
            </div>
        </motion.button>
    )
}

function StatCard({ title, val, target, icon, progress, color }: any) {
    const barColors: any = {
        blue: "bg-blue-400",
        green: "bg-emerald-400",
        orange: "bg-orange-400"
    };

    return (
        <div className="bg-[#131B2A] p-8 rounded-[40px] border border-slate-850 shadow-sm flex flex-col h-48 transition-all hover:shadow-lg hover:border-slate-700">
            <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-black text-slate-450 uppercase tracking-widest">{title}</span>
                <div className="p-2 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl">{icon}</div>
            </div>
            <div className="mt-auto">
                <div className="text-3xl font-black text-white">{val} <span className="text-xs font-normal text-slate-450">/ {target.split(' ')[0]}</span></div>
                <div className="w-full bg-slate-950 border border-slate-850 h-2 mt-4 rounded-full overflow-hidden">
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
