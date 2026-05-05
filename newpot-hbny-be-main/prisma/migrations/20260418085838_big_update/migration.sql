/*
  Warnings:

  - A unique constraint covering the columns `[userId,productId,patternId,colorId]` on the table `CartItem` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[orderId,productId,patternId,colorId]` on the table `OrderItem` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "CartItem_userId_productId_key";

-- DropIndex
DROP INDEX "OrderItem_orderId_productId_key";

-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN     "colorId" TEXT,
ADD COLUMN     "patternId" TEXT;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "colorCodeSnapshot" TEXT,
ADD COLUMN     "colorHexSnapshot" TEXT,
ADD COLUMN     "colorId" TEXT,
ADD COLUMN     "colorNameSnapshot" TEXT,
ADD COLUMN     "patternCodeSnapshot" TEXT,
ADD COLUMN     "patternId" TEXT,
ADD COLUMN     "patternNameSnapshot" TEXT,
ADD COLUMN     "previewImageSnapshot" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "defaultColorId" TEXT,
ADD COLUMN     "defaultPatternId" TEXT;

-- CreateTable
CREATE TABLE "Pattern" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "textureUrl" TEXT NOT NULL,
    "defaultScale" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "defaultOpacity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pattern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Color" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "hex" TEXT NOT NULL,
    "swatchUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Color_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductPattern" (
    "productId" TEXT NOT NULL,
    "patternId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductPattern_pkey" PRIMARY KEY ("productId","patternId")
);

-- CreateTable
CREATE TABLE "ProductColor" (
    "productId" TEXT NOT NULL,
    "colorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductColor_pkey" PRIMARY KEY ("productId","colorId")
);

-- CreateTable
CREATE TABLE "CategoryPattern" (
    "categoryId" TEXT NOT NULL,
    "patternId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CategoryPattern_pkey" PRIMARY KEY ("categoryId","patternId")
);

-- CreateTable
CREATE TABLE "CategoryColor" (
    "categoryId" TEXT NOT NULL,
    "colorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CategoryColor_pkey" PRIMARY KEY ("categoryId","colorId")
);

-- CreateTable
CREATE TABLE "ProductRenderAsset" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "viewCode" TEXT NOT NULL DEFAULT 'front',
    "baseImageUrl" TEXT NOT NULL,
    "maskImageUrl" TEXT NOT NULL,
    "shadowImageUrl" TEXT NOT NULL,
    "highlightImageUrl" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "isDefault" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductRenderAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Pattern_code_key" ON "Pattern"("code");

-- CreateIndex
CREATE INDEX "Pattern_isActive_idx" ON "Pattern"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Color_code_key" ON "Color"("code");

-- CreateIndex
CREATE INDEX "Color_isActive_idx" ON "Color"("isActive");

-- CreateIndex
CREATE INDEX "ProductPattern_patternId_idx" ON "ProductPattern"("patternId");

-- CreateIndex
CREATE INDEX "ProductColor_colorId_idx" ON "ProductColor"("colorId");

-- CreateIndex
CREATE INDEX "CategoryPattern_categoryId_idx" ON "CategoryPattern"("categoryId");

-- CreateIndex
CREATE INDEX "CategoryPattern_patternId_idx" ON "CategoryPattern"("patternId");

-- CreateIndex
CREATE INDEX "CategoryColor_categoryId_idx" ON "CategoryColor"("categoryId");

-- CreateIndex
CREATE INDEX "CategoryColor_colorId_idx" ON "CategoryColor"("colorId");

-- CreateIndex
CREATE INDEX "ProductRenderAsset_productId_idx" ON "ProductRenderAsset"("productId");

-- CreateIndex
CREATE INDEX "ProductRenderAsset_productId_isDefault_idx" ON "ProductRenderAsset"("productId", "isDefault");

-- CreateIndex
CREATE INDEX "CartItem_patternId_idx" ON "CartItem"("patternId");

-- CreateIndex
CREATE INDEX "CartItem_colorId_idx" ON "CartItem"("colorId");

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_userId_productId_patternId_colorId_key" ON "CartItem"("userId", "productId", "patternId", "colorId");

-- CreateIndex
CREATE INDEX "OrderItem_patternId_idx" ON "OrderItem"("patternId");

-- CreateIndex
CREATE INDEX "OrderItem_colorId_idx" ON "OrderItem"("colorId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderItem_orderId_productId_patternId_colorId_key" ON "OrderItem"("orderId", "productId", "patternId", "colorId");

-- CreateIndex
CREATE INDEX "Product_defaultPatternId_idx" ON "Product"("defaultPatternId");

-- CreateIndex
CREATE INDEX "Product_defaultColorId_idx" ON "Product"("defaultColorId");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_defaultPatternId_fkey" FOREIGN KEY ("defaultPatternId") REFERENCES "Pattern"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_defaultColorId_fkey" FOREIGN KEY ("defaultColorId") REFERENCES "Color"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductPattern" ADD CONSTRAINT "ProductPattern_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductPattern" ADD CONSTRAINT "ProductPattern_patternId_fkey" FOREIGN KEY ("patternId") REFERENCES "Pattern"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductColor" ADD CONSTRAINT "ProductColor_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductColor" ADD CONSTRAINT "ProductColor_colorId_fkey" FOREIGN KEY ("colorId") REFERENCES "Color"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryPattern" ADD CONSTRAINT "CategoryPattern_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryPattern" ADD CONSTRAINT "CategoryPattern_patternId_fkey" FOREIGN KEY ("patternId") REFERENCES "Pattern"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryColor" ADD CONSTRAINT "CategoryColor_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryColor" ADD CONSTRAINT "CategoryColor_colorId_fkey" FOREIGN KEY ("colorId") REFERENCES "Color"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductRenderAsset" ADD CONSTRAINT "ProductRenderAsset_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_patternId_fkey" FOREIGN KEY ("patternId") REFERENCES "Pattern"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_colorId_fkey" FOREIGN KEY ("colorId") REFERENCES "Color"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_patternId_fkey" FOREIGN KEY ("patternId") REFERENCES "Pattern"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_colorId_fkey" FOREIGN KEY ("colorId") REFERENCES "Color"("id") ON DELETE SET NULL ON UPDATE CASCADE;
