import { useState, useEffect } from 'react';
import { useQuery, useMutation, useConvex } from "convex/react"; // Added useMutation
import { api } from "../convex/_generated/api";
import Timer from './components/Timer';
import Stopwatch from './components/Stopwatch';
import BackgroundPicker from './components/BackgroundPicker';
import MusicPlayer from './components/MusicPlayer';
import FocusBuddyDock from './components/FocusBuddyDock'; 
import StatsBoard from './components/StatsBoard';
import Onboarding from './components/Onboarding';
import { useSharedSpace } from './hooks/useSharedSpace';
import useLocalStorage from './hooks/useLocalStorage';
import { Clock, Timer as TimerIcon, BarChart3, Loader2 } from 'lucide-react';
import type { Session, ThemeConfig } from './types';

export default function App() {
  // 1️⃣ IDENTITY & DATA FETCHING
  const [myEmail, setMyEmail] = useState(() => localStorage.getItem('user_email') || '');
  
  // Fetch User Profile
  const userProfile = useQuery(api.study.getUser, myEmail ? { email: myEmail } : "skip");
  
  // 🚀 NEW: Fetch Gamified Squad Stats (Team History, Levels, XP)
  const squadStats = useQuery(api.study.getSquadronStats, myEmail ? { email: myEmail } : "skip");
  
  // 🚀 NEW: Mutation to save sessions to Cloud
  const logSessionMutation = useMutation(api.study.logSession);

  const convex = useConvex(); 

  // 2️⃣ UI STATE (Panel Management)
  const [activePanel, setActivePanel] = useState<'none' | 'background' | 'focus' | 'stats'>('none');

  const togglePanel = (panel: 'background' | 'focus' | 'stats') => {
    setActivePanel(prev => prev === panel ? 'none' : panel);
  };
  const closeAll = () => setActivePanel('none');

  // 3️⃣ INVITE LOGIC
  const [pendingInvite, setPendingInvite] = useState<string | null>(null);
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const inviteUsername = urlParams.get('invite');
    if (inviteUsername) {
      setPendingInvite(inviteUsername);
      window.history.replaceState({}, document.title, "/");
    }
    if (!myEmail) {
      const email = prompt("Enter your email to login:")?.toLowerCase();
      if (email) {
        setMyEmail(email);
        localStorage.setItem('user_email', email);
      }
    }
  }, []);

  // 4️⃣ SYNC & STORAGE
  // Note: We removed 'sessions' from useLocalStorage because we now use the Cloud DB!
  const [theme, setTheme] = useLocalStorage<ThemeConfig>('clock-theme', { type: 'video', value: 'https://motionbgs.com/media/8/son-goku-ultra-power.mp4' });
  const [mode, setMode] = useLocalStorage<'timer' | 'stopwatch'>('clock-mode', 'timer');
  
  // Lifted State for Live Sync
  const [currentMinutes, setCurrentMinutes] = useState(0);
  const [currentSong, setCurrentSong] = useState('');
  const [userStatus, setUserStatus] = useState('Idle');

  const handleServerThemeUpdate = (newTheme: ThemeConfig) => { if (newTheme.value !== theme.value) setTheme(newTheme); };
  
  const { isLinked, partner, addFriend, leaveSpace, syncTheme } = useSharedSpace(
    myEmail, { minutes: currentMinutes, song: currentSong, status: userStatus }, handleServerThemeUpdate
  );

  // Process Invite after login
  useEffect(() => {
    const processInvite = async () => {
      if (!pendingInvite || !myEmail || !userProfile) return;
      if (pendingInvite === userProfile.username) { setPendingInvite(null); return; }
      try {
        const inviter = await convex.query(api.study.resolveInvite, { username: pendingInvite });
        if (!inviter) { alert("❌ Invalid invite."); setPendingInvite(null); return; }
        if (window.confirm(`🚀 Join ${inviter.name}'s space (@${pendingInvite})?`)) {
           await addFriend(pendingInvite);
        }
      } catch (err) { console.error(err); } finally { setPendingInvite(null); }
    };
    processInvite();
  }, [pendingInvite, myEmail, userProfile, addFriend, convex]);

  // 5️⃣ HANDLERS
  const handleManualThemeChange = (newTheme: ThemeConfig) => { setTheme(newTheme); if (isLinked) syncTheme(newTheme); };
  const handleTimerTick = (mins: number) => setCurrentMinutes(mins);
  const handleTimerStart = () => setUserStatus('Focusing 🔥');

  // 🚀 UPDATED: Save Session to Cloud DB instead of LocalStorage
  const addSession = async (session: Session) => {
    if (myEmail) {
      try {
        await logSessionMutation({
          email: myEmail,
          duration: session.duration,
          type: session.type, // 'Focus' or 'Stopwatch'
        });
        console.log("Session logged to cloud!");
      } catch (err) {
        console.error("Failed to log session:", err);
      }
    }
    setUserStatus('Chilling ☕');
  };

  const isVideo = theme.type === 'video';
  const bgStyle = !isVideo && theme.type === 'image' ? { backgroundImage: `url(${theme.value})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: theme.value };

  // 🛑 RENDER GATES
  if (!myEmail) return <div className="h-screen bg-black flex items-center justify-center text-white"><Loader2 className="animate-spin mr-2"/> Loading...</div>;
  if (userProfile === null) return <Onboarding email={myEmail} onComplete={() => window.location.reload()} />;

  return (
    <>
      {/* 📱 MAIN APP CONTAINER */}
      <div 
        className="h-screen w-full text-white relative overflow-hidden font-sans selection:bg-pink-500/30" 
        style={!isVideo ? bgStyle : {}}
      >
        {/* VIDEO LAYER */}
        {isVideo && (
          <div className="absolute inset-0 z-0 overflow-hidden">
            <video key={theme.value} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-80">
              <source src={theme.value} type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-black/40" />
          </div>
        )}
        
        {/* NOISE OVERLAY */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0 mix-blend-overlay" style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }} />

        {/* UI LAYER */}
        <div className="relative z-10 h-full flex flex-col">
          
          {/* TOP RIGHT TOOLS */}
          <BackgroundPicker 
             currentTheme={theme} setTheme={handleManualThemeChange} 
             isOpen={activePanel === 'background'} onToggle={() => togglePanel('background')} onClose={closeAll}
          />
          
          <FocusBuddyDock 
             myEmail={myEmail} myUsername={userProfile?.username || ''} partner={partner} isLinked={isLinked}
             addFriend={addFriend} leaveSpace={leaveSpace} myMinutes={currentMinutes}
             isOpen={activePanel === 'focus'} onToggle={() => togglePanel('focus')} onClose={closeAll}
          />

          {/* STATS OVERLAY (Gamified Team Dashboard) */}
          <StatsBoard 
             isOpen={activePanel === 'stats'} 
             onClose={closeAll} 
             squadData={squadStats}
             myEmail={myEmail} // 👈 Passing the Cloud Data
          />

          {/* HEADER */}
          <header className="absolute top-0 left-0 w-full p-6 flex justify-center pointer-events-none z-40">
             <div className="pointer-events-auto flex items-center gap-2 bg-black/30 backdrop-blur-xl p-1.5 rounded-full border border-white/10 shadow-2xl">
                <button onClick={() => setMode('timer')} className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${mode === 'timer' ? 'bg-white text-black shadow-lg scale-105' : 'text-white/60 hover:text-white'}`}>
                  <Clock size={16} className="mr-2 inline"/> Timer
                </button>
                <button onClick={() => setMode('stopwatch')} className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${mode === 'stopwatch' ? 'bg-cyan-400 text-black shadow-lg scale-105' : 'text-white/60 hover:text-white'}`}>
                  <TimerIcon size={16} className="mr-2 inline"/> Stopwatch
                </button>
                <div className="w-px h-6 bg-white/10 mx-1"></div>
                <button onClick={() => togglePanel('stats')} className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${activePanel === 'stats' ? 'bg-white text-black' : 'text-white/60 hover:text-white hover:bg-white/10'}`}>
                  <BarChart3 size={18} />
                </button>
             </div>
          </header>

          {/* CENTER CONTENT */}
          <main className="flex-1 flex flex-col items-center justify-center p-4">
            <div className="w-full animate-in fade-in zoom-in duration-500">
              {mode === 'timer' ? 
                <Timer onSessionComplete={addSession} onStart={handleTimerStart} onTick={handleTimerTick} initialMinutes={25} /> : 
                <Stopwatch onSessionComplete={addSession} />
              }
            </div>
          </main>
        </div>
      </div>

      {/* 🎵 MUSIC PLAYER (Outside main container, hides when Stats are open) */}
      <MusicPlayer 
         onSongChange={setCurrentSong} 
         visible={activePanel !== 'stats'} 
      />
    </>
  );
}