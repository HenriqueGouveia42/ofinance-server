/*
  Warnings:

  - You are about to drop the column `nextPayDay` on the `FixedTransactions` table. All the data in the column will be lost.
  - You are about to drop the column `recurrencyDay` on the `FixedTransactions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `FixedTransactions` DROP COLUMN `nextPayDay`,
    DROP COLUMN `recurrencyDay`;
