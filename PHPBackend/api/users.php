<?php
// PHPBackend/api/users.php

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../middleware/auth.php';

$requestUri = $_SERVER['REQUEST_URI'];
$requestMethod = $_SERVER['REQUEST_METHOD'];

// Parse sub-path
$path = parse_url($requestUri, PHP_URL_PATH);
$subPath = str_replace('/api/users/', '', $path);

$userPayload = authMiddleware();
$userId = $userPayload['user']['id'];

$body = json_decode(file_get_contents('php://input'), true);

if ($subPath === 'search' && $requestMethod === 'POST') {
    $query = $body['query'];
    try {
        $stmt = $pdo->prepare('SELECT id, name, email, phone, role, profile_image FROM users WHERE (name LIKE ? OR email LIKE ?) AND role = "BUYER" LIMIT 20');
        $stmt->execute(["%$query%", "%$query%"]);
        $users = $stmt->fetchAll();
        echo json_encode($users);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['message' => 'Server error']);
    }

} elseif ($subPath === 'profile-image' && $requestMethod === 'POST') {
    // Handling file upload in PHP
    if (isset($_FILES['profileImage'])) {
        $file = $_FILES['profileImage'];
        $uploadDir = __DIR__ . '/../uploads/profiles/';
        if (!file_exists($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $fileName = time() . '_' . basename($file['name']);
        $targetFile = $uploadDir . $fileName;

        if (move_uploaded_file($file['tmp_name'], $targetFile)) {
            $profileImageUrl = '/uploads/profiles/' . $fileName;
            try {
                $stmt = $pdo->prepare('UPDATE users SET profile_image = ? WHERE id = ?');
                $stmt->execute([$profileImageUrl, $userId]);
                echo json_encode(['message' => 'Profile image updated', 'profile_image' => $profileImageUrl]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['message' => 'Server error']);
            }
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to move uploaded file']);
        }
    } else {
        http_response_code(400);
        echo json_encode(['message' => 'No file uploaded']);
    }
}
?>