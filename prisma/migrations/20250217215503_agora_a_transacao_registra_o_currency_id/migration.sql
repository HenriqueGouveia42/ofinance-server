/*
  Warnings:

  - You are about to drop the column `currency` on the `transactions` table. All the data in the column will be lost.
  - Added the required column `currencyId` to the `Transactions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `transactions` DROP COLUMN `currency`,
    ADD COLUMN `currencyId` INTEGER NOT NULL;
