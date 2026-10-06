-- CreateEnum
CREATE TYPE "PassStatus" AS ENUM ('ACTIVE', 'USED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CheckInStatus" AS ENUM ('APPROVED', 'DENIED');

-- AlterTable
ALTER TABLE "account" ADD COLUMN     "issuer" TEXT;

-- CreateTable
CREATE TABLE "event" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pass" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "holderName" TEXT NOT NULL,
    "holderEmail" TEXT NOT NULL,
    "status" "PassStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checkIn" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "passId" TEXT,
    "scannedToken" TEXT NOT NULL,
    "status" "CheckInStatus" NOT NULL,
    "rejectionReason" TEXT,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scannedBy" TEXT,

    CONSTRAINT "checkIn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pass_token_key" ON "pass"("token");

-- CreateIndex
CREATE INDEX "pass_eventId_idx" ON "pass"("eventId");

-- CreateIndex
CREATE INDEX "pass_token_idx" ON "pass"("token");

-- CreateIndex
CREATE INDEX "checkIn_eventId_idx" ON "checkIn"("eventId");

-- CreateIndex
CREATE INDEX "checkIn_passId_idx" ON "checkIn"("passId");

-- AddForeignKey
ALTER TABLE "pass" ADD CONSTRAINT "pass_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkIn" ADD CONSTRAINT "checkIn_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkIn" ADD CONSTRAINT "checkIn_passId_fkey" FOREIGN KEY ("passId") REFERENCES "pass"("id") ON DELETE SET NULL ON UPDATE CASCADE;
