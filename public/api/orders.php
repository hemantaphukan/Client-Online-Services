<?php
require_once __DIR__ . '/db.php';

$pdo = getDBConnection();
$input = getJsonInput();
$action = $_GET['action'] ?? $input['action'] ?? ($_SERVER['REQUEST_METHOD'] === 'GET' ? 'list' : '');

switch ($action) {
    case 'list':
        $userId = $_GET['userId'] ?? $input['userId'] ?? '';
        $role = $_GET['role'] ?? $input['role'] ?? 'ADMIN';

        if ($role === 'CUSTOMER' && !empty($userId)) {
            $stmt = $pdo->prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC");
            $stmt->execute([$userId]);
        } else {
            $stmt = $pdo->query("SELECT * FROM orders ORDER BY created_at DESC");
        }
        $orders = $stmt->fetchAll();

        // Get attachments for orders
        $orderIds = array_column($orders, 'id');
        $attMap = [];
        if (!empty($orderIds)) {
            $inClause = implode(',', array_fill(0, count($orderIds), '?'));
            $attStmt = $pdo->prepare("SELECT * FROM file_attachments WHERE parent_type = 'ORDER' AND parent_id IN ($inClause)");
            $attStmt->execute($orderIds);
            foreach ($attStmt->fetchAll() as $att) {
                $attMap[$att['parent_id']][] = [
                    'id'         => $att['id'],
                    'name'       => $att['file_name'],
                    'size'       => (int)$att['file_size'],
                    'type'       => $att['mime_type'],
                    'dataUrl'    => $att['data_url'],
                    'uploadedBy' => $att['uploaded_by'],
                    'uploadedAt' => $att['uploaded_at']
                ];
            }
        }

        $formatted = array_map(function($o) use ($attMap) {
            return [
                'id'            => $o['id'],
                'userId'        => $o['user_id'],
                'userFullName'  => $o['user_full_name'],
                'serviceId'     => $o['service_id'],
                'serviceName'   => $o['service_name'],
                'amount'        => (float)$o['amount'],
                'paymentMethod' => $o['payment_method'],
                'status'        => $o['status'],
                'notes'         => $o['notes'],
                'createdAt'     => $o['created_at'],
                'attachments'   => $attMap[$o['id']] ?? []
            ];
        }, $orders);

        sendJson(['success' => true, 'orders' => $formatted]);
        break;

    case 'create':
        $userId = trim($input['userId'] ?? '');
        $serviceId = trim($input['serviceId'] ?? '');
        $paymentMethod = trim($input['paymentMethod'] ?? 'WALLET');
        $notes = trim($input['notes'] ?? '');
        $attachments = $input['attachments'] ?? [];

        if (empty($userId) || empty($serviceId)) {
            sendError('User ID and Service ID are required');
        }

        $pdo->beginTransaction();
        try {
            // Get user
            $userStmt = $pdo->prepare("SELECT * FROM users WHERE id = ? FOR UPDATE");
            $userStmt->execute([$userId]);
            $user = $userStmt->fetch();
            if (!$user) {
                throw new Exception('User not found');
            }

            // Get service
            $servStmt = $pdo->prepare("SELECT * FROM services WHERE id = ?");
            $servStmt->execute([$serviceId]);
            $service = $servStmt->fetch();
            if (!$service) {
                throw new Exception('Service not found');
            }

            $amount = (float)$service['price'];
            $newBalance = (float)$user['wallet_balance'];

            // Handle wallet payment
            if ($paymentMethod === 'WALLET') {
                if ($newBalance < $amount) {
                    throw new Exception('Insufficient wallet balance. Please add funds to your wallet first.');
                }
                $newBalance -= $amount;
                $updUser = $pdo->prepare("UPDATE users SET wallet_balance = ? WHERE id = ?");
                $updUser->execute([$newBalance, $userId]);

                // Record DEBIT transaction
                $txId = 'tx_' . time() . '_' . rand(100, 999);
                $txStmt = $pdo->prepare("INSERT INTO wallet_transactions (id, user_id, user_full_name, type, amount, description, reference_id, balance_after, created_at) VALUES (?, ?, ?, 'DEBIT', ?, ?, ?, ?, NOW())");
                $txStmt->execute([
                    $txId,
                    $userId,
                    $user['full_name'],
                    $amount,
                    "Order payment for {$service['name']}",
                    $serviceId,
                    $newBalance
                ]);
            }

            // Insert order
            $orderId = 'ord_' . time() . '_' . rand(100, 999);
            $orderStmt = $pdo->prepare("INSERT INTO orders (id, user_id, user_full_name, service_id, service_name, amount, payment_method, status, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, NOW())");
            $orderStmt->execute([
                $orderId,
                $userId,
                $user['full_name'],
                $serviceId,
                $service['name'],
                $amount,
                $paymentMethod,
                $notes
            ]);

            // Save attachments if any
            if (is_array($attachments) && !empty($attachments)) {
                $attStmt = $pdo->prepare("INSERT INTO file_attachments (id, parent_type, parent_id, file_name, file_size, mime_type, data_url, uploaded_by, uploaded_at) VALUES (?, 'ORDER', ?, ?, ?, ?, ?, ?, NOW())");
                foreach ($attachments as $att) {
                    $attId = $att['id'] ?? ('att_' . time() . '_' . rand(100, 999));
                    $attStmt->execute([
                        $attId,
                        $orderId,
                        $att['name'] ?? 'requirement',
                        $att['size'] ?? 0,
                        $att['type'] ?? 'application/octet-stream',
                        $att['dataUrl'] ?? '',
                        $att['uploadedBy'] ?? $user['full_name']
                    ]);
                }
            }

            // Notifications
            // 1. For Admin
            $adminNotif = $pdo->prepare("INSERT INTO notifications (id, title, message, type, is_read, for_role, order_id, link_tab, created_at) VALUES (?, ?, ?, 'ORDER_PLACED', 0, 'ADMIN', ?, 'orders', NOW())");
            $adminNotif->execute([
                'notif_' . time() . '_adm',
                '📦 New Order Received!',
                "{$user['full_name']} placed order #{$orderId} for \"{$service['name']}\" (₹" . number_format($amount, 2) . ") via {$paymentMethod}.",
                $orderId
            ]);

            // 2. For Customer
            $custNotif = $pdo->prepare("INSERT INTO notifications (id, title, message, type, is_read, user_id, order_id, link_tab, created_at) VALUES (?, ?, ?, 'ORDER_PLACED', 0, ?, ?, 'my-orders', NOW())");
            $custNotif->execute([
                'notif_' . time() . '_cust',
                '🎉 Order Placed Successfully!',
                "Your order #{$orderId} for \"{$service['name']}\" (₹" . number_format($amount, 2) . ") has been confirmed and submitted to admin.",
                $userId,
                $orderId
            ]);

            $pdo->commit();
            sendJson([
                'success'    => true,
                'orderId'    => $orderId,
                'newBalance' => $newBalance,
                'message'    => 'Order placed successfully!'
            ]);
        } catch (Exception $e) {
            $pdo->rollBack();
            sendError($e->getMessage(), 400);
        }
        break;

    case 'update_status':
        $orderId = trim($input['orderId'] ?? '');
        $status = trim($input['status'] ?? '');

        if (empty($orderId) || !in_array($status, ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])) {
            sendError('Invalid order ID or status');
        }

        $stmt = $pdo->prepare("UPDATE orders SET status = ? WHERE id = ?");
        $stmt->execute([$status, $orderId]);

        // Notify client
        $orderStmt = $pdo->prepare("SELECT * FROM orders WHERE id = ?");
        $orderStmt->execute([$orderId]);
        $order = $orderStmt->fetch();

        if ($order) {
            $notifStmt = $pdo->prepare("INSERT INTO notifications (id, title, message, type, is_read, user_id, order_id, link_tab, created_at) VALUES (?, ?, ?, 'GENERAL', 0, ?, ?, 'my-orders', NOW())");
            $statusLabels = [
                'IN_PROGRESS' => 'is now In Progress ⏳',
                'COMPLETED'   => 'is now Completed! ✅',
                'CANCELLED'   => 'has been Cancelled ❌'
            ];
            $label = $statusLabels[$status] ?? "is now $status";
            $notifStmt->execute([
                'notif_' . time() . '_status',
                'Order Status Update',
                "Your order #{$orderId} ({$order['service_name']}) $label",
                $order['user_id'],
                $orderId
            ]);
        }

        sendJson(['success' => true, 'message' => "Order #$orderId updated to $status"]);
        break;

    case 'add_attachment':
        $orderId = trim($input['orderId'] ?? '');
        $attachment = $input['attachment'] ?? null;

        if (empty($orderId) || !is_array($attachment)) {
            sendError('Order ID and valid attachment object are required');
        }

        $attId = $attachment['id'] ?? ('att_' . time() . '_' . rand(100, 999));
        $stmt = $pdo->prepare("INSERT INTO file_attachments (id, parent_type, parent_id, file_name, file_size, mime_type, data_url, uploaded_by, uploaded_at) VALUES (?, 'ORDER', ?, ?, ?, ?, ?, ?, NOW())");
        $stmt->execute([
            $attId,
            $orderId,
            $attachment['name'] ?? 'deliverable',
            $attachment['size'] ?? 0,
            $attachment['type'] ?? 'application/octet-stream',
            $attachment['dataUrl'] ?? '',
            $attachment['uploadedBy'] ?? 'Administrator'
        ]);

        sendJson(['success' => true, 'id' => $attId, 'message' => 'Attachment uploaded to order']);
        break;

    case 'delete_attachment':
        $attachmentId = trim($input['attachmentId'] ?? '');
        if (empty($attachmentId)) {
            sendError('Attachment ID required');
        }

        $stmt = $pdo->prepare("DELETE FROM file_attachments WHERE id = ? AND parent_type = 'ORDER'");
        $stmt->execute([$attachmentId]);

        sendJson(['success' => true, 'message' => 'Order attachment deleted']);
        break;

    default:
        sendError('Invalid action');
}
