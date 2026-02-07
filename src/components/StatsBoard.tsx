import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Trophy, Zap, Crown, History, TrendingUp, Activity, Award,
  Briefcase, BookOpen, Code2, Dumbbell, Coffee, PenTool, BrainCircuit, User, Users, PieChart
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  squadData: any;
  myEmail: string; // 👈 ADDED THIS PROP
}

// 🎨 TAG CONFIG
const TAG_CONFIG: Record<string, { icon: any, color: string, bg: string, label: string }> = {
  work: { icon: Briefcase, color: 'text-sky-400', bg: 'bg-sky-500/10', label: 'Work' },
  study: { icon: BookOpen, color: 'text-pink-400', bg: 'bg-pink-500/10', label: 'Study' },
  code: { icon: Code2, color: 'text-cyan-400', bg: 'bg-cyan-500/10', label: 'Code' },
  create: { icon: PenTool, color: 'text-purple-400', bg: 'bg-purple-500/10', label: 'Create' },
  read: { icon: Coffee, color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Read' },
  fitness: { icon: Dumbbell, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Fitness' },
  default: { icon: BrainCircuit, color: 'text-indigo-400', bg: 'bg-indigo-500/10', label: 'Focus' }
};

// 🏃‍♂️ VARIANTS
const overlayVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } };
const modalVariants = { hidden: { opacity: 0, scale: 0.95, y: 20 }, visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 30 } }, exit: { opacity: 0, scale: 0.95, y: 20 } };
const contentVariants = { hidden: { opacity: 0, x: -10 }, visible: { opacity: 1, x: 0, transition: { staggerChildren: 0.05 } }, exit: { opacity: 0, x: 10 } };
const itemVariants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };

// 🧱 COMPONENTS
const ProgressBar = ({ progress }: { progress: number }) => (
  <div className="relative h-2 bg-white/10 rounded-full overflow-hidden w-full">
    <motion.div className="absolute top-0 left-0 h-full bg-indigo-500" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1 }}>
      <div className="absolute inset-0 bg-white/20" />
    </motion.div>
  </div>
);

const RankBadge = ({ level }: { level: number }) => (
  <div className="relative w-16 h-16 flex items-center justify-center">
    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full text-indigo-500/20">
      <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="4" fill="none" />
      <motion.circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="300" strokeDashoffset="300" animate={{ strokeDashoffset: 300 - (300 * (level % 10) / 10) }} transition={{ duration: 1.5 }} className="text-indigo-500" style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }} />
    </svg>
    <span className="text-xl font-bold font-mono text-white">{level}</span>
  </div>
);

