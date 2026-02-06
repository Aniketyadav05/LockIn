import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';

// This hook behaves exactly like useLocalStorage, 
// BUT it automatically saves data specific to the CURRENT USER.
export default function useUserLocalStorage<T>(key: string, initialValue: T) {
  const { currentUser } = useUser();
  
  // Create a unique key for this user: "user-123-theme"
  const userKey = `user-${currentUser.id}-${key}`;

  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(userKey);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  // Whenever the User ID changes (switch profile), reload the data for that user
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(userKey);
      setStoredValue(item ? JSON.parse(item) : initialValue);
    } catch (error) {
      setStoredValue(initialValue);
    }
  }, [userKey]); // 👈 Re-run when userKey changes

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(userKey, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue] as const;
}