/*
  Warnings:

  - You are about to alter the column `balance` on the `accounts` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Double`.
  - You are about to alter the column `amount` on the `transactions` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Double`.

*/
-- AlterTable
ALTER TABLE `accounts` MODIFY `balance` DOUBLE NOT NULL;

-- AlterTable
ALTER TABLE `transactions` MODIFY `amount` DOUBLE NOT NULL;
