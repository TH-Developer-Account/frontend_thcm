# Design system — how it works

**Define once. Consume everywhere. Override only when genuinely necessary.**

## Layers (dependency flows downward only)

| Layer | File(s) | Owns |
|---|---|---|
| Brand theme | `styles/themes/tata-hitachi.css` (default), `styles/themes/pink-violet.css` | The brand ramp `--color-brand-50…900`, `--color-brand-secondary-base/strong`, dark-mode brand tints. Nothing else. |
| Tier 1: primitives | `styles/color.css` (top), `styles/theme.css` | Raw palettes (`--color-orange-*`, `--color-neutral-*`, …), spacing, radius, shadows, sizes, motion, z-index |
| Tier 2: semantics | `styles/color.css` | Meaning: `--color-brand`, `--color-brand-solid`, `--color-text-*`, `--color-bg-*`, `--color-border-*`, `--color-input-*`, status, nav, table. Includes `[data-theme="dark"]` values |
| Tier 3: component | `styles/token.css`, plus `--button-radius` and `--input-radius` in `theme.css` | `--button-primary-*`, `--card-*`, `--field-*`, `--table-*`, `--sidebar-*`, … |
| Typography | `styles/typography.css` | Font scale, weights, `.form-label`, `.text-money`, `.text-metric` |
| Tailwind bridge | `styles/tailwind-bridge.css` | Utility classes that read the live tokens |
| Components | `styles/input.css`, `components.css`, `table.css`, `layout.css`, `ui.css` | How shared components look |
| Features | `modules/**.css` | Layout and composition only, scoped under a module class |

## Themes

There are two independent axes, both set on `<html>`:

```ts
document.documentElement.dataset.brand = "pink-violet"; // brand (default = Tata Hitachi)
document.documentElement.dataset.theme = "dark";        // light / dark (ThemeProvider)
```

Set the attributes on `<html>` only. Semantic tokens resolve at the root and portals inherit them.

### Add a new brand theme

1. Copy `themes/pink-violet.css` and rename the selector to `:root[data-brand="your-name"]`.
2. Map `--color-brand-50…900` and `--color-brand-secondary-base/strong`. Put any new raw colours under `--palette-*` names, never `--color-<tailwind-name>-*`.
3. Check contrast: white text on `brand-700` needs at least 4.5:1, and `brand-500` on white needs at least 3:1.
4. `@import` the file in `index.css` after `tata-hitachi.css`.

Do not edit any component or module to add a theme.

## Which brand token to use

| Need | Token | Tailwind |
|---|---|---|
| Accent line, rail, border, icon, focus ring | `--color-brand` | `bg-accent`, `border-accent` |
| Fill with white text (buttons, badges, active step) | `--color-brand-solid` | `bg-accent-solid text-on-accent-solid` |
| Brand-coloured text or link | `--color-text-brand`, `--color-text-link` | `text-accent-text` / `text-accent-700` |
| Tinted selected or active background | `--color-brand-subtle` | `bg-accent-subtle` / `bg-accent-50` |
| Secondary brand (black / violet) | `--color-brand-secondary` | `bg-accent-secondary` |

Never use `bg-orange-*`, `text-orange-*` or brand hex values in components or modules. Use `accent-*`.

## Changing things globally

- **Brand colours:** edit the theme file.
- **Button shape:** `--button-radius`. **Input shape:** `--input-radius`.
- **Control heights:** `--control-height-*` (theme.css).
- **Type scale:** `--font-size-*`. **Whole-app density:** `--root-font-size` (currently 70%).
- **Primary button colours:** `--button-primary-*` (token.css).
- **Card look:** `--card-border`, `--card-shadow`, `--card-radius`.
- **Active-field look:** `--field-border-focus`, `--field-focus-ring`, `--field-label-active`.

## Rules for feature CSS

- Scope every rule under a module root class (for example `.cpp-view-main …`).
- Do not redefine shared classes (`.form-*`, `.button-*`, `.ui-card*`, `.badge*`, `.data-table*`) at the top level of a module file.
- If two modules need the same pattern, promote it to `styles/components.css`.
- Use semantic tokens only. Raw colours belong in `color.css` and the theme files.

## Form fields

FormInput, SelectInput and TextareaInput share one label row and one message line (`components/forms/FieldParts.tsx`).

