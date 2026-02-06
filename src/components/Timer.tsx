import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, CheckCircle2, Sparkles } from 'lucide-react';
import { formatTime, playNotificationSound } from '../utils/time';
import type { Session } from '../types';

interface Props {
  onSessionComplete: (session: Session) => void;
}

export default function Timer({ onSessionComplete }: Props) {
  const [duration, setDuration] = useState(1500);
  const [timeLeft, setTimeLeft] = useState(1500);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [purpose, setPurpose] = useState('');
  const [error, setError] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isActive && !isPaused && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((p) => p - 1), 1000);
    } else if (timeLeft === 0 && isActive) {
      handleCompletion();
    }
    return () => clearInterval(interval);
  }, [isActive, isPaused, timeLeft]);

  const handleCompletion = () => {
    setIsActive(false);
    setIsCompleted(true);
    playNotificationSound();
    onSessionComplete({
      id: crypto.randomUUID(),
      type: 'timer',
      title: purpose,
      duration: duration,
      createdAt: new Date().toISOString()
    });
  };

  const handleStart = () => {
    if (!purpose.trim()) {
      setError('✨ Give your session a name first!');
      return;
    }
    setError('');
    setIsActive(true);
    setIsPaused(false);
    setIsCompleted(false);
  };

  const handleReset = () => {
    setIsActive(false);
    setIsPaused(false);
    setIsCompleted(false);
    setTimeLeft(duration);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-xl mx-auto relative z-10">
      
      {/* Purpose Input - Floating Pill */}
      <motion.div 
        layout
        className={`w-full max-w-sm mb-12 relative transition-all duration-500 ${isActive ? 'scale-90 opacity-60 blur-[1px]' : 'scale-100 opacity-100'}`}
      >
        <div className="relative group">
          <input
            type="text"
            placeholder="What are you focusing on?"
            value={purpose}
            disabled={isActive}
            onChange={(e) => setPurpose(e.target.value)}
            className="w-full bg-black/20 backdrop-blur-md border border-white/10 rounded-full px-8 py-4 text-center text-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 focus:bg-black/30 transition-all shadow-lg"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white/50 transition-colors">
            <Sparkles size={18} />
          </div>
        </div>
        <AnimatePresence>
          {error && (
            <motion.p 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }}
              className="absolute -bottom-8 left-0 right-0 text-center text-rose-300 text-sm font-medium"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Timer Display */}
      <div className="relative mb-12">
        {/* Ambient Glow */}
        <div className={`absolute inset-0 bg-gradient-to-tr from-purple-500/30 to-pink-500/30 blur-[60px] rounded-full transition-opacity duration-1000 ${isActive ? 'opacity-100' : 'opacity-30'}`} />
        
        <AnimatePresence mode="wait">
          {isCompleted ? (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center gap-4 py-8"
            >
              <motion.div 
                animate={{ rotate: [0, 10, -10, 0] }} 
                transition={{ repeat: Infinity, duration: 4, repeatDelay: 1 }}
              >
                <CheckCircle2 size={90} className="text-emerald-400 drop-shadow-glow" />
              </motion.div>
              <h2 className="text-3xl font-display font-bold text-white">You did it! 🎉</h2>
              <p className="text-white/60">Session logged to analytics.</p>
            </motion.div>
          ) : (
            <motion.div 
              key="timer"
              className={`relative text-[7rem] md:text-[9rem] font-bold font-mono tracking-tighter tabular-nums leading-none select-none transition-all duration-300 ${isActive && !isPaused ? 'text-white drop-shadow-neon scale-105' : 'text-white/80'}`}
            >
              {formatTime(timeLeft)}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-6 z-20">
        <AnimatePresence mode="wait">
          {!isActive && !isCompleted ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStart}
              className="bg-white text-black px-12 py-5 rounded-full font-bold text-lg flex items-center gap-3 shadow-[0_0_40px_-10px_rgba(255,255,255,0.5)] hover:shadow-[0_0_60px_-5px_rgba(255,255,255,0.7)] transition-shadow"
            >
              <Play size={24} fill="black" /> Start
            </motion.button>
          ) : (
            <>
              {!isCompleted && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsPaused(!isPaused)}
                  className={`w-20 h-20 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 transition-all ${isPaused ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-neon' : 'bg-white/10 text-white shadow-lg'}`}
                >
                  {isPaused ? <Play size={32} fill="currentColor" /> : <Pause size={32} fill="currentColor" />}
                </motion.button>
              )}
              <motion.button
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.1, rotate: 180 }}
                whileTap={{ scale: 0.9 }}
                transition={{ rotate: { duration: 0.5 } }}
                onClick={handleReset}
                className="w-16 h-16 rounded-full bg-white/5 border border-white/10 text-white/70 flex items-center justify-center hover:bg-white/10 hover:text-white backdrop-blur-md"
              >
                <RotateCcw size={24} />
              </motion.button>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Time Presets */}
      {!isActive && !isCompleted && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-16 flex gap-3"
        >
          {[15, 25, 45, 60].map(m => (
            <button
              key={m}
              onClick={() => { setDuration(m * 60); setTimeLeft(m * 60); }}
              className={`px-5 py-2 rounded-2xl text-sm font-medium border transition-all duration-300 ${
                duration === m * 60 
                  ? 'bg-white text-black border-white shadow-glow transform -translate-y-1' 
                  : 'bg-white/5 text-white/50 border-transparent hover:bg-white/10 hover:text-white'
              }`}
            >
              {m}m
            </button>
          ))}
        </motion.div>
      )}
    </div>
  );
}