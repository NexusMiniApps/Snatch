-- AlterTable
ALTER TABLE "User" ADD COLUMN     "teleUsername" TEXT;

-- CreateTable
CREATE TABLE "EventParticipants" (
    "eventParticipantId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "eventId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "hasPreReg" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "EventParticipants_pkey" PRIMARY KEY ("eventParticipantId")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventParticipants_eventParticipantId_key" ON "EventParticipants"("eventParticipantId");

-- AddForeignKey
ALTER TABLE "EventParticipants" ADD CONSTRAINT "EventParticipants_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventParticipants" ADD CONSTRAINT "EventParticipants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
