import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/mobile-auth'
import { deletePublicUploadFile } from '@/lib/listing-image-storage'

/**
 * DELETE /api/upload?path=/uploads/listings/pending/{userId}/...
 *
 * Removes a pending listing image before the listing is published.
 */
export async function DELETE(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const publicPath = new URL(req.url).searchParams.get('path')
  if (!publicPath) {
    return NextResponse.json({ error: 'Missing path' }, { status: 400 })
  }

  const ok = await deletePublicUploadFile(publicPath, user.id)
  if (!ok) {
    return NextResponse.json({ error: 'Forbidden or not found' }, { status: 403 })
  }

  return NextResponse.json({ ok: true })
}
