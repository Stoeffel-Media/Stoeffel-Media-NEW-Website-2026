# CLAUDE.md — Stoeffel-Media AU (stoeffel-media-au/)

## Project

Stoeffel-Media Australian market website. Solo operator: Andreas Stöffel. Design, Web & Digital Marketing.
Domain: stoeffel-media.com.au | Hosted on Hostinger (cPanel, traditional FTP upload).

## Design System

| Token | Value |
|---|---|
| Background | `#202020` |
| Background deep | `#181818` |
| Accent | `#f08932` (orange) |
| Text primary | `#ffffff` |
| Text secondary | `#8e8e8e` |
| Headline font | Bebas Neue (Google Fonts) |
| Body font | DM Sans (Google Fonts) |

## File Structure

```
stoeffel-media-au/
├── index.html          ← Single page site (all sections)
├── legal.html          ← Legal notice (Australian compliance)
├── css/style.css       ← All styles
├── js/main.js          ← All JS (cursor, fluid sim, animations, form)
├── php/
│   ├── config.php      ← Private config — DO NOT COMMIT
│   └── contact.php     ← Secure form handler (PHPMailer)
├── robots.txt
└── sitemap.xml
```

Assets live at `../ASSETS/` (one level up, shared folder).

## Sections (index.html, top to bottom)

1. **Hero** — WebGL fluid sim (orange), dot pattern, custom cursor, animated heading
2. **Business Statements** — Rotating statements: slide up from bottom, hold 5s, exit top
3. **Services** — 3 equal cards: Graphic Design, Web Dev, Online Marketing
4. **Quote** — Word-by-word fade animation (~3s) on scroll into view
5. **Portfolio** — 9-item 3×3 grid, lightbox on click
6. **About** — Stats left (15+yr / 3 / 4), bio text right
7. **Contact** — Video bg (see instructions in HTML), white form card
8. **Footer** — Minimal: logo, nav, LinkedIn, copyright

## Key JavaScript Modules (js/main.js)

- `updateCursor()` — smooth orange cursor tracking
- Dot pattern canvas animation (fixed, behind hero)
- WebGL fluid simulation (Navier-Stokes, orange #f08932)
- Statements rotator — JS-driven animation cycle
- Quote word reveal — IntersectionObserver + staggered delays
- Lightbox — portfolio image viewer
- Contact form — fetch POST to php/contact.php, inline success/error
- Hero parallax — scroll-driven translateY on heading/sub/cta

## Contact Form Security

1. Honeypot field (`#website`) — bot trap, must stay empty
2. Origin/Referer check in PHP
3. IP-based rate limiting (3 req/hr, file cache in `php/rate_limits/`)
4. Server-side input sanitisation (`htmlspecialchars`, `filter_var`)
5. PHPMailer via SMTP (no native `mail()`)
6. reCAPTCHA v3 (optional — set RECAPTCHA_SECRET in config.php)

## Adding a Video Background (Contact Section)

1. Download a dark abstract ambient video from Pexels or Pixabay (royalty-free)
2. Save as `../ASSETS/contact-bg.mp4`
3. In `index.html`, find the contact section comment and add:
   ```html
   <video autoplay muted loop playsinline>
     <source src="../ASSETS/contact-bg.mp4" type="video/mp4">
   </video>
   ```
4. Remove the `<div class="animated-bg"></div>` fallback

## PHPMailer Setup

Option A — Composer (recommended):
```bash
cd stoeffel-media-au
composer require phpmailer/phpmailer
```

Option B — Manual:
1. Download from https://github.com/PHPMailer/PHPMailer
2. Place the `src/` folder at `php/lib/PHPMailer/src/`

Then fill in `php/config.php` with your Hostinger SMTP credentials.

## SEO Checklist

- [x] Unique title + meta description
- [x] Canonical tag
- [x] Open Graph + Twitter cards
- [x] JSON-LD LocalBusiness structured data
- [x] Semantic HTML5 (header, nav, main, section, footer, article)
- [x] Image alt texts + lazy loading
- [x] robots.txt + sitemap.xml
- [ ] Add `og:image` (1200×630px) at `/img/og-image.jpg`
- [ ] Verify sitemap URL after deployment

## DO NOT

- Do not change the hero section's WebGL or dot pattern — it's the approved template
- Do not use Inter, Roboto, or any system font — Bebas Neue + DM Sans only
- Do not add external JS libraries (jQuery, Bootstrap, etc.)
- Do not expose config.php credentials in any public file
- Do not use PHP's native `mail()` — PHPMailer only
- Do not modify the existing animation timing on hero entrance (baked into CSS)

## Copy Tone

Direct. Confident. No fluff. Short sentences. Active voice. English only.
Use "we" / "our" — never "I" or "me".
