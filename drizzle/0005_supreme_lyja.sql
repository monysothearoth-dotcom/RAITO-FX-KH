ALTER TABLE `telegram_news_settings` ADD `pendingNotificationType` varchar(32);--> statement-breakpoint
ALTER TABLE `telegram_news_settings` ADD `pendingNotificationContent` varchar(1024);--> statement-breakpoint
ALTER TABLE `telegram_news_settings` ADD `notificationAttemptCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `telegram_news_settings` ADD `lastNotificationError` varchar(512);