import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TimerProps {
  onSessionComplete: (session: any) => void;
  onStart?: () => void;
  onTick?: (mins: number) => void;
  initialMinutes?: number;
}

export default function Timer({ 
  onSessionComplete, 
  onStart, 
  onTick, 
  initialMinutes = 25 
}: TimerProps) {
  // Convert minutes to seconds for internal logic
  const [timeLeft, setTimeLeft] = useState(initialMinutes * 60); 
  const [isActive, setIsActive] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  
  // Audio Ref to prevent re-creating the object on every render
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
  }, []);

  // 🔄 Handle Initial Time Change (e.g. User changes settings)
  useEffect(() => {
    // Only reset if the timer is NOT running to avoid disrupting a session
    if (!isActive) {
      setTimeLeft(initialMinutes * 60);
    }
  }, [initialMinutes, isActive]);

  // ⏱️ The Timer Logic
  useEffect(() => {
    let interval: number | null = null;

    if (isActive && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => {
          const newValue = prev - 1;
          
          // Sync tick (optional optimization: only tick every minute or 30s)
          if (onTick && newValue % 60 === 0) {
            onTick(Math.ceil(newValue / 60));
          }
          return newValue;
        });
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      // TIMER FINISHED
      setIsActive(false);
      handleComplete();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, onTick]);

  const handleComplete = () => {
    // 1. Play Sound
    audioRef.current?.play().catch(e => console.log('Audio play failed', e));

    // 2. Report Session
    const newSession = {
      id: Date.now(),
      type: 'Focus',
      duration: initialMinutes,
      timestamp: new Date().toISOString(),
    };
    onSessionComplete(newSession);
    
    // 3. Update Local Count
    setSessionCount(prev => prev + 1);
  };

  const toggleTimer = () => {
    if (!isActive && onStart) onStart();
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(initialMinutes * 60);
  };

  // 🎨 Visual Logic
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Circular Progress Calculation
  const totalSeconds = initialMinutes * 60;
  // Prevent division by zero
  const progress = totalSeconds > 0 ? ((totalSeconds - timeLeft) / totalSeconds) * 100 : 0;
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center relative w-full max-w-md mx-auto">
      
      {/* 🟣 PROGRESS CIRCLE CONTAINER */}
      <div className="relative w-72 h-72 flex items-center justify-center mb-10">
        
        {/* SVG Circle */}
        <svg className="absolute w-full h-full transform -rotate-90 drop-shadow-2xl">
          {/* Background Track */}
          <circle
            cx="144" cy="144" r={radius}
            stroke="rgba(255,255,255,0.05)" 
            strokeWidth="12" 
            fill="transparent"
          />
          {/* Active Progress Bar */}
          <circle
            cx="144" cy="144" r={radius}
            stroke="url(#gradient)" 
            strokeWidth="12" 
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-linear"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
        </svg>

        {/* ⏱️ DIGITAL DISPLAY */}
        <div className="text-center z-10 flex flex-col items-center">
          <motion.div 
            key={timeLeft} // Triggers animation on change
            initial={{ scale: 0.95, opacity: 0.9 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="text-7xl font-bold font-mono tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
          >
            {formatTime(timeLeft)}
          </motion.div>
          
          <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             className="mt-2"
          >
             <span className={`text-xs font-bold tracking-[0.2em] uppercase px-3 py-1 rounded-full border ${isActive ? 'border-green-500/30 text-green-400 bg-green-500/10' : 'border-white/10 text-white/40'}`}>
                {isActive ? 'Focus Mode' : 'Ready to Start'}
             </span>
          </motion.div>
        </div>
      </div>

      {/* 🎮 CONTROLS */}
      <div className="flex items-center gap-8">
        
        {/* Reset Button */}
        <button 
          onClick={resetTimer}
          className="p-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all text-white/50 hover:text-white group"
          title="Reset Timer"
        >
          <RotateCcw size={22} className="group-hover:-rotate-180 transition-transform duration-500" />
        </button>

        {/* Play/Pause Button (Hero) */}
        <button 
          onClick={toggleTimer}
          className="group relative flex items-center justify-center w-20 h-20 bg-white rounded-full hover:scale-110 transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:shadow-[0_0_60px_rgba(255,255,255,0.4)]"
        >
          {isActive ? (
            <Pause size={36} className="text-black fill-current" />
          ) : (
             <Play size={36} className="text-black fill-current translate-x-1" />
          )}
        </button>

        {/* Placeholder for Balance/Symmetry */}
        <div className="w-[58px]" /> 
      </div>

      {/* ✅ SESSION COMPLETED NOTIFICATION */}
      <AnimatePresence>
        {sessionCount > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute -bottom-24 flex flex-col items-center gap-2"
          >
             <div className="flex items-center gap-2 bg-gradient-to-r from-green-900/40 to-emerald-900/40 px-5 py-2.5 rounded-full border border-green-500/20 backdrop-blur-md">
                <CheckCircle2 size={16} className="text-green-400" />
                <span className="text-sm font-medium text-green-100">{sessionCount} Session{sessionCount !== 1 ? 's' : ''} Completed</span>
             </div>
             <p className="text-[10px] text-white/30 uppercase tracking-widest">Keep grinding</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}