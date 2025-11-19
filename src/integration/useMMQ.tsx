/**
 * useMMQ Hook - Simplest way to integrate MMQ in any React app
 *
 * @example
 * ```tsx
 * import { useMMQ } from '@sis-thesqd/mmq'
 *
 * function MyApp() {
 *   const MMQ = useMMQ({ accountNumber: 2800 })
 *   return <MMQ />
 * }
 * ```
 */

import { lazy, Suspense, ComponentType } from 'react';

export interface UseMMQOptions {
  /** Account number to display queue for */
  accountNumber?: number;
  /** Remote URL (defaults to production) */
  remoteUrl?: string;
  /** Loading fallback component */
  fallback?: React.ReactNode;
  /** Auto-detect account from URL params */
  autoDetectAccount?: boolean;
}

type MMQComponent = ComponentType<{ accountNumber?: number }>;

/**
 * Hook that returns a ready-to-use MMQ component
 */
export function useMMQ(options: UseMMQOptions = {}) {
  const {
    accountNumber,
    fallback = <div>Loading MMQ...</div>,
    autoDetectAccount = true,
  } = options;

  // Lazy load the remote component
  const RemoteMMQ = lazy(() => import('mmq/MMQDemo')) as any as MMQComponent;

  // Auto-detect account from URL if enabled
  const resolvedAccount =
    accountNumber ??
    (autoDetectAccount && typeof window !== 'undefined'
      ? parseInt(new URLSearchParams(window.location.search).get('accountNumber') || '2800', 10)
      : 2800);

  // Return wrapped component
  return function MMQContainer() {
    return (
      <Suspense fallback={fallback}>
        <RemoteMMQ accountNumber={resolvedAccount} />
      </Suspense>
    );
  };
}
