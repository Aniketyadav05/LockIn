import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import YouTube from 'react-youtube';
import { 
  Play, Pause, SkipForward, SkipBack, Volume2, Disc, 
  ListMusic, Plus, Trash2, ChevronUp, Music2, Code2, Coffee, CloudRain, Zap, Mic2 
} from 'lucide-react';
import useLocalStorage from '../hooks/useLocalStorage';
import type { Track, TrackCategory } from '../types';

// 🎵 DEFAULT DATA
const DEFAULT_TRACKS: Track[] = [
  { name: 'Lofi Girl - Study Beats', url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk', category: 'lofi' },
  { name: 'Synthwave Radio', url: 'https://www.youtube.com/watch?v=4xDzrJKXOOY', category: 'coding' },
  { name: 'Rain Sounds', url: 'https://cdn.pixabay.com/download/audio/2022/07/04/audio_165030c44c.mp3', category: 'ambient' },
];

const CATEGORIES: { id: TrackCategory | 'all'; label: string; icon: any; color: string }[] = [
  { id: 'all', label: 'All', icon: ListMusic, color: 'bg-white/10 text-white' },
  { id: 'coding', label: 'Coding', icon: Code2, color: 'bg-cyan-500/20 text-cyan-300' },
  { id: 'lofi', label: 'Lofi', icon: Coffee, color: 'bg-purple-500/20 text-purple-300' },
  { id: 'focus', label: 'Focus', icon: Zap, color: 'bg-orange-500/20 text-orange-300' },
  { id: 'ambient', label: 'Ambient', icon: CloudRain, color: 'bg-emerald-500/20 text-emerald-300' },
  { id: 'instrumental', label: 'Piano', icon: Mic2, color: 'bg-pink-500/20 text-pink-300' },
];

// 🏃‍♂️ MOTION VARIANTS
const playerVariants = {
  hidden: { y: 100, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 30 }
  }
};

const expandVariants = {
  collapsed: { height: 72 },
  expanded: { 
    height: "auto",
    transition: { type: "spring", bounce: 0.15, duration: 0.5 }
  }
};

const equalizerVariants = {
  playing: {
    height: [4, 12, 8, 14, 4],
    transition: { repeat: Infinity, duration: 0.5, ease: "linear" }
  },
  paused: {
    height: 4,
    transition: { type: "spring" }
  }
};

const discSpin = {
  playing: { rotate: 360, transition: { repeat: Infinity, duration: 3, ease: "linear" } },
  paused: { rotate: 0, transition: { type: "spring" } }
};

// 🧱 MICRO-COMPONENTS
const Equalizer = ({ playing }: { playing: boolean }) => (
  <div className="flex items-end gap-[2px] h-3">
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        variants={equalizerVariants}
        animate={playing ? "playing" : "paused"}
        custom={i}
        transition={{ repeat: Infinity, duration: 0.4 + Math.random() * 0.2, ease: "easeInOut", repeatType: "mirror" }}
        className="w-1 bg-green-400 rounded-full"
      />
    ))}
  </div>
);

const VolumeSlider = ({ volume, onChange }: { volume: number, onChange: (val: number) => void }) => (
  <div className="relative w-full h-6 flex items-center group">
    <div className="absolute inset-0 bg-white/10 rounded-full h-1.5 overflow-hidden">
      <motion.div 
        className="h-full bg-white group-hover:bg-indigo-400 transition-colors" 
        style={{ width: `${volume * 100}%` }}
        layoutId="volume-fill"
      />
    </div>
    <input 
      type="range" min="0" max="1" step="0.05" value={volume} 
      onChange={e => onChange(parseFloat(e.target.value))} 
      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
    />
    <motion.div 
      className="absolute h-3 w-3 bg-white rounded-full shadow-lg pointer-events-none group-hover:scale-125 transition-transform"
      style={{ left: `${volume * 100}%`, x: "-50%" }}
    />
  </div>
);

