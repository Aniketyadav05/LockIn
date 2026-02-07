import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Check, Image as ImageIcon, Video, X, Film, Link as LinkIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { ThemeConfig } from '../types';

interface Props {
  currentTheme: ThemeConfig;
  setTheme: (theme: ThemeConfig) => void;
}

// 🎨 Color/Gradient Presets
const COLOR_PRESETS = [
  { type: 'gradient', value: 'linear-gradient(to bottom right, #4c1d95, #be185d)', label: 'Passion' },
  { type: 'gradient', value: 'linear-gradient(to bottom right, #0f172a, #334155)', label: 'Midnight' },
  { type: 'gradient', value: 'linear-gradient(to bottom right, #2c3e50, #fd746c)', label: 'Sunset' },
  { type: 'gradient', value: 'linear-gradient(to bottom right, #000000, #434343)', label: 'Noir' },
  { type: 'gradient', value: 'linear-gradient(to bottom right, #134e5e, #71b280)', label: 'Nature' },
  { type: 'gradient', value: 'linear-gradient(to bottom right, #DA22FF, #9733EE)', label: 'Neon' },
];

// 🎥 Live Wallpaper Presets
const VIDEO_PRESETS = [
  { 
    label: 'Goku Ultra', 
    value: 'https://motionbgs.com/media/1397/goku-ultra-instinct_2.960x540.mp4',
    previewColor: '#3b82f6' 
  },
  { 
    label: 'Cyberpunk City', 
    value: 'https://motionbgs.com/media/3663/cyberpunk-street.960x540.mp4',
    previewColor: '#a855f7'
  },
  { 
    label: 'Rainy Gotham', 
    value: 'https://motionbgs.com/media/6356/batman-rain.960x540.mp4',
    previewColor: '#374151' 
  },
  { 
    label: 'Lofi Room', 
    value: 'https://motionbgs.com/media/2886/cozy-room.960x540.mp4',
    previewColor: '#fb923c' 
  },
  { 
    label: 'Space Travel', 
    value: 'https://motionbgs.com/media/346/space-travel.960x540.mp4',
    previewColor: '#1e3a8a' 
  },
  { 
    label: 'Forest Rain', 
    value: 'https://motionbgs.com/media/875/forest-rain.960x540.mp4',
    previewColor: '#166534' 
  },
];

export default function BackgroundPicker({ currentTheme, setTheme }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'colors' | 'videos'>('videos');
  
  // Local state for inputs to prevent flickering while typing
  const [customVideo, setCustomVideo] = useState('');
  const [customImage, setCustomImage] = useState('');

  // Apply custom video after user stops typing (Debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (customVideo) setTheme({ type: 'video', value: customVideo });
    }, 800);
    return () => clearTimeout(timer);
  }, [customVideo, setTheme]);

  // Apply custom image after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (customImage) setTheme({ type: 'image', value: customImage });
    }, 800);
    return () => clearTimeout(timer);
  }, [customImage, setTheme]);

  return (
    <div className="fixed top-6 right-6 z-50 font-sans">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`p-3 rounded-full backdrop-blur-xl transition-all duration-300 shadow-2xl border border-white/10 ${
          isOpen ? 'bg-white text-black rotate-90 scale-110' : 'bg-black/40 text-white hover:bg-white/10 hover:scale-105'
        }`}
      >
        {isOpen ? <X size={20} /> : <Palette size={20} />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -20, x: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20, x: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="absolute right-0 mt-4 bg-[#0a0a0a]/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl w-80 origin-top-right overflow-hidden flex flex-col max-h-[80vh]"
          >
            {/* Tabs Header */}
            <div className="flex p-1 gap-1 bg-black/20 m-2 rounded-2xl">
              {(['videos', 'colors'] as const).map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 rounded-xl transition-all ${
                    activeTab === tab 
                      ? 'bg-white/10 text-white shadow-lg' 
                      : 'text-white/40 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab === 'videos' ? <Film size={14} /> : <Palette size={14} />}
                  {tab}
                </button>
              ))}
            </div>

            <div className="p-4 overflow-y-auto custom-scrollbar">
              
              {/* 🎥 VIDEO TAB */}
              {activeTab === 'videos' && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-2">
                    {VIDEO_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        onClick={() => setTheme({ type: 'video', value: preset.value })}
                        className={`relative h-20 rounded-xl overflow-hidden group transition-all duration-300 ${
                          currentTheme.value === preset.value 
                            ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-[#0a0a0a] scale-[0.98]' 
                            : 'opacity-70 hover:opacity-100 hover:scale-[1.02]'
                        }`}
                        style={{ backgroundColor: preset.previewColor }}
                      >
                        {/* Label Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-2 flex items-end">
                          <span className="text-[10px] font-bold text-white leading-tight">
                            {preset.label}
                          </span>
                        </div>
                        
                        {/* Active Checkmark */}
                        {currentTheme.value === preset.value && (
                          <div className="absolute top-1.5 right-1.5 bg-indigo-500 text-white rounded-full p-0.5 z-20 shadow-lg">
                            <Check size={10} strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Custom Video Input */}
                  <div className="pt-3 border-t border-white/10 space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase">
                      <LinkIcon size={10} /> Custom Link (.mp4)
                    </label>
                    <div className="relative group">
                       <Video size={14} className="absolute left-3 top-2.5 text-white/30 group-focus-within:text-indigo-400 transition-colors"/>
                       <input 
                         type="text"
                         placeholder="Paste URL..."
                         value={customVideo}
                         className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50 focus:bg-white/5 transition-all"
                         onChange={(e) => setCustomVideo(e.target.value)}
                       />
                    </div>
                    <p className="text-[9px] text-white/20 px-1">Tip: Use direct links ending in .mp4</p>
                  </div>
                </motion.div>
              )}

              {/* 🎨 COLORS TAB */}
              {activeTab === 'colors' && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-3 gap-2">
                    {COLOR_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        onClick={() => setTheme({ type: preset.type as any, value: preset.value })}
                        className={`relative w-full aspect-square rounded-xl shadow-lg hover:scale-105 transition-all duration-300 ${
                          currentTheme.value === preset.value 
                            ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0a0a0a]' 
                            : 'opacity-80 hover:opacity-100'
                        }`}
                        style={{ background: preset.value }}
                      >
                         {currentTheme.value === preset.value && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px] rounded-xl">
                              <Check size={16} className="text-white drop-shadow-md" strokeWidth={3} />
                            </div>
                          )}
                          <span className="sr-only">{preset.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Image Input */}
                  <div className="pt-3 border-t border-white/10 space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase">
                      <ImageIcon size={10} /> Custom Image URL
                    </label>
                    <div className="relative group">
                       <LinkIcon size={14} className="absolute left-3 top-2.5 text-white/30 group-focus-within:text-pink-400 transition-colors"/>
                       <input 
                         type="text"
                         placeholder="Paste Image Link..."
                         value={customImage}
                         className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-white/20 focus:outline-none focus:border-pink-500/50 focus:bg-white/5 transition-all"
                         onChange={(e) => setCustomImage(e.target.value)}
                       />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}