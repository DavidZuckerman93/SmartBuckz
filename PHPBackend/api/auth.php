<?php
// PHPBackend/api/auth.php

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../utils/jwt.php';
require_once __DIR__ . '/../utils/functions.php';

$requestUri = $_SERVER['REQUEST_URI'];
$requestMethod = $_SERVER['REQUEST_METHOD'];

// Parse sub-path
$path = parse_url($requestUri, PHP_URL_PATH);
$subPath = str_replace('/api/auth/', '', $path);

$body = json_decode(file_get_contents('php://input'), true);

if ($subPath === 'signup' && $requestMethod === 'POST') {
    $name = $body['name'];
    $email = $body['email'];
    $password = $body['password'];
    $phone = $body['phone'];
    $role = $body['role'];

    try {
        $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            http_response_code(400);
            echo json_encode(['message' => 'User already exists']);
            exit;
        }

        $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
        $stmt = $pdo->prepare('INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)');
        $stmt->execute([$name, $email, $hashedPassword, $phone, $role]);
        $userId = $pdo->lastInsertId();

        // 1 -- Create wallet
        $stmt = $pdo->prepare('INSERT INTO wallets (user_id) VALUES (?)');
        $stmt->execute([$userId]);

        // 2 -- Create virtual account info
        $card_number = generateUniqueCardNumber($pdo);
        $expiry_date = '12/28';
        $cvv = (string)rand(100, 999);
        $wallet_data = "user_id: $userId, card_number: $card_number, expiry_date: $expiry_date, cvv: $cvv";

        // 3 -- Create QR Code
        $qr_code_path = generate_qr_code($userId, $wallet_data);

        // 4 -- Save QR Code
        $stmt = $pdo->prepare('INSERT INTO qr_codes (user_id, qr_code_path) VALUES (?, ?)');
        $stmt->execute([$userId, $qr_code_path]);
        $qr_code_id = $pdo->lastInsertId();

        // 5 -- Create Virtual Card
        $stmt = $pdo->prepare('INSERT INTO virtual_cards (user_id, card_number, expiry_date, cvv, qr_code_id, is_default) VALUES (?, ?, ?, ?, ?, ?)');
        $stmt->execute([$userId, $card_number, $expiry_date, $cvv, $qr_code_id, 1]);

        // Create token
        $payload = ['user' => ['id' => $userId, 'role' => $role]];
        $token = JWT::sign($payload);

        // Fetch balance
        $stmt = $pdo->prepare('SELECT balance FROM wallets WHERE user_id = ?');
        $stmt->execute([$userId]);
        $wallet = $stmt->fetch();
        $balance = $wallet ? $wallet['balance'] : 0;

        echo json_encode([
            'token' => $token,
            'user' => [
                'id' => $userId,
                'name' => $name,
                'email' => $email,
                'phone' => $phone,
                'role' => $role,
                'qr_code_path' => $qr_code_path,
                'balance' => $balance,
                'card_number' => $card_number
            ]
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['message' => 'Server error', 'error' => $e->getMessage()]);
    }

} elseif ($subPath === 'login' && $requestMethod === 'POST') {
    $email = $body['email'];
    $password = $body['password'];

    try {
        $stmt = $pdo->prepare('SELECT * FROM users WHERE email = ?');
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Invalid Credentials']);
            exit;
        }

        $payload = ['user' => ['id' => $user['id'], 'role' => $user['role']]];
        $token = JWT::sign($payload);

        unset($user['password']);
        echo json_encode(['token' => $token, 'user' => $user]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['message' => 'Server error']);
    }

} elseif ($subPath === 'notifications' && $requestMethod === 'GET') {
    $userPayload = authMiddleware();
    try {
        $stmt = $pdo->prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50');
        $stmt->execute([$userPayload['user']['id']]);
        $notifications = $stmt->fetchAll();
        echo json_encode($notifications);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['message' => 'Server error']);
    }
} elseif ($subPath === 'forgot-password' && $requestMethod === 'POST') {
    $email = $body['email'];

    try {
        $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user) {
            echo json_encode(['message' => 'If an account with that email exists, a reset code has been sent.']);
            exit;
        }

        $resetCode = (string)rand(100000, 999999);
        $expiry = (time() + 3600) * 1000; // 1 hour in ms

        $stmt = $pdo->prepare('UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?');
        $stmt->execute([$resetCode, $expiry, $user['id']]);

        echo json_encode([
            'message' => 'If an account with that email exists, a reset code has been sent.',
            'demo_code' => $resetCode
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['message' => 'Server error']);
    }
} elseif ($subPath === 'reset-password' && $requestMethod === 'POST') {
    $email = $body['email'];
    $code = $body['code'];
    $newPassword = $body['newPassword'];

    try {
        $stmt = $pdo->prepare('SELECT id, reset_token, reset_token_expiry FROM users WHERE email = ?');
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user) {
            http_response_code(400);
            echo json_encode(['message' => 'Invalid request']);
            exit;
        }

        if (!$user['reset_token'] || $user['reset_token'] !== $code || (time() * 1000) > $user['reset_token_expiry']) {
            http_response_code(400);
            echo json_encode(['message' => 'Invalid or expired reset code']);
            exit;
        }

        $hashedPassword = password_hash($newPassword, PASSWORD_BCRYPT);
        $stmt = $pdo->prepare('UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?');
        $stmt->execute([$hashedPassword, $user['id']]);

        echo json_encode(['message' => 'Password has been reset successfully']);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['message' => 'Server error']);
    }
}
?>