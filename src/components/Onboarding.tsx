import { useState } from 'react';
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { User, AtSign, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  email: string;
  onComplete: () => void;
}

export default function Onboarding({ email, onComplete }: Props) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const register = useMutation(api.study.registerUser);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await register({ email, name, username });
      if (result.success) {
        onComplete();
      } else {
        setError(result.message || "Error registering");
      }
    } catch (err) {
      setError("Failed to connect. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 shadow-2xl"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome</h1>
          <p className="text-white/50 text-sm">Create your profile to start syncing.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-white/60 uppercase ml-1">Display Name</label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-white/30" size={18} />
              <input 
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:border-indigo-500 outline-none transition-all"
                placeholder="e.g. Alex"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-white/60 uppercase ml-1">Unique Username</label>
            <div className="relative">
              <AtSign className="absolute left-3 top-3 text-white/30" size={18} />
              <input 
                required
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))} // Force lowercase, no spaces
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:border-indigo-500 outline-none transition-all"
                placeholder="cool_coder"
              />
            </div>
            <p className="text-[10px] text-white/30 ml-1">This will be your invite link ID.</p>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs text-center font-bold">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading || !name || !username}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl mt-4 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <>Get Started <ArrowRight size={20} /></>}
          </button>
        </form>
        
        <div className="mt-6 text-center">
            <p className="text-[10px] text-white/20 font-mono">{email}</p>
        </div>
      </motion.div>
    </div>
  );
}