/*
  Warnings:

  - Added the required column `registry_date` to the `Transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `Transactions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `transactions` ADD COLUMN `registry_date` DATETIME(3) NOT NULL,
    ADD COLUMN `user_id` INTEGER NOT NULL;
