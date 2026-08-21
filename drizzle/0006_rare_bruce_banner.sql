ALTER TABLE `users` ADD `displayName` varchar(160);--> statement-breakpoint
ALTER TABLE `users` ADD `timezone` varchar(64) DEFAULT 'UTC';--> statement-breakpoint
ALTER TABLE `users` ADD `defaultView` varchar(32) DEFAULT 'all_in_one';--> statement-breakpoint
ALTER TABLE `users` ADD `theme` enum('dark','light','system') DEFAULT 'dark';