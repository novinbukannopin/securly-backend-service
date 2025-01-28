/*
  Warnings:

  - You are about to drop the `Click` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserAgent` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Click" DROP CONSTRAINT "Click_linkId_fkey";

-- DropForeignKey
ALTER TABLE "Click" DROP CONSTRAINT "Click_userAgentId_fkey";

-- DropTable
DROP TABLE "Click";

-- DropTable
DROP TABLE "UserAgent";

-- CreateTable
CREATE TABLE "clicks" (
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

    CONSTRAINT "clicks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_agents" (
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

    CONSTRAINT "user_agents_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "clicks" ADD CONSTRAINT "clicks_userAgentId_fkey" FOREIGN KEY ("userAgentId") REFERENCES "user_agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clicks" ADD CONSTRAINT "clicks_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "links"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
