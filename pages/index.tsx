import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Force server-side rendering (not static generation) but don't SSR the MMQ component
export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} }
}

// Dynamically import MMQ with no SSR to avoid server-side rendering issues
const MMQ = dynamic(() => import('@/components/mmq/MMQ').then(mod => ({ default: mod.MMQ })), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-muted-foreground">Loading...</div>
    </div>
  ),
})

export default function MMQPage() {
  const router = useRouter()
  const [accountNumber, setAccountNumber] = useState<number | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (router.isReady) {
      const accountNumberParam = router.query.accountNumber as string | undefined
      setAccountNumber(accountNumberParam ? parseInt(accountNumberParam, 10) : 306)
      setIsReady(true)
    }
  }, [router.isReady, router.query.accountNumber])

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
