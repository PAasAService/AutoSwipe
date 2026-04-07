// AutoSwipe — Shared TypeScript types

export type UserRole = 'BUYER' | 'SELLER'

export type FuelType =
  | 'GASOLINE'
  | 'DIESEL'
  | 'HYBRID'
  | 'ELECTRIC'
  | 'PLUG_IN_HYBRID'

export type VehicleType =
  | 'SEDAN'
  | 'SUV'
  | 'HATCHBACK'
  | 'COUPE'
  | 'CONVERTIBLE'
  | 'MINIVAN'
  | 'PICKUP'
  | 'WAGON'
  | 'CROSSOVER'

export type Transmission = 'AUTOMATIC' | 'MANUAL'

export type ListingStatus = 'ACTIVE' | 'SOLD' | 'PAUSED' | 'DELETED'

export type SwipeDirection = 'LEFT' | 'RIGHT' | 'SUPER'

export type DealTag =
  | 'GREAT_DEAL'
  | 'BELOW_MARKET'
  | 'FAIR_PRICE'
  | 'ABOVE_MARKET'
  | 'NEW_LISTING'
  | 'PRICE_DROP'

export type BehaviorType =
  | 'VIEW'
  | 'SWIPE_LEFT'
  | 'SWIPE_RIGHT'
  | 'SAVE'
  | 'OPEN_DETAIL'
  | 'MESSAGE_SELLER'
  | 'COMPARE'
  | 'SHARE'

// ─── USER ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string
  email: string
  name: string
  roles: UserRole[]
  avatarUrl?: string
  phone?: string
  isVerified: boolean
  isOnboarded: boolean
  createdAt: string
}

export interface BuyerPreferences {
  id: string
  userId: string
  budgetMin?: number
  budgetMax: number
  preferredBrands: string[]
  preferredModels: string[]
  fuelPreferences: FuelType[]
  vehicleTypes: VehicleType[]
  location: string
  searchRadius: number
  ownershipYears: number
}

// ─── LISTINGS ─────────────────────────────────────────────────────────────────

export interface ListingImage {
  id: string
  url: string
  order: number
  isPrimary: boolean
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
  // Government verification
  plateNumber?: string
  isGovVerified: boolean
  govVerifiedAt?: string
  pollutionGroup?: number
  images: ListingImage[]
  viewCount: number
  likeCount: number
  createdAt: string
  updatedAt: string
}

export interface SellerInfo {
  id: string
  name: string
  avatarUrl?: string
  phone?: string
  createdAt: string
}

// ─── SWIPE ────────────────────────────────────────────────────────────────────

export interface SwipeAction {
  id: string
  userId: string
  listingId: string
  direction: SwipeDirection
  createdAt: string
}

// ─── FAVORITES ────────────────────────────────────────────────────────────────

export interface Favorite {
  id: string
  userId: string
  listingId: string
  listing: CarListing
  createdAt: string
}

// ─── MESSAGING ────────────────────────────────────────────────────────────────

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
  createdAt: string
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

// ─── RECOMMENDATION ───────────────────────────────────────────────────────────

export interface MatchScore {
  total: number       // 0-100
  budgetFit: number   // 0-100
  modelMatch: number  // 0-100
  locationProx: number// 0-100
  brandMatch: number  // 0-100
  behaviorBoost: number // bonus from learned signals
}

export interface FeedListing extends CarListing {
  matchScore: number
  matchBreakdown: MatchScore
}

// ─── PRICE INTELLIGENCE ───────────────────────────────────────────────────────

export interface MarketPriceEstimate {
  /** Mileage-adjusted point estimate */
  estimate: number
  /** Lower bound of "fair price" range */
  rangeLow: number
  /** Upper bound of "fair price" range */
  rangeHigh: number
  /** How reliable the estimate is */
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  /** Data source used */
  source: 'DB' | 'HEURISTIC'
  /** Signed ratio: how much mileage shifted the estimate (e.g. +0.05 = 5% up) */
  mileageAdjustment: number
}

// ─── COST OF OWNERSHIP ────────────────────────────────────────────────────────

export interface CostBreakdown {
  monthly: number
  depreciation: number
  fuel: number
  insurance: number
  maintenance: number
  capitalCost: number
  total: number
  perYear: number
}

// ─── API RESPONSES ────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// ─── FORM TYPES ───────────────────────────────────────────────────────────────

export interface CreateListingInput {
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
  description?: string
  images: string[] // URLs after upload
  plateNumber?: string
  isGovVerified?: boolean
}

export interface LoginInput {
  email: string
  password: string
}

export interface SignupInput {
  name: string
  email: string
  password: string
  roles: UserRole[]
}
