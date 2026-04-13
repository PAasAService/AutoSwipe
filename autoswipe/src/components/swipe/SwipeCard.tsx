'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion'
import { MapPin, Gauge, Fuel, TrendingDown, TrendingUp } from 'lucide-react'
import { DealBadge, MatchScoreBadge } from '@/components/ui/Badge'
import { VerifiedBadge } from '@/components/listing/VerifiedBadge'
import { formatILS, formatMileage } from '@/lib/utils/cost-calculator'
import { estimateMarketPrice, computePriceVsMarket } from '@/lib/utils/price-intelligence'
import { FUEL_TYPE_HE } from '@/lib/constants/cars'
import CarImagePlaceholder from '@/components/ui/CarImagePlaceholder'
import type { FeedListing, SwipeDirection } from '@/types'

interface SwipeCardProps {
  listing: FeedListing
  isTop: boolean
  onSwipe: (direction: SwipeDirection, listingId: string) => void
  onTap: (listingId: string) => void
  zIndex?: number
}

const SWIPE_THRESHOLD = 100  // px to trigger swipe
const ROTATION_FACTOR = 15   // degrees rotation per 300px drag

// ─── Price delta pill ─────────────────────────────────────────────────────────
// Shows buyer a compact signal: "↓ 18% מהשוק" or "↑ 12% מהשוק"
// Hides when price is within ±5% of market (no meaningful signal to show).

function PriceDelta({ listing }: { listing: FeedListing }) {
  const marketAvg =
    listing.marketAvgPrice ??
    estimateMarketPrice(listing.brand, listing.model, listing.year)
  const ratio = computePriceVsMarket(listing.price, marketAvg)
  const absPct = Math.abs(Math.round(ratio * 100))

  // Suppress near-market noise
  if (absPct < 5) return null

  const isBelow = ratio < 0

  return (
    <div
      className={`flex items-center justify-end gap-0.5 text-[11px] font-bold mt-0.5 ${
        isBelow ? 'text-green-400' : 'text-red-400'
      }`}
    >
      {isBelow ? (
        <TrendingDown className="w-3 h-3" />
      ) : (
        <TrendingUp className="w-3 h-3" />
      )}
      <span>{absPct}% {isBelow ? 'מהשוק ↓' : 'מעל השוק ↑'}</span>
    </div>
  )
}

