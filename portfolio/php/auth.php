<?php
/**
 * Portfolio authentication endpoint.
 *
 * GET  → returns {"ok": true/false} for current session status
 * POST → validates password, returns {"ok": true/false}
 *
 * Define PORTFOLIO_PASSWORD in php/config.php to set the password.
 */
session_start();

header('Content-Type: application/json');
header('Cache-Control: no-store');

// ── Config ────────────────────────────────────────────────────────────────────
$cfg = __DIR__ . '/config.php';
if (file_exists($cfg)) require_once $cfg;
$correct = defined('PORTFOLIO_PASSWORD') ? PORTFOLIO_PASSWORD : 'portfolio26';

// ── GET: session status check ─────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode(['ok' => !empty($_SESSION['portfolio_auth'])]);
    exit;
}

// ── POST only beyond this point ───────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit(json_encode(['ok' => false]));
}

// ── Origin / Referer check ────────────────────────────────────────────────────
$allowed_host = defined('SITE_HOST') ? SITE_HOST : ($_SERVER['HTTP_HOST'] ?? '');

$origin  = $_SERVER['HTTP_ORIGIN']  ?? '';
$referer = $_SERVER['HTTP_REFERER'] ?? '';

$origin_ok  = empty($origin)  || parse_url($origin,  PHP_URL_HOST) === $allowed_host;
$referer_ok = empty($referer) || parse_url($referer, PHP_URL_HOST) === $allowed_host;

if (!$origin_ok || !$referer_ok) {
    http_response_code(403);
    exit(json_encode(['ok' => false]));
}

// ── IP-based rate limiting ────────────────────────────────────────────────────
$ip         = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$ip_hash    = hash('sha256', $ip);          // never store raw IPs on disk
$cache_dir  = __DIR__ . '/rate_limits';
$cache_file = $cache_dir . '/auth_' . $ip_hash . '.json';

$max_attempts = 10;
$window       = 3600;   // 1 hour in seconds

if (!is_dir($cache_dir)) {
    mkdir($cache_dir, 0700, true);
}

$record = ['attempts' => 0, 'since' => time()];

if (file_exists($cache_file)) {
    $raw = json_decode(file_get_contents($cache_file), true);
    if (is_array($raw)) {
        $record = $raw;
    }
}

// Reset window if expired
if (time() - $record['since'] > $window) {
    $record = ['attempts' => 0, 'since' => time()];
}

// Hard lockout
if ($record['attempts'] >= $max_attempts) {
    http_response_code(429);
    exit(json_encode(['ok' => false, 'error' => 'rate_limit']));
}

// ── Password check ────────────────────────────────────────────────────────────
$body      = json_decode(file_get_contents('php://input'), true) ?? [];
$submitted = trim($body['password'] ?? '');

if (hash_equals($correct, $submitted)) {
    // Success — clear counter and set session
    @unlink($cache_file);
    $_SESSION['portfolio_auth'] = true;
    echo json_encode(['ok' => true]);
} else {
    // Failure — increment counter
    $record['attempts']++;
    file_put_contents($cache_file, json_encode($record), LOCK_EX);
    http_response_code(403);
    echo json_encode(['ok' => false]);
}
