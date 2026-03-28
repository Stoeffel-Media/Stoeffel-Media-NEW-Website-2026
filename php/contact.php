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
$message = clean($_POST['message'] ?? '', 10000);

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
$autoload = __DIR__ . '/../vendor/autoload.php';
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
    $mail->XMailer    = ' ';

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

    $mail->isHTML(true);
    $mail->Subject = MAIL_SUBJECT;

    $messageHtml = nl2br(htmlspecialchars($message, ENT_QUOTES | ENT_HTML5, 'UTF-8'));
    $time        = date('d M Y, H:i T');

    $mail->Body = <<<HTML
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#181818;font-family:Arial,Helvetica,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#181818;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#202020;padding:36px 40px;border-radius:12px 12px 0 0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td valign="middle">
                  <h1 style="margin:0;font-size:24px;font-weight:700;color:#ffffff;line-height:1.3;">New Enquiry</h1>
                  <p style="margin:6px 0 0;font-size:14px;"><a href="https://stoeffel-media.com.au" style="color:#f08932;text-decoration:none;">stoeffel-media.com.au</a></p>
                </td>
                <td valign="middle" align="right">
                  <img src="https://stoeffel-media.com.au/img/logo.svg" alt="Stoeffel-Media" height="28" style="display:block;" />
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Contact details -->
        <tr>
          <td style="background:#252525;padding:36px 40px 0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-bottom:16px;border-bottom:1px solid rgba(255,255,255,0.08);">
                  <p style="margin:0 0 8px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#666666;font-weight:700;margin:0 0 8px;">Name</p>
                  <p style="margin:0;font-size:17px;color:#ffffff;font-weight:600;">{$name}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 0;border-bottom:1px solid rgba(255,255,255,0.08);">
                  <p style="margin:0 0 8px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#666666;font-weight:700;">Email</p>
                  <p style="margin:0;font-size:17px;color:#ffffff;">{$email}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 0;border-bottom:1px solid rgba(255,255,255,0.08);">
                  <p style="margin:0 0 8px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#666666;font-weight:700;">Phone</p>
                  <p style="margin:0;font-size:17px;color:#ffffff;">{$phone}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 0;border-bottom:1px solid rgba(255,255,255,0.08);">
                  <p style="margin:0 0 8px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#666666;font-weight:700;">Company</p>
                  <p style="margin:0;font-size:17px;color:#ffffff;">{$company}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Message -->
        <tr>
          <td style="background:#252525;padding:0 40px 36px;">
            <div style="background:#2e2e2e;border-left:4px solid #f08932;border-radius:0 8px 8px 0;padding:20px 24px;margin-top:4px;">
              <p style="margin:0 0 4px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#666666;font-weight:700;">Service</p>
              <p style="margin:0 0 20px;font-size:17px;color:#ffffff;padding-bottom:16px;border-bottom:1px solid rgba(255,255,255,0.08);">{$serviceLabel}</p>
              <p style="margin:0 0 10px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#666666;font-weight:700;">Message</p>
              <p style="margin:0;font-size:16px;color:#dddddd;line-height:1.7;">{$messageHtml}</p>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#181818;padding:20px 40px;border-radius:0 0 12px 12px;">
            <p style="margin:0;font-size:12px;color:#444444;">IP: {$ip} &nbsp;&middot;&nbsp; {$time}</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>

