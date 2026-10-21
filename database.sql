-- phpMyAdmin SQL Dump
-- ServiceMaster Pro - Complete Database Schema for InfinityFree MySQL
-- Target: MySQL 5.7+ / MariaDB 10.x / InfinityFree phpMyAdmin

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

-- --------------------------------------------------------
-- Table: users
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(50) NOT NULL,
  `username` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(150) NOT NULL,
  `role` ENUM('ADMIN', 'CUSTOMER', 'GUEST') NOT NULL DEFAULT 'CUSTOMER',
  `status` ENUM('PENDING', 'ACTIVE', 'REJECTED') NOT NULL DEFAULT 'PENDING',
  `wallet_balance` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: services
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `services` (
  `id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `description` TEXT NOT NULL,
  `price` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `category` VARCHAR(100) NOT NULL DEFAULT 'Development',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: orders
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `orders` (
  `id` VARCHAR(50) NOT NULL,
  `user_id` VARCHAR(50) NOT NULL,
  `user_full_name` VARCHAR(150) NOT NULL,
  `service_id` VARCHAR(50) NOT NULL,
  `service_name` VARCHAR(200) NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `payment_method` ENUM('WALLET', 'DIRECT') NOT NULL DEFAULT 'WALLET',
  `status` ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
  `notes` TEXT DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX (`user_id`),
  INDEX (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: wallet_requests
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `wallet_requests` (
  `id` VARCHAR(50) NOT NULL,
  `user_id` VARCHAR(50) NOT NULL,
  `user_full_name` VARCHAR(150) NOT NULL,
  `username` VARCHAR(100) NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `payment_method` VARCHAR(100) NOT NULL,
  `transaction_ref` VARCHAR(100) NOT NULL,
  `notes` TEXT DEFAULT NULL,
  `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `reviewed_at` DATETIME DEFAULT NULL,
  `admin_notes` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX (`user_id`),
  INDEX (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: wallet_transactions
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `wallet_transactions` (
  `id` VARCHAR(50) NOT NULL,
  `user_id` VARCHAR(50) NOT NULL,
  `user_full_name` VARCHAR(150) NOT NULL,
  `type` ENUM('CREDIT', 'DEBIT') NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `description` VARCHAR(255) NOT NULL,
  `reference_id` VARCHAR(100) DEFAULT NULL,
  `balance_after` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: notifications
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` VARCHAR(50) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `type` VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `for_role` VARCHAR(20) DEFAULT NULL,
  `user_id` VARCHAR(50) DEFAULT NULL,
  `order_id` VARCHAR(50) DEFAULT NULL,
  `link_tab` VARCHAR(50) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX (`user_id`),
  INDEX (`for_role`),
  INDEX (`is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: company_payment_settings
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `company_payment_settings` (
  `id` INT NOT NULL DEFAULT 1,
  `bank_name` VARCHAR(150) NOT NULL,
  `account_number` VARCHAR(50) NOT NULL,
  `account_holder_name` VARCHAR(150) NOT NULL,
  `ifsc_code` VARCHAR(30) NOT NULL,
  `branch_name` VARCHAR(150) DEFAULT NULL,
  `upi_id` VARCHAR(100) NOT NULL,
  `qr_code_url` TEXT DEFAULT NULL,
  `instructions` TEXT DEFAULT NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: file_attachments
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `file_attachments` (
  `id` VARCHAR(50) NOT NULL,
  `parent_type` ENUM('WALLET_REQUEST', 'ORDER', 'SERVICE') NOT NULL,
  `parent_id` VARCHAR(50) NOT NULL,
  `file_name` VARCHAR(255) NOT NULL,
  `file_size` INT NOT NULL DEFAULT 0,
  `mime_type` VARCHAR(100) NOT NULL DEFAULT 'application/octet-stream',
  `data_url` LONGTEXT NOT NULL,
  `uploaded_by` VARCHAR(100) NOT NULL,
  `uploaded_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX (`parent_type`, `parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Seeding Initial Data
-- --------------------------------------------------------

-- 1. Default Users (Admin & Customers)
INSERT INTO `users` (`id`, `username`, `password`, `full_name`, `role`, `status`, `wallet_balance`, `created_at`) VALUES
('admin1', 'admin', 'password123', 'System Administrator', 'ADMIN', 'ACTIVE', 0.00, '2025-01-01 00:00:00'),
('cust1', 'john_doe', 'password123', 'John Doe', 'CUSTOMER', 'ACTIVE', 2500.00, '2025-01-02 10:00:00'),
('cust2', 'jane_pending', 'password123', 'Jane Pending', 'CUSTOMER', 'PENDING', 0.00, '2025-01-03 14:30:00'),
('cust3', 'alex_smith', 'password123', 'Alex Smith', 'CUSTOMER', 'ACTIVE', 1200.00, '2025-01-04 12:00:00')
ON DUPLICATE KEY UPDATE `username`=`username`;

-- 2. Default Company Payment Details (HDFC & UPI)
INSERT INTO `company_payment_settings` (`id`, `bank_name`, `account_number`, `account_holder_name`, `ifsc_code`, `branch_name`, `upi_id`, `instructions`) VALUES
(1, 'HDFC Bank Ltd', '5020-0012-9843-11', 'ServiceMaster Global Solutions India Pvt Ltd', 'HDFC0001298', 'Indiranagar Main Branch, Bengaluru', 'pay@servicemaster', 'Please transfer using any UPI app (GPay, PhonePe, Paytm) or IMPS/NEFT, then enter the 12-digit UTR/Ref number and attach your payment screenshot below.')
ON DUPLICATE KEY UPDATE `bank_name`=VALUES(`bank_name`);

-- 3. Default Services
INSERT INTO `services` (`id`, `name`, `description`, `price`, `category`, `created_at`) VALUES
('s1', 'Web Development Basic', 'A simple 5-page informational website with contact form and responsive design.', 4999.00, 'Development', '2025-01-01 12:00:00'),
('s2', 'E-commerce Solution', 'Full-featured online store with payment gateway integration and inventory.', 14999.00, 'Development', '2025-01-01 12:00:00'),
('s3', 'SEO & Performance Optimization', 'Comprehensive website audit, speed optimization, and on-page keyword setup.', 2999.00, 'Marketing', '2025-01-01 12:00:00'),
('s4', 'Brand Identity & Logo Design', 'Professional logo suite, vector assets, typography guide, and brand color palette.', 1999.00, 'Design', '2025-01-01 12:00:00')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- 4. Sample Wallet Top-Up Request
INSERT INTO `wallet_requests` (`id`, `user_id`, `user_full_name`, `username`, `amount`, `payment_method`, `transaction_ref`, `notes`, `status`, `created_at`, `reviewed_at`, `admin_notes`) VALUES
('wreq_101', 'cust1', 'John Doe', 'john_doe', 1500.00, 'UPI / Google Pay', 'UPI-88921478', 'Paid via Google Pay to pay@servicemaster. Receipt attached.', 'PENDING', '2025-01-05 11:20:00', NULL, NULL)
ON DUPLICATE KEY UPDATE `amount`=VALUES(`amount`);

-- 5. Sample Wallet Transaction
INSERT INTO `wallet_transactions` (`id`, `user_id`, `user_full_name`, `type`, `amount`, `description`, `reference_id`, `balance_after`, `created_at`) VALUES
('tx_1001', 'cust1', 'John Doe', 'CREDIT', 2500.00, 'Wallet Top-up approved by Admin (Ref: TXN-90218844)', 'TXN-90218844', 2500.00, '2025-01-04 09:15:00')
ON DUPLICATE KEY UPDATE `amount`=VALUES(`amount`);

-- 6. Sample Order
INSERT INTO `orders` (`id`, `user_id`, `user_full_name`, `service_id`, `service_name`, `amount`, `payment_method`, `status`, `notes`, `created_at`) VALUES
('ord_1001', 'cust1', 'John Doe', 's4', 'Brand Identity & Logo Design', 1999.00, 'WALLET', 'PENDING', 'Need modern tech-style logo with blue/cyan gradient color palette.', '2025-01-05 15:30:00')
ON DUPLICATE KEY UPDATE `amount`=VALUES(`amount`);

-- 7. Sample Notifications
INSERT INTO `notifications` (`id`, `title`, `message`, `type`, `is_read`, `for_role`, `user_id`, `order_id`, `link_tab`, `created_at`) VALUES
('notif_1', '📦 New Order Received!', 'John Doe placed an order for "Brand Identity & Logo Design" (₹1,999) using Wallet.', 'ORDER_PLACED', 0, 'ADMIN', NULL, 'ord_1001', 'orders', '2025-01-05 15:30:00'),
('notif_2', '💳 New Top-Up Request', 'John Doe submitted a top-up request for ₹1,500 via UPI.', 'WALLET_REQUEST', 0, 'ADMIN', NULL, NULL, 'wallet-requests', '2025-01-05 11:20:00')
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`);

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
