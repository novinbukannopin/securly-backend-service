/*
  Warnings:

  - You are about to drop the column `providerId` on the `oauth_accounts` table. All the data in the column will be lost.
  - Changed the type of `provider` on the `oauth_accounts` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Provider" AS ENUM ('GOOGLE', 'GITHUB');

-- DropIndex
DROP INDEX "oauth_accounts_provider_providerId_key";

-- AlterTable
ALTER TABLE "oauth_accounts" DROP COLUMN "providerId",
DROP COLUMN "provider",
ADD COLUMN     "provider" "Provider" NOT NULL;
