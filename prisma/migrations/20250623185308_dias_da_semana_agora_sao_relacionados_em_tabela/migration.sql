/*
  Warnings:

  - You are about to drop the column `repeatEachWeekdays` on the `RepeatTransaction` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `RepeatTransaction` DROP COLUMN `repeatEachWeekdays`;

-- CreateTable
CREATE TABLE `WeekDay` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday') NOT NULL,

    UNIQUE INDEX `WeekDay_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_TransactionDays` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_TransactionDays_AB_unique`(`A`, `B`),
    INDEX `_TransactionDays_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_TransactionDays` ADD CONSTRAINT `_TransactionDays_A_fkey` FOREIGN KEY (`A`) REFERENCES `RepeatTransaction`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_TransactionDays` ADD CONSTRAINT `_TransactionDays_B_fkey` FOREIGN KEY (`B`) REFERENCES `WeekDay`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
