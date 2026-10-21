<?php
require_once __DIR__ . '/db.php';

$pdo = getDBConnection();
$input = getJsonInput();
$action = $_GET['action'] ?? $input['action'] ?? ($_SERVER['REQUEST_METHOD'] === 'GET' ? 'get' : '');

switch ($action) {
    case 'get':
        $stmt = $pdo->query("SELECT * FROM company_payment_settings WHERE id = 1");
        $settings = $stmt->fetch();

        if (!$settings) {
            // Default fallback
            $settings = [
                'bankName'          => 'HDFC Bank Ltd',
                'accountNumber'     => '5020-0012-9843-11',
                'accountHolderName' => 'ServiceMaster Global Solutions India Pvt Ltd',
                'ifscCode'          => 'HDFC0001298',
                'branchName'        => 'Indiranagar Main Branch, Bengaluru',
                'upiId'             => 'pay@servicemaster',
                'instructions'      => 'Please transfer using any UPI app or IMPS/NEFT, then enter the 12-digit UTR/Ref number and attach your payment screenshot.',
                'updatedAt'         => date('Y-m-d H:i:s')
            ];
        } else {
            $settings = [
                'bankName'          => $settings['bank_name'],
                'accountNumber'     => $settings['account_number'],
                'accountHolderName' => $settings['account_holder_name'],
                'ifscCode'          => $settings['ifsc_code'],
                'branchName'        => $settings['branch_name'],
                'upiId'             => $settings['upi_id'],
                'qrCodeUrl'         => $settings['qr_code_url'],
                'instructions'      => $settings['instructions'],
                'updatedAt'         => $settings['updated_at']
            ];
        }

        sendJson(['success' => true, 'settings' => $settings]);
        break;

    case 'update':
        $bankName = trim($input['bankName'] ?? $input['bank_name'] ?? '');
        $accNumber = trim($input['accountNumber'] ?? $input['account_number'] ?? '');
        $holderName = trim($input['accountHolderName'] ?? $input['account_holder_name'] ?? '');
        $ifsc = trim($input['ifscCode'] ?? $input['ifsc_code'] ?? '');
        $branch = trim($input['branchName'] ?? $input['branch_name'] ?? '');
        $upiId = trim($input['upiId'] ?? $input['upi_id'] ?? '');
        $qrCodeUrl = trim($input['qrCodeUrl'] ?? $input['qr_code_url'] ?? '');
        $instructions = trim($input['instructions'] ?? '');

        if (empty($bankName) || empty($accNumber) || empty($holderName) || empty($ifsc) || empty($upiId)) {
            sendError('Bank Name, Account Number, Holder Name, IFSC Code, and UPI ID are all required.');
        }

        $stmt = $pdo->prepare("REPLACE INTO company_payment_settings 
            (id, bank_name, account_number, account_holder_name, ifsc_code, branch_name, upi_id, qr_code_url, instructions, updated_at) 
            VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, NOW())");
        $stmt->execute([$bankName, $accNumber, $holderName, $ifsc, $branch, $upiId, $qrCodeUrl, $instructions]);

        sendJson(['success' => true, 'message' => 'Company payment details saved to MySQL database!']);
        break;

    default:
        sendError('Invalid action');
}
