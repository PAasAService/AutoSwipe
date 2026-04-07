# AutoSwipe — Database schema & feature map

This document describes the **Prisma data model** (SQLite in dev; use Postgres in production) and how **product features** read or write those tables. The repo has two clients: **`autoswipe`** (Next.js web + API) and **`autoswipe-native`** (Expo); both call the same `/api/*` routes.

---

## 1. Full database schema

Source of truth: `autoswipe/prisma/schema.prisma`. Below is a verbatim copy.

```prisma
// AutoSwipe — Prisma Schema
// String "enums" (status, ReportCategory, etc.) documented in src/lib/domain-enums.ts

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// NOTE: SQLite does not support native array types.
// Array fields (roles, preferredBrands, etc.) are stored as
// JSON-encoded strings and parsed/serialized in application code.

model User {
  id                 String    @id @default(cuid())
  email              String    @unique
  name               String
  passwordHash       String? // null for SSO-only users
  roles              String    @default("[]")
  avatarUrl          String?
  phone              String?
  isVerified         Boolean   @default(false)
  phoneVerified      Boolean   @default(false)
  isOnboarded        Boolean   @default(false)
  hasCompletedCarousel Boolean @default(false)
  termsAcceptedAt    DateTime?
  messagingMode      String    @default("OPEN") // OPEN | BUMBLE
  emailNotifications Boolean   @default(true)
  emailFrequency     String    @default("IMMEDIATE")
  pushNotifications  Boolean   @default(true)
  /// JSON: { messages, matches, priceDrops, listingStatus } booleans
  notificationPrefs  String    @default("{}")
  lastActiveAt       DateTime  @default(now())
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt

  buyerPreferences BuyerPreferences?
  listings         CarListing[]
  swipeActions     SwipeAction[]
  favorites        Favorite[]
  sentMessages     Message[]
  buyerThreads     MessageThread[] @relation("BuyerThreads")
  sellerThreads    MessageThread[] @relation("SellerThreads")
  behaviorLogs     UserBehavior[]
  learnedSignals   LearnedSignal[]
  passwordResets   PasswordResetToken[]
  oauthAccounts    OAuthAccount[]
  reportsFiled     Report[]        @relation("ReportReporter")
  reportsAgainst   Report[]        @relation("ReportTargetUser")
  blocksInitiated  UserBlock[]     @relation("UserBlockBlocker")
  blocksReceived   UserBlock[]     @relation("UserBlockBlocked")
  listingWaitlist  ListingWaitlist[]

  @@index([email])
}

/// SSO linkage (Google, Apple, …)
model OAuthAccount {
  id                  String   @id @default(cuid())
  userId              String
  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  provider            String // google | apple
  providerAccountId   String
  accessToken         String?
  refreshToken        String?
  expiresAt           DateTime?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@unique([provider, providerAccountId])
  @@index([userId])
}

model BuyerPreferences {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  budgetMin       Int?
  budgetMax       Int
  preferredBrands String   @default("[]")
  preferredModels String   @default("[]")
  fuelPreferences String   @default("[]")
  vehicleTypes    String   @default("[]")
  location        String   @default("")
  searchRadius    Int      @default(50)
  ownershipYears  Int      @default(3)
  yearFrom        Int?
  yearTo          Int?
  mileageMin      Int?
  mileageMax      Int?

  updatedAt       DateTime @updatedAt

  @@index([userId])
}

model CarListing {
  id                  String    @id @default(cuid())
  sellerId            String
  seller              User      @relation(fields: [sellerId], references: [id], onDelete: Cascade)

  brand               String
  model               String
  year                Int
  mileage             Int
  price               Int
  location            String
  latitude            Float?
  longitude           Float?
  fuelType            String
  fuelConsumption     Float
  vehicleType         String
  transmission        String    @default("AUTOMATIC")
  engineSize          Float?
  color               String?
  doors               Int?
  seats               Int?
  vin                 String?

  // ── Government verification ──────────────────────────────────────────────
  plateNumber         String? // license plate stored for display only (no personal data)
  isGovVerified       Boolean   @default(false)
  govVerifiedAt       DateTime?
  pollutionGroup      Int? // kvutzat_zihum from gov API (1–15, lower = cleaner)

  insuranceEstimate   Int
  maintenanceEstimate Int
  depreciationRate    Float

  monthlyCost         Float?
  marketAvgPrice      Int?
  priceVsMarket       Float?
  dealTag             String?
  description         String?
  whySelling          String?
  equipmentJson       String    @default("[]")
  monthlyCostsJson    String? // seller overrides for monthly cost UI (JSON)
  /// Per-listing override of seller default: OPEN | BUMBLE | null = use User.messagingMode
  listingMessagingMode String?

  /// DRAFT | PENDING_REVIEW | ACTIVE | PAUSED | SOLD | EXPIRED | REJECTED
  status              String    @default("ACTIVE")
  publishedAt         DateTime?
  expiresAt           DateTime?
  soldAt              DateTime?
  moderationNote      String?

  viewCount           Int       @default(0)
  likeCount           Int       @default(0)
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  images       ListingImage[]
  swipeActions SwipeAction[]
  favorites    Favorite[]
  threads      MessageThread[]
  behaviorLogs UserBehavior[]
  waitlist          ListingWaitlist[]
  reports           Report[]
  promotedCampaigns PromotedListing[]
  sellerReviews     SellerReview[]

  @@index([sellerId])
  @@index([status])
  @@index([publishedAt])
  @@index([expiresAt])
  @@index([brand, model, year])
  @@index([location])
  @@index([price])
  @@index([createdAt])
}

model ListingImage {
  id        String     @id @default(cuid())
  listingId String
  listing   CarListing @relation(fields: [listingId], references: [id], onDelete: Cascade)
  url       String
  publicId  String?
  order     Int        @default(0)
  isPrimary Boolean    @default(false)
  createdAt DateTime   @default(now())

  @@index([listingId])
}

model SwipeAction {
  id        String     @id @default(cuid())
  userId    String
  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  listingId String
  listing   CarListing @relation(fields: [listingId], references: [id], onDelete: Cascade)
  direction String
  createdAt DateTime   @default(now())

  @@unique([userId, listingId])
  @@index([userId])
  @@index([listingId])
}

model Favorite {
  id             String     @id @default(cuid())
  userId         String
  user           User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  listingId      String
  listing        CarListing @relation(fields: [listingId], references: [id], onDelete: Cascade)
  lastKnownPrice Int?
  createdAt      DateTime   @default(now())

  @@unique([userId, listingId])
  @@index([userId])
}

model MessageThread {
  id                 String     @id @default(cuid())
  buyerId            String
  buyer              User       @relation("BuyerThreads", fields: [buyerId], references: [id])
  sellerId           String
  seller             User       @relation("SellerThreads", fields: [sellerId], references: [id])
  listingId          String
  listing            CarListing @relation(fields: [listingId], references: [id])
  lastMessage        String?
  lastMessageAt      DateTime?
  buyerUnread        Int        @default(0)
  sellerUnread       Int        @default(0)
  /// Count of messages sent by the buyer (OPEN mode: max 3 before seller reply policy — product rule)
  buyerMessageCount  Int        @default(0)
  /// BUMBLE: seller must send first meaningful contact
  sellerStartedChat  Boolean    @default(false)
  /// OPEN: after seller replies, buyer is no longer limited to 3 messages
  openBuyerCapCleared Boolean   @default(false)
  waitlistNotified   Boolean    @default(false)
  createdAt          DateTime   @default(now())
  updatedAt          DateTime   @updatedAt

  messages Message[]

  @@unique([buyerId, sellerId, listingId])
  @@index([buyerId])
  @@index([sellerId])
}

model Message {
  id        String        @id @default(cuid())
  threadId  String
  thread    MessageThread @relation(fields: [threadId], references: [id], onDelete: Cascade)
  senderId  String
  sender    User          @relation(fields: [senderId], references: [id])
  text      String
  isRead    Boolean       @default(false)
  createdAt DateTime      @default(now())

  @@index([threadId])
}

model UserBehavior {
  id          String     @id @default(cuid())
  userId      String
  user        User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  listingId   String
  listing     CarListing @relation(fields: [listingId], references: [id], onDelete: Cascade)
  action      String
  durationSec Int?
  createdAt   DateTime   @default(now())

  @@index([userId])
}

model LearnedSignal {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  dimension    String
  score        Float    @default(0)
  interactions Int      @default(0)
  updatedAt    DateTime @updatedAt

  @@unique([userId, dimension])
  @@index([userId])
}

model MarketPrice {
  id         String   @id @default(cuid())
  brand      String
  model      String
  year       Int
  avgPrice   Int
  sampleSize Int      @default(0)
  updatedAt  DateTime @updatedAt

  @@unique([brand, model, year])
}

/// Buyers interested while listing is PAUSED
model ListingWaitlist {
  id        String     @id @default(cuid())
  listingId String
  listing   CarListing @relation(fields: [listingId], references: [id], onDelete: Cascade)
  userId    String
  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime   @default(now())

  @@unique([listingId, userId])
  @@index([listingId])
  @@index([userId])
}

/// User reports (listing or user)
model Report {
  id               String     @id @default(cuid())
  reporterId       String
  reporter         User       @relation("ReportReporter", fields: [reporterId], references: [id], onDelete: Cascade)
  targetListingId  String?
  targetListing    CarListing? @relation(fields: [targetListingId], references: [id], onDelete: SetNull)
  targetUserId     String?
  targetUser       User?      @relation("ReportTargetUser", fields: [targetUserId], references: [id], onDelete: SetNull)
  category         String // FAKE_PHOTO, SCAM, SPAM, ...
  details          String?
  status           String     @default("OPEN") // OPEN | REVIEWED | DISMISSED | ACTIONED
  createdAt        DateTime   @default(now())
  updatedAt        DateTime   @updatedAt
  resolvedAt       DateTime?

  @@index([status, createdAt])
  @@index([reporterId])
}

model UserBlock {
  id        String   @id @default(cuid())
  blockerId String
  blockedId String
  blocker   User     @relation("UserBlockBlocker", fields: [blockerId], references: [id], onDelete: Cascade)
  blocked   User     @relation("UserBlockBlocked", fields: [blockedId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@unique([blockerId, blockedId])
  @@index([blockerId])
  @@index([blockedId])
}

/// Recommended tab: guides / articles
model ContentArticle {
  id          String    @id @default(cuid())
  slug        String    @unique
  title       String
  excerpt     String?
  body        String    @default("")
  coverUrl    String?
  category    String?
  readTimeMin Int?
  publishedAt DateTime?
  isPublished Boolean   @default(false)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([isPublished, publishedAt])
}

/// Curated links (services, gov, gadgets)
model ExternalLink {
  id        String   @id @default(cuid())
  section   String // SERVICES | GOV | GADGETS
  title     String
  url       String
  iconKey   String?
  region    String?
  sortOrder Int      @default(0)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([section, isActive, sortOrder])
}

model AppBanner {
  id        String    @id @default(cuid())
  message   String
  startsAt  DateTime?
  endsAt    DateTime?
  audience  String    @default("ALL") // ALL | BUYERS | SELLERS
  isActive  Boolean   @default(true)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

// ─── Monetization (optional; define early to avoid migrations later) ─────────

model Partner {
  id             String   @id @default(cuid())
  name           String
  category       String
  logoUrl        String?
  commissionNote String? // human-readable; X ₪ / X %
  active         Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  clicks PartnerClick[]
}

model PartnerClick {
  id        String   @id @default(cuid())
  partnerId String
  partner   Partner  @relation(fields: [partnerId], references: [id], onDelete: Cascade)
  userId    String?
  metadata  String? // JSON
  createdAt DateTime @default(now())

  @@index([partnerId, createdAt])
}

model PromotedListing {
  id                 String     @id @default(cuid())
  listingId          String
  listing            CarListing @relation(fields: [listingId], references: [id], onDelete: Cascade)
  startsAt           DateTime
  endsAt             DateTime
  budgetDailyCents   Int        @default(0)
  impressions        Int        @default(0)
  clicks             Int        @default(0)
  createdAt          DateTime   @default(now())
  updatedAt          DateTime   @updatedAt

  @@index([listingId])
  @@index([endsAt])
}

model SellerReview {
  id        String     @id @default(cuid())
  sellerId  String
  buyerId   String
  listingId String
  listing   CarListing @relation(fields: [listingId], references: [id], onDelete: Cascade)
  rating    Int
  comment   String?
  createdAt DateTime   @default(now())

  @@index([sellerId])
  @@index([listingId])
}

// ─── VALUATION ENGINE TABLES ──────────────────────────────────────────────────

model VehicleTechnicalRecord {
  id             String   @id @default(cuid())
  plateNumber    String   @unique
  brand          String
  model          String
  trimLevel      String?
  year           Int
  engineVolumeCc Int?
  fuelType       String?
  vehicleType    String?
  ownershipType  String?
  pollutionGroup Int?
  safetyRating   Int?
  firstRoadDate  String?
  rawJson        String
  fetchedAt      DateTime @default(now())
  expiresAt      DateTime

  @@index([brand, model, year])
  @@index([expiresAt])
}

model MarketDataPoint {
  id              String   @id @default(cuid())
  brand           String
  model           String
  trimLevel       String?
  year            Int
  mileage         Int?
  price           Int
  fuelType        String?
  location        String?
  ownershipType   String?
  source          String
  sourceListingId String?
  collectedAt     DateTime @default(now())

  @@index([brand, model, year])
  @@index([collectedAt])
  @@index([source])
}

model ValuationResult {
  id             String   @id @default(cuid())
  cacheKey       String   @unique
  plateNumber    String?
  brand          String
  model          String
  trimLevel      String?
  year           Int
  mileage        Int?
  ownershipType  String?
  quickSalePrice Int
  averagePrice   Int
  premiumPrice   Int
  confidence     String
  sampleSize     Int
  insights       String
  adjustments    String
  priceStatus    String?
  createdAt      DateTime @default(now())
  expiresAt      DateTime

  @@index([plateNumber])
  @@index([brand, model, year])
  @@index([expiresAt])
}

model PasswordResetToken {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token     String   @unique
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime @default(now())

  @@index([token])
  @@index([userId])
}

model VehicleAlias {
  id         String  @id @default(cuid())
  field      String
  alias      String
  canonical  String
  confidence Float   @default(1.0)

  @@unique([field, alias])
  @@index([field])
  @@index([canonical])
}
```


