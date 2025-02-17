/*
  Warnings:

  - You are about to drop the `unpaidtransactions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `unpaidtransactions` DROP FOREIGN KEY `UnpaidTransactions_transactionId_fkey`;

-- DropForeignKey
ALTER TABLE `unpaidtransactions` DROP FOREIGN KEY `UnpaidTransactions_userId_fkey`;

-- DropTable
DROP TABLE `unpaidtransactions`;
