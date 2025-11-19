'use client'

import { useEffect, useState } from 'react'
import { MMQ } from './MMQ'

interface MMQWrapperProps {
  accountNumber?: number
}

export default function MMQWrapper({ accountNumber: propAccountNumber }: MMQWrapperProps) {
  const [accountNumber, setAccountNumber] = useState<number | null>(null)
  const [isReady, setIsReady] = useState(false)

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

  if (!isReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!accountNumber || isNaN(accountNumber)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
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
      <div className="min-h-screen bg-background flex items-center justify-center">
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
      showAccountOverride={true}
      darkMode={true}
      showCountdownTimers={false}
    />
  )
}
