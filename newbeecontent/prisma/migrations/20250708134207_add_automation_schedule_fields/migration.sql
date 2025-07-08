-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Hotel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "travelType" TEXT NOT NULL,
    "audience" TEXT NOT NULL,
    "season" TEXT NOT NULL,
    "events" TEXT NOT NULL,
    "customDomain" TEXT,
    "autoGeneratePosts" BOOLEAN NOT NULL DEFAULT false,
    "autoGenerate" BOOLEAN NOT NULL DEFAULT false,
    "nextScheduledAt" DATETIME,
    "nextSuggestedTitle" TEXT,
    "postFrequency" TEXT,
    "themePreferences" TEXT,
    "maxMonthlyPosts" INTEGER,
    "lastAutoPostAt" DATETIME,
    "themeConfig" TEXT,
    "redeId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Hotel_redeId_fkey" FOREIGN KEY ("redeId") REFERENCES "Rede" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Hotel_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Hotel" ("audience", "autoGeneratePosts", "city", "country", "createdAt", "customDomain", "events", "id", "lastAutoPostAt", "maxMonthlyPosts", "name", "ownerId", "postFrequency", "redeId", "season", "slug", "state", "themeConfig", "themePreferences", "travelType") SELECT "audience", "autoGeneratePosts", "city", "country", "createdAt", "customDomain", "events", "id", "lastAutoPostAt", "maxMonthlyPosts", "name", "ownerId", "postFrequency", "redeId", "season", "slug", "state", "themeConfig", "themePreferences", "travelType" FROM "Hotel";
DROP TABLE "Hotel";
ALTER TABLE "new_Hotel" RENAME TO "Hotel";
CREATE UNIQUE INDEX "Hotel_customDomain_key" ON "Hotel"("customDomain");
CREATE UNIQUE INDEX "Hotel_slug_redeId_key" ON "Hotel"("slug", "redeId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
