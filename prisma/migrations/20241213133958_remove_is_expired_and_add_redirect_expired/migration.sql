/*
  Warnings:

  - You are about to drop the column `isExpired` on the `links` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "links" DROP COLUMN "isExpired",
ADD COLUMN     "expiredRedirectUrl" TEXT;