export default function StatsBoard({ isOpen, onClose, squadData, myEmail }: Props) {
  const [activeTab, setActiveTab] = useState<'squad' | 'personal'>('squad');

  // 1️⃣ Safe Destructuring
  const { squadLevel, squadTotalMinutes, progressToNext, members, history } = squadData || {};

  // 2️⃣ Personal Stats Calculation (Dependent on myEmail prop)
  const personalStats = useMemo(() => {
    if (!history || !myEmail) return { totalMins: 0, distribution: [], history: [] };

    // 🔍 Filter history specifically for ME
    const myHistory = history.filter((s: any) => s.userEmail === myEmail);
    const totalMins = myHistory.reduce((acc: number, s: any) => acc + s.duration, 0);
    
    // 📊 Tag Logic
    const tagMap: Record<string, number> = {};
    myHistory.forEach((s: any) => {
      const tag = s.tag || 'default';
      tagMap[tag] = (tagMap[tag] || 0) + s.duration;
    });

    const distribution = Object.entries(tagMap)
      .map(([tag, minutes]) => ({ tag, minutes, pct: (minutes / totalMins) * 100 }))
      .sort((a, b) => b.minutes - a.minutes);

    return { totalMins, distribution, history: myHistory };
  }, [history, myEmail]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!squadData) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className="fixed inset-0 z-[10000] flex items-center justify-center p-4" initial="hidden" animate="visible" exit="exit">
          <motion.div variants={overlayVariants} className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
          
          <motion.div variants={modalVariants} className="relative w-full max-w-4xl bg-[#0a0a0a] border border-white/10 rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* HEADER */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-white/[0.02]">
               <div className="flex items-center gap-6">
                  <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400"><Award size={24} /></div>
                  <div className="flex bg-white/5 p-1 rounded-xl">
                    <button onClick={() => setActiveTab('squad')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${activeTab === 'squad' ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white'}`}>
                      <Users size={14} /> Squad
                    </button>
                    <button onClick={() => setActiveTab('personal')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${activeTab === 'personal' ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white'}`}>
                      <User size={14} /> Personal
                    </button>
                  </div>
               </div>
               <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors"><X size={20} /></button>
            </div>

            {/* CONTENT */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
               <AnimatePresence mode="wait">
                 {/* SQUAD TAB */}
                 {activeTab === 'squad' ? (
                   <motion.div key="squad" variants={contentVariants} initial="hidden" animate="visible" exit="exit" className="space-y-8">
                      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="md:col-span-2 bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/20 rounded-3xl p-6 relative overflow-hidden flex items-center gap-6">
                            <RankBadge level={squadLevel} />
                            <div className="flex-1 z-10">
                                <h2 className="text-2xl font-bold text-white mb-2">Squad Progress</h2>
                                <ProgressBar progress={progressToNext} />
                                <div className="flex justify-between mt-2 text-[10px] font-medium text-white/40 uppercase tracking-wider">
                                  <span>Level {squadLevel}</span><span>Next: {Math.round(100 - progressToNext)}%</span>
                                </div>
                            </div>
                          </div>
                          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col justify-center items-center text-center">
                            <Zap size={24} className="text-yellow-400 mb-2" />
                            <span className="text-3xl font-mono font-bold text-white">{history.length}</span>
                            <span className="text-xs text-white/40 font-medium uppercase tracking-wider mt-1">Total Sessions</span>
                          </div>
                      </motion.div>

                      <motion.div variants={itemVariants}>
                          <h3 className="text-sm font-bold text-white/60 uppercase tracking-widest mb-4 flex items-center gap-2"><Crown size={14} className="text-yellow-500" /> Leaderboard</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {members?.map((m: any, idx: number) => (
                                <div key={m.email} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${idx === 0 ? 'bg-white/5 border-yellow-500/30' : 'bg-transparent border-white/5'}`}>
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${idx === 0 ? 'bg-yellow-500 text-black' : 'bg-white/10 text-white'}`}>{m.name.charAt(0).toUpperCase()}</div>
                                  <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-white truncate">{m.name}</span>
                                        {m.email === myEmail && <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-white/50">YOU</span>}
                                      </div>
                                      <div className="text-xs text-white/40 font-mono mt-0.5">Lvl {m.level} • {m.totalMinutes}m</div>
                                  </div>
                                  {idx === 0 && <Trophy size={16} className="text-yellow-500" />}
                                </div>
                            ))}
                          </div>
                      </motion.div>
                   </motion.div>
                 ) : (
                   /* PERSONAL TAB */
                   <motion.div key="personal" variants={contentVariants} initial="hidden" animate="visible" exit="exit" className="space-y-8">
                      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 relative overflow-hidden">
                             <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/20 blur-2xl rounded-full" />
                             <div className="flex items-center gap-2 mb-2 text-emerald-400"><Activity size={18} /><span className="text-xs font-bold uppercase tracking-wide">My Focus</span></div>
                             <div className="text-4xl font-mono font-bold text-white">{(personalStats.totalMins / 60).toFixed(1)}<span className="text-lg text-white/30 ml-1">hrs</span></div>
                          </div>
                          <div className="md:col-span-2 bg-white/5 border border-white/10 rounded-3xl p-6">
                             <div className="flex items-center gap-2 mb-6 text-indigo-400"><PieChart size={18} /><span className="text-xs font-bold uppercase tracking-wide">Focus Distribution</span></div>
                             <div className="space-y-3">
                                {personalStats.distribution.length === 0 ? (
                                  <div className="text-center text-white/30 py-4 text-xs">Start a session to see your stats!</div>
                                ) : (
                                  personalStats.distribution.map((d: any) => {
                                    const config = TAG_CONFIG[d.tag] || TAG_CONFIG.default;
                                    const Icon = config.icon;
                                    return (
                                      <div key={d.tag} className="flex items-center gap-4">
                                         <div className={`p-1.5 rounded-lg ${config.bg} ${config.color}`}><Icon size={14} /></div>
                                         <div className="flex-1">
                                            <div className="flex justify-between text-xs font-bold text-white/80 mb-1.5">
                                              <span>{config.label}</span>
                                              <span className="font-mono">{d.minutes}m ({Math.round(d.pct)}%)</span>
                                            </div>
                                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                               <motion.div initial={{ width: 0 }} animate={{ width: `${d.pct}%` }} className={`h-full bg-current ${config.color}`} transition={{ duration: 1 }} />
                                            </div>
                                         </div>
                                      </div>
                                    );
                                  })
                                )}
                             </div>
                          </div>
                      </motion.div>

                      <motion.div variants={itemVariants}>
                          <h3 className="text-sm font-bold text-white/60 uppercase tracking-widest mb-4 flex items-center gap-2"><History size={14} /> My Log</h3>
                          <div className="space-y-2">
                             {personalStats.history.slice(0, 8).map((s: any, i: number) => {
                                const tagKey = s.tag || 'default';
                                const tagStyle = TAG_CONFIG[tagKey] || TAG_CONFIG.default;
                                const TagIcon = tagStyle.icon;
                                return (
                                  <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                                     <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-lg ${tagStyle.bg} ${tagStyle.color}`}><TagIcon size={16} /></div>
                                        <div>
                                           <p className="text-sm font-bold text-white">{s.name || 'Focus Session'}</p>
                                           <div className="text-xs text-white/40 font-mono">{new Date(s.timestamp).toLocaleDateString()}</div>
                                        </div>
                                     </div>
                                     <div className="text-sm font-mono font-bold text-white">{s.duration}m</div>
                                  </div>
                                );
                             })}
                          </div>
                      </motion.div>
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}