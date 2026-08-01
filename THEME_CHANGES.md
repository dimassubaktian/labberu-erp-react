# Theme Changes — Emerald/Gold Rebrand

This app was re-themed from the shadcn/ui default grayscale palette to a
custom emerald-green + gold palette. This document records what changed,
where, and how to roll back or swap to a different palette later.

**Status at time of writing:** all changes below are uncommitted working-tree
changes on top of commit `d916732`. See [Rollback](#rollback) for both the
uncommitted and committed cases.

## Format

The project uses **Tailwind v4**, which has no `tailwind.config.js`. All
colors are CSS custom properties defined in `resources/css/app.css`, under
`@theme` (which maps `--color-*` → `--*`) and in `:root` / `.dark`.

Color format is **`oklch(L C H)`** — e.g. `oklch(0.471 0.095 159.839)`. Any
new palette must be converted to this format before pasting into `app.css`.

## Source palette (hex → oklch)

| Name | Hex | oklch |
|---|---|---|
| emerald-900 | `#0B2E1F` | `oklch(0.271 0.049 161.71)` |
| emerald-800 | `#124A32` | `oklch(0.366 0.071 160.779)` |
| emerald-600 | `#1B6B48` | `oklch(0.471 0.095 159.839)` |
| emerald-400 | `#2E8E63` | `oklch(0.579 0.112 160.103)` |
| emerald-200 *(derived, see note)* | `#89C2A6` | `oklch(0.767 0.072 162.808)` |
| emerald-100 | `#B7DCC7` | `oklch(0.862 0.049 160.331)` |
| emerald-50 | `#EAF3DE` | `oklch(0.952 0.029 125.962)` |
| gold-600 | `#C99A2E` | `oklch(0.712 0.131 83.673)` |
| gold-300 | `#E8C878` | `oklch(0.843 0.106 88.307)` |
| gold-50 | `#F7ECD3` | `oklch(0.945 0.035 87.076)` (unused, kept for reference) |
| ink (neutral) | `#1C1F1B` | `oklch(0.235 0.009 137.828)` |
| muted (neutral) | `#5B5F55` | `oklch(0.479 0.016 124.843)` |
| bg (neutral) | `#F4F2EA` | `oklch(0.96 0.011 95.164)` |
| teal (chart-3, light) | `#2C7A8C` | `oklch(0.54 0.079 215.973)` |
| teal (chart-3, dark) | `#57B3C4` | `oklch(0.717 0.09 211.267)` |
| neutral-light (chart-5, dark) | `#AFB0A7` | `oklch(0.754 0.013 111.839)` |

> **emerald-200 note:** the client's ramp only specified 50/100/400/600/800/900.
> `emerald-200` was derived by interpolating 1/3 of the way from emerald-100
> to emerald-400 in RGB space. It's used for dark-mode `muted-foreground`,
> `chart-4` (dark), and the light-mode table scrollbar thumb. If a future
> palette includes a real 200/300 step, replace this derived value with it.

`destructive` / `destructive-foreground` were **left untouched** (still the
original red) — status colors intentionally don't shift with the brand theme.

## Token mapping (current — emerald/gold)

### `:root` (light mode)

| Token | Value | Source |
|---|---|---|
| `background` | `oklch(0.96 0.011 95.164)` | bg |
| `foreground` | `oklch(0.235 0.009 137.828)` | ink |
| `card` / `popover` | `oklch(0.96 0.011 95.164)` | bg (same as background) |
| `card-foreground` / `popover-foreground` | `oklch(0.235 0.009 137.828)` | ink |
| `primary` | `oklch(0.471 0.095 159.839)` | emerald-600 |
| `primary-foreground` | `oklch(0.952 0.029 125.962)` | emerald-50 |
| `secondary` | `oklch(0.952 0.029 125.962)` | emerald-50 |
| `secondary-foreground` | `oklch(0.235 0.009 137.828)` | ink |
| `muted` | `oklch(0.952 0.029 125.962)` | emerald-50 |
| `muted-foreground` | `oklch(0.479 0.016 124.843)` | muted (neutral) |
| `accent` | `oklch(0.712 0.131 83.673)` | gold-600 |
| `accent-foreground` | `oklch(0.235 0.009 137.828)` | ink |
| `border` / `input` | `oklch(0.862 0.049 160.331)` | emerald-100 |
| `ring` | `oklch(0.579 0.112 160.103)` | emerald-400 |
| `chart-1` | `oklch(0.579 0.112 160.103)` | emerald-400 |
| `chart-2` | `oklch(0.712 0.131 83.673)` | gold-600 |
| `chart-3` | `oklch(0.54 0.079 215.973)` | teal |
| `chart-4` | `oklch(0.366 0.071 160.779)` | emerald-800 |
| `chart-5` | `oklch(0.479 0.016 124.843)` | muted (neutral) |
| `sidebar` | `oklch(0.271 0.049 161.71)` | emerald-900 |
| `sidebar-foreground` | `oklch(0.952 0.029 125.962)` | emerald-50 |
| `sidebar-primary` | `oklch(0.471 0.095 159.839)` | emerald-600 |
| `sidebar-primary-foreground` | `oklch(0.952 0.029 125.962)` | emerald-50 |
| `sidebar-accent` | `oklch(0.712 0.131 83.673)` | gold-600 |
| `sidebar-accent-foreground` | `oklch(0.235 0.009 137.828)` | ink |
| `sidebar-border` | `oklch(0.366 0.071 160.779)` | emerald-800 |
| `sidebar-ring` | `oklch(0.579 0.112 160.103)` | emerald-400 |

Note: **the sidebar is dark-toned in both light and dark mode by design**
(`sidebar` = emerald-900 in `:root` too) — it's a persistent dark surface,
not a themed-per-mode one.

### `.dark`

| Token | Value | Source |
|---|---|---|
| `background` | `oklch(0.271 0.049 161.71)` | emerald-900 |
| `foreground` | `oklch(0.952 0.029 125.962)` | emerald-50 |
| `card` / `popover` | `oklch(0.366 0.071 160.779)` | emerald-800 |
| `card-foreground` / `popover-foreground` | `oklch(0.952 0.029 125.962)` | emerald-50 |
| `primary` | `oklch(0.579 0.112 160.103)` | emerald-400 |
| `primary-foreground` | `oklch(0.271 0.049 161.71)` | emerald-900 |
| `secondary` | `oklch(0.366 0.071 160.779)` | emerald-800 |
| `secondary-foreground` | `oklch(0.952 0.029 125.962)` | emerald-50 |
| `muted` | `oklch(0.366 0.071 160.779)` | emerald-800 |
| `muted-foreground` | `oklch(0.767 0.072 162.808)` | emerald-200 (derived) |
| `accent` | `oklch(0.843 0.106 88.307)` | gold-300 |
| `accent-foreground` | `oklch(0.235 0.009 137.828)` | ink |
| `border` / `input` | `oklch(0.366 0.071 160.779)` | emerald-800 |
| `ring` | `oklch(0.579 0.112 160.103)` | emerald-400 |
| `chart-1` | `oklch(0.579 0.112 160.103)` | emerald-400 |
| `chart-2` | `oklch(0.712 0.131 83.673)` | gold-600 |
| `chart-3` | `oklch(0.717 0.09 211.267)` | teal (dark variant) |
| `chart-4` | `oklch(0.767 0.072 162.808)` | emerald-200 (derived) |
| `chart-5` | `oklch(0.754 0.013 111.839)` | neutral-light (derived) |
| `sidebar` | `oklch(0.271 0.049 161.71)` | emerald-900 |
| `sidebar-foreground` | `oklch(0.952 0.029 125.962)` | emerald-50 |
| `sidebar-primary` | `oklch(0.579 0.112 160.103)` | emerald-400 |
| `sidebar-primary-foreground` | `oklch(0.271 0.049 161.71)` | emerald-900 |
| `sidebar-accent` | `oklch(0.843 0.106 88.307)` | gold-300 |
| `sidebar-accent-foreground` | `oklch(0.235 0.009 137.828)` | ink |
| `sidebar-border` | `oklch(0.366 0.071 160.779)` | emerald-800 |
| `sidebar-ring` | `oklch(0.579 0.112 160.103)` | emerald-400 |

`chart-4`/`chart-5` (dark) use lighter derived tones instead of directly
reusing the light-mode source (emerald-800 / muted-neutral), because those
values are too close in lightness to the dark `background` (emerald-900) to
be visible as chart fills.

## Files touched

| File | What changed |
|---|---|
| `resources/css/app.css` | All color tokens in `:root` and `.dark` remapped to emerald/gold (see tables above). Added `.sidebar-scrollbar` and `.table-scrollbar` utility classes (see below). |
| `resources/js/app.tsx` | Inertia progress-bar color hardcoded at line ~33, changed from `#4B5563` (gray) to `#1B6B48` (emerald-600) to match the new `primary`. **Not a CSS var** — must be updated by hand on future palette changes. |
| `resources/js/components/nav-user.tsx` | Fixed a contrast bug: the sidebar user-menu trigger unconditionally applied `text-sidebar-accent-foreground` (ink), which is meant to sit on the gold hover background, not as a resting text color. Against the new dark emerald sidebar this made the user's name nearly unreadable. Changed to only apply `text-sidebar-accent-foreground` when the dropdown is open (`data-[state=open]:text-sidebar-accent-foreground`), so it falls back to the correct `sidebar-foreground` (emerald-50) the rest of the time. |
| `resources/js/components/ui/sidebar.tsx` | Added `sidebar-scrollbar` class to `SidebarContent`'s scroll container (the sidebar nav's vertical `overflow-auto` div). |
| `resources/js/components/ui/table.tsx` | Added `table-scrollbar` class to the shared `Table` component's `overflow-x-auto` wrapper (`data-slot="table-container"`). This is the single shared wrapper used by every data table in the app (Quotations, Projects, Customers, Vendors, Products, Taxes, Currencies, Workforces, Job Titles), so the fix propagates everywhere from one place. |

