-- CreateTable
CREATE TABLE `FixedTransactions` (
    `transaction_id` INTEGER NOT NULL,
    `recurrencyDay` INTEGER NULL,
    `nextPayDay` DATETIME(3) NULL,

    PRIMARY KEY (`transaction_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `FixedTransactions` ADD CONSTRAINT `FixedTransactions_transaction_id_fkey` FOREIGN KEY (`transaction_id`) REFERENCES `Transactions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
