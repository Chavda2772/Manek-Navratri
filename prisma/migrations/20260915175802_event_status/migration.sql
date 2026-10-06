-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('ACTIVE', 'ON_HOLD', 'COMPLETED');

-- AlterTable
ALTER TABLE "event" ADD COLUMN     "status" "EventStatus" NOT NULL DEFAULT 'ACTIVE';
