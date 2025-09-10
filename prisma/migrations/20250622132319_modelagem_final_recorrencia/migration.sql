/*
  Warnings:

  - You are about to drop the `RecurrenceDay` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RepeatTransactions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TransactionRecurrence` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `RecurrenceDay` DROP FOREIGN KEY `RecurrenceDay_recurrenceId_fkey`;

-- DropForeignKey
ALTER TABLE `RepeatTransactions` DROP FOREIGN KEY `RepeatTransactions_recurrenceId_fkey`;

-- DropForeignKey
ALTER TABLE `RepeatTransactions` DROP FOREIGN KEY `RepeatTransactions_transaction_id_fkey`;

-- DropTable
DROP TABLE `RecurrenceDay`;

-- DropTable
DROP TABLE `RepeatTransactions`;

-- DropTable
DROP TABLE `TransactionRecurrence`;

-- CreateTable
CREATE TABLE `RepeatTransaction` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `transactionId` INTEGER NOT NULL,
    `repeatEvery` INTEGER NOT NULL,
    `repeatEachOptions` ENUM('day', 'week', 'month', 'year') NOT NULL,
    `repeatEachWeekdays` JSON NULL,
    `repeatOnDayOfMonth` INTEGER NULL,
    `ends` ENUM('never', 'at', 'after') NOT NULL,
    `endsAt` DATETIME(3) NULL,
    `endsAfterOccurrencies` INTEGER NULL,

    UNIQUE INDEX `RepeatTransaction_transactionId_key`(`transactionId`),
    INDEX `RepeatTransaction_repeatEachOptions_idx`(`repeatEachOptions`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `RepeatTransaction` ADD CONSTRAINT `RepeatTransaction_transactionId_fkey` FOREIGN KEY (`transactionId`) REFERENCES `Transactions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