| Prop | Effect |
|---|---|
| `required` | Red asterisk plus native `required` |
| `optional` | Shows "(optional)". Pass a string to change the text. Ignored when `required` is set. |
| `helperText` + `isTooltip` (default `true`) | Info tooltip next to the label. With `isTooltip={false}` the text shows under the field. Screen readers announce it either way. |
| `warning` | Amber advisory under the field. Doesn't block submit. Hidden while an error is showing. |
| `error` | Red, blocking. Always wins over the warning and helper text. |

Errors after submit (react-hook-form):

```tsx
<form ref={formRef} noValidate onSubmit={handleSubmit(onValid, (errs) =>
  focusFirstInvalidField(formRef.current, errs, FIELD_ORDER))}>
  <FormValidationSummary
    errors={formState.errors}
    scopeRef={formRef}
    focusKey={formState.submitCount}
    fields={[{ name: "vendorCode", label: "Vendor code" }, …]}
  />
```

`focusFirstInvalidField`, `focusFieldByName` and `flattenFieldErrors` live in `utils/focusField.ts`.

## Read-only / view mode (Batch 5)

Every shared control (`FormInput`, `SelectInput`, `TextareaInput`, `PhoneInput`) renders `ReadOnlyField` in `mode="view"`, so one component styles every submitted-request screen.

**Read-only is not disabled.** Read-only = strong primary text (weight 500) on `--field-readonly-bg`. Disabled = grey surface, faded text, not-allowed cursor.

| Prop | Purpose |
|---|---|
| `emptyReason` | `not-provided` (default) · `not-applicable` · `unavailable` · `pending` ("Not yet calculated") · `error` ("Failed to load") · `loading` (skeleton). Never fake a 0 or N/A. `0` is a value and is shown. |
| `emptyValue` | Custom empty content (overrides the reason). |
| `values` | Several values as chips (plants, models). Wins over `value`. |
| `valueType` | `numeric` / `date` (tabular figures), `currency` (tabular + semibold, no wrap), `multiline` (grows, scrolls past `--field-readonly-multiline-max`). |
| `copyable` | Copy button. Pass a string to copy something other than the shown text. |
| `variant` | `boxed` (default) or `plain` (label over value, no box). |
| `fullWidth` | Span every column inside `ReadOnlyGrid`. |
| `showRequired` | The asterisk is an editing cue; view mode hides it unless this is set. `required` is still accepted. |

Shared inputs forward `emptyReadOnlyReason` → `emptyReason`. Their old `"--"` default is gone; empties now read "Not provided".

`ReadOnlyGrid columns={1|2|3|4} variant="plain|boxed"` renders a `<dl>` (fields become `<dt>/<dd>` pairs). It collapses to 2 columns below 1024px and 1 column below 640px. `ReadOnlyEmptyValue reason="…"` gives the same empty-state text for table cells.

Tokens: `--field-readonly-{bg,border,text,weight,empty,pending,error,chip-bg,chip-border,chip-text,multiline-max}`.

## Navigation & orientation (Batch 6)

Every screen should answer "where am I?" with brand accent + weight + an indicator mark, never colour alone.

| Component | What's new (all additive) |
|---|---|
| `StepProgress` | Per-step `status`: `upcoming · current · complete · invalid · skipped · disabled`. Default status still comes from `currentStep`; the component never invents completion. `description` per step. `showSummary` shows "Step 2 of 5 · Title" plus a needs-attention count (always on below 768px, where other labels hide). `onStepClick` makes complete, invalid and skipped steps clickable (`isStepClickable` overrides). Screen readers hear each step's state. Legacy `-done/-active/-wait` classes are kept. |
| `TabsBar` | Single mode is a real tablist: arrow keys, Home and End, one Tab stop. `TabItem.disabled`. Brand indicator by default (`color` still overrides). Inactive labels use secondary text (≥4.5:1). Visible focus. |
| `FilterTabs` | Inactive text secondary; soft active state semibold on the brand tint. |
| Breadcrumbs | Links in secondary text, brand + underline on hover; current page primary semibold; stronger separator. |
| `PageHeader` | `status` (badge beside the title) and `metaItems` (`{label, value}[]` rendered as a `<dl>`). Title semibold (`--page-header-title-weight`). |
| `SectionNav` (new) | "On this page" nav for long view pages: `items` with `count`, `status` (`complete · warning · invalid`), `Icon`, `disabled`; `sticky`; `aria-current`. Becomes a scrolling row below 768px. Not a stepper: submitted requests are not unfinished forms. |
| `Pagination` | Current page is solid brand (primary button colours). The page-size select is wide enough for "100". |
| Sidebar | A parent whose child is the current route gets `.app-sidebar-item-contains-active` (brand icon, semibold; tinted when collapsed). |

