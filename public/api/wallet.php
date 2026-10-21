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
            $reqStmt = $pdo->prepare("SELECT * FROM wallet_requests WHERE user_id = ? ORDER BY created_at DESC");
            $reqStmt->execute([$userId]);
            $txStmt = $pdo->prepare("SELECT * FROM wallet_transactions WHERE user_id = ? ORDER BY created_at DESC");
            $txStmt->execute([$userId]);
        } else {
            $reqStmt = $pdo->query("SELECT * FROM wallet_requests ORDER BY created_at DESC");
            $txStmt = $pdo->query("SELECT * FROM wallet_transactions ORDER BY created_at DESC");
        }

        $requests = $reqStmt->fetchAll();
        $transactions = $txStmt->fetchAll();

        // Get receipt attachments
        $reqIds = array_column($requests, 'id');
        $receiptMap = [];
        if (!empty($reqIds)) {
            $inClause = implode(',', array_fill(0, count($reqIds), '?'));
            $attStmt = $pdo->prepare("SELECT * FROM file_attachments WHERE parent_type = 'WALLET_REQUEST' AND parent_id IN ($inClause)");
            $attStmt->execute($reqIds);
            foreach ($attStmt->fetchAll() as $att) {
                $receiptMap[$att['parent_id']] = [
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

        $formattedRequests = array_map(function($r) use ($receiptMap) {
            return [
                'id'             => $r['id'],
                'userId'         => $r['user_id'],
                'userFullName'   => $r['user_full_name'],
                'username'       => $r['username'],
                'amount'         => (float)$r['amount'],
                'paymentMethod'  => $r['payment_method'],
                'transactionRef' => $r['transaction_ref'],
                'notes'          => $r['notes'],
                'status'         => $r['status'],
                'createdAt'      => $r['created_at'],
                'reviewedAt'     => $r['reviewed_at'],
                'adminNotes'     => $r['admin_notes'],
                'attachment'     => $receiptMap[$r['id']] ?? null
            ];
        }, $requests);

        $formattedTx = array_map(function($t) {
            return [
                'id'           => $t['id'],
                'userId'       => $t['user_id'],
                'userFullName' => $t['user_full_name'],
                'type'         => $t['type'],
                'amount'       => (float)$t['amount'],
                'description'  => $t['description'],
                'referenceId'  => $t['reference_id'],
                'balanceAfter' => (float)$t['balance_after'],
                'createdAt'    => $t['created_at']
            ];
        }, $transactions);

        sendJson([
            'success'      => true,
            'requests'     => $formattedRequests,
            'transactions' => $formattedTx
        ]);
        break;

    case 'request_topup':
        $userId = trim($input['userId'] ?? '');
        $amount = (float)($input['amount'] ?? 0);
        $paymentMethod = trim($input['paymentMethod'] ?? 'UPI');
        $transactionRef = trim($input['transactionRef'] ?? '');
        $notes = trim($input['notes'] ?? '');
        $attachment = $input['attachment'] ?? null;

        if (empty($userId) || $amount <= 0 || empty($transactionRef)) {
            sendError('User ID, valid amount, and transaction reference/UTR are required');
        }

        $pdo->beginTransaction();
        try {
            $userStmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
            $userStmt->execute([$userId]);
            $user = $userStmt->fetch();
            if (!$user) {
                throw new Exception('User not found');
            }

            $reqId = 'req_' . time() . '_' . rand(100, 999);
            $stmt = $pdo->prepare("INSERT INTO wallet_requests (id, user_id, user_full_name, username, amount, payment_method, transaction_ref, notes, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', NOW())");
            $stmt->execute([
                $reqId,
                $userId,
                $user['full_name'],
                $user['username'],
                $amount,
                $paymentMethod,
                $transactionRef,
                $notes
            ]);

            // Save receipt attachment if present
            if (is_array($attachment) && !empty($attachment['dataUrl'])) {
                $attId = $attachment['id'] ?? ('att_' . time() . '_' . rand(100, 999));
                $attStmt = $pdo->prepare("INSERT INTO file_attachments (id, parent_type, parent_id, file_name, file_size, mime_type, data_url, uploaded_by, uploaded_at) VALUES (?, 'WALLET_REQUEST', ?, ?, ?, ?, ?, ?, NOW())");
                $attStmt->execute([
                    $attId,
                    $reqId,
                    $attachment['name'] ?? 'receipt',
                    $attachment['size'] ?? 0,
                    $attachment['type'] ?? 'image/png',
                    $attachment['dataUrl'],
                    $attachment['uploadedBy'] ?? $user['full_name']
                ]);
            }

            // Admin notification
            $notif = $pdo->prepare("INSERT INTO notifications (id, title, message, type, is_read, for_role, link_tab, created_at) VALUES (?, ?, ?, 'WALLET_REQUEST', 0, 'ADMIN', 'wallet-requests', NOW())");
            $notif->execute([
                'notif_' . time() . '_topup',
                '💳 New Top-Up Request',
                "{$user['full_name']} submitted a top-up request for ₹" . number_format($amount, 2) . " (Ref: {$transactionRef})."
            ]);

            $pdo->commit();
            sendJson(['success' => true, 'id' => $reqId, 'message' => 'Top-up request submitted for verification!']);
        } catch (Exception $e) {
            $pdo->rollBack();
            sendError($e->getMessage(), 500);
        }
        break;

    case 'approve':
        $requestId = trim($input['requestId'] ?? '');
        $approvedAmount = (float)($input['approvedAmount'] ?? 0);
        $adminNotes = trim($input['adminNotes'] ?? '');

        if (empty($requestId) || $approvedAmount <= 0) {
            sendError('Valid request ID and approved amount are required');
        }

        $pdo->beginTransaction();
        try {
            $reqStmt = $pdo->prepare("SELECT * FROM wallet_requests WHERE id = ? FOR UPDATE");
            $reqStmt->execute([$requestId]);
            $request = $reqStmt->fetch();

            if (!$request || $request['status'] !== 'PENDING') {
                throw new Exception('Request not found or already processed');
            }

            $userId = $request['user_id'];
            $userStmt = $pdo->prepare("SELECT * FROM users WHERE id = ? FOR UPDATE");
            $userStmt->execute([$userId]);
            $user = $userStmt->fetch();

            if (!$user) {
                throw new Exception('Associated user not found');
            }

            $newBal = (float)$user['wallet_balance'] + $approvedAmount;
            $updUser = $pdo->prepare("UPDATE users SET wallet_balance = ? WHERE id = ?");
            $updUser->execute([$newBal, $userId]);

            // Mark request approved
            $updReq = $pdo->prepare("UPDATE wallet_requests SET status = 'APPROVED', reviewed_at = NOW(), admin_notes = ? WHERE id = ?");
            $updReq->execute([$adminNotes, $requestId]);

            // Add CREDIT transaction
            $txId = 'tx_' . time() . '_' . rand(100, 999);
            $txStmt = $pdo->prepare("INSERT INTO wallet_transactions (id, user_id, user_full_name, type, amount, description, reference_id, balance_after, created_at) VALUES (?, ?, ?, 'CREDIT', ?, ?, ?, ?, NOW())");
            $desc = "Wallet Top-up approved (Ref: {$request['transaction_ref']})";
            $txStmt->execute([
                $txId,
                $userId,
                $user['full_name'],
                $approvedAmount,
                $desc,
                $request['transaction_ref'],
                $newBal
            ]);

            // Notify client
            $notif = $pdo->prepare("INSERT INTO notifications (id, title, message, type, is_read, user_id, link_tab, created_at) VALUES (?, ?, ?, 'WALLET_APPROVED', 0, ?, 'wallet', NOW())");
            $notif->execute([
                'notif_' . time() . '_credit',
                '✅ Wallet Balance Credited!',
                "Your top-up of ₹" . number_format($approvedAmount, 2) . " has been approved and credited to your wallet balance.",
                $userId
            ]);

            $pdo->commit();
            sendJson([
                'success'    => true,
                'newBalance' => $newBal,
                'message'    => "₹" . number_format($approvedAmount, 2) . " credited to {$user['full_name']}'s wallet!"
            ]);
        } catch (Exception $e) {
            $pdo->rollBack();
            sendError($e->getMessage(), 500);
        }
        break;

    case 'reject':
        $requestId = trim($input['requestId'] ?? '');
        $reason = trim($input['reason'] ?? 'Verification failed');

        if (empty($requestId)) {
            sendError('Request ID is required');
        }

        $stmt = $pdo->prepare("UPDATE wallet_requests SET status = 'REJECTED', reviewed_at = NOW(), admin_notes = ? WHERE id = ?");
        $stmt->execute([$reason, $requestId]);

        // Notify client
        $reqStmt = $pdo->prepare("SELECT user_id, amount FROM wallet_requests WHERE id = ?");
        $reqStmt->execute([$requestId]);
        $req = $reqStmt->fetch();

        if ($req) {
            $notif = $pdo->prepare("INSERT INTO notifications (id, title, message, type, is_read, user_id, link_tab, created_at) VALUES (?, ?, ?, 'GENERAL', 0, ?, 'wallet', NOW())");
            $notif->execute([
                'notif_' . time() . '_rej',
                '❌ Top-up Request Declined',
                "Your top-up request for ₹" . number_format((float)$req['amount'], 2) . " was declined. Reason: $reason",
                $req['user_id']
            ]);
        }

        sendJson(['success' => true, 'message' => 'Wallet request marked as rejected']);
        break;

    case 'delete_receipt':
        $attachmentId = trim($input['attachmentId'] ?? '');
        if (empty($attachmentId)) {
            sendError('Attachment ID required');
        }

        $stmt = $pdo->prepare("DELETE FROM file_attachments WHERE id = ? AND parent_type = 'WALLET_REQUEST'");
        $stmt->execute([$attachmentId]);

        sendJson(['success' => true, 'message' => 'Receipt attachment deleted successfully']);
        break;

    default:
        sendError('Invalid action');
}
