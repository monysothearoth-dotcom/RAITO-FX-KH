ALTER TABLE `telegram_news_settings` ADD `runCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `telegram_news_settings` ADD `successfulRunCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `telegram_news_settings` ADD `failedRunCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `telegram_news_settings` ADD `consecutiveFailureCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `telegram_news_settings` ADD `totalSent` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `telegram_news_settings` ADD `totalSkipped` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `telegram_news_settings` ADD `sourceFailures` varchar(512);--> statement-breakpoint
ALTER TABLE `telegram_news_settings` ADD `outageActive` int DEFAULT 0 NOT NULL;