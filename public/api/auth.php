<?php
require_once __DIR__ . '/db.php';

$pdo = getDBConnection();
$input = getJsonInput();
$action = $_GET['action'] ?? $input['action'] ?? '';

switch ($action) {
    case 'login':
        $username = trim($input['username'] ?? '');
        $password = trim($input['password'] ?? '');

        if (empty($username) || empty($password)) {
            sendError('Username and password are required');
        }

        $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
        $stmt->execute([$username]);
        $user = $stmt->fetch();

        if (!$user) {
            sendError('User not found. Please check your username or register.');
        }

        // Support plain text or hashed password
        $passwordValid = false;
        if ($user['password'] === $password || password_verify($password, $user['password'])) {
            $passwordValid = true;
        }

        if (!$passwordValid) {
            sendError('Invalid password credentials.');
        }

        if ($user['role'] === 'CUSTOMER' && $user['status'] === 'PENDING') {
            sendError('Your account registration is currently pending admin approval.');
        }

        if ($user['role'] === 'CUSTOMER' && $user['status'] === 'REJECTED') {
            sendError('Your account registration was rejected by the administrator.');
        }

        unset($user['password']);
        $user['walletBalance'] = (float)$user['wallet_balance'];
        $user['fullName'] = $user['full_name'];
        $user['createdAt'] = $user['created_at'];

        sendJson([
            'success' => true,
            'message' => 'Login successful',
            'user'    => $user
        ]);
        break;

    case 'register':
        $fullName = trim($input['fullName'] ?? $input['full_name'] ?? '');
        $username = trim($input['username'] ?? '');
        $password = trim($input['password'] ?? '');

        if (empty($fullName) || empty($username) || empty($password)) {
            sendError('Full name, username, and password are required');
        }

        // Check if username already exists
        $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
        $stmt->execute([$username]);
        if ($stmt->fetch()) {
            sendError('Username already taken. Please choose another username.');
        }

        $newId = 'cust_' . time() . '_' . rand(100, 999);
        $role = 'CUSTOMER';
        $status = 'PENDING';
        $walletBalance = 0.00;

        $insertStmt = $pdo->prepare("INSERT INTO users (id, username, password, full_name, role, status, wallet_balance, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())");
        $insertStmt->execute([$newId, $username, $password, $fullName, $role, $status, $walletBalance]);

        // Add admin notification for pending registration
        $notifStmt = $pdo->prepare("INSERT INTO notifications (id, title, message, type, is_read, for_role, link_tab, created_at) VALUES (?, ?, ?, 'GENERAL', 0, 'ADMIN', 'approvals', NOW())");
        $notifStmt->execute([
            'notif_' . time() . '_reg',
            '👤 New User Registration',
            "New client {$fullName} (@{$username}) registered and awaits account approval."
        ]);

        sendJson([
            'success' => true,
            'message' => 'Registration submitted! Please wait for an administrator to review and approve your account.'
        ]);
        break;

    case 'users':
        $stmt = $pdo->query("SELECT id, username, full_name, role, status, wallet_balance, created_at FROM users ORDER BY created_at DESC");
        $rows = $stmt->fetchAll();
        $users = array_map(function($u) {
            return [
                'id'            => $u['id'],
                'username'      => $u['username'],
                'fullName'      => $u['full_name'],
                'role'          => $u['role'],
                'status'        => $u['status'],
                'walletBalance' => (float)$u['wallet_balance'],
                'createdAt'     => $u['created_at']
            ];
        }, $rows);

        sendJson(['success' => true, 'users' => $users]);
        break;

    case 'update_status':
        $userId = trim($input['userId'] ?? '');
        $status = trim($input['status'] ?? ''); // ACTIVE or REJECTED

        if (empty($userId) || !in_array($status, ['ACTIVE', 'REJECTED'])) {
            sendError('Invalid user ID or status');
        }

        $stmt = $pdo->prepare("UPDATE users SET status = ? WHERE id = ?");
        $stmt->execute([$status, $userId]);

        // Notify user
        $notifStmt = $pdo->prepare("INSERT INTO notifications (id, title, message, type, is_read, user_id, created_at) VALUES (?, ?, ?, 'GENERAL', 0, ?, NOW())");
        $msg = $status === 'ACTIVE' 
            ? 'Your account has been approved by the administrator. You can now browse services and place orders!'
            : 'Your registration was rejected by the administrator.';
        $notifStmt->execute(['notif_' . time() . '_status', 'Account Status Update', $msg, $userId]);

        sendJson(['success' => true, 'message' => "User status updated to $status"]);
        break;

    case 'adjust_balance':
        $userId = trim($input['userId'] ?? '');
        $type = trim($input['type'] ?? ''); // CREDIT or DEBIT
        $amount = (float)($input['amount'] ?? 0);
        $reason = trim($input['reason'] ?? 'Manual admin balance adjustment');

        if (empty($userId) || $amount <= 0 || !in_array($type, ['CREDIT', 'DEBIT'])) {
            sendError('Invalid adjustment parameters');
        }

        $pdo->beginTransaction();
        try {
            $userStmt = $pdo->prepare("SELECT * FROM users WHERE id = ? FOR UPDATE");
            $userStmt->execute([$userId]);
            $user = $userStmt->fetch();

            if (!$user) {
                throw new Exception('User not found');
            }

            $currentBal = (float)$user['wallet_balance'];
            if ($type === 'DEBIT' && $currentBal < $amount) {
                throw new Exception('Insufficient customer balance to deduct');
            }

            $newBal = $type === 'CREDIT' ? ($currentBal + $amount) : ($currentBal - $amount);

            $updateUser = $pdo->prepare("UPDATE users SET wallet_balance = ? WHERE id = ?");
            $updateUser->execute([$newBal, $userId]);

            $txId = 'tx_' . time() . '_' . rand(100, 999);
            $txStmt = $pdo->prepare("INSERT INTO wallet_transactions (id, user_id, user_full_name, type, amount, description, reference_id, balance_after, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())");
            $txStmt->execute([
                $txId,
                $userId,
                $user['full_name'],
                $type,
                $amount,
                $reason,
                'ADMIN-ADJUST',
                $newBal
            ]);

            // Create notification for client
            $notifStmt = $pdo->prepare("INSERT INTO notifications (id, title, message, type, is_read, user_id, created_at) VALUES (?, ?, ?, 'WALLET_APPROVED', 0, ?, NOW())");
            $notifTitle = $type === 'CREDIT' ? '💰 Wallet Credited' : '💸 Wallet Debited';
            $notifMsg = "Your wallet has been " . ($type === 'CREDIT' ? 'credited' : 'debited') . " with ₹" . number_format($amount, 2) . ". Reason: $reason";
            $notifStmt->execute(['notif_' . time() . '_adj', $notifTitle, $notifMsg, $userId]);

            $pdo->commit();
            sendJson(['success' => true, 'newBalance' => $newBal, 'message' => 'Wallet balance updated successfully']);
        } catch (Exception $e) {
            $pdo->rollBack();
            sendError($e->getMessage(), 500);
        }
        break;

    default:
        sendError('Invalid action specified');
}
