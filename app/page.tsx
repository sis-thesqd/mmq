import { redirect } from 'next/navigation'

export default function Home() {
  redirect('/demo?accountNumber=2800')
}

