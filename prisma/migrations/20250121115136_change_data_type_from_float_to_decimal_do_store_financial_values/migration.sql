-- AlterTable
ALTER TABLE `accounts` MODIFY `balance` DECIMAL(10, 2) NOT NULL DEFAULT 0.00;

-- AlterTable
ALTER TABLE `transactions` MODIFY `amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00;
