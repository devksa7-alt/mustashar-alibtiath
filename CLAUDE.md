# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server on http://localhost:3000
npm run build      # Production build (run this to verify no compile errors before committing)
npm run start      # Serve production build locally
```

There are no tests or linters configured. Always run `npm run build` before committing to catch JSX/syntax errors — the app has no type checking but Next.js compilation catches most issues.

The dev server does **not** serve `api/recommend.js` — that file is a Vercel serverless function, not a Next.js `pages/api` route. The `/api/recommend` endpoint only works in production on Vercel. Local dev will 404 on that endpoint; the university explorer will show empty, which is expected.

## Required Environment Variables (Vercel only)

```
ANTHROPIC_API_KEY
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
```

## Architecture

### File Layout

```
pages/
  index.js       — Entire frontend (1500+ lines, all components in one file)
  _app.js        — Google Fonts preconnect + favicon link
  _document.js   — Custom Document: sets <html lang="ar" dir="rtl">
api/
  recommend.js   — Vercel serverless function (not a Next.js pages/api route)
styles/
  globals.css    — CSS variables, global resets, focus-visible rings, mobile optimizations
public/
  favicon.svg    — SVG compass favicon
```

### Frontend (`pages/index.js`)

Single-file React app. **All styling is inline styles** — no CSS classes, no Tailwind. Every component receives layout via JavaScript objects. The design system variables live in `globals.css` as CSS custom properties (`var(--paper)`, `var(--ink)`, `var(--accent)`, etc.) and are referenced by name in inline styles.

**Screen state machine** — `screen` state drives which of three screens renders:
- `'landing'` — full marketing page (Nav, Hero, Method, ProgramBoard, UniversityExplorer, ClosingCTA, Footer)
- `'questionnaire'` — 12-question wizard (QuestionnaireScreen component)
- `'results'` — AI-generated report (ResultsScreen component)

**Questionnaire flow** — `baseQuestions` array defines all questions; some have `showIf` predicates (e.g. mahram question only shows for female). The active `questions` array is filtered from `baseQuestions` on every render. `step` is an index into `questions`.

**Design system constants** at the top of `index.js`:
- `edMono` / `edNum` — shared style objects for monospace labels and lining numerals
- `FIELD_LABELS`, `WEATHER_LABELS`, `SAFETY_LABELS`, `TIER_LABELS`, `MF_LABELS`, `BUDGET_LABELS` — display label maps
- `getWeatherColor(val)` / `getSafetyColor(val)` — accept either DB code keys (`'hot'`, `'cold'`) or Arabic label strings — used for colored dot indicators

**Compass component** accepts `trackMouse` prop. When true, attaches a global `mousemove` listener and rotates the needle SVG `<g>` to point toward the cursor. Used only in the hero section.

**Responsive** — `useWindowSize()` hook at the top of the file provides `width`/`height`. The main `Home` component computes `isMobile = winWidth < 768` and passes it as a prop to every component. All grid layouts conditionally switch between desktop multi-column and mobile single-column. On mobile: Nav hides links, Hero stacks vertically, country picker becomes horizontal scroll tabs, university rows collapse tier/weather columns inline, questionnaire uses single-column option grids.

### Backend (`api/recommend.js`)

Vercel serverless function with two routes:

**GET** — Returns the full `UNIVERSITIES` array (sans email, minGpa, score fields) for the explorer. Cached at the CDN level for 24h (`Cache-Control: public, s-maxage=86400`).

**POST** — Main recommendation engine:
1. Rate-limit check: 6 requests/day per IP via Upstash Ratelimit (uses `x-real-ip` first, then last `x-forwarded-for` entry)
2. Input sanitization: `sanitizeText()` strips newlines and enforces 300-char max on free-text fields; `wrapUserInput()` wraps in XML delimiters for prompt injection defense
3. Redis cache lookup by `profileKey(answers)` — full SHA-256 hash (prefix `rec4:`), cached 7 days
4. If cache miss: `filterPrograms()` + `filterUniversities()` run deterministic matching, then 3 parallel AI calls fire:
   - Call 1: profile analysis paragraph + program fit reasons
   - Call 2: personalized university notes
   - Call 3: 6-step action plan
5. Result assembled and stored in Redis

**CORS** — restricted to `https://mustashar-alibtiath.vercel.app` via `setCorsHeaders()`. OPTIONS preflight returns 204.

**University scoring** — `filterUniversities()` scores candidates by field match count, GPA delta from `minGpa`, and weather preference, then selects up to 10 with diversity constraints (max 4 per country, at least one Tier 1 and one Tier 3).

**AI calls** — All use `claude-haiku-4-5-20251001`, `max_tokens: 2000`. Each prompt instructs the model to return raw JSON (no markdown fences). `callAI()` strips fences, finds `{...}` bounds, strips trailing commas, then `JSON.parse()`. Each AI call is wrapped in its own try/catch with a hardcoded Arabic fallback so a single failure doesn't abort the response.

**GPA normalization** — `normalizeGpa(gpa, scale)` converts from 4/5/100 scales to a 4.0 equivalent for uniform comparisons against `university.minGpa`.

### Data

`UNIVERSITIES` — ~125 entries across USA, UK, Canada, Australia, Japan, South Korea, Spain, New Zealand. Each entry has: `nameAr`, `nameEn`, `country` (Arabic), `city`, `tier` (1/2/3), `minGpa` (4.0 scale), `fields` (array of category keys), `email`, `weather`, `safety`, `muslimFriendly` (object), and optionally `englishGradOnly`.

`SAUDI_PROGRAMS` — 11 government scholarship programs with `applicable` (academic level array), `fields`, links.

`PROGRAM_SCHEDULE` — Separate data structure for the landing page status board with open/close months and `getProgramStatus()` computing live open/closed/closing state from current month.

## Design Language

**Editorial Atlas** — newspaper/cartography metaphor. Key patterns:
- Section eyebrows: large italic Roman numeral + Arabic display title + small-caps English label
- Numbering: `№01` in Cormorant Garamond italic gold (`var(--accent)`)
- Hairline rules: `1px solid var(--hairline)` (18% opacity ink) for subdivisions
- Hard rules: `1px solid var(--rule)` (full ink) for section breaks
- Topo background: SVG sine-wave pattern at 4–6% opacity

**Fonts** (loaded via Google Fonts in `_app.js`):
- `var(--f-arabic-disp)` → Lalezar — hero titles, section headers
- `var(--f-display)` → Cormorant Garamond — editorial English, numbers
- `var(--f-arabic)` → Tajawal — body Arabic, UI labels
- `var(--f-mono)` → JetBrains Mono — eyebrow labels, codes, `edMono` style object
- `var(--f-num)` → Cormorant Garamond — lining numerals, `edNum` style object

The page is `dir="rtl"` on all screens (set in `_document.js` on `<html>` element). LTR elements (English text, numbers, codes) use `direction: 'ltr'` inline.

**Focus rings** — `globals.css` defines `:focus-visible` outlines using `var(--accent)` for all interactive elements. Inline `outline: 'none'` was removed to restore keyboard accessibility.

**Mobile** — `globals.css` includes `@media (max-width: 768px)` for `-webkit-tap-highlight-color: transparent` and `font-size: 16px` on inputs to prevent iOS zoom.
