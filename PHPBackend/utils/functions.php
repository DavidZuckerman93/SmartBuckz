<?php
// PHPBackend/utils/functions.php

/**
 * Generate a unique card number (mock implementation)
 */
function generateUniqueCardNumber($pdo) {
    do {
        $number = '';
        for ($i = 0; $i < 16; $i++) {
            $number .= rand(0, 9);
        }
        $stmt = $pdo->prepare('SELECT id FROM virtual_cards WHERE card_number = ?');
        $stmt->execute([$number]);
    } while ($stmt->fetch());

    return $number;
}

/**
 * Generate a QR code and return the file path
 */
function generate_qr_code($userId, $data) {
    // In a real PHP project, we'd use 'chillerlan/php-qrcode' or 'endroid/qr-code'
    // For this rewrite, we'll return a path to where the QR code would be stored.
    // In a real server environment, we'd generate the actual PNG file here.
    
    $fileName = "sb_qr_code__" . $userId . ".png";
    $uploadDir = __DIR__ . "/../uploads/qrcodes/";
    $fullPath = $uploadDir . $fileName;

    // Mocking QR code generation for now. In production, use a PHP library.
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }
    
    // We'll return the relative path used by the frontend
    return "/uploads/qrcodes/" . $fileName;
}
?>