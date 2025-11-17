import React, { createContext, useContext, useState, useEffect } from 'react';

interface TimerContextType {
  countdown: string | null;
  isRefreshing: boolean;
}

const TimerContext = createContext<TimerContextType>({
  countdown: null,
  isRefreshing: false,
});

interface TimerProviderProps {
  children: React.ReactNode;
  onRefresh: () => void;
  activeTaskCount: number;
  cap: number;
}

export function TimerProvider({ children, onRefresh, activeTaskCount, cap }: TimerProviderProps) {
  const [countdown, setCountdown] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Only show countdown if there are available slots
    if (cap === 999 || activeTaskCount >= cap) {
      setCountdown(null);
      return;
    }

    // Start a 5-minute countdown
    let timeLeft = 5 * 60; // 5 minutes in seconds
    
    const timer = setInterval(() => {
      if (timeLeft <= 0) {
        setIsRefreshing(true);
        onRefresh();
        setTimeout(() => {
          setIsRefreshing(false);
          timeLeft = 5 * 60; // Reset timer
        }, 2000);
      } else {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        setCountdown(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        timeLeft--;
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [activeTaskCount, cap, onRefresh]);

  return (
    <TimerContext.Provider value={{ countdown, isRefreshing }}>
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
}

