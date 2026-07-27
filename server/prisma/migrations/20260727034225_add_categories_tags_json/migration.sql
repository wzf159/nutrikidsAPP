-- AlterTable
ALTER TABLE "product_nutrients" ADD COLUMN "value_100g" REAL;

-- AlterTable
ALTER TABLE "products" ADD COLUMN "additives_json" TEXT;
ALTER TABLE "products" ADD COLUMN "categories_tags_json" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_feedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT,
    "text" TEXT,
    "q1" TEXT,
    "q2" TEXT,
    "q3" TEXT,
    "q4" TEXT,
    "q5" TEXT,
    "q6" TEXT,
    "q7" TEXT,
    "q8" TEXT,
    "q9" TEXT,
    "comment" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_feedback" ("comment", "created_at", "id", "q1", "q2", "q3", "q4", "q5", "text", "user_id") SELECT "comment", "created_at", "id", "q1", "q2", "q3", "q4", "q5", "text", "user_id" FROM "feedback";
DROP TABLE "feedback";
ALTER TABLE "new_feedback" RENAME TO "feedback";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
