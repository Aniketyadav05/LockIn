import { createContext, useContext, useState, useEffect } from 'react';
import type { UserProfile } from '../types';
import type {ReactNode} from "react";

const DEFAULT_USERS: UserProfile[] = [
  { id: 'default', name: 'Main', avatar: '👤', color: 'bg-indigo-500' },
];

interface UserContextType {
  currentUser: UserProfile;
  users: UserProfile[];
  addUser: (name: string) => void;
  switchUser: (id: string) => void;
  deleteUser: (id: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  // Load users from REAL localStorage (global, not user-scoped)
  const [users, setUsers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('global-users');
    return saved ? JSON.parse(saved) : DEFAULT_USERS;
  });

  const [activeId, setActiveId] = useState<string>(() => {
    return localStorage.getItem('global-active-user') || 'default';
  });

  const currentUser = users.find(u => u.id === activeId) || users[0];

  useEffect(() => {
    localStorage.setItem('global-users', JSON.stringify(users));
    localStorage.setItem('global-active-user', activeId);
  }, [users, activeId]);

  const addUser = (name: string) => {
    const colors = ['bg-pink-500', 'bg-cyan-500', 'bg-emerald-500', 'bg-orange-500', 'bg-purple-500'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const newUser: UserProfile = {
      id: Date.now().toString(),
      name,
      avatar: name[0].toUpperCase(),
      color: randomColor
    };
    setUsers([...users, newUser]);
    setActiveId(newUser.id); // Auto switch
  };

  const switchUser = (id: string) => setActiveId(id);

  const deleteUser = (id: string) => {
    if (users.length <= 1) return;
    const newUsers = users.filter(u => u.id !== id);
    setUsers(newUsers);
    if (activeId === id) setActiveId(newUsers[0].id);
  };

  return (
    <UserContext.Provider value={{ currentUser, users, addUser, switchUser, deleteUser }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within UserProvider');
  return context;
};