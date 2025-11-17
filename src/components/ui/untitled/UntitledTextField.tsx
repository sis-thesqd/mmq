import React from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface UntitledTextFieldProps extends Omit<React.ComponentProps<'input'>, 'size'> {
  /** Label text displayed above the input */
  label?: string;
  /** Helper text displayed below the input */
  hint?: string;
  /** Error message displayed below the input */
  error?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Whether the field is required */
  required?: boolean;
  /** Leading icon component */
  iconLeading?: React.ComponentType<{ className?: string }>;
  /** Trailing icon component */
  iconTrailing?: React.ComponentType<{ className?: string }>;
}

/**
 * Untitled UI styled text field component
 * Compound component pattern with label, input, hint, and error states
 */
export const UntitledTextField = React.forwardRef<HTMLInputElement, UntitledTextFieldProps>(
  ({
    label,
    hint,
    error,
    size = 'md',
    required = false,
    iconLeading: IconLeading,
    iconTrailing: IconTrailing,
    className,
    id,
    disabled,
    ...props
  }, ref) => {
    const fieldId = id || React.useId();
    const hasError = !!error;
    const isDisabled = disabled;

    const sizeClasses = {
      sm: {
        input: 'h-8 px-2.5 text-sm',
        label: 'text-xs mb-1',
        hint: 'text-xs mt-1',
      },
      md: {
        input: 'h-9 px-3 text-sm',
        label: 'text-sm mb-1.5',
        hint: 'text-xs mt-1.5',
      },
      lg: {
        input: 'h-10 px-3.5 text-base',
        label: 'text-base mb-2',
        hint: 'text-sm mt-2',
      },
    };

    const inputClasses = cn(
      'w-full rounded-lg border transition-all duration-100',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0',
      'disabled:cursor-not-allowed disabled:opacity-50',
      sizeClasses[size].input,
      // Icon padding adjustments
      IconLeading && 'pl-9',
      IconTrailing && 'pr-9',
      // Error state
      hasError
        ? 'border-red-400 bg-red-50/50 focus-visible:ring-red-500 focus-visible:border-red-500'
        : 'border-input bg-background focus-visible:ring-ring focus-visible:border-ring',
      // Disabled state
      isDisabled && 'bg-muted/50',
      className
    );

    return (
      <div className="w-full">
        {label && (
          <div className="flex items-start gap-1 mb-1">
            <Label
              htmlFor={fieldId}
              className={cn(
                sizeClasses[size].label,
                'font-medium',
                hasError && 'text-red-600',
                isDisabled && 'text-muted-foreground'
              )}
            >
              {label}
            </Label>
            {required && <span className="text-red-500 text-sm">*</span>}
          </div>
        )}

        <div className="relative">
          {IconLeading && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <IconLeading className={cn('h-4 w-4', hasError ? 'text-red-500' : 'text-muted-foreground')} />
            </div>
          )}
          <Input
            ref={ref}
            id={fieldId}
            disabled={isDisabled}
            className={inputClasses}
            aria-invalid={hasError}
            aria-describedby={
              hasError ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined
            }
            {...props}
          />
          {IconTrailing && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <IconTrailing className={cn('h-4 w-4', hasError ? 'text-red-500' : 'text-muted-foreground')} />
            </div>
          )}
        </div>

        {hasError && (
          <p
            id={`${fieldId}-error`}
            className={cn(sizeClasses[size].hint, 'text-red-500 mt-1.5')}
            role="alert"
          >
            {error}
          </p>
        )}

        {hint && !hasError && (
          <p
            id={`${fieldId}-hint`}
            className={cn(sizeClasses[size].hint, 'text-muted-foreground mt-1.5')}
          >
            {hint}
          </p>
        )}
      </div>
    );
  }
);

UntitledTextField.displayName = 'UntitledTextField';

