/*
  Warnings:

  - You are about to drop the `analytics` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `clicks` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "analytics" DROP CONSTRAINT "analytics_linkId_fkey";

-- DropForeignKey
ALTER TABLE "clicks" DROP CONSTRAINT "clicks_linkId_fkey";

-- DropTable
DROP TABLE "analytics";

-- DropTable
DROP TABLE "clicks";

-- CreateTable
CREATE TABLE "Click" (
    "id" TEXT NOT NULL,
    "linkId" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" TEXT NOT NULL,
    "location" TEXT,
    "region" TEXT,
    "country" TEXT,
    "loc" TEXT,
    "org" TEXT,
    "postal" TEXT,
    "timezone" TEXT,
    "countryCode" TEXT,
    "userAgentId" TEXT,

    CONSTRAINT "Click_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAgent" (
    "id" TEXT NOT NULL,
    "ua" TEXT NOT NULL,
    "browser" TEXT,
    "browserVersion" TEXT,
    "os" TEXT,
    "osVersion" TEXT,
    "cpuArch" TEXT,
    "deviceType" TEXT,
    "engine" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAgent_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Click" ADD CONSTRAINT "Click_userAgentId_fkey" FOREIGN KEY ("userAgentId") REFERENCES "UserAgent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Click" ADD CONSTRAINT "Click_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "links"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
