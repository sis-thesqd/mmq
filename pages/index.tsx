import dynamic from 'next/dynamic'

// Dynamically import the entire page content with no SSR
const MMQPageContent = dynamic(() => import('@/components/mmq/MMQPageContent'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-muted-foreground">Loading...</div>
    </div>
  ),
})

export default function MMQPage() {
  return <MMQPageContent />
}
