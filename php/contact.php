<?php
/**
 * Stoeffel-Media — Secure Contact Form Handler
 * ─────────────────────────────────────────────
 * Security layers:
 *   1. Honeypot field check (bot trap)
 *   2. Origin / Referer header validation
 *   3. Rate limiting (IP-based, file cache)
 *   4. Input sanitisation + validation
 *   5. reCAPTCHA v3 score check (optional)
 *   6. PHPMailer (SMTP, no native mail())
 *
 * Requires: PHPMailer (install via Composer or place in /php/lib/)
 *   composer require phpmailer/phpmailer
 * or download from https://github.com/PHPMailer/PHPMailer
 */

declare(strict_types=1);

// ── Config ──────────────────────────────────────
require_once __DIR__ . '/config.php';

// ── Headers ─────────────────────────────────────
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');

// Only accept POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit;
}

// ── Helper: JSON response ────────────────────────
function respond(bool $success, string $message, int $code = 200): void {
    http_response_code($code);
    echo json_encode(['success' => $success, 'message' => $message]);
    exit;
}

// ── Helper: Sanitise text ────────────────────────
function clean(string $value, int $maxLen = 500): string {
    $value = trim($value);
    $value = strip_tags($value);
    $value = htmlspecialchars($value, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    return mb_substr($value, 0, $maxLen);
}

// ── 1. Referer check ─────────────────────────────
$referer = $_SERVER['HTTP_REFERER'] ?? '';
$allowedHost = 'stoeffel-media.com.au';
if (!str_contains($referer, $allowedHost) && !str_contains($referer, 'localhost') && !str_contains($referer, '127.0.0.1')) {
    respond(false, 'Invalid request origin.', 403);
}

// ── 2. Honeypot check ────────────────────────────
// 'website' field must be empty (bots fill it, humans don't)
$honeypot = $_POST['website'] ?? '';
if ($honeypot !== '') {
    // Silently accept to avoid tipping off bots
    respond(true, 'Thank you. We\'ll be in touch soon.');
}

// ── 3. Rate limiting ─────────────────────────────
$ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$ip = preg_replace('/[^0-9a-fA-F:.,]/', '', $ip);
$ip = explode(',', $ip)[0];

if (!is_dir(RATE_LIMIT_DIR)) {
    @mkdir(RATE_LIMIT_DIR, 0700, true);
}

$ratefile = RATE_LIMIT_DIR . md5($ip) . '.json';
$now      = time();
$hits     = [];

if (file_exists($ratefile)) {
    $data = json_decode(file_get_contents($ratefile), true);
    // Keep only hits within the window
    $hits = array_filter($data['hits'] ?? [], fn($t) => ($now - $t) < RATE_WINDOW);
}

if (count($hits) >= RATE_LIMIT) {
    respond(false, 'Too many submissions. Please wait a while and try again, or email us directly at ' . MAIL_TO . '.', 429);
}

// Record this hit
$hits[] = $now;
file_put_contents($ratefile, json_encode(['hits' => array_values($hits)]), LOCK_EX);

// ── 4. Input validation ──────────────────────────
$name    = clean($_POST['name']    ?? '', 100);
$company = clean($_POST['company'] ?? '', 120);
$email   = clean($_POST['email']   ?? '', 200);
$phone   = clean($_POST['phone']   ?? '', 30);
$service = clean($_POST['service'] ?? '', 30);
$message = clean($_POST['message'] ?? '', 3000);

$errors = [];

if (empty($name)) {
    $errors[] = 'Name is required.';
}
if (empty($email) || !filter_var($_POST['email'] ?? '', FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'A valid email address is required.';
}
if (empty($message) || mb_strlen($message) < 10) {
    $errors[] = 'Please include a message (at least 10 characters).';
}

if (!empty($errors)) {
    respond(false, implode(' ', $errors), 422);
}

// Whitelist allowed service values
$allowedServices = ['design', 'web', 'marketing', 'multiple', 'other', ''];
if (!in_array($service, $allowedServices, true)) {
    $service = 'other';
}

// ── 5. reCAPTCHA v3 (optional) ───────────────────
if (defined('RECAPTCHA_SECRET') && RECAPTCHA_SECRET !== '') {
    $recaptchaToken = $_POST['recaptcha_token'] ?? '';
    if (empty($recaptchaToken)) {
        respond(false, 'Security check failed. Please try again.', 403);
    }

    $ch = curl_init('https://www.google.com/recaptcha/api/siteverify');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => http_build_query([
            'secret'   => RECAPTCHA_SECRET,
            'response' => $recaptchaToken,
            'remoteip' => $ip,
        ]),
        CURLOPT_TIMEOUT => 5,
    ]);
    $rcResult = json_decode(curl_exec($ch), true);
    curl_close($ch);

    if (!($rcResult['success'] ?? false) || ($rcResult['score'] ?? 0) < RECAPTCHA_MIN_SCORE) {
        respond(false, 'Security check failed. Please try again.', 403);
    }
}

