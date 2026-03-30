<?php
// PHPBackend/api/orders.php

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';

$requestUri = $_SERVER['REQUEST_URI'];
$requestMethod = $_SERVER['REQUEST_METHOD'];

// Parse sub-path
$path = parse_url($requestUri, PHP_URL_PATH);
$subPath = str_replace('/api/orders/', '', $path);

$userPayload = authMiddleware();
$userId = $userPayload['user']['id'];
$userRole = $userPayload['user']['role'];

$body = json_decode(file_get_contents('php://input'), true);

if ($subPath === '' && $requestMethod === 'GET') {
    try {
        if ($userRole === 'SELLER') {
            $stmt = $pdo->prepare('SELECT o.*, u.name as buyer_name FROM orders o JOIN users u ON o.buyer_id = u.id WHERE o.seller_id = ? ORDER BY o.created_at DESC');
            $stmt->execute([$userId]);
        } else {
            $stmt = $pdo->prepare('SELECT o.*, u.name as seller_name FROM orders o JOIN users u ON o.seller_id = u.id WHERE o.buyer_id = ? ORDER BY o.created_at DESC');
            $stmt->execute([$userId]);
        }
        $orders = $stmt->fetchAll();
        echo json_encode($orders);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['message' => 'Server error']);
    }

} elseif ($subPath === 'place' && $requestMethod === 'POST') {
    $sellerId = $body['sellerId'];
    $items = $body['items'];
    $amount = $body['amount'];

    try {
        $stmt = $pdo->prepare('INSERT INTO orders (buyer_id, seller_id, items, amount, status) VALUES (?, ?, ?, ?, ?)');
        $stmt->execute([$userId, $sellerId, $items, $amount, 'PENDING']);
        $orderId = $pdo->lastInsertId();

        // Notify seller
        $stmt = $pdo->prepare('INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)');
        $stmt->execute([$sellerId, 'New Order Received', "You have a new order for ₦" . number_format($amount) . ".", 'INFO']);

        echo json_encode(['message' => 'Order placed successfully', 'orderId' => $orderId]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['message' => 'Server error']);
    }

} elseif (preg_match('/^(\d+)\/status$/', $subPath, $matches) && $requestMethod === 'POST') {
    $orderId = $matches[1];
    $newStatus = $body['status'];

    try {
        $stmt = $pdo->prepare('UPDATE orders SET status = ? WHERE id = ?');
        $stmt->execute([$newStatus, $orderId]);

        // Notify buyer
        $stmt = $pdo->prepare('SELECT buyer_id FROM orders WHERE id = ?');
        $stmt->execute([$orderId]);
        $order = $stmt->fetch();
        
        if ($order) {
            $stmt = $pdo->prepare('INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)');
            $stmt->execute([$order['buyer_id'], 'Order Update', "Your order #$orderId is now $newStatus.", 'INFO']);
        }

        echo json_encode(['message' => 'Order status updated']);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['message' => 'Server error']);
    }
}
?>