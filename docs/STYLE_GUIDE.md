# Style Guide

Design system reference for the Do I Need An Upgrade application.

---

## Colors

### DaisyUI Theme Tokens

| Token            | Value     | Usage                        |
| ---------------- | --------- | ---------------------------- |
| `primary`        | `#3B82F6` | Buttons, links, focus rings  |
| `secondary`      | `#6366F1` | Accent actions               |
| `accent`         | `#0EA5E9` | Highlights, badges           |
| `neutral`        | `#1F2937` | Dark text on light surfaces  |
| `base-100`       | `#FFFFFF` | Card surfaces                |
| `base-200`       | `#F0F2F5` | Page background (blue-gray)  |
| `base-300`       | `#E5E7EB` | Borders, dividers            |
| `base-content`   | `#1A1D23` | Primary text                 |

### Semantic Status Colors

| Status    | Color       | Tailwind     | Usage                     |
| --------- | ----------- | ------------ | ------------------------- |
| Success   | `#22C55E`   | `success`    | PASS badge, green banner  |
| Warning   | `#F59E0B`   | `warning`    | CHECK badge, amber banner |
| Error     | `#EF4444`   | `error`      | FAIL badge, red banner    |
| Info      | `#3B82F6`   | `info`       | INFO badge                |

### Verdict Banner Backgrounds

| Verdict   | Background     | Border           |
| --------- | -------------- | ---------------- |
| pass      | `bg-green-50`  | `border-green-200` |
| minimum   | `bg-amber-50`  | `border-amber-200` |
| fail      | `bg-red-50`    | `border-red-200`   |
| unknown   | `bg-gray-50`   | `border-gray-200`  |

---

## Typography

- **Font**: System font stack via Tailwind defaults (antialiased rendering)
- **Headings**: `font-bold`, sizes via Tailwind (`text-4xl` for page title, `text-2xl` for game name, `text-lg` for card titles)
- **Body text**: Default size, `text-base-content`
- **Muted text**: `text-base-content/60` (60% opacity)
- **Small labels**: `text-xs` or `text-sm`

---

## Spacing

- **Page padding**: `px-4 py-8` on the container
- **Container max-width**: `max-w-5xl`
- **Card gaps**: `gap-6` between sibling cards in the main flex column
- **Grid gaps**: `gap-4` within card grids (form fields)
- **Card body padding**: DaisyUI default `card-body` padding

---

## Components

### Cards
- Background: `bg-base-100` (white)
- Shadow: `shadow-sm` (subtle)
- Border: `border border-gray-100` (applied via global component layer)
- Used for: SystemSpecs, GameSearch, RequirementsEditor, ComparisonResult

### Buttons
- Primary: `btn btn-primary`
- Outline: `btn btn-outline`
- Ghost: `btn btn-ghost btn-sm`

### Inputs
- Style: `input input-bordered`
- Global override: `border-gray-200 bg-white`

### Dropdown Menus
- Background: `bg-white`
- Border: `border border-gray-200`
- Shadow: `shadow-lg`
- Positioning: `absolute z-50`
- Max height with scroll: `max-h-60 overflow-y-auto` or `max-h-72`

### Status Badges
- DaisyUI badge component with size `badge-sm`
- `badge-success` for PASS
- `badge-error` for FAIL
- `badge-warning` for CHECK
- `badge-ghost` for INFO

### Verdict Banner
- Full-width rounded box with `border-2` and color-coded background
- Inline SVG icons (not emoji) sized at `w-8 h-8`
- Layout: icon left, text content right (`flex items-start gap-4`)
- Shows title, description, and optionally lists failed/warn components

---

## Global CSS Overrides

Applied in `globals.css` via Tailwind `@layer`:

```css
@layer base {
  body { @apply antialiased; }
}
@layer components {
  .card { @apply shadow-sm border border-gray-100; }
  .input-bordered { @apply border-gray-200 bg-white; }
}
```
