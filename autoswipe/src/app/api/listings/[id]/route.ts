import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/mobile-auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import { calculateCostBreakdown } from '@/lib/utils/cost-calculator'
import { classifyDeal, computePriceVsMarket, estimateMarketPrice } from '@/lib/utils/price-intelligence'
import { syncListingToMarketData } from '@/lib/valuation/market-collector'
import { replaceListingOrderedImages } from '@/lib/listing-image-storage'
import { createNotification } from '@/lib/notifications/service'

// ── Helper function to send SOLD notifications ──────────────────────────────
// Called from both quick-status and full-PATCH endpoints
// Prevents duplicate notifications by checking if we've already notified users
async function sendSoldNotifications(listingId: string, updatedListing: any, oldStatus: string) {
  // Only send if transitioning FROM non-SOLD to SOLD
  if (oldStatus === 'SOLD') {
    return // Already SOLD before, don't re-notify
  }
  if (updatedListing.status !== 'SOLD') {
    return // Not transitioning TO SOLD, don't notify
  }

  // Prevent duplicate notifications: check if we've already created a 'listing_sold' notification
  // for this listing. The presence of ANY such notification is evidence we've alerted users.
  // This prevents re-notifying on subsequent status updates (PAUSED → SOLD → PAUSED → SOLD)
  const existingNotifications = await prisma.notification.count({
    where: {
      type: 'listing_sold',
      data: { contains: listingId },
    },
  })

  if (existingNotifications > 0) {
    return // Already notified users for this listing becoming SOLD, skip re-notification
  }

  try {
    // Find all users who have this listing favorited
    const favorites = await prisma.favorite.findMany({
      where: { listingId },
      select: { userId: true },
    })

    // Find all users in message threads for this listing
    const threads = await prisma.messageThread.findMany({
      where: { listingId },
      select: { buyerId: true, sellerId: true },
    })

    // Collect unique user IDs (favorites + thread participants)
    const userIdsSet = new Set<string>()
    for (const fav of favorites) {
      userIdsSet.add(fav.userId)
    }
    for (const thread of threads) {
      userIdsSet.add(thread.buyerId)
      // Don't notify seller — they know they marked it sold
    }

    const carLabel = `${updatedListing.brand} ${updatedListing.model} · ${updatedListing.year}`

    // Send notification to each relevant user
    for (const userId of userIdsSet) {
      try {
        await createNotification({
          userId,
          type: 'listing_sold',
          title: 'הרכב נשמר כלא זמין',
          body: `הרכב שהתעניינת בו כבר נמכר: ${carLabel}`,
          data: {
            listingId,
          },
        })
      } catch (notifErr) {
        // Log but don't break — notification errors shouldn't fail the listing update
        console.error('[listings] notification send failed for user', userId, notifErr)
      }
    }
  } catch (notifErr) {
    // Log but don't break — notification errors shouldn't fail the listing update
    console.error('[listings] SOLD notification system error', notifErr)
  }
}

// ── Helper function to send PAUSED notifications ────────────────────────────
// Called when listing transitions from ACTIVE to PAUSED
// Notifies users who have favorited or interacted with the listing
async function sendPausedNotifications(listingId: string, updatedListing: any, oldStatus: string) {
  // Only send if transitioning FROM non-PAUSED to PAUSED
  if (oldStatus === 'PAUSED') {
    return // Already PAUSED before, don't re-notify
  }
  if (updatedListing.status !== 'PAUSED') {
    return // Not transitioning TO PAUSED, don't notify
  }

  // Prevent duplicate notifications: check if we've already created a 'listing_paused' notification
  // for this listing. The presence of ANY such notification is evidence we've alerted users.
  const existingNotifications = await prisma.notification.count({
    where: {
      type: 'listing_paused',
      data: { contains: listingId },
    },
  })

  if (existingNotifications > 0) {
    return // Already notified users for this listing becoming PAUSED, skip re-notification
  }

  try {
    // Find all users who have this listing favorited
    const favorites = await prisma.favorite.findMany({
      where: { listingId },
      select: { userId: true },
    })

    // Find all users in message threads for this listing
    const threads = await prisma.messageThread.findMany({
      where: { listingId },
      select: { buyerId: true, sellerId: true },
    })

    // Collect unique user IDs (favorites + thread participants)
    const userIdsSet = new Set<string>()
    for (const fav of favorites) {
      userIdsSet.add(fav.userId)
    }
    for (const thread of threads) {
      userIdsSet.add(thread.buyerId)
      // Don't notify seller — they know they paused the listing
    }

    const carLabel = `${updatedListing.brand} ${updatedListing.model} · ${updatedListing.year}`

    // Send notification to each relevant user
    for (const userId of userIdsSet) {
      try {
        await createNotification({
          userId,
          type: 'listing_paused',
          title: 'המודעה אינה זמינה כרגע',
          body: `הרכב שהתעניינת בו כרגע מושהה ולא זמין: ${carLabel}`,
          data: {
            listingId,
          },
        })
      } catch (notifErr) {
        // Log but don't break — notification errors shouldn't fail the listing update
        console.error('[listings] notification send failed for user', userId, notifErr)
      }
    }
  } catch (notifErr) {
    // Log but don't break — notification errors shouldn't fail the listing update
    console.error('[listings] PAUSED notification system error', notifErr)
  }
}

