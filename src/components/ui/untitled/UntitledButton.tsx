import React from 'react';
import { cn } from '@/lib/utils';
import { Button as ShadcnButton, ButtonProps as ShadcnButtonProps } from '@/components/ui/button';

interface UntitledButtonProps extends Omit<ShadcnButtonProps, 'variant' | 'size'> {
  /** Untitled UI size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Untitled UI color variant */
  color?: 'primary' | 'secondary' | 'tertiary' | 'link-gray' | 'link-color';
  /** Icon component to show before the text */
  iconLeading?: React.ComponentType<{ className?: string }>;
  /** Icon component to show after the text */
  iconTrailing?: React.ComponentType<{ className?: string }>;
  /** Shows a loading spinner and disables the button */
  isLoading?: boolean;
}

/**
 * Untitled UI styled button component that adapts shadcn button
 * with Untitled UI design patterns
 */
export const UntitledButton = React.forwardRef<HTMLButtonElement, UntitledButtonProps>(
  ({ 
    size = 'md', 
    color = 'primary', 
    iconLeading: IconLeading,
    iconTrailing: IconTrailing,
    isLoading,
    className,
    children,
    disabled,
    ...props 
  }, ref) => {
    // Map Untitled UI sizes to shadcn sizes
    const sizeMap = {
      sm: 'sm',
      md: 'default',
      lg: 'lg',
      xl: 'lg'
    } as const;

    // Map Untitled UI colors to shadcn variants with custom classes
    const colorClassMap = {
      primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      tertiary: 'bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground',
      'link-gray': 'text-muted-foreground hover:text-foreground underline-offset-4 hover:underline bg-transparent',
      'link-color': 'text-primary hover:text-primary/80 underline-offset-4 hover:underline bg-transparent'
    };

    const sizeClasses = {
      sm: 'h-8 px-3 text-sm gap-1',
      md: 'h-9 px-3.5 text-sm gap-1',
      lg: 'h-10 px-4 text-base gap-1.5',
      xl: 'h-11 px-4.5 text-base gap-1.5'
    };

    const isIconOnly = (IconLeading || IconTrailing) && !children;

    return (
      <ShadcnButton
        ref={ref}
        variant={color === 'primary' ? 'default' : color === 'secondary' ? 'secondary' : 'ghost'}
        size={sizeMap[size]}
        disabled={disabled || isLoading}
        className={cn(
          'relative inline-flex items-center justify-center whitespace-nowrap',
          'transition-all duration-100 ease-linear',
          'focus-visible:outline-2 focus-visible:outline-offset-2',
          sizeClasses[size],
          colorClassMap[color],
          isIconOnly && 'p-2 w-8 h-8',
          isLoading && 'pointer-events-none',
          className
        )}
        {...props}
      >
        {isLoading && (
          <svg
            className="absolute h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {IconLeading && !isLoading && (
          <IconLeading className={cn('size-4 shrink-0', isIconOnly && 'size-5')} />
        )}
        {children && (
          <span className={cn(isLoading && 'invisible')}>{children}</span>
        )}
        {IconTrailing && !isLoading && (
          <IconTrailing className={cn('size-4 shrink-0', isIconOnly && 'size-5')} />
        )}
      </ShadcnButton>
    );
  }
);

UntitledButton.displayName = 'UntitledButton';

