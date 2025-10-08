/*
  Warnings:

  - You are about to drop the column `attachments` on the `messages` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `messages` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."AttachmentAccessLevel" AS ENUM ('PRIVATE', 'RESTRICTED');

-- AlterEnum
ALTER TYPE "public"."MessageType" ADD VALUE 'SYSTEM';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."PaymentStatus" ADD VALUE 'COMPLETED';
ALTER TYPE "public"."PaymentStatus" ADD VALUE 'FAILED';

-- AlterTable
ALTER TABLE "public"."messages" DROP COLUMN "attachments",
ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "editedAt" TIMESTAMP(3),
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "readAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "content" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."payment_events" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "data" JSONB,
ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "status" TEXT;

-- AlterTable
ALTER TABLE "public"."payments" ADD COLUMN     "gatewayFees" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "gatewayPaymentId" TEXT,
ADD COLUMN     "platformFee" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."professional_profiles" ADD COLUMN     "email" TEXT,
ADD COLUMN     "name" TEXT;

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "name" TEXT;

-- CreateTable
CREATE TABLE "public"."attachments" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "storageProvider" TEXT NOT NULL DEFAULT 'supabase',
    "accessLevel" "public"."AttachmentAccessLevel" NOT NULL DEFAULT 'PRIVATE',
    "metadata" JSONB,
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "attachments_messageId_idx" ON "public"."attachments"("messageId");

-- CreateIndex
CREATE INDEX "attachments_key_idx" ON "public"."attachments"("key");

-- CreateIndex
CREATE INDEX "attachments_storageProvider_idx" ON "public"."attachments"("storageProvider");

-- CreateIndex
CREATE INDEX "attachments_uploadedBy_idx" ON "public"."attachments"("uploadedBy");

-- CreateIndex
CREATE INDEX "attachments_uploadedAt_idx" ON "public"."attachments"("uploadedAt");

-- CreateIndex
CREATE INDEX "messages_deliveredAt_idx" ON "public"."messages"("deliveredAt");

-- CreateIndex
CREATE INDEX "messages_readAt_idx" ON "public"."messages"("readAt");

-- CreateIndex
CREATE INDEX "payment_events_externalId_idx" ON "public"."payment_events"("externalId");

-- CreateIndex
CREATE INDEX "payment_events_createdAt_idx" ON "public"."payment_events"("createdAt");

-- CreateIndex
CREATE INDEX "payments_gatewayPaymentId_idx" ON "public"."payments"("gatewayPaymentId");

-- CreateIndex
CREATE INDEX "professional_profiles_email_idx" ON "public"."professional_profiles"("email");

-- AddForeignKey
ALTER TABLE "public"."attachments" ADD CONSTRAINT "attachments_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "public"."messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attachments" ADD CONSTRAINT "attachments_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
