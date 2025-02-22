/*
  Warnings:

  - You are about to drop the column `user_id` on the `transactions` table. All the data in the column will be lost.
  - Added the required column `userId` to the `Transactions` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `transactions` DROP FOREIGN KEY `Transactions_user_id_fkey`;

-- DropIndex
DROP INDEX `Transactions_user_id_fkey` ON `transactions`;

-- AlterTable
ALTER TABLE `transactions` DROP COLUMN `user_id`,
    ADD COLUMN `userId` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `Transactions` ADD CONSTRAINT `Transactions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `Users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
