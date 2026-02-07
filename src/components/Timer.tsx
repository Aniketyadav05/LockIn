import { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, RotateCcw, Pencil, Check, Save, X,
  Briefcase, BookOpen, Code2, Dumbbell, Coffee, PenTool, BrainCircuit 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TimerProps {
  onSessionComplete: (session: any) => void;
  onStart?: () => void;
  onTick?: (mins: number) => void;
  initialMinutes?: number;
}

// 🏷️ PRESET TAGS CONFIGURATION
const PRESET_TAGS = [
  { id: 'work', label: 'Work', icon: Briefcase, color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20' },
  { id: 'study', label: 'Study', icon: BookOpen, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
  { id: 'code', label: 'Code', icon: Code2, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
  { id: 'create', label: 'Create', icon: PenTool, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  { id: 'read', label: 'Read', icon: Coffee, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  { id: 'fitness', label: 'Workout', icon: Dumbbell, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
];

// 🧱 CUSTOM SVG: Focus Progress Ring
const FocusRing = ({ progress, isComplete, colorHex }: { progress: number, isComplete: boolean, colorHex: string }) => {
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <svg className="absolute w-full h-full transform -rotate-90 drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]" viewBox="0 0 300 300">
      <circle cx="150" cy="150" r={radius} stroke="rgba(255,255,255,0.03)" strokeWidth="6" fill="transparent" />
      <motion.circle
        cx="150" cy="150" r={radius}
        stroke={isComplete ? "#4ade80" : colorHex} 
        strokeWidth="6" fill="transparent"
        strokeDasharray={circumference}
        animate={{ strokeDashoffset, stroke: isComplete ? "#4ade80" : colorHex }}
        transition={{ duration: 1, ease: "linear" }}
        strokeLinecap="round"
        className="drop-shadow-lg"
      />
    </svg>
  );
};

export default function Timer({ 
  onSessionComplete, 
  onStart, 
  onTick, 
  initialMinutes = 25 
}: TimerProps) {
  // 💾 STATE
  const [timeLeft, setTimeLeft] = useState(initialMinutes * 60); 
  const [totalTime, setTotalTime] = useState(initialMinutes * 60);
  const [isActive, setIsActive] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  
  // 🧠 SESSION METADATA
  const [sessionName, setSessionName] = useState("Focus Session");
  const [selectedTag, setSelectedTag] = useState(PRESET_TAGS[2]); // Default to 'Code'
  
  // ✏️ EDITING STATES (Decoupled)
  const [isTagMenuOpen, setIsTagMenuOpen] = useState(false);
  const [isTimeEditing, setIsTimeEditing] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(initialMinutes);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
  }, []);

  // Sync custom minutes to timer when NOT active
  useEffect(() => {
    if (!isActive) {
      setTimeLeft(customMinutes * 60);
      setTotalTime(customMinutes * 60);
    }
  }, [customMinutes, isActive]);

  // ⏱️ TIMER ENGINE
  useEffect(() => {
    let interval: number | null = null;
    if (isActive && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => {
          const newValue = prev - 1;
          if (onTick && newValue % 60 === 0) onTick(Math.ceil(newValue / 60));
          return newValue;
        });
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      handleFinish(totalTime / 60, true);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isActive, timeLeft, onTick, totalTime]);

  const handleFinish = (minutesLogged: number, playedAudio: boolean = false) => {
    setIsActive(false);
    if (playedAudio) audioRef.current?.play().catch(() => {});
    
    onSessionComplete({
      id: Date.now(),
      type: 'Focus',
      duration: Math.round(minutesLogged),
      name: sessionName,
      tag: selectedTag.id, 
      timestamp: new Date().toISOString(),
    });
    setSessionCount(p => p + 1);
    
    if (timeLeft === 0) setTimeLeft(totalTime); 
  };

  const handleEarlyFinish = () => {
    const secondsSpent = totalTime - timeLeft;
    const minutesSpent = Math.max(1, Math.round(secondsSpent / 60));
    if (secondsSpent < 10) { 
      alert("Session too short to log!"); 
      return; 
    }
    handleFinish(minutesSpent);
    setTimeLeft(totalTime);
  };

  const toggleTimer = () => {
    if (!isActive && onStart) onStart();
    setIsActive(!isActive);
    setIsTagMenuOpen(false);
    setIsTimeEditing(false);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(totalTime);
  };

  const selectTag = (tag: typeof PRESET_TAGS[0]) => {
    setSelectedTag(tag);
    setSessionName(tag.label);
    setIsTagMenuOpen(false); 
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;
  const timeSpentDisplay = Math.floor((totalTime - timeLeft) / 60);
  
  const getStrokeColor = () => {
    if (selectedTag.id === 'work') return '#0ea5e9';
    if (selectedTag.id === 'study') return '#f472b6';
    if (selectedTag.id === 'code') return '#22d3ee';
    if (selectedTag.id === 'create') return '#c084fc';
    if (selectedTag.id === 'read') return '#fbbf24';
    if (selectedTag.id === 'fitness') return '#34d399';
    return '#6366f1';
  };

  return (
    <div className="flex flex-col items-center justify-center relative w-full max-w-md mx-auto font-sans">
      
      {/* 🟣 PROGRESS CIRCLE */}
      <div className="relative w-80 h-80 flex items-center justify-center mb-10">
        <FocusRing progress={progress} isComplete={timeLeft === 0} colorHex={getStrokeColor()} />

        {/* ⏱️ CENTER DISPLAY */}
        <div className="text-center z-10 flex flex-col items-center w-full px-8 relative">
          
          {/* 🏷️ TAG & NAME PILL */}
          <div className="relative mb-3 h-8 flex items-center justify-center z-50">
            {isTagMenuOpen ? (
               <motion.div 
                 initial={{ opacity: 0, scale: 0.9, y: -10 }} 
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 className="absolute top-0 left-1/2 -translate-x-1/2 w-64 bg-[#0a0a0a] border border-white/20 rounded-xl p-3 shadow-2xl flex flex-col gap-3"
               >
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Select Intent</span>
                    <button onClick={() => setIsTagMenuOpen(false)} className="p-1 hover:bg-white/10 rounded text-white/60"><X size={12}/></button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                     {PRESET_TAGS.map(tag => (
                       <button
                         key={tag.id}
                         onClick={() => selectTag(tag)}
                         className={`flex items-center gap-2 p-2 rounded-lg border transition-all text-left ${selectedTag.id === tag.id ? `${tag.bg} ${tag.border} ${tag.color}` : 'border-white/5 text-white/40 hover:bg-white/5'}`}
                       >
                         <tag.icon size={14} />
                         <span className="text-[10px] font-bold uppercase">{tag.label}</span>
                       </button>
                     ))}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Pencil size={12} className="text-white/40" />
                    <input 
                      className="bg-transparent text-xs text-white outline-none w-full font-bold placeholder:text-white/20"
                      placeholder="Custom Name..."
                      value={sessionName}
                      onChange={(e) => setSessionName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && setIsTagMenuOpen(false)}
                    />
                  </div>
               </motion.div>
            ) : (
              <button 
                onClick={() => !isActive && setIsTagMenuOpen(true)} 
                disabled={isActive}
                className={`group flex items-center gap-2 px-3 py-1 rounded-full border transition-all disabled:cursor-default ${selectedTag.bg} ${selectedTag.border}`}
              >
                <selectedTag.icon size={12} className={selectedTag.color} />
                <span className={`text-xs font-bold uppercase tracking-wide ${selectedTag.color}`}>{sessionName}</span>
                {!isActive && <Pencil size={10} className={`opacity-0 group-hover:opacity-100 transition-opacity ${selectedTag.color}`} />}
              </button>
            )}
          </div>

          {/* ⏳ TIME DISPLAY */}
          <div className="h-[88px] flex items-center justify-center">
            {isTimeEditing && !isActive ? (
               <div className="flex items-center justify-center gap-1 text-7xl font-mono font-bold text-white">
                  <input 
                    autoFocus
                    type="number"
                    min="1" max="180"
                    value={customMinutes}
                    onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (val > 0 && val <= 180) setCustomMinutes(val);
                        else if (!e.target.value) setCustomMinutes(0); 
                    }}
                    onBlur={() => {
                        if (customMinutes === 0) setCustomMinutes(25); 
                        setIsTimeEditing(false);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && setIsTimeEditing(false)}
                    className="bg-transparent border-b-2 border-white/20 w-32 text-center outline-none focus:border-indigo-500 transition-colors tabular-nums"
                  />
                  <span className="text-2xl text-white/30 font-sans mt-6">m</span>
               </div>
            ) : (
              <div 
                onClick={() => !isActive && setIsTimeEditing(true)}
                className={`text-7xl font-bold font-mono tracking-tighter text-white drop-shadow-2xl tabular-nums transition-opacity ${isActive ? 'cursor-default' : 'cursor-pointer hover:opacity-80'}`}
              >
                {formatTime(timeLeft)}
              </div>
            )}
          </div>

          {/* STATUS */}
          <div className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/30">
             {isActive ? (
               <>
                 <BrainCircuit size={12} className="animate-pulse text-indigo-400" />
                 <span>Focus Mode</span>
               </>
             ) : (
               <span>{isTimeEditing ? 'Set Minutes' : (isTagMenuOpen ? 'Choose Tag' : 'Tap Time to Edit')}</span>
             )}
          </div>
        </div>
      </div>

      {/* 🎮 CONTROLS */}
      <div className="flex items-center gap-6">
        <motion.button 
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={resetTimer} disabled={isActive}
          className="w-14 h-14 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all disabled:opacity-0 disabled:pointer-events-none"
        >
          <RotateCcw size={20} />
        </motion.button>

        <motion.button 
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={toggleTimer}
          className={`w-24 h-24 rounded-[32px] flex items-center justify-center transition-all shadow-2xl ${isActive ? 'bg-white text-black' : 'bg-indigo-500 text-white shadow-[0_0_40px_rgba(99,102,241,0.4)]'}`}
        >
          {isActive ? <Pause size={36} fill="black" /> : <Play size={36} fill="white" className="ml-1" />}
        </motion.button>
        
        <motion.button 
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={handleEarlyFinish} disabled={isActive || totalTime === timeLeft}
          className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/20 transition-all disabled:opacity-0 disabled:pointer-events-none"
          title="Finish Early & Log Time"
        >
          <Save size={20} />
        </motion.button>
      </div>

      {/* NOTIFICATION */}
      <AnimatePresence>
        {sessionCount > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="absolute -bottom-20 flex items-center gap-2 bg-emerald-500/10 px-5 py-2.5 rounded-full border border-emerald-500/20 shadow-lg backdrop-blur-md">
             <span className="p-1 bg-emerald-500 rounded-full flex items-center justify-center">
                <Check size={10} className="text-black" strokeWidth={4} />
             </span>
             <span className="text-xs font-bold text-emerald-200 uppercase tracking-wide">
                Saved: {timeSpentDisplay > 0 ? timeSpentDisplay : initialMinutes}m "{sessionName}"
             </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}