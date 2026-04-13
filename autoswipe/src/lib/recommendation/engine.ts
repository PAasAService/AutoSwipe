import fs from 'fs/promises'
import path from 'path'

/**
 * AutoSwipe Feed Recommendation Engine
 *
 * Orchestrates the full ranking pipeline:
 * 1. Fetch candidate listings (not yet seen by user)
 * 2. Score each listing using the scorer
 * 3. Apply diversity injection (prevent repetition)
 * 4. Apply exploration bonus for feed freshness
 * 5. Sort by final score
 * 6. Return ranked feed
 *
 * Algorithm phases:
 *   Phase 1 (cards 1–10):  Best matches only (score > 70)
 *   Phase 2 (cards 11–30): Broader matches (score > 40)
 *   Phase 3 (30+):         Discovery mode — any active listing
 */

import { prisma } from '@/lib/db'
import { scoreListing } from './scorer'
import { calculateCostBreakdown } from '@/lib/utils/cost-calculator'
import { classifyDeal, computePriceVsMarket, estimateMarketPrice } from '@/lib/utils/price-intelligence'
import type { CarListing, BuyerPreferences, FeedListing } from '@/types'

const LEARNED_SIGNAL_LOG_DIR = 'LearnedSignalsLogs'

const LEARNED_SIGNAL_TABLE_SCHEMA = `Table: LearnedSignal (Prisma / SQLite)
──────────────────────────────────────────────────
id            String   @id @default(cuid())
userId        String   FK -> User.id (onDelete: Cascade)
dimension     String   e.g. brand:Toyota, model:Corolla (unique with userId)
score         Float    running affinity (incremented per weighted action)
interactions  Int      count of updates applied to this dimension
updatedAt     DateTime @updatedAt
──────────────────────────────────────────────────
@@unique([userId, dimension])
`

type LearnedRowSnap = {
  id: string
  userId: string
  dimension: string
  score: number
  interactions: number
  updatedAt: string
}

function snapshotLearnedRow(row: {
  id: string
  userId: string
  dimension: string
  score: number
  interactions: number
  updatedAt: Date
}): LearnedRowSnap {
  return {
    id: row.id,
    userId: row.userId,
    dimension: row.dimension,
    score: row.score,
    interactions: row.interactions,
    updatedAt: row.updatedAt.toISOString(),
  }
}

function learnedSignalFileLogEnabled(): boolean {
  const v = process.env.LEARNED_SIGNAL_FILE_LOG
  if (v === '0' || v === 'false') return false
  if (v === '1' || v === 'true') return true
  return process.env.NODE_ENV === 'development'
}

