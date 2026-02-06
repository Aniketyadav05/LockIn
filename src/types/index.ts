export type TimerType = 'timer' | 'stopwatch';

export interface Session {
  id: string;
  type: TimerType;
  title: string;
  duration: number;
  createdAt: string;
}

export interface ThemeConfig {
  type: 'solid' | 'gradient' | 'image' | 'video';
  value: string;
}

export type TrackCategory = 'all' | 'lofi' | 'ambient' | 'instrumental' | 'focus' | 'coding';

export interface Track {
  name: string;
  url: string;
  category: TrackCategory;
}

// 👇 ADD THIS SECTION
export interface UserProfile {
  id: string;
  name: string;
  avatar: string; 
  color: string;
}