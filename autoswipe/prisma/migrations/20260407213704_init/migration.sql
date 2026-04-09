-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT,
    "roles" TEXT NOT NULL DEFAULT '[]',
    "avatarUrl" TEXT,
    "phone" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "isOnboarded" BOOLEAN NOT NULL DEFAULT false,
    "hasCompletedCarousel" BOOLEAN NOT NULL DEFAULT false,
    "termsAcceptedAt" DATETIME,
    "messagingMode" TEXT NOT NULL DEFAULT 'OPEN',
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "emailFrequency" TEXT NOT NULL DEFAULT 'IMMEDIATE',
    "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
    "notificationPrefs" TEXT NOT NULL DEFAULT '{}',
    "lastActiveAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "OAuthAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OAuthAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BuyerPreferences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "budgetMin" INTEGER,
    "budgetMax" INTEGER NOT NULL,
    "preferredBrands" TEXT NOT NULL DEFAULT '[]',
    "preferredModels" TEXT NOT NULL DEFAULT '[]',
    "fuelPreferences" TEXT NOT NULL DEFAULT '[]',
    "vehicleTypes" TEXT NOT NULL DEFAULT '[]',
    "location" TEXT NOT NULL DEFAULT '',
    "searchRadius" INTEGER NOT NULL DEFAULT 50,
    "ownershipYears" INTEGER NOT NULL DEFAULT 3,
    "yearFrom" INTEGER,
    "yearTo" INTEGER,
    "mileageMin" INTEGER,
    "mileageMax" INTEGER,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BuyerPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CarListing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sellerId" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "mileage" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "location" TEXT NOT NULL,
    "latitude" REAL,
    "longitude" REAL,
    "fuelType" TEXT NOT NULL,
    "fuelConsumption" REAL NOT NULL,
    "vehicleType" TEXT NOT NULL,
    "transmission" TEXT NOT NULL DEFAULT 'AUTOMATIC',
    "engineSize" REAL,
    "color" TEXT,
    "doors" INTEGER,
    "seats" INTEGER,
    "vin" TEXT,
    "plateNumber" TEXT,
    "isGovVerified" BOOLEAN NOT NULL DEFAULT false,
    "govVerifiedAt" DATETIME,
    "pollutionGroup" INTEGER,
    "insuranceEstimate" INTEGER NOT NULL,
    "maintenanceEstimate" INTEGER NOT NULL,
    "depreciationRate" REAL NOT NULL,
    "monthlyCost" REAL,
    "marketAvgPrice" INTEGER,
    "priceVsMarket" REAL,
    "dealTag" TEXT,
    "description" TEXT,
    "whySelling" TEXT,
    "equipmentJson" TEXT NOT NULL DEFAULT '[]',
    "monthlyCostsJson" TEXT,
    "listingMessagingMode" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "publishedAt" DATETIME,
    "expiresAt" DATETIME,
    "soldAt" DATETIME,
    "moderationNote" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CarListing_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ListingImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listingId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ListingImage_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "CarListing" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SwipeAction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SwipeAction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SwipeAction_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "CarListing" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "lastKnownPrice" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Favorite_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "CarListing" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MessageThread" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "lastMessage" TEXT,
    "lastMessageAt" DATETIME,
    "buyerUnread" INTEGER NOT NULL DEFAULT 0,
    "sellerUnread" INTEGER NOT NULL DEFAULT 0,
    "buyerMessageCount" INTEGER NOT NULL DEFAULT 0,
    "sellerStartedChat" BOOLEAN NOT NULL DEFAULT false,
    "openBuyerCapCleared" BOOLEAN NOT NULL DEFAULT false,
    "waitlistNotified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MessageThread_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MessageThread_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MessageThread_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "CarListing" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "threadId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "MessageThread" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserBehavior" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "durationSec" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserBehavior_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserBehavior_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "CarListing" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LearnedSignal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "dimension" TEXT NOT NULL,
    "score" REAL NOT NULL DEFAULT 0,
    "interactions" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LearnedSignal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MarketPrice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "avgPrice" INTEGER NOT NULL,
    "sampleSize" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ListingWaitlist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ListingWaitlist_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "CarListing" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ListingWaitlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reporterId" TEXT NOT NULL,
    "targetListingId" TEXT,
    "targetUserId" TEXT,
    "category" TEXT NOT NULL,
    "details" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "resolvedAt" DATETIME,
    CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Report_targetListingId_fkey" FOREIGN KEY ("targetListingId") REFERENCES "CarListing" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Report_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserBlock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "blockerId" TEXT NOT NULL,
    "blockedId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserBlock_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserBlock_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContentArticle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT,
    "body" TEXT NOT NULL DEFAULT '',
    "coverUrl" TEXT,
    "category" TEXT,
    "readTimeMin" INTEGER,
    "publishedAt" DATETIME,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ExternalLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "section" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "iconKey" TEXT,
    "region" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AppBanner" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "message" TEXT NOT NULL,
    "startsAt" DATETIME,
    "endsAt" DATETIME,
    "audience" TEXT NOT NULL DEFAULT 'ALL',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "logoUrl" TEXT,
    "commissionNote" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PartnerClick" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partnerId" TEXT NOT NULL,
    "userId" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PartnerClick_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PromotedListing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listingId" TEXT NOT NULL,
    "startsAt" DATETIME NOT NULL,
    "endsAt" DATETIME NOT NULL,
    "budgetDailyCents" INTEGER NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PromotedListing_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "CarListing" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SellerReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sellerId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SellerReview_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "CarListing" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VehicleTechnicalRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "plateNumber" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "trimLevel" TEXT,
    "year" INTEGER NOT NULL,
    "engineVolumeCc" INTEGER,
    "fuelType" TEXT,
    "vehicleType" TEXT,
    "ownershipType" TEXT,
    "pollutionGroup" INTEGER,
    "safetyRating" INTEGER,
    "firstRoadDate" TEXT,
    "rawJson" TEXT NOT NULL,
    "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MarketDataPoint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "trimLevel" TEXT,
    "year" INTEGER NOT NULL,
    "mileage" INTEGER,
    "price" INTEGER NOT NULL,
    "fuelType" TEXT,
    "location" TEXT,
    "ownershipType" TEXT,
    "source" TEXT NOT NULL,
    "sourceListingId" TEXT,
    "collectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ValuationResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cacheKey" TEXT NOT NULL,
    "plateNumber" TEXT,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "trimLevel" TEXT,
    "year" INTEGER NOT NULL,
    "mileage" INTEGER,
    "ownershipType" TEXT,
    "quickSalePrice" INTEGER NOT NULL,
    "averagePrice" INTEGER NOT NULL,
    "premiumPrice" INTEGER NOT NULL,
    "confidence" TEXT NOT NULL,
    "sampleSize" INTEGER NOT NULL,
    "insights" TEXT NOT NULL,
    "adjustments" TEXT NOT NULL,
    "priceStatus" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VehicleAlias" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "field" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "canonical" TEXT NOT NULL,
    "confidence" REAL NOT NULL DEFAULT 1.0
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "OAuthAccount_userId_idx" ON "OAuthAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OAuthAccount_provider_providerAccountId_key" ON "OAuthAccount"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "BuyerPreferences_userId_key" ON "BuyerPreferences"("userId");

