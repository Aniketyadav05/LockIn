import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, TrendingUp, History, Filter } from 'lucide-react';
import type { Session } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sessions: Session[];
}

export default function StatsBoard({ isOpen, onClose, sessions }: Props) {
  const [filter, setFilter] = useState<'all' | 'focus' | 'stopwatch'>('all');

  // 🧠 STATS CALCULATIONS
  const stats = useMemo(() => {
    // 1. Normalize Data
    const cleanSessions = sessions.map(s => ({
      ...s,
      date: new Date(s.timestamp || s.createdAt || Date.now()),
      duration: s.duration || 0
    })).sort((a, b) => b.date.getTime() - a.date.getTime());

    // 2. Filter
    const filtered = filter === 'all' ? cleanSessions : cleanSessions.filter(s => s.type.toLowerCase() === filter);

    // 3. Totals
    const totalMinutes = filtered.reduce((acc, s) => acc + s.duration, 0);
    const totalHours = (totalMinutes / 60).toFixed(1);
    
    // 4. Today's Stats
    const today = new Date();
    const todaySessions = filtered.filter(s => 
      s.date.getDate() === today.getDate() && 
      s.date.getMonth() === today.getMonth() &&
      s.date.getFullYear() === today.getFullYear()
    );
    const todayMinutes = todaySessions.reduce((acc, s) => acc + s.duration, 0);

    // 5. Weekly Activity Chart (Last 7 Days)
    const chartData = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i)); // Go back from 6 days ago to today
      
      const daySessions = cleanSessions.filter(s => 
        s.date.getDate() === d.getDate() && 
        s.date.getMonth() === d.getMonth()
      );
      
      const dayMinutes = daySessions.reduce((acc, s) => acc + s.duration, 0);
      return {
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        minutes: dayMinutes,
        isToday: i === 6
      };
    });

    // 6. Max value for chart scaling
    const maxChartValue = Math.max(...chartData.map(d => d.minutes), 60); // Min 60 to prevent flat charts

    return { totalMinutes, totalHours, todayMinutes, chartData, maxChartValue, history: filtered };
  }, [sessions, filter]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-md"
        >
          <div className="w-full max-w-4xl h-full max-h-[800px] bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden relative">
            
            {/* 🛑 CLOSE BUTTON */}
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors z-10"
            >
              <X size={20} />
            </button>

            {/* 🟢 HEADER */}
            <div className="p-8 border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent">
               <h2 className="text-3xl font-bold text-white mb-1">Your Progress</h2>
               <p className="text-white/40 text-sm">Consistency is key. Keep it up!</p>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
              
              {/* 📊 KEY METRICS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                 {/* Card 1: Total Time */}
                 <div className="bg-white/5 border border-white/5 p-6 rounded-2xl flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-indigo-400 mb-2">
                       <Clock size={18} /> <span className="text-xs font-bold uppercase tracking-wider">Total Focus</span>
                    </div>
                    <div className="text-4xl font-mono font-bold text-white">
                       {stats.totalHours}<span className="text-lg text-white/40">h</span>
                    </div>
                 </div>

                 {/* Card 2: Today */}
                 <div className="bg-white/5 border border-white/5 p-6 rounded-2xl flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-emerald-400 mb-2">
                       <TrendingUp size={18} /> <span className="text-xs font-bold uppercase tracking-wider">Today</span>
                    </div>
                    <div className="text-4xl font-mono font-bold text-white">
                       {stats.todayMinutes}<span className="text-lg text-white/40">m</span>
                    </div>
                 </div>

                 {/* Card 3: Sessions */}
                 <div className="bg-white/5 border border-white/5 p-6 rounded-2xl flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-orange-400 mb-2">
                       <Calendar size={18} /> <span className="text-xs font-bold uppercase tracking-wider">Sessions</span>
                    </div>
                    <div className="text-4xl font-mono font-bold text-white">
                       {stats.history.length}
                    </div>
                 </div>
              </div>

              {/* 📈 WEEKLY CHART */}
              <div className="mb-8">
                 <h3 className="text-sm font-bold text-white/60 mb-4 uppercase tracking-wider">Last 7 Days</h3>
                 <div className="h-40 flex items-end justify-between gap-2 md:gap-4">
                    {stats.chartData.map((d, i) => (
                       <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                          <div className="relative w-full flex justify-center items-end h-32 bg-white/5 rounded-xl overflow-hidden">
                             <motion.div 
                               initial={{ height: 0 }}
                               animate={{ height: `${(d.minutes / stats.maxChartValue) * 100}%` }}
                               transition={{ delay: i * 0.1, type: 'spring' }}
                               className={`w-full mx-1 rounded-t-lg min-h-[4px] ${d.isToday ? 'bg-indigo-500' : 'bg-white/20 group-hover:bg-white/30'} transition-colors`}
                             />
                             <div className="absolute opacity-0 group-hover:opacity-100 bottom-2 text-[10px] font-bold text-white bg-black/80 px-2 py-1 rounded">
                                {d.minutes}m
                             </div>
                          </div>
                          <span className={`text-[10px] font-bold uppercase ${d.isToday ? 'text-indigo-400' : 'text-white/30'}`}>
                             {d.day}
                          </span>
                       </div>
                    ))}
                 </div>
              </div>

              {/* 📜 HISTORY LIST */}
              <div>
                 <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider flex items-center gap-2">
                       <History size={16} /> Recent Sessions
                    </h3>
                    
                    {/* Filter Tabs */}
                    <div className="flex bg-white/5 p-1 rounded-lg">
                       {(['all', 'focus', 'stopwatch'] as const).map(f => (
                          <button 
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${filter === f ? 'bg-white/20 text-white' : 'text-white/30 hover:text-white'}`}
                          >
                             {f}
                          </button>
                       ))}
                    </div>
                 </div>

                 <div className="space-y-2">
                    {stats.history.length === 0 ? (
                       <div className="text-center py-10 text-white/20 text-sm">No sessions recorded yet. Start focusing!</div>
                    ) : (
                       stats.history.map((s, idx) => (
                          <div key={idx} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-colors">
                             <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${s.type === 'Focus' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
                                   {s.type === 'Focus' ? <Clock size={18} /> : <TrendingUp size={18} />}
                                </div>
                                <div>
                                   <p className="text-sm font-bold text-white capitalize">{s.type} Session</p>
                                   <p className="text-xs text-white/40">{s.date.toLocaleDateString()} • {s.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                </div>
                             </div>
                             <div className="text-right">
                                <p className="text-lg font-mono font-bold text-white">{s.duration}m</p>
                             </div>
                          </div>
                       ))
                    )}
                 </div>
              </div>

            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}