<?php
/**
 * Session-gated image/video server.
 * Requests are rewritten here by .htaccess.
 * Returns 403 if no valid portfolio session exists.
 * Supports byte-range requests (required for iOS Safari video playback).
 */
session_start();

if (empty($_SESSION['portfolio_auth'])) {
    http_response_code(403);
    header('Content-Type: text/plain');
    exit('Unauthorized');
}

$file = trim($_GET['f'] ?? '');

// Prevent directory traversal
$file = str_replace(['..', "\0"], '', $file);
$file = ltrim($file, '/\\');

$base = realpath(__DIR__ . '/../images');
$full = realpath($base . DIRECTORY_SEPARATOR . $file);

if ($full === false || strncmp($full, $base, strlen($base)) !== 0 || !is_file($full)) {
    http_response_code(404);
    exit('Not found');
}

$ext  = strtolower(pathinfo($full, PATHINFO_EXTENSION));
$mime = [
    'jpg'  => 'image/jpeg',
    'jpeg' => 'image/jpeg',
    'png'  => 'image/png',
    'gif'  => 'image/gif',
    'webp' => 'image/webp',
    'mp4'  => 'video/mp4',
    'svg'  => 'image/svg+xml',
][$ext] ?? 'application/octet-stream';

$size = filesize($full);

header('Content-Type: ' . $mime);
header('Cache-Control: private, no-store');
header('X-Content-Type-Options: nosniff');
header('Accept-Ranges: bytes');

// Handle byte-range requests — required for iOS Safari to play videos
if (isset($_SERVER['HTTP_RANGE'])) {
    $range = $_SERVER['HTTP_RANGE'];
    list(, $range) = explode('=', $range, 2);

    // Reject multi-range requests
    if (strpos($range, ',') !== false) {
        http_response_code(416);
        header('Content-Range: bytes */' . $size);
        exit;
    }

    list($start, $end) = explode('-', $range);
    $start = ($start === '') ? 0 : intval($start);
    $end   = ($end   === '') ? $size - 1 : intval($end);

    if ($start > $end || $start >= $size) {
        http_response_code(416);
        header('Content-Range: bytes */' . $size);
        exit;
    }

    $end    = min($end, $size - 1);
    $length = $end - $start + 1;

    http_response_code(206);
    header('Content-Range: bytes ' . $start . '-' . $end . '/' . $size);
    header('Content-Length: ' . $length);

    $fp = fopen($full, 'rb');
    fseek($fp, $start);
    $remaining = $length;
    while ($remaining > 0 && !feof($fp)) {
        $chunk = min(8192, $remaining);
        echo fread($fp, $chunk);
        $remaining -= $chunk;
    }
    fclose($fp);
} else {
    header('Content-Length: ' . $size);
    readfile($full);
}
