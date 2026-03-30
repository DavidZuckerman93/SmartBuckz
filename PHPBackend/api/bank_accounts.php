<?php
// PHPBackend/api/bank_accounts.php

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';

$requestUri = $_SERVER['REQUEST_URI'];
$requestMethod = $_SERVER['REQUEST_METHOD'];

// Parse sub-path
$path = parse_url($requestUri, PHP_URL_PATH);
$subPath = str_replace('/api/bank_accounts/', '', $path);

$userPayload = authMiddleware();
$userId = $userPayload['user']['id'];

$body = json_decode(file_get_contents('php://input'), true);

if ($subPath === '' && $requestMethod === 'GET') {
    try {
        $stmt = $pdo->prepare('SELECT id, bank_name as name, account_number as accountNumber, bank_code as bankCode, recipient_code as recipientCode, expiry, cvv, icon, is_default FROM bank_accounts WHERE user_id = ? ORDER BY created_at DESC');
        $stmt->execute([$userId]);
        $banks = $stmt->fetchAll();
        echo json_encode($banks);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['message' => 'Server error']);
    }

} elseif ($subPath === '' && $requestMethod === 'POST') {
    $name = $body['name'];
    $accountNumber = $body['accountNumber'];
    $bankCode = $body['bankCode'];
    $expiry = $body['expiry'];
    $cvv = $body['cvv'];
    $icon = $body['icon'] ?? '🏦';

    try {
        $stmt = $pdo->prepare('INSERT INTO bank_accounts (user_id, bank_name, account_number, bank_code, expiry, cvv, icon) VALUES (?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([$userId, $name, $accountNumber, $bankCode, $expiry, $cvv, $icon]);
        $bankId = $pdo->lastInsertId();

        $stmt = $pdo->prepare('SELECT * FROM bank_accounts WHERE id = ?');
        $stmt->execute([$bankId]);
        $bank = $stmt->fetch();

        echo json_encode(['message' => 'Bank account added', 'bank' => $bank]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['message' => 'Server error']);
    }

} elseif (preg_match('/^(\d+)$/', $subPath, $matches) && $requestMethod === 'DELETE') {
    $bankId = $matches[1];
    try {
        $stmt = $pdo->prepare('DELETE FROM bank_accounts WHERE id = ? AND user_id = ?');
        $stmt->execute([$bankId, $userId]);
        echo json_encode(['message' => 'Bank account deleted']);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['message' => 'Server error']);
    }
} elseif (preg_match('/^(\d+)\/set-default$/', $subPath, $matches) && $requestMethod === 'POST') {
    $bankId = $matches[1];
    try {
        $pdo->beginTransaction();
        $stmt = $pdo->prepare('UPDATE bank_accounts SET is_default = 0 WHERE user_id = ?');
        $stmt->execute([$userId]);
        $stmt = $pdo->prepare('UPDATE bank_accounts SET is_default = 1 WHERE id = ? AND user_id = ?');
        $stmt->execute([$bankId, $userId]);
        $pdo->commit();
        echo json_encode(['message' => 'Default bank updated']);
    } catch (PDOException $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['message' => 'Server error']);
    }
}
?>