-- DropForeignKey
ALTER TABLE "utms" DROP CONSTRAINT "utms_linkId_fkey";

-- AddForeignKey
ALTER TABLE "utms" ADD CONSTRAINT "utms_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "links"("id") ON DELETE CASCADE ON UPDATE CASCADE;
