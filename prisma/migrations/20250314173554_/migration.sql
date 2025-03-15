-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "winnerDrawnAt" TIMESTAMPTZ(6),
ADD COLUMN     "winnerTicket" TEXT,
ADD COLUMN     "winnerUserId" UUID;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_winnerUserId_fkey" FOREIGN KEY ("winnerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