-- CreateIndex
CREATE INDEX "BuyerPreferences_userId_idx" ON "BuyerPreferences"("userId");

-- CreateIndex
CREATE INDEX "CarListing_sellerId_idx" ON "CarListing"("sellerId");

-- CreateIndex
CREATE INDEX "CarListing_status_idx" ON "CarListing"("status");

-- CreateIndex
CREATE INDEX "CarListing_publishedAt_idx" ON "CarListing"("publishedAt");

-- CreateIndex
CREATE INDEX "CarListing_expiresAt_idx" ON "CarListing"("expiresAt");

-- CreateIndex
CREATE INDEX "CarListing_brand_model_year_idx" ON "CarListing"("brand", "model", "year");

-- CreateIndex
CREATE INDEX "CarListing_location_idx" ON "CarListing"("location");

-- CreateIndex
CREATE INDEX "CarListing_price_idx" ON "CarListing"("price");

-- CreateIndex
CREATE INDEX "CarListing_createdAt_idx" ON "CarListing"("createdAt");

-- CreateIndex
CREATE INDEX "ListingImage_listingId_idx" ON "ListingImage"("listingId");

-- CreateIndex
CREATE INDEX "SwipeAction_userId_idx" ON "SwipeAction"("userId");

-- CreateIndex
CREATE INDEX "SwipeAction_listingId_idx" ON "SwipeAction"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "SwipeAction_userId_listingId_key" ON "SwipeAction"("userId", "listingId");

-- CreateIndex
CREATE INDEX "Favorite_userId_idx" ON "Favorite"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_listingId_key" ON "Favorite"("userId", "listingId");

-- CreateIndex
CREATE INDEX "MessageThread_buyerId_idx" ON "MessageThread"("buyerId");

