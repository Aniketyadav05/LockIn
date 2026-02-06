import { useState } from 'react';
import Timer from './components/Timer';
import Stopwatch from './components/Stopwatch';
import BackgroundPicker from './components/BackgroundPicker';
import Analytics from './pages/Analytics';
import MusicPlayer from './components/MusicPlayer';
import ProfileDock from './components/ProfileDock';
import { UserProvider } from './context/UserContext'; // 👈 IMPORT
import useUserLocalStorage from './hooks/useUserLocalStorage'; // 👈 IMPORT
import { BarChart2, Clock, Timer as TimerIcon } from 'lucide-react';
import type { Session, ThemeConfig } from './types';

function AppContent() {
  // 👇 CHANGED: using useUserLocalStorage
  const [sessions, setSessions] = useUserLocalStorage<Session[]>('clock-sessions', []);
  const [theme, setTheme] = useUserLocalStorage<ThemeConfig>('clock-theme', { 
    type: 'video', 
    value: 'https://motionbgs.com/media/8/son-goku-ultra-power.mp4' 
  });
  
  // View/Mode are UI states, they don't necessarily need to persist per user, 
  // but let's persist them anyway so users return to where they left off.
  const [view, setView] = useState<'timer' | 'analytics'>('timer');
  const [mode, setMode] = useUserLocalStorage<'timer' | 'stopwatch'>('clock-mode', 'timer');

  const addSession = (session: Session) => setSessions(prev => [session, ...prev]);

  const isVideo = theme.type === 'video';
  const bgStyle = !isVideo && theme.type === 'image' 
    ? { backgroundImage: theme.value, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: theme.value };

  return (
    <div 
      className="h-screen w-full text-white transition-all duration-1000 ease-in-out relative overflow-hidden font-sans selection:bg-pink-500/30"
      style={!isVideo ? bgStyle : {}}
    >
      {/* 🎥 Video Layer */}
      {isVideo && (
        <div className="absolute inset-0 z-0 overflow-hidden">
          <video
            key={theme.value} // Key forces reload on theme change
            autoPlay loop muted playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src={theme.value} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/40" />
        </div>
      )}

      {/* Noise Texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0 mix-blend-overlay" style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }} />

      {/* 🟢 MAIN APP LAYER */}
      <div className="relative z-10 h-full flex flex-col">
        
        <BackgroundPicker currentTheme={theme} setTheme={setTheme} />
        <ProfileDock /> {/* 👈 Added Profile Switcher */}

        {/* NAVIGATION HEADER */}
        {view === 'timer' && (
          <header className="absolute top-0 left-0 w-full p-6 grid grid-cols-3 items-center z-40 pointer-events-none">
             <div className="flex justify-start pointer-events-auto">
               <button 
                 onClick={() => setView('analytics')}
                 className="group flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 px-4 py-3 rounded-full transition-all hover:scale-105 active:scale-95 shadow-lg"
               >
                 <BarChart2 size={20} className="text-white group-hover:text-pink-300 transition-colors" />
                 <span className="hidden md:inline text-sm font-medium text-white/80">Stats</span>
               </button>
             </div>

             <div className="flex justify-center pointer-events-auto">
               <div className="flex bg-black/30 backdrop-blur-xl p-1.5 rounded-full border border-white/10 shadow-2xl">
                  <button onClick={() => setMode('timer')} className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2 ${mode === 'timer' ? 'bg-white text-black shadow-lg scale-105' : 'text-white/60 hover:text-white'}`}>
                    <Clock size={16} /> Timer
                  </button>
                  <button onClick={() => setMode('stopwatch')} className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2 ${mode === 'stopwatch' ? 'bg-cyan-400 text-black shadow-lg shadow-cyan-400/20 scale-105' : 'text-white/60 hover:text-white'}`}>
                    <TimerIcon size={16} /> Stopwatch
                  </button>
               </div>
             </div>
             <div />
          </header>
        )}

        {/* CENTER CONTENT */}
        <main className="flex-1 flex flex-col items-center justify-center p-4">
          {view === 'analytics' ? (
            <Analytics sessions={sessions} onBack={() => setView('timer')} />
          ) : (
            <div className="w-full animate-in fade-in zoom-in duration-500">
              {mode === 'timer' ? <Timer onSessionComplete={addSession} /> : <Stopwatch onSessionComplete={addSession} />}
            </div>
          )}
        </main>
      </div>

      <MusicPlayer />
    </div>
  );
}

// 🟢 Wrap App in Provider
export default function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}