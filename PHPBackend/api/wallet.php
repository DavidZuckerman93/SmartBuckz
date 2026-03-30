<?php
// PHPBackend/api/wallet.php

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';

$requestUri = $_SERVER['REQUEST_URI'];
$requestMethod = $_SERVER['REQUEST_METHOD'];

// Parse sub-path
$path = parse_url($requestUri, PHP_URL_PATH);
$subPath = str_replace('/api/wallet/', '', $path);

$userPayload = authMiddleware();
$userId = $userPayload['user']['id'];
$userRole = $userPayload['user']['role'];

$body = json_decode(file_get_contents('php://input'), true);



if ($subPath === '' && $requestMethod === 'GET') {
    try {
        $stmt = $pdo->prepare('SELECT * FROM wallets WHERE user_id = ?');
        $stmt->execute([$userId]);
        $wallet = $stmt->fetch();

        $stmt = $pdo->prepare('SELECT * FROM transactions WHERE wallet_id = ? ORDER BY created_at DESC');
        $stmt->execute([$wallet['id']]);
        $transactions = $stmt->fetchAll();

        echo json_encode(['balance' => $wallet['balance'], 'history' => $transactions]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['message' => 'Server error']);
    }

} elseif ($subPath === 'initialize-payment' && $requestMethod === 'POST') {
    $amount = $body['amount'];
    $callback_url = $body['callback_url'] ?? 'http://localhost:19006/funding-callback';

    try {
        $stmt = $pdo->prepare('SELECT email FROM users WHERE id = ?');
        $stmt->execute([$userId]);
        $user = $stmt->fetch();

        if (!$user) {
            http_response_code(404);
            echo json_encode(['message' => 'User not found']);
            exit;
        }

        $url = "https://api.paystack.co/transaction/initialize";
        $fields = [
            'email' => $user['email'],
            'amount' => $amount * 100,
            'callback_url' => $callback_url,
            'metadata' => ['userId' => $userId]
        ];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($fields));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "Authorization: Bearer $paystackSecret",
            "Cache-Control: no-cache",
            "Content-Type: application/json"
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

        $response = curl_exec($ch);
        $result = json_decode($response, true);
        curl_close($ch);

        if ($result && $result['status']) {
            echo json_encode($result['data']);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Error initializing payment', 'error' => $result['message'] ?? 'Unknown error']);
        }

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['message' => 'Server error']);
    }

} elseif ($subPath === 'verify-payment' && $requestMethod === 'POST') {
    $reference = $body['reference'];

    try {
        $url = "https://api.paystack.co/transaction/verify/$reference";
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ["Authorization: Bearer $paystackSecret"]);

        $response = curl_exec($ch);
        $result = json_decode($response, true);
        curl_close($ch);

        if ($result && $result['status'] && $result['data']['status'] === 'success') {
            $amountInNaira = $result['data']['amount'] / 100;

            // Check if transaction exists
            $stmt = $pdo->prepare('SELECT id FROM transactions WHERE reference = ?');
            $stmt->execute([$reference]);
            if ($stmt->fetch()) {
                http_response_code(400);
                echo json_encode(['message' => 'Transaction already processed']);
                exit;
            }

            // Begin transaction
            $pdo->beginTransaction();

            $stmt = $pdo->prepare('SELECT * FROM wallets WHERE user_id = ?');
            $stmt->execute([$userId]);
            $wallet = $stmt->fetch();

            $newBalance = (float)$wallet['balance'] + (float)$amountInNaira;
            $stmt = $pdo->prepare('UPDATE wallets SET balance = ? WHERE id = ?');
            $stmt->execute([$newBalance, $wallet['id']]);

            $stmt = $pdo->prepare('INSERT INTO transactions (wallet_id, amount, type, status, reference, merchant_name) VALUES (?, ?, ?, ?, ?, ?)');
            $stmt->execute([$wallet['id'], $amountInNaira, 'FUNDING', 'SUCCESS', $reference, 'Paystack Funding']);

            $stmt = $pdo->prepare('INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)');
            $stmt->execute([$userId, 'Wallet Funded', "Successfully funded your wallet with ₦" . number_format($amountInNaira), 'SUCCESS']);

            $pdo->commit();
            echo json_encode(['message' => 'Payment verified and wallet funded', 'newBalance' => $newBalance]);
        } else {
            http_response_code(400);
            echo json_encode(['message' => 'Payment verification failed']);
        }

    } catch (PDOException $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['message' => 'Server error']);
    }

} elseif ($subPath === 'charge' && $requestMethod === 'POST') {
    if ($userRole !== 'SELLER') {
        http_response_code(403);
        echo json_encode(['message' => 'Access denied. Sellers only.']);
        exit;
    }

    $qrData = $body['qrData'];
    $amount = $body['amount'];

    try {
        $parts = explode('-', $qrData);
        if (count($parts) < 3 || $parts[0] !== 'SB' || $parts[1] !== 'CARD') {
            http_response_code(400);
            echo json_encode(['message' => 'Invalid QR Code format']);
            exit;
        }
        $cardId = $parts[2];

        $pdo->beginTransaction();

        $stmt = $pdo->prepare('SELECT vc.*, u.id as buyer_id, u.name as buyer_name FROM virtual_cards vc JOIN users u ON vc.user_id = u.id WHERE vc.id = ?');
        $stmt->execute([$cardId]);
        $card = $stmt->fetch();

        if (!$card) {
            $pdo->rollBack();
            http_response_code(404);
            echo json_encode(['message' => 'Virtual card not found']);
            exit;
        }

        $buyerId = $card['buyer_id'];
        if ((float)$card['card_balance'] < (float)$amount) {
            $pdo->rollBack();
            $stmt = $pdo->prepare('INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)');
            $stmt->execute([$buyerId, 'Transaction Failed', "Your purchase of ₦$amount at {$userPayload['user']['name']} failed due to insufficient balance.", 'DANGER']);
            http_response_code(400);
            echo json_encode(['message' => 'Insufficient balance on customer account', 'error_code' => 'INSUFFICIENT_BALANCE', 'buyerName' => $card['buyer_name']]);
            exit;
        }

        $newCardBalance = (float)$card['card_balance'] - (float)$amount;
        $stmt = $pdo->prepare('UPDATE virtual_cards SET card_balance = ? WHERE id = ?');
        $stmt->execute([number_format($newCardBalance, 2, '.', ''), $cardId]);

        $stmt = $pdo->prepare('SELECT * FROM wallets WHERE user_id = ?');
        $stmt->execute([$userId]);
        $sellerWallet = $stmt->fetch();
        $newSellerBalance = (float)$sellerWallet['balance'] + (float)$amount;

        $stmt = $pdo->prepare('UPDATE wallets SET balance = ? WHERE id = ?');
        $stmt->execute([number_format($newSellerBalance, 2, '.', ''), $sellerWallet['id']]);

        $reference = 'QRCHG-' . time();
        $stmt = $pdo->prepare('SELECT id FROM wallets WHERE user_id = ?');
        $stmt->execute([$buyerId]);
        $buyerWallet = $stmt->fetch();
        
        if ($buyerWallet) {
            $stmt = $pdo->prepare('INSERT INTO transactions (wallet_id, amount, type, status, merchant_name, reference, card_id) VALUES (?, ?, ?, ?, ?, ?, ?)');
            $stmt->execute([$buyerWallet['id'], number_format($amount, 2, '.', ''), 'PURCHASE', 'SUCCESS', $userPayload['user']['name'], $reference, $cardId]);
        }

        $stmt = $pdo->prepare('INSERT INTO transactions (wallet_id, amount, type, status, merchant_name, reference, buyer_id, card_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([$sellerWallet['id'], number_format($amount, 2, '.', ''), 'SALE', 'SUCCESS', $card['buyer_name'], $reference, $buyerId, $cardId]);

        $stmt = $pdo->prepare('INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)');
        $stmt->execute([$buyerId, 'Payment Successful', "₦" . number_format($amount) . " has been charged from your card by {$userPayload['user']['name']}.", 'SUCCESS']);

        $stmt = $pdo->prepare('INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)');
        $stmt->execute([$userId, 'Payment Received', "Successfully charged ₦" . number_format($amount) . " from {$card['buyer_name']}.", 'SUCCESS']);

        $pdo->commit();
        echo json_encode(['message' => 'Transaction successful', 'amount' => $amount, 'buyerName' => $card['buyer_name'], 'newBalance' => $newCardBalance]);

    } catch (PDOException $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['message' => 'Server error', 'error' => $e->getMessage()]);
    }
}
?>