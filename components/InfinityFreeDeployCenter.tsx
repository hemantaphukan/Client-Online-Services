import React, { useState } from 'react';
import { 
  Server, 
  Database, 
  Code, 
  Copy, 
  CheckCheck, 
  Download, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Globe, 
  ShieldCheck, 
  Terminal, 
  HelpCircle,
  Sparkles,
  FileText,
  FileCheck,
  Check,
  CheckSquare
} from 'lucide-react';
import { api, DBTestResult, getApiBaseUrl, setApiBaseUrl } from '../services/api';

interface InfinityFreeDeployCenterProps {
  onNotify?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const InfinityFreeDeployCenter: React.FC<InfinityFreeDeployCenterProps> = ({ onNotify }) => {
  // Config generator states
  const [dbHost, setDbHost] = useState('sql308.infinityfree.com');
  const [dbName, setDbName] = useState('epiz_34567890_servicemaster');
  const [dbUser, setDbUser] = useState('epiz_34567890');
  const [dbPass, setDbPass] = useState('');

  // Diagnostic states
  const [testApiUrl, setTestApiUrl] = useState(() => getApiBaseUrl());
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<DBTestResult | null>(null);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [setupResult, setSetupResult] = useState<{ success: boolean; message: string } | null>(null);

  // Snippets & Clipboard feedback
  const [selectedSnippet, setSelectedSnippet] = useState<
    'config.php' | 'database.sql' | '.htaccess' | 'setup.php' | 'test_db.php' | 'auth.php' | 'orders.php' | 'wallet.php'
  >('config.php');
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  // Interactive Checklist
  const [completedSteps, setCompletedSteps] = useState<number[]>([1]);

  const toggleStep = (stepNumber: number) => {
    setCompletedSteps(prev => 
      prev.includes(stepNumber) ? prev.filter(s => s !== stepNumber) : [...prev, stepNumber]
    );
  };

  const notify = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    if (onNotify) {
      onNotify(msg, type);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFile(label);
    notify(`Copied ${label} to clipboard!`, 'success');
    setTimeout(() => setCopiedFile(null), 2500);
  };

  const handleDownloadFile = (filename: string, content: string, mime: string = 'text/plain') => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notify(`Downloaded ${filename}!`, 'success');
  };

  // Generate dynamic config.php
  const generatedConfigPhp = `<?php
/**
 * ServiceMaster Pro - InfinityFree Database Configuration
 * Configured on: ${new Date().toISOString()}
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ==============================================================================
// YOUR INFINITYFREE CPANEL / MYSQL CREDENTIALS:
// ==============================================================================
define('DB_HOST', '${dbHost.trim() || 'sql308.infinityfree.com'}');
define('DB_NAME', '${dbName.trim() || 'epiz_34567890_servicemaster'}');
define('DB_USER', '${dbUser.trim() || 'epiz_34567890'}');
define('DB_PASS', '${dbPass.trim() || 'YourInfinityFreeVPanelPassword'}');
define('DB_PORT', '3306');
define('DB_CHARSET', 'utf8mb4');

define('APP_NAME', 'ServiceMaster Pro');
define('ALLOW_REGISTRATION', true);
?>`;

