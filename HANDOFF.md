# Labberu ERP — Session Handoff

This document summarizes the work done in a previous session so a new conversation (now
moving to **Claude Code CLI**) can pick up where it left off. This file is not meant to be
permanent project documentation — feel free to delete it once you no longer need it.

## Project

Laravel 13 + Inertia v3 + React 19 starter kit (`laravel/react-starter-kit`), being turned
into "Labberu ERP" — an internal ERP system. Stack: Fortify (auth), Inertia React, Tailwind
v4, shadcn/ui-style components (hand-copied into `resources/js/components/ui/`, not managed
by the shadcn CLI), Pest for tests, Pint for formatting, Larastan for static analysis,
SQLite for the database. Laravel Boost MCP is configured — prefer its tools (`search-docs`,
`database-schema`, `database-query`, `browser-logs`, etc.) over manual equivalents.

## What's been done, roughly in order

1. **Removed the Laravel Passkeys feature** (Fortify's optional WebAuthn support) — config,
   routes, `User` model traits, frontend components, migration to drop the `passkeys` table.
2. **Rebranded** app name to "Lab beru ERP" (`.env` `APP_NAME`), replaced the Laravel logo
   icon (`app-logo-icon.tsx`) with a generic grid/modules icon, removed the default Laravel
   welcome page (`/` now redirects to `/login`), removed Repository/Documentation footer nav.
3. **Sidebar navigation mockup** (`resources/js/components/app-sidebar.tsx`) — built out the
   full planned menu structure (Sales & CRM, Purchase, Inventory, Finance, HR, System groups)
   as mostly-disabled placeholder items, wiring up real ones as modules got built.
   `NavMain` (`resources/js/components/nav-main.tsx`) supports grouped items with per-group
   labels and a `disabled` flag (renders a non-interactive, dimmed button instead of a link).
4. **RBAC**: installed `spatie/laravel-permission`, added `HasRoles` to `User`, registered
   `role`/`permission`/`role_or_permission` middleware aliases in `bootstrap/app.php` (needed
   manually since Laravel 11+ doesn't auto-register these like the old `Kernel.php` did). No
   actual roles/permissions are seeded or enforced anywhere yet — just the plumbing.
5. **Global UI fixes**: added a `cursor: pointer` / `cursor: not-allowed` base-layer rule in
   `resources/css/app.css` (Tailwind v4 resets buttons to `cursor: default` by default, which
   surprised the user).
6. **Ten full modules built end-to-end** (see list below), most following the identical
   CRUD pattern below; Quotations layers a status workflow and revisioning on top of it, and
   BOM (module 10) layers a nested grouping structure on top of that same pattern.
7. **Emerald/gold theme rebrand**: replaced the default shadcn/ui grayscale palette in
   `resources/css/app.css` with a client-provided emerald-green + gold palette (hex ramps
   converted to `oklch`, since Tailwind v4 has no `tailwind.config.js` — all tokens live as
   CSS custom properties in `app.css`). The sidebar is a persistently dark emerald surface in
   both light and dark mode by design. Also fixed two bugs the rebrand exposed: the sidebar
   user-menu trigger (`nav-user.tsx`) had unreadable text against the new dark sidebar (it was
   unconditionally applying `text-sidebar-accent-foreground`, meant only for the gold hover
   state, as its resting text color — fixed to apply only on `data-[state=open]`), and the
   sidebar nav + shared `Table` component's scroll containers still showed the unstyled
   browser scrollbar (added themed `.sidebar-scrollbar`/`.table-scrollbar` utility classes in
   `app.css`, applied in `sidebar.tsx`/`table.tsx`). **`THEME_CHANGES.md`** (repo root) is the
   reference doc for this: full token mapping table, which files were touched, how to roll
   back to grayscale by hand, and a step-by-step process (with a reusable hex→oklch conversion
   snippet) for swapping in a different client palette later — check it before touching colors.
8. **Removed self-registration** — since this is an internal ERP with superadmin-provisioned
   accounts, public signup was a liability, not a feature. Disabled `Features::registration()`
   in `config/fortify.php`, deleted `resources/js/pages/auth/register.tsx`, removed the "Sign
   up" link from `login.tsx`, regenerated Wayfinder. `RegistrationTest.php` self-skips via
   `skipUnlessFortifyHas()` rather than being deleted.
9. **Quotation "Details" card reorganized**: moved Overall tax, Overall discount type, and
   Overall discount value out of the Details card into their own "Tax & Discount" card placed
   directly above the Summary card, on both `create.tsx` and `edit.tsx` — user felt tax/
   discount belonged closer to the totals they affect.
10. **Bill of Materials (BOM) module** built — a new document type tied 1:1 to a specific
    `Quotation` revision (zero-or-one, optional), covering the actual materials needed to
    build what's being quoted, with its own internal costing separate from the customer-
    facing quotation price. See its own section below for the full design.
11. **Project Attachments** — file upload capability added to `Project` (deliberately *not*
    `Quotation`), for supporting documents (customer POs, drawings, etc.) that apply to the
    whole engagement rather than one specific quotation revision. See its own section below.

## The established CRUD pattern (repeat this for future modules)

For a model like `JobTitle`, `Workforce`, `Currency`:

- **Migration**: `id`, `uuid` (unique, used for route-model-binding — see below), business
  columns, `status` (plain string `active`/`inactive`, no enum class), `timestamps()`,
  `softDeletes()`. If a column needs to be unique *and* the table is soft-deletable, use a
  **partial unique index** scoped to `where deleted_at is null` via `DB::statement(...)` in
  the migration — see "Bugs fixed" below for why a plain `->unique()` breaks. If a numeric
  column has a DB `->default(...)`, do **not** also mark it `->nullable()` unless you truly
  want NULL to be a valid stored value — see the Products price/cost bug below.
- **Model**: `SoftDeletes` trait, `getRouteKeyName()` returns `'uuid'` (so all detail/edit/
  delete URLs use the UUID, not the sequential id), auto-generates `uuid` in a `booted()`
  `creating` hook, `#[Fillable([...])]` PHP attribute (not `protected $fillable`) — this is
  this project's established convention, matching the `User` model. **Every column set via
  `Model::create()`/`update()` must be listed here or it is silently dropped with no error**
  — this has caused real bugs (see below), so double-check this list whenever you add a
  column that gets mass-assigned.
- **FormRequest** per action (`{Model}StoreRequest`, `{Model}UpdateRequest`) — `authorize()`
  returns `true` by default, or encodes a business-rule guard (e.g. "can only edit while
  status is draft") when one exists. **`authorize()` runs before `rules()` and before the
  controller method** — any guard that must produce a 403 rather than a validation-error
  redirect belongs in `authorize()`, not in the controller body. Rules use
  `Rule::unique(...)->whereNull('deleted_at')` (and `->ignore($model->id)` on update) to
  match the partial index.
- **Controller**: one method per action (`index`, `create`, `store`, `show`, `edit`, `update`,
  `destroy`, plus extra actions like `updateStatus`/`storeRevision` for Quotations), NOT a
  resource controller class — built up incrementally, one HTTP verb/page at a time, in the
  order the user asked for them. `Inertia::flash('toast', ['type' => ..., 'message' => ...])`
  on every mutating action (success or error), then `to_route(...)`.
- **Routes** in `routes/web.php` inside the existing `auth`+`verified` group. Static segments
  (like `/create`) MUST be registered before the `{model}` wildcard route or Laravel will try
  to match "create" as the route-model-bound parameter.
- **Wayfinder**: after adding routes, run `php artisan wayfinder:generate --with-form` to
  regenerate `resources/js/actions/` and `resources/js/routes/` — frontend pages import route
  helpers from `@/routes/{model-plural}` (e.g. `import { show, edit } from '@/routes/job-titles'`).
  Nested action routes generate nested modules, e.g. `@/routes/quotations/status` and
  `@/routes/quotations/revisions`.
- **Pages** in `resources/js/pages/{model-plural}/`:
  - `index.tsx` — table (shadcn-style `Table` component), pagination nav using Laravel's
    paginator shape (typed as `Paginated<T>` in `resources/js/types/pagination.ts`), "New X"
    button (only added once the create page exists — don't link to routes that don't exist
    yet), row values link to the detail page (only once the show page exists).
  - `create.tsx` / `edit.tsx` — `<Form>` from `@inertiajs/react` with the wayfinder
    `.form()` helper spread onto it, `Select` fields use local `useState` + a hidden
    `<input type="hidden">` synced to it (Radix Select isn't a native form control, so
    Inertia's FormData-based `<Form>` needs the hidden input to pick up the value).
  - `show.tsx` — Details `Card` with a `dl`/`dt`/`dd` grid (1 col mobile, 2 cols `sm:` up),
    "Back to X" button (always `variant="destructive"`, i.e. red — a user preference stated
    explicitly), "Edit X" button (full noun, not just "Edit") once edit exists, and a
    "Danger Zone" `Card` (red-tinted warning box + a `Dialog`-based delete confirmation) once
    delete exists. For related-record lists (e.g. Projects → Quotations, Customers →
    Projects), use a clickable card-list (not a table) inside its own `Card`.
  - Status badges: always use `.replaceAll('_', ' ')`, never `.replace(...)` (which only
    replaces the first match — bit us once multi-word statuses became reachable).
  - Confirmation modals: every destructive or state-changing workflow action (submit for
    approval, approve, reject, cancel, void, delete) gets its own `Dialog` with a specific
    title/description, not a generic "are you sure?". Destructive-outcome buttons (cancel,
    reject, void, delete) use `variant="destructive"` (red) — explicit user preference.
  - Breadcrumbs: pages with **static** breadcrumbs use `PageComponent.layout = { breadcrumbs:
    [...] }`; pages needing **per-record** breadcrumbs (detail/edit pages, since they need the
    record's name) call `setLayoutProps({ breadcrumbs: [...] })` from `@inertiajs/react`
    *inside* the component body — this is an Inertia v3 feature, don't try to fake it with a
    static assignment since that has no access to props.
  - `<input type="date">` needs exactly `YYYY-MM-DD` — if a backend datetime column is
    serialized as a full ISO string, `.slice(0, 10)` it before using it as `defaultValue`.
- **Tests**: `tests/Feature/{ModelPlural}/{Action}Test.php` (e.g. `tests/Feature/JobTitles/
  StoreTest.php`), using Pest. Cover: page renders with correct Inertia props, successful
  mutation + redirect + `assertDatabaseHas`, full validation rule matrix, soft-deleted-record-
  name-reuse (see bug below), guest redirect to login. For bug reports, prefer a regression
  test that reproduces the **actual** request shape the browser sends (e.g. blank form
  fields submit as empty strings, not omitted keys — a prior test that omitted keys entirely
  passed while the real bug still reproduced).
- **Verification suite — run after every single change, no exceptions**: `php artisan test
  --compact --filter={Module}`, `vendor/bin/pint --dirty --format agent`,
  `composer types:check` (Larastan), `npm run types:check` (tsc), `npm run lint:check`
  (eslint), `npm run format:check` (prettier — auto-fix with `npx prettier --write <file>` if
  it flags something, then re-check). All six must pass before considering a task done.
- **Live browser verification**: for anything UI-observable, actually click through it in the
  browser (dev server runs via `composer run dev`, `http://localhost:8080`) rather than just
  trusting the test suite — several bugs in this project (date input population, revision
  button visibility) were only caught this way.
- **Interview first**: for any feature with non-obvious business rules (approval workflow,
  revisioning, delete semantics), ask the user via multiple-choice questions with a
  recommended default before writing code, rather than guessing.

## Modules built so far (in this order)

1. **Job Titles** (`job_titles`) — `name`, `status`. Full CRUD. Has a `workforces()`
   hasMany relation used on its detail page to list assigned employees, and a real delete
   restriction: blocks deletion if any workforce member is assigned to it.
2. **Workforces** (`workforces`) — `employee_code` (auto-generated `LAB-EMP-001`, never
   reused even after soft-delete), `full_name`, `email`, `phone`/`address` (nullable),
   `job_title_id` (FK), `gender`, `photo` (nullable), `status`. Full CRUD, plus photo upload
   on the **private** `local` disk served via an authenticated route, cache-busted with
   `?v={updated_at}`, live preview via `URL.createObjectURL`.
3. **Currencies** (`currencies`) — `iso_code` (normalized uppercase, 3 letters), `name`,
   `symbol` (nullable), `status`. Full CRUD, no relations.
4. **Taxes** — percentage/fixed tax rates used by Quotations.
5. **Customers** — used by Projects (project → customer) and Quotations' code generation.
6. **Vendors** — Purchase-side master data (no dependent modules built on it yet).
7. **Products** (`products`) — `product_code` (auto `LAB-PRODUCT-001`), `reference_number`,
   `descriptions`, `brand`/`unit` (fixed enum-style string lists, validated via `Rule::in`),
   `type` (`goods`/`service`), `price`/`cost` (decimal, **optional in the UI but stored as
   `0`, never `null`** — see bug below), `status`. Full CRUD, used as the line-item source
   in Quotations.
8. **Projects** (`projects`) — `project_code` (auto `LAB-{yy}{mm}{seq}-{CustomerCode}`),
   `customer_id`, `person_in_charge_id` (Workforce), dates, status/priority, cost/value
   fields. Full CRUD. Detail page now includes a **Quotations** card
   (`project->quotations()` hasMany) listing every quotation across all revision threads for
   that project — code, version, "(current)" tag, valid-until, total, status badge, linking
   to each quotation's detail page. Also has an **Attachments** card (`project_attachments`)
   for supporting documents — see "Project Attachments" section below.
9. **Quotations** (`quotations` + `quotation_items` + `quotation_groups`) — the most
   complex module. See its own section below.
10. **Bill of Materials (BOM)** (`boms` + `bom_groups` + `bom_subgroups` + `bom_items`) — a
    zero-or-one child of a `Quotation` (specific revision, not the thread), reachable only via
    a "Bill of Materials" card on the quotation's detail page — no standalone index page or
    sidebar entry. Own `create`/`edit`/`show` pages, **no `destroy` yet** (known gap). See its
    own section below for the cost model and grouping structure.

## Quotations — status workflow, revisioning, line items, groups

Belongs to a `Project` (immutable after creation — the code is derived from it), has a
`Currency`, an optional `Tax`, discount type/value, `valid_until` (auto-defaults to 7 days
from today on create), free-text `remarks`, and many `QuotationItem`s (product, qty, unit
price/cost, per-item discount, free-text `description` — totals/margins recalculated
server-side on every store/update, never trusted from the client).

**Line item descriptions**: `quotation_items.description` (nullable text). Selecting a
product auto-fills it from that product's own `descriptions` column (same pattern as
unit/price/cost auto-fill), but it's a plain editable textarea afterward — lets a quote
carry custom wording per line without touching the master product record. Shown as muted
secondary text under the product name on the detail page.

**Item groups** (`quotation_groups` + `quotation_items.quotation_group_id` nullable FK):
lets a quotation organize its line items into free-typed sections (e.g. "Labor",
"Materials") — the group name is a plain text input, not a predefined/managed list. Each
group has its **own** `discount_type`/`discount_value`, optional `tax_id`, and computed
`subtotal`/`discount_amount`/`tax_amount`/`total`, calculated with the exact same
`calculateDiscountAmount`/`calculateTaxAmount` helpers the header already used. Items may
be grouped or left ungrouped (mixed is allowed) — ungrouped items roll straight into the
header total with no group-level subtotal/tax of their own.

**Two-layer total calculation** (confirmed explicitly with the user, don't second-guess
this): the quotation header's *existing* discount/tax fields still apply, but now on top
of `sum(all group totals) + sum(ungrouped item totals)` rather than directly on the raw
item sum. So `quotation.subtotal` changed meaning — it's now the sum of (already
tax/discount-adjusted) group totals plus ungrouped item totals, *before* the header's own
discount/tax is applied to produce `quotation.total`. Controller logic lives in
`QuotationController::syncGroupsAndItems()`/`calculateGroup()` — reused by both `store()`
and `update()` (which does `$quotation->items()->delete(); $quotation->groups()->delete();`
then rebuilds both from scratch, same wipe-and-recreate pattern the original item-only
version used). `storeRevision()` deep-copies groups and their items into the new revision.

**Store/Update request payload shape**: `items[]` for ungrouped items (top-level, same as
before) plus a sibling `groups[]` array, each group carrying its own nested `items[]` —
groups are *not* referenced by items via a foreign key in the payload, they're nested,
which avoids fragile index-matching between separately-submitted arrays. A custom
`withValidator()` rule requires at least one item somewhere (ungrouped or inside any
group) since `items` alone can no longer be `required`.

**Frontend structure** (`create.tsx`/`edit.tsx`): a shared in-file `LineItemFields`
component (duplicated per-file, matching this project's established create/edit
duplication convention) renders one line item's fields and is reused for both the
ungrouped-items list and every group's item list — avoids tripling the form markup. Each
group is its own `Card` with a free-text name input, discount type/value selects, a tax
select, its own nested item list, and a per-group subtotal/discount/tax/total `dl`. The
"Add line" button appears **both** at the top of each item list (in the card header) and
again after the last item — added after the user found scrolling back to the top button
annoying once a list got long. "Add line" and "Add group" both use the default (solid)
`Button` variant, not outline, per explicit user request. Each line-item box gets
`bg-muted/40` so it visually separates from its parent group/ungrouped `Card` (same
`bg-card` color otherwise made them blend together — another explicit user complaint).
The "Ungrouped items" card is omitted entirely from `show.tsx` when there are no ungrouped
items, rather than rendering an empty-state message.

**Code scheme**: `LAB-Q{YY}{MM}{project's NNN}-{thread# 2-digit}-{CustomerCode}`, generated
in `Quotation::booted()`'s `creating()` hook. All revisions in a thread share the root's
`quotation_code` and `thread_number`.

**Status workflow**: `draft` → `request_for_approval` → `approved`/`rejected`, plus
`cancelled` (from `draft` or `request_for_approval`) and `voided` (from `approved`). Modeled
via `Quotation::TRANSITIONS` (private const array) and `Quotation::allowedNextStatuses(
string $status): array`, mirrored on the frontend in `show.tsx`'s `statusActions()` for
button rendering — backend (`QuotationStatusUpdateRequest` + `Rule::in()`) is authoritative.
Approving sets `approved_by`/`approved_at` to the acting user/now.

**Revisioning**: `root_quotation_id` (self-FK, null on the root), `version_major`/
`version_minor` (user picks "major" — customer-requested — or "minor" — internal — when
creating a revision), `is_current` (**exactly one row per thread must be `true` at all
times** — this invariant was violated by a real production bug, see below), `thread_number`.
A revision can only be created from a quotation that is both **not** `draft` and **is**
`is_current` — enforced in `QuotationRevisionRequest::authorize()` and mirrored in
`show.tsx`'s "Create Revision" button visibility. Revision History is shown as a card-list
on the detail page (only rendered when the thread has more than one version).

**Delete**: draft-only, and blocked if the quotation has any other revisions in its thread
(root or otherwise) — "Danger Zone" card only renders when both conditions hold.

**Line items table**: has a "No" column (1-indexed row number) for quick counting.

## Bill of Materials (BOM) — cost tiers, groups, phase subgroups

Entry point is a "Bill of Materials" card on the quotation's `show.tsx` — "Create BOM" only
shown when `quotation.status === 'draft'` and no BOM exists yet; once created, shows a cost
summary + "View"/"Edit Bill of Materials" links (edit only while draft). No separate sidebar
nav entry — BOM is always reached through its parent quotation.

**Four-tier cost chain**, computed server-side on every store/update, never trusted from the
client (`BomController::syncGroupsAndItems()`):
- `main_cost` — sum of every `bom_item.total_cost` across ungrouped items, top-level phase
  subgroups, and every hardware group (direct items + that group's own subgroups).
- `overhead_cost` — `main_cost × overhead_percentage / 100` (additive: overhead is added on
  top of main cost to produce `total_cost`).
- `total_cost` — `main_cost + overhead_cost`.
- `selling_cost` — `total_cost × selling_percentage / 100`. **This is a direct multiplier, not
  an additive markup** — a user enters `110` to mean "sell at 110% of Total Cost" (a 10%
  markup), not `10`. This was an explicit correction from the client's original ask; don't
  "fix" it back to `total_cost + total_cost × pct / 100`.

**Line item discount** (`BomController::applyDiscount()`) is *also* a direct multiplier for
percentage type: `total_cost = line_total × discount_value / 100`, so `90` means "keep 90% of
cost" (a 10% discount). This is **different from `Quotation`'s own item discount**, which
stays subtractive (`line_total - line_total × value / 100`) — the two were deliberately given
different semantics per explicit client correction; do not unify them. Fixed-amount discount
on BOM items is a flat subtraction capped at zero, same as everywhere else.

**Grouping — two levels, both optional and combinable**: `BomGroup` represents a piece of
hardware being built (e.g. "Control Panel"), with its own stored `subtotal`. `BomSubgroup`
represents a phase (e.g. "Q1", "Q2" — free text, not a managed list) and can be nested either
under a `BomGroup` (`bom_group_id` set — "this hardware's Q1 materials") or directly under the
`Bom` itself (`bom_group_id` null — "materials for Q1, not tied to specific hardware"). A
`BomItem` can therefore be: fully ungrouped, directly in a group, directly in a top-level
subgroup, or inside a subgroup nested under a group. **Rule**: if `bom_item.bom_subgroup_id`
is set, `bom_group_id` stays null on that item — its group (if any) is inferred via
`subgroup.bom_group_id`, not duplicated onto the item. `BomGroup::items()` and
`Bom::subgroups()`/`BomGroup::subgroups()` rely on this being consistent.

**Store/update payload shape** mirrors Quotation's groups pattern one level deeper: top-level
`items[]` (ungrouped) + top-level `subgroups[]` (phase-only) + `groups[]` where each group has
its own `items[]` (direct) and `subgroups[]` (nested phases). A group is valid if it has
materials *either* directly or inside any of its subgroups (`BomStoreRequest::groupHasItems()`)
— a group with neither is rejected. `syncGroupsAndItems()`/`createItems()`/`createSubgroup()`
build this bottom-up, same wipe-and-recreate pattern `update()` already used for items/groups.

**Revision handling**: BOM — including its groups, subgroups, and items — is deep-copied into
a new quotation revision when one exists on the source quotation
(`QuotationController::storeRevision()` → `copyBomSubgroup()`), same "own copy per revision"
treatment as quotation items/groups. This is deliberately different from Project Attachments
(below), which are *not* copied — BOM represents priced/planned content that needs an accurate
historical snapshot per revision; attachments are reference material that doesn't.

**No delete yet** — `BomController` has `create`/`store`/`show`/`edit`/`update` only, no
`destroy`. A user who creates a BOM by mistake can edit it down to empty but can't remove the
record. Known gap, not yet requested to be built.

## Project Attachments — supporting documents, not tied to quotation revisions

Deliberately attached to `Project`, not `Quotation`. Two reasons this shape was chosen over
attaching to a quotation (discussed and decided explicitly, don't re-litigate without cause):
1. A project's supporting documents (customer PO, site survey, drawings) are usually about the
   whole engagement, not one specific quotation negotiation — and a project already aggregates
   every quotation thread via its "Quotations" card, so it's the natural hub.
2. Attaching at the project level sidesteps the revision-scoping question entirely (a `Project`
   has no revisions), unlike BOM/items/groups where "does this get copied per revision" had to
   be decided.

**Not deep-copied anywhere** — unlike BOM, attachments are reference material, not priced
content, so there's no snapshot-per-revision concern to begin with.

**Schema** (`project_attachments`): `uuid` (route-key binding), `project_id`, `name` (**user-
provided label at upload time**, required — this is what's shown in the UI and used as the
download filename), `original_name` (the actual uploaded file's original name, kept only to
derive the download extension — intentionally **not shown** in the attachments list per
explicit user request), `path`/`mime_type`/`size`, `uploaded_by`.

**Storage**: private `local` disk under `project-attachments/`, same pattern as Workforce
photo upload — `ProjectAttachmentController::download()` streams via `Storage::download()`
using `{name}.{extension}` as the served filename, and 404s if the attachment's `project_id`
doesn't match the route's `{project}` (cross-project access guard).

**UI**: "Attachments" card on `projects/show.tsx` — inline upload form (name + file,
`multipart/form-data`, resets on success), list of existing attachments (name, size, uploader,
upload date — no original filename shown), Download + Delete (behind a confirmation dialog,
`variant="destructive"`) per row. No status/draft restriction on upload, unlike BOM — can be
added to a project at any time.

## Bugs fixed along the way (worth knowing about)

- **Soft-delete + unique constraint bug**: `workforces.email` had a plain DB-level
  `->unique()` index. App-level validation correctly allowed reusing a soft-deleted record's
  email, but the raw `INSERT` still hit the DB constraint. Fixed via a partial unique index
  (`where deleted_at is null`) — SQLite supports this natively. Use this pattern proactively
  for any future unique+soft-deletable column.
- **Fast Refresh / HMR gotcha**: renaming a top-level `const`/`function` in a file already
  loaded in the browser can leave Vite's Fast Refresh in a broken state. Fix is a hard
  browser refresh or restarting the dev server — not a real code bug.
- **`#[Fillable]` silently drops unlisted columns**: happened twice — once for `Quotation`'s
  `root_quotation_id`/`version_major`/`version_minor`/`is_current` after adding the
  revisioning columns without updating the attribute list, causing revision creation to
  silently fail to set them (no error, just wrong data). Always update `#[Fillable]` in the
  same change that adds a mass-assigned column.
- **FormRequest `authorize()` vs. controller `abort_if()` ordering**: a controller-level
  `abort_if($model->status !== 'draft', 403, ...)` ran *after* FormRequest validation, so an
  invalid/empty payload against a locked record returned a validation error instead of the
  intended 403. Fix: move status/business-rule guards into `authorize()`.
- **Critical: multiple `is_current=true` rows in one revision thread** (user-reported, real
  production data). Root cause: `QuotationRevisionRequest::authorize()` only checked
  `status !== 'draft'`, so a user viewing an old, non-current snapshot (reachable via
  Revision History) could still click "Create Revision" from it. The version-bump math was
  computed relative to that stale row instead of the thread's true latest version, causing a
  `(quotation_code, version_major, version_minor)` unique-constraint collision and leaving
  two rows marked current simultaneously. Fixed by requiring `$quotation->is_current` in
  `authorize()` and mirroring the check in the frontend button visibility. Corrupted dev data
  was repaired manually via `php artisan tinker`. Regression test added:
  `RevisionTest.php` → `'a non-current quotation cannot be revised'`.
- **Products price/cost NULL constraint violation**: `products.price`/`cost` columns are
  `decimal(...)->default(0)` but **not** `->nullable()`, while validation used `'nullable'`.
  A blank form field submits as an empty string → validated to `null` → `Product::create()`
  inserts an explicit `NULL`, which overrides the column default and violates the NOT NULL
  constraint. Fixed by coercing blank/`null` price and cost to `0` in each FormRequest's
  `prepareForValidation()`, matching how the rest of the app already treats these as
  non-nullable money fields (`product.price` is typed as plain `string` everywhere on the
  frontend). Lesson: a `->default(0)` DB column without `->nullable()` should never pair with
  a `'nullable'` validation rule — either make the column nullable too, or coerce blanks to
  the default before validation.

## Conventions / preferences the user has stated explicitly

- "Back to X" buttons on detail pages: always red (`variant="destructive"`).
- "Edit X" buttons use the full noun (e.g. "Edit Quotation"), never just "Edit".
- No modal-based CRUD — dedicated pages only (index/create/edit/detail), except delete
  confirmation and workflow-action confirmations, which do use a `Dialog`.
- Delete confirmation always lives in a "Danger Zone" card at the bottom of the detail page.
- Destructive/negative workflow outcomes (cancel, reject, void, delete) get red
  (`variant="destructive"`) buttons.
- Wants mobile/tablet/desktop responsiveness considered on every page (stacking headers,
  buttons full-width on mobile via `w-full sm:w-auto`, tables scroll horizontally via the
  shared `Table` component rather than squishing).
- Cursor should be `pointer` on all clickable buttons, `not-allowed` on disabled ones —
  fixed globally, not per-component.
- Prefers being asked when there's a genuine architectural fork (e.g. enum values before
  building a module, approval/revision UX shape, delete semantics) — interview-first with
  `AskUserQuestion`-style recommended defaults, not silent guessing.
- After creating a record, redirect to its detail page (not the index) once a detail page
  exists — this was an explicit flow change requested for Quotations and is the preferred
  default going forward.
- Primary/repeatable form actions ("Add line", "Add group") use the default (solid) button
  variant, not outline — outline is reserved for secondary actions like "Cancel".
- Nested item boxes inside a card need their own background (`bg-muted/40`) rather than
  inheriting the parent card's `bg-card` — same-color nesting was flagged as bad contrast.
- Empty optional sections (e.g. "Ungrouped items" with zero items) should be omitted
  entirely from detail pages rather than rendered with an empty-state placeholder message.
- Percentage-based fields aren't always subtractive/additive by default — **check which
  semantics were actually requested per field** rather than assuming. `Quotation`'s own
  discount/tax fields are subtractive/additive (`base - base×pct/100`). `Bom`'s
  `selling_percentage` and its line-item percentage discount are **direct multipliers**
  (`base × pct/100`) — both were explicit corrections from the client's original ask. These
  two conventions coexist deliberately in the same codebase; don't "fix" one to match the
  other.
- Reference/supporting documents (e.g. Project Attachments) should **not** be deep-copied
  across quotation revisions the way pricing content (items/groups/BOM) is — only content
  that represents what was actually priced/planned needs a frozen snapshot per revision.

## What's NOT built yet (natural next steps)

- No pages/routes for: Deliver Orders, Purchase Orders, Goods Receipt Note, Stock Movements,
  Stock Adjustments, Invoice, Users, Roles. These are still disabled placeholders in the
  sidebar.
- RBAC (`spatie/laravel-permission`) is installed but nothing is actually gated by
  roles/permissions yet — no seeded roles, no policy/gate wired to any route or UI element.
  This is arguably the most important gap: approving/rejecting/voiding a quotation is
  currently possible for anyone logged in.
- No API layer, no tests beyond Pest feature tests (no Dusk/browser tests).
- Quotations don't yet generate any downstream document (e.g. converting an approved
  quotation into a Deliver Order or Invoice) — that linkage doesn't exist.
- No PDF/print export for quotations — no `dompdf`/`snappy` package installed, no print
  route anywhere. Likely the single biggest missing piece for a quotation module whose whole
  point is producing a document to hand the customer.
- `BomController` has no `destroy` — a BOM can be edited down to empty but not deleted.
- No customer-facing acceptance step (e-signature/"customer accepted" status) — the status
  workflow only tracks internal staff approval.

## Where to resume

Ask the user which module or feature to build next, and follow the CRUD pattern (and, for
anything workflow/revision-like, the Quotations pattern, or for nested groupings, the BOM
pattern) above.
