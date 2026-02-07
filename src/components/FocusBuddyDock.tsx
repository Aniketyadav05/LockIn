import { useState, useRef, useEffect } from 'react';
import { Users, Heart, Sparkles, LogOut, Copy, ArrowRight, AtSign, Zap, Loader2, Link as LinkIcon, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useClickOutside from '../hooks/useClickOutside';

interface Props {
  myEmail: string;
  myUsername?: string;
  partner: any;
  isLinked: boolean;
  addFriend: (username: string) => void;
  leaveSpace: () => void;
  myMinutes: number;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

const TAG_COLORS: Record<string, string> = {
  work: 'border-sky-500 text-sky-400',
  study: 'border-pink-500 text-pink-400',
  code: 'border-cyan-500 text-cyan-400',
  create: 'border-purple-500 text-purple-400',
  read: 'border-amber-500 text-amber-400',
  fitness: 'border-emerald-500 text-emerald-400',
  default: 'border-indigo-500 text-indigo-400'
};

// 🏃‍♂️ VARIANTS (Typed as any for build stability)
const dockVariants: any = {
  hidden: { opacity: 0, scale: 0.92, y: 12, filter: "blur(8px)", transition: { type: "spring", stiffness: 400, damping: 30 } },
  visible: { opacity: 1, scale: 1, y: 0, filter: "blur(0px)", transition: { type: "spring", stiffness: 400, damping: 25, mass: 0.8 } },
  exit: { opacity: 0, scale: 0.96, filter: "blur(4px)", transition: { duration: 0.15, ease: "easeOut" } }
};

const pulseVariants: any = {
  idle: { scale: 1, opacity: 0.4 },
  active: { scale: [1, 1.15, 1], opacity: [0.4, 0.8, 0.4], transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" } }
};

export default function FocusBuddyDock({ 
  myUsername, partner, isLinked, addFriend, leaveSpace, myMinutes, 
  isOpen, onToggle, onClose 
}: Props) {
  const [friendInput, setFriendInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'join' | 'invite'>('join');
  const [isConnecting, setIsConnecting] = useState(false);
  
  // 1️⃣ FIX: Use HTMLDivElement for valid ref assignment
  const containerRef = useRef<HTMLDivElement>(null);

  // 2️⃣ FIX: Cast to any to bypass hook signature mismatch
  useClickOutside(containerRef as any, () => {
    if (isOpen) onClose();
  });

  useEffect(() => {
    if (isLinked) setIsConnecting(false);
  }, [isLinked]);

  const handleConnect = async () => {
    if (!friendInput) return;
    setIsConnecting(true);
    await addFriend(friendInput);
    setTimeout(() => setIsConnecting(false), 3000); 
  };

  const partnerMinutes = partner?.minutes || 0;
  const totalMinutes = myMinutes + partnerMinutes;
  const isPartnerActive = partner?.status && partner.status !== 'Offline';
  
  const partnerTagStyle = isPartnerActive ? TAG_COLORS.default : 'border-white/10 text-white/40';

  const getInviteLink = () => `${window.location.origin}/?invite=${encodeURIComponent(myUsername || '')}`;
  const copyLink = () => { navigator.clipboard.writeText(getInviteLink()); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const handleLeave = () => { if (confirm("Disconnect from your squad?")) { leaveSpace(); onClose(); } };

  return (
    <div ref={containerRef} className="fixed top-24 right-6 z-50 flex flex-col items-end font-sans">
      
      <motion.button 
        onClick={onToggle} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.92 }}
        className={`relative p-3 rounded-full backdrop-blur-xl shadow-2xl border transition-all duration-300 group z-50
          ${isLinked 
            ? 'bg-indigo-500/20 border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.3)]' 
            : (isOpen ? 'bg-white text-black border-white' : 'bg-black/40 border-white/10 text-white/70 hover:bg-white/10 hover:text-white')
          }
        `}
      >
        <Users size={20} className={isLinked ? "text-indigo-300" : "currentColor"} />
        <div className={`absolute -top-1 -right-1 flex h-3 w-3`}>
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isPartnerActive ? 'bg-green-400' : 'bg-gray-500 hidden'}`}></span>
          <span className={`relative inline-flex rounded-full h-3 w-3 border-2 border-[#0a0a0a] ${isPartnerActive ? 'bg-green-500' : 'bg-gray-500'}`}></span>
        </div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div variants={dockVariants} initial="hidden" animate="visible" exit="exit" className="mt-4 w-80 bg-[#0a0a0a]/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden">
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                <div className="flex items-center gap-2">
                    {isLinked ? ( <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}><Heart size={16} className="text-pink-400 fill-pink-400/20" /></motion.div> ) : ( <Sparkles size={16} className="text-yellow-400" /> )}
                    <span className="text-xs font-bold text-white uppercase tracking-widest">{isLinked ? 'Sync Active' : 'Squad Link'}</span>
                </div>
                {isLinked && ( <motion.button whileHover={{ scale: 1.1, color: "#ef4444" }} whileTap={{ scale: 0.9 }} onClick={handleLeave} className="text-white/40 transition-colors"><LogOut size={14} /></motion.button> )}
            </div>

            <div className="p-5">
                {!isLinked ? (
                <div className="space-y-4">
                    <div className="flex p-1 bg-white/5 rounded-xl mb-4 relative">
                        {['join', 'invite'].map((tab) => (
                          <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wide rounded-lg transition-colors relative z-10 ${activeTab === tab ? 'text-white' : 'text-white/40 hover:text-white/60'}`}>{tab}</button>
                        ))}
                        <motion.div layoutId="tab-pill" className="absolute top-1 bottom-1 bg-indigo-600 rounded-lg shadow-lg" initial={false} transition={{ type: "spring", stiffness: 500, damping: 30 }} style={{ left: activeTab === 'join' ? '4px' : '50%', width: 'calc(50% - 4px)' }} />
                    </div>

                    <AnimatePresence mode="wait">
                      {activeTab === 'join' && (
                          <motion.div key="join" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }} className="space-y-3">
                              <div className="relative group">
                                  <AtSign size={14} className="absolute left-3 top-3.5 text-white/30 group-focus-within:text-indigo-400 transition-colors duration-300" />
                                  <input className="bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-xs text-white w-full focus:border-indigo-500 focus:bg-white/5 outline-none transition-all placeholder:text-white/20" placeholder="Enter username..." value={friendInput} onChange={e => setFriendInput(e.target.value.toLowerCase())} onKeyDown={e => e.key === 'Enter' && handleConnect()} />
                              </div>
                              <motion.button onClick={handleConnect} disabled={!friendInput || isConnecting} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full bg-white hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wide relative overflow-hidden">
                                <AnimatePresence mode="wait">
                                  {isConnecting ? ( <motion.div key="loading" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}><Loader2 size={14} className="animate-spin" /></motion.div> ) : ( <motion.div key="idle" className="flex items-center gap-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>Connect <ArrowRight size={14}/></motion.div> )}
                                </AnimatePresence>
                              </motion.button>
                          </motion.div>
                      )}

                      {activeTab === 'invite' && (
                          <motion.div key="invite" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }} className="space-y-4">
                              <div className="bg-black/40 border border-white/10 rounded-xl p-1 flex items-center group hover:border-white/20 transition-colors">
                                <div className="flex-1 px-3 py-2 text-[10px] text-white/50 truncate font-mono select-all group-hover:text-white/70 transition-colors">{getInviteLink()}</div>
                                <motion.button onClick={copyLink} whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.1)" }} whileTap={{ scale: 0.9 }} className="p-2 rounded-lg text-white transition-colors">{copied ? <Check size={14} className="text-green-400"/> : <Copy size={14}/>}</motion.button>
                              </div>
                              <motion.button onClick={() => navigator.share?.({ url: getInviteLink() })} whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.1)" }} whileTap={{ scale: 0.98 }} className="w-full flex items-center justify-center gap-2 bg-white/5 border border-white/10 py-2.5 rounded-xl text-xs font-bold text-white transition-all uppercase tracking-wide"><LinkIcon size={14} /> Share Link</motion.button>
                          </motion.div>
                      )}
                    </AnimatePresence>
                </div>
                ) : (
                <div className="space-y-6">
                    <div className="text-center relative">
                        <motion.div variants={pulseVariants} animate={isPartnerActive ? "active" : "idle"} className="absolute inset-0 bg-indigo-500/20 blur-3xl -z-10 rounded-full" />
                        <div className="text-5xl font-mono font-bold text-white tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] tabular-nums">{totalMinutes}<span className="text-lg text-white/40 ml-1">m</span></div>
                        <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-[0.2em] mt-1 flex items-center justify-center gap-1"><Zap size={10} className="fill-indigo-300" /> Combined Focus</div>
                    </div>

                    <div className="flex items-center justify-center gap-6 relative">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
                        
                        <div className="flex flex-col items-center gap-2 z-10">
                            <div className="w-14 h-14 rounded-full bg-[#0a0a0a] border-2 border-indigo-500 flex items-center justify-center text-xs font-bold text-white shadow-[0_0_20px_rgba(99,102,241,0.2)]">YOU</div>
                            <span className="text-[10px] font-mono text-white/60 bg-white/5 px-2 py-0.5 rounded-md">{myMinutes}m</span>
                        </div>

                        <div className="flex flex-col items-center gap-2 z-10">
                            <div className={`w-14 h-14 rounded-full bg-[#0a0a0a] border-2 flex items-center justify-center text-xs font-bold text-white relative transition-colors duration-500 ${partnerTagStyle}`}>
                                {partner.email?.charAt(0).toUpperCase()}
                                {isPartnerActive && (
                                  <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-black"></span>
                                  </span>
                                )}
                            </div>
                            <div className="flex flex-col items-center">
                               <span className="text-[10px] font-mono text-white/60 bg-white/5 px-2 py-0.5 rounded-md">{partnerMinutes}m</span>
                               {isPartnerActive && <span className="text-[8px] uppercase tracking-wider text-white/40 mt-1">{partner.status === 'Idle' ? 'Online' : partner.status}</span>}
                            </div>
                        </div>
                    </div>
                </div>
                )}
            </div>
            
            <div className="bg-black/40 p-2 text-center border-t border-white/5">
              <p className="text-[9px] text-white/20 font-mono flex items-center justify-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse inline-block" />
                @{myUsername}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}