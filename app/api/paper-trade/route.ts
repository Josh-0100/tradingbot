import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { executePaperTrade } from '@/lib/paper-trading/execute'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { ticker, direction, quantity, signalId } = await req.json()
  if (!ticker || !direction || !quantity) {
    return NextResponse.json({ error: 'ticker, direction, quantity required' }, { status: 400 })
  }

  try {
    const result = await executePaperTrade({
      userId: user.id, ticker, direction, quantity, signalId,
    })
    return NextResponse.json({ success: true, ...result })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
