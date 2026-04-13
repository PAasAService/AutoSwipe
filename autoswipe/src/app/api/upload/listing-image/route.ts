import path from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import fs from 'fs/promises'
import { getAuthUser } from '@/lib/mobile-auth'
import {
  extFromMime,
  pendingDirForUser,
  pendingPublicPrefix,
} from '@/lib/listing-image-storage'

const MAX_BYTES = 10 * 1024 * 1024

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'Missing file' }, { status: 400 })
  }

  const mime = file.type || 'application/octet-stream'
  if (!mime.startsWith('image/')) {
    return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Image too large (max 10MB)' }, { status: 400 })
  }

  const ext = extFromMime(mime)
  const id = randomUUID()
  const dir = pendingDirForUser(user.id)
  await fs.mkdir(dir, { recursive: true })
  const filename = `${id}${ext}`
  const absPath = path.join(dir, filename)
  const buffer = Buffer.from(await file.arrayBuffer())
  await fs.writeFile(absPath, buffer)

  const publicPath = `${pendingPublicPrefix(user.id)}/${filename}`
  return NextResponse.json({ path: publicPath })
}
