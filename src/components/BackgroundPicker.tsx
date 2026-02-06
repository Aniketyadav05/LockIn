import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Check, Image as ImageIcon, Video, X, Film } from 'lucide-react';
import { useState } from 'react';
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
];

// 🎥 Live Wallpaper Presets (Add your links here!)
const VIDEO_PRESETS = [
  { 
    label: 'Goku Ultra', 
    value: 'https://motionbgs.com/media/1397/goku-ultra-instinct_2.960x540.mp4',
    previewColor: '#3b82f6' // Blue
  },
  { 
    label: 'symphony of shadows', 
    value: 'https://motionbgs.com/media/8763/brook-symphony-of-shadows.960x540.mp4',
    previewColor: '#a855f7' // Purple
  },
  { 
    label: 'Gotham\'s Rainy Night', 
    value: 'https://motionbgs.com/media/6356/batman-rain.960x540.mp4',
    previewColor: '#374151' // Grey
  },
  { 
    label: 'Lofi Room', 
    value: 'https://motionbgs.com/media/2886/cozy-room.960x540.mp4',
    previewColor: '#fb923c' // Orange
  },
];

export default function BackgroundPicker({ currentTheme, setTheme }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'colors' | 'videos'>('videos'); // Default to videos tab

  return (
    <div className="fixed top-6 right-6 z-50">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`p-3 rounded-full backdrop-blur-xl transition-all shadow-lg border border-white/10 ${isOpen ? 'bg-white text-black rotate-90' : 'bg-black/40 text-white hover:bg-white/10'}`}
      >
        {isOpen ? <X size={20} /> : <Palette size={20} />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, x: 20 }}
            className="absolute right-0 mt-4 bg-black/80 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl w-80 origin-top-right overflow-hidden"
          >
            {/* Tabs */}
            <div className="flex border-b border-white/10">
              <button 
                onClick={() => setActiveTab('videos')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 ${activeTab === 'videos' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}
              >
                <Film size={14} /> Live
              </button>
              <button 
                onClick={() => setActiveTab('colors')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 ${activeTab === 'colors' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}
              >
                <Palette size={14} /> Colors
              </button>
            </div>

            <div className="p-5">
              
              {/* 🎥 VIDEO TAB */}
              {activeTab === 'videos' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    {VIDEO_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        onClick={() => setTheme({ type: 'video', value: preset.value })}
                        className={`relative h-16 rounded-xl overflow-hidden group transition-all ${currentTheme.value === preset.value ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : 'opacity-70 hover:opacity-100'}`}
                        style={{ backgroundColor: preset.previewColor }}
                      >
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white bg-black/20 group-hover:bg-transparent transition-colors z-10">
                          {preset.label}
                        </span>
                        {/* Fake video preview (optional, using color for speed) */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                        
                        {currentTheme.value === preset.value && (
                          <div className="absolute top-1 right-1 bg-white text-black rounded-full p-0.5 z-20">
                            <Check size={8} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Custom Video Input */}
                  <div className="pt-2 border-t border-white/10">
                    <label className="flex items-center gap-2 text-[10px] font-bold text-pink-400 mb-2 uppercase">
                      <Video size={10} /> Custom Link (.mp4)
                    </label>
                    <input 
                      type="text"
                      placeholder="https://..."
                      className="w-full bg-white/5 border border-pink-500/30 rounded-lg px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-pink-500 transition-colors"
                      onChange={(e) => {
                        if(e.target.value) setTheme({ type: 'video', value: e.target.value });
                      }}
                    />
                  </div>
                </div>
              )}

              {/* 🎨 COLORS TAB */}
              {activeTab === 'colors' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-2">
                    {COLOR_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        onClick={() => setTheme({ type: preset.type as any, value: preset.value })}
                        className={`relative w-full aspect-square rounded-xl shadow-sm hover:scale-105 transition-transform ${currentTheme.value === preset.value ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : ''}`}
                        style={{ background: preset.value }}
                      >
                         {currentTheme.value === preset.value && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Check size={14} className="text-white drop-shadow-md" />
                            </div>
                          )}
                      </button>
                    ))}
                  </div>

                  {/* Image Input */}
                  <div className="pt-2 border-t border-white/10">
                    <label className="flex items-center gap-2 text-[10px] font-bold text-blue-400 mb-2 uppercase">
                      <ImageIcon size={10} /> Image URL
                    </label>
                    <input 
                      type="text"
                      placeholder="https://..."
                      className="w-full bg-white/5 border border-blue-500/30 rounded-lg px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-blue-500 transition-colors"
                      onChange={(e) => {
                        if(e.target.value) setTheme({ type: 'image', value: `url(${e.target.value})` });
                      }}
                    />
                  </div>
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}