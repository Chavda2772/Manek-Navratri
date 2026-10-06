-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('CONFIRMED', 'PENDING', 'CANCELLED');

-- AlterTable
ALTER TABLE "event" ADD COLUMN     "registrationEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "registrationId" TEXT;

-- AlterTable
ALTER TABLE "pass" ADD COLUMN     "registrationId" TEXT,
ALTER COLUMN "createdBy" DROP NOT NULL;

-- CreateTable
CREATE TABLE "eventRegistration" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "primaryName" TEXT NOT NULL,
    "mobileNumber" TEXT NOT NULL,
    "place" TEXT NOT NULL,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'CONFIRMED',
    "totalMembers" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "eventRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registrationMember" (
    "id" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registrationMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "eventRegistration_eventId_idx" ON "eventRegistration"("eventId");

-- CreateIndex
CREATE INDEX "eventRegistration_mobileNumber_idx" ON "eventRegistration"("mobileNumber");

-- CreateIndex
CREATE INDEX "registrationMember_registrationId_idx" ON "registrationMember"("registrationId");

-- CreateIndex
CREATE UNIQUE INDEX "event_registrationId_key" ON "event"("registrationId");

-- CreateIndex
CREATE INDEX "pass_registrationId_idx" ON "pass"("registrationId");

-- AddForeignKey
ALTER TABLE "pass" ADD CONSTRAINT "pass_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "eventRegistration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventRegistration" ADD CONSTRAINT "eventRegistration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrationMember" ADD CONSTRAINT "registrationMember_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "eventRegistration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
