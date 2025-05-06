/*
  Warnings:

  - You are about to drop the column `currencyId` on the `Transactions` table. All the data in the column will be lost.
  - You are about to drop the column `defaultCurrencyId` on the `Users` table. All the data in the column will be lost.
  - You are about to drop the `UsersCurrencies` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Transactions` DROP FOREIGN KEY `Transactions_currencyId_fkey`;

-- DropForeignKey
ALTER TABLE `Users` DROP FOREIGN KEY `Users_defaultCurrencyId_fkey`;

-- DropForeignKey
ALTER TABLE `UsersCurrencies` DROP FOREIGN KEY `UsersCurrencies_userId_fkey`;

-- DropIndex
DROP INDEX `Transactions_currencyId_fkey` ON `Transactions`;

-- DropIndex
DROP INDEX `Users_defaultCurrencyId_key` ON `Users`;

-- DropIndex
DROP INDEX `Users_id_idx` ON `Users`;

-- AlterTable
ALTER TABLE `Transactions` DROP COLUMN `currencyId`;

-- AlterTable
ALTER TABLE `Users` DROP COLUMN `defaultCurrencyId`;

-- DropTable
DROP TABLE `UsersCurrencies`;

-- CreateIndex
CREATE INDEX `stagedUsers_expiresAt_idx` ON `stagedUsers`(`expiresAt`);
