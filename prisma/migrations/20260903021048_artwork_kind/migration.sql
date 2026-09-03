-- CreateEnum
CREATE TYPE "ArtworkKind" AS ENUM ('ARTWORK', 'STUDIO');

-- AlterTable
ALTER TABLE "artworks" ADD COLUMN     "kind" "ArtworkKind" NOT NULL DEFAULT 'ARTWORK';
