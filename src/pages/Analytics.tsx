import { useMemo } from 'react';
import { format, parseISO, isSameDay } from 'date-fns';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatTime } from '../utils/time';
import { ArrowLeft, Clock, Zap, Target, LayoutGrid } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Session } from '../types';

interface Props {
  sessions: Session[];
  onBack: () => void;
}

const COLORS = ['#f472b6', '#818cf8', '#34d399']; // Pink, Indigo, Emerald

export default function Analytics({ sessions, onBack }: Props) {
  
  const stats = useMemo(() => {
    const totalDuration = sessions.reduce((acc, curr) => acc + curr.duration, 0);
    
    const purposeCounts: Record<string, number> = {};
    sessions.forEach(s => {
      if(s.type === 'timer') purposeCounts[s.title] = (purposeCounts[s.title] || 0) + 1;
    });
    
    // Convert to array for sorting
    const sortedPurposes = Object.entries(purposeCounts).sort((a,b) => b[1] - a[1]);
    const mostCommon = sortedPurposes[0]?.[0] || '—';
    const topPurposeCount = sortedPurposes[0]?.[1] || 0;

    return { totalDuration, totalSessions: sessions.length, mostCommon, topPurposeCount };
  }, [sessions]);

  // Chart Logic (Same as before, just styled differently in render)
  const chartData = useMemo(() => {
    const days = Array.from({length: 7}, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d;
    });
    return days.map(day => {
      const daySessions = sessions.filter(s => isSameDay(parseISO(s.createdAt), day));
      const duration = daySessions.reduce((acc, curr) => acc + curr.duration, 0);
      return { name: format(day, 'EEE'), minutes: Math.round(duration / 60) };
    });
  }, [sessions]);

  const pieData = useMemo(() => {
    const timer = sessions.filter(s => s.type === 'timer').length;
    const stopwatch = sessions.filter(s => s.type === 'stopwatch').length;
    return [{ name: 'Timer', value: timer }, { name: 'Stopwatch', value: stopwatch }];
  }, [sessions]);

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <button onClick={onBack} className="absolute top-6 left-6 text-white/50 hover:text-white flex items-center gap-2 transition-colors">
          <ArrowLeft size={20} /> Back
        </button>
        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
          <LayoutGrid size={40} className="text-white/20" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">No Data Yet</h2>
        <p className="text-white/50 max-w-xs">Complete your first focus session to unlock the dashboard.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto p-6 md:p-10 h-full overflow-y-auto no-scrollbar">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={onBack} className="group flex items-center gap-2 text-white/60 hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-full hover:bg-white/10">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
            <span className="text-sm font-medium">Dashboard</span>
          </button>
          <div className="flex items-center gap-2 text-sm text-white/40 bg-black/20 px-3 py-1 rounded-full border border-white/5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Live Data
          </div>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          
          {/* Main Stat - Total Time */}
          <div className="md:col-span-2 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <Clock size={80} />
            </div>
            <p className="text-indigo-200 text-sm font-medium uppercase tracking-wider mb-2">Total Focus Time</p>
            <p className="text-5xl font-mono font-bold text-white tracking-tight">{formatTime(stats.totalDuration)}</p>
          </div>

          {/* Stat - Session Count */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] flex flex-col justify-between hover:bg-white/10 transition-colors">
            <div className="bg-emerald-500/20 w-10 h-10 rounded-full flex items-center justify-center mb-4 text-emerald-300">
              <Zap size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.totalSessions}</p>
              <p className="text-white/40 text-sm">Sessions</p>
            </div>
          </div>

          {/* Stat - Top Focus */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] flex flex-col justify-between hover:bg-white/10 transition-colors">
            <div className="bg-pink-500/20 w-10 h-10 rounded-full flex items-center justify-center mb-4 text-pink-300">
              <Target size={20} />
            </div>
            <div>
              <p className="text-xl font-bold text-white truncate w-full" title={stats.mostCommon}>{stats.mostCommon}</p>
              <p className="text-white/40 text-sm">Most Frequent</p>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Bar Chart */}
          <div className="md:col-span-2 bg-black/20 backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] h-80">
            <h3 className="text-white/80 font-medium mb-6 flex items-center gap-2"><LayoutGrid size={16}/> Weekly Activity</h3>
            <ResponsiveContainer width="100%" height="80%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)', radius: 8}}
                  contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #333', borderRadius: '12px', color: '#fff' }}
                />
                <Bar dataKey="minutes" fill="#818cf8" radius={[6, 6, 6, 6]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          <div className="bg-black/20 backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] h-80">
            <h3 className="text-white/80 font-medium mb-2">Mode Split</h3>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e1e1e', border: 'none', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

        </div>
      </motion.div>
    </div>
  );
}