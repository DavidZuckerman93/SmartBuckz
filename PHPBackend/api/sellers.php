<?php
// PHPBackend/api/sellers.php

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';

$requestUri = $_SERVER['REQUEST_URI'];
$requestMethod = $_SERVER['REQUEST_METHOD'];

// Parse sub-path
$path = parse_url($requestUri, PHP_URL_PATH);
$subPath = str_replace('/api/sellers/', '', $path);

$userPayload = authMiddleware();

if ($subPath === '' && $requestMethod === 'GET') {
    try {
        $stmt = $pdo->prepare('SELECT id, name, email, phone, role, is_verified, profile_image FROM users WHERE role = "SELLER"');
        $stmt->execute();
        $sellers = $stmt->fetchAll();
        echo json_encode($sellers);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['message' => 'Server error']);
    }
}
?>