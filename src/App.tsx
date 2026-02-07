import { useState, useEffect, useRef } from 'react';
import { useQuery, useConvex } from "convex/react";
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
  // 1️⃣ IDENTITY & PROFILE
  const [myEmail, setMyEmail] = useState(() => localStorage.getItem('user_email') || '');
  
  // Fetch full profile
  const userProfile = useQuery(api.study.getUser, myEmail ? { email: myEmail } : "skip");
  const convex = useConvex(); 

  // State to hold an invite found in the URL until the user is logged in
  const [pendingInvite, setPendingInvite] = useState<string | null>(null);

  // 2️⃣ INITIAL SETUP (Login & URL Check)
  useEffect(() => {
    // A. Check URL for invite immediately on load
    const urlParams = new URLSearchParams(window.location.search);
    const inviteUsername = urlParams.get('invite');
    
    if (inviteUsername) {
      setPendingInvite(inviteUsername);
      // Clean URL immediately so it looks nice
      window.history.replaceState({}, document.title, "/");
    }

    // B. Check Login
    if (!myEmail) {
      const email = prompt("Enter your email to login:")?.toLowerCase();
      if (email) {
        setMyEmail(email);
        localStorage.setItem('user_email', email);
      }
    }
  }, []);

  // 3️⃣ APP STATE
  const [sessions, setSessions] = useLocalStorage<Session[]>('clock-sessions', []);
  const [theme, setTheme] = useLocalStorage<ThemeConfig>('clock-theme', { 
    type: 'video', 
    value: 'https://motionbgs.com/media/8/son-goku-ultra-power.mp4' 
  });
  const [mode, setMode] = useLocalStorage<'timer' | 'stopwatch'>('clock-mode', 'timer');
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  
  // Lifted State for Sync
  const [currentMinutes, setCurrentMinutes] = useState(0);
  const [currentSong, setCurrentSong] = useState('');
  const [userStatus, setUserStatus] = useState('Idle');

  // 4️⃣ SYNC HOOK
  const handleServerThemeUpdate = (newTheme: ThemeConfig) => {
    if (newTheme.value !== theme.value) setTheme(newTheme);
  };

  const { isLinked, partner, addFriend, leaveSpace, syncTheme } = useSharedSpace(
    myEmail,
    { minutes: currentMinutes, song: currentSong, status: userStatus },
    handleServerThemeUpdate
  );

  // 5️⃣ PROCESS INVITE (Run this when we have Email, Profile, AND a Pending Invite)
  useEffect(() => {
    const processInvite = async () => {
      if (!pendingInvite || !myEmail || !userProfile) return;

      // prevent self-invite
      if (pendingInvite === userProfile.username) {
        console.log("Cannot invite self.");
        setPendingInvite(null);
        return;
      }

      // Check if we are already connected to this person? 
      // (Optional optimization, but the backend handles it safely too)

      try {
        // Resolve who this user is to show a nice name
        const inviter = await convex.query(api.study.resolveInvite, { username: pendingInvite });

        if (!inviter) {
          alert("❌ This invite link is invalid or expired.");
          setPendingInvite(null);
          return;
        }

        // Ask the user
        const accept = window.confirm(`🚀 Join ${inviter.name}'s space (@${pendingInvite})?`);
        
        if (accept) {
           console.log("Accepting invite from:", pendingInvite);
           await addFriend(pendingInvite); // Use the username directly
        }
      } catch (err) {
        console.error("Invite processing failed:", err);
      } finally {
        setPendingInvite(null); // Clear it so it doesn't run again
      }
    };

    processInvite();
  }, [pendingInvite, myEmail, userProfile, addFriend, convex]);


  // 6️⃣ HANDLERS
  const handleManualThemeChange = (newTheme: ThemeConfig) => {
    setTheme(newTheme);
    if (isLinked) syncTheme(newTheme);
  };

  const handleTimerTick = (mins: number) => setCurrentMinutes(mins);
  const handleTimerStart = () => setUserStatus('Focusing 🔥');
  
  const addSession = (session: Session) => {
    setSessions(prev => [session, ...prev]);
    setUserStatus('Chilling ☕');
  };

  const isVideo = theme.type === 'video';
  const bgStyle = !isVideo && theme.type === 'image' 
    ? { backgroundImage: `url(${theme.value})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: theme.value };

  // 🛑 RENDER GATES
  if (!myEmail) return <div className="h-screen bg-black flex items-center justify-center text-white"><Loader2 className="animate-spin mr-2"/> Loading...</div>;
  
  if (userProfile === null) {
      return <Onboarding email={myEmail} onComplete={() => window.location.reload()} />;
  }

  return (
    <div 
      className="h-screen w-full text-white transition-all duration-1000 ease-in-out relative overflow-hidden font-sans selection:bg-pink-500/30"
      style={!isVideo ? bgStyle : {}}
    >
      {isVideo && (
        <div className="absolute inset-0 z-0 overflow-hidden">
          <video
            key={theme.value} 
            autoPlay loop muted playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-80"
          >
            <source src={theme.value} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/40" />
        </div>
      )}

      <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0 mix-blend-overlay" style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }} />

      <div className="relative z-10 h-full flex flex-col">
        <BackgroundPicker currentTheme={theme} setTheme={handleManualThemeChange} />
        
        <FocusBuddyDock 
           myEmail={myEmail}
           myUsername={userProfile?.username || ''} 
           partner={partner}
           isLinked={isLinked}
           addFriend={addFriend} 
           leaveSpace={leaveSpace}
           myMinutes={currentMinutes}
        />

        <StatsBoard 
           isOpen={isStatsOpen} 
           onClose={() => setIsStatsOpen(false)} 
           sessions={sessions} 
        />

        <header className="absolute top-0 left-0 w-full p-6 flex justify-center pointer-events-none z-40">
           <div className="pointer-events-auto flex items-center gap-2 bg-black/30 backdrop-blur-xl p-1.5 rounded-full border border-white/10 shadow-2xl">
              <button onClick={() => setMode('timer')} className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2 ${mode === 'timer' ? 'bg-white text-black shadow-lg scale-105' : 'text-white/60 hover:text-white'}`}>
                <Clock size={16} /> Timer
              </button>
              <button onClick={() => setMode('stopwatch')} className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2 ${mode === 'stopwatch' ? 'bg-cyan-400 text-black shadow-lg shadow-cyan-400/20 scale-105' : 'text-white/60 hover:text-white'}`}>
                <TimerIcon size={16} /> Stopwatch
              </button>
              
              <div className="w-px h-6 bg-white/10 mx-1"></div>

              <button onClick={() => setIsStatsOpen(true)} className="w-10 h-10 flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                <BarChart3 size={18} />
              </button>
           </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="w-full animate-in fade-in zoom-in duration-500">
            {mode === 'timer' ? (
              <Timer onSessionComplete={addSession} onStart={handleTimerStart} onTick={handleTimerTick} initialMinutes={25} />
            ) : (
              <Stopwatch onSessionComplete={addSession} />
            )}
          </div>
        </main>
      </div>

      <MusicPlayer onSongChange={setCurrentSong} />
    </div>
  );
}