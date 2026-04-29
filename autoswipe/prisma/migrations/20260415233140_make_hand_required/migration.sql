-- Make vehicle hand required for all listings
-- Migration strategy:
-- 1. Set default value (יד 1) for any existing listings with NULL hand
-- 2. Add NOT NULL constraint
-- 3. Rationale: יד 1 (first owner) is the safest default for existing data where hand wasn't tracked

-- Step 1: Update existing NULL values to safe default (יד 1 - first owner)
UPDATE "CarListing" SET "hand" = 1 WHERE "hand" IS NULL;

-- Step 2: Add NOT NULL constraint to hand column
PRAGMA foreign_keys=OFF;
CREATE TABLE "CarListing_new" (
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
    "hand" INTEGER NOT NULL,
    "vin" TEXT,
    "plateNumber" TEXT,
    "isGovVerified" BOOLEAN NOT NULL DEFAULT 0,
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

INSERT INTO "CarListing_new" SELECT * FROM "CarListing";
DROP TABLE "CarListing";
ALTER TABLE "CarListing_new" RENAME TO "CarListing";

CREATE INDEX "CarListing_sellerId_idx" on "CarListing"("sellerId");
CREATE INDEX "CarListing_status_idx" on "CarListing"("status");
PRAGMA foreign_keys=ON;
