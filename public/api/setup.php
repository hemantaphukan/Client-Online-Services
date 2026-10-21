<?php
/**
 * ServiceMaster Pro - 1-Click Database Setup & Migrator
 * Automatically executes database.sql on the connected MySQL database.
 */
require_once __DIR__ . '/db.php';

try {
    $pdo = getDBConnection();
    $sqlFile = __DIR__ . '/../database.sql';

    if (!file_exists($sqlFile)) {
        $sqlFile = __DIR__ . '/../../database.sql';
    }

    if (!file_exists($sqlFile)) {
        sendError('database.sql file not found on server.', 404);
    }

    $sqlContent = file_get_contents($sqlFile);
    
    // Remove comments and split statements
    $queries = explode(";\n", $sqlContent);
    $executed = 0;

    foreach ($queries as $query) {
        $trimmed = trim($query);
        if (!empty($trimmed) && strpos($trimmed, '--') !== 0 && strpos($trimmed, '/*') !== 0) {
            $pdo->exec($trimmed);
            $executed++;
        }
    }

    sendJson([
        'success'  => true,
        'message'  => "Successfully executed $executed database statements! All tables, indices, and seed data have been initialized.",
        'database' => DB_NAME,
        'host'     => DB_HOST
    ]);
} catch (Exception $e) {
    sendError('Setup failed: ' . $e->getMessage(), 500);
}
