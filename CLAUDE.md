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

Planned additions for Supabase integration (not yet active):
```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY   # server-side only, never exposed to browser
```

## Architecture

### File Layout

```
pages/
  index.js       — Entire frontend (1800+ lines, all components in one file)
  _app.js        — Google Fonts preconnect + favicon link
  _document.js   — Custom Document: sets <html lang="ar" dir="rtl">
api/
  recommend.js   — Vercel serverless function (not a Next.js pages/api route)
styles/
  globals.css    — CSS variables, global resets, focus-visible rings, mobile optimizations
public/
  favicon.svg    — SVG compass favicon
  images/        — Campus photos and hero portrait (see Image Assets below)
  design/        — Static HTML mockups kept for design history (cream, sand, blush, sand-v2)
```

### Frontend (`pages/index.js`)

Single-file React app. **All styling is inline styles** — no CSS classes, no Tailwind. Every component receives layout via JavaScript objects. The design system variables live in `globals.css` as CSS custom properties and are referenced by name in inline styles.

**Screen state machine** — `screen` state drives which of three screens renders:
- `'landing'` — full marketing page (Nav, Hero, HowItWorks, UniversityExplorer, ClosingCTA, Footer)
- `'questionnaire'` — 12-question wizard (QuestionnaireScreen component) — **Phase 2 redesign pending**
- `'results'` — AI-generated report (ResultsScreen component) — **Phase 2 redesign pending**

**Questionnaire flow** — `baseQuestions` array defines all questions; some have `showIf` predicates (e.g. mahram question only shows for female). The active `questions` array is filtered from `baseQuestions` on every render. `step` is an index into `questions`.

**Design system constants** at the top of `index.js`:
- `edMono` / `edNum` — shared style objects for monospace labels and lining numerals (legacy, used in questionnaire/results)
- `FIELD_LABELS`, `WEATHER_LABELS`, `SAFETY_LABELS`, `TIER_LABELS`, `MF_LABELS`, `BUDGET_LABELS` — display label maps
- `getWeatherColor(val)` / `getSafetyColor(val)` — accept either DB code keys (`'hot'`, `'cold'`) or Arabic label strings
- `COUNTRY_IMAGES` — map from Arabic country strings to `/images/campus-{country}.jpg` paths (14 countries; missing photos fall back to gradient)

**Compass component** accepts `trackMouse` prop. When true, attaches a global `mousemove` listener and rotates the needle SVG `<g>` to point toward the cursor. Used only in the hero section (legacy — may be removed in phase 2).

**Responsive** — `useWindowSize()` hook at the top of the file provides `width`/`height`. The main `Home` component computes `isMobile = winWidth < 768` and passes it as a prop to every component. All grid layouts conditionally switch between desktop multi-column and mobile single-column.

### Backend (`api/recommend.js`)

Vercel serverless function with two routes:

**GET** — Returns the full `UNIVERSITIES` array (sans email, minGpa, score fields) for the explorer. Cached at the CDN level for 24h (`Cache-Control: public, s-maxage=86400`).

**POST** — Main recommendation engine:
1. Rate-limit check: 6 requests/day per IP via Upstash Ratelimit (uses `x-real-ip` first, then last `x-forwarded-for` entry)
2. Input sanitization: `sanitizeText()` strips newlines and enforces 300-char max on free-text fields; `wrapUserInput()` wraps in XML delimiters for prompt injection defense
3. Redis cache lookup by `profileKey(answers)` — SHA-256 hash (prefix `rec5:`), cached 7 days
4. If cache miss: `filterPrograms()` + `filterUniversities()` run deterministic matching, then **3 parallel AI calls** fire via `Promise.allSettled`:
   - Call 1 (`claude-sonnet-4-5`): profile analysis paragraph + program fit reasons
   - Call 2 (`claude-haiku-4-5-20251001`): personalized university notes
   - Call 3 (`claude-haiku-4-5-20251001`): 6-step action plan
5. Result assembled and stored in Redis

**CORS** — restricted to `https://mustashar-alibtiath.vercel.app` via `setCorsHeaders()`. OPTIONS preflight returns 204.

**University scoring** — `filterUniversities()` scores candidates by field match count, GPA delta from `minGpa`, and weather preference, then selects up to 10 with diversity constraints (max 4 per country, at least one Tier 1 and one Tier 3).

**AI calls** — `callAI({ system, user, model })` applies `cache_control: { type: 'ephemeral' }` to system blocks for Anthropic prompt caching. Each prompt builder (`buildProfileAnalysisPrompt`, `buildUniversityNotesPrompt`, `buildActionPlanPrompt`) returns `{ system, user }` — static instructions in `system` (cached), dynamic student data in `user`. `repairJSON()` handles malformed AI output: missing commas between array elements, truncated JSON, stray control characters.