// ── 6. Send email via PHPMailer ───────────────────
// Auto-load PHPMailer. Supports Composer autoload OR manual include.
$autoload = __DIR__ . '/../../vendor/autoload.php';
$manualSrc = __DIR__ . '/lib/PHPMailer/src/';

if (file_exists($autoload)) {
    require_once $autoload;
} elseif (is_dir($manualSrc)) {
    require_once $manualSrc . 'Exception.php';
    require_once $manualSrc . 'PHPMailer.php';
    require_once $manualSrc . 'SMTP.php';
} else {
    // Fallback: log and return error — do NOT use native mail()
    error_log('[Stoeffel-Media] PHPMailer not found. Please install it.');
    respond(false, 'Mail system is not configured. Please email us directly at ' . MAIL_TO . '.', 500);
}

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

try {
    $mail = new PHPMailer(true);

    // SMTP config
    $mail->isSMTP();
    $mail->Host       = SMTP_HOST;
    $mail->SMTPAuth   = true;
    $mail->Username   = SMTP_USER;
    $mail->Password   = SMTP_PASS;
    $mail->SMTPSecure = SMTP_SECURE === 'ssl' ? PHPMailer::ENCRYPTION_SMTPS : PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = SMTP_PORT;
    $mail->CharSet    = 'UTF-8';

    // From / To
    $mail->setFrom(MAIL_FROM, 'Stoeffel-Media Website');
    $mail->addAddress(MAIL_TO, 'Stoeffel-Media');
    $mail->addReplyTo($email, $name);

    // Content
    $serviceLabel = match($service) {
        'design'    => 'Graphic Design & Branding',
        'web'       => 'Web Design & Development',
        'marketing' => 'Online Marketing & SEO',
        'multiple'  => 'Multiple services',
        default     => 'Not specified',
    };

    $mail->isHTML(false);
    $mail->Subject = MAIL_SUBJECT;
    $mail->Body    = implode("\n", [
        "New enquiry from stoeffel-media.com.au",
        str_repeat("─", 42),
        "Name:    {$name}",
        "Email:   {$email}",
        "Phone:   " . ($phone ?: '—'),
        "Company: " . ($company ?: '—'),
        "Service: {$serviceLabel}",
        str_repeat("─", 42),
        "Message:",
        $message,
        str_repeat("─", 42),
        "IP: {$ip}",
        "Time: " . date('Y-m-d H:i:s T'),
    ]);

    $mail->send();
    respond(true, 'Thank you — message received. We\'ll be in touch within one business day.');

} catch (Exception $e) {
    error_log('[Stoeffel-Media] Mail error: ' . $e->getMessage());
    respond(false, 'Your message could not be sent. Please email us directly at ' . MAIL_TO . '.', 500);
}
