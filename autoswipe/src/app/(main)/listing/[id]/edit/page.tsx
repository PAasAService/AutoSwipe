import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect, notFound } from 'next/navigation'
import { ListingEditor, type ListingEditorInitial } from '@/components/listing/ListingEditor'

export default async function EditListingPage({ params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session?.user?.id) redirect('/login')

  const listing = await prisma.carListing.findFirst({
    where: {
      id: params.id,
      sellerId: session.user.id,
      status: { not: 'DELETED' },
    },
    include: { images: { orderBy: { order: 'asc' } } },
  })

  if (!listing) notFound()

  const initial: ListingEditorInitial = {
    brand: listing.brand,
    model: listing.model,
    year: listing.year,
    mileage: listing.mileage,
    price: listing.price,
    location: listing.location,
    fuelType: listing.fuelType,
    fuelConsumption: listing.fuelConsumption,
    vehicleType: listing.vehicleType,
    transmission: listing.transmission,
    engineSize: listing.engineSize,
    color: listing.color,
    doors: listing.doors,
    seats: listing.seats,
    insuranceEstimate: listing.insuranceEstimate,
    maintenanceEstimate: listing.maintenanceEstimate,
    depreciationRate: listing.depreciationRate,
    description: listing.description,
    plateNumber: listing.plateNumber,
    isGovVerified: listing.isGovVerified,
    images: listing.images.map((im) => ({ path: im.path, order: im.order })),
  }

  return <ListingEditor mode="edit" listingId={listing.id} initialListing={initial} />
}
