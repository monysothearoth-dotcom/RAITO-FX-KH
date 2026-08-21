CREATE TABLE `news_effect_tracking` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`fingerprint` varchar(191) NOT NULL,
	`title` varchar(512) NOT NULL,
	`url` varchar(1024),
	`symbol` varchar(32) NOT NULL,
	`predictedEffect` enum('BUY','SELL','NORMAL') NOT NULL,
	`baselinePrice` double NOT NULL,
	`baselineAt` timestamp NOT NULL DEFAULT (now()),
	`evaluationWindowMinutes` int NOT NULL DEFAULT 60,
	`currentPrice` double,
	`movementPercent` double,
	`actualEffect` enum('BUY','SELL','NORMAL'),
	`outcome` enum('PENDING','CORRECT','INCORRECT','NEUTRAL','UNAVAILABLE') NOT NULL DEFAULT 'PENDING',
	`evaluatedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `news_effect_tracking_id` PRIMARY KEY(`id`),
	CONSTRAINT `news_effect_tracking_user_fingerprint_unique` UNIQUE(`userId`,`fingerprint`)
);
--> statement-breakpoint
CREATE INDEX `news_effect_tracking_user_status_index` ON `news_effect_tracking` (`userId`,`outcome`);--> statement-breakpoint
CREATE INDEX `news_effect_tracking_user_created_index` ON `news_effect_tracking` (`userId`,`createdAt`);