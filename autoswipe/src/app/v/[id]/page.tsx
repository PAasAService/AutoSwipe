import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { calculateCostBreakdown } from '@/lib/utils/cost-calculator'
import { estimateMarketPrice, computePriceVsMarket, formatPriceVsMarket } from '@/lib/utils/price-intelligence'
import { formatILS, formatMileage } from '@/lib/utils/cost-calculator'
import { FUEL_TYPE_HE, VEHICLE_TYPE_HE, TRANSMISSION_HE } from '@/lib/constants/cars'
import CarImagePlaceholder from '@/components/ui/CarImagePlaceholder'
import { DealBadge } from '@/components/ui/Badge'
import { VerifiedBadge } from '@/components/listing/VerifiedBadge'
import { ArrowRight, MapPin, Gauge, Fuel, Calendar, Car } from 'lucide-react'
import type { CostBreakdown, DealTag } from '@/types'

/**
 * Public listing page — no authentication required.
 * Displays basic listing information for sharing purposes.
 *
 * Visibility rules:
 * - Only ACTIVE listings are shown
 * - DELETED, PAUSED, SOLD listings show not-found
 */
export default async function PublicListingPage({ params }: { params: { id: string } }) {
  const listing = await prisma.carListing.findUnique({
    where: { id: params.id },
    include: {
      images: { orderBy: { order: 'asc' } },
      seller: {
        select: { id: true, name: true, createdAt: true },
      },
    },
  })

  // Only show ACTIVE listings publicly
  if (!listing || listing.status !== 'ACTIVE') {
    notFound()
  }

  // Compute cost breakdown (using default preferences for public view)
  const costBreakdown = calculateCostBreakdown(
    listing as any,
    3 // default ownership years for public view
  ) as CostBreakdown

  const marketAvg = listing.marketAvgPrice ?? estimateMarketPrice(listing.brand, listing.model, listing.year)
  const priceVsMarket = computePriceVsMarket(listing.price, marketAvg)
  const priceVsMarketStr = formatPriceVsMarket(priceVsMarket)

  const primaryImage = listing.images[0]?.path
  const listingTitle = `${listing.brand} ${listing.model} ${listing.year}`

  // Increment view count for analytics
  await prisma.carListing.update({
    where: { id: listing.id },
    data: { viewCount: { increment: 1 } },
  })

  return (
    <div className="min-h-screen bg-surface-container-lowest" dir="rtl">
      {/* Hero - full bleed image with overlay */}
      <div className="relative h-80">
        {primaryImage ? (
          <Image
            src={primaryImage}
            alt={listingTitle}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <CarImagePlaceholder
            brand={listing.brand}
            model={listing.model}
            year={listing.year}
            className="absolute inset-0"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-surface-container-lowest" />

        {/* Back button */}
        <Link
          href="/"
          className="absolute top-4 right-4 w-11 h-11 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white"
        >
          <ArrowRight className="w-5 h-5" />
        </Link>

        {/* Image counter pill */}
        {listing.images.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full">
            1/{listing.images.length}
          </div>
        )}
      </div>

      {/* Scrollable content - negative margin to overlap hero */}
      <div className="-mt-8 px-5 pb-8 space-y-4">
        {/* Card 1: Title, Price, Tags */}
        <div className="bg-surface-container rounded-3xl p-5">
          <div className="flex justify-between items-start">
            {/* Left: price */}
            <div className="text-left">
              <p className="font-headline text-3xl font-bold text-primary">{formatILS(listing.price)}</p>
              <p
                className={`text-xs font-medium mt-0.5 ${
                  priceVsMarket < 0
                    ? 'text-green-400'
                    : priceVsMarket > 0.1
                    ? 'text-red-400'
                    : 'text-on-surface-variant'
                }`}
              >
                {priceVsMarketStr}
              </p>
            </div>
            {/* Right: brand/model */}
            <div className="text-right">
              <h1 className="font-headline text-2xl font-bold text-on-surface">
                {listing.brand} {listing.model}
              </h1>
              <p className="text-on-surface-variant text-sm mt-0.5">
                {listing.year} · {VEHICLE_TYPE_HE[listing.vehicleType as keyof typeof VEHICLE_TYPE_HE]}
              </p>
            </div>
          </div>

          {/* Tags row */}
          <div className="flex flex-wrap gap-2 mt-3">
            {listing.dealTag && listing.dealTag !== 'FAIR_PRICE' && (
              <DealBadge tag={listing.dealTag as DealTag} />
            )}
            {listing.isGovVerified && (
              <VerifiedBadge />
            )}
          </div>
        </div>

        {/* Card 2: Key specs */}
        <div className="bg-surface-container rounded-3xl p-5 space-y-3">
          <div className="flex gap-4">
            <div className="flex-1">
              <p className="text-on-surface-variant text-xs mb-1">קילומטרים</p>
              <p className="text-on-surface font-semibold">{formatMileage(listing.mileage)}</p>
            </div>
            <div className="flex-1">
              <p className="text-on-surface-variant text-xs mb-1">דלק</p>
              <p className="text-on-surface font-semibold">{FUEL_TYPE_HE[listing.fuelType as keyof typeof FUEL_TYPE_HE]}</p>
            </div>
            <div className="flex-1">
              <p className="text-on-surface-variant text-xs mb-1">תיבת הילוכים</p>
              <p className="text-on-surface font-semibold">{TRANSMISSION_HE[listing.transmission as keyof typeof TRANSMISSION_HE]}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-surface-variant">
            {listing.color && (
              <>
                <p className="text-on-surface-variant text-xs">צבע</p>
                <p className="text-on-surface font-semibold">{listing.color}</p>
              </>
            )}
            {listing.doors != null && (
              <>
                <p className="text-on-surface-variant text-xs">דלתות</p>
                <p className="text-on-surface font-semibold">{listing.doors}</p>
              </>
            )}
            {listing.seats != null && (
              <>
                <p className="text-on-surface-variant text-xs">מושבים</p>
                <p className="text-on-surface font-semibold">{listing.seats}</p>
              </>
            )}
            <p className="text-on-surface-variant text-xs">מיקום</p>
            <p className="text-on-surface font-semibold">{listing.location}</p>
          </div>
        </div>

        {/* Card 3: Monthly cost estimate */}
        <div className="bg-surface-container rounded-3xl p-5">
          <div className="flex justify-between items-center mb-3">
            <p className="text-primary font-headline font-bold text-xl">
              {formatILS(costBreakdown.monthly)}/חודש
            </p>
            <p className="text-on-surface font-semibold">עלות חודשית (משוערת)</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <p className="text-on-surface-variant">פחת</p>
            <p className="text-on-surface text-right">{formatILS(costBreakdown.depreciation)}</p>
            <p className="text-on-surface-variant">דלק</p>
            <p className="text-on-surface text-right">{formatILS(costBreakdown.fuel)}</p>
            {listing.insuranceEstimate > 0 && (
              <>
                <p className="text-on-surface-variant">ביטוח</p>
                <p className="text-on-surface text-right">{formatILS(costBreakdown.insurance)}</p>
              </>
            )}
            {listing.maintenanceEstimate > 0 && (
              <>
                <p className="text-on-surface-variant">תחזוקה</p>
                <p className="text-on-surface text-right">{formatILS(costBreakdown.maintenance)}</p>
              </>
            )}
          </div>
        </div>

        {/* Card 4: Description */}
        {listing.description && (
          <div className="bg-surface-container rounded-3xl p-5">
            <p className="text-on-surface font-semibold mb-2">תיאור</p>
            <p className="text-on-surface-variant text-sm leading-relaxed">
              {listing.description}
            </p>
          </div>
        )}

        {/* Card 5: Seller info */}
        {listing.seller && (
          <div className="bg-surface-container rounded-3xl p-5">
            <div className="flex justify-between items-center">
              <div className="text-right">
                <p className="text-on-surface font-semibold">{listing.seller.name}</p>
                <p className="text-on-surface-variant text-xs mt-0.5">מוכר</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold">
                {listing.seller.name.charAt(0)}
              </div>
            </div>
          </div>
        )}

        {/* CTA: Download app or view on app */}
        <div className="bg-primary rounded-3xl p-5 text-center">
          <p className="text-on-primary font-semibold mb-2">
            להתחיל משא ומתן עם המוכר
          </p>
          <p className="text-on-primary text-xs opacity-90">
            הורד את אפליקציית AutoSwipe לצ'אט ישיר עם המוכר
          </p>
        </div>
      </div>
    </div>
  )
}