// ── Helper function to send REACTIVATED notifications ──────────────────────
// Called when listing transitions from PAUSED back to ACTIVE
// Notifies users who were interested when it was paused
async function sendReactivatedNotifications(listingId: string, updatedListing: any, oldStatus: string) {
  // Only send if transitioning FROM PAUSED to ACTIVE
  if (oldStatus !== 'PAUSED') {
    return // Not transitioning FROM PAUSED, don't notify
  }
  if (updatedListing.status !== 'ACTIVE') {
    return // Not transitioning TO ACTIVE, don't notify
  }

  // Prevent duplicate notifications: check if we've already created a 'listing_reactivated' notification
  // for this listing. This prevents re-notifying on repeated PAUSED → ACTIVE → PAUSED → ACTIVE cycles.
  const existingNotifications = await prisma.notification.count({
    where: {
      type: 'listing_reactivated',
      data: { contains: listingId },
    },
  })

  if (existingNotifications > 0) {
    return // Already notified users for this listing being reactivated, skip re-notification
  }

  try {
    // Find all users who have this listing favorited
    const favorites = await prisma.favorite.findMany({
      where: { listingId },
      select: { userId: true },
    })

    // Find all users in message threads for this listing
    const threads = await prisma.messageThread.findMany({
      where: { listingId },
      select: { buyerId: true, sellerId: true },
    })

    // Collect unique user IDs (favorites + thread participants)
    const userIdsSet = new Set<string>()
    for (const fav of favorites) {
      userIdsSet.add(fav.userId)
    }
    for (const thread of threads) {
      userIdsSet.add(thread.buyerId)
      // Don't notify seller — they know they reactivated the listing
    }

    const carLabel = `${updatedListing.brand} ${updatedListing.model} · ${updatedListing.year}`

    // Send notification to each relevant user
    for (const userId of userIdsSet) {
      try {
        await createNotification({
          userId,
          type: 'listing_reactivated',
          title: 'המודעה חזרה להיות זמינה',
          body: `הרכב שהתעניינת בו שוב זמין לצפייה: ${carLabel}`,
          data: {
            listingId,
          },
        })
      } catch (notifErr) {
        // Log but don't break — notification errors shouldn't fail the listing update
        console.error('[listings] notification send failed for user', userId, notifErr)
      }
    }
  } catch (notifErr) {
    // Log but don't break — notification errors shouldn't fail the listing update
    console.error('[listings] REACTIVATED notification system error', notifErr)
  }
}

const quickStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'PAUSED', 'SOLD']),
})

const patchBodySchema = z
  .object({
    brand: z.string().min(1).optional(),
    model: z.string().min(1).optional(),
    year: z.number().int().min(2000).max(new Date().getFullYear() + 1).optional(),
    mileage: z.number().int().min(0).optional(),
    price: z.number().int().min(1000).optional(),
    location: z.string().min(1).optional(),
    fuelType: z.enum(['GASOLINE', 'DIESEL', 'HYBRID', 'ELECTRIC', 'PLUG_IN_HYBRID']).optional(),
    fuelConsumption: z.number().min(0).max(30).optional(),
    vehicleType: z
      .enum([
        'SEDAN',
        'SUV',
        'HATCHBACK',
        'COUPE',
        'CONVERTIBLE',
        'MINIVAN',
        'PICKUP',
        'WAGON',
        'CROSSOVER',
      ])
      .optional(),
    transmission: z.enum(['AUTOMATIC', 'MANUAL']).optional(),
    engineSize: z.number().min(0).max(200).optional().nullable(),
    color: z.string().max(100).optional().nullable(),
    doors: z.number().int().min(2).max(7).optional().nullable(),
    seats: z.number().int().min(2).max(9).optional().nullable(),
    hand: z.number().int().min(1).max(10).optional().nullable(),
    insuranceEstimate: z.number().int().min(0).max(100_000).optional(),
    maintenanceEstimate: z.number().int().min(0).max(100_000).optional(),
    depreciationRate: z.number().min(0).max(1).optional(),
    description: z.string().max(2000).optional().nullable(),
    images: z.array(z.object({ path: z.string().min(8) })).min(1).max(6).optional(),
    plateNumber: z.string().max(20).optional().nullable(),
    isGovVerified: z.boolean().optional(),
    status: z.enum(['ACTIVE', 'PAUSED', 'SOLD']).optional(),
    whySelling: z.string().max(2000).optional().nullable(),
    equipment: z.array(z.string().max(80)).max(40).optional(),
    listingMessagingMode: z.enum(['OPEN', 'SELLER_FIRST']).optional(),
  })
  .strict()

