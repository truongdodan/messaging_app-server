/*
  Warnings:

  - You are about to drop the column `profile_url` on the `Conversation` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "ConversationType" ADD VALUE 'GLOBAL';

-- AlterTable
ALTER TABLE "Conversation" DROP COLUMN "profile_url",
ADD COLUMN     "profileUrl" TEXT DEFAULT '',
ALTER COLUMN "title" SET DEFAULT '';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "refreshToken" TEXT DEFAULT '';