---

## 2. Features and database impact

Legend: **R** = read, **C** = create, **U** = update, **D** = delete.

### Authentication & identity

| Feature | Where (API / UI) | DB tables & effect |
|--------|-------------------|---------------------|
| Email/password register | `POST /api/auth/register` | **User** C (`passwordHash`, `roles` JSON); JWT issued. |
| Email/password login | `POST /api/auth/credentials` | **User** R (verify password). |
| Google / Apple SSO | `POST /api/auth/oauth` | **User** C or link; **OAuthAccount** C (`provider`, `providerAccountId`). |
| NextAuth (web sessions) | `/api/auth/[...nextauth]` | Session / **User** per NextAuth config. |
| Forgot / reset password | `POST /api/auth/forgot-password`, `reset-password` | **User** R; **PasswordResetToken** C/U/D; **User** U `passwordHash` on reset. |

### Profile & settings

| Feature | Where | DB tables & effect |
|--------|--------|---------------------|
| Current user | `GET/PATCH /api/users/me` | **User** R/U (profile, onboarding, messaging mode, notifications, password). |
| Buyer search preferences | `GET/PUT /api/users/preferences` | **BuyerPreferences** R/U/C (one row per user). |
| Notification prefs | `GET/PUT /api/users/notifications` | **User** U (`notificationPrefs`, email/push flags). |