function sanitizeLearnedLogFilePart(s: string, maxLen: number): string {
  const trimmed = s.trim() || 'user'
  return trimmed
    .replace(/[/\\?%*:|"<>]/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, maxLen)
}

async function writeLearnedSignalUpdateLog(opts: {
  userName: string
  dimension: string
  before: LearnedRowSnap | null
  after: LearnedRowSnap
}): Promise<void> {
  const dir = path.join(process.cwd(), LEARNED_SIGNAL_LOG_DIR)
  await fs.mkdir(dir, { recursive: true })

  const d = new Date()
  const datetime = d
    .toISOString()
    .replace(/:/g, '-')
    .replace(/\./g, '_')

  const safeUser = sanitizeLearnedLogFilePart(opts.userName, 64)
  const safeDim = sanitizeLearnedLogFilePart(opts.dimension.replace(/:/g, '_'), 80)
  const filePath = path.join(dir, `${safeUser}_${datetime}_${safeDim}.log`)

  const prevSection = opts.before
    ? `Previous row (update):\n${JSON.stringify(opts.before, null, 2)}`
    : 'Previous row: (none — NEW ROW)'

  const body = [
    LEARNED_SIGNAL_TABLE_SCHEMA,
    '',
    '---',
    prevSection,
    '',
    '---',
    'Row after upsert:',
    JSON.stringify(opts.after, null, 2),
    '',
  ].join('\n')

  await fs.writeFile(filePath, body, 'utf8')
}

/** Parse JSON-encoded array fields from SQLite BuyerPreferences row */
function parsePrefs(raw: any): BuyerPreferences {
  return {
    ...raw,
    preferredBrands: tryParse(raw.preferredBrands, []),
    preferredModels: tryParse(raw.preferredModels, []),
    fuelPreferences: tryParse(raw.fuelPreferences, []),
    vehicleTypes: tryParse(raw.vehicleTypes, []),
  }
}

function tryParse(val: any, fallback: any) {
  if (Array.isArray(val)) return val
  try { return JSON.parse(val) } catch { return fallback }
}

const PHASE_1_THRESHOLD = 70
const PHASE_2_THRESHOLD = 40
const FEED_BATCH_SIZE = 20
const DIVERSITY_PENALTY = 15   // points deducted for same brand shown recently
const FRESHNESS_BONUS_DAYS = 3 // new listings get +5 bonus points

export interface FeedOptions {
  userId: string
  page?: number    // 0-indexed batch
  limit?: number
}

/**
 * Build a personalized ranked feed for a user
 */
export async function buildFeed(options: FeedOptions): Promise<FeedListing[]> {
  const { userId, page = 0, limit = FEED_BATCH_SIZE } = options

  // 1. Load user preferences (may be null if user skipped onboarding — show full feed anyway)
  const prefs = await prisma.buyerPreferences.findUnique({ where: { userId } })

  // 2. Get IDs of listings already seen by this user
  const seenActions = await prisma.swipeAction.findMany({
    where: { userId },
    select: { listingId: true },
  })
  const seenIds = new Set(seenActions.map((a) => a.listingId))

  // 3. Load user's learned signals
  const learnedSignals = await prisma.learnedSignal.findMany({
    where: { userId },
    select: { dimension: true, score: true },
  })

  // 4. Build query filters — start broad, let scoring do the work
  const listings = await prisma.carListing.findMany({
    where: {
      status: 'ACTIVE',
      id: { notIn: Array.from(seenIds) },
      sellerId: { not: userId }, // Don't show user their own listings
    },
    include: {
      images: { orderBy: { order: 'asc' } },
      seller: { select: { id: true, name: true, avatarUrl: true, phone: true, createdAt: true } },
      _count: { select: { favorites: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 200, // pull large pool, score and rank
  })

  // 5. Enrich, score and rank
  const now = new Date()
  const brandCountInPage: Record<string, number> = {}

  const scored = listings.map((listing) => {
    // Build typed listing
    const typedListing = {
      ...listing,
      seller: listing.seller
        ? {
            ...listing.seller,
            createdAt: listing.seller.createdAt.toISOString(),
          }
        : undefined,
      images: listing.images.map((img) => ({
        id: img.id,
        path: img.path,
        order: img.order,
        isPrimary: img.isPrimary,
      })),
      createdAt: listing.createdAt.toISOString(),
      updatedAt: listing.updatedAt.toISOString(),
    } as unknown as CarListing

    // Compute TCO if not already stored
    const costBreakdown = calculateCostBreakdown(
      typedListing,
      prefs?.ownershipYears ?? 3
    )

    // Price intelligence
    const marketAvg = listing.marketAvgPrice ?? estimateMarketPrice(listing.brand, listing.model, listing.year)
    const priceVsMarket = computePriceVsMarket(listing.price, marketAvg)

    const isNew =
      (now.getTime() - listing.createdAt.getTime()) / (1000 * 60 * 60 * 24) <=
      FRESHNESS_BONUS_DAYS

    const dealTag = classifyDeal(listing.price, marketAvg, isNew)

    // Score (parse JSON array fields from SQLite; use neutral prefs if user skipped onboarding)
    const effectivePrefs: BuyerPreferences = prefs
      ? parsePrefs(prefs)
      : ({
          budgetMax: 999999,
          preferredBrands: [],
          preferredModels: [],
          fuelPreferences: [],
          vehicleTypes: [],
          location: '',
          searchRadius: 100,
          ownershipYears: 3,
        } as unknown as BuyerPreferences)
    const matchBreakdown = scoreListing(
      typedListing,
      effectivePrefs,
      learnedSignals
    )

    // Freshness bonus
    const freshnessBonus = isNew ? 5 : 0

    const finalScore = Math.min(100, matchBreakdown.total + freshnessBonus)

    return {
      listing: {
        ...typedListing,
        monthlyCost: costBreakdown.monthly,
        marketAvgPrice: marketAvg,
        priceVsMarket,
        dealTag: dealTag ?? undefined,
        likeCount: (listing as any)._count?.favorites ?? 0,
      } as CarListing,
      matchBreakdown,
      finalScore,
    }
  })

  // 6. Sort descending by score
  scored.sort((a, b) => b.finalScore - a.finalScore)

  // 7. Apply diversity filter — limit same brand in close proximity in feed
  const diversified: typeof scored = []
  for (const item of scored) {
    const brand = item.listing.brand
    const countSoFar = brandCountInPage[brand] ?? 0

    // Diversity penalty: every 3 same-brand cars in a row → reduce effective score
    const diversityPenalty = Math.floor(countSoFar / 3) * DIVERSITY_PENALTY
    const adjustedScore = item.finalScore - diversityPenalty

    diversified.push({ ...item, finalScore: adjustedScore })
    brandCountInPage[brand] = countSoFar + 1
  }

  // Re-sort after diversity adjustment
  diversified.sort((a, b) => b.finalScore - a.finalScore)

  // 8. Apply phase-based pagination
  const startIdx = page * limit
  const paginated = diversified.slice(startIdx, startIdx + limit)

  // 9. Return typed feed listings
  return paginated.map(({ listing, matchBreakdown, finalScore }) => ({
    ...listing,
    matchScore: finalScore,
    matchBreakdown,
  })) as FeedListing[]
}

/**
 * Update learned signals after a user swipe/interaction
 * Called after every swipe and behavior event
 */
export async function updateLearnedSignals(
  userId: string,
  listingId: string,
  action: 'SWIPE_RIGHT' | 'SWIPE_LEFT' | 'SAVE' | 'MESSAGE_SELLER' | 'OPEN_DETAIL'
): Promise<void> {
  const listing = await prisma.carListing.findUnique({
    where: { id: listingId },
    select: { brand: true, model: true, vehicleType: true, fuelType: true },
  })
  if (!listing) return

  // Signal weights: positive interactions increase score, negative decrease
  const signalWeights: Record<string, number> = {
    SWIPE_RIGHT: 1.0,
    SAVE: 2.0,
    MESSAGE_SELLER: 3.0,
    OPEN_DETAIL: 0.5,
    SWIPE_LEFT: -0.5,
  }

  const weight = signalWeights[action] ?? 0
  if (weight === 0) return

  const dimensions = [
    `brand:${listing.brand}`,
    `model:${listing.model}`,
    `vehicleType:${listing.vehicleType}`,
    `fuelType:${listing.fuelType}`,
  ]

  const logFiles = learnedSignalFileLogEnabled()
  const userName = logFiles
    ? (
        await prisma.user.findUnique({
          where: { id: userId },
          select: { name: true },
        })
      )?.name ?? userId
    : ''

  for (const dimension of dimensions) {
    const beforeRow = logFiles
      ? await prisma.learnedSignal.findUnique({
          where: { userId_dimension: { userId, dimension } },
        })
      : null

    const afterRow = await prisma.learnedSignal.upsert({
      where: { userId_dimension: { userId, dimension } },
      create: {
        userId,
        dimension,
        score: weight,
        interactions: 1,
      },
      update: {
        score: {
          increment: weight,
        },
        interactions: { increment: 1 },
      },
    })

    if (logFiles) {
      await writeLearnedSignalUpdateLog({
        userName,
        dimension,
        before: beforeRow ? snapshotLearnedRow(beforeRow) : null,
        after: snapshotLearnedRow(afterRow),
      })
    }
  }
}
