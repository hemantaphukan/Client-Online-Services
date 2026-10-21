<?php
/**
 * ServiceMaster Pro - InfinityFree Database Configuration
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// EDIT THESE 4 VALUES WITH YOUR INFINITYFREE CPANEL / MYSQL CREDENTIALS:
define('DB_HOST', getenv('DB_HOST') ?: 'sql308.infinityfree.com'); // e.g. sql308.infinityfree.com
define('DB_NAME', getenv('DB_NAME') ?: 'epiz_34567890_servicemaster'); // e.g. epiz_34567890_servicemaster
define('DB_USER', getenv('DB_USER') ?: 'epiz_34567890');             // e.g. epiz_34567890
define('DB_PASS', getenv('DB_PASS') ?: 'YourInfinityFreeVPanelPassword'); // Your vPanel Account Password
define('DB_PORT', getenv('DB_PORT') ?: '3306');
define('DB_CHARSET', 'utf8mb4');

define('APP_NAME', 'ServiceMaster Pro');
define('ALLOW_REGISTRATION', true);
