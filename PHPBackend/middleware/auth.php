<?php
// PHPBackend/middleware/auth.php

require_once __DIR__ . '/../utils/jwt.php';

function authMiddleware() {
    $headers = getallheaders();
    $token = null;

    if (isset($headers['Authorization'])) {
        $token = str_replace('Bearer ', '', $headers['Authorization']);
    } elseif (isset($headers['authorization'])) {
        $token = str_replace('Bearer ', '', $headers['authorization']);
    }

    if (!$token) {
        http_response_code(401);
        echo json_encode(['message' => 'No token, authorization denied']);
        exit;
    }

    $decoded = JWT::verify($token);
    if (!$decoded) {
        http_response_code(401);
        echo json_encode(['message' => 'Token is not valid']);
        exit;
    }

    return $decoded; // Returns user object from payload
}
?>