const RECOMPUTE_KEYS = new Set([
  'brand',
  'model',
  'year',
  'mileage',
  'price',
  'fuelType',
  'fuelConsumption',
  'vehicleType',
  'transmission',
  'engineSize',
  'doors',
  'seats',
  'hand',
  'insuranceEstimate',
  'maintenanceEstimate',
  'depreciationRate',
])

function isQuickStatusOnly(raw: unknown): raw is { status: string } {
  if (!raw || typeof raw !== 'object') return false
  const keys = Object.keys(raw as object)
  return keys.length === 1 && keys[0] === 'status'
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const listing = await prisma.carListing.findUnique({
    where: { id: params.id },
    include: {
      images: { orderBy: { order: 'asc' } },
      seller: {
        select: { id: true, name: true, avatarUrl: true, phone: true, createdAt: true },
      },
      _count: { select: { favorites: true, swipeActions: true } },
    },
  })

  if (!listing) {
    return NextResponse.json({ error: 'לא נמצא' }, { status: 404 })
  }

  // Increment view count
  await prisma.carListing.update({
    where: { id: params.id },
    data: { viewCount: { increment: 1 } },
  })

  return NextResponse.json({ data: listing })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req)
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const listing = await prisma.carListing.findUnique({ where: { id: params.id } })
  if (!listing || listing.sellerId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (listing.status === 'DELETED') {
    return NextResponse.json({ error: 'לא ניתן לעדכן מודעה שנמחקה' }, { status: 400 })
  }

  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json({ error: 'גוף בקשה לא תקין' }, { status: 400 })
  }

  try {
    if (isQuickStatusOnly(raw)) {
      const { status } = quickStatusSchema.parse(raw)
      const oldStatus = listing.status
      const updated = await prisma.carListing.update({
        where: { id: params.id },
        data: { status },
        include: { images: true },
      })

      // Send notifications for status transitions using shared functions
      await sendSoldNotifications(params.id, updated, oldStatus)
      await sendPausedNotifications(params.id, updated, oldStatus)
      await sendReactivatedNotifications(params.id, updated, oldStatus)

      return NextResponse.json({ data: updated })
    }

    const data = patchBodySchema.parse(raw)

    let finalImagePaths: string[] | undefined
    if (data.images) {
      try {
        finalImagePaths = await replaceListingOrderedImages(params.id, user.id, data.images.map((i) => i.path))
      } catch (e) {
        console.error('[listings PATCH] images', e)
        return NextResponse.json(
          { error: 'עדכון תמונות נכשל — ודא שהתמונות תקינות ונסה שוב' },
          { status: 400 },
        )
      }
    }

    const dataKeys = Object.keys(data)
    const needsRecompute = dataKeys.some((k) => RECOMPUTE_KEYS.has(k))

    const merged = {
      brand: data.brand ?? listing.brand,
      model: data.model ?? listing.model,
      year: data.year ?? listing.year,
      mileage: data.mileage ?? listing.mileage,
      price: data.price ?? listing.price,
      location: data.location ?? listing.location,
      fuelType: data.fuelType ?? listing.fuelType,
      fuelConsumption: data.fuelConsumption ?? listing.fuelConsumption,
      vehicleType: data.vehicleType ?? listing.vehicleType,
      transmission: data.transmission ?? listing.transmission,
      engineSize:
        data.engineSize !== undefined
          ? data.engineSize === null
            ? undefined
            : data.engineSize
          : listing.engineSize ?? undefined,
      color: data.color !== undefined ? data.color ?? undefined : listing.color ?? undefined,
      doors: data.doors !== undefined ? data.doors ?? undefined : listing.doors ?? undefined,
      seats: data.seats !== undefined ? data.seats ?? undefined : listing.seats ?? undefined,
      hand: data.hand !== undefined ? data.hand ?? undefined : listing.hand ?? undefined,
      insuranceEstimate: data.insuranceEstimate ?? listing.insuranceEstimate,
      maintenanceEstimate: data.maintenanceEstimate ?? listing.maintenanceEstimate,
      depreciationRate: data.depreciationRate ?? listing.depreciationRate,
    }

    const scalar: Prisma.CarListingUpdateInput = {}
    if (data.brand !== undefined) scalar.brand = data.brand
    if (data.model !== undefined) scalar.model = data.model
    if (data.year !== undefined) scalar.year = data.year
    if (data.mileage !== undefined) scalar.mileage = data.mileage
    if (data.price !== undefined) scalar.price = data.price
    if (data.location !== undefined) scalar.location = data.location
    if (data.fuelType !== undefined) scalar.fuelType = data.fuelType
    if (data.fuelConsumption !== undefined) scalar.fuelConsumption = data.fuelConsumption
    if (data.vehicleType !== undefined) scalar.vehicleType = data.vehicleType
    if (data.transmission !== undefined) scalar.transmission = data.transmission
    if (data.engineSize !== undefined) {
      scalar.engineSize = data.engineSize === null ? null : data.engineSize
    }
    if (data.color !== undefined) scalar.color = data.color
    if (data.doors !== undefined) scalar.doors = data.doors
    if (data.seats !== undefined) scalar.seats = data.seats
    if (data.hand !== undefined && data.hand !== null) {
      scalar.hand = data.hand
    }
    if (data.insuranceEstimate !== undefined) scalar.insuranceEstimate = data.insuranceEstimate
    if (data.maintenanceEstimate !== undefined) scalar.maintenanceEstimate = data.maintenanceEstimate
    if (data.depreciationRate !== undefined) scalar.depreciationRate = data.depreciationRate
    if (data.description !== undefined) scalar.description = data.description
    if (data.plateNumber !== undefined) scalar.plateNumber = data.plateNumber
    if (data.isGovVerified !== undefined) {
      scalar.isGovVerified = data.isGovVerified
      scalar.govVerifiedAt = data.isGovVerified ? new Date() : null
    }
    if (data.status !== undefined) scalar.status = data.status
    if (data.whySelling !== undefined) scalar.whySelling = data.whySelling
    if (data.equipment !== undefined) scalar.equipmentJson = JSON.stringify(data.equipment)
    if (data.listingMessagingMode !== undefined) {
      scalar.listingMessagingMode = data.listingMessagingMode
    }

    if (needsRecompute) {
      const marketAvg = estimateMarketPrice(merged.brand, merged.model, merged.year)
      const priceVsMarket = computePriceVsMarket(merged.price, marketAvg)
      const dealTag = classifyDeal(merged.price, marketAvg, true)
      const costBreakdown = calculateCostBreakdown(merged as Parameters<typeof calculateCostBreakdown>[0])
      scalar.marketAvgPrice = marketAvg
      scalar.priceVsMarket = priceVsMarket
      scalar.dealTag = dealTag ?? undefined
      scalar.monthlyCost = costBreakdown.monthly
    }

    await prisma.$transaction(async (tx) => {
      await tx.carListing.update({
        where: { id: params.id },
        data: scalar,
      })
      if (finalImagePaths) {
        await tx.listingImage.deleteMany({ where: { listingId: params.id } })
        await tx.listingImage.createMany({
          data: finalImagePaths.map((path, order) => ({
            listingId: params.id,
            path,
            order,
            isPrimary: order === 0,
          })),
        })
      }
    })

    const updated = await prisma.carListing.findUniqueOrThrow({
      where: { id: params.id },
      include: { images: { orderBy: { order: 'asc' } } },
    })

    // Send notifications for status transitions using shared functions
    const oldStatus = listing.status
    await sendSoldNotifications(params.id, updated, oldStatus)
    await sendPausedNotifications(params.id, updated, oldStatus)
    await sendReactivatedNotifications(params.id, updated, oldStatus)

    syncListingToMarketData(updated.id).catch(() => {})

    return NextResponse.json({ data: updated })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0]?.message ?? 'נתונים לא תקינים' }, { status: 400 })
    }
    console.error('[listings PATCH]', err)
    return NextResponse.json({ error: 'שגיאה פנימית' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthUser(req)
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const listing = await prisma.carListing.findUnique({ where: { id: params.id } })
  if (!listing || listing.sellerId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.carListing.update({
    where: { id: params.id },
    data: { status: 'DELETED' },
  })

  return NextResponse.json({ message: 'מחיקה בוצעה בהצלחה' })
}
