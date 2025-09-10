/*
  Warnings:

  - You are about to drop the column `fixed` on the `Transactions` table. All the data in the column will be lost.
  - You are about to drop the column `repeat` on the `Transactions` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[recurrenceId]` on the table `FixedTransactions` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `FixedTransactions` ADD COLUMN `recurrenceId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Transactions` DROP COLUMN `fixed`,
    DROP COLUMN `repeat`;

-- CreateTable
CREATE TABLE `TransactionRecurrence` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `frequency` VARCHAR(191) NOT NULL,
    `interval` INTEGER NOT NULL,
    `daysOfWeek` VARCHAR(191) NULL,
    `dayOfMonth` INTEGER NULL,
    `weekOfMonth` INTEGER NULL,
    `weekday` VARCHAR(191) NULL,
    `endsAfter` INTEGER NULL,
    `endsAt` DATETIME(3) NULL,
    `neverEnds` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RepeatTransactions` (
    `transaction_id` INTEGER NOT NULL,
    `recurrenceId` INTEGER NULL,

    UNIQUE INDEX `RepeatTransactions_recurrenceId_key`(`recurrenceId`),
    PRIMARY KEY (`transaction_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `FixedTransactions_recurrenceId_key` ON `FixedTransactions`(`recurrenceId`);

-- AddForeignKey
ALTER TABLE `FixedTransactions` ADD CONSTRAINT `FixedTransactions_recurrenceId_fkey` FOREIGN KEY (`recurrenceId`) REFERENCES `TransactionRecurrence`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RepeatTransactions` ADD CONSTRAINT `RepeatTransactions_transaction_id_fkey` FOREIGN KEY (`transaction_id`) REFERENCES `Transactions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RepeatTransactions` ADD CONSTRAINT `RepeatTransactions_recurrenceId_fkey` FOREIGN KEY (`recurrenceId`) REFERENCES `TransactionRecurrence`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
