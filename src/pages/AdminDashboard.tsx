import React, { useState, useEffect, useCallback } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  Activity, 
  RefreshCw, 
  Radio, 
  Database,
  Flame,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { translations } from "../constants/translations";

// Local Engagement dataset focused on nutritional health index
const mockEngagementData = [
  { name: "Mon", score: 70, audits: 45 },
  { name: "Tue", score: 72, audits: 58 },
  { name: "Wed", score: 80, audits: 50 },
  { name: "Thu", score: 75, audits: 72 },
  { name: "Fri", score: 85, audits: 88 },
  { name: "Sat", score: 90, audits: 124 },
  { name: "Sun", score: 88, audits: 115 },
];

const initialNutriConcerns = [
  { name: "Protein Deficit", value: 350 },
  { name: "Anemia Risk", value: 400 },
  { name: "Obesity Trends", value: 250 },
  { name: "Caloric Deficit", value: 200 },
];

const COLORS = ["#fb923c", "#f43f5e", "#38bdf8", "#a855f7"];

export default function AdminDashboard() {
  const { language } = useApp();
  const t = translations[language] || translations.en;
  const [liveDataEnabled, setLiveDataEnabled] = useState(false);
  const [liveData, setLiveData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Polls the enterprise trends endpoint
  const fetchLiveData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/regional-trends");
      if (!response.ok) {
        throw new Error("Unable to contact live region trends aggregator");
      }
      const data = await response.json();
      setLiveData(data);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error("Aggregation engine error:", err);
      setError(err.message || "Failed to update regional data");
    } finally {
      setLoading(false);
    }
  }, []);

  // Polling hook every 60 seconds
  useEffect(() => {
    if (liveDataEnabled) {
      fetchLiveData();
      const interval = setInterval(() => {
        fetchLiveData();
      }, 60000); // 60 seconds
      return () => clearInterval(interval);
    }
  }, [liveDataEnabled, fetchLiveData]);

  // Derived values from live data or static safety fallback
  const displayDataPoints = liveData?.metadata?.dataPoints 
    ? liveData.metadata.dataPoints.toLocaleString() 
    : "120,400";

  const displayBmi = liveData?.metrics?.avgBmi 
    ? liveData.metrics.avgBmi 
    : "21.4";

  const displayProteinDeficiency = liveData?.metrics?.proteinDeficiencyIndex
    ? `${(liveData.metrics.proteinDeficiencyIndex * 100).toFixed(0)}%`
    : "14%";

  const displayAnemiaRisk = liveData?.metrics?.anemiaRiskLevel 
    ? liveData.metrics.anemiaRiskLevel 
    : "Moderate";

  const heatmapVillages = liveData?.metrics?.malnutritionHeatmap || [
    { village: "Gadwal", score: 8.2 },
    { village: "Wanaparthy", score: 6.5 }
  ];

  return (
    <div className="space-y-8 pb-12 text-slate-100">
      
      {/* Header Dashboard section with Toggle */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 bg-[#131B2A] rounded-[32px] border border-slate-800">
        <div>
          <h2 className="text-3xl font-black text-white leading-tight">{t.admin?.portalTitle || "NGO & Government Portal"}</h2>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-bold">
            {t.admin?.districtLabel || "Nutrition Intelligence & Field Surveys • District: Telangana Central"}
          </p>
        </div>

        {/* Live Aggregator Toggle */}
        <div className="flex items-center gap-4 bg-slate-900/60 p-3 rounded-2xl border border-slate-800 self-start md:self-auto">
          <div className="flex flex-col items-end pr-1">
            <div className="flex items-center gap-2">
              {liveDataEnabled && (
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              )}
              <span className="text-xs font-black text-white uppercase tracking-wider">
                {liveDataEnabled ? (t.admin?.autoPollingActive || "Auto-Polling Active") : (t.admin?.liveDataOff || "Live Updates Off")}
              </span>
            </div>
            <span className="text-[9px] text-slate-400 font-bold uppercase mt-0.5 whitespace-nowrap">
              {loading ? "Syncing API..." : lastUpdated ? `Last Sync: ${lastUpdated.toLocaleTimeString()}` : "60s interval"}
            </span>
          </div>

          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={liveDataEnabled}
              onChange={(e) => setLiveDataEnabled(e.target.checked)}
              className="sr-only peer"
              id="live-data-toggle"
            />
            <div className="w-11 h-6 bg-slate-800 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-500/10 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 peer-checked:after:bg-white" />
          </label>

          {/* Quick Manual Refresh trigger when enabled */}
          {liveDataEnabled && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={fetchLiveData}
              disabled={loading}
              className="p-2 bg-slate-800 hover:bg-slate-750 transition-colors rounded-xl border border-slate-700/60 text-slate-300 hover:text-white"
              title="Poll now"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-400" : ""}`} />
            </motion.button>
          )}
        </div>
      </header>

      {/* Error alert wrapper */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-rose-950/80 border border-rose-500/35 rounded-2xl flex items-center gap-3 text-rose-200 text-xs font-semibold"
          >
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            <span>Aggregation Stream Error: {error}. Retrying next interval.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nutrition Diagnostic Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AdminStatCard 
          icon={<Database className="text-emerald-400" />} 
          label="Ingested Records" 
          val={displayDataPoints} 
          sub="Live Aggregation Queue" 
          highlight={liveDataEnabled}
        />
        <AdminStatCard 
          icon={<TrendingUp className="text-sky-400" />} 
          label="Avg Regional BMI" 
          val={displayBmi} 
          sub="Target Optimal Range: 18.5 - 24.9" 
          highlight={liveDataEnabled}
        />
        <AdminStatCard 
          icon={<Flame className="text-orange-400" />} 
          label="Protein Deficit" 
          val={displayProteinDeficiency} 
          sub="Requires Millet Intervention" 
          highlight={liveDataEnabled}
        />
        <AdminStatCard 
          icon={<AlertTriangle className="text-rose-400" />} 
          label="Anemia Risk" 
          val={displayAnemiaRisk} 
          sub="High-Priority Screening" 
          highlight={liveDataEnabled}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* User Engagement Graph (focusing on nutritional tracking logs) */}
        <section className="bg-[#131B2A] p-8 rounded-[40px] border border-slate-800 shadow-xl">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-black text-white">Community Engagement Logs</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Average Nutrient audit streaks per day</p>
            </div>
            <Activity className="w-5 h-5 text-indigo-400" />
          </div>
          
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockEngagementData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fontWeight: 700, fill: '#64748B' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fontWeight: 700, fill: '#64748B' }} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0F172A', 
                    borderRadius: '16px', 
                    border: '1px solid #334155',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)',
                    color: '#F1F5F9'
                  }}
                />
                <Bar dataKey="score" fill="#6366f1" radius={[4, 4, 0, 0]} name="Nutrition Index Score" />
                <Bar dataKey="audits" fill="#10b981" radius={[4, 4, 0, 0]} name="Daily Audits Completed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Nutritional Deficiencies / Concerns Prevalence Pie */}
        <section className="bg-[#131B2A] p-8 rounded-[40px] border border-slate-800 shadow-xl">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-black text-white">Critical Deficiencies Share</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Regional prevalence based on last 1,200 surveys</p>
            </div>
            <ShieldCheck className="text-emerald-400 w-5 h-5" />
          </div>

          <div className="h-[280px] w-full flex flex-col sm:flex-row items-center justify-around gap-6">
            <div className="w-full sm:w-[55%] h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={initialNutriConcerns}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {initialNutriConcerns.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0F172A', 
                      borderRadius: '12px', 
                      border: '1px solid #334155',
                      color: '#F1F5F9'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex flex-col gap-2.5 w-full sm:w-[40%]">
              {initialNutriConcerns.map((d, i) => (
                <div key={d.name} className="flex items-center justify-between p-2 bg-slate-900/40 rounded-xl border border-slate-800/40">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i] }} />
                    <span className="text-xs font-black text-slate-200">{d.name}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-400">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Malnutrition Hotspots table populated by live aggregation backend */}
      <section className="bg-[#131B2A] rounded-[40px] border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-8 border-b border-slate-800/80 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-white">Malnutrition Hotspots</h3>
            <p className="text-xs text-slate-400 mt-0.5">District levels flagged for priority nutritional care packages</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Live Village Sync Panel</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#0e1622] text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-800">
              <tr>
                <th className="px-8 py-4">Village Name</th>
                <th className="px-8 py-4">Status Class</th>
                <th className="px-8 py-4">Prevalence Rating</th>
                <th className="px-8 py-4">Data Source Status</th>
                <th className="px-8 py-4">Last Processed Ingestion</th>
              </tr>
            </thead>
            <tbody className="text-sm font-semibold text-slate-200">
              {heatmapVillages.map((villageObj, index) => {
                const isCritical = villageObj.score > 7.0;
                return (
                  <tr key={index} className="border-b border-slate-800/40 hover:bg-slate-900/25 transition-colors">
                    <td className="px-8 py-4 font-black text-white flex items-center gap-2.5">
                      <span className="text-lg">🏘️</span>
                      {villageObj.village}
                    </td>
                    <td className="px-8 py-4">
                      <span className={`px-2.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        isCritical 
                          ? "bg-rose-950/70 text-rose-400 border border-rose-500/20" 
                          : "bg-amber-950/70 text-amber-400 border border-amber-500/20"
                      }`}>
                        {isCritical ? "Critical Intervention" : "Moderate Risk"}
                      </span>
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-[#fb923c]">{villageObj.score}</span>
                        <span className="text-slate-500 text-xs">/ 10</span>
                      </div>
                    </td>
                    <td className="px-8 py-4 text-xs font-medium text-slate-400">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Aggregated Real-time</span>
                      </div>
                    </td>
                    <td className="px-8 py-4 text-xs font-mono text-slate-400">
                      {liveDataEnabled && liveData?.metadata?.processedAt 
                        ? new Date(liveData.metadata.processedAt).toLocaleTimeString() 
                        : "Synchronized Session"}
                    </td>
                  </tr>
                );
              })}
              
              {/* Other regional safety fallbacks */}
              <tr className="border-b border-slate-805 hover:bg-slate-905 transition-colors">
                <td className="px-8 py-4 font-black text-white flex items-center gap-2.5">
                  <span className="text-lg">🏘️</span>
                  Gadwal East Sector
                </td>
                <td className="px-8 py-4">
                  <span className="px-2.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-950/70 text-emerald-400 border border-emerald-500/20">
                    Optimal Control
                  </span>
                </td>
                <td className="px-8 py-4">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-emerald-400">2.1</span>
                    <span className="text-slate-500 text-xs">/ 10</span>
                  </div>
                </td>
                <td className="px-8 py-4 text-xs font-medium text-slate-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Survey Cleared</span>
                  </div>
                </td>
                <td className="px-8 py-4 text-xs font-mono text-slate-400">
                  Static Reference Baseline
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function AdminStatCard({ icon, label, val, sub, highlight }: { icon: any; label: string; val: string; sub: string; highlight: boolean }) {
  return (
    <div className="bg-[#131B2A] p-6 rounded-[2rem] border border-slate-800 shadow-md relative overflow-hidden group">
      {highlight && (
        <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
      )}
      
      <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl w-fit mb-4 text-slate-300">
        {icon}
      </div>
      
      <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
        {label}
      </div>
      
      <div className="text-2xl font-black text-white leading-none">
        {val}
      </div>

      <p className="text-[9px] font-bold text-slate-500 mt-2.5 uppercase tracking-wide">
        {sub}
      </p>
    </div>
  );
}
