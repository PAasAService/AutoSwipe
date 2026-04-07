/**
 * Domain string constants (SQLite / Prisma use strings, not native enums).
 */

export const ListingStatus = {
  DRAFT: 'DRAFT',
  PENDING_REVIEW: 'PENDING_REVIEW',
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  SOLD: 'SOLD',
  EXPIRED: 'EXPIRED',
  REJECTED: 'REJECTED',
} as const

export const MessagingMode = {
  OPEN: 'OPEN',
  BUMBLE: 'BUMBLE',
} as const

export const ReportStatus = {
  OPEN: 'OPEN',
  REVIEWED: 'REVIEWED',
  DISMISSED: 'DISMISSED',
  ACTIONED: 'ACTIONED',
} as const

export const ReportCategory = {
  FAKE_PHOTO: 'FAKE_PHOTO',
  MISLEADING_PRICE: 'MISLEADING_PRICE',
  SPAM: 'SPAM',
  SCAM: 'SCAM',
  OTHER: 'OTHER',
} as const

/** Max outbound messages from buyer in OPEN mode before seller responds (product spec). */
export const OPEN_MODE_BUYER_MESSAGE_CAP = 3
