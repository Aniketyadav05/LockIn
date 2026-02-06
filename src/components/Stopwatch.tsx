import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Square, Timer } from 'lucide-react';
import { formatTime } from '../utils/time';
import type { Session } from '../types';

interface Props {
  onSessionComplete: (session: Session) => void;
}

export default function Stopwatch({ onSessionComplete }: Props) {
  const [time, setTime] = useState(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isActive) {
      interval = setInterval(() => setTime((t) => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const handleStop = () => {
    setIsActive(false);
    if (time > 0) {
      onSessionComplete({
        id: crypto.randomUUID(),
        type: 'stopwatch',
        title: 'Freestyle Flow',
        duration: time,
        createdAt: new Date().toISOString()
      });
      setTime(0);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-xl mx-auto">
      <div className="mb-8 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-bold tracking-widest uppercase flex items-center gap-2">
        <Timer size={12} /> Stopwatch Mode
      </div>
      
      <div className="relative mb-12">
        <div className={`absolute inset-0 bg-cyan-500/20 blur-[80px] rounded-full transition-opacity duration-1000 ${isActive ? 'opacity-100' : 'opacity-30'}`} />
        <motion.div layout className="relative text-[7rem] md:text-[9rem] font-bold font-mono tracking-tighter tabular-nums leading-none text-white drop-shadow-lg">
          {formatTime(time)}
        </motion.div>
      </div>

      <div className="flex gap-6 items-center">
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsActive(!isActive)}
          className={`px-10 py-4 rounded-full font-bold flex items-center gap-2 transition-all shadow-lg ${
            isActive 
              ? 'bg-amber-400 text-black hover:bg-amber-300' 
              : 'bg-cyan-500 text-black hover:bg-cyan-400'
          }`}
        >
          {isActive ? <><Pause size={20} fill="black" /> Pause</> : <><Play size={20} fill="black" /> Start</>}
        </motion.button>
        
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleStop}
          className="bg-white/10 backdrop-blur-md border border-white/10 text-rose-300 px-8 py-4 rounded-full hover:bg-rose-500/20 hover:border-rose-500/30 transition-all font-medium flex items-center gap-2"
        >
          <Square size={18} fill="currentColor" /> Stop
        </motion.button>
      </div>
    </div>
  );
}