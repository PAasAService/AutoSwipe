import type { CarListing, MessageThread, User } from '@prisma/client'
import { MessagingMode, OPEN_MODE_BUYER_MESSAGE_CAP } from '@/lib/domain-enums'

export function effectiveListingMessagingMode(
  listing: Pick<CarListing, 'listingMessagingMode'>,
  seller: Pick<User, 'messagingMode'>,
): string {
  if (listing.listingMessagingMode) return listing.listingMessagingMode
  return seller.messagingMode || MessagingMode.OPEN
}

export function canBuyerSendMessage(args: {
  thread: Pick<
    MessageThread,
    'buyerMessageCount' | 'sellerStartedChat' | 'openBuyerCapCleared'
  >
  isBuyer: boolean
  effectiveMode: string
}): { ok: true } | { ok: false; reason: string } {
  if (!args.isBuyer) return { ok: true }

  if (args.effectiveMode === MessagingMode.BUMBLE) {
    if (!args.thread.sellerStartedChat) {
      return {
        ok: false,
        reason: 'במצב זה רק המוכר יכול להתחיל שיחה',
      }
    }
    return { ok: true }
  }

  // OPEN — cap until seller has participated
  if (
    !args.thread.openBuyerCapCleared &&
    args.thread.buyerMessageCount >= OPEN_MODE_BUYER_MESSAGE_CAP
  ) {
    return {
      ok: false,
      reason: 'הגעת למגבלת ההודעות הראשונות — המוכר יכול להשיב כדי להמשיך',
    }
  }
  return { ok: true }
}

export function shouldCountBuyerMessage(effectiveMode: string): boolean {
  return effectiveMode === MessagingMode.OPEN
}