**CV extraction** — `extractCVFromBase64()` uses `claude-haiku-4-5-20251001` with a PDF `document` content block. Result cached in Redis for 30 days (`cv:{hash}`). `isCVPopulated()` validates the extraction before use. `cvStatus` (`'used' | 'failed' | 'empty' | 'none'`) is returned in the response and shown as a banner in the frontend.

**GPA normalization** — `normalizeGpa(gpa, scale)` converts from 4/5/100 scales to a 4.0 equivalent for uniform comparisons against `university.minGpa`.

### Data (current — hardcoded, migration planned)

All data lives directly in `api/recommend.js` as JavaScript constants.

`UNIVERSITIES` — 154 entries across USA, UK, Canada, Australia, Japan, South Korea, Spain, New Zealand. Each entry: `nameAr`, `nameEn`, `country` (Arabic), `city`, `tier` (1/2/3), `minGpa` (4.0 scale), `fields` (array of category keys), `email`, `weather`, `safety`, `muslimFriendly` (object with `halal`, `mosque`, `saudiCommunity`, `prayerRoom`), and optionally `englishGradOnly`.

`SAUDI_PROGRAMS` — 11 government scholarship programs. Fields: `name`, `description`, `eligibility`, `applicable` (academic level array), `fields`, `link`, `linkLabel`.

`PROGRAM_SCHEDULE` — Landing page status board with open/close months. `getProgramStatus()` computes live open/closed/closing state from current month.

## Planned: Supabase Database Integration

The next major milestone is moving `UNIVERSITIES` and `SAUDI_PROGRAMS` out of the code file and into a Supabase PostgreSQL database. Goals:

- Edit universities/programs via Supabase dashboard without code deployments
- Replace JavaScript filtering loops in `filterUniversities()` with server-side SQL queries
- Foundation for future user accounts and saved results

**Planned table structure:**

```sql
-- universities
id, name_ar, name_en, country, city, tier, min_gpa,
fields (text[]), email, weather, safety,
halal, mosque, saudi_community, prayer_room,
english_grad_only (bool)

-- saudi_programs
id, name, description, eligibility,
applicable (text[]), fields (text[]), link, link_label

-- program_schedule
id, program_name, open_month, close_month
```

**Migration approach:** The GET route in `api/recommend.js` fetches university data for the explorer — this is the first seam to replace with a Supabase query. `filterUniversities()` and `filterPrograms()` are the second seam.

**Key constraint:** `SUPABASE_SERVICE_ROLE_KEY` must only be used server-side (in `api/recommend.js`). Never import `@supabase/supabase-js` with the service role key in `pages/index.js` — the frontend should continue fetching data through `/api/recommend`.

## Design Language

### ⚠️ Active Design System: Sand & Gold (Landing Page)

The landing page was fully redesigned in Phase 1 to a **warm, human** aesthetic. The Editorial Atlas system is retired for the landing page but kept intact for Questionnaire and Results screens.

**Sand & Gold tokens** (in `globals.css`, used by landing components):
- `--sand: #F5EFE3` — page background
- `--sand-2: #EBE3D2` — subtle section backgrounds
- `--sand-card: #FBF8F0` — card backgrounds
- `--gold: #C9A961` — primary accent (CTAs, highlights)
- `--gold-soft: #E5D4A1` — muted gold for pills/tags
- `--navy: #1A2942` — primary text, dark sections
- `--navy-soft: #5A6678` — secondary text
- `--bronze: #8B6F3E` — tertiary accent
- `--warm-rule: rgba(26, 41, 66, 0.1)` — dividers
- `--f-warm: 'Cairo', 'Tajawal', sans-serif` — Arabic body + display
- `--f-warm-num: 'Plus Jakarta Sans', 'Cormorant Garamond', sans-serif` — numerals

**Landing component inventory** (all in `pages/index.js`):
- `Nav` — blurred sticky header, gold `م` logo mark, `ابدأ الاستشارة` CTA
- `Hero` — photo slot (`/images/hero-student.jpg`), gold-highlighted headline, floating preview cards (Toronto/Imperial) with `warm-float` animation, stats row
- `HowItWorks` — 3-step cards with SVG icons, gold step numbers, hover lift (replaces old `Method`)
- `UniversityExplorer` — warm card grid, campus photo via `COUNTRY_IMAGES`, country/field filters, search bar — all filtering logic preserved
- `ClosingCTA` — navy background, gold button
- `Footer` — sand background, credit to Sanad Allheani

**Removed from landing** (functions still in file for Phase 2 reference): `TopoLines`, `QuoteRibbon`, `Method`, `ProgramBoard`

**IMPORTANT RULE — No مجاناً anywhere.** All CTAs say "ابدأ الاستشارة" or "ابدأ الاستشارة الآن". Never add "مجاناً" or "free" to any button or copy.

