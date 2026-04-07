import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/mobile-auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { ReportCategory, ReportStatus } from '@/lib/domain-enums'

const bodySchema = z.object({
  targetListingId: z.string().optional(),
  targetUserId: z.string().optional(),
  category: z.enum([
    ReportCategory.FAKE_PHOTO,
    ReportCategory.MISLEADING_PRICE,
    ReportCategory.SPAM,
    ReportCategory.SCAM,
    ReportCategory.OTHER,
  ]),
  details: z.string().max(2000).optional(),
})

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = bodySchema.parse(await req.json())
  if (!body.targetListingId && !body.targetUserId) {
    return NextResponse.json({ error: 'נדרש יעד לדיווח' }, { status: 400 })
  }

  const report = await prisma.report.create({
    data: {
      reporterId: user.id,
      targetListingId: body.targetListingId,
      targetUserId: body.targetUserId,
      category: body.category,
      details: body.details,
      status: ReportStatus.OPEN,
    },
  })

  return NextResponse.json({ data: report }, { status: 201 })
}
