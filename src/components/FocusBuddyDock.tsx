import { useState } from 'react';
import { Users, Zap, Heart, Sparkles, Activity, Link as LinkIcon, Check, LogOut, Copy, ArrowRight, AtSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  myEmail: string;
  myUsername?: string;
  partner: any;
  isLinked: boolean;
  addFriend: (username: string) => void;
  leaveSpace: () => void;
  myMinutes: number;
}

export default function FocusBuddyDock({ 
  myUsername,
  partner, 
  isLinked, 
  addFriend, 
  leaveSpace,
  myMinutes 
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [friendInput, setFriendInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'join' | 'invite'>('join');

  const partnerMinutes = partner?.minutes || 0;
  const totalMinutes = myMinutes + partnerMinutes;
  const isPartnerActive = partner?.status && partner.status !== 'Offline';

  const getInviteLink = () => `${window.location.origin}/?invite=${encodeURIComponent(myUsername || '')}`;

  const copyLink = () => {
    navigator.clipboard.writeText(getInviteLink());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeave = () => {
    if (confirm("Disconnect from this space?")) {
      leaveSpace();
      setIsOpen(false);
    }
  };

  return (
    <div className="fixed top-24 right-6 z-50 flex flex-col items-end font-sans">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`relative backdrop-blur-xl border p-3 rounded-full shadow-2xl transition-all duration-300 group ${
          isLinked 
            ? 'bg-indigo-500/20 border-indigo-500/50 hover:bg-indigo-500/30' 
            : 'bg-black/40 border-white/10 hover:bg-white/10'
        }`}
      >
        <Users size={20} className={isLinked ? "text-indigo-300" : "text-white/70 group-hover:text-white"} />
        <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-[#0a0a0a] ${isPartnerActive ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            className="mt-4 w-80 bg-[#0a0a0a]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                <div className="flex items-center gap-2">
                    {isLinked ? <Heart size={16} className="text-pink-400" fill="currentColor"/> : <Sparkles size={16} className="text-yellow-400"/>}
                    <span className="text-sm font-bold text-white">{isLinked ? 'Focus Buddy' : 'Connect'}</span>
                </div>
                {isLinked && (
                    <button onClick={handleLeave} className="text-white/40 hover:text-red-400 transition-colors" title="Disconnect">
                        <LogOut size={16} />
                    </button>
                )}
            </div>

            <div className="p-5">
                {!isLinked ? (
                <div className="space-y-4">
                    {/* Tabs */}
                    <div className="flex p-1 bg-white/5 rounded-xl mb-4">
                        <button onClick={() => setActiveTab('join')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'join' ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}>Join</button>
                        <button onClick={() => setActiveTab('invite')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'invite' ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}>Invite</button>
                    </div>

                    {/* JOIN TAB */}
                    {activeTab === 'join' && (
                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-3">
                            <p className="text-xs text-white/60 text-center">Enter a username to connect.</p>
                            <div className="space-y-2">
                                <div className="relative">
                                    <AtSign size={14} className="absolute left-3 top-3.5 text-white/30" />
                                    <input 
                                        className="bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-sm text-white w-full focus:border-indigo-500 outline-none placeholder:text-white/20 transition-colors"
                                        placeholder="username"
                                        value={friendInput}
                                        onChange={e => setFriendInput(e.target.value.toLowerCase())} // Force lowercase
                                        onKeyDown={e => e.key === 'Enter' && addFriend(friendInput)}
                                    />
                                </div>
                                <button 
                                    onClick={() => addFriend(friendInput)} 
                                    disabled={!friendInput}
                                    className="w-full bg-white hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
                                >
                                    Connect <ArrowRight size={16}/>
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* INVITE TAB */}
                    {activeTab === 'invite' && (
                        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                            <p className="text-xs text-white/60 text-center">Share this link to let others join you.</p>
                            <div className="bg-black/40 border border-white/10 rounded-xl p-1 flex items-center">
                                <div className="flex-1 px-3 py-2 text-[10px] text-white/50 truncate font-mono select-all">
                                    {getInviteLink()}
                                </div>
                                <button onClick={copyLink} className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors">
                                    {copied ? <Check size={14} className="text-green-400"/> : <Copy size={14}/>}
                                </button>
                            </div>
                            <button onClick={() => navigator.share?.({ url: getInviteLink() })} className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 py-2.5 rounded-xl text-xs font-bold text-white transition-all">
                                <LinkIcon size={14} /> Share Link
                            </button>
                        </motion.div>
                    )}
                </div>
                ) : (
                // CONNECTED STATE (Same as before)
                <div className="space-y-6">
                    <div className="text-center">
                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1 block">Combined Power</span>
                        <div className="text-4xl font-mono font-bold text-white tracking-tighter drop-shadow-lg">
                           {totalMinutes}<span className="text-lg text-white/40">m</span>
                        </div>
                    </div>
                    <div className="flex items-center justify-center gap-4 relative">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
                        <div className="flex flex-col items-center gap-2 z-10">
                             <div className="w-12 h-12 rounded-full bg-[#0a0a0a] border-2 border-indigo-500/30 flex items-center justify-center text-xs font-bold text-white">YOU</div>
                             <span className="text-xs font-mono text-white/60">{myMinutes}m</span>
                        </div>
                        <div className="flex flex-col items-center gap-2 z-10">
                             <div className={`w-12 h-12 rounded-full bg-[#0a0a0a] border-2 flex items-center justify-center text-xs font-bold text-white relative ${isPartnerActive ? 'border-green-500' : 'border-white/10'}`}>
                                {partner.email?.charAt(0).toUpperCase()}
                                {isPartnerActive && <span className="absolute -bottom-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span></span>}
                             </div>
                             <span className="text-xs font-mono text-white/60">{partnerMinutes}m</span>
                        </div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 flex items-center justify-between border border-white/5">
                        <div className="flex items-center gap-2 overflow-hidden">
                             <Activity size={14} className={isPartnerActive ? "text-green-400" : "text-white/20"} />
                             <span className="text-xs font-medium text-white/80 truncate">{partner.status || 'Offline'}</span>
                        </div>
                    </div>
                </div>
                )}
            </div>
            
            <div className="bg-black/40 p-2 text-center border-t border-white/5">
                 <p className="text-[9px] text-white/20 font-mono">@{myUsername}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}