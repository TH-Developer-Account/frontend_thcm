# Design-system pass v2: how to apply

Copy into your repo (paths relative to `src/`):

| From this folder | To (your repo, under `src/`) |
|---|---|
| `index.css` | `index.css` |
| `styles/*.css` (color, theme, token, typography, globals, components, tailwind-bridge) | `styles/` |
| `modules/workflow.css` | `modules/workflows/utils/workflow.css` |
| `modules/bp.css` | `modules/admin/business-partners/bp.css` |
| `modules/marketing_styles.css` | `modules/marketing/marketing.styles.css` |
| `modules/vendor_styles.css` | `modules/vendorOnboarding/vendor.styles.css` |
| `modules/leads.css` | `modules/marketing/leads/styles/leads.css` |
| `modules/audit.css`, `modules/comments.css` | wherever they live today (not in `index.css`; imported by their components) |
| `components/*.tsx` | the matching component files (same names) |
| `scripts/*.mjs` | `scripts/` at repo root |

Not changed (already clean or nothing to fix): `user-profile.styles.css`, `master.styles.css`.
Both were verified to compile; `master` relies on the new `--color-bg-brand-soft` alias in `color.css`.

## package.json
```json
"scripts": {
  "check:colors": "node scripts/check-colors.mjs src"
}
```
Pre-commit (if you use husky + lint-staged):
```json
"lint-staged": { "src/**/*.{css,ts,tsx}": "node scripts/check-colors.mjs" }
```
CI: add a step `npm run check:colors` before the build.

## Phase 2 (later): lock the default Tailwind palette
Verified with Tailwind 4.3: this removes `bg-gray-50`, `bg-orange-500`, etc. so they generate nothing.
It must be written **directly in `index.css`** right after `@import "tailwindcss";`.
Putting it in a separate imported file does NOT work (the default palette stays).
```css
@import "tailwindcss";
@theme {
  --color-*: initial;
  --color-transparent: transparent;
  --color-current: currentColor;
  --color-inherit: inherit;
}
@theme inline {
  --color-white: var(--color-clean-white);
  --color-black: var(--color-machine-black);
}
```
Do this only when `npm run check:colors` reports no leaks across the WHOLE app
(vendorOnboarding, admin, marketing...), because every remaining `bg-gray-*` / `text-red-*`
will stop working.
