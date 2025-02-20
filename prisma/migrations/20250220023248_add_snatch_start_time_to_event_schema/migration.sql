/*
  Warnings:

  - Added the required column `snatchStartTime` to the `Event` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "snatchStartTime" TIMESTAMPTZ(6) NOT NULL;
