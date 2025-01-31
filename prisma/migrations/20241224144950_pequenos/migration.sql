/*
  Warnings:

  - You are about to drop the column `date` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `income` on the `transactions` table. All the data in the column will be lost.
  - Added the required column `currency` to the `Transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `payDay` to the `Transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Transactions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `transactions` DROP COLUMN `date`,
    DROP COLUMN `income`,
    ADD COLUMN `currency` VARCHAR(191) NOT NULL,
    ADD COLUMN `payDay` DATETIME(3) NOT NULL,
    ADD COLUMN `remindMe` VARCHAR(191) NULL,
    ADD COLUMN `type` VARCHAR(191) NOT NULL,
    ADD COLUMN `typeRepeat` VARCHAR(191) NULL;
