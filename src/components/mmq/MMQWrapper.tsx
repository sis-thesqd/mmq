'use client'

import { useEffect, useState } from 'react'
import { MMQ } from './MMQ'
import { MMQSkeleton } from './layout/MMQSkeleton'
import { MMQErrorBoundary } from './layout/MMQErrorBoundary'
import { loadMMQStyles } from '@/integration/loadCSS'

interface MMQWrapperProps {
  accountNumber?: number
  showCountdownTimers?: boolean
  showAccountOverride?: boolean
}

const CSS_LOAD_TIMEOUT = 10000 // 10 seconds

function MMQWrapperContent({
  accountNumber: propAccountNumber,
  showCountdownTimers = false,
  showAccountOverride = true
}: MMQWrapperProps) {
  const [accountNumber, setAccountNumber] = useState<number | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [cssLoaded, setCssLoaded] = useState(false)
  const [cssError, setCssError] = useState<string | null>(null)

  // Load CSS automatically when component mounts with timeout
  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const loadWithTimeout = async () => {
      try {
        // Set timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error('CSS loading timed out after 10 seconds. Please check your network connection and try again.'))
          }, CSS_LOAD_TIMEOUT)
        })

        // Race between loading and timeout
        await Promise.race([loadMMQStyles(), timeoutPromise])

        clearTimeout(timeoutId)
        setCssLoaded(true)
      } catch (error) {
        clearTimeout(timeoutId)
        const errorMessage = error instanceof Error ? error.message : 'Failed to load styles'
        console.error('[MMQ] CSS loading error:', errorMessage)
        setCssError(errorMessage)
      }
    }

    loadWithTimeout()

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [])

  useEffect(() => {
    // Priority: 1. Prop, 2. URL parameter, 3. Default
    let finalAccountNumber: number | null = null

    if (propAccountNumber !== undefined && propAccountNumber !== null) {
      finalAccountNumber = propAccountNumber
    } else if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const accountNumberParam = params.get('accountNumber')
      if (accountNumberParam) {
        finalAccountNumber = parseInt(accountNumberParam, 10)
      }
    }

    // Set default if nothing found
    if (!finalAccountNumber) {
      finalAccountNumber = 306
    }

    setAccountNumber(finalAccountNumber)
    setIsReady(true)
  }, [propAccountNumber])

  // Get Supabase credentials from environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL_READ_ONLY || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  // Show error if CSS failed to load
  if (cssError) {
    return (
      <div
        className="min-h-screen bg-background flex items-center justify-center p-6"
        role="alert"
        aria-live="assertive"
        data-mmq-root
      >
        <div className="max-w-md mx-auto bg-card border border-destructive/50 rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <span className="text-destructive text-xl">⚠</span>
            </div>
            <h2 className="text-xl font-semibold text-foreground">
              Failed to Load Styles
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">{cssError}</p>
          <button
            onClick={() => window.location.reload()}
            aria-label="Retry loading MMQ styles by reloading the page"
            className="w-full h-10 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!cssLoaded || !isReady) {
    return <MMQSkeleton />
  }

  if (!accountNumber || isNaN(accountNumber)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" data-mmq-root>
        <div className="max-w-md mx-auto p-6 bg-card border border-border rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-foreground">
            MMQ Component
          </h2>
          <p className="text-muted-foreground mb-4">
            Please provide an account number as a prop or in the URL parameter.
          </p>
          <p className="text-sm text-muted-foreground">
            Example: <span className="bg-muted px-2 py-1 rounded font-mono">/?accountNumber=12345</span>
          </p>
        </div>
      </div>
    )
  }

  if (!supabaseUrl || !supabaseKey) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" data-mmq-root>
        <div className="max-w-md mx-auto p-6 bg-card border border-border rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-foreground">
            Configuration Error
          </h2>
          <p className="text-muted-foreground">
            Missing Supabase credentials. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment variables.
          </p>
        </div>
      </div>
    )
  }

  return (
    <MMQ
      accountNumber={accountNumber}
      supabaseUrl={supabaseUrl}
      supabaseKey={supabaseKey}
      dataEndpoint="/api/mmq-queue-data"
      showAccountOverride={showAccountOverride}
      showCountdownTimers={showCountdownTimers}
    />
  )
}

/**
 * MMQWrapper with Error Boundary
 *
 * Wraps the MMQ component with an error boundary to prevent errors from
 * crashing the consuming application. Any errors will be caught and displayed
 * with a user-friendly fallback UI.
 */
export default function MMQWrapper(props: MMQWrapperProps) {
  return (
    <MMQErrorBoundary>
      <MMQWrapperContent {...props} />
    </MMQErrorBoundary>
  )
}
