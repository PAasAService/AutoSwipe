-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MessageThread" (
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
    "isSuperLike" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "initiatedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MessageThread_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MessageThread_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MessageThread_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "CarListing" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_MessageThread" ("buyerId", "buyerMessageCount", "buyerUnread", "createdAt", "id", "lastMessage", "lastMessageAt", "listingId", "openBuyerCapCleared", "sellerId", "sellerStartedChat", "sellerUnread", "updatedAt", "waitlistNotified") SELECT "buyerId", "buyerMessageCount", "buyerUnread", "createdAt", "id", "lastMessage", "lastMessageAt", "listingId", "openBuyerCapCleared", "sellerId", "sellerStartedChat", "sellerUnread", "updatedAt", "waitlistNotified" FROM "MessageThread";
DROP TABLE "MessageThread";
ALTER TABLE "new_MessageThread" RENAME TO "MessageThread";
CREATE INDEX "MessageThread_buyerId_idx" ON "MessageThread"("buyerId");
CREATE INDEX "MessageThread_sellerId_idx" ON "MessageThread"("sellerId");
CREATE UNIQUE INDEX "MessageThread_buyerId_sellerId_listingId_key" ON "MessageThread"("buyerId", "sellerId", "listingId");
CREATE TABLE "new_User" (
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
    "superLikesRemaining" INTEGER NOT NULL DEFAULT 10,
    "lastActiveAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("avatarUrl", "createdAt", "email", "emailFrequency", "emailNotifications", "hasCompletedCarousel", "id", "isOnboarded", "isVerified", "lastActiveAt", "messagingMode", "name", "notificationPrefs", "passwordHash", "phone", "phoneVerified", "pushNotifications", "roles", "termsAcceptedAt", "updatedAt") SELECT "avatarUrl", "createdAt", "email", "emailFrequency", "emailNotifications", "hasCompletedCarousel", "id", "isOnboarded", "isVerified", "lastActiveAt", "messagingMode", "name", "notificationPrefs", "passwordHash", "phone", "phoneVerified", "pushNotifications", "roles", "termsAcceptedAt", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_email_idx" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
