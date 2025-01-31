/*
  Warnings:

  - You are about to drop the `transaction` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE `transaction`;

-- CreateTable
CREATE TABLE `transactions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `amount` DOUBLE NOT NULL,
    `income` BOOLEAN NOT NULL,
    `paid_out` BOOLEAN NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `description` VARCHAR(191) NULL,
    `category` VARCHAR(191) NOT NULL,
    `account` VARCHAR(191) NOT NULL,
    `attachment` VARCHAR(191) NULL,
    `fixed` BOOLEAN NOT NULL,
    `repeat` BOOLEAN NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
