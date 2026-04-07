import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/mobile-auth'
import { cloudinary } from '@/lib/cloudinary'

/**
 * DELETE /api/upload?publicId=autoswipe/listings/...
 *
 * Best-effort deletion of a Cloudinary asset.  Called when the user removes
 * an image that has already been uploaded (before listing submission).
 *
 * Errors are swallowed — a failed cleanup must not block the UI.
 */
export async function DELETE(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const publicId = new URL(req.url).searchParams.get('publicId')
  if (!publicId) {
    return NextResponse.json({ error: 'Missing publicId' }, { status: 400 })
  }

  // Security: only allow deleting within the authenticated user's folder
  const expectedPrefix = `autoswipe/listings/${user.id}/`
  if (!publicId.startsWith(expectedPrefix)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    await cloudinary.uploader.destroy(publicId)
  } catch {
    // Best-effort — log but don't fail the request
    console.warn('[upload DELETE] cloudinary.destroy failed for', publicId)
  }

  return NextResponse.json({ ok: true })
}
