/*
  Warnings:

  - You are about to drop the `FixedTransactions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `FixedTransactions` DROP FOREIGN KEY `FixedTransactions_recurrenceId_fkey`;

-- DropForeignKey
ALTER TABLE `FixedTransactions` DROP FOREIGN KEY `FixedTransactions_transaction_id_fkey`;

-- DropTable
DROP TABLE `FixedTransactions`;