Tokens: `--step-dot-size`, `--step-ring-width`, `--step-current-ring`, `--step-current-text`, `--step-upcoming-border` (3.2:1), `--step-complete-bg` (`--color-success-solid`), `--step-invalid-{bg,border,text}`, `--page-header-title-weight`. Dark mode now overrides `--color-nav-text-active` (was 3.5:1).

## Tables (Batch 7)

`DataTable`, `SimpleViewTable` and `ManagementTable` now share the same `--table-*` tokens (header band, cell text, borders, footer, stripes).

**DataTable props (all optional):**

| Prop | Effect |
|---|---|
| `striped` | Alternate row tint (`--table-striped-bg`). |
| `density="compact"` | Shorter rows for dense financial grids. |
| `stickyFirstColumn` | First column stays put on horizontal scroll (with an edge shadow). |
| `showFooter` | `<tfoot>` from each column's `footer` (subtotals / grand totals). On automatically when any column defines `footer`. Sticky at the bottom, 2px rule, semibold. |
| `error` + `onRetry` | Replaces rows with a `role="alert"` message and a "Try again" button, so a failed request never reads as "No records found". |
| `emptyAction` | Button/link under the empty message. |

**`columnDef.meta` (`DataTableColumnMeta`):** `numeric` (right-aligned, tabular figures, no wrap), `emphasis` (primary text, medium weight), `truncate` (one line + full text on hover), `editable` (input surface, focus outline on the cell), plus the existing `align` / `headerClassName` / `cellClassName`.

**Fixes:** `aria-sort` only on sortable columns; grouped headers get their `colSpan`; empty footer rows from grouped headers are skipped.

**SimpleViewTable:** hardcoded slate classes replaced with `.simple-table-*` (tokenised, dark-mode aware). Right-aligned columns get tabular figures. Footer uses the totals style. Missing files read "No attachment". File/actions columns get default widths (they previously collapsed to 0px).

Tokens: `--table-cell-text`, `--table-footer-{bg,border,text}`, `--table-striped-bg`, `--table-editable-bg`, `--table-sticky-shadow`, `--table-truncate-max`.

## Feedback, status & business components (Batch 8)

**One status map: `components/common/status.ts`.** `resolveStatusTone(status)`, `resolveVariantTone(variant)`, `formatStatusLabel(status)`, `TONE_BADGE_CLASS`. Tones: `success · info · pending · warning · danger · neutral · brand`. Display only: it never changes status values or infers an overall status. Add new backend statuses here, nowhere else.

| Component | Change |
|---|---|
| `Badge` | One class from the map (it used to apply two competing ones). Unknown statuses are **neutral**, not amber. Draft is neutral. Recommended, Initiated and Resubmitted are info. New `withIcon`, `size="sm"`, `className`. No longer imports from the marketing module. |
| `Alert` | lucide icons instead of text glyphs; 3px tone rail; `description` accepts ReactNode; new `children` (e.g. a list of missing fields), `titleAs`, `className`, `id`. Icon/rail colours from `--feedback-*-fg` (≥4.8:1; raw amber was ~2:1). |
| `Toast` / `ToastProvider` | Container is a polite `aria-live` region (toasts were never announced); error toasts use `role="alert"`. lucide icons, tone rail, elevation, close button with a focus ring. |
| `AuditLogSection` | Events grouped by day (Today / Yesterday / date) with counts; larger text; no raw API error text, instead a friendly message with a **Try again** button; remarks truncate at 140 chars (was 50); tones use status tokens (`--color-danger` never existed). Labels: "Requested clarification", "Raised deviation". |
| `MetricCard` / `MetricGrid` (new) | Label → large tabular value → delta (`intent` decides the colour, not direction) → progress bar (amber ≥90%, red >100%, `role="progressbar"`) → description. `state` for loading / pending ("Not yet calculated") / error / unavailable: never a fake 0. |
| `WorkflowStageList` (new) | Stages with completed / current / pending / rejected / clarification / skipped; strategy chip (one after another · all in any order · any one); approvers with role, External / You tags, status text + icon, time, remarks; "Stage 2 of 3 · Waiting for …" summary and **Your action is needed**. Display only: modules map their own data. |

