import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Square, RotateCcw, Timer as TimerIcon } from 'lucide-react';
import type { Session } from '../types';

interface Props {
  onSessionComplete: (session: any) => void;
}

export default function Stopwatch({ onSessionComplete }: Props) {
  // 🧠 State: Track time in milliseconds for precision
  const [elapsed, setElapsed] = useState(0); 
  const [isActive, setIsActive] = useState(false);
  
  // Refs for tracking time without causing re-renders
  const startTimeRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  // ⏱️ High-Precision Timer Loop (requestAnimationFrame)
  useEffect(() => {
    if (isActive) {
      // Calculate "start time" relative to what we've already elapsed
      startTimeRef.current = Date.now() - elapsed;
      
      const loop = () => {
        setElapsed(Date.now() - startTimeRef.current);
        rafRef.current = requestAnimationFrame(loop);
      };
      
      rafRef.current = requestAnimationFrame(loop);
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isActive]); // Only re-run when active state changes

  // 🕹️ Handlers
  const toggleTimer = () => setIsActive(!isActive);

  const handleReset = () => {
    setIsActive(false);
    setElapsed(0);
  };

  const handleFinish = () => {
    // Prevent saving accidental 0-second sessions
    if (elapsed < 1000) return; 
    
    setIsActive(false);
    
    // Normalize to minutes (Rounded up to ensure short sessions count as 1 min)
    const minutes = Math.max(1, Math.round(elapsed / 1000 / 60));

    // Save Session
    onSessionComplete({
      id: Date.now(),
      type: 'Focus', // Normalized type for stats
      duration: minutes,
      timestamp: new Date().toISOString(),
    });
    
    // Reset after save
    setElapsed(0);
  };

  // 🎨 Formatter: HH:MM:SS
  const formatDisplay = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    
    // Show Hours only if they exist
    if (h > 0) {
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-xl mx-auto font-sans">
      
      {/* HEADER */}
      <div className="mb-8 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-bold tracking-widest uppercase flex items-center gap-2">
        <TimerIcon size={12} /> Stopwatch Mode
      </div>
      
      {/* 🕰️ TIME DISPLAY */}
      <div className="relative mb-12 flex flex-col items-center">
        {/* Glow Effect */}
        <div className={`absolute inset-0 bg-cyan-500/20 blur-[100px] rounded-full transition-all duration-1000 ${isActive ? 'opacity-100 scale-110' : 'opacity-20 scale-90'}`} />
        
        <div className="relative flex items-baseline text-white drop-shadow-2xl">
           <span className="text-[7rem] md:text-[9rem] font-bold font-mono tracking-tighter leading-none tabular-nums">
             {formatDisplay(elapsed)}
           </span>
           {/* Milliseconds (Small) */}
           <span className="text-3xl md:text-4xl font-mono text-cyan-500/50 w-[80px] tabular-nums">
             .{Math.floor((elapsed % 1000) / 10).toString().padStart(2, '0')}
           </span>
        </div>
      </div>

      {/* 🎮 CONTROLS */}
      <div className="flex items-center gap-6">
        
        {/* Reset Button (Only shows when paused & has time) */}
        <motion.button 
           initial={{ opacity: 0, scale: 0 }}
           animate={{ opacity: !isActive && elapsed > 0 ? 1 : 0, scale: !isActive && elapsed > 0 ? 1 : 0 }}
           onClick={handleReset}
           className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:text-red-400 transition-colors"
           title="Reset"
           disabled={isActive || elapsed === 0}
        >
          <RotateCcw size={20} />
        </motion.button>

        {/* Play / Pause Main Button */}
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTimer}
          className={`px-10 py-4 rounded-full font-bold flex items-center gap-2 transition-all shadow-[0_0_30px_rgba(6,182,212,0.15)] hover:shadow-[0_0_50px_rgba(6,182,212,0.4)] ${
            isActive 
              ? 'bg-white text-black hover:bg-gray-200' 
              : 'bg-cyan-500 text-black hover:bg-cyan-400'
          }`}
        >
          {isActive ? <><Pause size={20} fill="black" /> Pause</> : <><Play size={20} fill="black" /> Start</>}
        </motion.button>
        
        {/* Finish / Save Button */}
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleFinish}
          disabled={elapsed === 0}
          className="bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 text-emerald-400 px-8 py-4 rounded-full hover:bg-emerald-500/20 transition-all font-medium flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Square size={18} fill="currentColor" /> Finish
        </motion.button>
      </div>
    </div>
  );
}