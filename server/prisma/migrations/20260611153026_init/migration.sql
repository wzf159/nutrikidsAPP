-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "display_name" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "children" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "age" INTEGER,
    "stage_key" TEXT,
    "avatar_emoji" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "children_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "child_goals" (
    "child_id" TEXT NOT NULL,
    "goal_id" INTEGER NOT NULL,

    PRIMARY KEY ("child_id", "goal_id"),
    CONSTRAINT "child_goals_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "children" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "child_goals_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "development_goals" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "child_nutrients" (
    "child_id" TEXT NOT NULL,
    "nutrient_id" INTEGER NOT NULL,

    PRIMARY KEY ("child_id", "nutrient_id"),
    CONSTRAINT "child_nutrients_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "children" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "child_nutrients_nutrient_id_fkey" FOREIGN KEY ("nutrient_id") REFERENCES "nutrients" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "child_allergens" (
    "child_id" TEXT NOT NULL,
    "allergen_id" INTEGER NOT NULL,

    PRIMARY KEY ("child_id", "allergen_id"),
    CONSTRAINT "child_allergens_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "children" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "child_allergens_allergen_id_fkey" FOREIGN KEY ("allergen_id") REFERENCES "allergens" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "feedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT,
    "text" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "development_goals" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "icon" TEXT,
    "label" TEXT NOT NULL,
    "label_zh" TEXT
);

-- CreateTable
CREATE TABLE "nutrients" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "name_zh" TEXT,
    "icon" TEXT,
    "unit" TEXT
);

-- CreateTable
CREATE TABLE "allergens" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_zh" TEXT,
    "icon" TEXT
);

-- CreateTable
CREATE TABLE "ingredients" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "name_zh" TEXT
);

-- CreateTable
CREATE TABLE "additives" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "name_zh" TEXT,
    "type" TEXT,
    "status" TEXT
);

-- CreateTable
CREATE TABLE "labels" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "exposure_concern_types" (
    "code" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "name_zh" TEXT,
    "icon" TEXT
);

-- CreateTable
CREATE TABLE "brands" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "categories" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "name_zh" TEXT
);

-- CreateTable
CREATE TABLE "manufacturers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "certifications" TEXT
);

-- CreateTable
CREATE TABLE "products" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "barcode" TEXT,
    "name" TEXT NOT NULL,
    "name_zh" TEXT,
    "brand_id" INTEGER,
    "manufacturer_id" INTEGER,
    "category_id" INTEGER,
    "image_url" TEXT,
    "quantity" TEXT,
    "serving_size" TEXT,
    "nova_score" INTEGER,
    "nutri_grade" TEXT,
    "nutri_score" INTEGER,
    "eco_grade" TEXT,
    "eco_score" INTEGER,
    "carbon_kgco2e" REAL,
    "water_l" REAL,
    "land_m2" REAL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "products_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "products_manufacturer_id_fkey" FOREIGN KEY ("manufacturer_id") REFERENCES "manufacturers" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "product_nutrients" (
    "product_id" INTEGER NOT NULL,
    "nutrient_id" INTEGER NOT NULL,
    "value" REAL,
    "unit" TEXT,
    "daily_value" REAL,

    PRIMARY KEY ("product_id", "nutrient_id"),
    CONSTRAINT "product_nutrients_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "product_nutrients_nutrient_id_fkey" FOREIGN KEY ("nutrient_id") REFERENCES "nutrients" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "product_ingredients" (
    "product_id" INTEGER NOT NULL,
    "ingredient_id" INTEGER NOT NULL,
    "percentage" REAL,
    "position" INTEGER,

    PRIMARY KEY ("product_id", "ingredient_id"),
    CONSTRAINT "product_ingredients_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "product_ingredients_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "product_additives" (
    "product_id" INTEGER NOT NULL,
    "additive_id" INTEGER NOT NULL,

    PRIMARY KEY ("product_id", "additive_id"),
    CONSTRAINT "product_additives_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "product_additives_additive_id_fkey" FOREIGN KEY ("additive_id") REFERENCES "additives" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "product_labels" (
    "product_id" INTEGER NOT NULL,
    "label_id" INTEGER NOT NULL,

    PRIMARY KEY ("product_id", "label_id"),
    CONSTRAINT "product_labels_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "product_labels_label_id_fkey" FOREIGN KEY ("label_id") REFERENCES "labels" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "product_allergens" (
    "product_id" INTEGER NOT NULL,
    "allergen_id" INTEGER NOT NULL,
    "present" BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY ("product_id", "allergen_id"),
    CONSTRAINT "product_allergens_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "product_allergens_allergen_id_fkey" FOREIGN KEY ("allergen_id") REFERENCES "allergens" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "product_reviews" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "product_id" INTEGER NOT NULL,
    "user_id" TEXT,
    "rating" INTEGER,
    "comment" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "product_reviews_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "product_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "analyses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "child_id" TEXT NOT NULL,
    "product_id" INTEGER NOT NULL,
    "source" TEXT,
    "image_path" TEXT,
    "overall_score" INTEGER,
    "grade" TEXT,
    "why_text" TEXT,
    "why_text_zh" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "analyses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "analyses_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "children" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "analyses_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "analysis_breakdown" (
    "analysis_id" TEXT NOT NULL,
    "dimension" TEXT NOT NULL,
    "score" REAL,
    "weight" REAL,

    PRIMARY KEY ("analysis_id", "dimension"),
    CONSTRAINT "analysis_breakdown_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "analyses" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "analysis_factors" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "analysis_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "label" TEXT,
    CONSTRAINT "analysis_factors_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "analyses" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "analysis_exposure" (
    "analysis_id" TEXT NOT NULL,
    "concern_code" TEXT NOT NULL,
    "level" TEXT,

    PRIMARY KEY ("analysis_id", "concern_code"),
    CONSTRAINT "analysis_exposure_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "analyses" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "analysis_exposure_concern_code_fkey" FOREIGN KEY ("concern_code") REFERENCES "exposure_concern_types" ("code") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "analysis_allergen_flags" (
    "analysis_id" TEXT NOT NULL,
    "allergen_id" INTEGER NOT NULL,
    "present" BOOLEAN,
    "matches_child" BOOLEAN,

    PRIMARY KEY ("analysis_id", "allergen_id"),
    CONSTRAINT "analysis_allergen_flags_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "analyses" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "analysis_allergen_flags_allergen_id_fkey" FOREIGN KEY ("allergen_id") REFERENCES "allergens" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "children_user_id_idx" ON "children"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "allergens_code_key" ON "allergens"("code");

-- CreateIndex
CREATE UNIQUE INDEX "labels_code_key" ON "labels"("code");

-- CreateIndex
CREATE UNIQUE INDEX "brands_name_key" ON "brands"("name");

-- CreateIndex
CREATE UNIQUE INDEX "products_barcode_key" ON "products"("barcode");

-- CreateIndex
CREATE INDEX "product_reviews_product_id_idx" ON "product_reviews"("product_id");

-- CreateIndex
CREATE INDEX "analyses_user_id_created_at_idx" ON "analyses"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "analyses_child_id_idx" ON "analyses"("child_id");

-- CreateIndex
CREATE INDEX "analysis_factors_analysis_id_idx" ON "analysis_factors"("analysis_id");
