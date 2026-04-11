<?php
/**
 * Session-gated image/video server.
 * Requests are rewritten here by images/designs/.htaccess.
 * Returns 403 if no valid portfolio session exists.
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

header('Content-Type: ' . $mime);
header('Content-Length: ' . filesize($full));
header('Cache-Control: private, no-store');
header('X-Content-Type-Options: nosniff');
readfile($full);
