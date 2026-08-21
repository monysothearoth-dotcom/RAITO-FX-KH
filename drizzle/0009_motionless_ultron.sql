CREATE TABLE `auto_signal_deliveries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`signalId` int NOT NULL,
	`deliveryType` enum('SIGNAL','OUTCOME') NOT NULL,
	`deliveredAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auto_signal_deliveries_id` PRIMARY KEY(`id`),
	CONSTRAINT `auto_signal_delivery_unique` UNIQUE(`signalId`,`deliveryType`)
);
--> statement-breakpoint
CREATE TABLE `auto_signal_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`isEnabled` int NOT NULL DEFAULT 0,
	`minConfidence` int NOT NULL DEFAULT 78,
	`minScore` int NOT NULL DEFAULT 82,
	`minRiskReward` double NOT NULL DEFAULT 1.8,
	`scheduleCronTaskUid` varchar(65),
	`lastRunAt` timestamp,
	`lastError` varchar(512),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `auto_signal_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `auto_signal_settings_user_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `auto_signals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`fingerprint` varchar(191) NOT NULL,
	`source` enum('TECHNICAL','PRE_NEWS') NOT NULL,
	`symbol` varchar(32) NOT NULL,
	`direction` enum('BUY','SELL') NOT NULL,
	`status` enum('OPEN','TP_HIT','SL_HIT','EXPIRED','CANCELLED') NOT NULL DEFAULT 'OPEN',
	`entryPrice` double NOT NULL,
	`stopLoss` double NOT NULL,
	`takeProfit` double NOT NULL,
	`confidence` int NOT NULL,
	`technicalScore` int NOT NULL DEFAULT 0,
	`strategyScore` int NOT NULL DEFAULT 0,
	`fundamentalScore` int NOT NULL DEFAULT 0,
	`intelligenceScore` int NOT NULL DEFAULT 0,
	`riskReward` double NOT NULL DEFAULT 0,
	`rationale` text NOT NULL,
	`warning` text,
	`newsEvent` varchar(512),
	`newsScheduledAt` timestamp,
	`outcomePrice` double,
	`outcomeDetails` text,
	`openedAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	`lastEvaluatedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `auto_signals_id` PRIMARY KEY(`id`),
	CONSTRAINT `auto_signal_user_fingerprint_unique` UNIQUE(`userId`,`fingerprint`)
);
--> statement-breakpoint
CREATE INDEX `auto_signal_delivery_user_index` ON `auto_signal_deliveries` (`userId`,`deliveredAt`);--> statement-breakpoint
CREATE INDEX `auto_signal_settings_task_uid_index` ON `auto_signal_settings` (`scheduleCronTaskUid`);--> statement-breakpoint
CREATE INDEX `auto_signal_user_status_index` ON `auto_signals` (`userId`,`status`);--> statement-breakpoint
CREATE INDEX `auto_signal_user_opened_index` ON `auto_signals` (`userId`,`openedAt`);