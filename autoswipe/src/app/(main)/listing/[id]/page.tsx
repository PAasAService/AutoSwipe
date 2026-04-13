import { notFound } from 'next/navigation'
import { getSession } from '@/lib/auth'
import Image from 'next/image'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { calculateCostBreakdown } from '@/lib/utils/cost-calculator'
import { estimateMarketPrice, computePriceVsMarket, formatPriceVsMarket } from '@/lib/utils/price-intelligence'
import { formatILS, formatMileage } from '@/lib/utils/cost-calculator'
import { FUEL_TYPE_HE, VEHICLE_TYPE_HE, TRANSMISSION_HE } from '@/lib/constants/cars'
import CarImagePlaceholder from '@/components/ui/CarImagePlaceholder'
import { CostBreakdownChart } from '@/components/listing/CostBreakdown'
import { OwnershipCostCard } from '@/components/listing/OwnershipCostCard'
import { PriceAnalysisCard } from '@/components/listing/PriceAnalysisCard'
import { ValuationCard }     from '@/components/listing/ValuationCard'
import { DealBadge } from '@/components/ui/Badge'
import { VerifiedBadge } from '@/components/listing/VerifiedBadge'
import {
  ArrowRight, MapPin, Gauge, Fuel, Calendar, Settings,
  Phone, MessageCircle, Car
} from 'lucide-react'
import { ListingActions } from '@/components/listing/ListingActions'
import { canAccess, FEATURES } from '@/lib/features/subscription'
import { PremiumGate } from '@/components/listing/PremiumGate'
import type { CostBreakdown } from '@/types'