Tokens: `--feedback-rail-width`, `--feedback-{success,warning,error,info}-fg`.

## Dialogs, uploads, comments, empty states & override cleanup (Batch 9)

| Component | Change |
|---|---|
| `Modal` | Neutral close button (`.modal-close-button`; the orange icon button competed with the primary action). New `description` prop under the title, wired into `aria-describedby`. Title semibold, never below base size. Subtle entry motion (off with reduced motion). Focus trap, Esc and focus restore unchanged. `.modal-description` is secondary text (was muted). |
| `FileUploadField` | One tokenised style (was slate utilities + CSS on non-existent tokens with hex fallbacks), so it works in dark mode. The dropzone hint (`description`, e.g. "PDF, up to 5 MB") is visible; it was screen-reader-only. `has-error` gives a red border and tint. Removed `aria-hidden` from the focusable Preview button. Multi-file tiles are wider with actions on their own row. |
| `CommentsSection` | No raw API errors: a friendly load error with **Try again**; toasts read "Comment posted" / "Comment not posted. Your text is still in the box…". "You" tag on your own comments. |
| `CardEmpty` | Optional `action`; title/description only render when given; icon in a soft circle; description in secondary text at xs (was muted 2xs); dashed border. |

**Shared classes that modules restyled app-wide (now fixed):**

| Class | Was overridden in | Now |
|---|---|---|
| `.detail-label`, `.detail-value` | `bp.css` (for every screen) | Defined once in `typography.css` on the form-label/read-only tokens. |
| `.empty-state` | `bp.css` gave every empty state a dotted border | The dotted border applies to `.bp-address-empty-state` only. |
| `.bottom-buttons-bar-between`, `-end` | `vendor.styles.css` | Promoted to `ui.css`: wraps on desktop; below 640px stacks full width with the primary action on top. CPP, Medical, Workflow and BP forms get it too. |
| `.approval-decision-card*` | `activity-planner.styles.css` (but rendered by shared `ApprovalActionsBar`) | Moved to `ui.css`; eyebrow no longer uppercase brand-500 (3.3:1). |

Known layering issue, left as is: `components/ui/comments/comments.helper.ts` imports runtime helpers from `modules/workflows` (a shared component depending on a module).

## Remaining shared components (Batch 10)

