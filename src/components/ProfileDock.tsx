import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, User } from 'lucide-react';
import { useUser } from '../context/UserContext';

export default function ProfileDock() {
  const { users, currentUser, addUser, switchUser, deleteUser } = useUser();
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');

  const handleAdd = () => {
    if(newName.trim()) {
      addUser(newName);
      setNewName('');
      setIsAdding(false);
    }
  };

  return (
    <div className="fixed top-6 right-20 z-50 flex flex-col items-end gap-2">
      <div className="flex items-center gap-2 bg-black/40 backdrop-blur-xl p-1.5 rounded-full border border-white/10 shadow-xl">
        
        {/* User List */}
        {users.map((user) => (
          <button
            key={user.id}
            onClick={() => switchUser(user.id)}
            className={`relative group w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2 ${
              currentUser.id === user.id 
                ? `border-white scale-110 ${user.color} text-white` 
                : 'border-transparent bg-white/10 text-white/50 hover:bg-white/20'
            }`}
            title={user.name}
          >
            {user.avatar}
            
            {/* Delete Button (Hover) */}
            {users.length > 1 && currentUser.id !== user.id && (
               <div 
                 onClick={(e) => { e.stopPropagation(); deleteUser(user.id); }}
                 className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
               >
                 <X size={8} className="text-white"/>
               </div>
            )}
          </button>
        ))}

        {/* Add Button */}
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 transition-colors"
        >
          <Plus size={14} className={isAdding ? 'rotate-45 transition-transform' : 'transition-transform'}/>
        </button>
      </div>

      {/* Add User Input Dropdown */}
      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-[#121212] border border-white/10 p-2 rounded-xl flex gap-2 shadow-2xl"
          >
            <input 
              autoFocus
              className="bg-white/5 rounded-lg px-2 py-1 text-xs text-white outline-none w-24"
              placeholder="Name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
            <button onClick={handleAdd} className="bg-white text-black text-[10px] font-bold px-2 rounded-lg">Add</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}