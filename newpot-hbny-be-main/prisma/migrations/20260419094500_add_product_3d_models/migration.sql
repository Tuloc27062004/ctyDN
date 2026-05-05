/*
  Warnings:

  - A unique constraint covering the columns `[userId,productId,patternId,colorId,model3dId]` on the table `CartItem` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[orderId,productId,patternId,colorId,model3dIdSnapshot]` on the table `OrderItem` will be added. If there are existing duplicate values, this will fail.

*/

-- CreateEnum
CREATE TYPE "Model3DStatus" AS ENUM ('DRAFT', 'PROCESSING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "Model3DProvider" AS ENUM ('TRIPO');

-- DropIndex
DROP INDEX "CartItem_userId_productId_patternId_colorId_key";

-- DropIndex
DROP INDEX "OrderItem_orderId_productId_patternId_colorId_key";

-- AlterTable
ALTER TABLE "CartItem"
ADD COLUMN     "model3dId" TEXT;

-- AlterTable
ALTER TABLE "OrderItem"
ADD COLUMN     "model3dIdSnapshot" TEXT,
ADD COLUMN     "modelPreviewImageSnapshot" TEXT,
ADD COLUMN     "modelGlbUrlSnapshot" TEXT;

-- CreateTable
CREATE TABLE "Product3DModel" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "provider" "Model3DProvider" NOT NULL DEFAULT 'TRIPO',
    "status" "Model3DStatus" NOT NULL DEFAULT 'DRAFT',
    "sourceImageUrl" TEXT NOT NULL,
    "sourceImageName" TEXT,
    "previewImageUrl" TEXT,
    "tripoTaskId" TEXT,
    "modelVersion" TEXT,
    "faceLimit" INTEGER,
    "textureEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pbrEnabled" BOOLEAN NOT NULL DEFAULT true,
    "exportUv" BOOLEAN NOT NULL DEFAULT true,
    "orientation" TEXT,
    "textureAlignment" TEXT,
    "modelGlbUrl" TEXT,
    "modelGlbPath" TEXT,
    "baseModelGlbUrl" TEXT,
    "baseModelGlbPath" TEXT,
    "pbrModelGlbUrl" TEXT,
    "pbrModelGlbPath" TEXT,
    "errorMessage" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product3DModel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Product3DModel_productId_idx" ON "Product3DModel"("productId");

-- CreateIndex
CREATE INDEX "Product3DModel_productId_isDefault_idx" ON "Product3DModel"("productId", "isDefault");

-- CreateIndex
CREATE INDEX "Product3DModel_productId_status_idx" ON "Product3DModel"("productId", "status");

-- CreateIndex
CREATE INDEX "Product3DModel_tripoTaskId_idx" ON "Product3DModel"("tripoTaskId");

-- CreateIndex
CREATE INDEX "CartItem_model3dId_idx" ON "CartItem"("model3dId");

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_userId_productId_patternId_colorId_model3dId_key" ON "CartItem"("userId", "productId", "patternId", "colorId", "model3dId");

-- CreateIndex
CREATE INDEX "OrderItem_model3dIdSnapshot_idx" ON "OrderItem"("model3dIdSnapshot");

-- CreateIndex
CREATE UNIQUE INDEX "OrderItem_orderId_productId_patternId_colorId_model3dIdSnapshot_key" ON "OrderItem"("orderId", "productId", "patternId", "colorId", "model3dIdSnapshot");

-- AddForeignKey
ALTER TABLE "Product3DModel" ADD CONSTRAINT "Product3DModel_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_model3dId_fkey" FOREIGN KEY ("model3dId") REFERENCES "Product3DModel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
