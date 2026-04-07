import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/mobile-auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const prefsSchema = z.object({
  budgetMin: z.number().int().min(0).max(10_000_000).optional(),
  budgetMax: z.number().int().min(1).max(10_000_000),
  preferredBrands: z.array(z.string().max(60)).max(20),
  preferredModels: z.array(z.string().max(60)).max(30),
  fuelPreferences: z.array(z.enum(['GASOLINE', 'DIESEL', 'HYBRID', 'ELECTRIC', 'PLUG_IN_HYBRID'])).max(5),
  vehicleTypes: z.array(z.enum(['SEDAN', 'SUV', 'HATCHBACK', 'COUPE', 'CONVERTIBLE', 'MINIVAN', 'PICKUP', 'WAGON', 'CROSSOVER'])).max(9),
  location: z.string().max(100).optional().default(''),
  searchRadius: z.number().int().min(5).max(300).default(50),
  ownershipYears: z.number().int().min(1).max(10).default(3),
  yearFrom: z.number().int().min(1990).max(2030).optional(),
  yearTo: z.number().int().min(1990).max(2030).optional(),
  mileageMin: z.number().int().min(0).optional(),
  mileageMax: z.number().int().min(0).optional(),
  roles: z.array(z.string().max(20)).max(5).optional(),
})

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const prefs = await prisma.buyerPreferences.findUnique({
    where: { userId: user.id },
  })

  return NextResponse.json({ data: prefs })
}

export async function PUT(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const data = prefsSchema.parse(body)

  // The DB stores array fields as JSON strings (SQLite has no native array type)
  const dbData = {
    budgetMin: data.budgetMin,
    budgetMax: data.budgetMax,
    preferredBrands: JSON.stringify(data.preferredBrands),
    preferredModels: JSON.stringify(data.preferredModels),
    fuelPreferences: JSON.stringify(data.fuelPreferences),
    vehicleTypes: JSON.stringify(data.vehicleTypes),
    location: data.location ?? '',
    searchRadius: data.searchRadius,
    ownershipYears: data.ownershipYears,
    yearFrom: data.yearFrom ?? null,
    yearTo: data.yearTo ?? null,
    mileageMin: data.mileageMin ?? null,
    mileageMax: data.mileageMax ?? null,
  }

  const prefs = await prisma.buyerPreferences.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...dbData },
    update: dbData,
  })

  // Build user update data
  const userUpdateData: { isOnboarded: boolean; roles?: string } = { isOnboarded: true }
  if (data.roles && data.roles.length > 0) {
    userUpdateData.roles = JSON.stringify(data.roles)
  }

  await prisma.user.update({
    where: { id: user.id },
    data: userUpdateData,
  })

  return NextResponse.json({ data: prefs })
}
