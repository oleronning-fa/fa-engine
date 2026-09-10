# Finansavisen — Design System
### `design-system.md` · v1.1 (authoritative) · finansavisen.no · Hegnar Media AS
*Reverse-engineered from live production: page source of front page, Siste nyheter, Børs, Ticker detail (ENVIP), Watchlist/Portefølje, MittFa, Aksjeforum, Bjellesauer.
Full external CSS bundles (`finansavisen-assets`, Zephr `tailwind`/`Typography`/`Button`/`real-time-data-slider`), Zephr header/footer component source, article pages (free + FA+ wall), rendered-DOM dumps and pixel-verified screenshots at 1440px & 390px. Every hex, px and timing below traces to that evidence — nothing is approximated.*

> **How to use this file with Claude / AI tools:**
> Paste this entire file at the start of a conversation (or into a Project / CLAUDE.md), then request any mockup, e.g. *"Using the Finansavisen design system, mock up a dividend-calendar page."* Treat every token as authoritative. Section 13 contains a copy-paste CSS starter with all tokens pre-wired.

---

## 1. Brand DNA

Finansavisen ("Best på børs") is Norway's dedicated business daily. The digital product is **two design layers sharing one token system, framed by one market-data chrome**:

1. **The editorial layer** (front page, articles, section feeds) — a dense, newspaper-packed grid of story cards with auto-fitted headlines, hairline-free flat surfaces, and color-coded "skins" for story types. Built on Aptoma DrEdition; feels like a broadsheet translated to screen.
2. **The product layer** (Børs, MittFa, Watchlist, Aksjeforum, Bjellesauer) — a modern fintech app aesthetic: Inter everywhere, pill buttons, rounded cards, tabbed navigation, ticker chips, real-time data. Built on MUI + Tailwind (Zephr components).
3. **The chrome** that frames both: a near-black scrolling market-ticker strip on top, the deep-blue two-row masthead below it, and the deep-blue footer. Always present, always identical.

