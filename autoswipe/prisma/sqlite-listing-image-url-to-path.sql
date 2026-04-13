-- One-time SQLite fix when Prisma schema drops ListingImage.url / publicId for `path`.
-- Run: sqlite3 prisma/dev.db < prisma/sqlite-listing-image-url-to-path.sql
-- Then: npx prisma db push && npx prisma generate

BEGIN TRANSACTION;
ALTER TABLE ListingImage ADD COLUMN path TEXT;
UPDATE ListingImage SET path = url;
ALTER TABLE ListingImage DROP COLUMN url;
ALTER TABLE ListingImage DROP COLUMN publicId;
COMMIT;
