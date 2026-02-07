import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import YouTube from 'react-youtube';
import { 
  Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Plus, Disc, 
  Radio, Music2, ListMusic, Code2, Coffee, CloudRain, Zap, Mic2, 
  Trash2, ChevronUp, Shuffle, Repeat, Repeat1
} from 'lucide-react';
import useLocalStorage from '../hooks/useLocalStorage';
import type { Track, TrackCategory } from '../types';

// 🎵 DEFAULT DATA
const DEFAULT_TRACKS: Track[] = [
  { name: 'Lofi Girl - Study Beats', url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk', category: 'lofi' },
  { name: 'Synthwave Radio', url: 'https://www.youtube.com/watch?v=4xDzrJKXOOY', category: 'coding' },
  { name: 'Rain Sounds', url: 'https://cdn.pixabay.com/download/audio/2022/07/04/audio_165030c44c.mp3', category: 'ambient' },
  { name: 'Piano Moment', url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3', category: 'instrumental' },
];

const CATEGORIES: { id: TrackCategory | 'all'; label: string; icon: any; color: string }[] = [
  { id: 'all', label: 'All', icon: ListMusic, color: 'bg-white/10 text-white' },
  { id: 'coding', label: 'Coding', icon: Code2, color: 'bg-cyan-500/20 text-cyan-300' },
  { id: 'lofi', label: 'Lofi', icon: Coffee, color: 'bg-purple-500/20 text-purple-300' },
  { id: 'focus', label: 'Focus', icon: Zap, color: 'bg-orange-500/20 text-orange-300' },
  { id: 'ambient', label: 'Ambient', icon: CloudRain, color: 'bg-emerald-500/20 text-emerald-300' },
  { id: 'instrumental', label: 'Piano', icon: Mic2, color: 'bg-pink-500/20 text-pink-300' },
];

const getSourceType = (url: string): 'youtube' | 'file' => {
  if (url.includes('youtu')) return 'youtube';
  return 'file';
};

const getYouTubeID = (url: string) => {
  const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
  return (match && match[2].length === 11) ? match[2] : null;
};

// 📊 VISUALIZER COMPONENT
const AudioVisualizer = ({ isPlaying }: { isPlaying: boolean }) => (
  <div className="flex items-end gap-0.5 h-3 ml-2">
    {[...Array(4)].map((_, i) => (
      <motion.div
        key={i}
        className="w-1 bg-green-400 rounded-full"
        animate={{ height: isPlaying ? [4, 12, 6, 12] : 3 }}
        transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
      />
    ))}
  </div>
);

export default function MusicPlayer({ onSongChange }: { onSongChange?: (song: string) => void }) {
  // 💾 STATE
  const [playlist, setPlaylist] = useLocalStorage<Track[]>('user-playlist', DEFAULT_TRACKS);
  const [volume, setVolume] = useLocalStorage<number>('player-volume', 0.5);
  const [isShuffle, setIsShuffle] = useLocalStorage<boolean>('player-shuffle', false);
  const [repeatMode, setRepeatMode] = useLocalStorage<'off' | 'all' | 'one'>('player-repeat', 'all');

  // 🎵 PLAYBACK
  const [currentTrackUrl, setCurrentTrackUrl] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  // 🎨 UI
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeCategory, setActiveCategory] = useState<TrackCategory | 'all'>('all');
  const [viewMode, setViewMode] = useState<'library' | 'add'>('library');

  // 📝 FORM
  const [newUrl, setNewUrl] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<TrackCategory>('coding');

  // 🔗 REFS
  const audioRef = useRef<HTMLAudioElement>(null);
  const youtubeRef = useRef<any>(null);

  // 1. Initialize First Track
  useEffect(() => {
    if (!currentTrackUrl && playlist.length > 0) {
      setCurrentTrackUrl(playlist[0].url);
    }
  }, [playlist, currentTrackUrl]);

  // 2. Computed Values
  const currentTrack = useMemo(() => 
    playlist.find(t => t.url === currentTrackUrl) || playlist[0] || DEFAULT_TRACKS[0]
  , [playlist, currentTrackUrl]);

  const sourceType = getSourceType(currentTrack.url);
  
  const filteredPlaylist = useMemo(() => 
    activeCategory === 'all' ? playlist : playlist.filter(t => t.category === activeCategory), 
  [playlist, activeCategory]);

  // 3. Notify Parent Component (For Sync)
  useEffect(() => {
    if (onSongChange && isPlaying) {
      onSongChange(currentTrack.name);
    } else if (onSongChange && !isPlaying) {
      onSongChange('Paused');
    }
  }, [currentTrack, isPlaying, onSongChange]);

  // 4. Audio Engine Sync
  useEffect(() => {
    const vol = isMuted ? 0 : volume;

    // HTML Audio
    if (audioRef.current) {
      audioRef.current.volume = vol;
      if (isPlaying && sourceType === 'file') {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => setIsPlaying(false));
        }
      } else {
        audioRef.current.pause();
      }
    }

    // YouTube Audio
    if (youtubeRef.current && youtubeRef.current.internalPlayer) {
      youtubeRef.current.setVolume(vol * 100);
      if (isPlaying && sourceType === 'youtube') {
         youtubeRef.current.playVideo();
      } else {
         youtubeRef.current.pauseVideo();
      }
    }
  }, [isPlaying, volume, isMuted, sourceType, currentTrackUrl]);

  // 🎮 CORE LOGIC
  const changeTrack = (dir: 'next' | 'prev', auto = false) => {
    if (filteredPlaylist.length === 0) return;

    // Handle Repeat One
    if (auto && repeatMode === 'one') {
      if (audioRef.current) { audioRef.current.currentTime = 0; audioRef.current.play(); }
      if (youtubeRef.current) { youtubeRef.current.seekTo(0); youtubeRef.current.playVideo(); }
      return;
    }

    const currentIndex = filteredPlaylist.findIndex(t => t.url === currentTrack.url);
    let nextIndex = 0;

    if (isShuffle && dir === 'next') {
       do {
         nextIndex = Math.floor(Math.random() * filteredPlaylist.length);
       } while (nextIndex === currentIndex && filteredPlaylist.length > 1);
    } else {
       if (dir === 'next') {
         if (currentIndex === filteredPlaylist.length - 1 && repeatMode === 'off' && auto) {
           setIsPlaying(false); return;
         }
         nextIndex = (currentIndex + 1) % filteredPlaylist.length;
       } else {
         nextIndex = (currentIndex - 1 + filteredPlaylist.length) % filteredPlaylist.length;
       }
    }

    setCurrentTrackUrl(filteredPlaylist[nextIndex].url);
    setIsPlaying(true);
  };

  // 🗑️ ACTIONS
  const toggleRepeat = () => {
    if (repeatMode === 'off') setRepeatMode('all');
    else if (repeatMode === 'all') setRepeatMode('one');
    else setRepeatMode('off');
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

  // YouTube Helpers
  const onPlayerReady = (event: any) => {
    youtubeRef.current = event.target;
    event.target.setVolume(volume * 100);
    if(isPlaying) event.target.playVideo();
  };

  return (
    <div className="fixed bottom-6 left-6 z-[9999] font-sans">
      
      {/* 🟢 AUDIO ENGINES */}
      {sourceType === 'file' && (
        <audio 
          ref={audioRef} 
          src={currentTrack.url} 
          onEnded={() => changeTrack('next', true)} 
          onError={() => changeTrack('next', true)} 
        />
      )}
      
      {/* YouTube must always be rendered but hidden to maintain state */}
      <div className={sourceType === 'youtube' ? 'fixed top-[-9999px] left-[-9999px]' : 'hidden'}>
        <YouTube 
          videoId={getYouTubeID(currentTrack.url) || ''} 
          onReady={onPlayerReady} 
          onEnd={() => changeTrack('next', true)} 
          opts={{ playerVars: { autoplay: 1, controls: 0, playsinline: 1 } }} 
        />
      </div>

      {/* 🎵 MAIN DOCK */}
      <motion.div 
        layout
        initial={false}
        className="bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 rounded-[28px] shadow-2xl flex flex-col overflow-hidden w-80 md:w-96 transition-all origin-bottom-left"
        animate={{ height: isExpanded ? 'auto' : 72 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        
        {/* 1️⃣ MINI PLAYER */}
        <div 
          className="h-[72px] flex items-center justify-between px-2 cursor-pointer relative z-20 bg-gradient-to-r from-white/5 to-transparent select-none"
          onClick={(e) => { if ((e.target as HTMLElement).closest('button')) return; setIsExpanded(!isExpanded); }}
        >
          {/* Info */}
          <div className="flex items-center gap-3 pl-2 overflow-hidden flex-1">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${isPlaying ? 'bg-indigo-500 animate-spin-slow' : 'bg-white/10'}`}>
               <Disc size={18} className={isPlaying ? 'text-white' : 'text-white/50'} />
            </div>
            
            <div className="flex flex-col overflow-hidden">
               <span className="text-white text-sm font-bold truncate">{currentTrack.name}</span>
               <div className="flex items-center gap-2">
                 <span className="text-[10px] text-white/50 uppercase tracking-wide">{currentTrack.category}</span>
                 {isPlaying && <AudioVisualizer isPlaying={isPlaying} />}
               </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1 pr-1 pointer-events-auto z-30">
            <button onClick={() => changeTrack('prev')} className="p-2 text-white/60 hover:text-white rounded-full hover:bg-white/10 transition-colors">
              <SkipBack size={18}/>
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setIsPlaying(!isPlaying); }} 
              className="w-9 h-9 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg mx-1"
            >
              {isPlaying ? <Pause size={18} fill="black" /> : <Play size={18} fill="black" className="ml-1" />}
            </button>
            <button onClick={() => changeTrack('next')} className="p-2 text-white/60 hover:text-white rounded-full hover:bg-white/10 transition-colors">
              <SkipForward size={18}/>
            </button>
            
            <div className="w-px h-5 bg-white/10 mx-1" />
            
            <button 
              onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }} 
              className="p-2 text-white/40 hover:text-white transition-transform duration-300" 
              style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
            >
              <ChevronUp size={18} />
            </button>
          </div>
        </div>

        {/* 2️⃣ EXPANDED CONTENT */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="px-4 pb-4 border-t border-white/5 bg-[#121212] pointer-events-auto"
            >
              
              {/* SHUFFLE / REPEAT */}
              <div className="flex items-center justify-between mb-4 mt-2">
                 <button 
                   onClick={() => setIsShuffle(!isShuffle)}
                   className={`p-2 rounded-lg transition-all flex items-center gap-2 text-xs font-bold ${isShuffle ? 'bg-indigo-500/20 text-indigo-300' : 'text-white/40 hover:text-white'}`}
                 >
                   <Shuffle size={14} /> {isShuffle ? 'On' : 'Off'}
                 </button>

                 <button 
                   onClick={toggleRepeat}
                   className={`p-2 rounded-lg transition-all flex items-center gap-2 text-xs font-bold ${repeatMode !== 'off' ? 'bg-indigo-500/20 text-indigo-300' : 'text-white/40 hover:text-white'}`}
                 >
                   {repeatMode === 'one' ? <Repeat1 size={14} /> : <Repeat size={14} />} 
                   {repeatMode === 'off' ? 'Off' : (repeatMode === 'one' ? '1' : 'All')}
                 </button>
              </div>

              {/* TABS */}
              <div className="flex items-center gap-2 mb-4 bg-white/5 p-1 rounded-xl">
                 <button onClick={() => setViewMode('library')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === 'library' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white'}`}>Library</button>
                 <button onClick={() => setViewMode('add')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === 'add' ? 'bg-emerald-500/20 text-emerald-300 shadow-sm' : 'text-white/40 hover:text-white'}`}>Add</button>
              </div>

              {/* --- VIEW: LIBRARY --- */}
              {viewMode === 'library' && (
                <>
                  <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar pb-1">
                    {CATEGORIES.map(cat => (
                      <button 
                        key={cat.id} 
                        onClick={() => setActiveCategory(cat.id as TrackCategory | 'all')} 
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all whitespace-nowrap ${activeCategory === cat.id ? `${cat.color} border-transparent` : 'bg-transparent border-white/10 text-white/40 hover:border-white/30'}`}
                      >
                        <cat.icon size={10} /> {cat.label}
                      </button>
                    ))}
                  </div>
                  <div className="max-h-56 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                    {filteredPlaylist.map((track, i) => (
                      <div 
                        key={`${track.url}-${i}`} 
                        onClick={() => { setCurrentTrackUrl(track.url); setIsPlaying(true); }} 
                        className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${currentTrackUrl === track.url ? 'bg-white/10 border border-white/5' : 'hover:bg-white/5 border border-transparent'}`}
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                           <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${currentTrackUrl === track.url ? 'bg-indigo-500' : 'bg-white/5'}`}>
                             {currentTrackUrl === track.url ? <AudioVisualizer isPlaying={isPlaying}/> : <Music2 size={14} className="text-white/30"/>}
                           </div>
                           <div className="min-w-0">
                             <p className={`text-xs font-bold truncate ${currentTrackUrl === track.url ? 'text-white' : 'text-white/70'}`}>{track.name}</p>
                             <p className="text-[10px] text-white/30">{track.category}</p>
                           </div>
                        </div>
                        <button onClick={(e) => deleteTrack(e, track.url)} className="p-2 opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded-full text-white/40 hover:text-red-400 transition-all">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* --- VIEW: ADD --- */}
              {viewMode === 'add' && (
                <div className="space-y-3">
                   <div className="space-y-1">
                      <label className="text-[10px] font-bold text-white/40 uppercase ml-1">Track Name</label>
                      <input className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 transition-colors" placeholder="e.g. My Favorite Song" value={newName} onChange={e => setNewName(e.target.value)} />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-bold text-white/40 uppercase ml-1">YouTube / MP3 URL</label>
                      <input className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 transition-colors" placeholder="https://..." value={newUrl} onChange={e => setNewUrl(e.target.value)} />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-bold text-white/40 uppercase ml-1">Category</label>
                      <div className="grid grid-cols-3 gap-2">
                        {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                          <button key={cat.id} onClick={() => setNewCategory(cat.id as TrackCategory)} className={`py-2 rounded-lg text-[10px] font-bold uppercase border transition-all ${newCategory === cat.id ? cat.color : 'border-white/10 text-white/40 hover:bg-white/5'}`}>{cat.label}</button>
                        ))}
                      </div>
                   </div>
                   <button onClick={addTrack} disabled={!newName || !newUrl} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl mt-2 transition-all">Save to Library</button>
                </div>
              )}

              {/* VOLUME SLIDER */}
              <div className="flex items-center gap-3 mt-4 pt-3 border-t border-white/5">
                 <button onClick={() => setIsMuted(!isMuted)} className="text-white/50 hover:text-white transition-colors">
                   {isMuted ? <VolumeX size={16}/> : <Volume2 size={16}/>}
                 </button>
                 <input 
                   type="range" 
                   min="0" 
                   max="1" 
                   step="0.05" 
                   value={isMuted ? 0 : volume} 
                   onChange={e => setVolume(parseFloat(e.target.value))} 
                   className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-white" 
                 />
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}