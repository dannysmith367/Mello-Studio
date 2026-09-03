-- AlterTable
ALTER TABLE "artwork_assets" ADD COLUMN     "providerVariantIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;
