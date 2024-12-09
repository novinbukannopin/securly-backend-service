/*
  Warnings:

  - Added the required column `updatedAt` to the `tag_links` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `tags` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `utms` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "tag_links" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "tags" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "utms" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
