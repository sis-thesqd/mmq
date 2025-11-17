import { CheckCircle, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface SuccessToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
}

export function SuccessToast({ message, onClose, duration = 5000 }: SuccessToastProps) {
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
      <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4 shadow-lg max-w-sm">
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-green-800 dark:text-green-200">{message}</p>
          </div>
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}
            className="text-green-400 hover:text-green-600 dark:text-green-500 dark:hover:text-green-300 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

