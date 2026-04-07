export type FuelType = 'GASOLINE' | 'DIESEL' | 'HYBRID' | 'ELECTRIC' | 'PLUG_IN_HYBRID'
export type VehicleType = 'SEDAN' | 'SUV' | 'HATCHBACK' | 'COUPE' | 'CONVERTIBLE' | 'MINIVAN' | 'PICKUP' | 'WAGON' | 'CROSSOVER'
export type Transmission = 'AUTOMATIC' | 'MANUAL'
export type ListingStatus = 'ACTIVE' | 'SOLD' | 'PAUSED' | 'DELETED'
export type SwipeDirection = 'LEFT' | 'RIGHT' | 'SUPER'
export type DealTag = 'GREAT_DEAL' | 'BELOW_MARKET' | 'FAIR_PRICE' | 'ABOVE_MARKET' | 'NEW_LISTING' | 'PRICE_DROP'

export interface ListingImage {
  id: string
  url: string
  order: number
  isPrimary: boolean
}

export interface SellerInfo {
  id: string
  name: string
  avatarUrl?: string
  phone?: string
}

export interface MatchScore {
  total: number
  budget: number
  brand: number
  location: number
  fuel: number
  vehicleType: number
}

export interface CarListing {
  id: string
  sellerId: string
  seller?: SellerInfo
  brand: string
  model: string
  year: number
  mileage: number
  price: number
  location: string
  fuelType: FuelType
  fuelConsumption: number
  vehicleType: VehicleType
  transmission: Transmission
  engineSize?: number
  color?: string
  doors?: number
  seats?: number
  insuranceEstimate: number
  maintenanceEstimate: number
  depreciationRate: number
  monthlyCost?: number
  marketAvgPrice?: number
  priceVsMarket?: number
  dealTag?: DealTag
  matchScore?: number
  description?: string
  status: ListingStatus
  plateNumber?: string
  isGovVerified: boolean
  govVerifiedAt?: string
  pollutionGroup?: number
  images: ListingImage[]
  hand?: number
  testExpiry?: string
  roadEntryDate?: string
  horsepower?: number
  equipment?: string[]
  currentOwnershipType?: string
  previousOwnershipType?: string
  messagingMode?: 'OPEN' | 'SELLER_FIRST'
  buyerMessageLimit?: number
  viewCount: number
  likeCount: number
  createdAt: string
  updatedAt: string
}

export interface FeedListing extends CarListing {
  matchScore: number
  matchBreakdown: MatchScore
}

export interface MessageThread {
  id: string
  buyerId: string
  buyer: { id: string; name: string; avatarUrl?: string }
  sellerId: string
  seller: { id: string; name: string; avatarUrl?: string }
  listingId: string
  listing: { id: string; brand: string; model: string; year: number; images: ListingImage[] }
  lastMessage?: string
  lastMessageAt?: string
  buyerUnread: number
  sellerUnread: number
  buyerMessageCount: number
  /** Server cap (e.g. OPEN marketplace); omit to use client default. */
  buyerMessageLimit?: number
  sellerHasReplied: boolean
}

export interface Message {
  id: string
  threadId: string
  senderId: string
  sender: { id: string; name: string; avatarUrl?: string }
  text: string
  isRead: boolean
  createdAt: string
}

export interface User {
  id: string
  email: string
  name: string
  avatarUrl?: string
  phone?: string
  roles: string[]
  isVerified: boolean
  isOnboarded: boolean
}

export interface BuyerPreferences {
  budgetMin: number
  budgetMax: number
  preferredBrands: string[]
  preferredModels: string[]
  fuelPreferences: FuelType[]
  vehicleTypes: VehicleType[]
  location: string
  searchRadius: number
  ownershipYears: number
}

export interface RecommendationsResponse {
  data: FeedListing[]
  page: number
  hasMore: boolean
}
