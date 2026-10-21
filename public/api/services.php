<?php
require_once __DIR__ . '/db.php';

$pdo = getDBConnection();
$input = getJsonInput();
$action = $_GET['action'] ?? $input['action'] ?? ($_SERVER['REQUEST_METHOD'] === 'GET' ? 'list' : '');

switch ($action) {
    case 'list':
        $stmt = $pdo->query("SELECT * FROM services ORDER BY created_at ASC");
        $services = $stmt->fetchAll();

        // Fetch attachments for each service
        $attStmt = $pdo->prepare("SELECT * FROM file_attachments WHERE parent_type = 'SERVICE'");
        $attStmt->execute();
        $allAttachments = $attStmt->fetchAll();

        $attMap = [];
        foreach ($allAttachments as $att) {
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

        $result = array_map(function($s) use ($attMap) {
            return [
                'id'          => $s['id'],
                'name'        => $s['name'],
                'description' => $s['description'],
                'price'       => (float)$s['price'],
                'category'    => $s['category'],
                'attachments' => $attMap[$s['id']] ?? []
            ];
        }, $services);

        sendJson(['success' => true, 'services' => $result]);
        break;

    case 'create':
        $name = trim($input['name'] ?? '');
        $description = trim($input['description'] ?? '');
        $price = (float)($input['price'] ?? 0);
        $category = trim($input['category'] ?? 'Development');
        $attachments = $input['attachments'] ?? [];

        if (empty($name) || $price < 0) {
            sendError('Valid service name and price are required');
        }

        $serviceId = 's_' . time() . '_' . rand(100, 999);

        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare("INSERT INTO services (id, name, description, price, category, created_at) VALUES (?, ?, ?, ?, ?, NOW())");
            $stmt->execute([$serviceId, $name, $description, $price, $category]);

            // Save attachments
            if (is_array($attachments)) {
                $attStmt = $pdo->prepare("INSERT INTO file_attachments (id, parent_type, parent_id, file_name, file_size, mime_type, data_url, uploaded_by, uploaded_at) VALUES (?, 'SERVICE', ?, ?, ?, ?, ?, ?, NOW())");
                foreach ($attachments as $att) {
                    $attId = $att['id'] ?? ('att_' . time() . '_' . rand(100, 999));
                    $attStmt->execute([
                        $attId,
                        $serviceId,
                        $att['name'] ?? 'attachment',
                        $att['size'] ?? 0,
                        $att['type'] ?? 'application/octet-stream',
                        $att['dataUrl'] ?? '',
                        $att['uploadedBy'] ?? 'Admin'
                    ]);
                }
            }

            $pdo->commit();
            sendJson(['success' => true, 'id' => $serviceId, 'message' => 'Service created successfully']);
        } catch (Exception $e) {
            $pdo->rollBack();
            sendError($e->getMessage(), 500);
        }
        break;

    case 'update':
        $id = trim($input['id'] ?? '');
        $name = trim($input['name'] ?? '');
        $description = trim($input['description'] ?? '');
        $price = (float)($input['price'] ?? 0);
        $category = trim($input['category'] ?? 'Development');

        if (empty($id) || empty($name)) {
            sendError('Service ID and name are required');
        }

        $stmt = $pdo->prepare("UPDATE services SET name = ?, description = ?, price = ?, category = ? WHERE id = ?");
        $stmt->execute([$name, $description, $price, $category, $id]);

        sendJson(['success' => true, 'message' => 'Service updated successfully']);
        break;

    case 'delete':
        $id = trim($input['id'] ?? '');
        if (empty($id)) {
            sendError('Service ID is required');
        }

        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare("DELETE FROM services WHERE id = ?");
            $stmt->execute([$id]);

            $delAtt = $pdo->prepare("DELETE FROM file_attachments WHERE parent_type = 'SERVICE' AND parent_id = ?");
            $delAtt->execute([$id]);

            $pdo->commit();
            sendJson(['success' => true, 'message' => 'Service deleted successfully']);
        } catch (Exception $e) {
            $pdo->rollBack();
            sendError($e->getMessage(), 500);
        }
        break;

    default:
        sendError('Invalid action');
}
