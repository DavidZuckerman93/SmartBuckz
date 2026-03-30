<?php
// PHPBackend/index.php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/utils/jwt.php';
require_once __DIR__ . '/middleware/auth.php';

$requestUri = $_SERVER['REQUEST_URI'];
$requestMethod = $_SERVER['REQUEST_METHOD'];

// Basic router implementation
// Assuming the app is at the root or a subdirectory
$basePath = '/api'; // Or whatever your base path is
$path = parse_url($requestUri, PHP_URL_PATH);

// Simple path matching
if (strpos($path, $basePath . '/auth') === 0) {
    require_once __DIR__ . '/api/auth.php';
} elseif (strpos($path, $basePath . '/wallet') === 0) {
    require_once __DIR__ . '/api/wallet.php';
} elseif (strpos($path, $basePath . '/orders') === 0) {
    require_once __DIR__ . '/api/orders.php';
} elseif (strpos($path, $basePath . '/virtual_cards') === 0) {
    require_once __DIR__ . '/api/virtual_cards.php';
} elseif (strpos($path, $basePath . '/bank_accounts') === 0) {
    require_once __DIR__ . '/api/bank_accounts.php';
} elseif (strpos($path, $basePath . '/sellers') === 0) {
    require_once __DIR__ . '/api/sellers.php';
} elseif (strpos($path, $basePath . '/users') === 0) {
    require_once __DIR__ . '/api/users.php';
} else {
    http_response_code(404);
    echo json_encode(['message' => 'Not Found']);
}
?>