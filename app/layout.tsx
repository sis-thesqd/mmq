import type { Metadata } from 'next'
import '@/index.css'

export const metadata: Metadata = {
  title: 'MMQ Modular',
  description: 'A reusable React component for managing task queues with drag-and-drop functionality',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

