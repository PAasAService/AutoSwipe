-- Make User.name unique (שם תצוגה). Dedupe collisions: keep smallest id per name, suffix others with _id.
UPDATE "User"
SET "name" = "name" || '_' || "id"
WHERE "rowid" IN (
  SELECT "u2"."rowid"
  FROM "User" AS "u2"
  INNER JOIN "User" AS "u3" ON "u2"."name" = "u3"."name" AND "u2"."id" > "u3"."id"
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_name_key" ON "User"("name");
