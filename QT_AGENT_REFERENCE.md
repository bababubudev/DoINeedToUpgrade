# DoINeedAnUpgrade — UI/UX, Functionality & Styling Reference

This document is a complete reference for recreating the "DoINeedAnUpgrade" web application as a Qt cross-platform desktop application. It covers every aspect of the user interface, user experience flows, visual design, and functional behavior.

---

## Table of Contents
1. [Project Purpose](#1-project-purpose)
2. [Color System & Themes](#2-color-system--themes)
3. [Typography & Font](#3-typography--font)
4. [Layout & Dimensions](#4-layout--dimensions)
5. [Custom Animations](#5-custom-animations)
6. [Component Reference](#6-component-reference)
7. [User Flows](#7-user-flows)
8. [Comparison & Verdict Logic](#8-comparison--verdict-logic)
9. [UI States & Feedback](#9-ui-states--feedback)
10. [Keyboard Shortcuts & Accessibility](#10-keyboard-shortcuts--accessibility)
11. [Data Sources & APIs](#11-data-sources--apis)
12. [Files That Contain Core Logic (Reusable)](#12-files-that-contain-core-logic-reusable)

---

## 1. Project Purpose

DoINeedAnUpgrade compares a user's hardware specs (CPU, GPU, RAM, Storage, OS) against a video game's system requirements. It fetches requirements from the Steam API, uses fuzzy matching against a known hardware database with performance scores, and produces a verdict: **pass**, **minimum**, **fail**, or **unknown**.

### Three ways specs are detected (priority order):
1. **URL params** (`?specs=base64`) — from the hardware scanner app
2. **localStorage** (`savedSpecs`) — from a previous session
3. **Browser detection** — WebGL for GPU, navigator APIs for OS/RAM (least accurate)

In the Qt version, you'll directly detect hardware on the user's machine, so options 1 and 3 become irrelevant. You'll always have accurate specs.

---

## 2. Color System & Themes

The app supports **light** and **dark** themes. The default is **dark**. Users toggle between them via a sun/moon button in the navbar.

### Color Tokens

| Token | Light Theme | Dark Theme | Usage |
|-------|-------------|------------|-------|
| `primary` | `#3B82F6` | `#60A5FA` | Buttons, active steps, links, main actions |
| `primary-content` | `#FFFFFF` | `#FFFFFF` | Text on primary backgrounds |
| `secondary` | `#6366F1` | `#818CF8` | Secondary actions (rarely used) |
| `accent` | `#0EA5E9` | `#38BDF8` | Accent highlights (rarely used) |
| `neutral` | `#1F2937` | `#374151` | Neutral backgrounds |
| `base-100` | `#FFFFFF` | `#242B33` | Card backgrounds, input backgrounds |
| `base-200` | `#F0F2F5` | `#1A1F26` | Page/window background |
| `base-300` | `#E5E7EB` | `#3B4451` | Borders, dividers |
| `base-content` | `#1A1D23` | `#E5E7EB` | Primary text color |
| `success` | `#22C55E` | `#4ADE80` | Pass verdict, success states |
| `warning` | `#F59E0B` | `#FBBF24` | Unknown/warn verdict, estimated fields |
| `error` | `#EF4444` | `#F87171` | Fail verdict, error states |
| `info` | `#3B82F6` | `#60A5FA` | Minimum verdict, informational alerts |

### Semantic Color Usage in Results

| Verdict | Banner Background | Banner Text | Table Cell Background |
|---------|-------------------|-------------|----------------------|
| Pass | `success` at 20% opacity | `success` | `success` at 30% opacity |
| Minimum | `info` at 20% opacity | `info` | (no special cell color) |
| Fail | `error` at 20% opacity | `error` | `error` at 30% opacity |
| Unknown/Warn | `warning` at 20% opacity | `warning` | `warning` at 30% opacity |

---

## 3. Typography & Font

- **Font family:** Montserrat (Google Font) — used globally on the entire app
- **Text rendering:** Antialiased
- **Key font weights used:**
  - `font-extrabold` (800) — Logo/title
  - `font-bold` (700) — Card titles, verdict text, section headers
  - `font-semibold` (600) — Component names in tables, sub-headers
  - `font-medium` (500) — Button text, labels
  - `font-light` (300) — Step labels in the wizard stepper
  - Normal (400) — Body text, form fields

---

## 4. Layout & Dimensions

### Window/Page Structure
```
+-------------------------------------------------------+
| NAVBAR (full width, base-100 bg, bottom border)       |
|  [Logo]                    [How It Works] [Download] [Theme] |
+-------------------------------------------------------+
|                                                       |
|   CONTENT AREA (centered, max-width 1024px)          |
|   padding: 16px horizontal, 24px vertical             |
|                                                       |
|   [Wizard Stepper - max-width 576px, centered]       |
|                                                       |
|   [Current Step Content]                              |
|                                                       |
+-------------------------------------------------------+
```

### Card Styling
All cards use:
- Background: `base-100`
- Border: 1px solid `base-300`
- Shadow: subtle drop shadow (small)
- Border radius: default rounded (8px)
- Padding: 24px (card body)

### Form Layout
- Fields arranged in a 2-column grid on screens >= 768px, single column below
- Field spacing: 16px gap
- Input fields have `base-300` borders and `base-100` backgrounds

---

## 5. Custom Animations

### Step Transition — fadeIn
Every wizard step fades in when it appears.
- Duration: 250ms
- Easing: ease-out
- Effect: Opacity 0→1 + translateY 8px→0 (slides up slightly while fading in)

### Toast Notifications — slide from right
**Slide in** (500ms, spring/bounce curve):
- Starts off-screen to the right
- Overshoots slightly left (-8px), bounces right (+4px), settles at 0
- Easing: `cubic-bezier(0.34, 1.56, 0.64, 1)`

**Slide out** (400ms, ease-in):
- Slides back off-screen to the right
- Slight leftward dip first (-8px) before exiting

### Other Micro-animations
- **Theme toggle:** Rotation animation when switching sun/moon icons
- **Chevron rotation:** 180-degree rotation on collapsible section toggles (smooth transition)
- **Verdict card hover:** Slight brightness decrease (brightness 95%) on hover

---

## 6. Component Reference

### 6.1 Navbar
Full-width bar at the top of the window.
- **Left:** App title "Do I Need An Upgrade?" — clickable, returns to home/start
- **Right (3 items):**
  1. **"How It Works" button** — opens a modal/dialog explaining the 3-step process
  2. **"Download Scanner" dropdown** — platform-aware download links (in the Qt app, this would be unnecessary since you ARE the scanner)
  3. **Theme toggle** — circular button with sun (light) / moon (dark) icon

### 6.2 Wizard Stepper
A horizontal 3-step progress indicator centered above the content.

```
  (1) Pick a Game  ——  (2) Your System  ——  (3) Results
```

- Steps that have been completed or are current are highlighted in `primary` color
- Completed steps are clickable (navigate back); future steps are not clickable
- Step indicator circles are slightly enlarged (scale 1.15) with bold font (weight 900)
- Step labels use `font-light` (300), `text-sm`
- Two step orderings exist depending on the mode (see User Flows section)

### 6.3 Game Search (Step: Pick a Game)
A card with a search input for finding Steam games.

- **Title:** "Search for a Game"
- **Input:** Text field with placeholder "Type a game name (e.g., Cyberpunk 2077)"
- **Behavior:** Debounced search (350ms delay after typing stops) queries the Steam API
- **Dropdown Results:**
  - Absolutely positioned below the input
  - Max height: 256px with scrolling
  - Each result row shows: small game thumbnail image (48px wide) + game name (truncated if long)
  - Keyboard navigation: Arrow Up/Down to highlight, Enter to select, Escape to close
  - Currently highlighted item has a `primary` color tint at 20% opacity
- **Loading state:** Small spinner inside the input field while searching
- **Footer hint:** Keyboard hint text `Enter → Select & continue`
- **Below the card:** A ghost/text button: "or enter requirements manually"

### 6.4 System Specs Form (Step: Your System)
A card showing the user's detected hardware with editable fields.

- **Title:** "Your System Specs"
- **Subtitle:** Shows where specs came from (e.g., "Detected via browser", "Imported from scanner")
- **Fields (5 total):**
  1. **OS** — Autocomplete text input (matches against known OS list)
  2. **CPU** — Autocomplete text input (matches against known CPU list)
  3. **GPU** — Autocomplete text input (matches against known GPU list)
  4. **RAM** — Number input (GB)
  5. **Storage** — Number input (GB)
- **Autocomplete behavior:**
  - Filters options by splitting input into tokens, all tokens must appear in the option (case-insensitive)
  - Shows top 10 matches in a dropdown (max-height 240px)
  - Click outside or press Escape to close
- **Estimated fields:** Auto-detected fields that may be inaccurate show an `*Estimated` label in warning color next to the field label
- **Loading state:** Each field shows a spinner during initial hardware detection

### 6.5 Hardware Scanner Section (Collapsible)
A collapsible card with header "Need more accurate detection?"

**Irrelevant for Qt version** — since the Qt app will detect hardware directly, you don't need this component. Including for completeness:
- Toggle chevron rotates on expand/collapse
- Contains download buttons, paste-from-clipboard, and manual text input
- Shows success/error feedback inline

### 6.6 Game Context Card
When a game has been selected, a small card appears above the specs form showing:
- Game header image (96px wide, rounded)
- Text: "Checking compatibility for"
- Game name in bold
- Background: `base-200` at 50% opacity, rounded

### 6.7 Results Page (Step: Results)

#### Game Header
- Game image (144px wide) alongside:
  - "Do I need an upgrade for" in `text-sm` muted text
  - Game name in `text-2xl font-bold`
  - Large decorative "?" watermark (`text-8xl`, `base-content` at 5% opacity, positioned right-side)

#### Platform Tabs
- Only shown when the game supports multiple platforms (Windows, macOS, Linux)
- Horizontal tab bar (boxed style)
- Active tab for user's own platform: filled primary color
- Active tab for a different platform: subtle `base-content` tint at 15%
- Info text appears below when viewing a platform that doesn't match the user's OS

#### Verdict Card
Color-coded banner that summarizes the result.

**Pass:**
- Background: `success` at 20% opacity
- Check-circle icon + "You're good to go -- no upgrade needed!"

**Minimum:**
- Background: `info` at 20% opacity
- Info icon + "It'll run, but an upgrade would make it smoother"
- Collapsible: "Show details" reveals a table of components that could be upgraded

**Fail:**
- Background: `error` at 20% opacity
- X-circle icon + "You'll need to upgrade your [components] to run this game"
- Collapsible: "Show details" reveals a table with:
  - Columns: Component | Your Current | Required
  - "Your Current" values in error/red color
  - "Required" values in success/green color

**Unknown:**
- Background: `warning` at 20% opacity
- Question-mark icon + "Not sure if you need an upgrade — take a look below"

#### Comparison Table (Component Breakdown)
A card with title "Component Breakdown" containing a responsive table.

| Column | Description |
|--------|-------------|
| Component | OS, CPU, GPU, RAM, Storage |
| Your System | User's spec value |
| Minimum | Game's minimum requirement |
| Recommended | Game's recommended requirement |

- Row background coloring by status:
  - Pass: `success` at 30% opacity
  - Fail: `error` at 30% opacity
  - Warn/Info: `warning` at 30% opacity
- Min/Rec columns: smaller text, truncated with tooltip on hover (max-width ~200px)
- **Legend** at bottom-right: small colored squares labeled "Pass", "Check", "Fail"

#### Requirements Editor (Hidden by Default)
Toggle button "Show Requirements Editor" with a chevron.

When shown:
- Two-column layout: "Minimum Requirements" and "Recommended Requirements"
- 5 fields each (OS, Processor, Graphics, Memory, Storage)
- CPU and GPU fields have autocomplete against the hardware database
- "Apply Changes" button re-runs the comparison
- "Clear All" button in the header

#### Action Buttons
Centered at the bottom:
- **"Check Another Game"** — primary filled button, returns to game search step
- **"Edit My Specs"** — outlined button, returns to specs step

---

## 7. User Flows

### 7.1 Normal Mode (Default)
Step order: **Pick a Game → Your System → Results**

1. User arrives at the app, sees the game search
2. Types a game name, selects from dropdown
3. App fetches game data from Steam, auto-detects the best platform
4. Advances to System Specs step with the game context shown
5. User reviews/edits their specs, clicks "Check Compatibility →"
6. Comparison runs, advances to Results
7. From Results, user can "Check Another Game" or "Edit My Specs"

### 7.2 Scanner Mode (Qt-Relevant)
Step order: **Your System → Pick a Game → Results**

In the web version, this activates when the URL contains `?specs=base64data`. In the Qt version, this is the **natural flow** since you always have the hardware detected:

1. User sees their detected specs first (pre-filled)
2. Reviews/edits, clicks "Continue →"
3. Searches for a game
4. On game selection, comparison runs immediately (specs already confirmed)
5. Results shown

### 7.3 Manual Mode
Available from the game search step via "or enter requirements manually":
- User fills in both their system specs AND the game requirements by hand
- No game image or Steam data — purely manual
- "Check Compatibility" button runs comparison

### 7.4 Navigation Rules
- Users can click completed wizard steps to go back
- They cannot click forward to unvisited steps
- The stepper tracks the maximum step reached (`maxReached`)
- Going back preserves all entered data

---

## 8. Comparison & Verdict Logic

### How Comparison Works
Each hardware component is compared independently:

1. **OS:** Checks platform match first (Windows vs macOS vs Linux). If platforms differ → warn. Then compares version ordering.
2. **CPU/GPU:** Fuzzy-matches user's hardware name against a database of known hardware with performance scores (10-100 scale). Compares scores.
3. **RAM:** Direct numeric comparison (GB).
4. **Storage:** Direct numeric comparison (GB).

### Fuzzy Matching Details
- Token-based: splits hardware names into tokens, strips spec patterns (clock speeds like "3.5GHz", core counts like "8-Core")
- Requires 60% token overlap to consider a match
- Special "series" handling: "GTX 600 series" matches GTX 650, GTX 660, etc.
- The hardware database is in `src/lib/hardwareData.ts`

### Verdict Computation
From the array of per-component comparison results:
- **Pass:** All components pass or are info-level
- **Fail:** Any component fails → lists failing components in the message
- **Minimum:** Meets minimum but not recommended
- **Unknown:** Can't determine (missing data, no match found)

### Verdict Messages
| Verdict | Title |
|---------|-------|
| Pass | "You're good to go -- no upgrade needed!" |
| Minimum | "It'll run, but an upgrade would make it smoother" |
| Fail | "You'll need to upgrade your [CPU, GPU, etc.] to run this game" |
| Unknown (with some passes) | "An upgrade probably isn't needed, but we can't say for sure" |
| Unknown (no data) | "Not sure if you need an upgrade -- take a look below" |

---

## 9. UI States & Feedback

| State | Visual | Location |
|-------|--------|----------|
| Hardware detecting | Spinner on each form field + "Detecting..." placeholder | System Specs form |
| Game search loading | Small spinner inside the search input | Game Search |
| Game data loading | Large animated loading bars, centered | Between steps |
| Game fetch error | Red error alert banner with message | Below search |
| Specs from previous session | Info toast slides in from top-right, auto-dismisses after 8s | Top-right corner |
| Specs imported from scanner | Success toast slides in from top-right, auto-dismisses after 5s | Top-right corner |
| Scanner paste success | Small toast at bottom-right | Bottom-right corner |
| Scanner paste error | Inline red text with exclamation icon | Scanner section |
| Estimated/guessed fields | Warning-colored `*Estimated` label next to field | Per-field |
| Mac guessed fields | Info alert banner listing estimated fields | Above specs form |
| Unmatched fields | Warning alert suggesting scanner download | Above specs form |
| Cross-platform viewing | Info text explaining platform mismatch | Below platform tabs |

---

## 10. Keyboard Shortcuts & Accessibility

- **Enter** on the System Specs step triggers "Check Compatibility" (unless focus is in a text input/textarea)
- **Enter** on number fields (RAM, Storage) triggers form submission
- **Arrow Up/Down** in game search navigates dropdown results
- **Enter** in game search selects the highlighted result
- **Escape** closes dropdowns
- **`<kbd>` hints** shown next to buttons: "Enter to continue", "Enter → Select & continue"
- All interactive elements have proper ARIA attributes (combobox, expanded, activedescendant, etc.)

---

## 11. Data Sources & APIs

These are the API endpoints the web app uses. The Qt app will need equivalent functionality:

| Endpoint | Purpose | Key Params |
|----------|---------|------------|
| `/api/search?q=gamename` | Search Steam games by name | `q` — search query |
| `/api/game?appid=12345` | Get game details + system requirements | `appid` — Steam app ID |
| `/api/benchmarks` | Get hardware lists and performance scores | None |

### Steam Data Structure
A game response includes:
- `name` — Game title
- `headerImage` — URL to the game's banner image (~460x215)
- `platforms` — Object: `{ windows: bool, mac: bool, linux: bool }`
- `requirements` — Per-platform objects with `minimum` and `recommended` HTML strings that get parsed into structured data (OS, Processor, Graphics, Memory, Storage)

### Hardware Database
`src/lib/hardwareData.ts` contains:
- **CPU list:** Array of `{ name: string, score: number }` (scores 10-100)
- **GPU list:** Array of `{ name: string, score: number }` (scores 10-100)
- **OS list:** Array of known OS version strings

This is the fuzzy-matching candidate pool. The Qt app should include this same data.

---

## 12. Files That Contain Core Logic (Reusable)

These TypeScript files contain the core comparison/matching logic that should be ported to C++/Qt:

| File | Purpose |
|------|---------|
| `src/lib/hardwareData.ts` | Static hardware database with performance scores |
| `src/lib/fuzzyMatch.ts` | Token-based fuzzy matching algorithm |
| `src/lib/compareSpecs.ts` | Per-component comparison logic |
| `src/lib/computeVerdict.ts` | Translates comparison results → verdict + human message |
| `src/lib/parseRequirements.ts` | Parses Steam HTML requirement strings into structured data |
| `src/lib/specs.ts` | Spec types, encoding/decoding, detection |

---

## Qt-Specific Recommendations

1. **Theme toggle:** Implement as a toggle in the toolbar or menu bar. Store preference in QSettings.
2. **Wizard flow:** Use a `QStackedWidget` with 3 pages, controlled by a custom stepper widget.
3. **Game search:** Use a `QLineEdit` with a `QCompleter` or custom popup `QListView` with debounced HTTP requests.
4. **Autocomplete inputs:** Same approach — `QLineEdit` + filtered `QStringListModel` + `QCompleter`.
5. **Comparison table:** `QTableWidget` or `QTableView` with custom delegate for cell coloring.
6. **Cards:** Use `QGroupBox` or `QFrame` with styled borders and backgrounds.
7. **Responsive layout:** Not needed for desktop — use fixed comfortable widths or sensible size policies.
8. **Hardware detection:** You already have the Go scanner code in `/scanner/` — port or call it from Qt.
9. **Toast notifications:** Use a custom overlay widget with animation (`QPropertyAnimation` on position/opacity).
10. **Color application:** Use `QPalette` or stylesheets. Consider defining all tokens in a central theme struct.
