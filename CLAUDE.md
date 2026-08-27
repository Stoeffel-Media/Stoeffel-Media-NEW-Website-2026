# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Stoeffel-Media Australian market website — solo operator Andreas Stöffel (Design, Web & Digital Marketing).
Domain: `stoeffel-media.com.au` | Hosted on Hostinger (cPanel/FTP, Apache + PHP, no build step).

Static HTML/CSS/vanilla-JS front end with a small PHP backend for the contact form and a
password-gated private portfolio. There is no bundler, package manager, or JS framework —
files are edited directly and uploaded via FTP (or the Hostinger MCP, see the global
CLAUDE.md's Hostinger Deployment section). `composer.json`/`vendor/` exist only for PHPMailer.

## Commands

There is no build/lint/test tooling in this repo — it's edited and previewed directly.

```bash
# Install/update PHPMailer (the only dependency)
composer install

# Local preview (any static server works; PHP forms need php -S)
php -S localhost:8000
```

To verify a change, open the relevant `.html` file through a local PHP server (so `php/contact.php`
and `portfolio/php/auth.php` work) and check in a real browser — there are no automated tests.

## Repo layout

This repo actually contains **three separate things**, not one site:

1. **Main site** (`index.html`, `legal.html`, `404.html`, `css/style.css`, `js/main.js`, `php/`) —
   the public marketing site at the domain root.
2. **`portfolio/`** — a separate, password-gated micro-site with its own HTML/CSS/JS/PHP, own
   `.htaccess`, and its own EN/DE pages (`index.html` / `index_de.html`). Treated as its own repo
   in spirit — see the DO NOT section.
3. **`brand-guidellines/`** — a single self-contained `index.html` (fonts inlined as base64 data
   URIs, `noindex,nofollow`) plus a static PDF (`stoeffel-media_brand-guidelines.pdf`). Not linked
   from the main nav; used as a private reference page.
4. **`software/time-tracker/`** — unrelated to the marketing site: license-key infrastructure
   (`revoked-keys.json` + README) for separate desktop apps (SM/SpanTime/TSM time trackers) that
   fetch this JSON from the live domain to check revocation. Edit only per `revoked-keys-README.md`.

## Main site architecture (`index.html` / `css/style.css` / `js/main.js`)

Single-page site. Section order in `index.html`: Hero → Business Statements → Services →
Quote → Portfolio (bento grid + lightbox) → About (stats + bio) → Contact (video bg + form) → Footer.
`css/style.css` is organized with `/* --- Section --- */` comment headers that match this order —
grep for e.g. `/* --- Contact --- */` to jump to a section's styles.

Design tokens: background `#202020` (deep `#181818`), accent `#f08932` (orange), text `#ffffff` /
`#8e8e8e`. Fonts are self-hosted **Outfit** only (`fonts/outfit-latin.woff2` + `-latin-ext.woff2`) —
not Bebas Neue/DM Sans (an older draft used those; the shipped site uses Outfit for everything).

`js/main.js` has no framework, no modules — it's one file of IIFE-style sections marked with
`// section name` comments (typewriter, cursor, menu, scroll reveal, dot pattern, WebGL fluid sim,
statements rotator, lightbox, custom `<select>` replacement, contact form, hero parallax, light
rays, draggable service cards, lazy video loading, rotating quotes, stats count-up, per-card canvas
animations, email obfuscation). Grep the `// ---` / `// ===` comments to jump to a section.

**Lenis** (`js/lenis.min.js`) is vendored locally for smooth scrolling on both the main site and
the portfolio — this is the one approved external script; do not add others (see DO NOT).

The WebGL fluid simulation is adapted from Pavel Dobryakov's MIT-licensed
[WebGL-Fluid-Simulation](https://github.com/PavelDoGreat/WebGL-Fluid-Simulation) — attribution
comment is in `js/main.js` above the fluid sim code; keep it if you touch that section.

## Portfolio subsite (`portfolio/`)

Password-gated (client posts to `portfolio/php/auth.php`, session-based, `hash_equals` compare,
10 attempts/hour rate limit hashed by IP). Structurally similar to the main site (same cursor/dot
pattern/fluid-sim/Lenis patterns in its own `js/main.js`) but has its own nav gate, thumbnail
popovers, and draggable password card with a hidden smiley easter egg.

**Media is served through a PHP gate, not directly**: `portfolio/.htaccess` rewrites requests under
`images/designs/**` to `portfolio/php/img.php`, which checks `$_SESSION['portfolio_auth']`, blocks
path traversal, and streams the file with byte-range support (required for iOS Safari video). Any
new protected image/video must live under `portfolio/images/designs/` to get this treatment —
anything outside that path bypasses the gate.

`portfolio/php/config.php` defines `PORTFOLIO_PASSWORD` — do not commit a real password to it (see
global memory: never commit credential files). EN and DE pages (`index.html` / `index_de.html`) are
kept in sync manually — a content change to one must be mirrored in the other.

## Contact form security (`php/contact.php`, main site)

Layered defenses, in order: honeypot field (`#website`, must stay empty) → Origin/Referer check →
IP-based rate limiting (3 req/hr, file cache in `php/rate_limits/`, IPs stored only as SHA-256
hashes) → server-side sanitisation (`htmlspecialchars`, `filter_var`) → optional reCAPTCHA v3 score
check → PHPMailer over SMTP (`declare(strict_types=1)`, never PHP's native `mail()`).
Config (`SMTP_*`, `MAIL_*`, `RECAPTCHA_SECRET`, rate-limit tunables) lives in `php/config.php`,
which is `.htaccess`-blocked from direct web access and must never be committed.

`portfolio/php/auth.php` follows the same Origin/Referer + hashed-IP rate-limit pattern independently.

## Deployment / infra notes

- `.htaccess` (root) strips `.html` extensions, redirects `www` → apex, sets a custom 404, and
  blocks direct access to `.json` files under `portfolio/php/`.
- `php/.htaccess` denies all direct browser access to `php/` except `contact.php` (POST only).
- Caching/gzip rules live in the root `.htaccess` — new static asset types should get an
  `ExpiresByType` entry there if they're cache-worthy.
- No CI/CD — deployment is a manual FTP (or Hostinger MCP) push per the global CLAUDE.md workflow.

## DO NOT

- Do not change the hero section's WebGL fluid sim or dot pattern — approved template, don't touch animation timing baked into the CSS.
- Do not use fonts other than Outfit (self-hosted `fonts/outfit-latin*.woff2`) — no Google Fonts, no system fonts.
- Do not add external JS libraries beyond the already-vendored Lenis (no jQuery, no CDN scripts).
- Do not expose `php/config.php` or `portfolio/php/config.php` credentials in any public file or commit.
- Do not use PHP's native `mail()` — PHPMailer via SMTP only.
- Do not let protected portfolio media bypass `portfolio/php/img.php` — it must stay under `portfolio/images/designs/`.
- Do not touch `software/time-tracker/revoked-keys.json` except by editing the `revoked` array per its README — it's live infrastructure for shipped desktop apps, not sample data.
- Do not run `git push` without explicit instruction (local commits are fine).

## Copy tone

Direct. Confident. No fluff. Short sentences. Active voice. English only. Use "we"/"our" on the
public site copy, never "I"/"me" (matches the studio framing, distinct from the global CLAUDE.md's
first-person voice sample, which is for standalone marketing copy/bios).
