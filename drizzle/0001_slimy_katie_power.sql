CREATE TABLE `app_users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(64) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`role` enum('admin','reseller') NOT NULL DEFAULT 'reseller',
	`plan` enum('monthly','annual') DEFAULT 'monthly',
	`credits` int NOT NULL DEFAULT 0,
	`is_banned` boolean NOT NULL DEFAULT false,
	`ban_reason` text,
	`ban_expires_at` timestamp,
	`account_expires_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`last_login_at` timestamp,
	`last_login_ip` varchar(64),
	CONSTRAINT `app_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `app_users_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
CREATE TABLE `credit_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`admin_id` int,
	`amount` int NOT NULL,
	`reason` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `credit_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `devices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key_id` int NOT NULL,
	`hwid` varchar(255) NOT NULL,
	`is_banned` boolean NOT NULL DEFAULT false,
	`ban_reason` text,
	`first_seen_at` timestamp NOT NULL DEFAULT (now()),
	`last_seen_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `devices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `license_keys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(255) NOT NULL,
	`prefix` varchar(64) NOT NULL,
	`duration` varchar(32) NOT NULL,
	`duration_days` int NOT NULL,
	`package_id` int NOT NULL,
	`owner_id` int,
	`max_devices` int NOT NULL DEFAULT 1,
	`is_activated` boolean NOT NULL DEFAULT false,
	`is_custom` boolean NOT NULL DEFAULT false,
	`is_paused` boolean NOT NULL DEFAULT false,
	`is_banned` boolean NOT NULL DEFAULT false,
	`ban_reason` text,
	`activated_at` timestamp,
	`expires_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `license_keys_id` PRIMARY KEY(`id`),
	CONSTRAINT `license_keys_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('login','logout','key_activation','key_validation','key_created','key_banned','key_unbanned','key_paused','key_deleted','key_days_added','user_created','user_banned','user_unbanned','package_created','package_paused','package_update_forced','credits_added','api_error','admin_action') NOT NULL,
	`message` text NOT NULL,
	`user_id` int,
	`key_id` int,
	`package_id` int,
	`ip` varchar(64),
	`metadata` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `packages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`token` varchar(64) NOT NULL,
	`owner_id` int,
	`is_paused` boolean NOT NULL DEFAULT false,
	`force_update` boolean NOT NULL DEFAULT false,
	`update_message` text,
	`contact_link` varchar(512),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `packages_id` PRIMARY KEY(`id`),
	CONSTRAINT `packages_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `prefixes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(64) NOT NULL,
	`owner_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `prefixes_id` PRIMARY KEY(`id`)
);
