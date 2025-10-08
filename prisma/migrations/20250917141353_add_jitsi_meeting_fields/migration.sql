-- CreateEnum
CREATE TYPE "public"."MeetingStatus" AS ENUM ('PENDING', 'WAITING', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED');

-- AlterTable
ALTER TABLE "public"."bookings" ADD COLUMN     "jitsiRoom" TEXT,
ADD COLUMN     "meetingAcceptedAt" TIMESTAMP(3),
ADD COLUMN     "meetingEndTime" TIMESTAMP(3),
ADD COLUMN     "meetingStartTime" TIMESTAMP(3),
ADD COLUMN     "meetingStatus" "public"."MeetingStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "bookings_jitsiRoom_idx" ON "public"."bookings"("jitsiRoom");

-- CreateIndex
CREATE INDEX "bookings_meetingStatus_idx" ON "public"."bookings"("meetingStatus");
