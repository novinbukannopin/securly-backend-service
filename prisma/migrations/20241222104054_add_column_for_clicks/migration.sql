/*
  Warnings:

  - You are about to drop the column `deviceType` on the `clicks` table. All the data in the column will be lost.
  - You are about to drop the column `geoLocation` on the `clicks` table. All the data in the column will be lost.
  - You are about to drop the column `referrer` on the `clicks` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "clicks" DROP COLUMN "deviceType",
DROP COLUMN "geoLocation",
DROP COLUMN "referrer",
ADD COLUMN     "city" TEXT,
ADD COLUMN     "countryLong" TEXT,
ADD COLUMN     "countryShort" TEXT,
ADD COLUMN     "deviceCategory" TEXT,
ADD COLUMN     "isp" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "mobileBrand" TEXT,
ADD COLUMN     "netSpeed" TEXT,
ADD COLUMN     "platform" TEXT,
ADD COLUMN     "region" TEXT,
ADD COLUMN     "timeZone" TEXT,
ADD COLUMN     "userAgent" TEXT,
ADD COLUMN     "zipCode" TEXT;
