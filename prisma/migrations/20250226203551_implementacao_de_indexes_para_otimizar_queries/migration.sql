-- DropIndex
DROP INDEX `ExpenseAndRevenueCategories_type_idx` ON `expenseandrevenuecategories`;

-- CreateIndex
CREATE INDEX `ExpenseAndRevenueCategories_type_userId_idx` ON `ExpenseAndRevenueCategories`(`type`, `userId`);

-- CreateIndex
CREATE INDEX `Transactions_payDay_userId_idx` ON `Transactions`(`payDay`, `userId`);

-- CreateIndex
CREATE INDEX `Users_id_idx` ON `Users`(`id`);

-- CreateIndex
CREATE INDEX `UsersCurrencies_userId_idx` ON `UsersCurrencies`(`userId`);

-- RenameIndex
ALTER TABLE `accounts` RENAME INDEX `Accounts_userId_fkey` TO `Accounts_userId_idx`;
