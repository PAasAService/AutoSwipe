import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/mobile-auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { calculateCostBreakdown } from '@/lib/utils/cost-calculator'
import { classifyDeal, computePriceVsMarket, estimateMarketPrice } from '@/lib/utils/price-intelligence'
import { syncListingToMarketData } from '@/lib/valuation/market-collector'
import { isPendingPathForUser, movePendingToListing } from '@/lib/listing-image-storage'

const createSchema = z.object({
  brand: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(2000).max(new Date().getFullYear() + 1),
  mileage: z.number().int().min(0),
  price: z.number().int().min(1000),
  location: z.string().min(1),
  fuelType: z.enum(['GASOLINE', 'DIESEL', 'HYBRID', 'ELECTRIC', 'PLUG_IN_HYBRID']),
  fuelConsumption: z.number().min(0).max(30),
  vehicleType: z.enum(['SEDAN', 'SUV', 'HATCHBACK', 'COUPE', 'CONVERTIBLE', 'MINIVAN', 'PICKUP', 'WAGON', 'CROSSOVER']),
  transmission: z.enum(['AUTOMATIC', 'MANUAL']).default('AUTOMATIC'),
  engineSize: z.number().optional(),
  color: z.string().optional(),
  doors: z.number().int().min(2).max(7).optional(),
  seats: z.number().int().min(2).max(9).optional(),
  insuranceEstimate: z.number().int().min(0).max(100_000),
  maintenanceEstimate: z.number().int().min(0).max(100_000),
  depreciationRate: z.number().min(0).max(1),
  description:   z.string().max(2000).optional(),
  images:        z.array(z.object({ path: z.string().min(8) })).min(1).max(6),
  plateNumber:   z.string().max(20).optional(),
  isGovVerified: z.boolean().optional().default(false),
})

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = createSchema.parse(body)

    for (const img of data.images) {
      if (!isPendingPathForUser(img.path, user.id)) {
        return NextResponse.json(
          { error: 'נתיב תמונה לא תקין — העלה מחדש' },
          { status: 400 },
        )
      }
    }

    // Compute market data
    const marketAvg = estimateMarketPrice(data.brand, data.model, data.year)
    const priceVsMarket = computePriceVsMarket(data.price, marketAvg)
    const dealTag = classifyDeal(data.price, marketAvg, true)

    // Compute monthly TCO
    const costBreakdown = calculateCostBreakdown(data as any)

    const listing = await prisma.carListing.create({
      data: {
        sellerId: user.id,
        brand: data.brand,
        model: data.model,
        year: data.year,
        mileage: data.mileage,
        price: data.price,
        location: data.location,
        fuelType: data.fuelType,
        fuelConsumption: data.fuelConsumption,
        vehicleType: data.vehicleType,
        transmission: data.transmission,
        engineSize: data.engineSize,
        color: data.color,
        doors: data.doors,
        seats: data.seats,
        insuranceEstimate: data.insuranceEstimate,
        maintenanceEstimate: data.maintenanceEstimate,
        depreciationRate: data.depreciationRate,
        description:   data.description,
        plateNumber:   data.plateNumber,
        isGovVerified: data.isGovVerified ?? false,
        govVerifiedAt: data.isGovVerified ? new Date() : undefined,
        marketAvgPrice: marketAvg,
        priceVsMarket,
        dealTag: dealTag ?? undefined,
        monthlyCost: costBreakdown.monthly,
        publishedAt: new Date(),
      },
    })

    try {
      const rows = await Promise.all(
        data.images.map((img, i) => movePendingToListing(img.path, listing.id, i)),
      )
      await prisma.listingImage.createMany({
        data: rows.map((publicPath, i) => ({
          listingId: listing.id,
          path: publicPath,
          order: i,
          isPrimary: i === 0,
        })),
      })
    } catch (e) {
      await prisma.carListing.delete({ where: { id: listing.id } }).catch(() => {})
      console.error('[listings POST] image move', e)
      return NextResponse.json(
        { error: 'שמירת תמונות נכשלה — נסה שוב' },
        { status: 500 },
      )
    }

    const listingWithImages = await prisma.carListing.findUniqueOrThrow({
      where: { id: listing.id },
      include: {
        images: { orderBy: { order: 'asc' } },
        seller: { select: { id: true, name: true, avatarUrl: true } },
      },
    })

    // Non-blocking: sync new listing to market data table for valuation engine
    syncListingToMarketData(listingWithImages.id).catch(() => {})

    return NextResponse.json({ data: listingWithImages }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    }
    console.error('[listings POST]', err)
    return NextResponse.json({ error: 'שגיאה פנימית' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const page  = Math.min(Math.max(0, parseInt(searchParams.get('page')  ?? '0')),  500)
  const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') ?? '20')), 50)
  const brand = searchParams.get('brand')
  const location = searchParams.get('location')
  const minPrice = searchParams.get('minPrice')
  const maxPrice = searchParams.get('maxPrice')
  const sellerId = searchParams.get('sellerId')

  const listings = await prisma.carListing.findMany({
    where: {
      status: 'ACTIVE',
      ...(brand ? { brand } : {}),
      ...(location ? { location } : {}),
      ...(sellerId ? { sellerId } : {}),
      price: {
        ...(minPrice ? { gte: parseInt(minPrice) } : {}),
        ...(maxPrice ? { lte: parseInt(maxPrice) } : {}),
      },
    },
    include: {
      images: { orderBy: { order: 'asc' }, take: 1 },
      seller: { select: { id: true, name: true, avatarUrl: true } },
    },
    orderBy: { createdAt: 'desc' },
    skip: page * limit,
    take: limit,
  })

  const total = await prisma.carListing.count({
    where: { status: 'ACTIVE' },
  })

  return NextResponse.json({
    data: listings,
    total,
    page,
    pageSize: limit,
    hasMore: (page + 1) * limit < total,
  })
}
