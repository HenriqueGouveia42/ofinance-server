/*
  Warnings:

  - You are about to drop the column `account` on the `transactions` table. All the data in the column will be lost.
  - Added the required column `accountId` to the `Transactions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `transactions` DROP COLUMN `account`,
    ADD COLUMN `accountId` INTEGER NOT NULL;
