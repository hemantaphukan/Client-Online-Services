<?php
/**
 * ServiceMaster Pro - InfinityFree Database Configuration
 * 
 * Instructions for InfinityFree:
 * 1. Log in to your InfinityFree Control Panel (VistaPanel / vPanel)
 * 2. Click on "MySQL Databases" under the DATABASES section
 * 3. Note down your MySQL Hostname (e.g. sql100.infinityfree.com or sql205.epizy.com)
 * 4. Create a new database (e.g. epiz_XXXXXX_servicemaster)
 * 5. Update the constants below with your actual credentials!
 */

// Enable CORS for API requests
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=UTF-8');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ==============================================================================
// EDIT THESE 4 VALUES WITH YOUR INFINITYFREE CPANEL / MYSQL CREDENTIALS:
// ==============================================================================
define('DB_HOST', getenv('DB_HOST') ?: 'sql308.infinityfree.com'); // e.g. sql308.infinityfree.com or localhost
define('DB_NAME', getenv('DB_NAME') ?: 'epiz_34567890_servicemaster'); // e.g. epiz_34567890_servicemaster
define('DB_USER', getenv('DB_USER') ?: 'epiz_34567890');             // e.g. epiz_34567890
define('DB_PASS', getenv('DB_PASS') ?: 'YourInfinityFreeVPanelPassword'); // Your vPanel Account Password
define('DB_PORT', getenv('DB_PORT') ?: '3306');
define('DB_CHARSET', 'utf8mb4');

// App settings
define('APP_NAME', 'ServiceMaster Pro');
define('ALLOW_REGISTRATION', true);
