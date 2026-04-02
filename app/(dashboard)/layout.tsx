import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center gap-6">
        <span className="font-bold text-blue-400">TradingBot</span>
        {[
          ['/', 'Dashboard'],
          ['/analysis', 'Analysis'],
          ['/portfolio', 'Portfolio'],
          ['/strategies', 'Strategies'],
          ['/settings', 'Settings'],
        ].map(([href, label]) => (
          <Link key={href} href={href} className="text-sm text-gray-300 hover:text-white">
            {label}
          </Link>
        ))}
      </nav>
      <main>{children}</main>
    </div>
  )
}
