/*
  Warnings:

  - A unique constraint covering the columns `[eventId,userId]` on the table `EventParticipants` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `hasJoinedGiveaway` to the `EventParticipants` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "EventParticipants" ADD COLUMN     "hasJoinedGiveaway" BOOLEAN NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "EventParticipants_eventId_userId_key" ON "EventParticipants"("eventId", "userId");
