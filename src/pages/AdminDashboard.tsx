import React from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { motion } from "framer-motion";
import { Users, ClipboardList, TrendingUp, AlertTriangle } from "lucide-react";

const mockData = [
  { name: "Mon", users: 40, healthScore: 70 },
  { name: "Tue", users: 55, healthScore: 72 },
  { name: "Wed", users: 48, healthScore: 80 },
  { name: "Thu", users: 70, healthScore: 75 },
  { name: "Fri", users: 85, healthScore: 85 },
  { name: "Sat", users: 120, healthScore: 90 },
  { name: "Sun", users: 110, healthScore: 88 },
];

const diseaseData = [
  { name: "Diabetes", value: 400 },
  { name: "BP", value: 300 },
  { name: "Obesity", value: 500 },
  { name: "Anemia", value: 200 },
];

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"];

export default function AdminDashboard() {
  return (
    <div className="space-y-8 pb-12">
      <header className="flex items-center justify-between">
            <h2 className="text-3xl font-black text-slate-900 leading-tight">Admin Overview</h2>
            <div className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl text-xs font-black uppercase tracking-widest">Live Updates</div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AdminStatCard icon={<Users className="text-emerald-500" />} label="Total Users" val="1,284" change="+12%" />
        <AdminStatCard icon={<ClipboardList className="text-sky-500" />} label="Surveys" val="452" change="+5%" />
        <AdminStatCard icon={<TrendingUp className="text-orange-500" />} label="Avg Score" val="82.4" change="+8.2" />
        <AdminStatCard icon={<AlertTriangle className="text-rose-500" />} label="Risk Cases" val="24" change="-3%" />
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* User Growth Chart */}
        <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 mb-6">User Engagement</h3>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mockData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#94a3b8' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#94a3b8' }} />
                        <Tooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        />
                        <Bar dataKey="users" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </section>

        {/* Disease Prevalence */}
        <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 mb-6">Regional Disease Prevalence</h3>
            <div className="h-[300px] w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={diseaseData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {diseaseData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-2">
                    {diseaseData.map((d, i) => (
                        <div key={d.name} className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                            <span className="text-xs font-bold text-slate-600">{d.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
      </div>

      {/* Recent Survey Table */}
      <section className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900">Recent Community Reports</h3>
            <button className="text-emerald-600 font-bold text-sm">Download PDF</button>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <tr>
                        <th className="px-8 py-4">Region</th>
                        <th className="px-8 py-4">Status</th>
                        <th className="px-8 py-4">Avg BMI</th>
                        <th className="px-8 py-4">Last Updated</th>
                    </tr>
                </thead>
                <tbody className="text-sm font-bold text-slate-600">
                    <tr className="border-b border-slate-50">
                        <td className="px-8 py-4 font-black text-slate-900">Andhra Pradesh</td>
                        <td className="px-8 py-4"><span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px]">Healthy</span></td>
                        <td className="px-8 py-4">22.1</td>
                        <td className="px-8 py-4">2h ago</td>
                    </tr>
                    <tr className="border-b border-slate-50">
                        <td className="px-8 py-4 font-black text-slate-900">Telangana</td>
                        <td className="px-8 py-4"><span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px]">Moderate</span></td>
                        <td className="px-8 py-4">24.5</td>
                        <td className="px-8 py-4">5h ago</td>
                    </tr>
                </tbody>
            </table>
        </div>
      </section>
    </div>
  );
}

function AdminStatCard({ icon, label, val, change }: any) {
    return (
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <div className="p-3 bg-slate-50 rounded-xl w-fit mb-4">{icon}</div>
            <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{label}</div>
            <div className="flex items-end justify-between">
                <div className="text-2xl font-black text-slate-900">{val}</div>
                <div className={`text-[10px] font-black ${change.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>{change}</div>
            </div>
        </div>
    )
}