### Listings (seller & catalog)

| Feature | Where | DB tables & effect |
|--------|--------|---------------------|
| Create listing | `POST /api/listings` | **CarListing** C; **ListingImage** C; async **MarketDataPoint** via `syncListingToMarketData`. |
| Browse / filter | `GET /api/listings` | **CarListing** R. |
| Listing detail | `GET /api/listings/[id]` | **CarListing** R. |
| Edit / pause / sold | `PATCH /api/listings/[id]` | **CarListing** U. |
| Delete listing | `DELETE /api/listings/[id]` | **CarListing** D (cascades per schema). |
| Seller “mine” | `GET /api/listings?mine=true` | **CarListing** R by `sellerId`. |

### Swipe feed & recommendations

| Feature | Where | DB tables & effect |
|--------|--------|---------------------|
| Personalized feed | `GET /api/recommendations` → `buildFeed` | **BuyerPreferences** R; **SwipeAction** R (seen ids); **LearnedSignal** R; **CarListing** R (candidate pool). Scoring is in-memory ordering. |

### Swipes & favorites

| Feature | Where | DB tables & effect |
|--------|--------|---------------------|
| Swipe | `POST /api/swipes` | **SwipeAction** upsert; **LearnedSignal** upsert (from listing attributes); **Favorite** upsert on RIGHT/SUPER; **CarListing** `likeCount` U if new favorite; **UserBehavior** C. |
| Clear swipes | `DELETE /api/swipes` | **SwipeAction** D for user. |
| Favorites | `GET/POST/DELETE /api/favorites` | **Favorite** C/U/D; **CarListing** `likeCount` adjusted on POST/DELETE. |

