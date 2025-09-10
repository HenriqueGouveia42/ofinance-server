/*
  Warnings:

  - You are about to drop the column `daysOfWeek` on the `TransactionRecurrence` table. All the data in the column will be lost.
  - You are about to drop the column `weekday` on the `TransactionRecurrence` table. All the data in the column will be lost.
  - You are about to alter the column `frequency` on the `TransactionRecurrence` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(2))`.
  - You are about to alter the column `remindMe` on the `Transactions` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `DateTime(3)`.
  - You are about to drop the `stagedUsers` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId,type,name]` on the table `ExpenseAndRevenueCategories` will be added. If there are existing duplicate values, this will fail.
  - Made the column `recurrenceId` on table `FixedTransactions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `recurrenceId` on table `RepeatTransactions` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `FixedTransactions` DROP FOREIGN KEY `FixedTransactions_recurrenceId_fkey`;

-- DropForeignKey
ALTER TABLE `RepeatTransactions` DROP FOREIGN KEY `RepeatTransactions_recurrenceId_fkey`;

-- AlterTable
ALTER TABLE `FixedTransactions` MODIFY `recurrenceId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `RepeatTransactions` MODIFY `recurrenceId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `TransactionRecurrence` DROP COLUMN `daysOfWeek`,
    DROP COLUMN `weekday`,
    ADD COLUMN `dayOfWeek` ENUM('sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday') NULL,
    MODIFY `frequency` ENUM('daily', 'weekly', 'monthly') NOT NULL;

-- AlterTable
ALTER TABLE `Transactions` MODIFY `remindMe` DATETIME(3) NULL;

-- DropTable
DROP TABLE `stagedUsers`;

-- CreateTable
CREATE TABLE `StagedUsers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiresAt` DATETIME(3) NOT NULL,
    `verificationCode` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `StagedUsers_email_key`(`email`),
    INDEX `StagedUsers_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RecurrenceDay` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `recurrenceId` INTEGER NOT NULL,
    `day` ENUM('sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday') NOT NULL,

    UNIQUE INDEX `RecurrenceDay_recurrenceId_day_key`(`recurrenceId`, `day`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `ExpenseAndRevenueCategories_userId_type_name_key` ON `ExpenseAndRevenueCategories`(`userId`, `type`, `name`);

-- AddForeignKey
ALTER TABLE `FixedTransactions` ADD CONSTRAINT `FixedTransactions_recurrenceId_fkey` FOREIGN KEY (`recurrenceId`) REFERENCES `TransactionRecurrence`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RepeatTransactions` ADD CONSTRAINT `RepeatTransactions_recurrenceId_fkey` FOREIGN KEY (`recurrenceId`) REFERENCES `TransactionRecurrence`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RecurrenceDay` ADD CONSTRAINT `RecurrenceDay_recurrenceId_fkey` FOREIGN KEY (`recurrenceId`) REFERENCES `TransactionRecurrence`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
