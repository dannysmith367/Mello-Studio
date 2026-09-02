-- CreateEnum
CREATE TYPE "OrderIssueKind" AS ENUM ('DEFECT', 'DAMAGED_IN_TRANSIT', 'NOT_RECEIVED', 'WRONG_ITEM', 'OTHER');

-- CreateEnum
CREATE TYPE "OrderIssueStatus" AS ENUM ('NEW', 'CLAIM_FILED', 'REPLACEMENT_ORDERED', 'REFUNDED', 'RESOLVED', 'DECLINED');

-- CreateTable
CREATE TABLE "order_issues" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "orderNumber" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "kind" "OrderIssueKind" NOT NULL,
    "description" TEXT NOT NULL,
    "photoUrls" TEXT[],
    "status" "OrderIssueStatus" NOT NULL DEFAULT 'NEW',
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_issues_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "order_issues_status_createdAt_idx" ON "order_issues"("status", "createdAt");

-- CreateIndex
CREATE INDEX "order_issues_orderId_idx" ON "order_issues"("orderId");

-- AddForeignKey
ALTER TABLE "order_issues" ADD CONSTRAINT "order_issues_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
