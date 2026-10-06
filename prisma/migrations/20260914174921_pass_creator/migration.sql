/*
  Warnings:

  - Added the required column `createdBy` to the `pass` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "pass" ADD COLUMN     "createdBy" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "pass_createdBy_idx" ON "pass"("createdBy");

-- AddForeignKey
ALTER TABLE "pass" ADD CONSTRAINT "pass_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
