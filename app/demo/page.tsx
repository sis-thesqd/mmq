'use client'

import { useSearchParams } from 'next/navigation'
import { MMQ } from '@/components/mmq/MMQ'

export default function DemoPage() {
  const searchParams = useSearchParams()
  const accountNumberParam = searchParams.get('accountNumber')
  const accountNumber = accountNumberParam ? parseInt(accountNumberParam, 10) : null

  if (!accountNumber || isNaN(accountNumber)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md mx-auto p-6 bg-card border border-border rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-foreground">
            MMQ Component Demo
          </h2>
          <p className="text-muted-foreground mb-4">
            Please provide an account number in the URL parameter.
          </p>
          <p className="text-sm text-muted-foreground">
            Example: <span className="bg-muted px-2 py-1 rounded font-mono">/demo?accountNumber=12345</span>
          </p>
        </div>
      </div>
    )
  }

  return (
      <MMQ
        accountNumber={accountNumber}
        showAccountOverride={true}
        darkMode={true}
        showCountdownTimers={false}
      />
  )
}

