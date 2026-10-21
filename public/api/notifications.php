<?php
require_once __DIR__ . '/db.php';

$pdo = getDBConnection();
$input = getJsonInput();
$action = $_GET['action'] ?? $input['action'] ?? ($_SERVER['REQUEST_METHOD'] === 'GET' ? 'list' : '');

switch ($action) {
    case 'list':
        $userId = $_GET['userId'] ?? $input['userId'] ?? '';
        $role = $_GET['role'] ?? $input['role'] ?? 'GUEST';

        if ($role === 'ADMIN') {
            $stmt = $pdo->query("SELECT * FROM notifications WHERE for_role = 'ADMIN' OR for_role IS NULL ORDER BY created_at DESC LIMIT 50");
        } else {
            $stmt = $pdo->prepare("SELECT * FROM notifications WHERE user_id = ? OR (for_role = ? AND user_id IS NULL) ORDER BY created_at DESC LIMIT 50");
            $stmt->execute([$userId, $role]);
        }
        $rows = $stmt->fetchAll();

        $notifications = array_map(function($n) {
            return [
                'id'        => $n['id'],
                'title'     => $n['title'],
                'message'   => $n['message'],
                'type'      => $n['type'],
                'read'      => (bool)$n['is_read'],
                'forRole'   => $n['for_role'],
                'userId'    => $n['user_id'],
                'orderId'   => $n['order_id'],
                'linkTab'   => $n['link_tab'],
                'createdAt' => $n['created_at']
            ];
        }, $rows);

        sendJson(['success' => true, 'notifications' => $notifications]);
        break;

    case 'mark_read':
        $id = trim($input['id'] ?? '');
        if (!empty($id)) {
            $stmt = $pdo->prepare("UPDATE notifications SET is_read = 1 WHERE id = ?");
            $stmt->execute([$id]);
        }
        sendJson(['success' => true]);
        break;

    case 'mark_all_read':
        $userId = trim($input['userId'] ?? '');
        $role = trim($input['role'] ?? '');

        if ($role === 'ADMIN') {
            $pdo->exec("UPDATE notifications SET is_read = 1 WHERE for_role = 'ADMIN'");
        } elseif (!empty($userId)) {
            $stmt = $pdo->prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ?");
            $stmt->execute([$userId]);
        }
        sendJson(['success' => true]);
        break;

    case 'clear':
        $userId = trim($input['userId'] ?? '');
        $role = trim($input['role'] ?? '');

        if ($role === 'ADMIN') {
            $pdo->exec("DELETE FROM notifications WHERE for_role = 'ADMIN'");
        } elseif (!empty($userId)) {
            $stmt = $pdo->prepare("DELETE FROM notifications WHERE user_id = ?");
            $stmt->execute([$userId]);
        }
        sendJson(['success' => true]);
        break;

    default:
        sendError('Invalid action');
}
