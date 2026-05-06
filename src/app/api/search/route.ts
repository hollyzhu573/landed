import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/src/lib/supabase/server'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (q.length < 1) return NextResponse.json({ jobs: [], contacts: [] })

  const supabase = await createClient()
  const p = `%${q}%`

  const [{ data: jobs }, { data: contacts }] = await Promise.all([
    supabase
      .from('jobs')
      .select('id, company, role, status')
      .or(`company.ilike.${p},role.ilike.${p}`)
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('contacts')
      .select('id, name, company, role, status')
      .or(`name.ilike.${p},company.ilike.${p},role.ilike.${p}`)
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  return NextResponse.json({ jobs: jobs ?? [], contacts: contacts ?? [] })
}