  // Test live MySQL connection
  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    setSetupResult(null);
    try {
      setApiBaseUrl(testApiUrl);
      const res = await api.testConnection(testApiUrl);
      setTestResult(res);
      if (res.success) {
        notify('MySQL Connection successful!', 'success');
      } else {
        notify('Connection test failed. Check settings.', 'error');
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: 'Network request error: ' + err.message,
        error: err.message
      });
      notify('Could not reach API test endpoint', 'error');
    } finally {
      setIsTesting(false);
    }
  };

  // 1-Click Database Setup execution
  const handleAutoSetup = async () => {
    setIsSettingUp(true);
    setSetupResult(null);
    try {
      const res = await api.runSetup(testApiUrl);
      setSetupResult(res);
      if (res.success) {
        notify(res.message, 'success');
        // Refresh connection test
        handleTestConnection();
      } else {
        notify('Auto-setup failed: ' + res.message, 'error');
      }
    } catch (err: any) {
      setSetupResult({
        success: false,
        message: 'Setup failed: ' + (err.message || 'Unknown network error')
      });
      notify('Auto-setup call failed', 'error');
    } finally {
      setIsSettingUp(false);
    }
  };

  const HTACCESS_CODE = `# ServiceMaster Pro - Apache Configuration for InfinityFree
# Place this .htaccess in the root of your htdocs folder

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # 1. Do not rewrite existing files or directories
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  # 2. Allow direct access to the api directory
  RewriteRule ^api/ - [L]

  # 3. Rewrite all other requests to index.html for Single Page Application (SPA) routing
  RewriteRule ^ index.html [L]
</IfModule>

# Security: Prevent viewing of sensitive files
<FilesMatch "(^\.env|\.sql|\.git|config\.sample)">
  Order Allow,Deny
  Deny from all
</FilesMatch>

# Enable CORS headers for API requests
<IfModule mod_headers.c>
  Header always set Access-Control-Allow-Origin "*"
  Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
  Header always set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
</IfModule>`;

  const SQL_SCHEMA_FULL = `-- phpMyAdmin SQL Dump
-- ServiceMaster Pro - Complete Database Schema for InfinityFree MySQL
-- Target: MySQL 5.7+ / MariaDB 10.x / InfinityFree phpMyAdmin

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET NAMES utf8mb4 */;

-- --------------------------------------------------------
-- Table: users
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`users\` (
  \`id\` VARCHAR(50) NOT NULL,
  \`username\` VARCHAR(100) NOT NULL UNIQUE,
  \`password\` VARCHAR(255) NOT NULL,
  \`full_name\` VARCHAR(150) NOT NULL,
  \`role\` ENUM('ADMIN', 'CUSTOMER', 'GUEST') NOT NULL DEFAULT 'CUSTOMER',
  \`status\` ENUM('PENDING', 'ACTIVE', 'REJECTED') NOT NULL DEFAULT 'PENDING',
  \`wallet_balance\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: services
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`services\` (
  \`id\` VARCHAR(50) NOT NULL,
  \`name\` VARCHAR(200) NOT NULL,
  \`description\` TEXT NOT NULL,
  \`price\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`category\` VARCHAR(100) NOT NULL DEFAULT 'Development',
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: orders
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`orders\` (
  \`id\` VARCHAR(50) NOT NULL,
  \`user_id\` VARCHAR(50) NOT NULL,
  \`user_full_name\` VARCHAR(150) NOT NULL,
  \`service_id\` VARCHAR(50) NOT NULL,
  \`service_name\` VARCHAR(200) NOT NULL,
  \`amount\` DECIMAL(12,2) NOT NULL,
  \`payment_method\` ENUM('WALLET', 'DIRECT') NOT NULL DEFAULT 'WALLET',
  \`status\` ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
  \`notes\` TEXT DEFAULT NULL,
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  INDEX (\`user_id\`),
  INDEX (\`status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: wallet_requests
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`wallet_requests\` (
  \`id\` VARCHAR(50) NOT NULL,
  \`user_id\` VARCHAR(50) NOT NULL,
  \`user_full_name\` VARCHAR(150) NOT NULL,
  \`username\` VARCHAR(100) NOT NULL,
  \`amount\` DECIMAL(12,2) NOT NULL,
  \`payment_method\` VARCHAR(100) NOT NULL,
  \`transaction_ref\` VARCHAR(100) NOT NULL,
  \`notes\` TEXT DEFAULT NULL,
  \`status\` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`reviewed_at\` DATETIME DEFAULT NULL,
  \`admin_notes\` TEXT DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  INDEX (\`user_id\`),
  INDEX (\`status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: wallet_transactions
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`wallet_transactions\` (
  \`id\` VARCHAR(50) NOT NULL,
  \`user_id\` VARCHAR(50) NOT NULL,
  \`user_full_name\` VARCHAR(150) NOT NULL,
  \`type\` ENUM('CREDIT', 'DEBIT') NOT NULL,
  \`amount\` DECIMAL(12,2) NOT NULL,
  \`description\` VARCHAR(255) NOT NULL,
  \`reference_id\` VARCHAR(100) DEFAULT NULL,
  \`balance_after\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  INDEX (\`user_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: notifications
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`notifications\` (
  \`id\` VARCHAR(50) NOT NULL,
  \`title\` VARCHAR(255) NOT NULL,
  \`message\` TEXT NOT NULL,
  \`type\` VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
  \`is_read\` TINYINT(1) NOT NULL DEFAULT 0,
  \`for_role\` VARCHAR(20) DEFAULT NULL,
  \`user_id\` VARCHAR(50) DEFAULT NULL,
  \`order_id\` VARCHAR(50) DEFAULT NULL,
  \`link_tab\` VARCHAR(50) DEFAULT NULL,
  \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  INDEX (\`user_id\`),
  INDEX (\`for_role\`),
  INDEX (\`is_read\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: company_payment_settings
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`company_payment_settings\` (
  \`id\` INT NOT NULL DEFAULT 1,
  \`bank_name\` VARCHAR(150) NOT NULL,
  \`account_number\` VARCHAR(50) NOT NULL,
  \`account_holder_name\` VARCHAR(150) NOT NULL,
  \`ifsc_code\` VARCHAR(30) NOT NULL,
  \`branch_name\` VARCHAR(150) DEFAULT NULL,
  \`upi_id\` VARCHAR(100) NOT NULL,
  \`qr_code_url\` TEXT DEFAULT NULL,
  \`instructions\` TEXT DEFAULT NULL,
  \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table: file_attachments
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`file_attachments\` (
  \`id\` VARCHAR(50) NOT NULL,
  \`parent_type\` ENUM('WALLET_REQUEST', 'ORDER', 'SERVICE') NOT NULL,
  \`parent_id\` VARCHAR(50) NOT NULL,
  \`file_name\` VARCHAR(255) NOT NULL,
  \`file_size\` INT NOT NULL DEFAULT 0,
  \`mime_type\` VARCHAR(100) NOT NULL DEFAULT 'application/octet-stream',
  \`data_url\` LONGTEXT NOT NULL,
  \`uploaded_by\` VARCHAR(100) NOT NULL,
  \`uploaded_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  INDEX (\`parent_type\`, \`parent_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Seeding Initial Data
-- --------------------------------------------------------

-- 1. Default Users (Admin: admin / password123, Customer: john_doe / password123)
INSERT INTO \`users\` (\`id\`, \`username\`, \`password\`, \`full_name\`, \`role\`, \`status\`, \`wallet_balance\`, \`created_at\`) VALUES
('admin1', 'admin', 'password123', 'System Administrator', 'ADMIN', 'ACTIVE', 0.00, '2025-01-01 00:00:00'),
('cust1', 'john_doe', 'password123', 'John Doe', 'CUSTOMER', 'ACTIVE', 2500.00, '2025-01-02 10:00:00'),
('cust2', 'jane_pending', 'password123', 'Jane Pending', 'CUSTOMER', 'PENDING', 0.00, '2025-01-03 14:30:00'),
('cust3', 'alex_smith', 'password123', 'Alex Smith', 'CUSTOMER', 'ACTIVE', 1200.00, '2025-01-04 12:00:00')
ON DUPLICATE KEY UPDATE \`username\`=\`username\`;

-- 2. Default Company Payment Details (HDFC & UPI)
INSERT INTO \`company_payment_settings\` (\`id\`, \`bank_name\`, \`account_number\`, \`account_holder_name\`, \`ifsc_code\`, \`branch_name\`, \`upi_id\`, \`instructions\`) VALUES
(1, 'HDFC Bank Ltd', '5020-0012-9843-11', 'ServiceMaster Global Solutions India Pvt Ltd', 'HDFC0001298', 'Indiranagar Main Branch, Bengaluru', 'pay@servicemaster', 'Please transfer using any UPI app (GPay, PhonePe, Paytm) or IMPS/NEFT, then enter the 12-digit UTR/Ref number and attach your payment screenshot below.')
ON DUPLICATE KEY UPDATE \`bank_name\`=VALUES(\`bank_name\`);

-- 3. Default Services
INSERT INTO \`services\` (\`id\`, \`name\`, \`description\`, \`price\`, \`category\`, \`created_at\`) VALUES
('s1', 'Web Development Basic', 'A simple 5-page informational website with contact form and responsive design.', 4999.00, 'Development', '2025-01-01 12:00:00'),
('s2', 'E-commerce Solution', 'Full-featured online store with payment gateway integration and inventory.', 14999.00, 'Development', '2025-01-01 12:00:00'),
('s3', 'SEO & Performance Optimization', 'Comprehensive website audit, speed optimization, and on-page keyword setup.', 2999.00, 'Marketing', '2025-01-01 12:00:00'),
('s4', 'Brand Identity & Logo Design', 'Professional logo suite, vector assets, typography guide, and brand color palette.', 1999.00, 'Design', '2025-01-01 12:00:00')
ON DUPLICATE KEY UPDATE \`name\`=VALUES(\`name\`);

COMMIT;`;

  const getActiveSnippetCode = () => {
    switch (selectedSnippet) {
      case 'config.php':
        return generatedConfigPhp;
      case 'database.sql':
        return SQL_SCHEMA_FULL;
      case '.htaccess':
        return HTACCESS_CODE;
      case 'setup.php':
        return `<?php
require_once __DIR__ . '/db.php';
// 1-Click Database Setup script on InfinityFree
// Automatically executes database.sql on the connected MySQL database.
// Visit: https://yourdomain.infinityfreeapp.com/api/setup.php`;
      case 'test_db.php':
        return `<?php
require_once __DIR__ . '/db.php';
// Database connection tester
// Visit: https://yourdomain.infinityfreeapp.com/api/test_db.php`;
      case 'auth.php':
        return `<?php
require_once __DIR__ . '/db.php';
// Handles: login, register, users list, update status, and wallet adjustment
// Endpoint: /api/auth.php`;
      case 'orders.php':
        return `<?php
require_once __DIR__ . '/db.php';
// Handles: list orders, create order with wallet deduction, update status, attachments
// Endpoint: /api/orders.php`;
      case 'wallet.php':
        return `<?php
require_once __DIR__ . '/db.php';
// Handles: request topup, approve, reject, transactions ledger, receipts
// Endpoint: /api/wallet.php`;
      default:
        return generatedConfigPhp;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* HERO BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 rounded-full text-xs font-semibold mb-3">
            <Server className="w-3.5 h-3.5" />
            <span>InfinityFree &bull; MySQL &bull; phpMyAdmin &bull; PHP PDO</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            InfinityFree & MySQL Hosting Center
          </h2>
          <p className="mt-2 text-slate-300 text-sm max-w-2xl leading-relaxed">
            Everything you need to host ServiceMaster Pro online on InfinityFree with full MySQL database persistence, phpMyAdmin schema import, and Apache SPA configuration.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <a
              href="https://app.infinityfree.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg transition-all"
            >
              <Globe className="w-4 h-4" />
              <span>Open InfinityFree vPanel</span>
              <ExternalLink className="w-3.5 h-3.5 ml-1 opacity-70" />
            </a>

            <button
              onClick={() => handleDownloadFile('database.sql', SQL_SCHEMA_FULL, 'application/sql')}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Download database.sql</span>
            </button>

            <button
              onClick={() => handleDownloadFile('config.php', generatedConfigPhp, 'application/x-httpd-php')}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all"
            >
              <Download className="w-4 h-4 text-indigo-400" />
              <span>Download config.php</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 1: INTERACTIVE 6-STEP DEPLOYMENT CHECKLIST */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <CheckSquare className="w-5 h-5 text-indigo-600" />
              <span>Interactive InfinityFree Deployment Checklist</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any step to mark as completed. Follow these steps in order for a smooth launch.
            </p>
          </div>
          <div className="text-xs font-bold px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
            {completedSteps.length} of 6 Completed
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* STEP 1 */}
          <div 
            onClick={() => toggleStep(1)}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              completedSteps.includes(1) 
                ? 'bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-400/20' 
                : 'bg-slate-50 hover:bg-white border-slate-200'
            }`}
          >
            <div className="flex items-start justify-between">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-white border shadow-sm">
                1
              </span>
              {completedSteps.includes(1) && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            </div>
            <h4 className="font-bold text-sm text-slate-900 mt-2">Create InfinityFree Account</h4>
            <p className="text-xs text-slate-600 mt-1">
              Sign up at infinityfree.com and create a free account with your subdomain (e.g. <span className="font-mono text-indigo-700">yoursite.epizy.com</span>).
            </p>
          </div>

          {/* STEP 2 */}
          <div 
            onClick={() => toggleStep(2)}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              completedSteps.includes(2) 
                ? 'bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-400/20' 
                : 'bg-slate-50 hover:bg-white border-slate-200'
            }`}
          >
            <div className="flex items-start justify-between">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-white border shadow-sm">
                2
              </span>
              {completedSteps.includes(2) && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            </div>
            <h4 className="font-bold text-sm text-slate-900 mt-2">Create MySQL Database in vPanel</h4>
            <p className="text-xs text-slate-600 mt-1">
              In VistaPanel &rarr; "MySQL Databases", create a new database. Note your Host (<span className="font-mono text-indigo-700">sqlXXX.infinityfree.com</span>), DB Name, and User.
            </p>
          </div>

          {/* STEP 3 */}
          <div 
            onClick={() => toggleStep(3)}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              completedSteps.includes(3) 
                ? 'bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-400/20' 
                : 'bg-slate-50 hover:bg-white border-slate-200'
            }`}
          >
            <div className="flex items-start justify-between">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-white border shadow-sm">
                3
              </span>
              {completedSteps.includes(3) && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            </div>
            <h4 className="font-bold text-sm text-slate-900 mt-2">Import database.sql in phpMyAdmin</h4>
            <p className="text-xs text-slate-600 mt-1">
              Click the "phpMyAdmin" button next to your database, open the "Import" tab, choose <span className="font-mono text-indigo-700">database.sql</span> and click Go.
            </p>
          </div>

          {/* STEP 4 */}
          <div 
            onClick={() => toggleStep(4)}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              completedSteps.includes(4) 
                ? 'bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-400/20' 
                : 'bg-slate-50 hover:bg-white border-slate-200'
            }`}
          >
            <div className="flex items-start justify-between">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-white border shadow-sm">
                4
              </span>
              {completedSteps.includes(4) && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            </div>
            <h4 className="font-bold text-sm text-slate-900 mt-2">Configure api/config.php</h4>
            <p className="text-xs text-slate-600 mt-1">
              Fill in your 4 credentials in the generator below, then download or paste into <span className="font-mono text-indigo-700">api/config.php</span>.
            </p>
          </div>

          {/* STEP 5 */}
          <div 
            onClick={() => toggleStep(5)}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              completedSteps.includes(5) 
                ? 'bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-400/20' 
                : 'bg-slate-50 hover:bg-white border-slate-200'
            }`}
          >
            <div className="flex items-start justify-between">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-white border shadow-sm">
                5
              </span>
              {completedSteps.includes(5) && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            </div>
            <h4 className="font-bold text-sm text-slate-900 mt-2">Upload Files into htdocs/</h4>
            <p className="text-xs text-slate-600 mt-1">
              Run <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-[11px]">npm run build</span> and upload all contents of <span className="font-mono text-indigo-700">dist/</span> directly into your InfinityFree <span className="font-mono text-indigo-700">htdocs/</span>.
            </p>
          </div>

          {/* STEP 6 */}
          <div 
            onClick={() => toggleStep(6)}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              completedSteps.includes(6) 
                ? 'bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-400/20' 
                : 'bg-slate-50 hover:bg-white border-slate-200'
            }`}
          >
            <div className="flex items-start justify-between">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-white border shadow-sm">
                6
              </span>
              {completedSteps.includes(6) && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            </div>
            <h4 className="font-bold text-sm text-slate-900 mt-2">Test Live MySQL & Login</h4>
            <p className="text-xs text-slate-600 mt-1">
              Visit <span className="font-mono text-indigo-700">/api/test_db.php</span> to confirm all 8 tables are online. Login as admin (<span className="font-mono text-indigo-700">admin</span> / <span className="font-mono text-indigo-700">password123</span>).
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 2: LIVE CONNECTION & DIAGNOSTIC TOOL */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Database className="w-5 h-5 text-indigo-600" />
              <span>Live MySQL Connection & Diagnostic Tool</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Test your InfinityFree MySQL database connection in real-time or run the 1-Click Database Installer.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Testing...' : 'Test MySQL Connection'}</span>
            </button>

            <button
              onClick={handleAutoSetup}
              disabled={isSettingUp}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all"
              title="Runs database.sql directly via /api/setup.php"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isSettingUp ? 'Running Setup...' : '1-Click Auto Setup'}</span>
            </button>
          </div>
        </div>

        {/* API URL INPUT */}
        <div className="mb-4">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Backend API Endpoint URL
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              value={testApiUrl}
              onChange={(e) => setTestApiUrl(e.target.value)}
              placeholder="e.g. /api or https://yourname.infinityfreeapp.com/api"
              className="flex-1 px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <button
              onClick={() => {
                setTestApiUrl('/api');
                setApiBaseUrl('/api');
                notify('Reset API path to default /api', 'info');
              }}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
            >
              Reset to /api
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            When uploaded to InfinityFree, leave this as <code className="text-slate-600">/api</code>. If testing from localhost or remote preview, enter your full live URL (e.g. <code className="text-slate-600">https://yourname.infinityfreeapp.com/api</code>).
          </p>
        </div>

        {/* RESULTS CARD */}
        {testResult && (
          <div className={`p-4 rounded-xl border text-xs animate-in fade-in duration-150 ${
            testResult.success 
              ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950' 
              : 'bg-red-50/70 border-red-300 text-red-950'
          }`}>
            <div className="flex items-center space-x-2 font-bold mb-2">
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600" />
              )}
              <span className="text-sm">{testResult.message}</span>
            </div>

            {testResult.success && (
              <div className="space-y-3 mt-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="bg-white/80 p-2 rounded-lg border border-emerald-200">
                    <span className="text-slate-500 block">Host:</span>
                    <span className="font-mono font-bold text-slate-900">{testResult.host || dbHost}</span>
                  </div>
                  <div className="bg-white/80 p-2 rounded-lg border border-emerald-200">
                    <span className="text-slate-500 block">Database:</span>
                    <span className="font-mono font-bold text-slate-900">{testResult.database || dbName}</span>
                  </div>
                  <div className="bg-white/80 p-2 rounded-lg border border-emerald-200">
                    <span className="text-slate-500 block">User:</span>
                    <span className="font-mono font-bold text-slate-900">{testResult.user || dbUser}</span>
                  </div>
                  <div className="bg-white/80 p-2 rounded-lg border border-emerald-200">
                    <span className="text-slate-500 block">Tables Found:</span>
                    <span className="font-bold text-emerald-700">{testResult.tables_found?.length || 0} / 8</span>
                  </div>
                </div>

                {testResult.table_counts && Object.keys(testResult.table_counts).length > 0 && (
                  <div>
                    <span className="font-bold text-slate-800 block mb-1.5">Detected MySQL Tables & Record Counts:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(testResult.table_counts).map(([tbl, count]) => (
                        <span key={tbl} className="px-2 py-1 bg-white rounded-md border border-emerald-200 font-mono text-[11px] text-slate-800">
                          {tbl} <span className="text-emerald-600 font-bold">({count})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {testResult.missing_tables && testResult.missing_tables.length > 0 && (
                  <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-300 text-amber-900 text-xs">
                    <strong>Missing Tables:</strong> {testResult.missing_tables.join(', ')}. Click <strong>"1-Click Auto Setup"</strong> above or import <span className="font-mono">database.sql</span> in phpMyAdmin.
                  </div>
                )}
              </div>
            )}

            {!testResult.success && (
              <div className="mt-2 text-xs text-red-800 bg-white/70 p-3 rounded-lg border border-red-200">
                <p><strong>Troubleshooting Tip:</strong></p>
                <ul className="list-disc pl-4 mt-1 space-y-1 text-[11px]">
                  <li>Ensure your InfinityFree MySQL details are entered in <span className="font-mono">api/config.php</span>.</li>
                  <li>InfinityFree requires MySQL host to be in the form <span className="font-mono">sqlXXX.infinityfree.com</span> (NOT localhost).</li>
                  <li>Ensure your password is your InfinityFree vPanel account password.</li>
                  <li>Check that your files have been uploaded into the <span className="font-mono">htdocs/</span> directory.</li>
                </ul>
              </div>
            )}
          </div>
        )}

        {setupResult && (
          <div className={`mt-3 p-3 rounded-xl border text-xs ${
            setupResult.success ? 'bg-emerald-50 border-emerald-300 text-emerald-950' : 'bg-red-50 border-red-300 text-red-950'
          }`}>
            <div className="flex items-center space-x-2 font-bold">
              {setupResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
              <span>{setupResult.message}</span>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: INTERACTIVE CONFIG.PHP GENERATOR */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Terminal className="w-5 h-5 text-indigo-600" />
              <span>Interactive config.php Generator</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter the MySQL details from your InfinityFree VistaPanel. The configuration file updates in real time.
            </p>
          </div>
          <button
            onClick={() => handleDownloadFile('config.php', generatedConfigPhp, 'application/x-httpd-php')}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download config.php</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              MySQL Hostname *
            </label>
            <input
              type="text"
              value={dbHost}
              onChange={(e) => setDbHost(e.target.value)}
              placeholder="e.g. sql308.infinityfree.com"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">Found in vPanel &rarr; MySQL Databases</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Database Name *
            </label>
            <input
              type="text"
              value={dbName}
              onChange={(e) => setDbName(e.target.value)}
              placeholder="e.g. epiz_34567890_servicemaster"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">Prefix + your DB name</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              MySQL Username *
            </label>
            <input
              type="text"
              value={dbUser}
              onChange={(e) => setDbUser(e.target.value)}
              placeholder="e.g. epiz_34567890"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">Your InfinityFree vPanel username</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              MySQL Password *
            </label>
            <input
              type="password"
              value={dbPass}
              onChange={(e) => setDbPass(e.target.value)}
              placeholder="Your vPanel Password"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">Your vPanel Account Password</span>
          </div>
        </div>

        {/* LIVE CODE VIEWER */}
        <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
          <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs">
            <span className="font-mono text-slate-400">api/config.php (Live Generated Preview)</span>
            <button
              onClick={() => copyToClipboard(generatedConfigPhp, 'config.php')}
              className="flex items-center space-x-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-semibold border border-slate-700"
            >
              {copiedFile === 'config.php' ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedFile === 'config.php' ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>
          <pre className="p-4 text-slate-200 font-mono text-xs overflow-x-auto max-h-56">
            <code>{generatedConfigPhp}</code>
          </pre>
        </div>
      </div>

      {/* SECTION 4: CODE SNIPPET EXPLORER & DOWNLOADS */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Code className="w-5 h-5 text-indigo-600" />
              <span>Full Production PHP & MySQL Files</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Inspect and copy any of the backend endpoints or configuration files.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => copyToClipboard(getActiveSnippetCode(), selectedSnippet)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200"
            >
              {copiedFile === selectedSnippet ? <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedFile === selectedSnippet ? 'Copied!' : `Copy ${selectedSnippet}`}</span>
            </button>

            <button
              onClick={() => handleDownloadFile(selectedSnippet, getActiveSnippetCode())}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          </div>
        </div>

        {/* FILE SELECTOR TABS */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { id: 'config.php', label: 'api/config.php', icon: Terminal },
            { id: 'database.sql', label: 'database.sql', icon: Database },
            { id: '.htaccess', label: '.htaccess (Apache)', icon: FileText },
            { id: 'setup.php', label: 'api/setup.php', icon: Sparkles },
            { id: 'test_db.php', label: 'api/test_db.php', icon: RefreshCw },
            { id: 'auth.php', label: 'api/auth.php', icon: ShieldCheck },
            { id: 'orders.php', label: 'api/orders.php', icon: FileCheck },
            { id: 'wallet.php', label: 'api/wallet.php', icon: Server }
          ].map(f => {
            const Icon = f.icon;
            const isSelected = selectedSnippet === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setSelectedSnippet(f.id as any)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isSelected 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{f.label}</span>
              </button>
            );
          })}
        </div>

        {/* CODE PREVIEW BOX */}
        <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
          <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs">
            <span className="font-mono text-slate-300">{selectedSnippet}</span>
            <span className="text-[11px] text-slate-400">Ready for InfinityFree Apache / PHP</span>
          </div>
          <pre className="p-4 text-slate-200 font-mono text-xs overflow-x-auto max-h-96">
            <code>{getActiveSnippetCode()}</code>
          </pre>
        </div>
      </div>

      {/* SECTION 5: DEFAULT CREDENTIALS SUMMARY */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5">
        <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2 mb-3">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          <span>Pre-Seeded Login Accounts in database.sql</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-white p-3 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-900 block">System Administrator</span>
            <div className="mt-1 space-y-0.5 text-slate-600">
              <div>Username: <span className="font-mono font-bold text-indigo-700">admin</span></div>
              <div>Password: <span className="font-mono font-bold text-indigo-700">password123</span></div>
              <div className="text-[11px] text-slate-400">Full control over wallet, orders & bank details</div>
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-900 block">Active Demo Client</span>
            <div className="mt-1 space-y-0.5 text-slate-600">
              <div>Username: <span className="font-mono font-bold text-indigo-700">john_doe</span></div>
              <div>Password: <span className="font-mono font-bold text-indigo-700">password123</span></div>
              <div className="text-[11px] text-emerald-600 font-semibold">₹2,500.00 pre-loaded balance</div>
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-900 block">Pending Registration Client</span>
            <div className="mt-1 space-y-0.5 text-slate-600">
              <div>Username: <span className="font-mono font-bold text-indigo-700">jane_pending</span></div>
              <div>Password: <span className="font-mono font-bold text-indigo-700">password123</span></div>
              <div className="text-[11px] text-amber-600 font-semibold">Awaiting admin approval</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
