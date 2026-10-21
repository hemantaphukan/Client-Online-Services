<?php
require_once __DIR__ . '/db.php';

try {
    $pdo = getDBConnection();
    
    // Check tables
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);

    $tableCounts = [];
    foreach ($tables as $table) {
        $countStmt = $pdo->query("SELECT COUNT(*) FROM `$table`");
        $tableCounts[$table] = (int)$countStmt->fetchColumn();
    }

    $requiredTables = [
        'users', 
        'services', 
        'orders', 
        'wallet_requests', 
        'wallet_transactions', 
        'notifications', 
        'company_payment_settings', 
        'file_attachments'
    ];
    $missingTables = array_diff($requiredTables, $tables);

    $isReady = count($missingTables) === 0;

    sendJson([
        'success'         => true,
        'message'         => $isReady ? 'Database connected and all tables ready!' : 'Database connected, but some tables are missing.',
        'host'            => DB_HOST,
        'database'        => DB_NAME,
        'user'            => DB_USER,
        'tables_found'    => $tables,
        'table_counts'    => $tableCounts,
        'missing_tables'  => array_values($missingTables),
        'is_schema_ready' => $isReady,
        'timestamp'       => date('Y-m-d H:i:s')
    ]);
} catch (Exception $e) {
    sendError('Failed to inspect database: ' . $e->getMessage(), 500);
}
