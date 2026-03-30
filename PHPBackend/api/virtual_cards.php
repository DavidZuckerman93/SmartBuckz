<?php
// PHPBackend/api/virtual_cards.php

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../utils/functions.php';

$requestUri = $_SERVER['REQUEST_URI'];
$requestMethod = $_SERVER['REQUEST_METHOD'];

// Parse sub-path
$path = parse_url($requestUri, PHP_URL_PATH);
$subPath = str_replace('/api/virtual_cards/', '', $path);

$userPayload = authMiddleware();
$userId = $userPayload['user']['id'];

$body = json_decode(file_get_contents('php://input'), true);

if ($subPath === '' && $requestMethod === 'GET') {
    try {
        $stmt = $pdo->prepare('SELECT * FROM virtual_cards WHERE user_id = ? ORDER BY created_at DESC');
        $stmt->execute([$userId]);
        $cards = $stmt->fetchAll();
        echo json_encode($cards);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['message' => 'Server error']);
    }

} elseif ($subPath === 'create' && $requestMethod === 'POST') {
    $cardAlias = $body['card_alias'];
    $cardColor = $body['card_color'];

    try {
        $cardNumber = generateUniqueCardNumber($pdo);
        $expiryDate = '12/28';
        $cvv = (string)rand(100, 999);
        $walletData = "SB-CARD-$cardNumber";

        $qrCodePath = generate_qr_code($userId, $walletData);
        
        $stmt = $pdo->prepare('INSERT INTO qr_codes (user_id, qr_code_path) VALUES (?, ?)');
        $stmt->execute([$userId, $qrCodePath]);
        $qrCodeId = $pdo->lastInsertId();

        $stmt = $pdo->prepare('INSERT INTO virtual_cards (user_id, card_number, expiry_date, cvv, qr_code_id, card_alias, card_color) VALUES (?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([$userId, $cardNumber, $expiryDate, $cvv, $qrCodeId, $cardAlias, $cardColor]);
        $cardId = $pdo->lastInsertId();

        echo json_encode([
            'message' => 'Virtual card created successfully',
            'card' => [
                'id' => $cardId,
                'card_number' => $cardNumber,
                'card_alias' => $cardAlias,
                'card_color' => $cardColor,
                'qr_code_path' => $qrCodePath
            ]
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['message' => 'Server error']);
    }

} elseif (preg_match('/^(\d+)\/set-default$/', $subPath, $matches) && $requestMethod === 'POST') {
    $cardId = $matches[1];
    try {
        $pdo->beginTransaction();
        $stmt = $pdo->prepare('UPDATE virtual_cards SET is_default = 0 WHERE user_id = ?');
        $stmt->execute([$userId]);
        $stmt = $pdo->prepare('UPDATE virtual_cards SET is_default = 1 WHERE id = ? AND user_id = ?');
        $stmt->execute([$cardId, $userId]);
        $pdo->commit();
        echo json_encode(['message' => 'Default card updated']);
    } catch (PDOException $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['message' => 'Server error']);
    }
}
?>