export default async function ListingDetailPage({ params }: { params: { id: string } }) {
  const session = await getSession()

  const listing = await prisma.carListing.findUnique({
    where: { id: params.id, status: { not: 'DELETED' } },
    include: {
      images: { orderBy: { order: 'asc' } },
      seller: {
        select: { id: true, name: true, avatarUrl: true, phone: true, createdAt: true },
      },
    },
  })

  if (!listing) notFound()

  // Compute cost breakdown
  const prefs = session?.user
    ? await prisma.buyerPreferences.findUnique({ where: { userId: session.user.id! } })
    : null

  const costBreakdown = calculateCostBreakdown(
    listing as any,
    prefs?.ownershipYears ?? 3
  ) as CostBreakdown

  const marketAvg = listing.marketAvgPrice ?? estimateMarketPrice(listing.brand, listing.model, listing.year)
  const priceVsMarket = computePriceVsMarket(listing.price, marketAvg)
  const priceVsMarketStr = formatPriceVsMarket(priceVsMarket)

  // Feature access (flip flags in src/lib/features/subscription.ts to lock)
  const userPlan = 'FREE' // TODO: read from user record when billing is added
  const canSeeOwnershipCost = canAccess(FEATURES.OWNERSHIP_COST, userPlan)
  const canSeePriceAnalytics = canAccess(FEATURES.PRICE_ANALYTICS, userPlan)
  const canSeeFullBreakdown = canAccess(FEATURES.FULL_COST_BREAKDOWN, userPlan)

  const isFavorited = session?.user
    ? !!(await prisma.favorite.findUnique({
        where: { userId_listingId: { userId: session.user.id!, listingId: listing.id } },
      }))
    : false

  const primaryImage = listing.images[0]?.path

  return (
    <div className="min-h-screen bg-surface-container-lowest" dir="rtl">
      {/* Hero - full bleed image with overlay */}
      <div className="relative h-80">
        {primaryImage ? (
          <Image
            src={primaryImage}
            alt={`${listing.brand} ${listing.model} ${listing.year}`}
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
          href="/swipe"
          className="absolute top-4 right-4 w-11 h-11 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white"
        >
          <ArrowRight className="w-5 h-5" />
        </Link>

        {/* Action buttons */}
        <ListingActions
          listingId={listing.id}
          initialFavorited={isFavorited}
          listingTitle={`${listing.brand} ${listing.model} ${listing.year}`}
          listingUrl={`${process.env.NEXT_PUBLIC_APP_URL ?? ''}/listing/${listing.id}`}
        />

        {/* Image counter pill */}
        {listing.images.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full">
            1/{listing.images.length}
          </div>
        )}
      </div>

      {/* Scrollable content - negative margin to overlap hero */}
      <div className="-mt-8 px-5 pb-32 space-y-4">
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
                {listing.year} · {VEHICLE_TYPE_HE[listing.vehicleType]}
              </p>
            </div>
          </div>

          {/* Tags row */}
          <div className="flex flex-wrap gap-2 mt-3">
            {listing.dealTag && listing.dealTag !== 'FAIR_PRICE' && (
              <DealBadge tag={listing.dealTag as any} size="md" />
            )}
            {listing.isGovVerified && <VerifiedBadge size="sm" />}
            <span className="bg-surface-container-high text-on-surface-variant rounded-full px-3 py-1 text-xs">
              {listing.viewCount} צפיות
            </span>
          </div>
        </div>

        {/* Card 2: Key specs grid */}
        <div className="bg-surface-container rounded-3xl p-5">
          <h2 className="text-on-surface font-bold text-base text-right mb-4">פרטי הרכב</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Gauge, label: 'קילומטרז׳', value: formatMileage(listing.mileage) },
              { icon: Calendar, label: 'שנה', value: listing.year.toString() },
              { icon: Fuel, label: 'דלק', value: FUEL_TYPE_HE[listing.fuelType] },
              { icon: Settings, label: 'תיבת הילוכים', value: TRANSMISSION_HE[listing.transmission] },
              { icon: MapPin, label: 'מיקום', value: listing.location },
              ...(listing.engineSize ? [{ icon: Car, label: 'מנוע', value: `${listing.engineSize} ליטר` }] : []),
              ...(listing.doors ? [{ icon: Car, label: 'דלתות', value: `${listing.doors} דלתות` }] : []),
              ...(listing.color ? [{ icon: Car, label: 'צבע', value: listing.color }] : []),
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-surface-container-high rounded-2xl p-3.5 flex items-center gap-3">
                <Icon className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="text-right min-w-0">
                  <p className="text-on-surface-variant text-xs">{label}</p>
                  <p className="text-on-surface font-semibold text-sm truncate">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card: Government Verification */}
        {listing.isGovVerified && (
          <VerifiedBadge size="md" />
        )}

        {/* Card 3: Fuel consumption */}
        {listing.fuelConsumption && (
          <div className="bg-surface-container rounded-3xl px-5 py-4 flex justify-between items-center">
            <span className="font-headline font-bold text-primary text-lg">
              {listing.fuelType === 'ELECTRIC'
                ? `${listing.fuelConsumption} kWh/100km`
                : `${listing.fuelConsumption} ל׳/100km`}
            </span>
            <span className="text-on-surface-variant text-sm">צריכת דלק</span>
          </div>
        )}

        {/* Card 4: Description */}
        {listing.description && (
          <div className="bg-surface-container rounded-3xl p-5">
            <h2 className="text-on-surface font-bold text-base text-right mb-3">תיאור</h2>
            <p className="text-on-surface-variant text-sm leading-relaxed text-right">{listing.description}</p>
          </div>
        )}

        {/* Ownership cost card — locked via FEATURE_AVAILABILITY['ownership_cost'] */}
        <OwnershipCostCard
          fuelConsumption={listing.fuelConsumption}
          fuelType={listing.fuelType}
          insuranceEstimate={listing.insuranceEstimate}
          depreciationRate={listing.depreciationRate}
          price={listing.price}
          locked={!canSeeOwnershipCost}
        />

        {/* Card: Valuation engine — full market range with confidence */}
        <ValuationCard
          brand={listing.brand}
          model={listing.model}
          year={listing.year}
          mileage={listing.mileage}
          plateNumber={listing.plateNumber ?? undefined}
          askingPrice={listing.price}
        />

        {/* Card: Price analysis — locked via FEATURE_AVAILABILITY['price_analytics'] */}
        <PremiumGate locked={!canSeePriceAnalytics} featureName="ניתוח מחיר">
          <PriceAnalysisCard
            price={listing.price}
            brand={listing.brand}
            model={listing.model}
            year={listing.year}
            mileage={listing.mileage}
            marketAvgPrice={listing.marketAvgPrice}
            dealTag={listing.dealTag}
          />
        </PremiumGate>

        {/* Full cost breakdown chart — locked via FEATURE_AVAILABILITY['full_cost_breakdown'] */}
        <PremiumGate locked={!canSeeFullBreakdown} featureName="פירוט עלויות מלא">
          <CostBreakdownChart breakdown={costBreakdown} />
        </PremiumGate>

        {/* Card 5: Seller */}
        <div className="bg-surface-container rounded-3xl p-5">
          <h2 className="text-on-surface font-bold text-base text-right mb-4">המוכר</h2>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-surface-container-high flex items-center justify-center text-2xl font-bold text-primary flex-shrink-0">
              {listing.seller?.name?.charAt(0) ?? '?'}
            </div>
            <div className="text-right flex-1">
              <p className="text-on-surface font-bold">{listing.seller?.name}</p>
              <p className="text-on-surface-variant text-xs">
                מפרסם מאז{' '}
                {new Date(listing.seller?.createdAt ?? '').toLocaleDateString('he-IL', {
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Image gallery */}
        {listing.images.length > 1 && (
          <div>
            <h2 className="text-on-surface font-bold text-base text-right mb-3">גלריה</h2>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {listing.images.map((img, i) => (
                <div
                  key={img.id}
                  className={`flex-shrink-0 w-32 h-24 rounded-2xl overflow-hidden border-2 ${
                    i === 0 ? 'border-primary' : 'border-transparent'
                  }`}
                >
                  <Image
                    src={img.path}
                    alt={`תמונה ${i + 1}`}
                    width={128}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky bottom CTA */}
      {session?.user && session.user.id !== listing.sellerId && (
        <div
          className="fixed bottom-0 left-0 right-0 bg-surface-container-lowest/95 backdrop-blur-xl border-t border-outline-variant/20 px-5 py-4"
          style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
        >
          <div className="flex gap-3">
            {listing.seller?.phone && (
              <a href={`tel:${listing.seller.phone}`}>
                <button className="border border-outline-variant/40 text-on-surface font-semibold rounded-2xl py-4 px-5 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  חייג
                </button>
              </a>
            )}
            <Link href={`/messages?listingId=${listing.id}`} className="flex-1">
              <button className="w-full bg-primary text-on-primary font-bold rounded-2xl py-4 flex items-center justify-center gap-2">
                <MessageCircle className="w-4 h-4" />
                שלח הודעה למוכר
              </button>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
