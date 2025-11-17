import { AlertTriangle, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface WarningToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
}

export function WarningToast({ message, onClose, duration = 5000 }: WarningToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className={cn(
      "fixed top-4 right-4 z-50 transition-all duration-300",
      isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full"
    )}>
      <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg p-4 shadow-lg max-w-sm">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-orange-800 dark:text-orange-200">{message}</p>
          </div>
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}
            className="text-orange-400 hover:text-orange-600 dark:text-orange-500 dark:hover:text-orange-300 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

