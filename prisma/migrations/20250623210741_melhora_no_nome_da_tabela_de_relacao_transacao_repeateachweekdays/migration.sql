/*
  Warnings:

  - You are about to drop the `_TransactionDays` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `_TransactionDays` DROP FOREIGN KEY `_TransactionDays_A_fkey`;

-- DropForeignKey
ALTER TABLE `_TransactionDays` DROP FOREIGN KEY `_TransactionDays_B_fkey`;

-- DropTable
DROP TABLE `_TransactionDays`;

-- CreateTable
CREATE TABLE `_TransactionRepeatEachWeekDays` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_TransactionRepeatEachWeekDays_AB_unique`(`A`, `B`),
    INDEX `_TransactionRepeatEachWeekDays_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_TransactionRepeatEachWeekDays` ADD CONSTRAINT `_TransactionRepeatEachWeekDays_A_fkey` FOREIGN KEY (`A`) REFERENCES `RepeatTransaction`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_TransactionRepeatEachWeekDays` ADD CONSTRAINT `_TransactionRepeatEachWeekDays_B_fkey` FOREIGN KEY (`B`) REFERENCES `WeekDay`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