interface Props {
  onSongChange?: (song: string) => void;
  visible?: boolean;
}

export default function MusicPlayer({ onSongChange, visible = true }: Props) {
  // 💾 STATE
  const [playlist, setPlaylist] = useLocalStorage<Track[]>('user-playlist', DEFAULT_TRACKS);
  const [volume, setVolume] = useLocalStorage<number>('player-volume', 0.5);
  const [currentTrackUrl, setCurrentTrackUrl] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  
  // 🎨 UI STATE
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeCategory, setActiveCategory] = useState<TrackCategory | 'all'>('all');
  const [viewMode, setViewMode] = useState<'library' | 'add'>('library');
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newCategory, setNewCategory] = useState<TrackCategory>('coding');

  const audioRef = useRef<HTMLAudioElement>(null);
  const youtubeRef = useRef<any>(null);

  useEffect(() => { 
    if (!currentTrackUrl && playlist.length > 0) setCurrentTrackUrl(playlist[0].url); 
  }, [playlist, currentTrackUrl]);

  const currentTrack = useMemo(() => 
    playlist.find(t => t.url === currentTrackUrl) || playlist[0] || DEFAULT_TRACKS[0]
  , [playlist, currentTrackUrl]);

  const sourceType = currentTrack.url.includes('youtu') ? 'youtube' : 'file';

  const filteredPlaylist = useMemo(() => 
    activeCategory === 'all' ? playlist : playlist.filter(t => t.category === activeCategory), 
  [playlist, activeCategory]);

  useEffect(() => { 
    if (onSongChange) onSongChange(isPlaying ? currentTrack.name : 'Paused'); 
  }, [currentTrack, isPlaying, onSongChange]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
    if (youtubeRef.current && typeof youtubeRef.current.setVolume === 'function') {
        youtubeRef.current.setVolume(volume * 100);
    }
    if (isPlaying) {
      if (sourceType === 'file') {
        if (youtubeRef.current && typeof youtubeRef.current.pauseVideo === 'function') youtubeRef.current.pauseVideo();
        audioRef.current?.play().catch(e => console.log("Audio play error:", e));
      } else {
        if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
        if (youtubeRef.current && typeof youtubeRef.current.playVideo === 'function') youtubeRef.current.playVideo();
      }
    } else {
      audioRef.current?.pause();
      if (youtubeRef.current && typeof youtubeRef.current.pauseVideo === 'function') youtubeRef.current.pauseVideo();
    }
  }, [isPlaying, volume, sourceType, currentTrackUrl]);

  const togglePlay = (e?: React.MouseEvent) => { e?.stopPropagation(); setIsPlaying(prev => !prev); };

  const changeTrack = (dir: 'next' | 'prev') => {
    const idx = playlist.findIndex(t => t.url === currentTrack.url);
    const nextIdx = dir === 'next' ? (idx + 1) % playlist.length : (idx - 1 + playlist.length) % playlist.length;
    setCurrentTrackUrl(playlist[nextIdx].url);
    setIsPlaying(true);
  };

  const addTrack = () => {
    if (!newName || !newUrl) return;
    setPlaylist(prev => [...prev, { name: newName, url: newUrl, category: newCategory }]);
    setNewName(''); setNewUrl(''); setViewMode('library');
  };

  const deleteTrack = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    if (playlist.length <= 1) return;
    if (currentTrackUrl === url) changeTrack('next');
    setPlaylist(prev => prev.filter(t => t.url !== url));
  };

  const getYouTubeID = (url: string) => { const match = url.match(/[?&]v=([^&]+)/); return match ? match[1] : null; };

  return (
    <motion.div 
      variants={playerVariants}
      initial="hidden"
      animate={visible ? "visible" : "hidden"}
      className="fixed bottom-6 left-6 z-[9000] font-sans"
    >
      {/* 🛑 GLOBAL SCROLL HIDER FOR THIS COMPONENT */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {sourceType === 'file' && <audio ref={audioRef} src={currentTrack.url} onEnded={() => changeTrack('next')} />}
      <div className={sourceType === 'youtube' ? 'fixed top-[-9999px]' : 'hidden'}>
        <YouTube 
          videoId={getYouTubeID(currentTrack.url) || ''} 
          onReady={e => { youtubeRef.current = e.target; e.target.setVolume(volume * 100); if(isPlaying && sourceType === 'youtube') e.target.playVideo(); }} 
          onEnd={() => changeTrack('next')} 
          opts={{ playerVars: { autoplay: 1, controls: 0, playsinline: 1 } }} 
        />
      </div>

      <motion.div 
        layout
        variants={expandVariants}
        initial="collapsed"
        animate={isExpanded ? "expanded" : "collapsed"}
        className="bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/10 rounded-[32px] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] flex flex-col w-80 md:w-96 overflow-hidden origin-bottom-left"
      >
        <div 
          className="h-[72px] flex items-center justify-between px-3 cursor-pointer relative z-20 group shrink-0" 
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3 pl-2 flex-1 overflow-hidden">
            <motion.div 
              variants={discSpin}
              animate={isPlaying ? "playing" : "paused"}
              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 ${isPlaying ? 'bg-indigo-500 border-indigo-400' : 'bg-white/10 border-white/5'}`}
            >
              <Disc size={18} className="text-white mix-blend-overlay" />
            </motion.div>
            
            <div className="flex flex-col overflow-hidden gap-0.5">
              <motion.span layout className="text-white text-sm font-bold truncate">
                {currentTrack.name}
              </motion.span>
              <div className="flex items-center gap-2">
                {isPlaying ? <Equalizer playing={isPlaying} /> : <div className="h-1 w-1 bg-white/20 rounded-full" />}
                <span className="text-[10px] text-white/50 uppercase tracking-widest font-bold">
                  {isPlaying ? 'Live' : 'Ready'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pr-1">
             <motion.button 
               onClick={togglePlay} 
               whileHover={{ scale: 1.1 }}
               whileTap={{ scale: 0.9 }}
               className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center shadow-lg z-30 relative"
             >
               {isPlaying ? <Pause size={18} fill="black"/> : <Play size={18} fill="black" className="ml-1"/>}
             </motion.button>
             <motion.button 
              animate={{ rotate: isExpanded ? 180 : 0 }}
              className="p-2 text-white/40 hover:text-white transition-colors"
             >
               <ChevronUp size={18} />
             </motion.button>
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/5">
             {isPlaying && (
               <motion.div 
                 layoutId="progress"
                 className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                 initial={{ width: "0%" }}
                 animate={{ width: "100%" }}
                 transition={{ duration: 120, ease: "linear" }}
               />
             )}
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="px-5 pb-5 border-t border-white/5 bg-[#121212]"
            >
               <div className="flex justify-between items-center py-6 px-6">
                  <motion.button whileTap={{ scale: 0.8 }} onClick={(e) => { e.stopPropagation(); changeTrack('prev'); }} className="text-white/60 hover:text-white transition-colors"><SkipBack size={28}/></motion.button>
                  <motion.button 
                    onClick={togglePlay}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-16 h-16 bg-white text-black rounded-[20px] flex items-center justify-center shadow-[0_10px_30px_rgba(255,255,255,0.2)]"
                  >
                    {isPlaying ? <Pause size={32} fill="black"/> : <Play size={32} fill="black" className="ml-1"/>}
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.8 }} onClick={(e) => { e.stopPropagation(); changeTrack('next'); }} className="text-white/60 hover:text-white transition-colors"><SkipForward size={28}/></motion.button>
               </div>

               <div className="flex items-center gap-2 mb-4 bg-white/5 p-1.5 rounded-2xl">
                  <button onClick={() => setViewMode('library')} className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all ${viewMode === 'library' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white/60'}`}>Library</button>
                  <button onClick={() => setViewMode('add')} className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all ${viewMode === 'add' ? 'bg-indigo-500/20 text-indigo-300 shadow-sm' : 'text-white/40 hover:text-white/60'}`}>Add Track</button>
               </div>

               {viewMode === 'library' && (
                 <>
                   {/* Categories - Horizontal Scroll */}
                   <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar pb-1">
                      {CATEGORIES.map(cat => (
                        <motion.button 
                          key={cat.id} 
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setActiveCategory(cat.id as any)} 
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all whitespace-nowrap ${activeCategory === cat.id ? `${cat.color} border-transparent shadow-[0_0_15px_rgba(255,255,255,0.1)]` : 'bg-transparent border-white/10 text-white/40'}`}
                        >
                          <cat.icon size={12} /> {cat.label}
                        </motion.button>
                      ))}
                   </div>
                   
                   {/* Track List - Vertical Scroll */}
                   <div className="max-h-56 overflow-y-auto space-y-2 pr-1 no-scrollbar">
                      {filteredPlaylist.map((track, i) => {
                        const isTrackPlaying = currentTrackUrl === track.url;
                        return (
                          <motion.div 
                            key={`${track.url}-${i}`} 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            onClick={() => { setCurrentTrackUrl(track.url); setIsPlaying(true); }} 
                            className={`group flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all border ${isTrackPlaying ? 'bg-white/10 border-white/10 shadow-lg' : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/5'}`}
                          >
                            <div className="flex items-center gap-3 overflow-hidden">
                               <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isTrackPlaying ? 'bg-indigo-500 text-white' : 'bg-white/5 text-white/30'}`}>
                                 {isTrackPlaying ? <Equalizer playing={isPlaying} /> : <Music2 size={16} />}
                               </div>
                               <div className="min-w-0 flex-1">
                                 <p className={`text-xs font-bold truncate ${isTrackPlaying ? 'text-white' : 'text-white/70'}`}>{track.name}</p>
                                 <p className="text-[10px] text-white/30 uppercase tracking-wide">{track.category}</p>
                               </div>
                            </div>
                            <motion.button 
                              whileHover={{ scale: 1.1, color: "#ef4444" }}
                              onClick={(e) => deleteTrack(e, track.url)} 
                              className="p-2 opacity-0 group-hover:opacity-100 text-white/20 transition-all"
                            >
                              <Trash2 size={14} />
                            </motion.button>
                          </motion.div>
                        );
                      })}
                   </div>
                 </>
               )}

               {viewMode === 'add' && (
                 <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-white/40 uppercase ml-2">Track Title</label>
                      <input className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-indigo-500 transition-colors placeholder:text-white/20" placeholder="e.g., Chill Beats 2024" value={newName} onChange={e => setNewName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-white/40 uppercase ml-2">Source URL</label>
                      <input className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-indigo-500 transition-colors placeholder:text-white/20" placeholder="YouTube Link" value={newUrl} onChange={e => setNewUrl(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                       {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                          <button key={cat.id} onClick={() => setNewCategory(cat.id as TrackCategory)} className={`py-2 rounded-lg text-[10px] font-bold uppercase border transition-all ${newCategory === cat.id ? cat.color : 'border-white/10 text-white/40'}`}>{cat.label}</button>
                       ))}
                    </div>
                    <motion.button whileTap={{ scale: 0.98 }} onClick={addTrack} disabled={!newName || !newUrl} className="w-full bg-white text-black font-bold py-3 rounded-xl mt-2 flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors disabled:opacity-50"><Plus size={16}/> Add to Library</motion.button>
                 </motion.div>
               )}

               <div className="flex items-center gap-4 pt-6 mt-2 border-t border-white/5">
                  <Volume2 size={16} className="text-white/40"/>
                  <VolumeSlider volume={volume} onChange={setVolume} />
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}