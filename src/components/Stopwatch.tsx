import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Square, RotateCcw } from 'lucide-react';

interface Props {
  onSessionComplete: (session: any) => void;
}

// 🏃‍♂️ MOTION PHYSICS (Apple/Linear feel)

// 🧱 CUSTOM SVG: Precision Analog Ring
// Renders 60 tick marks and a rotating "second hand" indicator
const ChronoRing = ({  elapsed }: {  elapsed: number }) => {
  const seconds = (elapsed / 1000) % 60;
  const rotation = seconds * 6; // 6 degrees per second

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      {/* Static Tick Marks */}
      <svg className="w-full h-full opacity-20" viewBox="0 0 200 200">
        {Array.from({ length: 60 }).map((_, i) => {
          const isHour = i % 5 === 0;
          return (
            <line
              key={i}
              x1="100" y1={isHour ? "10" : "15"}
              x2="100" y2={isHour ? "25" : "20"}
              transform={`rotate(${i * 6} 100 100)`}
              stroke="currentColor"
              strokeWidth={isHour ? 2 : 1}
              className="text-white"
            />
          );
        })}
      </svg>

      {/* Active Indicator (The "Hand") */}
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: rotation }}
        transition={{ duration: 0, ease: "linear" }} // Instant update for lag-free tracking
      >
        <div className="absolute top-[18px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
      </motion.div>
    </div>
  );
};

// 🧱 CUSTOM SVG: Play/Pause Morph
// Using paths to allow for smooth shape morphing in the future if needed, 
// strictly geometric here for clarity.
const PlayIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 4l14 8-14 8V4z" />
  </svg>
);

const PauseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="4" width="4" height="16" rx="1" />
    <rect x="14" y="4" width="4" height="16" rx="1" />
  </svg>
);

export default function Stopwatch({ onSessionComplete }: Props) {
  // 💾 STATE (Logic Preserved)
  const [elapsed, setElapsed] = useState(0); 
  const [isActive, setIsActive] = useState(false);
  const startTimeRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (isActive) {
      startTimeRef.current = Date.now() - elapsed;
      const loop = () => {
        setElapsed(Date.now() - startTimeRef.current);
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    }
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isActive]);

  const handleFinish = () => {
    if (elapsed < 1000) return; 
    setIsActive(false);
    const minutes = Math.max(1, Math.round(elapsed / 1000 / 60));
    onSessionComplete({
      id: Date.now(),
      type: 'Focus',
      duration: minutes,
      timestamp: new Date().toISOString(),
    });
    setElapsed(0);
  };

  const formatDisplay = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    // Using padStart for monospaced stability
    const mStr = m.toString().padStart(2, '0');
    const sStr = s.toString().padStart(2, '0');
    return h > 0 ? `${h}:${mStr}:${sStr}` : `${mStr}:${sStr}`;
  };

  const msDisplay = Math.floor((elapsed % 1000) / 10).toString().padStart(2, '0');

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto font-sans min-h-[400px]">
      
      {/* 🟢 MAIN CHRONOMETER DISPLAY */}
      <div className="relative w-72 h-72 md:w-80 md:h-80 flex items-center justify-center mb-12">
        {/* Background Ring & Tick Marks */}
        <ChronoRing  elapsed={elapsed} />
        
        {/* Digital Readout */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="flex items-baseline text-white drop-shadow-2xl">
             <motion.span 
               layout 
               className="text-7xl md:text-8xl font-bold font-mono tracking-tighter leading-none tabular-nums"
             >
               {formatDisplay(elapsed)}
             </motion.span>
          </div>
          <span className="text-xl md:text-2xl font-mono text-cyan-400/60 tabular-nums tracking-widest mt-2">
             .{msDisplay}
          </span>
          
          {/* Status Label (Micro-interaction) */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: isActive ? 1 : 0.4 }}
            className="mt-4 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200"
          >
            {isActive ? 'Tracking' : 'Ready'}
          </motion.div>
        </div>

        {/* Ambient Glow (Only when active) */}
        <motion.div 
          animate={{ opacity: isActive ? 0.3 : 0 }}
          className="absolute inset-0 bg-cyan-500/30 blur-[100px] rounded-full -z-10"
        />
      </div>

      {/* 🟢 CONTROLS */}
      <div className="flex items-center gap-4">
        {/* Reset (Destructive/Secondary) */}
        <AnimatePresence>
          {(!isActive && elapsed > 0) && (
            <motion.button 
              initial={{ opacity: 0, scale: 0.8, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: 20 }}
              whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { setIsActive(false); setElapsed(0); }}
              className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/20 transition-colors"
              title="Reset"
            >
              <RotateCcw size={20} />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Play/Pause (Hero Action) */}
        <motion.button 
          whileHover={{ scale: 1.05 }} 
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsActive(!isActive)}
          className={`h-20 px-10 rounded-[2rem] flex items-center gap-4 font-bold text-lg shadow-2xl transition-all ${
            isActive 
              ? 'bg-white text-black hover:bg-gray-100' 
              : 'bg-cyan-500 text-black hover:bg-cyan-400 shadow-[0_0_40px_-10px_rgba(6,182,212,0.5)]'
          }`}
        >
          {isActive ? <PauseIcon /> : <PlayIcon />}
          <span>{isActive ? 'Pause' : 'Start'}</span>
        </motion.button>
        
        {/* Finish (Save Action) */}
        <AnimatePresence>
          {elapsed > 0 && (
            <motion.button 
              initial={{ opacity: 0, scale: 0.8, x: -20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: -20 }}
              whileHover={{ scale: 1.05, backgroundColor: "rgba(16, 185, 129, 0.2)" }}
              whileTap={{ scale: 0.95 }}
              onClick={handleFinish}
              className="w-14 h-14 rounded-full border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center text-emerald-400 hover:text-emerald-300 transition-colors"
              title="Finish & Save"
            >
              <Square size={20} fill="currentColor" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}