### Scrollbar utility classes (in `app.css`)

Two custom scrollbar styles were added — thin, borderless, rounded thumb, no
arrow buttons, using `scrollbar-width`/`scrollbar-color` (Firefox) and
`::-webkit-scrollbar*` (Chrome/Safari/Edge):

- **`.sidebar-scrollbar`** — vertical, 6px wide. Thumb: `var(--sidebar-border)`
  (emerald-800). Hover: `var(--sidebar-ring)` (emerald-400). Track:
  transparent. Applied only to the sidebar nav (the only vertical
  `overflow-auto` region in the app).
- **`.table-scrollbar`** — horizontal, 6px tall. Thumb: hardcoded
  `oklch(0.767 0.072 162.808)` (emerald-200, derived — **not a CSS var**,
  see gotcha below). Hover: `var(--ring)` (emerald-400). Track: transparent.
  Applied to the shared `Table` wrapper.

> **Gotcha for future palette swaps:** `.sidebar-scrollbar` colors reference
> CSS vars and will update automatically when `app.css` tokens change.
> `.table-scrollbar`'s thumb color is a **hardcoded oklch value**, not a var
> (there's no persisted `--emerald-200` token), so it must be updated by hand
> if the palette changes. Consider promoting it to a CSS var if this becomes
> a recurring pain point.

## Rollback

To roll back to the original shadcn/ui grayscale theme, edit the files by
hand as follows — no version-control commands needed:

1. **`resources/css/app.css`** — in `:root` and `.dark`, replace each color
   token's value with its original value from the table below.
2. **`resources/js/app.tsx`** — change the progress-bar `color` (around line
   33) back to `#4B5563`.
3. **`resources/js/components/nav-user.tsx`**, **`resources/js/components/ui/sidebar.tsx`**,
   **`resources/js/components/ui/table.tsx`** — these three files contain the
   scrollbar styling and the sidebar contrast fix, not palette values. They
   don't need to change for a plain rollback: the `.sidebar-scrollbar` /
   `.table-scrollbar` classes reference tokens (so they'll automatically
   follow the grayscale values once step 1 is done) and the contrast fix in
   `nav-user.tsx` is a correctness fix independent of which palette is
   active. Only touch these if you also want to remove the scrollbar styling
   or the contrast fix itself — see the [Files touched](#files-touched)
   table above for what to revert in each.

Original grayscale token values:

| Token | Original value (light) | Original value (dark) |
|---|---|---|
| `background` | `oklch(1 0 0)` | `oklch(0.145 0 0)` |
| `foreground` | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` |
| `card` / `popover` | `oklch(1 0 0)` | `oklch(0.145 0 0)` |
| `card-foreground` / `popover-foreground` | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` |
| `primary` | `oklch(0.205 0 0)` | `oklch(0.985 0 0)` |
| `primary-foreground` | `oklch(0.985 0 0)` | `oklch(0.205 0 0)` |
| `secondary` | `oklch(0.97 0 0)` | `oklch(0.269 0 0)` |
| `secondary-foreground` | `oklch(0.205 0 0)` | `oklch(0.985 0 0)` |
| `muted` | `oklch(0.97 0 0)` | `oklch(0.269 0 0)` |
| `muted-foreground` | `oklch(0.556 0 0)` | `oklch(0.708 0 0)` |
| `accent` | `oklch(0.97 0 0)` | `oklch(0.269 0 0)` |
| `accent-foreground` | `oklch(0.205 0 0)` | `oklch(0.985 0 0)` |
| `border` / `input` | `oklch(0.922 0 0)` | `oklch(0.269 0 0)` |
| `ring` | `oklch(0.87 0 0)` | `oklch(0.439 0 0)` |
| `chart-1` | `oklch(0.646 0.222 41.116)` | `oklch(0.488 0.243 264.376)` |
| `chart-2` | `oklch(0.6 0.118 184.704)` | `oklch(0.696 0.17 162.48)` |
| `chart-3` | `oklch(0.398 0.07 227.392)` | `oklch(0.769 0.188 70.08)` |
| `chart-4` | `oklch(0.828 0.189 84.429)` | `oklch(0.627 0.265 303.9)` |
| `chart-5` | `oklch(0.769 0.188 70.08)` | `oklch(0.645 0.246 16.439)` |
| `sidebar` | `oklch(0.985 0 0)` | `oklch(0.205 0 0)` |
| `sidebar-foreground` | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` |
| `sidebar-primary` | `oklch(0.205 0 0)` | `oklch(0.985 0 0)` |
| `sidebar-primary-foreground` | `oklch(0.985 0 0)` | `oklch(0.985 0 0)` |
| `sidebar-accent` | `oklch(0.97 0 0)` | `oklch(0.269 0 0)` |
| `sidebar-accent-foreground` | `oklch(0.205 0 0)` | `oklch(0.985 0 0)` |
| `sidebar-border` | `oklch(0.922 0 0)` | `oklch(0.269 0 0)` |
| `sidebar-ring` | `oklch(0.87 0 0)` | `oklch(0.439 0 0)` |

`destructive`, `destructive-foreground`, and `radius` never changed, so no
rollback needed for those.

Also revert `resources/js/app.tsx`'s progress color back to `#4B5563`.

## Switching to a different palette in the future

1. **Get the new palette as hex**, ideally as a ramp per brand color (e.g.
   `900/800/600/400/100/50` like this one), plus 2-3 neutrals (ink, muted
   text, background) and a couple of chart-only accent colors (a color for
   `chart-3` distinct from both the primary and accent hues, e.g. a teal or
   blue — don't make all 5 chart colors the same hue family).

2. **Convert hex → oklch.** This project's tokens are all `oklch(L C H)`.
   Use this Node snippet (Björn Ottosson's OKLab math) to convert:

   ```js
   function hexToRgb(hex) {
       const h = hex.replace('#', '');
       return [0, 2, 4].map((i) => parseInt(h.substring(i, i + 2), 16) / 255);
   }
   function srgbToLinear(c) {
       return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
   }
   function rgbToOklch([r, g, b]) {
       const [lr, lg, lb] = [r, g, b].map(srgbToLinear);
       const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
       const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
       const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;
       const [l_, m_, s_] = [Math.cbrt(l), Math.cbrt(m), Math.cbrt(s)];
       const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
       const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
       const b2 = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;
       const C = Math.sqrt(a * a + b2 * b2);
       let H = (Math.atan2(b2, a) * 180) / Math.PI;
       if (H < 0) H += 360;
       return [L, C, H];
   }
   ```
   Sanity-check the output: lightness (`L`) should stay monotonic — your
   darkest ramp step should have the lowest `L`, lightest the highest.

3. **Re-apply the same mapping rules used for this palette:**
   - `background`/`foreground` → your lightest neutral / darkest neutral (light), darkest brand / lightest neutral (dark)
   - `card`, `popover` → same as `background` (or one step off, for separation)
   - `primary` → a mid-dark brand step, `primary-foreground` → your lightest tint
   - `secondary` → a quiet, pale brand tint, not the accent color
   - `accent` → your accent color (used sparingly) — pick a step light enough to read against `accent-foreground`
   - `muted` → pale neutral, `muted-foreground` → your neutral mid-tone
   - `destructive` → leave alone unless explicitly asked to change
   - `border`/`input` → a pale brand tint; `ring` → a mid brand step
   - `chart-1..5` → 5 *visually distinct* colors — don't cluster them all in one hue
   - `sidebar-*` → mirror the main tokens; the sidebar is dark year-round in this app, so both `:root` and `.dark` should point `sidebar` at your darkest brand step
   - **Recheck contrast** everywhere `*-accent-foreground` gets used as a resting (non-hover) text color — see the `nav-user.tsx` bug above. If your new accent-foreground is dark and the surface it sits on by default is dark, you'll get the same invisible-text bug.

4. **Update the two hardcoded, non-token colors** that don't follow the CSS
   vars automatically:
   - `resources/js/app.tsx` progress-bar color (~line 33) → set to your new `primary` hex.
   - `.table-scrollbar` thumb color in `app.css` → set to a light tint of your new brand color (readable against a light/cream surface).

5. **Rebuild and eyeball it**: `npm run build` (or `npm run dev`), then check
   the sidebar (nav text, scrollbar, user-menu trigger), a data table
   (scrollbar), and light/dark mode toggling.
