/*
  Warnings:

  - A unique constraint covering the columns `[eventId,userId]` on the table `EventUserScores` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "EventUserScores_eventId_userId_key" ON "EventUserScores"("eventId", "userId");
