# Design System

The viewer's visual language is **editorial / library** — a serif-led, calm reading surface rather than a generic SaaS dashboard. The aesthetic draws from Readwise, Are.na, and personal wikis (Maggie Appleton style).

## Typography

| Role | Family | Weight | Notes |
|---|---|---|---|
| Display / headings | Source Serif 4 | 500–600 | `tracking-tight`, optical sizing on |
| Body | Source Serif 4 | 400 | 17px, 1.75 line-height, max 68ch |
| UI chrome (sidebar, buttons, labels) | Inter | 400–600 | feature flags: cv11, ss01, ss03 |
| Code | JetBrains Mono | 400–500 | ligatures off for clarity |
| Metadata labels | Inter | 600 | `uppercase tracking-[0.15em]` micro-caps |

**Rule**: body copy and headings are serif; everything structural (sidebar, buttons, breadcrumbs, chips) is sans. This separation keeps the content area feeling like a book page and the chrome feeling like an app.

## Color — "ink" palette

Neutrals are warm (slight yellow-brown undertone), not cool gray. This avoids the sterile tech feel.

```
ink-50:  #f7f5f0   (light bg)
ink-100: #ebe6dc
ink-200: #d4ccba
ink-300: #b8ac93
ink-400: #998c72
ink-500: #7a6e58
ink-600: #5c5340
ink-700: #3e382b
ink-800: #26221b
ink-900: #14120d
ink-950: #0a0907   (dark bg)
```

Accent: `#c4634a` (terracotta / warm red). Used sparingly — active nav item, links, heading anchors, progress bar.

Proficiency badges use saturated gradients (red → amber → emerald → blue) but the rest of the interface stays in the ink palette.

## Layout

- **Sidebar**: fixed 288px (`w-72`). Never scrolls the whole page — only internal overflow.
- **Main column**: content capped at `max-w-3xl` (~48rem) with `px-8 lg:px-12` gutters. Reading measure is 68ch.
- **On-this-page**: fixed right rail, appears on `xl:` and above, only if ≥4 headings.
- **Vertical rhythm**: `mt-12 mb-4` for `h2` (with top border), `mt-8 mb-3` for `h3`. `my-6` for images, tables, code blocks. `my-4` for paragraphs.

## Animations

- `fade-in` (200ms ease-out) for route transitions and `<details>` body
- `slide-down` (300ms ease-out) for expanding sections
- Sidebar folder chevron: 200ms rotate
- Progress bar: `transition-[width] duration-150`

Never animate opacity on text (causes sub-pixel jitter). Always animate transform + filter where possible.

## `<details>` block styling

Distinct from other surfaces — used for foldable callouts (e.g., `Exam Traps` quotes from source warnings):

- Gradient border: soft ink tint when closed, accent tint with shadow when open
- Summary: custom `▸` marker rotating to `▾` on open (no default browser marker)
- Body: fades in on open (200ms)
- Background: subtle diagonal gradient to suggest "folded paper"

## Code blocks

- Shiki themes: `github-light` / `github-dark-dimmed` (matches theme toggle)
- Copy button: top-right, hidden until hover (`opacity-0 group-hover:opacity-100`)
- Corner radius: 8px (matches `<details>`, images)
- Inline code: ink-100 bg, 0.9em, `rounded px-1.5 py-0.5`

## Mermaid

- Auto re-renders on theme toggle via `MutationObserver` on `html.dark` class
- Container: matches code-block styling (neutral bg + border)
- Horizontal scroll on overflow

## Do not

- Don't use `bg-white` / `bg-gray-*` — always use `ink-*` for neutrals
- Don't add gradient overlays on the main content area (reserve gradients for dashboard cards + details blocks)
- Don't use emoji as primary UI (only in proficiency badges as secondary indicators)
- Don't make the sidebar scroll the page — it must have independent overflow

## When applying `frontend-design` skill

If further polishing is requested:

1. Keep the ink palette — accent only for interactive highlights
2. Preserve serif/sans split
3. Preserve fixed sidebar layout
4. Any new components should feel like printed matter, not web apps
