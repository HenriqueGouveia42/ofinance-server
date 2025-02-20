/*
  Warnings:

  - You are about to alter the column `type` on the `transactions` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(0))`.
  - A unique constraint covering the columns `[userId,name]` on the table `UsersCurrencies` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `transactions` MODIFY `type` ENUM('revenue', 'expense') NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `UsersCurrencies_userId_name_key` ON `UsersCurrencies`(`userId`, `name`);

-- AddForeignKey
ALTER TABLE `Transactions` ADD CONSTRAINT `Transactions_currencyId_fkey` FOREIGN KEY (`currencyId`) REFERENCES `UsersCurrencies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
