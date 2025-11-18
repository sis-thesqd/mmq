'use client'

import { useRouter } from 'next/router'
import { MMQ } from '@/components/mmq/MMQ'

export default function MMQPage() {
  const router = useRouter()
  const accountNumberParam = router.query.accountNumber as string | undefined
  const accountNumber = accountNumberParam ? parseInt(accountNumberParam, 10) : 306

  // Get Supabase credentials from environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL_READ_ONLY || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

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
      showAccountOverride={true}
      darkMode={true}
      showCountdownTimers={false}
    />
  )
}