Identity anchors: **the blue-700 masthead (#024588) with white text**, the blue scale for interaction, and Norwegian financial-market conventions throughout. Any mockup must decide which layer it lives in and follow that layer's shape language — editorial = flat and dense; product = rounded and data-forward. Both sit inside the chrome.

**Litmus test:** market data is a first-class citizen (ticker strip, ticker chips, buy/sell coloring, Norwegian number formats), color always means something, and nothing feels playful or lifestyle-ish.

---

## 2. Product architecture & sub-brand theming

| Product / surface | Purpose | Header/theme override |
|---|---|---|
| **Finansavisen** (core) | News front, articles, Siste nyheter | Header `blue-700` #024588 |
| **Børs** | Market center: Oslo Børs, mest omsatte, vinnere/tapere, indices, utbytter, finanskalender | core blue |
| **MittFa** | Personalised news feed ("Lag din personlige nyhetsfeed") | core blue |
| **Watchlist / Portefølje** | "Lag din egen portefølje" — follow instruments | core blue |
| **Aksjeforum** | Stock discussion forum, threads per ticker | core blue |
| **Bjellesauer** | Insider-trade tracking (who bought/sold what) | core blue |
| **400 Rikeste / Kapital Index** | Rich-list features | core blue; special feature fonts (§4) |
| **Kapital** (sister magazine) | | Header/footer & corner tabs swap to `orange-600` #C65815 |
| **Motor** | Cars/lifestyle | Header/footer & corner tabs swap to `gray-800` #292E32 |
| **FA Brand Studio / Agenda** | Native advertising | Ad skin (grey), always labeled |

The header/footer theme swap (fill of bar + corner tabs, toggled by `window.product`) is the *only* thing sub-brands change; all other tokens stay. Note: the swap orange is `orange-600` **#C65815** (Zephr token); the legacy brand variable `--color-kapital` **#D57928** still exists for Kapital wordmark/label contexts — don't use it as a surface color.

**Primary nav (in production order):** Siste nytt · MittFa · Forum · Børs · Watchlist · Bjellesauer · 400 Rikeste · Aksjer · Valuta · Video. New products carry a red `NY` badge.

---

## 3. Color tokens (extracted, exact)

### 3.1 Blue scale — identity & interaction
```css
--color-blue-50:  #E6F1FC;  /* active/pressed fills, ticker-chip bg, selected range chip */
--color-blue-100: #CDE3F9;
--color-blue-200: #9AC7F4;  /* footer secondary text/links */
--color-blue-300: #68ABEE;
--color-blue-400: #358FE9;
--color-blue-500: #0373E3;  /* PRIMARY interactive: buttons, links, selected tabs, focus, charts */
--color-blue-600: #025CB6;  /* primary hover (rgb(2,80,158) in MUI hover states) */
--color-blue-700: #024588;  /* HEADER/FOOTER; "cover" story skin; theme-color meta */
--color-blue-800: #012E5B;  /* Aksjeanalyse widget surface */
--color-blue-900: #01172D;  /* "featured" story skin bg; tag text on light */
--color-light-blue: #EAF6FF; /* info panels (Bedriftsabonnement box) */
```

### 3.2 Grey scale — surfaces & ink
```css
--color-grey-25:  #F8F9F9;  /* BODY BACKGROUND (--color-bg-body) */
--color-grey-50:  #F1F2F3;  /* default button fill, wells, tag chips */
--color-grey-75:  #EAECED;
--color-grey-100: #D5D9DC;  /* button hover fill, borders */
--color-grey-200: #BABFC4;
--color-grey-300: #9EA6AD;  /* disabled text, placeholder */
--color-grey-400: #838C95;  /* ad-skin background, muted icons */
--color-grey-500: #67737E;  /* secondary text, unselected tabs, icons */
--color-grey-600: #525C65;
--color-grey-700: #3E454C;
--color-grey-800: #292E32;  /* Motor theme; Markedsnytt widget surface */
--color-grey-900: #151719;  /* PRIMARY TEXT on app surfaces; market-ticker strip bg; Mest lest module bg */
--color-black:    #000;     /* --color-text on editorial; breaking-black skin */
--color-white:    #FFF;     /* --color-bg-front: front-page surface */
```
(Zephr publishes the identical scale as `--zp-color-gray-*` — "grey" and "gray" spellings coexist in production; values match 1:1.)

### 3.3 Semantic & extended palette
```css
/* legacy brand variables (page-source custom props) */
--color-brand:    #0073B8;  /* legacy/brand blue (logo contexts, paywall accent #0073B9) */
--color-siste:    #E51E05;  /* "Siste"/breaking red — editorial urgency only */
--color-premium:  #0A6482;  /* subscriber/premium teal */
--color-kapital:  #D57928;  /* Kapital orange (wordmark/label contexts) */
--color-annonse:  #8D8D8D;  /* ad labeling grey */
--color-abonnent: #575756;  /* subscriber-label grey */

/* Zephr token palette (zephr-tailwind.css, verbatim) */
--color-green-500:  #19BE76; /* market up in ticker strip; avatar green */
--color-red-500:    #CA2B3D; /* market down in product widgets; error/dunned states; live-dot core */
--color-red-50:     #F6DDE0; /* negative-state fills, "Siste" pill bg family */
--color-red-200:    #EBB5BB; /* negative-state borders */
--color-red-100:    #F4CACF; /* live-dot outer ring */
--color-red-400:    #DD5F6E; /* market down in ticker strip (on dark) */
--color-orange-100: #FFD9BD; /* Kapital footer secondary text */
--color-orange-200: #FBBE98;
--color-orange-500: #F77222; /* avatar orange */
--color-orange-600: #C65815; /* Kapital header/footer/corner-tab fill */
--color-purple-500: #8C46CE; /* avatar purple */
--color-yellow-500: #FCCA27;
/* avatar set (forum/ticker identicons): blue #0373E3, green #19BE76,
   orange #F77222, purple #8C46CE, yellow #FCC727 */
```

### 3.4 Market direction — three verified contexts, don't mix them
| Context | Up / positive | Down / negative | Evidence |
|---|---|---|---|
| **Market-ticker strip** (top chrome, on `grey-900`) | `#19BE76` | `#DD5F6E` | `.c-bors__item--positive/--negative` + pixel-verified |
| **Product widgets** (Watchlist, Portefølje, Børs graphs, index chart, range-chip %) | `#14985E` | `#CA2B3D` | `.c-color-green/.c-color-red`, `.is-positive/.is-negative` |
| **Insider feed sentences** (Bjellesauer, MittFa) | Tailwind `text-green-600` #16A34A | `text-red-600` #DC2626 | feed markup |

Observed feed pattern: the *quantity and value* are colored, not whole rows — *"kjøpte **10 087** … for **206,5 K**"* in green; *"solgte **75 000** … for **37,0 M**"* in red. Chart value-labels in negative use a `#CA2B3D` chip with white 14px/600 text, radius 6px. Direction colors are reserved exclusively for market/transaction meaning.

### 3.5 Usage rules
1. Backgrounds: `grey-25` page canvas, `white` content surfaces/cards. Dark surfaces: chrome (blue-700), ticker strip & Mest lest (grey-900), Markedsnytt (grey-800), Aksjeanalyse (blue-800), story skins.
2. `blue-500` owns interactivity: one unmistakable interactive color across the whole product.
3. Two reds, two jobs: `siste` **#E51E05**-family is editorial breaking/urgency; **#CA2B3D** (red-500) is market-negative and error states. Never swap them.
4. Two greens, two jobs: **#19BE76** on dark chrome, **#14985E** in white-surface widgets.
5. Text: `grey-900` primary / `grey-500` secondary / `grey-300` disabled on app surfaces; `black`/`white` on editorial skins.
6. WCAG AA minimum; direction never conveyed by color alone (pair with kjøpte/solgte verbs, +/− signs, ▲/▼ triangles).

---

## 4. Typography (extracted)

Google Fonts load: `Inter` (variable 100–900 + italic), `Merriweather` (400/700 + italic), `PT Serif` (400/700 + italic), `Playfair Display` (400–900), `Barlow` / `Barlow Condensed` / `Barlow Semi Condensed`, `Open Sans`, `Roboto`. Self-hosted (`/static/finansavisen/fonts/`): Barlow Bold/ExtraBold, Barlow Semi Condensed Bold, **Unica77LL** (Light→Black) and **LeMondeJournalPro** (Regular/Italic/Bold) — the latter two power Kapital-index / 400 Rikeste feature pages only.

| Token | Family | Role (as used in production) |
|---|---|---|
| `--font-inter-sans-serif` | `"Inter", sans-serif` | **Default everywhere**: UI, headlines, article body, data, buttons, tabs |
| `--font-merriweather` | `"Merriweather", serif` | **Opinion/leder card titles & bylines** (skin-opinion); `m-*` ramp |
| `--font-pt-serif` | `"PT Serif", serif` | **Quote-feature titles**; legal/disclaimer prose |
| `--font-playfair` | `"Playfair Display", serif` | Display/feature ramp (`p-*`), magazine-style specials |
| `--font-barlow-semi-condensed` | `"Barlow Semi Condensed", sans-serif` | Brand marks, wordmark-adjacent labels |
| Unica77LL / LeMondeJournalPro | self-hosted | Kapital-index & 400 Rikeste features only — never core UI |

### 4.1 The official Inter ramp (production's own class names, two independent CSS bundles agree)

**Semantic set** (Zephr `Typography.css`):
| Class | Size/LH | Weight | Class | Size/LH | Weight |
|---|---|---|---|---|---|
| `h1` | 32/40 | 700 | `body-1` | 16/24 | 400 |
| `h2` | 32/40 | 600 | `body-2` | 15/24 | 400 |
| `h3` | 24/32 | 700 | `body-3` | 14/22 | 400 |
| `h4` | 18/26 | 700 | `body-4` | 12/14 | 400 |
| `h5` | 18/26 | 600 | `label-1` | 14/22 | 600 UPPERCASE |
| `h6` | 16/24 | 700 | `label-2` | 10/14 | 600 |
| `subtitle-2` | 15/24 | 700 | `label-3` | 9/14 | 600 UPPERCASE |
| `subtitle-3` | 15/24 | 600 | `button-1` | 15/24 | 700 |
| `subtitle-4` | 12/14 | 600 UPPERCASE | `button-2` | 14/20 | 700 |
| | | | `button-3` | 14/20 | 600 |

**`i`-scale** (both bundles; a=display/body, b=small):
| Class | Size/LH | Weights available |
|---|---|---|
| `i-a7-bold` | 68/80 | 700 |
| `i-a6-bold` | 48/56 | 700 |
| `i-a5-bold` | 34/40 | 700 |
| `i-a4` | 24/32 | 700 / 500 |
| `i-a3` | 20/26 | 700 / 500 |
| `i-a2` | 18/24 | 700 / 600; regular = 18/**30** 400 (article body) |
| `i-a1` | 16/24 | 700 / 600 / 400; medium = 16/**22** 500 |
| `i-b0` | 14/20 | 600 / 500 / 400 — **the app-UI body size** |
| `i-b1` | 12/16 | 700 / 600 / 500 — chips, metadata, timestamps |
| `i-b2-medium` | 10/14 | 500 |

> ⚠ v1.0 of this file mapped `i-b0-regular` to 16/24 — that was wrong. `i-b0` is 14/20; 16/24 is `i-a1`. Product-app running text is 14px, article running text is 18–20px.

**Serif ramps:** Merriweather `m-a3-bold` 24/36 · `m-a2` 20/32 (700/400) · `m-a1` 18/32 (700/400) · `m-b0` 16/28 (700/400). Playfair `p-a5-medium` 72/80 · `p-a4-medium` 56/64 · `p-a3-regular` 40/48 · `p-a2` 34/44 · `p-a1` 28/38 · `p-b0` 20/32 · `p-b1-regular` 18/26 · `p-b2-regular` 16/22.

### 4.2 Editorial headline system (DRE front page)
Front-page headlines use **auto text-fit**: base sizes `--base-font-size: 60px` (standard) / `100px` (leads) multiplied by `--font-size-multiplier` steps `0.25 / 0.33 / 0.45 / 0.5 / 0.6 / 0.67 / 0.7` depending on card size and line count — so a lead can render anywhere ~25–70px, always filling its column width. Mobile equivalents in vw (`6.4vw` lead, `4.27vw` standard). Card text zone padding `--content-padding: 16px` desktop / `2.1333vw` mobile. For mockups: **Inter 700, tight lines (~1.05–1.15), sized to fill the card width, sentence case.**
- Kicker/pretitle above the headline: plain weight, ~24–28px on leads (*"Oslo Børs åpner ned:"*).
- Summary (ingress): 18px desktop / 3.73vw mobile, regular, margins `.4em`.
- Byline/footer: 18px *italic*, margin-top 8px.
- On "featured" skin: summary `hsla(0,0%,100%,.5)` 16/1.375.

### 4.3 Norwegian conventions
Sentence case always (bokmål — no Title Case). Numbers: space or dot thousands `10 087` / `62.364,92`, comma decimals `206,5`, magnitude suffixes `K` / `M` / `mrd.`, currency `kr`, percent `+2,4 %` (space before %). Dates `12. juli 2025`, time `15:32`, relative `Publisert 08:52`. `font-variant-numeric: tabular-nums` for tables and tickers.

### 4.4 Article-page type (extracted from `c-article-regular` + `c-drp`)
| Element | Spec |
|---|---|
| Container base | Inter 18/30 400 on white (mobile 16/24) |
| Kicker (`__pretitle`) | Inter ~28px 700, black, above title (*"Tar opp dekning:"*) |
| Title | Inter **68/76 700** desktop · 32/1.2 mobile; `--small` variant 48/56; compact contexts 34/40 |
| Preamble (ingress) | Inter **24/32 500** black (legacy static template: 30px/1.2 `#616161`) |
| Body paragraphs | **20px/1.6** desktop · 18px mobile; margins `1.125rem 0 .5rem` |
| In-body `h2`/`h1` | Inter 24/32 700 (mobile 20/26); `h3` 1.222em 600 |
| Links | Underlined in body; visited `#004182` |
| Bullet lists | Square **14×15px `blue-700` blocks** before items; fact-box lists: 6px round `blue-700` dots |
| Numbered lists | Bold black markers |
| Caption | Bold UPPERCASE prefix + sentence (*"TAR OPP DEKNING: Analytiker …"*), then `Foto: <name>` in grey |

---

## 5. Layout, grid & breakpoints (extracted)

**Breakpoints:** DRE editorial: mobile `≤767px` · tablet `768px` · desktop `769–1439px` · wide `≥1440px`. Zephr chrome/components additionally step at `450 / 500 / 600 / 768 / 1130 / 1320` — **1130px is the header's mobile↔desktop switch**.

**Front-page grid:** 12 columns; `--grid-width: 980px` desktop (`732px` tablet, `100vw` mobile); `--column-gap: 24px` desktop, `16px` tablet, `2.667vw` mobile; `--row-gap: 16px` (10px compact). Card size classes span the grid: full / two-thirds (8 col) / half (6) / five / third (4) / quarter (3) / two (2) — packed edge-to-edge, newspaper style. Front page carries a right rail (~300px) of product widgets (§8.6).

**App containers:** Forum `max-width: 1180px` · secondary content `1024px` · Børs/Ticker app `1440px` frame · article body column `max-width: 980px` centred. Page canvas `grey-25`, content on white.

**Spacing:** 4px base unit (`--zp-spacing: 4px`); dominant steps 4 / 8 / 16 / 24px.

**Radius tokens (Zephr):** `sm` 4px · `md` 6px · `lg` 8px · `xl` 12px · `2xl` 16px · pill `100px` · circle 50%.
- Editorial layer: images/cards square (0); the blue badge bar `2px`.
- Product layer: buttons/inputs 4px, cards/list items 6px, panels/search/widgets 8px, info boxes 12px, modals/sheets 16px, chips & pill buttons 100px, avatars circle.
- Chrome: flat bars; two 8px inverted-corner tabs under the header (signature detail, §6).

**Elevation:** essentially flat; MUI dialogs/menus use standard soft shadows (`rgba(0,0,0,.2)/.14/.12` stack). No decorative shadows on cards at rest.

---

## 6. Global chrome (extracted from component source + rendered DOM)

### 6.1 Market-ticker strip (`c-bors` topbar — topmost element on every page)
- Bar: background `grey-900` #151719, height **36px** (2.25rem), full-width, overflow hidden.
- Content: continuous marquee, `animation: 26s linear infinite`, pausable; each instrument is a link to `/ticker/<SYMBOL>` (indices use `^`-prefix, e.g. `/ticker/^N225`).
- Item anatomy: name (Inter 12/16 **500** white) · value (12/16 **600**, margin-left 8px) · ▲/▼ triangle 16px + % (12/16 600, margin-left 1px). Item spacing: margin-left 24px.
- Direction colors **on this dark bar**: up `#19BE76`, down `#DD5F6E` (pixel-verified).
- Typical instruments: Oslo Børs · Dollar · SEK · Euro · US 10 ÅR · Nikkei 225 · Bitcoin · Brent Spot · Gull.

### 6.2 Header (two rows, Zephr component)
- Background `blue-700` #024588 (Kapital → `orange-600` #C65815; Motor → `gray-800` #292E32); fixed/sticky, `z-index` above content ("z-110"); white text throughout.
- **Total height: 88px mobile / 116px desktop** (switch at ≥1130px). Row 1 ≈ the DRE offset var `--header-height` (64px mobile / 72px desktop); row 2 is the section nav.
- **Row 1:** wordmark "Finansavisen" (white logotype, left) · centred search field (dark-navy well, radius 8px, magnifier icon, placeholder *"Søk på ticker eller selskap"* in light blue; collapses to icon on mobile) · right: **Logg inn** (blue-500 fill, white text, radius 8px) · **Kjøp** (white fill, grey-900 text, pill) · **Meny** + hamburger (white).
- **Row 2:** section nav in production order (§2), Inter ~15px 600 white, horizontally scrollable on mobile; new products carry a `NY` badge (red #E51E05-family fill, white ~10px uppercase, radius 4px).
- **Signature:** two 8×8px quarter-circle SVG corner pieces hang below the header's bottom edge at far left/right, fill = header color, rounding the transition into the page. Sub-brand swap changes their fill too.

### 6.3 Footer (Zephr component)
- Background matches header (blue-700 core / orange-600 Kapital / gray-800 Motor); white primary text; secondary text & links `blue-200` (Kapital: `orange-100`; Motor: `gray-200`); sizes 14px/12px.
- Composition: masthead block (*"Utgis av Hegnar Media AS" · "Sjefredaktør/adm.dir: Trygve Hegnar" · "Hoffsveien 70 A, Postboks 724 Skøyen, 0214 Oslo"* · **Kontakt oss**) · link columns (Abonnement · Bedriftsabonnement · eAvis · Arkiv · Annonse · Event · Vilkår · Personvernerklæring · Cookies · Samtykkeinnstillinger) · app-promo block (*"Bruk Finansavisen-appen" — "Få nyhetsvarsler og en personalisert FA-opplevelse"*, **Les mer**) · data attribution (©Nikkei Inc., TradingView Lightweight Charts™) · ©-line.

---

## 7. Editorial layer — DRE story-card system (extracted)

Every front-page story is a `dre-item` with a **skin** and a **size**:

| Skin | Background | Text | Notes |
|---|---|---|---|
| `nyheter` (default) | white | black | Standard news card |
| `featured` | `blue-900` #01172D | white; summary at 50% white | Big packages; tags centered, tag text `blue-900` on light chips |
| `cover` | `blue-700` #024588 | white | Cover-style package (pixel-verified flat #024588); footer carries a 3px blue-700 border top+bottom |
| `opinion` / leder | white | black | **Merriweather** title + italic Merriweather byline; round author portrait `--size: 72px` |
| `ad` | `grey-400` #838C95 | | Native/ad slot; footer 18px; always labeled (annonse grey #8D8D8D) |
| `feature-breaking-black` | black | white | Breaking treatment; may pair with `siste` red accents |
| `feature-quote` | | | Title set in **PT Serif** (quotation feature) |

**Card anatomy:** `image (edge-to-edge, no radius)` → `text block (padding 16px / 2.1333vw): optional kicker + title (auto-fit Inter 700) + summary + italic byline footer` → optional `tag chips` (height 24px, gap 8px, padding-x 12px, pill, grey-50 fill) and a **blue-700 badge bar** (height 28px, radius 2px, white text, overlaps section boundary by −14px) used as section/kicker marker. Chaser links (related stories) attach beneath in half/third widths.

**Image stickers** (overlaid on card images):
- **Follow "+"**: blue-500 square (radius ~6px), white 14px plus icon, top-right corner.
- **Siste**: light-red pill (`red-50` family, pixel ≈#F6D7DA) with red dot + red *"Siste"* label (≈#E93232; rendered via the Kilkaya personalization layer — treat exact red as `⚠ PROVISIONAL`, family is certain).
- **Populært**: white pill, flame icon + red label.

**Section modules on the front:** *"Mest lest"* — full-width `grey-900` #151719 module, white title 600, horizontally scrolling numbered story cards, arrow controls.

**Section feeds (Siste nyheter):** compact chronological list rows — timestamp + headline + section tag, divided by hairlines on white.

### 7.5 Article page (extracted, new in v1.1)
White canvas, single centred column (text measure `max-width 980px`; media full column width). Top-to-bottom anatomy:
1. Optional campaign banner: `blue-500` bar, white 600 text, white pill button (*"Start nå"*), full column width.
2. Kicker → Title → Preamble (type specs §4.4).
3. Tag chips: `grey-50` pills, small icon + 12px grey-900 label (*"Finans", "Dagens aksjetips"*).
4. Meta row: *"Publisert 08:52"* (12px grey-500) · right: **Legg til MittFa** pill (white fill, blue-500 border + text + star icon).
5. Lead image edge-to-edge in column; caption per §4.4.
6. Author row: circular portrait 40px + name (14px 600) + role *"Journalist"* (12px grey-500) · right: **Tips meg** grey-50 pill + circular grey-50 icon buttons (copy-link, Facebook, X, LinkedIn).
7. Body (§4.4): square blue-700 list bullets, underlined links, in-body h2s; inline ticker chips where relevant (§8.3).
8. Related links (*"Les også:"*) and fact boxes (6px round blue-700 bullets).

### 7.6 Paywall / registration wall (FA+, Zephr)
Replaces body after the preamble on gated articles. Centred on white:
- Heading *"Bli abonnent fra 99 kr"* (Inter ~20px 700) · subline *"Betal med Vipps, kort eller faktura."* (14px grey-500).
- Three SSO buttons stacked (width ~480px, height ~44px, white fill, 1px `grey-100` border, radius 8px, icon left + centred 600 label): *Fortsett med e-post / Fortsett med Apple / Fortsett med Google*.
- *"Har du allerede en konto?"* + **Logg inn** (blue-500 link) · reCAPTCHA microtext with underlined links.
- Below: **Bedriftsabonnement** panel — `light-blue` #EAF6FF fill, radius 12px, dark text, own CTA.
- Legacy article-paywall variant (`c-paywall`): white panel with **5px `#0073B9` left bar**, dark `#333` login button, benefits box `#F1F4F1` radius 8px.

---

## 8. Product layer — app components (extracted from MUI/Tailwind/Zephr source)

### 8.1 Buttons
| Variant | Style |
|---|---|
| **Primary (contained)** | bg `blue-500`, text white, hover bg `rgb(2,80,158)` (≈blue-600), radius 4–8px (marketing) or pill 100px (in-app), padding 6–8px × 12–16px |
| **Default (tonal pill)** | height 32px, pill 100px, bg `grey-50`, text `grey-900` 12/16 500, hover bg `grey-100`, active bg `blue-50` + text `blue-500`, disabled bg `grey-50` + text `grey-300` |
| **Outlined** | border `rgba(3,115,227,.5)`, text `blue-500`, hover border solid `blue-500` + bg `rgba(3,115,227,.04)` |
| **Text** | `blue-500`, hover bg `rgba(3,115,227,.04)` |
| **On-blue (header)** | Logg inn: blue-500 fill/white; Kjøp: white fill/grey-900 |
| Focus (all) | `outline: solid 2px #0373E3` + inner `2px #FFF` separation ring |
| Motion | MUI: `250ms cubic-bezier(0.4,0,0.2,1)`; Zephr: `150ms` same curve |

### 8.2 Tabs
Min-height 48px (dense: padding 8×12); label Inter 14/16 600 `grey-500`; hover & selected `blue-500`; disabled `rgba(0,0,0,.38)`; **active indicator: 3px `blue-500` bar**, 300ms ease; horizontally scrollable with hidden scrollbars on mobile.

### 8.3 Ticker chip (signature element)
`<li class="rounded-[100px] bg-blue-50 px-1"><span class="i-b1-medium text-blue-500">ENVIP</span></li>` — pill, `blue-50` fill, `blue-500` uppercase ticker code, 12/16 500. Used inline in headlines, forum threads, insider feed, watchlists. Clickable → `/ticker/<SYMBOL>`.

### 8.4 Data & live patterns
- **Insider-trade row (Bjellesauer):** avatar (circle) + `i-b0-regular grey-900` sentence with semibold name/amounts, amounts colored by direction (§3.4) + ticker chip + relative timestamp `i-b1-medium grey-300`.
- **Tables (Børs):** Inter tabular-nums, right-aligned numbers, header `i-b1-semi-bold grey-500`, rows on white, hover `grey-25`; direction cells per §3.4 (product context).
- **Live indicator:** 16px dot — outer ring `#F4CACF`, core `#CA2B3D` — + *"Live"* label `i-b1-medium`; sits in chart headers and the real-time bar.
- **Real-time data bar:** white sheet, radius 8px top corners only, padding 16×30, toggle switch 36×20px (track `#C7C8D4` off, white 18px knob) + `i-b1-medium` labels.
- **Skeleton loading:** `rgba(0,0,0,.11)` blocks with 2s linear shimmer sweep (`translateX(-100% → 100%)`, gradient `rgba(0,0,0,.04)`).
- **Panels/cards:** white, radius 6–8px, 16px padding, title `h4`/`h5` (18/26).
- Spacing rhythm: 4px base; dominant steps 4 / 8 / 16 / 24px.

### 8.5 Forms
Inputs: white bg, 1px `grey-100` border, 4px radius, label `i-b1-semi-bold` above, focus ring 2px `blue-500`. Validation via Zephr FormValidator patterns; errors in `red-500` #CA2B3D family (fills `red-50`, borders `red-200`), factual tone.

### 8.6 Front-page right-rail widgets (rendered DOM + pixel-verified)
| Widget | Surface | Key specs |
|---|---|---|
| **Watchlist promo** | white card, radius 8px | grey-50 icon well (radius 12px), 16px 600 pitch (*"Lag din egen watchlist - helt gratis."*), blue-500 pill CTA *"Opprett bruker"* |
| **Siste fra aksjeforumet** | white card | column headers `TICKER`/`TRÅD` label-2-style grey-500 uppercase; rows: colored circular ticker avatar (§3.3 avatar set) + thread title 14px 600 + timestamp 12px grey-500; footer link *"Vis mer"* + arrow |
| **Markedsnytt** | **`grey-800` #292E32** card | red live-dot + white 700 title; filter chips (active: white pill/dark text; inactive: outlined dark/grey text); items: timestamp • source (12px grey-400) + white 600 headline |
| **Hovedindeksen Oslo Børs** | white card | title 600 + change in product-green `#14985E` shown as `1.991,31 +0,2 (+0,01 %)`; Live dot; blue-500 line chart, hairline grid, right-edge axis labels; range chips `1D 5D 1M 6M 1Y` (active: blue-50 pill + blue-500 text) with per-range % in direction colors beneath |
| **Aksjeanalyse** | **`blue-800` #012E5B** card | white 700 title + dropdown pill (*"Aksje"*); image; timestamp 12px grey-300; white 600 headlines; footer link on blue |

---

## 9. Iconography & imagery
Icons: 16–24px, filled + outline mix, colored `grey-500`/`grey-400` (muted) or `blue-500` (interactive); market triangles ▲/▼ 16px from the site sprite; gain/rocket glyphs in `#14985E`. Ticker/forum avatars: colored circles from the avatar palette (§3.3) with white glyph/logo. Human avatars always circles. Brand assets (wordmark, K-ikon) served from Aptoma smooth-storage; production images resized via `imaginary.finansavisen.no/resize?width=…` — request originals from Hegnar, never redraw.
Editorial photography: executives, trading floors, companies, properties — documentary, uncropped-feeling, edge-to-edge in cards, no filters or overlays (skins provide the color, images stay clean). Portraits for opinion pieces: circular crop.

## 10. Motion
Purposeful only. Standard easing `cubic-bezier(0.4,0,0.2,1)`; 150ms (Zephr) / 250ms (MUI) interaction transitions, 300ms tab indicator, 2s skeleton shimmer, 26s linear ticker-strip marquee (pausable). No parallax or decorative animation. Respect `prefers-reduced-motion`.

## 11. Voice & microcopy (bokmål)
Direct financial Norwegian: *Logg inn · Kjøp · Abonner · Les mer · Se alle · Vis mer · Følg · Lag din egen portefølje · Opprett bruker · Legg til MittFa · Tips meg · Diskuter · Siste nytt · Mest omsatte · Vinnere / Tapere · Mest lest · Markedsnytt · Dagens aksjetips · kjøpte / solgte · Publisert 08:52 · Foto: · Bli abonnent fra 99 kr · Fortsett med e-post*. Headlines declarative, Hegnar-direct, often kicker + colon + payoff (*"Gamblet på Donald Trump: – Verdien er nå nesten halvert"* — note the quote-dash). Errors: fact + fix ("Kunne ikke laste kursene. Prøv igjen."). Everything sentence case.

## 12. Do / Don't
✅ Ticker strip (grey-900, 36px) above a blue-700 two-row header with 8px corner tabs · blue-500 as the only interactive color · ticker chips inline in text · skins for story types · dense front-page packing · kicker-colon headlines · Norwegian number formats · tabular numerals · Inter-first with Merriweather/PT Serif reserved for opinion & quotes · correct direction pair per context (§3.4)
❌ Red/green outside market meaning · #CA2B3D for breaking news or #E51E05 for market data · Title Case · decorative shadows/gradients · rounded images on the editorial front · new accent colors · unlabeled native ads · emoji in UI · 16px body text in product apps (it's 14) or 14px in articles (it's 18–20)

---

## 13. Mockup starter (copy-paste)

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Merriweather:ital,wght@0,400;0,700;1,400;1,700&family=PT+Serif:ital,wght@0,400;0,700;1,400&family=Playfair+Display:wght@400..900&display=swap" rel="stylesheet">
<style>
:root{
--blue-50:#E6F1FC;--blue-100:#CDE3F9;--blue-200:#9AC7F4;--blue-300:#68ABEE;--blue-400:#358FE9;
--blue-500:#0373E3;--blue-600:#025CB6;--blue-700:#024588;--blue-800:#012E5B;--blue-900:#01172D;
--light-blue:#EAF6FF;
--grey-25:#F8F9F9;--grey-50:#F1F2F3;--grey-75:#EAECED;--grey-100:#D5D9DC;--grey-200:#BABFC4;
--grey-300:#9EA6AD;--grey-400:#838C95;--grey-500:#67737E;--grey-600:#525C65;--grey-700:#3E454C;
--grey-800:#292E32;--grey-900:#151719;
--brand:#0073B8;--siste:#E51E05;--premium:#0A6482;--kapital-header:#C65815;--annonse:#8D8D8D;
--green-500:#19BE76;--red-500:#CA2B3D;--red-50:#F6DDE0;--red-100:#F4CACF;--red-400:#DD5F6E;
--up-widget:#14985E;--down-widget:#CA2B3D;--up-strip:#19BE76;--down-strip:#DD5F6E;
--up-feed:#16A34A;--down-feed:#DC2626;
--font-ui:"Inter",sans-serif;--font-opinion:"Merriweather",serif;--font-quote:"PT Serif",serif;
--ease:cubic-bezier(.4,0,.2,1);
}
body{background:var(--grey-25);color:var(--grey-900);font:400 14px/20px var(--font-ui);margin:0}
/* chrome */
.tickerbar{background:var(--grey-900);color:#fff;height:36px;display:flex;align-items:center;gap:24px;padding:0 24px;overflow:hidden;white-space:nowrap;font:500 12px/16px var(--font-ui)}
.tickerbar b{font-weight:600;margin-left:8px}
.tickerbar .up{color:var(--up-strip)} .tickerbar .down{color:var(--down-strip)}
.header{position:sticky;top:0;background:var(--blue-700);color:#fff;z-index:110}
.header-row1{height:72px;display:flex;align-items:center;gap:24px;padding:0 24px}
.header-row2{height:44px;display:flex;align-items:center;gap:24px;padding:0 24px;font:600 15px/20px var(--font-ui)}
.header-search{flex:1;max-width:560px;margin:0 auto;background:#01305f;border-radius:8px;height:36px;display:flex;align-items:center;padding:0 12px;color:#9ac7f4;font-size:13px}
.corner{width:8px;height:8px;position:absolute;top:100%;background:radial-gradient(circle at 100% 100%,transparent 8px,var(--blue-700) 8px)}
.corner.right{right:0;transform:scaleX(-1)}
.badge-ny{background:var(--siste);color:#fff;font:700 9px/1 var(--font-ui);text-transform:uppercase;border-radius:4px;padding:3px 4px;vertical-align:middle}
.btn-header-primary{background:var(--blue-500);color:#fff;border:0;border-radius:8px;padding:8px 16px;font:600 14px/20px var(--font-ui)}
.btn-header-light{background:#fff;color:var(--grey-900);border:0;border-radius:100px;padding:8px 16px;font:600 14px/20px var(--font-ui)}
.footer{background:var(--blue-700);color:#fff;padding:40px 24px;font-size:14px}
.footer a{color:var(--blue-200);text-decoration:none}
/* product layer */
.chip-ticker{display:inline-block;border-radius:100px;background:var(--blue-50);color:var(--blue-500);font:500 12px/16px var(--font-ui);padding:2px 8px;text-transform:uppercase}
.btn{border:0;border-radius:100px;height:32px;padding:8px 12px;background:var(--grey-50);color:var(--grey-900);font:500 12px/16px var(--font-ui);transition:background .15s var(--ease);cursor:pointer}
.btn:hover{background:var(--grey-100)} .btn:active{background:var(--blue-50);color:var(--blue-500)}
.btn-primary{background:var(--blue-500);color:#fff;border-radius:4px;padding:8px 16px;font-weight:600}
.btn-primary:hover{background:var(--blue-600)}
.tab{font:600 14px/16px var(--font-ui);color:var(--grey-500);padding:12px 16px;border-bottom:3px solid transparent}
.tab.active{color:var(--blue-500);border-color:var(--blue-500)}
.card{background:#fff;border-radius:8px;padding:16px}
.card-dark{background:var(--grey-800);color:#fff;border-radius:8px;padding:16px}
.card-analyse{background:var(--blue-800);color:#fff;border-radius:8px;padding:16px}
.table{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums}
.table th{font:600 12px/16px var(--font-ui);color:var(--grey-500);text-align:right;padding:8px}
.table td{padding:8px;text-align:right;border-top:1px solid var(--grey-75)}
.table th:first-child,.table td:first-child{text-align:left}
.up{color:var(--up-widget);font-weight:600} .down{color:var(--down-widget);font-weight:600}
.live-dot{width:16px;height:16px;border-radius:50%;background:var(--red-100);display:inline-grid;place-items:center}
.live-dot::after{content:"";width:8px;height:8px;border-radius:50%;background:var(--red-500)}
/* editorial layer */
.headline{font:700 clamp(24px,3.2vw,60px)/1.08 var(--font-ui);letter-spacing:-.01em}
.kicker{font:400 clamp(18px,1.8vw,26px)/1.3 var(--font-ui)}
.skin-featured{background:var(--blue-900);color:#fff} .skin-cover{background:var(--blue-700);color:#fff}
.skin-breaking{background:#000;color:#fff}
.skin-opinion .headline{font-family:var(--font-opinion)}
.byline{font:italic 400 18px/1.4 var(--font-ui);margin-top:8px}
.chip-tag{display:inline-block;border-radius:100px;background:var(--grey-50);color:var(--grey-900);font:500 12px/16px var(--font-ui);padding:4px 12px}
.badge-bar{display:inline-flex;align-items:center;background:var(--blue-700);color:#fff;height:28px;border-radius:2px;padding:0 10px;font:600 13px/1 var(--font-ui)}
.sticker-plus{width:28px;height:28px;border-radius:6px;background:var(--blue-500);color:#fff;display:grid;place-items:center;font:700 16px/1 var(--font-ui)}
.sticker-siste{display:inline-flex;align-items:center;gap:6px;background:var(--red-50);border-radius:100px;padding:4px 10px;color:#E93232;font:600 12px/16px var(--font-ui)}
.sticker-siste::before{content:"";width:8px;height:8px;border-radius:50%;background:#E93232}
/* article layer */
.article{background:#fff;max-width:980px;margin:0 auto;font:400 20px/1.6 var(--font-ui);color:#000}
.article .a-kicker{font:700 28px/1.2 var(--font-ui)}
.article h1{font:700 68px/76px var(--font-ui);margin:8px 0 16px}
.article .preamble{font:500 24px/32px var(--font-ui)}
.article a{color:inherit;text-decoration:underline}
.article ul li::before{content:"";display:inline-block;width:14px;height:15px;background:var(--blue-700);margin-right:6px;vertical-align:-2px}
.article ul{list-style:none;padding:0}
</style>
```

**Recipe:** chrome first (ticker strip → two-row header with corner tabs) → pick a layer (§1). If you add your own card/grid scaffolding CSS, keep the `.skin-*` rules *after* it in the cascade (or scope them `.your-card.skin-cover`) so skin backgrounds aren't overridden — white-on-white skins are the most common mockup bug. No emoji as icons (§12); use plain glyphs or neutral shapes. → real Norwegian content (tickers EQNR · DNB · AKER · NHY · TEL · ENVIP; verbs kjøpte/solgte; formats `10 087`, `206,5 K`, `+2,4 %`, `1.991,36`) → editorial: pack ≥6 stories with skins + kicker-colon headlines; product: tabs + white radius-8 cards on grey-25 + ticker chips + direction colors per §3.4; article: 980px white column per §7.5. Finish with the blue-700 footer.

---

## 14. Provenance & known gaps
v1.1 evidence: direct server HTML of front page, Siste, Børs, Bjellesauer, ticker EQNR, one free + one FA+ article; full `finansavisen-assets.css` (735KB), Zephr `tailwind`/`Typography`/`Button`/`ModalRendered`/`real-time-data-slider` CSS and `header`/`footer`/`real-time-data-slider` JS; JS-rendered DOM dump; 1440px & 390px screenshots with pixel sampling. v1.0 evidence: authenticated page-source captures of MittFa, Watchlist, Forum, Ticker ENVIP (product-app specifics in §8.1–8.5 carry over from those).

Remaining gaps (v1.2 targets): ⚠ exact "Siste"-pill red (Kilkaya third-party layer; family verified) · toggle-switch on-state color (off-state verified) · Børs SPA runtime MUI bundle (tabs/buttons carried from v1.0 captures — re-verify via DevTools computed styles when convenient) · official brand guidelines / Figma from Hegnar, if they exist — trumps all extraction, fold in and cite.

*Maintained by Profico for Hegnar Media / Finansavisen*
