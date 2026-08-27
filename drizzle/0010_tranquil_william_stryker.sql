ALTER TABLE `auto_signal_deliveries` ADD `status` enum('PENDING','SENDING','SENT','FAILED','UNKNOWN') DEFAULT 'SENT' NOT NULL;--> statement-breakpoint
ALTER TABLE `auto_signal_deliveries` ADD `attemptCount` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `auto_signal_deliveries` ADD `attemptedAt` timestamp;--> statement-breakpoint
ALTER TABLE `auto_signal_deliveries` ADD `lastError` varchar(512);--> statement-breakpoint
ALTER TABLE `auto_signals` ADD `activeKey` varchar(96);--> statement-breakpoint
UPDATE `auto_signals` AS `stale`
INNER JOIN `auto_signals` AS `newer`
  ON `newer`.`userId` = `stale`.`userId`
  AND `newer`.`symbol` = `stale`.`symbol`
  AND `newer`.`status` = 'OPEN'
  AND `newer`.`id` > `stale`.`id`
SET `stale`.`status` = 'CANCELLED',
    `stale`.`outcomeDetails` = 'Superseded by a newer active setup for the same instrument during the duplicate-delivery safeguard upgrade.',
    `stale`.`resolvedAt` = NOW(),
    `stale`.`lastEvaluatedAt` = NOW(),
    `stale`.`activeKey` = NULL
WHERE `stale`.`status` = 'OPEN';--> statement-breakpoint
UPDATE `auto_signals`
SET `activeKey` = CONCAT(`userId`, ':', UPPER(`symbol`))
WHERE `status` = 'OPEN';--> statement-breakpoint
ALTER TABLE `auto_signals` ADD CONSTRAINT `auto_signal_active_key_unique` UNIQUE(`activeKey`);--> statement-breakpoint
CREATE INDEX `auto_signal_delivery_status_index` ON `auto_signal_deliveries` (`userId`,`status`);