**Always preview screenshots before committing.** Use `preview_start` + `preview_screenshot` to verify the page at 1440×900 viewport before every push.

### Legacy Design System: Editorial Atlas (Questionnaire + Results)

Still active for `QuestionnaireScreen` and `ResultsScreen`. Tokens preserved in `globals.css`:
- `--paper: #f4efe6`, `--ink: #14233b`, `--accent: #b6873a`
- Fonts: Lalezar (display), Cormorant Garamond (numbers), Tajawal (body), JetBrains Mono (eyebrows)
- Section eyebrows: large italic Roman numeral + Arabic display title
- Numbering: `№01` in Cormorant Garamond italic gold
- Hairline rules: `1px solid var(--hairline)`

### Image Assets (`public/images/`)

| File | Content | Status |
|------|---------|--------|
| `hero-student.jpg` | Young man, backpack, autumn tones | ✅ present |
| `campus-australia.jpg` | Sydney Opera House | ✅ present |
| `campus-canada.jpg` | Toronto campus | ✅ present |
| `campus-germany.jpg` | Bavarian architecture | ✅ present |
| `campus-japan.jpg` | Modern Asian campus | ✅ present |
| `campus-spain.jpg` | Spanish plaza/cathedral | ✅ present |
| `campus-uk.jpg` | English collegiate gothic | ✅ present |
| `campus-usa.jpg` | Ivy League autumn quad | ✅ present |
| `campus-newzealand.jpg` | Auckland city campus | ✅ present |
| `campus-southkorea.jpg` | Seoul campus, ginkgo autumn | ✅ present |
| `campus-ireland.jpg` | Trinity Dublin style courtyard | ✅ present |
| `campus-malaysia.jpg` | Tropical campus, palms | ✅ present |
| `campus-turkey.jpg` | Bosphorus hillside campus | ✅ present |
| `campus-netherlands.jpg` | Amsterdam canal building | ✅ present |
| `campus-france.jpg` | Sorbonne Paris in autumn | ✅ present |

All 14 country campus photos are now in place. New images added via the `mcp__mcp-image__generate_image` MCP tool (Gemini backend).

**Lesson learned on Gemini image gen:** Long detailed prompts (40+ words) repeatedly returned 503 "high demand" errors. Short prompts (5-10 words, named landmark + season) worked reliably. Example that works: `"Sorbonne Paris in autumn."` Use the Gemini MCP with concise, landmark-anchored prompts to avoid 503 cycling.

All `<img>` tags use `onError` to silently fall back to a gradient if a photo is missing.

## Pending Work

### Immediate (User Action)
- **Merge PR #2** at https://github.com/devksa7-alt/mustashar-alibtiath/pull/2 — deploys the Phase 1 landing redesign to production on Vercel

### Phase 2: Questionnaire Redesign
- Card stack with motion — one question per screen, slide transitions between steps
- All questionnaire logic (`baseQuestions`, `showIf`, `step` state) preserved — UI only
- Results screen redesign to match Sand & Gold palette

### Phase 3: Database & Bug Fixes
- Expand `UNIVERSITIES` from ~154 to ~250 entries (Germany, Ireland, Malaysia, Turkey, Netherlands, France + more mid-tier)
- Fix zero-results bug for lab specialist profiles: expand `categorizeField()` regex, add progressive fallback in `filterUniversities()`, frontend empty-state message
- Supabase migration (see above)

## Fonts (loaded via Google Fonts in `_app.js`)

- `var(--f-warm)` → Cairo — landing page Arabic body + display
- `var(--f-warm-num)` → Plus Jakarta Sans — landing page numerals/English
- `var(--f-arabic-disp)` → Lalezar — questionnaire/results section headers
- `var(--f-display)` → Cormorant Garamond — questionnaire/results editorial numbers
- `var(--f-arabic)` → Tajawal — questionnaire/results body Arabic
- `var(--f-mono)` → JetBrains Mono — eyebrow labels in questionnaire/results

The page is `dir="rtl"` on all screens (set in `_document.js` on `<html>` element). LTR elements (English text, numbers, codes) use `direction: 'ltr'` inline.

**Focus rings** — `globals.css` defines `:focus-visible` outlines using `var(--gold)` (updated from legacy `--accent`) for all interactive elements.

**Mobile** — `globals.css` includes `@media (max-width: 768px)` for `-webkit-tap-highlight-color: transparent` and `font-size: 16px` on inputs to prevent iOS zoom.

## Tooling Notes

- **gh CLI full path**: `/c/Program Files/GitHub CLI/gh.exe` (not in PATH)
- **Active branch**: `claude/goofy-curie-7a21eb`
- **Dev explorer shows 0 universities**: expected — the GET `/api/recommend` endpoint is Vercel-only; will show 236 in production