-- CreateIndex
CREATE INDEX "MessageThread_sellerId_idx" ON "MessageThread"("sellerId");

-- CreateIndex
CREATE UNIQUE INDEX "MessageThread_buyerId_sellerId_listingId_key" ON "MessageThread"("buyerId", "sellerId", "listingId");

-- CreateIndex
CREATE INDEX "Message_threadId_idx" ON "Message"("threadId");

-- CreateIndex
CREATE INDEX "UserBehavior_userId_idx" ON "UserBehavior"("userId");

-- CreateIndex
CREATE INDEX "LearnedSignal_userId_idx" ON "LearnedSignal"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LearnedSignal_userId_dimension_key" ON "LearnedSignal"("userId", "dimension");

-- CreateIndex
CREATE UNIQUE INDEX "MarketPrice_brand_model_year_key" ON "MarketPrice"("brand", "model", "year");

-- CreateIndex
CREATE INDEX "ListingWaitlist_listingId_idx" ON "ListingWaitlist"("listingId");

-- CreateIndex
CREATE INDEX "ListingWaitlist_userId_idx" ON "ListingWaitlist"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ListingWaitlist_listingId_userId_key" ON "ListingWaitlist"("listingId", "userId");

-- CreateIndex
CREATE INDEX "Report_status_createdAt_idx" ON "Report"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Report_reporterId_idx" ON "Report"("reporterId");

-- CreateIndex
CREATE INDEX "UserBlock_blockerId_idx" ON "UserBlock"("blockerId");

-- CreateIndex
CREATE INDEX "UserBlock_blockedId_idx" ON "UserBlock"("blockedId");

-- CreateIndex
CREATE UNIQUE INDEX "UserBlock_blockerId_blockedId_key" ON "UserBlock"("blockerId", "blockedId");

-- CreateIndex
CREATE UNIQUE INDEX "ContentArticle_slug_key" ON "ContentArticle"("slug");

-- CreateIndex
CREATE INDEX "ContentArticle_isPublished_publishedAt_idx" ON "ContentArticle"("isPublished", "publishedAt");

-- CreateIndex
CREATE INDEX "ExternalLink_section_isActive_sortOrder_idx" ON "ExternalLink"("section", "isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "PartnerClick_partnerId_createdAt_idx" ON "PartnerClick"("partnerId", "createdAt");

-- CreateIndex
CREATE INDEX "PromotedListing_listingId_idx" ON "PromotedListing"("listingId");

-- CreateIndex
CREATE INDEX "PromotedListing_endsAt_idx" ON "PromotedListing"("endsAt");

-- CreateIndex
CREATE INDEX "SellerReview_sellerId_idx" ON "SellerReview"("sellerId");

-- CreateIndex
CREATE INDEX "SellerReview_listingId_idx" ON "SellerReview"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleTechnicalRecord_plateNumber_key" ON "VehicleTechnicalRecord"("plateNumber");

-- CreateIndex
CREATE INDEX "VehicleTechnicalRecord_brand_model_year_idx" ON "VehicleTechnicalRecord"("brand", "model", "year");

-- CreateIndex
CREATE INDEX "VehicleTechnicalRecord_expiresAt_idx" ON "VehicleTechnicalRecord"("expiresAt");

-- CreateIndex
CREATE INDEX "MarketDataPoint_brand_model_year_idx" ON "MarketDataPoint"("brand", "model", "year");

-- CreateIndex
CREATE INDEX "MarketDataPoint_collectedAt_idx" ON "MarketDataPoint"("collectedAt");

-- CreateIndex
CREATE INDEX "MarketDataPoint_source_idx" ON "MarketDataPoint"("source");

-- CreateIndex
CREATE UNIQUE INDEX "ValuationResult_cacheKey_key" ON "ValuationResult"("cacheKey");

-- CreateIndex
CREATE INDEX "ValuationResult_plateNumber_idx" ON "ValuationResult"("plateNumber");

-- CreateIndex
CREATE INDEX "ValuationResult_brand_model_year_idx" ON "ValuationResult"("brand", "model", "year");

-- CreateIndex
CREATE INDEX "ValuationResult_expiresAt_idx" ON "ValuationResult"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_token_idx" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE INDEX "VehicleAlias_field_idx" ON "VehicleAlias"("field");

-- CreateIndex
CREATE INDEX "VehicleAlias_canonical_idx" ON "VehicleAlias"("canonical");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleAlias_field_alias_key" ON "VehicleAlias"("field", "alias");
