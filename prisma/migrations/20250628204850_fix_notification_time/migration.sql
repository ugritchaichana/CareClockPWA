/*
  Warnings:

  - Changed the type of `scheduledTime` on the `medicine_notifications` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `isActive` on table `medicine_notifications` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "medicine_notifications" DROP COLUMN "scheduledTime",
ADD COLUMN     "scheduledTime" TIMESTAMP(6) NOT NULL,
ALTER COLUMN "isActive" SET NOT NULL;
