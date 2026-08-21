ALTER TABLE `telegram_news_settings` ADD `highImpactAlertsEnabled` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `telegram_news_settings` ADD `highImpactLeadMinutes` int DEFAULT 15 NOT NULL;--> statement-breakpoint
ALTER TABLE `telegram_news_settings` ADD `highImpactInstruments` varchar(512) DEFAULT 'XAUUSD,EURUSD,GBPUSD,USDJPY,AUDUSD,USDCAD,USDCHF,NZDUSD' NOT NULL;