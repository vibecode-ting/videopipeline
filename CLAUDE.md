# CLAUDE.md — Video Pipeline Suite

## Git Workflow (STRICT)

**Never push directly to `main`.** Always:
1. `git checkout -b <branch-name>` — name tied to the work (e.g. `fix-nav-toggle`, `feat-bento-grid`, `redesign-studio-ui`)
2. Commit on branch with meaningful message
3. `git push origin <branch-name>`
4. Open PR → merge to `main`

Commit attribution footer (always append):
```
Co-Authored-By: Claude Code <noreply@anthropic.com>
```

---

## Project: Video Pipeline Suite

**Purpose:** Myanmar-first Windows desktop video workflow automation SaaS — landing site hosted on GitHub Pages (zero build step). No SSG, no bundler. Plain HTML + CSS + JS.

**Live URL:** `https://videopipeline.myanmardev.com`

**Stack:** Vanilla HTML/CSS/JS · Google Fonts · `data/config.json` + `data/releases.json` for runtime data · GitHub Pages static hosting

---

## File Map

| File | Role |
|------|------|
| `index.html` | Homepage: hero, bento tools, pipeline viz, pricing teaser, CTA |
| `features.html` | Full feature detail page |
| `pricing.html` | Pricing cards + FAQ accordion |
| `download.html` | Renders from `data/releases.json` via `assets/js/download.js` |
| `guide.html` | Setup guide + step cards |
| `order.html` | Order form — renders plans from `data/config.json` via `assets/js/order.js` |
| `payment.html` | Payment confirmation + receipt upload |
| `contact.html` | Contact form |
| `assets/css/main.css` | Single global stylesheet (design system CSS vars, all components) |
| `assets/js/main.js` | Shared JS: theme toggle, lang toggle, nav, scroll animations, contact/payment data, accordion, tabs |
| `assets/js/order.js` | Order form logic (plan select, URL pre-select, form submit) |
| `assets/js/download.js` | Download page: fetches `data/releases.json`, renders dynamically |
| `data/config.json` | Contact info, payment methods, pricing plans, form endpoints |
| `data/releases.json` | Release versions for download page |

---

## Inviolable Rules

### 1. No breakage of existing features
- Keep all `.html` filenames, all relative `href`/`src` paths unchanged — GitHub Pages has no rewrite rules.
- Preserve ALL JavaScript: `window.VPS` API, `vps:langchange` event, `data-my`/`data-en` lang toggle pattern, `data-contact` / `data-contact-text` contact injection, `data-tab` tab switching, `.accordion-*` accordion, `.fade-up` scroll reveal, `plan-select` / `plan-info-box` order logic, copy-to-clipboard (`window.copyText`).
- Form endpoints in `data/config.json` → never hardcode in HTML.
- `data/` files are runtime data — never modify their schema.

### 2. Typography
- Body: `'Plus Jakarta Sans', 'Inter', sans-serif` (English/metrics)
- Mono: `'JetBrains Mono', monospace` (version numbers, `0.1s`, `Ep-001`, `4K`)
- Myanmar: `'Noto Sans Myanmar', sans-serif`
- Myanmar line-height: **minimum 1.9** everywhere — diacritics clip below that.
- Body font-size: 16px minimum.

### 3. Icons — SVG only, no raw emoji in UI chrome
- Replace card icons, button icons, badge icons, nav toggle `☰`/`✕`, theme toggle `🌙`/`☀️`, pipeline step icons with inline Lucide SVG.
- Emoji allowed **only** in: flag `🇲🇲`, payment method display (config-driven), form success/error messages, aria-hidden decorative spans.

### 4. Design System (from `assets/css/main.css` `:root` vars)
- Primary: `#6C63FF` / Accent: `#00C9A7`
- Dark bg: `#0F0F1A` → `#1A1A2E` → `#16213E`
- Gradient: `linear-gradient(135deg, #6C63FF, #00C9A7)`
- Both dark (default) and light (`[data-theme="light"]`) modes must look polished.
- CSS custom properties only — no hardcoded hex in components.

### 5. No new dependencies
- No npm, no bundler, no CDN JS frameworks.
- Google Fonts CDN for fonts only. Lucide SVG inline (copy SVG path, no CDN script).
- Existing `assets/js/main.js`, `order.js`, `download.js` only — no new JS files unless explicitly needed.

