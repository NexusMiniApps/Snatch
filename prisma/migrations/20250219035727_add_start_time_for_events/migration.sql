/*
  Warnings:

  - Added the required column `startTime` to the `Event` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "startTime" TIMESTAMPTZ(6) NOT NULL;
