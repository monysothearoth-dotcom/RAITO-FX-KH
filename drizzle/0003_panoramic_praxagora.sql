CREATE TABLE `telegram_news_deliveries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`fingerprint` varchar(191) NOT NULL,
	`title` varchar(512) NOT NULL,
	`url` varchar(1024),
	`category` enum('forex','crypto') NOT NULL,
	`source` varchar(128),
	`deliveredAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `telegram_news_deliveries_id` PRIMARY KEY(`id`),
	CONSTRAINT `telegram_news_delivery_user_fingerprint_unique` UNIQUE(`userId`,`fingerprint`)
);
--> statement-breakpoint
CREATE TABLE `telegram_news_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`isEnabled` int NOT NULL DEFAULT 0,
	`scheduleCronTaskUid` varchar(65),
	`lastRunAt` timestamp,
	`lastSuccessAt` timestamp,
	`lastError` varchar(512),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `telegram_news_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `telegram_news_settings_user_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE INDEX `telegram_news_delivery_user_delivered_index` ON `telegram_news_deliveries` (`userId`,`deliveredAt`);--> statement-breakpoint
CREATE INDEX `telegram_news_settings_task_uid_index` ON `telegram_news_settings` (`scheduleCronTaskUid`);