### Messaging

| Feature | Where | DB tables & effect |
|--------|--------|---------------------|
| Thread list | `GET /api/messages` | **MessageThread** R (+ relations). |
| Start / send | `POST /api/messages` | **MessageThread** C/U; **Message** C; **LearnedSignal** U on new thread (`MESSAGE_SELLER`). |
| Thread detail | `GET/POST /api/messages/[threadId]` | **Message** C; **MessageThread** U (unread, caps, etc.). |

### Safety & moderation

| Feature | Where | DB tables & effect |
|--------|--------|---------------------|
| Report | `POST /api/reports` | **Report** C. |
| Block user | `POST /api/users/block` | **UserBlock** C. |
| Admin moderation | `GET` `/api/admin/moderation/*` | **Report**, **CarListing** R/U. |

### Waitlist & cron

| Feature | Where | DB tables & effect |
|--------|--------|---------------------|
| Waitlist (paused listing) | `POST /api/listings/[id]/waitlist` | **ListingWaitlist** C. |
| Price alerts | `GET /api/cron/price-alerts` | **Favorite** U `lastKnownPrice`; reads **CarListing** price. |
| Expire listings | `GET /api/cron/expire-listings` | **CarListing** U lifecycle fields. |

### Valuation & vehicle APIs

| Feature | Where | DB tables & effect |
|--------|--------|---------------------|
| Valuation | `GET /api/valuation` | **ValuationResult** cache R/C/U; **VehicleTechnicalRecord**, **MarketDataPoint** per engine. |
| Vehicle lookup / specs / AI pricing | `GET /api/vehicle-lookup`, `vehicle-specs`, `ai-pricing` | Reads/writes per route implementation (often **VehicleTechnicalRecord**, **MarketPrice**). |