### 6. GitHub Pages compatibility
- Zero build step. All files served as-is.
- `_config.yml` controls Jekyll — do not add liquid tags to HTML.
- `CNAME` → `videopipeline.myanmardev.com` — do not touch.

---

## Design Direction (redesign-studio-ui)

**Aesthetic:** Pro Video Creator & Automation Studio — dark-first, high-craft, clean glass/border depth. NOT generic "vibecoded" purple gradient SaaS.

### Homepage
- **Hero:** Animated 4-stage interactive pipeline flow (Download → AI Cut → AI Rename → Auto Upload). Each node pulsing, connected arrows animate on load. IntersectionObserver triggers.
- **Tools section:** Asymmetric Bento Grid (not uniform 6-card grid). Flagship cards (AI Ad Cutter, 1-Click Pipeline) get larger cells with mini UI previews inside (fake terminal output, animated waveform, etc).
- Replace `grid-3` with `.bento-grid` custom layout.

### All Pages
- Unified header/footer — single source in each HTML (no server-side includes; keep copy-paste consistent).
- Smooth scroll-reveal: `IntersectionObserver` on `.fade-up` (already wired in `main.js` — just add class to new elements).
- Button hover: `translateY(-2px)` + glow shadow (already in CSS — keep).
- Pipeline visualization: nodes pulse with `@keyframes pulse-ring`, arrows animate with `stroke-dashoffset`.

### SVG Icon Replacements (Lucide)
| Emoji | Lucide name | Usage |
|-------|-------------|-------|
| `☰` | `menu` | nav toggle open |
| `✕` | `x` | nav toggle close |
| `🌙` | `moon` | theme toggle dark |
| `☀️` | `sun` | theme toggle light |
| `📥` | `download-cloud` | Telegram Downloader card |
| `📺` | `tv-2` | Channel Studio card |
| `▶️` | `youtube` / `play-circle` | YouTube Downloader |
| `🤖` | `cpu` | AI Ad Cutter |
| `📝` | `file-text` | AI Renamer |
| `🚀` | `zap` | 1-Click Pipeline |
| `📤` | `upload-cloud` | Uploader |
| `🔒` | `lock` | Security |
| `🧙` | `settings-2` | Setup Wizard |
| `⬇️` | `download` | Download buttons |
| `🛒` | `shopping-cart` | Order buttons |
| `✓` | `check` | Pricing feature list |
| `→` | `arrow-right` | Feature list bullets |
| `📱` | `smartphone` | Telegram/Phone contact |
| `📧` | `mail` | Email contact |
| `📞` | `phone` | Phone/Viber contact |
| `✈️` | `send` | Telegram link |

---

## Testing Checklist (after every change)

Run Playwright MCP to check:
1. All 8 pages load with no console errors
2. Myanmar/EN toggle works (text switches, `lang` attr updates)
3. Dark/Light toggle works (`:root[data-theme]` switches, icons swap)
4. Mobile viewport 375px: no horizontal scroll, nav hamburger works
5. Desktop 1280px: layout intact, bento grid renders
6. Order form: plan pre-select from URL `?plan=` works
7. Contact links populate from config (not `#`)
8. Payment methods render

```bash
# Local dev server (zero deps)
python3 -m http.server 8080 --directory /home/ting/videopipeline
# Then Playwright navigates to http://localhost:8080/
```

---

## Common Patterns

### Add a new page
1. Copy navbar + footer HTML block from any existing page.
2. Update `active` class on the right nav link.
3. Link in nav of all 8 pages.
4. Add to footer links if appropriate.

### Update contact/payment info
Edit `data/config.json` only — `main.js` injects at runtime.

### Add a pricing plan
Edit `data/config.json` → `pricing.plans[]`. Order page reads it dynamically.

### Update download version
Edit `data/releases.json` → `latest` object.

### Myanmar text rule
Any element showing Myanmar text must have:
```css
font-family: 'Noto Sans Myanmar', sans-serif;
line-height: 1.9;
word-break: keep-all;
```
Or inherit from `body` / `.text-my` class.

---

## Skills & MCP Available

- `ui-ux-pro-max` skill → design system search
- `mcp__playwright__*` → automated browser testing
- `mcp__context7__*` → library docs lookup

Use `ui-ux-pro-max` before major visual decisions. Use Playwright MCP after each page refactor.
