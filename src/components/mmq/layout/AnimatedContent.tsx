import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedContentProps {
  value: any;
  children: React.ReactNode;
  glowOnChange?: boolean;
  skipInitialAnimation?: boolean;
}

export function AnimatedContent({ 
  value, 
  children, 
  glowOnChange = false, 
  skipInitialAnimation = false 
}: AnimatedContentProps) {
  const [isGlowing, setIsGlowing] = useState(false);
  const prevValueRef = useRef(value);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current && skipInitialAnimation) {
      isInitialMount.current = false;
      return;
    }

    if (prevValueRef.current !== value && glowOnChange) {
      setIsGlowing(true);
      const timer = setTimeout(() => setIsGlowing(false), 1000);
      return () => clearTimeout(timer);
    }
    
    prevValueRef.current = value;
    isInitialMount.current = false;
  }, [value, glowOnChange, skipInitialAnimation]);

  return (
    <div
      className={cn(
        'transition-all duration-1000',
        isGlowing && 'animate-pulse bg-primary/10 rounded px-1'
      )}
    >
      {children}
    </div>
  );
}

