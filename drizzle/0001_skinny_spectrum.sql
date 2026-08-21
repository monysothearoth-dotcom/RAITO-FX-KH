CREATE TABLE `portfolio_holdings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`symbol` varchar(64) NOT NULL,
	`quantity` double NOT NULL,
	`averagePrice` double NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `portfolio_holdings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `price_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`symbol` varchar(64) NOT NULL,
	`targetPrice` double NOT NULL,
	`condition` enum('ABOVE','BELOW') NOT NULL,
	`isTriggered` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `price_alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trade_journal_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`symbol` varchar(64) NOT NULL,
	`direction` enum('BUY','SELL') NOT NULL,
	`strategy` varchar(128) NOT NULL,
	`entryPrice` double NOT NULL,
	`exitPrice` double,
	`size` double NOT NULL,
	`pnl` double,
	`status` varchar(32) NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trade_journal_entries_id` PRIMARY KEY(`id`)
);
