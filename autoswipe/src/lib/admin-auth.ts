import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/mobile-auth'
import { hasRole } from '@/lib/roles'

export async function requireAdmin(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user?.id) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) as const }
  }
  if (!hasRole(user.roles, 'ADMIN')) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) as const }
  }
  return { user }
}