| Component | Problem | Fix |
|---|---|---|
| `DatePickerInput` *(corrected after Batch 11: the app uses react-day-picker **v9**; class keys are now v9's: `month_caption`, `weekdays`/`weekday`, `day` = cell, `day_button` = button, state classes `today/selected/outside/range_*` on the cell → `.is-*`)* | Day cells 11px with overlapping numbers (Tailwind `h-3`/`text-[9px]` shrink with the 0.7 root). `react-day-picker/dist/style.css` was imported **unlayered**, overriding every design-system rule. Field label not tied to the trigger; no Esc. | Semantic `date-picker-*` classes (cells ~28px, today outlined, outside days dimmed, disabled struck through, solid selection/range ends, tinted range middle); library CSS no longer imported (`vhidden` → `sr-only`); `role="dialog"`, Esc closes and refocuses the field; trigger is `aria-labelledby` label + value with `aria-haspopup`/`aria-expanded`. |
| `Toggle` | 22×11px (Tailwind sizes), two conflicting `translate-x` classes, no visible keyboard focus, muted label. | CSS sizes `.toggle-sm/md/lg`, `role="switch"`, focus ring on the track, off track ≥3:1, label uses form-label tokens. |
| `ThreeWayToggle` | Desktop label rendered `option.shortLabel`: options without one showed icons only. | Renders `option.label`; option text xs (was 2xs). |
| `SectionHeader`, `SectionAccordion` | Chevrons reversed (down when open). | Open → up, closed → down. |
| `EditableCard` | Values/labels at a hardcoded `0.875rem` (~9.8px at the 0.7 root); muted labels. | Field label/value tokens, same as read-only fields. |
| `FilterDropdown`, user menu | 2xs uppercase muted section labels. | xs, sentence case, secondary text. |
| `NotificationBell`, `GeoCaptureButton` | Raw gray/red utilities and 7px text. | Semantic utilities (`text-fg*`, `border-line*`, `bg-surface*`, `text-danger-text`). |

Deferred to the module pass (undefined tokens in module CSS): `--color-surface` / `--color-surface-raised` (workflow.css, marketing.styles.css), `--color-text-warning` (user-profile.styles.css), `--shadow-modal` (vendor.styles.css).

## Final QA (Batch 11)

Automated, on the design-system playground (every shared component, real code):

| Check | Scope | Result |
|---|---|---|
| axe-core (WCAG 2.0/2.1/2.2 A + AA) | light/dark × Tata Hitachi/pink-violet, page at rest | 0 violations (was 9–14 per combo) |
| axe-core with overlays open | modal, calendar, filter dropdown, action menu, popover, form error state; light + dark | 0 violations |
| Token contrast matrix | 11 text tokens × 14 surfaces, control borders and indicators vs page/surface/input, solid fills vs their text; 4 combos | 0 pairs below 4.5:1 (text) / 3:1 (UI) |
| Keyboard walk | 123 Tab stops, screenshot diff focused vs unfocused, light + dark | 0 without a visible indicator (was 18) |
| Responsive | 375 / 768 / 1280: page overflow, elements outside the viewport, clipped controls | 0 / 0 / 0 |

**Fixes from QA**

- Brand colour as text: `.button-outline`, `.button-filter/.button-ghost` active, ThreeWayToggle active, action-menu outline hover, react-select selected option, sidebar active hover, management identity avatar, public-page link, home eyebrow/badge now use `--color-text-brand` (brand-active / brand-500 were 2.9–3.5:1 on dark tints, 3.3:1 on white).
- Solid semantic buttons use `--color-{error,success,warning}-solid[-hover]`: white text ≥5:1 in both themes (dark danger was 2.8:1, light warning 3.2:1, dark success ~1.9:1).
- Tokens: `--color-orange-700` → **#C2410C** (brief "primary strong"; text-brand 4.48 → 4.73:1 on the page bg, white on brand fill 5.18:1); new `--color-neutral-550` #58657a for tertiary text and placeholders (≥4.8:1 on every light surface); `--color-neutral-450` → #7a889d (control borders 3.3:1 on the page bg); dark placeholder #94a3b8; pink-violet dark `--color-brand-solid` #cf2470.
- Error-state placeholders use `--feedback-error-fg` at full opacity (were 65% red, 2.8:1).
- Focus: one `.button-base.button-base:focus-visible` rule at the end of the button section (variant rules were resetting box-shadow); accordion trigger ring; popover trigger ring.
- Semantics: Avatar `role="img"`; Popover clones native `<button>/<a>` triggers or wraps others in a focusable `role="button"`; FilterDropdown options use a visual box instead of a nested `<Checkbox>`; FileUploadField's hidden native input is out of the Tab order.
- SimpleViewTable: right-aligned figures never wrap.
- ThemeProvider: reads the stored theme on load (was always light) and applies it in a layout effect (no light flash).

Not covered by the playground (module pass): module CSS tokens listed under Batch 10, `workflow.css`/`bp.css` brand-as-text rules, and per-screen keyboard order.

## Batch 12 — Remaining shared components (focus, a11y, status map)

| Area | Change |
|---|---|
| Checkbox | Keyboard focus ring now visible (`input:focus-visible + .checkbox-enabled`); glow moved to `--checkbox-glow` CSS var. Batch 4 report said this was fixed — it was not. |
| Industrial button | Inset focus ring (outer ring was clipped by clip-path). |
| Table scroll regions | Focus-visible outline on management / data / simple tables (inset shadows hid under opaque cells). |
| Avatar group | Larger items, muted fill, ring, `role="group"`. |
| PendingOnStatus | Fixed Batch 8 regression: sentence now passed as `text`, real `status` drives the tone (amber again). Clearer +N aria-label. |
| NavigateButton | Shared `.navigate-button` class (no longer borrows module `.workflow-create-badge`). |
| FormHeader / NextStepsPanel | Undefined `text-iron*` classes replaced with tokens. |
| DateRangeSection | aria-label on a plain div replaced by sr-only text; shared label/pill overrides. |
| status.ts | 33 module statuses added (vendor, medical, EPC report, CRF order/stock, user). Tones inferred from names — confirm with business owners. Lead stages (HOT/WARM/COLD_ENQUIRY…) left neutral on purpose: they are categories, not progress states. |

## Batch 13 — App shell, auth & public pages, home

| Area | Change |
|---|---|
| Skip link (new `layout/SkipLink.tsx`) | First Tab stop on dashboard and home pages; jumps to `#main-content` (`MainLayout` / `HomeLayout` main now has that id + `tabIndex={-1}`). WCAG 2.4.1. |
| Auth layout | Card is now in normal flow, centred by auto margins; the page scrolls. It was absolutely centred in a fixed 100dvh box, so tall forms (reset password + policy) overlapped the logo/footer on laptop screens. Footer text 2xs → xs, fixed dark grey (the visual is light in both themes). |
| Login method tabs (new `containers/Login/components/AuthMethodTabs.tsx`) | Shared by staff and guest login. Proper ARIA tabs: roving tabindex, Arrow/Home/End, `tabpanel` linked to its tab. |
| Auth forms | Errors now also show inline (`.auth-form-error`, `role="alert"`) — toasts were the only message. Mobile helper is visible under the field and linked via aria-describedby. Page titles are `<h1>` (auth pages had none). Forgot-password result moves focus to its heading. Password rules announce "met / not met" in text. Description, tab, helper and rule text: muted → secondary. |
| FormInput `inputPrefix` | Was declared in the types but never rendered: "+91" never showed and leaked onto the input as `inputprefix="+91"`. Now rendered (`.form-input-prefix`, existing CSS) and read via aria-describedby. |
| Password show/hide button | 19.6px → 24px target (WCAG 2.5.8) — affects every password field. |
| User menu | Name is the button's accessible name; on mobile it is visually hidden instead of `display:none`. Avatar initials hidden from AT. Home header trigger had no focus indicator — fixed. Home avatar uses button orange (brand was 3.3:1 with white). |
| Home screen | `<h1>` added ("Module Selector"). Raw rem sizes rendered at 6–8px under the 0.7 root scale — moved to type tokens. Tile names no longer replaced by "Open X" aria-labels. Tile copy fixed (see below). |
| Full-screen loader | `role="status"`, decorative GIF hidden, stops cycling under reduced motion. |
| Session timeout | Alert is `warning` (was info) with clearer copy. |
| 403 page | Rebuilt on tokens (raw Tailwind greys broke in dark mode). |
| Public pages layout | Undefined `text-iron-dark` and hard-coded `bg-white` replaced with tokens. |

**Needs confirmation:** home tile descriptions were copied between modules (Vendor Onboarding described "dealer reimbursements", Medical Forms "machinery specs", Workflows "vendor registration"); rewritten to match each module, and "Committe" → "Committee". The 403 page's "Go to Dashboard" still links to `/dashboard` — check that route exists.

## Batch 14 — Home screen redesign

Files: `containers/HomeScreen/index.tsx`, `components/Card.tsx`, `constant.ts`, `styles/home.css`.

| Part | Notes |
|---|---|
| Date strip | Right-aligned date under the header. |
| Hero | Eyebrow, "Welcome back, <name>" (name in brand colour, from `useAuth().user`), intro line, module search. Diagonal brand washes use `color-mix` on `--color-brand`, so they follow the theme. |
| Hero image | `HOME_HERO_IMAGE_SRC` in `index.tsx` is intentionally `""`; set it to an imported asset. The slot is hidden while empty and under 768px; the left edge fades into the hero; `object-fit: contain` so the machine is never cropped. |
| Search | Filters visible modules by title + description; Esc / clear button resets; result count announced via a `role="status"` region; "no match" state with a clear action. |
| Module cards | `<ul>` of `<article>` cards: icon tile, `<h2>` title, optional badge, description, "Open Module" button (its `::after` makes the whole card clickable — one Tab stop per card), faded decorative icon (`decorIcon` in `constant.ts`). 3 / 2 / 1 columns at >1200 / >767 / mobile. |
| Badges | `badge` in `constant.ts` ("Frequently used", "Quick access") is **static**, not usage-based. |
| Header (home only) | 76px bar, larger logo, round 48px avatar, name in normal case, larger bell. |
| NotificationBell | Size moved from utility classes to `.notification-bell-trigger` (CSS vars `--notification-bell-size`, `--notification-bell-icon`) so layouts can resize it; `text-black` → `text-fg` (bell was invisible in dark mode). |
| Tokens | Added `--font-weight-bold: 700` (typography.css) and `--home-px` (1 design px independent of the 0.7 root scale). Old `.action-card*` styles removed. |
