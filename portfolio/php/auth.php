<?php
/**
 * Portfolio authentication endpoint.
 *
 * GET  → returns {"ok": true/false} for current session status
 * POST → validates password, sets PHP session, returns {"ok": true/false}
 *
 * Add this to php/config.php to override the password:
 *   define('PORTFOLIO_PASSWORD', 'your-password-here');
 */
session_start();

header('Content-Type: application/json');
header('Cache-Control: no-store');

// ── GET: session status check ─────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode(['ok' => !empty($_SESSION['portfolio_auth'])]);
    exit;
}

// ── POST: password validation ─────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit(json_encode(['ok' => false]));
}

// Basic rate limiting (10 attempts per hour per session)
if (!isset($_SESSION['pw_attempts'])) { $_SESSION['pw_attempts'] = 0; $_SESSION['pw_since'] = time(); }
if (time() - $_SESSION['pw_since'] > 3600) { $_SESSION['pw_attempts'] = 0; $_SESSION['pw_since'] = time(); }
if ($_SESSION['pw_attempts'] >= 10) {
    http_response_code(429);
    exit(json_encode(['ok' => false, 'error' => 'rate_limit']));
}

$body      = json_decode(file_get_contents('php://input'), true) ?? [];
$submitted = trim($body['password'] ?? '');

// Load password — define PORTFOLIO_PASSWORD in php/config.php to change it
$cfg = __DIR__ . '/config.php';
if (file_exists($cfg)) require_once $cfg;
$correct = defined('PORTFOLIO_PASSWORD') ? PORTFOLIO_PASSWORD : 'portfolio26';

if (hash_equals($correct, $submitted)) {
    $_SESSION['portfolio_auth'] = true;
    $_SESSION['pw_attempts']    = 0;
    echo json_encode(['ok' => true]);
} else {
    $_SESSION['pw_attempts']++;
    http_response_code(403);
    echo json_encode(['ok' => false]);
}
