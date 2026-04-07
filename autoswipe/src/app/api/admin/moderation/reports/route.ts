import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { ReportStatus } from '@/lib/domain-enums'

// GET — open reports
export async function GET(req: NextRequest) {
  const gate = await requireAdmin(req)
  if ('error' in gate) return gate.error

  const reports = await prisma.report.findMany({
    where: { status: ReportStatus.OPEN },
    orderBy: { createdAt: 'asc' },
    take: 100,
    include: {
      reporter: { select: { id: true, name: true, email: true } },
      targetListing: {
        select: { id: true, brand: true, model: true, status: true },
      },
      targetUser: { select: { id: true, name: true, email: true } },
    },
  })

  return NextResponse.json({ data: reports })
}
