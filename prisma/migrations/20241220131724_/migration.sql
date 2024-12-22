/*
  Warnings:

  - You are about to drop the column `isHidden` on the `links` table. All the data in the column will be lost.
  - You are about to drop the column `score` on the `links` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `links` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "links" DROP COLUMN "isHidden",
DROP COLUMN "score",
DROP COLUMN "type",
ADD COLUMN     "comments" TEXT;
