/*
  Warnings:

  - You are about to drop the column `confirmationCode` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `confirmationExpires` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `user` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `user` DROP COLUMN `confirmationCode`,
    DROP COLUMN `confirmationExpires`,
    DROP COLUMN `status`,
    ADD COLUMN `verificationCode` VARCHAR(191) NULL,
    ADD COLUMN `verificationCodeExpiresAt` DATETIME(3) NULL;
