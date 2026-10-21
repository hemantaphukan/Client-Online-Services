<?php
require_once __DIR__ . '/config.php';

function getDBConnection() {
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    $dsn = sprintf(
        'mysql:host=%s;port=%s;dbname=%s;charset=%s',
        DB_HOST,
        DB_PORT,
        DB_NAME,
        DB_CHARSET
    );

    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    try {
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        return $pdo;
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error'   => 'Database connection failed: ' . $e->getMessage(),
            'hint'    => 'Please check DB_HOST, DB_NAME, DB_USER, and DB_PASS in api/config.php with your InfinityFree MySQL settings in VistaPanel.'
        ]);
        exit();
    }
}

function sendJson($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit();
}

function sendError($message, $statusCode = 400, $details = null) {
    http_response_code($statusCode);
    $response = ['success' => false, 'error' => $message];
    if ($details !== null) {
        $response['details'] = $details;
    }
    echo json_encode($response);
    exit();
}

function getJsonInput() {
    $raw = file_get_contents('php://input');
    if (empty($raw)) {
        return $_POST;
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? array_merge($_POST, $decoded) : $_POST;
}
