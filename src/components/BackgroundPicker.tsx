import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Check, Video, X, Link as LinkIcon, Sparkles } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import type { ThemeConfig } from '../types';
import useClickOutside from '../hooks/useClickOutside';

interface Props {
  currentTheme: ThemeConfig;
  setTheme: (theme: ThemeConfig) => void;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

const VIDEO_PRESETS = [
  { label: 'Goku Ultra', value: 'https://motionbgs.com/media/1397/goku-ultra-instinct_2.960x540.mp4', previewColor: '#3b82f6' },
  { label: 'Cyberpunk', value: 'https://motionbgs.com/media/3663/cyberpunk-street.960x540.mp4', previewColor: '#a855f7' },
  { label: 'Rainy Gotham', value: 'https://motionbgs.com/media/6356/batman-rain.960x540.mp4', previewColor: '#374151' },
  { label: 'Lofi Room', value: 'https://motionbgs.com/media/2886/cozy-room.960x540.mp4', previewColor: '#fb923c' },
];

// 🏃‍♂️ MOTION VARIANTS (Typed as 'any' to fix build errors)
const menuVariants: any = {
  hidden: { 
    opacity: 0, scale: 0.9, y: -10, x: 10, filter: "blur(10px)",
    transition: { type: "spring", duration: 0.2 }
  },
  visible: { 
    opacity: 1, scale: 1, y: 0, x: 0, filter: "blur(0px)",
    transition: { type: "spring", bounce: 0.3, duration: 0.4, staggerChildren: 0.07 }
  },
  exit: { 
    opacity: 0, scale: 0.95, filter: "blur(5px)",
    transition: { duration: 0.15 } 
  }
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 15, scale: 0.9 },
  visible: { opacity: 1, y: 0, scale: 1 }
};

const checkVariants: any = {
  hidden: { scale: 0, rotate: -45 },
  visible: { scale: 1, rotate: 0, transition: { type: "spring", stiffness: 600, damping: 12 } }
};

export default function BackgroundPicker({ currentTheme, setTheme, isOpen, onToggle, onClose }: Props) {
  const [customVideo, setCustomVideo] = useState('');
  
  // 1️⃣ FIX: Use HTMLDivElement so the <div> is happy
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 2️⃣ FIX: Cast to 'any' to stop the hook from complaining
  useClickOutside(containerRef as any, () => {
    if (isOpen) onClose();
  });

  useEffect(() => {
    const timer = setTimeout(() => { if (customVideo) setTheme({ type: 'video', value: customVideo }); }, 800);
    return () => clearTimeout(timer);
  }, [customVideo, setTheme]);

  return (
    <div ref={containerRef} className="fixed top-6 right-6 z-50 font-sans">
      <motion.button 
        onClick={onToggle}
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.92 }}
        className={`relative p-3 rounded-full backdrop-blur-xl shadow-2xl border border-white/10 transition-colors duration-300 z-50 outline-none focus:ring-2 focus:ring-white/20
          ${isOpen ? 'bg-white text-black' : 'bg-black/60 text-white hover:bg-white/10'}
        `}
      >
        <motion.div initial={false} animate={{ rotate: isOpen ? 90 : 0 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
          {isOpen ? <X size={20} /> : <Palette size={20} />}
        </motion.div>
        {isOpen && <motion.div layoutId="glow" className="absolute inset-0 rounded-full bg-white/50 blur-lg -z-10" initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} />}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            variants={menuVariants} initial="hidden" animate="visible" exit="exit"
            className="absolute right-0 mt-4 bg-[#0a0a0a]/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] w-80 overflow-hidden flex flex-col p-5"
          >
             <motion.div variants={itemVariants} className="flex items-center gap-2 mb-4">
                <span className="flex items-center justify-center w-5 h-5 rounded bg-indigo-500/20 text-indigo-400"><Sparkles size={10} /></span>
                <h3 className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Visual Environment</h3>
             </motion.div>

             <div className="grid grid-cols-2 gap-3 mb-5">
                {VIDEO_PRESETS.map((preset, idx) => {
                  const isActive = currentTheme.value === preset.value;
                  return (
                    <motion.button
                      key={idx} variants={itemVariants} whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
                      onClick={() => setTheme({ type: 'video', value: preset.value })}
                      className={`relative h-20 rounded-xl overflow-hidden group transition-all duration-300 border outline-none focus:ring-2 focus:ring-indigo-500/50 ${isActive ? 'border-white ring-1 ring-white/50' : 'border-transparent hover:border-white/20'}`}
                      style={{ backgroundColor: preset.previewColor }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-3 flex items-end">
                        <span className={`text-[10px] font-bold transition-colors ${isActive ? 'text-white' : 'text-white/70'}`}>{preset.label}</span>
                      </div>
                      <AnimatePresence>
                        {isActive && (
                          <motion.div variants={checkVariants} initial="hidden" animate="visible" exit="hidden" className="absolute top-2 right-2 bg-white text-black rounded-full p-1 shadow-lg">
                            <Check size={10} strokeWidth={4} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                      {isActive && <div className="absolute inset-0 bg-white/10 mix-blend-overlay pointer-events-none" />}
                    </motion.button>
                  );
                })}
             </div>

             <motion.div variants={itemVariants} className="pt-4 border-t border-white/10 space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase"><LinkIcon size={10} /> Custom Feed</label>
                <div className="relative group">
                    <Video size={14} className="absolute left-3 top-2.5 text-white/30 group-focus-within:text-indigo-400 transition-colors duration-300" />
                    <input ref={inputRef} type="text" placeholder="Paste .mp4 link..." value={customVideo} onChange={(e) => setCustomVideo(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder:text-white/20 focus:border-indigo-500 focus:bg-white/5 outline-none transition-all duration-300" />
                    <div className="absolute bottom-0 left-3 right-3 h-[1px] bg-indigo-500 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-500" />
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}