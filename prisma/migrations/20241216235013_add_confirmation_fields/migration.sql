-- AlterTable
ALTER TABLE `user` ADD COLUMN `confirmationCode` VARCHAR(191) NULL,
    ADD COLUMN `confirmationExpires` DATETIME(3) NULL,
    ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'pending';