</body>
</html>
HTML;

    $mail->AltBody = "New enquiry from stoeffel-media.com.au\n\nName: {$name}\nEmail: {$email}\nPhone: {$phone}\nCompany: {$company}\nService: {$serviceLabel}\n\nMessage:\n{$message}\n\nIP: {$ip} | {$time}";

    $mail->send();

    // ── Confirmation email to the sender ─────────────
    $confirm = new PHPMailer(true);
    $confirm->isSMTP();
    $confirm->Host       = SMTP_HOST;
    $confirm->SMTPAuth   = true;
    $confirm->Username   = SMTP_USER;
    $confirm->Password   = SMTP_PASS;
    $confirm->SMTPSecure = SMTP_SECURE === 'ssl' ? PHPMailer::ENCRYPTION_SMTPS : PHPMailer::ENCRYPTION_STARTTLS;
    $confirm->Port       = SMTP_PORT;
    $confirm->CharSet    = 'UTF-8';
    $confirm->XMailer    = ' ';

    $confirm->setFrom(MAIL_FROM, 'Stoeffel-Media');
    $confirm->addAddress($email, $name);
    $confirm->isHTML(true);
    $confirm->Subject = 'Thanks for your enquiry - Stoeffel-Media';

    $firstName = explode(' ', $name)[0];

    $confirm->Body = <<<HTML
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#181818;font-family:Arial,Helvetica,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#181818;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#202020;padding:36px 40px;border-radius:12px 12px 0 0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td valign="middle">
                  <h1 style="margin:0;font-size:24px;font-weight:700;color:#ffffff;line-height:1.3;">Thanks for reaching out.</h1>
                  <p style="margin:6px 0 0;font-size:14px;"><a href="https://stoeffel-media.com.au" style="color:#f08932;text-decoration:none;">stoeffel-media.com.au</a></p>
                </td>
                <td valign="middle" align="right">
                  <img src="https://stoeffel-media.com.au/img/logo.svg" alt="Stoeffel-Media" height="28" style="display:block;" />
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Intro -->
        <tr>
          <td style="background:#252525;padding:36px 40px 28px;">
            <p style="margin:0 0 16px;font-size:17px;color:#ffffff;line-height:1.7;">Hi {$firstName},</p>
            <p style="margin:0 0 16px;font-size:17px;color:#cccccc;line-height:1.7;">We received your message and will get back to you as soon as possible.</p>
            <p style="margin:0;font-size:17px;color:#cccccc;line-height:1.7;">In the meantime, here's a copy of what you sent.</p>
          </td>
        </tr>

        <!-- Summary -->
        <tr>
          <td style="background:#252525;padding:0 40px 0;">
            <div style="border-top:1px solid rgba(255,255,255,0.08);"></div>
          </td>
        </tr>
        <tr>
          <td style="background:#252525;padding:24px 40px 36px;">
            <div style="background:#2e2e2e;border-left:4px solid #f08932;border-radius:0 8px 8px 0;padding:20px 24px;">
              <p style="margin:0 0 4px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#666666;font-weight:700;">Service</p>
              <p style="margin:0 0 20px;font-size:17px;color:#ffffff;padding-bottom:16px;border-bottom:1px solid rgba(255,255,255,0.08);">{$serviceLabel}</p>
              <p style="margin:0 0 8px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#666666;font-weight:700;">Your message</p>
              <p style="margin:0;font-size:16px;color:#dddddd;line-height:1.7;">{$messageHtml}</p>
            </div>
          </td>
        </tr>

        <!-- Sign-off -->
        <tr>
          <td style="background:#202020;padding:28px 40px;">
            <p style="margin:0 0 4px;font-size:15px;color:#ffffff;font-weight:600;">Andreas Stöffel</p>
            <p style="margin:0 0 12px;font-size:14px;color:#8e8e8e;">Stoeffel-Media — Web, Design &amp; Marketing</p>
            <p style="margin:0;font-size:14px;color:#666666;">
              <a href="mailto:info@stoeffel-media.com.au" style="color:#f08932;text-decoration:none;">info@stoeffel-media.com.au</a>
              &nbsp;&middot;&nbsp;
              <a href="https://stoeffel-media.com.au" style="color:#f08932;text-decoration:none;">stoeffel-media.com.au</a>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#181818;padding:20px 40px;border-radius:0 0 12px 12px;">
            <p style="margin:0;font-size:12px;color:#444444;">You are receiving this email because you submitted a contact form on <a href="https://stoeffel-media.com.au" style="color:#444444;text-decoration:underline;">stoeffel-media.com.au</a>.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>

</body>
</html>
HTML;

    $confirm->AltBody = "Hi {$firstName},\n\nThanks for reaching out. I received your message and will get back to you as soon as possible.\n\nHere's a copy of what you sent:\n\nService: {$serviceLabel}\n\nMessage:\n{$message}\n\n---\nAndreas Stöffel\nStoeffel-Media\ninfo@stoeffel-media.com.au\nstoeffel-media.com.au";

    $confirm->send();

    respond(true, 'Thank you — we\'ll be in touch as soon as possible.');

} catch (Exception $e) {
    error_log('[Stoeffel-Media] Mail error: ' . $e->getMessage());
    respond(false, 'Your message could not be sent. Please email us directly at ' . MAIL_TO . '.', 500);
}
