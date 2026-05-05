/*
  Warnings:

  - You are about to drop the `Lead` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SalesPage` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Lead" DROP CONSTRAINT "Lead_salesPageId_fkey";

-- DropForeignKey
ALTER TABLE "SalesPage" DROP CONSTRAINT "SalesPage_createdById_fkey";

-- DropTable
DROP TABLE "Lead";

-- DropTable
DROP TABLE "SalesPage";

-- DropEnum
DROP TYPE "LeadStatus";

-- DropEnum
DROP TYPE "OrderStatus";
