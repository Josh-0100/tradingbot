import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/',           label: 'Dashboard', icon: '◈' },
  { href: '/analysis',   label: 'Analysis',  icon: '⟁' },
  { href: '/portfolio',  label: 'Portfolio', icon: '▣' },
  { href: '/strategies', label: 'Strategy',  icon: '◎' },
  { href: '/settings',   label: 'Settings',  icon: '⊙' },
]

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Top nav — desktop only */}
      <nav className="hidden md:flex bg-gray-900 border-b border-gray-800 px-6 py-3 items-center gap-1 shrink-0">
        <span className="font-bold text-blue-400 mr-4 text-sm tracking-tight">TradingBot</span>
        {NAV_ITEMS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="text-sm text-gray-400 hover:text-white hover:bg-gray-800 px-3 py-1.5 rounded-md transition-colors"
          >
            {label}
          </Link>
        ))}
      </nav>

      {/* Page content — leaves room for mobile bottom bar */}
      <main className="flex-1 overflow-auto pb-16 md:pb-0">
        {children}
      </main>

      {/* Bottom tab bar — mobile only */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-gray-900/95 backdrop-blur border-t border-gray-800 flex z-50"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {NAV_ITEMS.map(({ href, label, icon }) => (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center gap-0.5 py-2 text-gray-500 hover:text-blue-400 transition-colors"
          >
            <span className="text-lg leading-none">{icon}</span>
            <span className="text-[10px] font-semibold tracking-wide">{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