export function SwipeCard({ listing, isTop, onSwipe, onTap, zIndex = 0 }: SwipeCardProps) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-300, 0, 300], [-ROTATION_FACTOR, 0, ROTATION_FACTOR])
  const likeOpacity = useTransform(x, [20, 100], [0, 1])
  const skipOpacity = useTransform(x, [-100, -20], [1, 0])

  const [imageIndex, setImageIndex] = useState(0)
  const hasImages = listing.images.length > 0
  const images = hasImages ? listing.images : []

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (!isTop) return
    if (info.offset.x > SWIPE_THRESHOLD) {
      onSwipe('RIGHT', listing.id)
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      onSwipe('LEFT', listing.id)
    }
  }

  const handleTap = () => {
    if (Math.abs(x.get()) < 5) {
      onTap(listing.id)
    }
  }

  const primaryImage = images[imageIndex]?.path ?? images[0]?.path

  return (
    <motion.div
      style={{ x, rotate, zIndex: isTop ? 10 : zIndex }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.8}
      onDragEnd={handleDragEnd}
      onClick={handleTap}
      className="absolute inset-0 cursor-grab active:cursor-grabbing select-none"
      animate={{ scale: isTop ? 1 : 0.96 }}
      transition={{ duration: 0.2 }}
    >
      <div className="relative w-full h-full rounded-3xl overflow-hidden bg-background-card shadow-card">
        {/* Car image */}
        <div className="absolute inset-0">
          {primaryImage ? (
            <Image
              src={primaryImage}
              alt={`${listing.brand} ${listing.model} ${listing.year}`}
              fill
              className="object-cover"
              priority={isTop}
              sizes="(max-width: 480px) 100vw, 480px"
            />
          ) : (
            <CarImagePlaceholder
              brand={listing.brand}
              model={listing.model}
              year={listing.year}
              className="w-full h-full"
            />
          )}
        </div>

        {/* Image navigation dots */}
        {images.length > 1 && (
          <div className="absolute top-3 left-0 right-0 flex justify-center gap-1.5 z-20">
            {images.map((img, i) => (
              <button
                key={img.id}
                aria-label={`תמונה ${i + 1}`}
                className={`h-1 rounded-full transition-all ${i === imageIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/40'}`}
                onClick={(e) => { e.stopPropagation(); setImageIndex(i) }}
              />
            ))}
          </div>
        )}

        {/* Tap zones for image navigation */}
        {images.length > 1 && isTop && (
          <>
            <button
              aria-label="תמונה קודמת"
              className="absolute top-0 left-0 w-1/3 h-full z-10"
              onClick={(e) => { e.stopPropagation(); setImageIndex(Math.max(0, imageIndex - 1)) }}
            />
            <button
              aria-label="תמונה הבאה"
              className="absolute top-0 right-0 w-1/3 h-full z-10"
              onClick={(e) => { e.stopPropagation(); setImageIndex(Math.min(images.length - 1, imageIndex + 1)) }}
            />
          </>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-card-overlay pointer-events-none" />

        {/* Top badges */}
        <div className="absolute top-12 right-3 z-20 flex flex-col gap-2 items-end">
          {listing.matchScore && listing.matchScore > 0 && (
            <MatchScoreBadge score={listing.matchScore} size="sm" />
          )}
          {listing.dealTag && listing.dealTag !== 'FAIR_PRICE' && (
            <DealBadge tag={listing.dealTag} size="sm" />
          )}
          {listing.isGovVerified && (
            <VerifiedBadge size="sm" />
          )}
        </div>

        {/* LIKE / SKIP overlays */}
        <motion.div
          style={{ opacity: likeOpacity }}
          className="absolute top-8 left-4 z-30 border-4 border-status-success text-status-success font-black text-3xl px-3 py-1 rounded-xl rotate-[-15deg] uppercase tracking-wider"
        >
          לייק ❤️
        </motion.div>
        <motion.div
          style={{ opacity: skipOpacity }}
          className="absolute top-8 right-4 z-30 border-4 border-status-error text-status-error font-black text-3xl px-3 py-1 rounded-xl rotate-[15deg] uppercase tracking-wider"
        >
          דלג ✕
        </motion.div>

        {/* Bottom info panel */}
        <div className="absolute bottom-0 left-0 right-0 p-5 z-20">
          {/* Car title */}
          <div className="flex items-end justify-between mb-1">
            <div>
              <h2 className="text-white font-black text-2xl leading-tight tracking-tight">
                {listing.brand} {listing.model}
              </h2>
              <p className="text-white/70 text-sm font-medium">{listing.year}</p>
            </div>
            <div className="text-right">
              <p className="text-accent font-black text-xl">{formatILS(listing.price)}</p>
              <PriceDelta listing={listing} />
            </div>
          </div>

          {/* Quick stats row */}
          <div className="flex gap-3 mt-2 mb-3">
            <span className="flex items-center gap-1 text-white/70 text-xs">
              <Gauge className="w-3.5 h-3.5" />
              {formatMileage(listing.mileage)}
            </span>
            <span className="flex items-center gap-1 text-white/70 text-xs">
              <Fuel className="w-3.5 h-3.5" />
              {FUEL_TYPE_HE[listing.fuelType]}
            </span>
            <span className="flex items-center gap-1 text-white/70 text-xs">
              <MapPin className="w-3.5 h-3.5" />
              {listing.location}
            </span>
          </div>

          {/* Monthly cost */}
          {listing.monthlyCost && (
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-3 py-2 flex items-center justify-between">
              <span className="text-white/60 text-xs">עלות חודשית משוערת</span>
              <span className="text-white font-bold text-sm flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5 text-accent" />
                {formatILS(listing.monthlyCost)}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
