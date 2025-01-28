-- AlterTable
ALTER TABLE "links" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "utms" ADD COLUMN     "deletedAt" TIMESTAMP(3);
