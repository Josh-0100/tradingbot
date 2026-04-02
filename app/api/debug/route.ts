import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  const allCookies = req.cookies.getAll()
  return NextResponse.json({
    user: user ? { id: user.id, email: user.email } : null,
    error: error?.message ?? null,
    cookieCount: allCookies.length,
    cookieNames: allCookies.map(c => c.name),
  })
}
