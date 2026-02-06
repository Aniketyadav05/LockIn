export const formatTime = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (num: number) => num.toString().padStart(2, '0');
  
  // Minimalist format: H:MM:SS or MM:SS depending on duration
  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
};

export const playNotificationSound = () => {
  // Simple beep for completion (Bonus feature)
  const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
  audio.play().catch(e => console.log("Audio play failed interaction needed", e));
};