/*
  Warnings:

  - You are about to drop the column `id_user` on the `userscurrencies` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[defaultCurrencyId]` on the table `Users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `UsersCurrencies` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `users` ADD COLUMN `defaultCurrencyId` INTEGER NULL;

-- AlterTable
ALTER TABLE `userscurrencies` DROP COLUMN `id_user`,
    ADD COLUMN `userId` INTEGER NOT NULL,
    MODIFY `name` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Users_defaultCurrencyId_key` ON `Users`(`defaultCurrencyId`);

-- AddForeignKey
ALTER TABLE `Users` ADD CONSTRAINT `Users_defaultCurrencyId_fkey` FOREIGN KEY (`defaultCurrencyId`) REFERENCES `UsersCurrencies`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UsersCurrencies` ADD CONSTRAINT `UsersCurrencies_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