### Uploads & AI

| Feature | Where | DB tables & effect |
|--------|--------|---------------------|
| Signed upload | `POST /api/upload/sign` | No DB (URLs stored in **ListingImage** on create). |
| AI description | `POST /api/ai-description` | May **CarListing** U `description`. |

### Schema models with limited / no API wiring yet

| Models | Notes |
|--------|--------|
| **ContentArticle**, **ExternalLink**, **AppBanner** | CMS / banners — defined for future admin or web; native “Recommended” tab currently uses static `src/data/recommended`. |
| **Partner**, **PartnerClick**, **PromotedListing**, **SellerReview** | Monetization / reviews — schema ready; wire when features ship. |
| **MarketPrice** | Reference pricing; used by intelligence helpers, not always direct route CRUD. |
| **VehicleAlias** | Normalization map for valuation / imports. |

### Native app screen map (same APIs)

| Area | Screens | APIs |
|------|---------|------|
| Auth | `login`, `signup`, `gate`, `forgot-password` | `/api/auth/*` |
| Onboarding | `(onboarding)/index` | `/api/users/me`, `/api/users/preferences` |
| Tabs | `swipe`, `explore`, `favorites`, `messages`, `recommended`, `dashboard` | `/api/recommendations`, `/api/listings`, `/api/favorites`, `/api/messages`, `/api/swipes` |
| Listing | `listing/[id]`, `listing/create` | `/api/listings`, `/api/upload/sign`, vehicle & AI routes |
| Settings | `settings/*` | `/api/users/me`, `preferences`, `notifications` |

---

## 3. How the pieces fit together

- **Identity:** **User** + optional **OAuthAccount**; **PasswordResetToken** for email reset flows.
- **Stated buyer intent:** **BuyerPreferences** (explicit filters and budget).
- **Implicit taste:** **LearnedSignal** (updated from swipes and messaging), combined in `scoreListing`.
- **Inventory & engagement:** **CarListing**, **ListingImage**, **SwipeAction**, **Favorite**, **UserBehavior**.
- **Conversations:** **MessageThread**, **Message** (OPEN/BUMBLE policy fields on threads).
- **Trust & ops:** **Report**, **UserBlock**; cron jobs touch **Favorite** and **CarListing**.
- **Valuation stack:** **VehicleTechnicalRecord**, **MarketDataPoint**, **ValuationResult**, **VehicleAlias**.

---

*Document generated for the AutoSwipe monorepo. When `prisma/schema.prisma` changes, refresh section 1 from that file or re-run the doc build.*
