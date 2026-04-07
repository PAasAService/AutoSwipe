import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/mobile-auth'
import { cloudinary } from '@/lib/cloudinary'

/**
 * POST /api/upload/sign
 *
 * Returns a Cloudinary signed upload parameter set valid for 60 seconds.
 * The browser then POSTs directly to Cloudinary using these params — the
 * API secret never leaves the server.
 *
 * Body: { folder?: string }
 */
export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const timestamp = Math.floor(Date.now() / 1000)
  const folder    = `autoswipe/listings/${user.id}`

  // Only sign the params we actually send in the XHR upload call
  const paramsToSign: Record<string, string | number> = {
    folder,
    timestamp,
    // upload_preset is NOT used here — we use signed uploads
  }

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET!,
  )

  return NextResponse.json({
    signature,
    timestamp,
    folder,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    apiKey:    process.env.CLOUDINARY_API_KEY!,
  })
}
