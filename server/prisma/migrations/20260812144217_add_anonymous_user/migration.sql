-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "name" TEXT,
    "image" TEXT,
    "password_hash" TEXT,
    "display_name" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "role" TEXT NOT NULL DEFAULT 'user',
    "is_anonymous" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_users" ("created_at", "display_name", "email", "email_verified", "id", "image", "locale", "name", "password_hash", "role", "updated_at") SELECT "created_at", "display_name", "email", "email_verified", "id", "image", "locale", "name", "password_hash", "role", "updated_at" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
