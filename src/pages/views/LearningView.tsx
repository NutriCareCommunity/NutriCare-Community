import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { translations } from "../../constants/translations";
import { motion, AnimatePresence } from "framer-motion";
import { db, handleFirestoreError, OperationType } from "../../lib/firebase";
import { doc, setDoc, increment } from "firebase/firestore";
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
  Info,
  X,
  Check,
  RotateCcw,
  Sparkles,
  Award
} from "lucide-react";

export default function LearningView() {
    const { language, user, profile, refreshProfile } = useApp();
    const t = translations[language] || translations.en;
    const [searchTerm, setSearchTerm] = useState("");
    const [activeFilter, setActiveFilter] = useState("all");

    // Interactive states
    const [selectedLesson, setSelectedLesson] = useState<any | null>(null);
    const [activeSlide, setActiveSlide] = useState(0);
    const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<number | null>(null);
    const [quizSubmitted, setQuizSubmitted] = useState(false);
    const [completedLessons, setCompletedLessons] = useState<number[]>(() => {
        const saved = localStorage.getItem("completed_lessons");
        return saved ? JSON.parse(saved) : [];
    });

    // Cooking Wizard states
    const [cookingStage, setCookingStage] = useState<number | null>(null); // null means not cooking, 1 to 5 are step numbers, 6 for cooking quiz, 7 for cooking success celebration!
    const [cookingQuizAnswer, setCookingQuizAnswer] = useState<number | null>(null);
    const [cookingQuizSubmitted, setCookingQuizSubmitted] = useState(false);
    const [cookingCompleted, setCookingCompleted] = useState(() => {
        return localStorage.getItem("cooking_recipe_completed") === "true";
    });

    const categories = [
        { id: "all", label: t.academy?.allTopics || "All Topics", icon: <BookOpen />, color: "green" },
        { id: "nutrition", label: t.dashboard?.mealPlanner || "Nutrition", icon: <Utensils />, color: "orange" },
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
            color: "orange",
            slides: [
                "Skipping breakfast forces your brain and muscles to operate on empty fuel. Your glycogen levels are depleted overnight, which makes concentration difficult.",
                "Eating complex carbohydrates (like millets, ragi, or whole grains) paired with high proteins (like roasted Bengal gram/chana, eggs, or cowpea) guarantees a slow, stable release of glucose into your bloodstream.",
                "Avoid starting your morning with only sweet tea and processed biscuits. They spike blood sugar immediately, leading to severe mid-morning crashes, sleepiness, and low focus by 11:00 AM."
            ],
            quiz: {
                question: "What is the best breakfast choice to maintain optimal focus and energy levels all morning?",
                options: [
                    "A couple of plain sugary biscuits with sweetened tea",
                    "Skipping breakfast completely to stay light-headed",
                    "A balanced meal combining local energy grains, pulses, and greens"
                ],
                correctAnswer: 2,
                explanation: "Correct! Complex grains paired with lentils release energy gradually over several hours, preventing dynamic fatigue or sugar drops."
            }
        },
        {
            id: 2,
            title: "Water & Hydration",
            desc: "The 8-glass myth vs actual requirements.",
            category: "nutrition",
            time: "3 min",
            type: "Video",
            icon: <Leaf className="text-blue-500" />,
            color: "blue",
            slides: [
                "Water is vital for cells to eliminate metabolic waste, digest food, lubricate joints, control core body temperature, and prevent fatigue.",
                "While eight glasses is a common rule, hydration needs scale with body-weight, local dry weather humidity, pregnancy/lactation, and physically demanding labor.",
                "Pro Tip: You don't have to count bottles strictly! Check your urine color instead. If pale straw or clear, you are fully hydrated. If dark orange, drink pure water immediately."
            ],
            quiz: {
                question: "What is the most reliable, easy indicator that your body has sufficient hydration?",
                options: [
                    "Checking if your urine is pale straw or clear and transparent",
                    "Relying solely on extreme feelings of dry-mouth thirst",
                    "Drinking exactly 5 liters of fluid whether you feel well or not"
                ],
                correctAnswer: 0,
                explanation: "Correct! Urine color corresponds directly to cellular hydration. Darker fluid signals that toxins are highly concentrated and the kidneys need water to filter them."
            }
        },
        {
            id: 3,
            title: "Hand Hygiene 101",
            desc: "Prevent common infections with proper technique.",
            category: "hygiene",
            time: "4 min",
            type: "Article",
            icon: <ShieldCheck className="text-emerald-500" />,
            color: "emerald",
            slides: [
                "Unwashed hands transfer invisible pathogens directly into meals, eyes, and noses, leading to common diarrhea, colds, worms, and food poisoning.",
                "Washing hands with simple soap and running water reduces diarrheal illness in young children by over 40% and respiratory infections by 20%.",
                "Be thorough: Lather the backs of hands, under fingernails, and between fingers. Scrubbing with water alone is off limits, as it cannot break physical grease or viral membranes."
            ],
            quiz: {
                question: "How long should you rub soap thoroughly on your hands to safely break down microbes?",
                options: [
                    "A quick 3-second splash under the water stream",
                    "At least 20 seconds of vigorous scrubbing on all hand surfaces",
                    "Only until you see the visual soap lather vanish"
                ],
                correctAnswer: 1,
                explanation: "Correct! Germs bond chemically to oils and grease on hands. Soap takes 20 seconds of physical friction to dissolve their outer walls and flush them away."
            }
        },
        {
            id: 4,
            title: "Iron-Rich Local Foods",
            desc: "Affordable ways to beat anemia.",
            category: "budget",
            time: "6 min",
            type: "Guide",
            icon: <Star className="text-rose-500" />,
            color: "rose",
            slides: [
                "Anemia is a major cause of exhaustion and developmental delays. It affects more than 50% of pregnant women and young kids in rural areas due to low iron intake.",
                "Our villages are packed with cheap, high-iron, locally grown green superfoods like Moringa (drumstick) leaves, curry leaves, bajra (pearl millet), black chickpeas, and jaggery.",
                "Critical Science Booster: Plant-based iron is hard for the intestines to absorb on its own. Pairing it with Vitamin C (like squeezing fresh lime juice or eating an amla) triples absorption!"
            ],
            quiz: {
                question: "Which nutritional compound should be eaten alongside green vegetables to maximize iron absorption?",
                options: [
                    "Caffeine from strong tea or coffee after lunch",
                    "Vitamin C from citrus fruits like lemons and amla",
                    "Extra calcium pills immediately before dinner"
                ],
                correctAnswer: 1,
                explanation: "Correct! Vitamin C chemically changes iron into a soluble state, making it highly bioavailable so your intestine can absorb it up to three times more efficiently."
            }
        }
    ];

    const cookingSteps = [
        {
            stepNum: 1,
            title: "Cleanse & Prepare",
            instruction: "Measure 1/2 cup of pearl millet (Bajra) and 1/3 cup of split yellow moong dal. Hand-pick any small stones, rinse them with clean water twice, and soak them for 30 minutes in water.",
            tip: "Soaking millet breaks down complex carbohydrates, softening the grain, reducing phytates, and making it extremely easy to digest for both kids and adults.",
            emoji: "🌾"
        },
        {
            stepNum: 2,
            title: "Tempering Ardor",
            instruction: "Heat 1 teaspoon of clean organic ghee or mustard oil in a cooker. Add 1/2 tsp cumin seeds. Once they splutter, drop in a pinch of asafoetida (hing), ginger paste, and 1/4 tsp turmeric powder.",
            tip: "Turmeric contains curcumin, an outstanding antioxidant and anti-inflammatory. Ghee contains healthy fatty acids that help your body absorb fat-soluble vitamins like Vitamin A.",
            emoji: "🔥"
        },
        {
            stepNum: 3,
            title: "Fold in Iron Greens",
            instruction: "Toss in 1 full cup of tenderly chopped Moringa (drumstick) leaves or green spinach. Sauté gently for 1 minute until the greens wilt. They release a savory, earthy aroma.",
            tip: "Moringa leaves are a localized powerhouse, holding 3x more iron than spinach, alongside folate, dietary fiber, calcium, and vitamins A & C.",
            emoji: "🌿"
        },
        {
            stepNum: 4,
            title: "Gentle Boiling",
            instruction: "Drain and add the soaked Bajra and Moong Dal into the hot spices. Sauté for 30 seconds. Pour in 4 cups of boiling water, sprinkle a pinch of salt to state, mix well, and close the lid.",
            tip: "Cook under pressure for 4 to 5 whistles until the millet is completely soft. Pearl millet is dense and needs direct heat to release its rich dietary fibers.",
            emoji: "🍲"
        },
        {
            stepNum: 5,
            title: "The Vitamin-C Magic Lock",
            instruction: "Once the pressure settles down, open the cooker lid. Mash the soft khichdi using a spoon. Immediately squeeze the juice of 1 whole fresh lemon/lime and stir gently before serving.",
            tip: "The non-heme iron in Bajra and Moringa needs citric acid from lemons to convert into the absorbable ferrous form, increasing iron bioavailability by 300%. Never cook the lemon directly; heat destroys Vitamin C!",
            emoji: "🍋"
        }
    ];

    const addRewardPoints = async (pointsToAdd: number) => {
        if (!user) {
            // Offline/Local user fallback
            const currentPoints = parseInt(localStorage.getItem("local_reward_points") || "842");
            localStorage.setItem("local_reward_points", (currentPoints + pointsToAdd).toString());
            // Store locally in custom event to update profile if needed
            window.dispatchEvent(new Event("localPointsUpdated"));
            return;
        }
        const path = `users/${user.uid}`;
        try {
            const userRef = doc(db, "users", user.uid);
            await setDoc(userRef, {
                points: increment(pointsToAdd)
            }, { merge: true });
            await refreshProfile();
        } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, path);
        }
    };

    const handleCompleteLessonQuiz = (lesson: any) => {
        if (selectedQuizAnswer === lesson.quiz.correctAnswer) {
            // User got it correct!
            setQuizSubmitted(true);
            const nextCompleted = [...completedLessons];
            if (!nextCompleted.includes(lesson.id)) {
                nextCompleted.push(lesson.id);
                localStorage.setItem("completed_lessons", JSON.stringify(nextCompleted));
                setCompletedLessons(nextCompleted);
                // Add points
                addRewardPoints(30);
            }
        } else {
            // Wrong answer
            setQuizSubmitted(true);
        }
    };

    const handleCompleteCookingQuiz = () => {
        setCookingQuizSubmitted(true);
        if (cookingQuizAnswer === 1) { // Correct answer index
            localStorage.setItem("cooking_recipe_completed", "true");
            setCookingCompleted(true);
            addRewardPoints(50);
            setCookingStage(7); // Show glorious success screen
        }
    };

    const restartLessonQuiz = () => {
        setSelectedQuizAnswer(null);
        setQuizSubmitted(false);
    };

    const filteredLessons = lessons.filter(l => 
        (activeFilter === "all" || l.category === activeFilter) &&
        (l.title.toLowerCase().includes(searchTerm.toLowerCase()) || l.desc.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-8 pb-32">
            <header className="px-2">
                <h2 className="text-3xl font-black text-gray-800 tracking-tight">{t.academy?.title || "Health Academy"}</h2>
                <div className="flex items-center gap-2 mt-1">
                    <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">{t.academy?.subtitle || "Learn to live better"}</p>
                    <span className="bg-indigo-100 text-indigo-700 font-extrabold text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        {completedLessons.length} / {lessons.length} Completed
                    </span>
                </div>
            </header>

            {/* Premium Search */}
            <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-indigo-500 transition-colors" />
                <input 
                    type="text" 
                    placeholder={t.academy?.searchPlaceholder || "Search lessons, recipes..."} 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white text-slate-800 border border-gray-100 rounded-[32px] pl-16 pr-6 py-5 text-sm font-bold shadow-sm outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-100 transition-all" 
                />
            </div>

            {/* Filter Chips */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        id={`filter-chip-${cat.id}`}
                        onClick={() => setActiveFilter(cat.id)}
                        className={`flex flex-col items-center gap-3 min-w-[100px] p-6 rounded-[32px] border transition-all ${
                            activeFilter === cat.id 
                            ? 'bg-indigo-900 border-indigo-950 text-white shadow-xl shadow-indigo-100 scale-105' 
                            : 'bg-white border-slate-100 text-gray-400 hover:border-indigo-100'
                        }`}
                    >
                        <div className={`p-3 rounded-2xl ${activeFilter === cat.id ? 'bg-white/10' : 'bg-gray-50 text-slate-400'}`}>
                            {React.cloneElement(cat.icon as any, { className: "w-5 h-5 text-inherit" })}
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest text-center whitespace-nowrap ${activeFilter === cat.id ? 'text-white' : 'text-slate-400'}`}>{cat.label}</span>
                    </button>
                ))}
            </div>

            {/* Recipe of the Day - "Budget meal planner using local foods" */}
            <section className="relative overflow-hidden bg-emerald-950 rounded-[48px] p-10 text-white shadow-2xl">
                <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12 scale-150"><Utensils className="w-48 h-48" /></div>
                <div className="relative z-10 flex flex-col h-full justify-between space-y-8">
                    <div className="flex justify-between items-start">
                        <span className="bg-white/20 px-4 py-1 rounded-full text-[8px] font-black uppercase tracking-widest backdrop-blur-md border border-white/20">{t.academy?.recipeTitle || "Recipe of the day"}</span>
                        <div className="flex items-center gap-1">
                            {cookingCompleted ? (
                                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1">★ Completed</span>
                            ) : (
                                <span className="text-orange-400 flex items-center gap-0.5"><Star className="w-4 h-4 fill-orange-400" /><Star className="w-4 h-4 fill-orange-400" /><Star className="w-4 h-4 fill-orange-400" /></span>
                            )}
                        </div>
                    </div>
                    <div>
                        <h3 className="text-3xl font-black tracking-tight leading-tight">{t.academy?.khichdi || "Iron-Rich Bajra Khichdi"}</h3>
                        <p className="text-emerald-100/60 font-medium text-sm mt-2 max-w-xs">{t.academy?.khichdiDesc || "Highly affordable meal using local millets and pulses. Perfect for anemia control."}</p>
                    </div>
                    <button 
                        id="start-cooking-recipe-btn"
                        onClick={() => {
                            setCookingStage(1);
                            setCookingQuizAnswer(null);
                            setCookingQuizSubmitted(false);
                        }}
                        className="flex items-center gap-2 bg-emerald-500 text-white px-8 py-4 rounded-[24px] font-black text-xs uppercase tracking-widest w-fit hover:bg-emerald-400 transition-all group active:scale-95 shadow-xl shadow-emerald-900/50"
                    >
                        {cookingCompleted ? "Cook Again" : (t.academy?.startCooking || "Start Cooking")} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </section>

            {/* Lesson Grid */}
            <div className="grid grid-cols-1 gap-4">
                <AnimatePresence mode="popLayout">
                    {filteredLessons.map((lesson, i) => {
                        const isFinished = completedLessons.includes(lesson.id);
                        return (
                            <motion.div
                                key={lesson.id}
                                id={`lesson-card-${lesson.id}`}
                                onClick={() => {
                                    setSelectedLesson(lesson);
                                    setActiveSlide(0);
                                    setSelectedQuizAnswer(null);
                                    setQuizSubmitted(false);
                                }}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: i * 0.1 }}
                                className={`p-6 rounded-[32px] border shadow-sm flex items-center gap-6 group hover:shadow-xl hover:border-indigo-100 transition-all cursor-pointer ${isFinished ? 'bg-indigo-50/10 border-indigo-100' : 'bg-white border-slate-100'}`}
                            >
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 shadow-inner bg-gray-50`}>
                                    {lesson.icon}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[8px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md">{lesson.type}</span>
                                        <span className="text-[8px] font-black uppercase tracking-widest text-gray-300 flex items-center gap-1"><Clock className="w-3 h-3" /> {lesson.time}</span>
                                        {isFinished && (
                                            <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-0.5"><Check className="w-2.5 h-2.5" /> Completed</span>
                                        )}
                                    </div>
                                    <h4 className="font-black text-gray-800 text-lg leading-tight group-hover:text-indigo-900 transition-colors">{lesson.title}</h4>
                                    <p className="text-gray-400 text-xs font-medium mt-1 line-clamp-1">{lesson.desc}</p>
                                </div>
                                <div className={`w-10 h-10 border rounded-full flex items-center justify-center transition-all shadow-sm ${isFinished ? 'bg-emerald-50 border-emerald-200 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white' : 'border-gray-100 text-gray-300 group-hover:bg-indigo-900 group-hover:text-white'}`}>
                                    {isFinished ? (
                                        <Check className="w-4 h-4" />
                                    ) : (
                                        <Play className="w-4 h-4 fill-current ml-1" />
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
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

            {/* Dynamic Lesson Overlay Modal */}
            <AnimatePresence>
                {selectedLesson && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
                        onClick={() => setSelectedLesson(null)}
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 30 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 30 }}
                            className="bg-white rounded-[40px] overflow-hidden shadow-2xl w-full max-w-xl border border-slate-100 flex flex-col max-h-[90vh]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="bg-indigo-900 p-8 text-white relative">
                                <button 
                                    onClick={() => setSelectedLesson(null)} 
                                    className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="bg-white/20 px-3 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest border border-white/10">{selectedLesson.type}</span>
                                    <span className="text-white/80 text-[10px] font-bold flex items-center gap-1"><Clock className="w-3 h-3" /> {selectedLesson.time}</span>
                                </div>
                                <h3 className="text-2xl font-black tracking-tight mt-1">{selectedLesson.title}</h3>
                                <p className="text-indigo-200 text-xs font-bold mt-1 uppercase tracking-wider">{selectedLesson.desc}</p>
                            </div>

                            {/* Modal Body / Slides Player */}
                            <div className="p-8 flex-1 overflow-y-auto space-y-6">
                                {activeSlide < selectedLesson.slides.length ? (
                                    // Slide Content View
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-extrabold pb-1 uppercase text-indigo-500 tracking-widest border-b border-indigo-100">Slide {activeSlide + 1} of {selectedLesson.slides.length}</span>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tutorial Guide</span>
                                        </div>
                                        <p className="text-slate-700 text-base font-medium leading-relaxed pr-2">
                                            {selectedLesson.slides[activeSlide]}
                                        </p>
                                        <div className="bg-indigo-50/50 p-4 rounded-2xl flex items-start gap-3 border border-indigo-100">
                                            <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                                            <p className="text-xs text-indigo-900/80 font-bold leading-normal">Read this carefully. An interactive micro-question will check your awareness at the end!</p>
                                        </div>
                                    </div>
                                ) : (
                                    // Micro-Quiz View
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 flex items-center gap-1">
                                                <Sparkles className="w-3 h-3" /> Step-by-Step Micro Quiz
                                            </span>
                                            <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">Earn +30 dynamic points</span>
                                        </div>
                                        <h4 className="text-lg font-black text-slate-900 leading-snug">
                                            {selectedLesson.quiz.question}
                                        </h4>
                                        <div className="flex flex-col gap-3">
                                            {selectedLesson.quiz.options.map((opt: string, optIdx: number) => {
                                                const isSelected = selectedQuizAnswer === optIdx;
                                                const isCorrect = optIdx === selectedLesson.quiz.correctAnswer;
                                                let cardStyles = "border border-slate-100 bg-gray-55 text-slate-700 hover:border-indigo-100";
                                                
                                                if (quizSubmitted) {
                                                    if (isCorrect) {
                                                        cardStyles = "border-emerald-500 bg-emerald-50 text-emerald-900";
                                                    } else if (isSelected) {
                                                        cardStyles = "border-rose-500 bg-rose-50/40 text-rose-900";
                                                    } else {
                                                        cardStyles = "opacity-50 border-slate-100 text-slate-400";
                                                    }
                                                } else if (isSelected) {
                                                    cardStyles = "border-indigo-600 bg-indigo-50/30 text-indigo-900 font-bold";
                                                }

                                                return (
                                                    <button
                                                        key={optIdx}
                                                        disabled={quizSubmitted}
                                                        onClick={() => setSelectedQuizAnswer(optIdx)}
                                                        className={`p-4 rounded-2xl text-left text-sm font-semibold transition-all ${cardStyles} flex items-center justify-between`}
                                                    >
                                                        <span>{opt}</span>
                                                        {quizSubmitted && isCorrect && <Check className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />}
                                                        {quizSubmitted && isSelected && !isCorrect && <X className="w-4 h-4 text-rose-600 shrink-0 ml-2" />}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {quizSubmitted && (
                                            <div className={`p-5 rounded-2xl border ${selectedQuizAnswer === selectedLesson.quiz.correctAnswer ? 'bg-emerald-50/60 border-emerald-100 text-emerald-900' : 'bg-rose-50/60 border-rose-100 text-rose-900'} space-y-1`}>
                                                <span className="text-[9px] font-black uppercase tracking-widest block">{selectedQuizAnswer === selectedLesson.quiz.correctAnswer ? "✓ Success Response" : "✗ Incorrect Select"}</span>
                                                <p className="text-xs font-semibold leading-relaxed">{selectedLesson.quiz.explanation}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer Controls */}
                            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                                {activeSlide < selectedLesson.slides.length ? (
                                    <>
                                        <button 
                                            disabled={activeSlide === 0}
                                            onClick={() => setActiveSlide(prev => Math.max(0, prev - 1))}
                                            className="px-5 py-3 rounded-full border border-slate-200 text-xs font-black uppercase tracking-widest text-slate-500 hover:border-indigo-200 disabled:opacity-30 disabled:pointer-events-none transition-all"
                                        >
                                            Previous
                                        </button>
                                        <div className="flex gap-1">
                                            {selectedLesson.slides.map((_: any, idx: number) => (
                                                <div key={idx} className={`w-2 h-2 rounded-full transition-all ${activeSlide === idx ? 'w-6 bg-indigo-600' : 'bg-slate-300'}`} />
                                            ))}
                                        </div>
                                        <button 
                                            onClick={() => setActiveSlide(prev => prev + 1)}
                                            className="px-6 py-3 bg-indigo-900 text-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-indigo-950 transition-all flex items-center gap-1.5"
                                        >
                                            Next <ChevronRight className="w-3.5 h-3.5" />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button 
                                            onClick={() => setActiveSlide(selectedLesson.slides.length - 1)}
                                            className="px-5 py-3 rounded-full border border-slate-200 text-xs font-black uppercase tracking-widest text-slate-500 hover:border-indigo-200 transition-all"
                                        >
                                            Back to lessons
                                        </button>
                                        
                                        {!quizSubmitted ? (
                                            <button 
                                                disabled={selectedQuizAnswer === null}
                                                onClick={() => handleCompleteLessonQuiz(selectedLesson)}
                                                className="px-8 py-3 bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-950/20"
                                            >
                                                Submit Check
                                            </button>
                                        ) : (
                                            selectedQuizAnswer === selectedLesson.quiz.correctAnswer ? (
                                                <button 
                                                    onClick={() => setSelectedLesson(null)}
                                                    className="px-8 py-3 bg-indigo-900 text-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-indigo-950 transition-all flex items-center gap-2"
                                                >
                                                    Complete Lesson <Check className="w-4 h-4" />
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={restartLessonQuiz}
                                                    className="px-8 py-3 bg-rose-500 text-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-rose-600 transition-all flex items-center gap-2"
                                                >
                                                    Retry <RotateCcw className="w-4 h-4" />
                                                </button>
                                            )
                                        )}
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Step-by-Step Cooking Simulation Overlay */}
            <AnimatePresence>
                {cookingStage !== null && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
                        onClick={() => setCookingStage(null)}
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 50 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 50 }}
                            className="bg-[#0B1524] text-white rounded-[48px] overflow-hidden shadow-2xl w-full max-w-xl border border-slate-800 flex flex-col max-h-[92vh]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header Section */}
                            <div className="bg-emerald-950 p-8 border-b border-emerald-500/20 relative">
                                <button 
                                    onClick={() => setCookingStage(null)} 
                                    className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">Active Nutrition Simulator</span>
                                <h3 className="text-2xl font-black mt-2 leading-none flex items-center gap-2 text-emerald-100">
                                    <Utensils className="w-6 h-6 text-emerald-400" />
                                    {t.academy?.khichdi || "Iron-Rich Bajra Khichdi"}
                                </h3>
                                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mt-1">Step-by-Step Cooking Mastery</p>
                            </div>

                            {/* Steps Indicator Bar */}
                            {cookingStage <= 5 && (
                                <div className="bg-emerald-950/60 px-8 py-4 flex gap-2 border-b border-emerald-500/10">
                                    {cookingSteps.map((s, idx) => (
                                        <div 
                                            key={idx} 
                                            className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                                                cookingStage > idx + 1 
                                                ? 'bg-emerald-500' 
                                                : cookingStage === idx + 1 
                                                ? 'bg-emerald-400 animate-pulse' 
                                                : 'bg-slate-800'
                                            }`} 
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Main Body */}
                            <div className="p-8 flex-1 overflow-y-auto space-y-6">
                                {cookingStage <= 5 ? (
                                    // Live cooking guide step
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Step {cookingStage} of 5</span>
                                            <span className="text-3xl">{cookingSteps[cookingStage - 1].emoji}</span>
                                        </div>
                                        <h4 className="text-xl font-black text-emerald-500 tracking-tight">{cookingSteps[cookingStage - 1].title}</h4>
                                        <p className="text-slate-300 text-sm font-semibold leading-relaxed">
                                            {cookingSteps[cookingStage - 1].instruction}
                                        </p>
                                        
                                        {/* Science Pro-tip box */}
                                        <div className="bg-emerald-950/40 p-5 rounded-3xl border border-emerald-500/10 space-y-2">
                                            <div className="flex items-center gap-2 text-emerald-400">
                                                <Info className="w-4 h-4 shrink-0" />
                                                <span className="text-[9px] font-black uppercase tracking-widest">Scientific Pro-Tip</span>
                                            </div>
                                            <p className="text-xs text-emerald-200/80 font-bold leading-normal">
                                                {cookingSteps[cookingStage - 1].tip}
                                            </p>
                                        </div>
                                    </div>
                                ) : cookingStage === 6 ? (
                                    // Recipe Final Chemistry Quiz
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">Final Culinary Assessment</span>
                                            <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Earn +50 points</span>
                                        </div>
                                        <h4 className="text-lg font-black text-emerald-100">
                                            Why is squeezing fresh lemon juice over your warm Bajra & Moringa spinach khichdi highly crucial?
                                        </h4>
                                        <div className="flex flex-col gap-3">
                                            {[
                                                "It hides the earthy taste of local grains completely",
                                                "Vitamin C in lemon triples iron bioavailability/absorption",
                                                "It keeps the khichdi warm and stops it from going stale"
                                            ].map((opt, optIdx) => {
                                                const isSelected = cookingQuizAnswer === optIdx;
                                                const isCorrect = optIdx === 1; // Option 2 is correct
                                                let stateStyles = "border border-slate-700 bg-slate-900 text-slate-300 hover:border-emerald-500";

                                                if (cookingQuizSubmitted) {
                                                    if (isCorrect) {
                                                        stateStyles = "border-emerald-500 bg-emerald-950/60 text-emerald-200 font-extrabold";
                                                    } else if (isSelected) {
                                                        stateStyles = "border-rose-500 bg-rose-950/40 text-rose-300";
                                                    } else {
                                                        stateStyles = "opacity-40 border-slate-800 text-slate-500";
                                                    }
                                                } else if (isSelected) {
                                                    stateStyles = "border-emerald-500 bg-emerald-950/25 text-emerald-300 font-bold shadow-md shadow-emerald-950/20";
                                                }

                                                return (
                                                    <button
                                                        key={optIdx}
                                                        disabled={cookingQuizSubmitted}
                                                        onClick={() => setCookingQuizAnswer(optIdx)}
                                                        className={`p-4 rounded-2xl text-left text-sm font-semibold transition-all flex items-center justify-between ${stateStyles}`}
                                                    >
                                                        <span>{opt}</span>
                                                        {cookingQuizSubmitted && isCorrect && <Check className="w-4 h-4 text-emerald-400 ml-2 shrink-0" />}
                                                        {cookingQuizSubmitted && isSelected && !isCorrect && <X className="w-4 h-4 text-rose-400 ml-2 shrink-0" />}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {cookingQuizSubmitted && (
                                            <div className={`p-4 rounded-2xl border ${cookingQuizAnswer === 1 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-rose-500/10 border-rose-500/20 text-rose-300'}`}>
                                                <p className="text-xs font-bold leading-normal">
                                                    {cookingQuizAnswer === 1 
                                                        ? "Magnificent! Ascorbic acid (Vitamin C) directly changes insoluble trivalent plant iron in Moringa/millet into soluble divalent iron, which transfers effortlessly across the intestinal boundary cell." 
                                                        : "Oops, that is incorrect. Vitamin C does not affect shelf-life or taste concealment, but it acts as a cofactor required by the intestine to absorb ferric ions. Try again!"
                                                    }
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    // Glorious success celebration screen!
                                    <div className="space-y-6 text-center py-8">
                                        <div className="w-24 h-24 bg-gradient-to-tr from-emerald-400 to-teal-500 text-white rounded-[40px] flex items-center justify-center mx-auto shadow-2xl shadow-emerald-900/40 animate-bounce">
                                            <Award className="w-12 h-12" />
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="text-3xl font-black text-emerald-400 tracking-tight leading-none">Healthy Cook Unlocks!</h4>
                                            <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em]">You became a Culinary Doctor!</p>
                                        </div>
                                        <p className="text-slate-200 font-medium text-sm leading-relaxed max-w-sm mx-auto">
                                            You successfully cooked the nutrition rich <strong>Bajra Khichdi</strong> with Vitamin C iron boosters! Your points balance increased by <strong>+50 dynamic health tokens</strong>.
                                        </p>
                                        <div className="bg-emerald-900/20 p-4 rounded-3xl border border-emerald-500/10 text-emerald-400 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2">
                                            <CheckCircle2 className="w-5 h-5" /> Added to Family nutrition logs
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer Controls */}
                            <div className="p-6 bg-[#090E18] border-t border-slate-800/60 flex justify-between items-center">
                                {cookingStage <= 5 ? (
                                    <>
                                        <button 
                                            disabled={cookingStage === 1}
                                            onClick={() => setCookingStage(prev => prev! - 1)}
                                            className="px-5 py-3 rounded-full border border-slate-800 text-xs font-black uppercase tracking-widest text-slate-400 hover:border-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-all"
                                        >
                                            Back
                                        </button>
                                        
                                        <button 
                                            onClick={() => setCookingStage(prev => prev! + 1)}
                                            className="px-6 py-3 bg-emerald-500 text-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-emerald-450 transition-all flex items-center gap-1.5"
                                        >
                                            Next Step <ChevronRight className="w-3.5 h-3.5" />
                                        </button>
                                    </>
                                ) : cookingStage === 6 ? (
                                    <>
                                        <button 
                                            onClick={() => setCookingStage(5)}
                                            className="px-5 py-3 rounded-full border border-slate-800 text-xs font-black uppercase tracking-widest text-slate-400 hover:border-slate-700 transition-all"
                                        >
                                            Back to steps
                                        </button>
                                        
                                        {!cookingQuizSubmitted ? (
                                            <button 
                                                disabled={cookingQuizAnswer === null}
                                                onClick={handleCompleteCookingQuiz}
                                                className="px-8 py-3 bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-950/20"
                                            >
                                                Submit Check
                                            </button>
                                        ) : (
                                            cookingQuizAnswer === 1 ? (
                                                <button 
                                                    onClick={() => setCookingStage(7)}
                                                    className="px-8 py-3 bg-emerald-500 text-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-emerald-600 transition-all"
                                                >
                                                    Claim Rewards!
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={() => {
                                                        setCookingQuizAnswer(null);
                                                        setCookingQuizSubmitted(false);
                                                    }}
                                                    className="px-8 py-3 bg-rose-500 text-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-rose-600 transition-all flex items-center gap-2"
                                                >
                                                    Retry <RotateCcw className="w-4 h-4" />
                                                </button>
                                            )
                                        )}
                                    </>
                                ) : (
                                    <button 
                                        onClick={() => setCookingStage(null)}
                                        className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 transition-all text-white rounded-full text-xs font-black uppercase tracking-widest text-center"
                                    >
                                        Fantastic! Close Player
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
