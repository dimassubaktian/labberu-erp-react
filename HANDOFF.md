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
12. **Table UI polish**: faded the shared `Table` component's row/header borders (`border-b`
    → `border-b-border/50`) and the outer wrapper `Card`-style border every index page uses
    (`border-sidebar-border/70` → `border-border/50`) — user felt the original borders were
    too strong. Both are in the shared component/pattern, so this applied everywhere at once.
13. **Nested form spacing fix**: Quotation "Group" cards and BOM "Group"/"Subgroup" cards used
    the full `Card`/`CardHeader`/`CardContent` component at every nesting level, stacking
    `py-6`/`px-6` padding (plus a redundant border/shadow) 2–3 levels deep. Replaced the
    *nested* levels only (not top-level cards like Details/Summary) with a lighter
    `rounded-lg border border-border/50 p-4` div — same visual separation, less wasted space.
    Affects `quotations/create.tsx`/`edit.tsx` (Group) and `boms/create.tsx`/`edit.tsx`
    (Group and Subgroup).
14. **Searchable async pickers for high-cardinality selects**: Customer (Projects), Project
    (Quotations), and Product (every Quotation/BOM line item) previously loaded their *entire*
    table into the page props on every create/edit visit, rendered as a plain `Select` with no
    search — fine for small reference tables, not for what could become hundreds/thousands of
    rows. See its own section below for the full design.
15. **Purchase Order (PO) module** built end-to-end — a document raised against a `Vendor`,
    referencing a `Project`/`Quotation` pair, with dynamic cascading discount levels (not a
    fixed 3-tier structure) and a real multi-step sign-off workflow (issuer → two parallel
    checkers → approver), all tracked against `Workforce` records rather than `User` logins.
    See its own section below for the full design, math, and workflow.
16. **PO edit-while-approved, resetting to draft** — POs were originally draft-only-editable
    like every other module. Client asked for `approved` POs to also be editable; editing one
    now reverts it to `draft` and clears every sign-off column (issuer/checkers/approver +
    timestamps), requiring the whole issue → check → approve workflow to be redone. An amber
    warning banner on `purchase-orders/edit.tsx` tells the user this before they save.
17. **Post-approval `progress` field on Quotation and PO** — added a second axis of state,
    separate from the internal approval `status`, tracking real-world fulfillment once a
    document is `approved`: Quotation goes `sent → accepted → converted`, PO goes
    `sent → partially_received/fully_received → closed`. See its own section below for the
    full design (why it's a separate field, the transition rules, and what does/doesn't reset
    it).
18. **Project/Quotation → Purchase Orders cross-linking** — added `Project::purchaseOrders()`
    and `Quotation::purchaseOrders()` relations plus a "Purchase Orders" card (same clickable
    card-list pattern as Project's existing "Quotations" card) on `projects/show.tsx` and
    `quotations/show.tsx`. Previously a PO was only reachable via the PO index or a direct
    link — this was flagged as a mechanical gap during a flow audit and closed the same
    session.
19. **BOM → Purchase Order line-item sourcing ("Import from BOM")** — an "Import from BOM"
    button on `purchase-orders/create.tsx`/`edit.tsx`'s Line Items card opens a `Dialog`
    listing every item across a quotation's BOM (groups, subgroups, ungrouped — flattened
    server-side by a new `QuotationController::bomItems()` endpoint) with checkboxes, a "BOM
    qty"/"Remaining" column computed live from the BOM item's quantity minus what's already
    been imported into other non-cancelled/voided POs, and a per-row editable quantity
    defaulting to that remaining amount — lets one hardware build's materials be split across
    multiple vendor POs. `purchase_order_items` gained a nullable `bom_item_id`
    (`nullOnDelete`) to trace which BOM item a line was sourced from, feeding the "already
    imported" math; re-selecting a product on an imported line clears the link. Interviewed
    via `AskUserQuestion` — traceability (not a no-tracking import) was the explicit choice,
    since items get split across vendors and the client wanted visibility into what's left.
20. **PO `attention` field** — a plain free-text field (not vendor-sourced, no autofill) added
    next to Vendor address on `purchase-orders/create.tsx`/`edit.tsx`, shown as **"Attn"**
    (not "Attention") on the detail page per explicit request.
21. **BOM delete** — `BomController::destroy()` added (previously the only module without
    one), `draft`-quotation-only, same Danger Zone pattern as everywhere else; soft-deletes
    the `Bom` without cascading to its `bom_items`/`groups`/`subgroups` rows (same
    "orphaned-but-unreachable" precedent as Quotation's own soft-delete — nothing queries
    those rows once their parent is excluded by the soft-delete scope).
22. **Goods Receipt Note (GRN) module** built — receiving against a Purchase Order. See its
    own section below.
23. **Delivery Order (DO) module** built — the sales-side mirror of GRN, against a Quotation.
    See its own section below.
24. **Invoice module** built — the first genuinely financial module (payment tracking, not
    fulfillment quantities), against a Quotation. See its own section below.

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
    sidebar entry. Own `create`/`edit`/`show`/`destroy` pages. See its own section below for
    the cost model and grouping structure.
11. **Purchase Orders** (`purchase_orders` + `purchase_order_items` + `purchase_order_discounts`
    + `purchase_order_code_sequences`) — has its own sidebar entry and full index/create/edit/
    show pages (no revisioning, unlike Quotations). See its own section below for the full
    design: dynamic cascading discounts, the issuer/checker/approver sign-off workflow, and
    the Project→Quotation cascading picker. Editable while `draft` **or** `approved` (editing
    an approved PO resets it to `draft`, see item 16 above) — a later addition, not part of the
    original build.
12. **Goods Receipt Notes** (`goods_receipt_notes` + `goods_receipt_note_items` +
    `goods_receipt_note_code_sequences`) — own sidebar entry (Purchase group) and full
    index/create/edit/show pages. Raised against a specific **approved** Purchase Order, many
    GRNs per PO for split/partial shipments. Simple `draft`→`confirmed` workflow (no
    issuer/checker/approver chain like PO). Confirming derives and writes
    `PurchaseOrder.progress`. See its own section below for the full design and the
    per-item-not-aggregate progress math.
13. **Delivery Orders** (`delivery_orders` + `delivery_order_items` +
    `delivery_order_code_sequences`) — own sidebar entry (Sales & CRM group), sales-side
    mirror of GRN, raised against a specific **approved** Quotation. Confirming derives
    `Quotation.progress`, which gained new `partially_delivered`/`fully_delivered` stages
    after `converted`. See its own section below.
14. **Invoices** (`invoices` + `invoice_items` + `invoice_payments` +
    `invoice_code_sequences`) — own sidebar entry (Finance group), raised against a specific
    **approved** Quotation, many invoices per quotation (deposit/progress/final billing). The
    first genuinely financial module — tracks individual payments via a new `InvoicePayment`
    sub-resource rather than a single status field, deriving `payment_status` from the
    running total. See its own section below.

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

**Delete**: `BomController::destroy()`, `draft`-quotation-only, same Danger Zone pattern as
everywhere else. Soft-deletes the `Bom` without cascading to its `bom_items`/`groups`/
`subgroups` rows — same "orphaned-but-unreachable" precedent as Quotation's own soft-delete,
since nothing queries those child rows once their parent is excluded by the soft-delete
scope.

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

## Async search comboboxes — Customer / Project / Product pickers

Discussed with the user as a "hybrid" fix: small, bounded reference tables (Job Titles,
Currencies, Taxes, Workforces) stay as the original plain `Select` with the full list passed
in via Inertia props — no reason to touch those. The three pickers that are genuinely
high-cardinality — **Customer** (on `projects/create.tsx`/`edit.tsx`), **Project** (on
`quotations/create.tsx`), and **Product** (every line item in `quotations/create.tsx`/
`edit.tsx` and `boms/create.tsx`/`edit.tsx`) — were switched to a server-side searchable
combobox instead.

**New dependencies** (explicitly approved by the user before adding): `@radix-ui/react-popover`
and `cmdk`. New shadcn-style primitives `resources/js/components/ui/popover.tsx` and
`resources/js/components/ui/command.tsx` wrap them, following this project's existing
`data-slot` + `cn()` convention from the other `ui/` components.

**`resources/js/components/async-combobox.tsx`** — the reusable piece. Generic over the option
type `T`. Props: `value`/`onValueChange(value, option?)` (mirrors the existing `Select` API so
call sites stay familiar — the hidden-input-for-Inertia-`<Form>` pattern is unchanged),
`searchUrl`, `getOptionId`/`getOptionLabel` (`renderOption` optional for richer list rendering),
and `initialOption` (pre-populates the trigger's label on edit pages without an extra fetch —
important since edit pages no longer receive the full option list to look the label up from).
Internally debounces (300ms) via `useHttp` (Inertia v3's standalone-HTTP-request hook — *not*
`router` or raw `fetch`, matches the one other place in the app that needed a non-page-visit
request, `hooks/use-two-factor-auth.ts`) and fetches an initial top-20 batch when the popover
first opens.

**Backend**: each of `CustomerController`, `ProductController`, `ProjectController` (and later
`VendorController`, added for Purchase Orders — see below) gained a `search(Request $request):
JsonResponse` action — `?q=` matched against name *or* code (`LIKE '%...%'`), capped at 20
results, ordered the same way the existing `index()`/`create()` queries were. Routes are
`GET {resource}/search`, registered **before** the `{resource}` wildcard route (same
static-before-wildcard rule as everywhere else in `routes/web.php`). Product's search also
respects `status = active` (matching what `create()`/`edit()` used to filter for); Customer/
Project/Vendor have no status column so no extra filter. Vendor's search additionally selects
`address`/`phone`/`fax` since Purchase Orders auto-fills those onto the document when a vendor
is picked.

**Controllers no longer preload full lists.** `ProjectController::create()`/`edit()`,
`QuotationController::create()`/`edit()`, and `BomController::create()`/`edit()` had their
`Customer::all()`/`Project::all()`/`Product::all()` calls removed entirely — the combobox now
sources everything via `/…/search`. Edit pages still eager-load *just* the currently-assigned
record (e.g. `$project->load('customer:id,name,customer_code')`) so `initialOption` has
something to render immediately.

**Product autofill quirk to know about**: selecting a product used to look up the full record
from a locally-passed `products[]` array to autofill unit/price/cost/description onto the line
item. Since that array no longer exists, `AsyncCombobox`'s `onValueChange` now hands back the
*entire* selected option object (not just its id) — `LineItemFields`' `handleProductChange` in
all four line-item forms uses that directly instead of an array `.find()`. For **edit** forms,
each `LineItem`/`BomItem` state type grew an `initialProduct?: ProductOption` field, populated
from the existing `item.product` relation in `toLineItem()` — this is what feeds
`AsyncCombobox`'s `initialOption` so an already-selected line item shows its product's label
immediately without a search round-trip.

**15 new feature tests** in `tests/Feature/Customers/SearchTest.php`,
`tests/Feature/Products/SearchTest.php`, `tests/Feature/Projects/SearchTest.php` — name match,
code match, inactive/trashed exclusion, result limit, guest gets 401 (not a redirect, since
these are JSON endpoints hit via `useHttp`, not full-page Inertia visits).

## Purchase Orders — cascading discounts, issuer/checker/approver sign-off workflow

A document raised against a `Vendor`, referencing a specific `Project`/`Quotation` pair (many
POs can be raised per quotation — no zero-or-one constraint like BOM). Has its own sidebar
entry and index/create/edit/show pages — **no revisioning** (unlike Quotations) and no
grouping structure (unlike BOM/Quotation items) — line items are a flat list.

**Header fields**: `purchase_order_code` (auto, see code scheme below), `project_id`,
`quotation_id`, `customer_id` (denormalized off the project at creation, shown read-only,
never independently selectable), `vendor_id`, `address`/`phone`/`fax` (snapshotted from the
selected vendor at pick-time, then freely editable — e.g. a different contact/address for this
specific order), `quotation_no`/`quotation_date` (free text/date — **the vendor's own
quotation reference to us**, unrelated to the linked `quotation_id`, which is *our* internal
quotation to the customer), `project_name` (editable text snapshot, not a live read of
`project.name`), `date`, `delivery_date`, `currency_id`, `tax_id`, `shipping_method`,
`shipping_terms`.

**The project cannot be changed after creation** (explicit correction from the client — POs
initially had every field editable while draft, same as Quotation/BOM items, but Project
specifically needed to be locked). `PurchaseOrderUpdateRequest` enforces this server-side via
`Rule::in([$purchaseOrder->project_id])` on top of the usual `exists` rule — not just a
frontend restriction. `edit.tsx` shows Project as the same static read-only paragraph pattern
Quotation's `edit.tsx` already used for its own (always-immutable) project field. Quotation and
Vendor, by contrast, **remain editable** while draft.

**Project → Quotation cascading picker**: since a PO's quotation must belong to its project,
picking a Project (via the same `AsyncCombobox` pattern as Quotation/Customer/Product) fetches
that project's quotations via a new `ProjectController::quotations(Project $project):
JsonResponse` endpoint (`GET projects/{project}/quotations`, JSON, all revisions, no `?q=`
search — a project's quotation count is small enough that no debounced search is needed, just a
plain dependent `Select`) and populates a second, initially-disabled `Select`. On `edit.tsx`
this same endpoint is called once on mount (via `useEffect`) using the already-set project's
uuid, so the current quotation shows up in the list without needing to touch the (now
read-only) project field first. **Gotcha hit during this build**: the fetch must use the
project's `uuid`, not its numeric `id` — `Project`'s route key is `uuid`, so the nested route
binds on that; `ProjectController::search()` originally didn't select `uuid` at all (only
`id`/`name`/`project_code`/`customer_id`), which 404'd this endpoint until `uuid` was added to
that select list.

**Cascading discount levels** (`purchase_order_discounts`, dynamic count — explicitly **not**
capped at 3 despite the client's original spec mentioning "Discount I, II, III"; the schema
supports any number of rows): each row has `sequence` (server-assigned from array order, never
trusted from the client), `label` (free text, e.g. "Discount I"), `discount_type`
(percentage/fixed), `discount_value`, and computed `base_amount`/`discount_amount`. **Cascading
means compound, not independent**: level 2 applies against the balance *left after* level 1,
not against the original subtotal — confirmed explicitly with the client, mirrors how
successive trade discounts actually work (e.g. 10% + 10% ≠ 20% off). Tax is applied **after**
all discount levels, on the final net balance. Math lives in
`PurchaseOrderController::syncItemsAndDiscounts()`, reused by both `store()` and `update()`
(same wipe-and-recreate-on-update pattern as every other module: `items()->delete();
discounts()->delete();` then rebuild).

**Line items** (`purchase_order_items`) are deliberately flat — no groups/subgroups like
Quotation/BOM. Fields: `product_id`, `reference_number` (autofilled from `product.
reference_number`, then freely editable — **bug hit here**: `ProductController::search()`
didn't select `reference_number` at all, so this field silently always came back empty
regardless of frontend logic; fixed by adding it to the select list), `description` (autofilled
from `product.descriptions`), `quantity`, `unit`, `unit_price` (**autofilled from
`product.cost`, not `product.price`** — deliberate, since a PO is a buying document, not a
selling one), `total`. No per-item discount (unlike Quotation items) — all discounting happens
once at the header level via the cascading levels above.

**Code scheme**: `LAB-PO{YY}{seq}-{VendorCode}`, generated in `PurchaseOrder::booted()`'s
`creating()` hook via a new `PurchaseOrderCodeSequence` model — **keyed by year only** (same
as `ProjectCodeSequence`), **not year+month**. The first implementation keyed it by year+month
(resetting monthly) before the client clarified they wanted an annual reset like Projects;
since the migration was still uncommitted at that point, it was edited and re-migrated in
place rather than patched with a second migration.

**Status workflow — issuer → two parallel checkers → approver**, modeled after a real paper
form (issued by one person, checked by two, approved by one), tracked against **`Workforce`
records, not `User` logins** (explicit client requirement — these are named staff roles on a
physical document, not necessarily system accounts): `status` (`draft`/`issued`/`approved`/
`cancelled`/`voided`, via the same `TRANSITIONS` const + `allowedNextStatuses()` pattern as
Quotation), plus `issued_by_id`/`issued_at`, `checked_by_1_id`/`checked_by_1_at`,
`checked_by_2_id`/`checked_by_2_at`, `approved_by_id`/`approved_at`, and `rejection_reason`.
The two checker slots are **parallel, not sequential** — either can be signed off in any order,
tracked as two independent nullable column pairs rather than a single "checked" status; the
Approve action is only available once both are non-null. **Rejecting reverts the PO to
`draft`** (not a terminal `rejected` status like Quotation) and clears all four sign-off
columns plus sets `rejection_reason` — re-issuing clears `rejection_reason` back to `null`.
Each transition is its own FormRequest (`PurchaseOrderIssueRequest`, `PurchaseOrderCheckRequest`
— takes a `slot` param, 1 or 2, and `authorize()`s that the target slot isn't already filled —
`PurchaseOrderApproveRequest`, `PurchaseOrderRejectRequest`, `PurchaseOrderCancelRequest`,
`PurchaseOrderVoidRequest`) and its own controller method/route (`PATCH .../issue`, `/check`,
`/approve`, `/reject`, `/cancel`, `/void`), each with its own confirmation `Dialog` on
`show.tsx` — a `WorkforceSelect` picker (plain `Select`, matching the existing "Workforce is
still a plain full-list select" convention) appears inside the relevant dialogs where a
sign-off name needs to be recorded.

**Editing an `approved` PO** (`PurchaseOrderController::edit()`/`update()`,
`PurchaseOrderUpdateRequest::authorize()`) is allowed in addition to `draft` — a later client
request, not part of the original build. If the PO was `approved` when the edit is submitted,
`update()` resets `status` back to `draft` and nulls every sign-off column (`issued_by_id/at`,
`checked_by_1/2_id/at`, `approved_by_id/at`) **and** `progress` (see below) in the same write,
so the whole workflow — issue, both checks, approve — has to be redone. `edit.tsx` shows an
amber warning banner when `purchaseOrder.status === 'approved'` telling the user this will
happen before they save. Delete was deliberately **not** extended the same way — it's still
`draft`-only.

## Progress tracking — Quotation and Purchase Order

A `progress` column (nullable string) was added to both `quotations` and `purchase_orders`,
deliberately **separate from `status`**. `status` is the internal approval workflow (who
signed off, is this the source of truth); once a Quotation/PO reaches `approved`, `status`
is effectively terminal (only `voided` follows) and stops changing — but the real-world
document keeps moving (sent to the customer/vendor, accepted, goods received, etc.), and
there was nowhere to record that. This was scoped deliberately narrow: only per-document
progress was built now; a **rollup view across the whole Project** (Quotation approved → PO
issued → goods received → invoiced) was discussed and explicitly deferred, since it would be
a *derived* view over Deliver Order/Goods Receipt/Invoice records that don't exist yet —
storing a manually-synced rollup field invites the same class of bug as the `is_current`
incident below.

**Stages** (`Quotation::PROGRESS_TRANSITIONS`/`PurchaseOrder::PROGRESS_TRANSITIONS`, mirroring
the existing `TRANSITIONS`/`allowedNextStatuses()` pattern via a parallel
`allowedNextProgress(?string $progress): array`):
- Quotation: `sent → accepted → converted`.
- PO: `sent → partially_received/fully_received → closed` (partially_received can be skipped
  and gone straight to fully_received).

**Gating rule**: progress can only be advanced while `status === 'approved'` — enforced in
`QuotationProgressUpdateRequest`/`PurchaseOrderProgressUpdateRequest` by returning an empty
`Rule::in([])` (i.e. always-invalid) allowed-list whenever status isn't approved, same
"`authorize()` returns `true`, `rules()` does the real gating via `Rule::in($allowed)`" style
Quotation's own `QuotationStatusUpdateRequest` already used — **not** a hard 403 in
`authorize()`. Each model exposes one generic `PATCH .../progress` endpoint
(`{model}.progress.update`) rather than PO's per-action-endpoint style, since progress is a
single linear sequence with no distinct per-step business rules to justify separate
FormRequests.
**Manual only** — advancing progress is always a deliberate user action via its own
confirmation `Dialog` (mirrors the existing status-workflow action buttons); nothing
auto-advances it (e.g. approving a PO does *not* auto-set progress to `sent`) — an explicit
choice to keep the two lifecycles decoupled.

**Reset behavior — deliberately asymmetric**: editing an `approved` PO back to `draft`
(see above) **does** clear `progress` back to `null`, since the underlying document content
changed and the old progress is stale. Voiding or cancelling a Quotation/PO does **not**
clear `progress` — it's treated as historical fact ("it got this far before being
voided/cancelled"), not live state that must reflect the current status. Don't "fix" this
into clearing progress on every terminal transition; it was a deliberate call, not an
oversight.

**Frontend**: a "Progress" `Badge` in each Details card (only rendered once `progress` is
non-null) plus a "Progress" `Card` with one button per next-allowed stage
(`progressActions(progress)` in both `quotations/show.tsx` and `purchase-orders/show.tsx`,
same shape as the existing `statusActions(status)` helper), each behind its own confirmation
`Dialog`.

## Goods Receipt Note (GRN) — receiving, per-item progress derivation

A document raised against a specific, **approved** Purchase Order, recording what physically
arrived. Own sidebar entry (Purchase group) with full index/create/edit/show pages, plus
cross-linked from `purchase-orders/show.tsx` via a "Goods Receipt Notes" card + "Create GRN"
shortcut (gated on `purchaseOrder.status === 'approved'`).

**Multiple GRNs per PO** — a PO can receive in several shipments; "received so far" per PO
line is always summed live across a PO's *confirmed* GRNs
(`GoodsReceiptNoteItem::whereHas('goodsReceiptNote', status=confirmed)`), never a synced
field, matching the BOM→PO remaining-quantity pattern established earlier.

**Schema**: `goods_receipt_notes` (`grn_code` scheme `LAB-GRN{yy}{seq}-{VendorCode}`,
`purchase_order_id` immutable, `status` `draft`/`confirmed` only — a deliberately minimal
two-state workflow, no issuer/checker/approver chain like PO since a GRN isn't a
multi-signature physical form, `received_by_id`/`received_at` set on confirm) +
`goods_receipt_note_items` (`product_id`/`quantity_ordered`/`unit` snapshotted from the
source PO item at creation time, `purchase_order_item_id` nullable `nullOnDelete` since
`PurchaseOrderController::update()` wipes and recreates PO items on every edit,
`quantity_accepted`/`quantity_rejected` — explicitly a **split**, not a single "quantity
received" — with an optional `rejection_reason`, since goods can arrive damaged; this was an
explicit interview answer, don't collapse it back to one field).

**Confirming a GRN recomputes and writes `PurchaseOrder.progress`** directly
(`GoodsReceiptNoteController::updatePurchaseOrderProgress()`), bypassing
`PurchaseOrderProgressUpdateRequest`/`allowedNextProgress()` entirely — that gate exists to
protect *manual* button-driven transitions from skipping/reversing steps; a system-derived
recomputation-from-scratch is allowed to jump straight to the correct stage. The comparison
is **per PO line item, not an aggregate total**: summing `quantity_accepted` across all items
and comparing to the summed order total would let one over-received line mask another line
that never arrived (e.g. line A ordered 5, over-received to 10; line B ordered 5, never
shipped — an aggregate 10/10 would wrongly read "fully received"). Every item must
individually be ≥ its ordered quantity for `fully_received`; any item with `> 0` accepted but
not all complete is `partially_received`; nothing accepted leaves progress untouched. Guarded
both at GRN creation and at confirm time by `purchaseOrder.status === 'approved'` (the PO
could have been edited back to `draft` in between, since PO edit-while-approved already
resets it).

**New shared endpoints this module needed** (later reused by DO and Invoice too):
`PurchaseOrderController::search()` (`?q=` against `purchase_order_code`, filtered to
`status = 'approved'`) and `PurchaseOrderController::items()` (that PO's items + received/
remaining per line). The create/edit form is driven by these rather than free product
search, since a GRN line is inherently "what happened against this PO's existing lines," not
an arbitrary new line — a **different form shape** from every other line-item form in the app
(Quotation/BOM/PO all let you freely add/remove arbitrary rows): the item table is fixed to
the PO's own items, only a per-row "Accepted"/"Rejected"/"Rejection reason" set of inputs is
editable, and only rows where `accepted + rejected > 0` get submitted (a filtered array
computed at render time; hidden inputs generated only for those rows, the visible table still
maps over every PO item so partially-filled-out state isn't lost while typing). This same
fixed-row-table shape was then reused for DO and Invoice.

**Known trade-off, not solved**: editing a PO after a GRN (draft or confirmed) already exists
against it immediately nulls every existing GRN item's `purchase_order_item_id` (PO items are
hard-deleted and recreated on update, unlike BOM/Quotation items which are soft-deleted).
The GRN itself stays fully correct (everything it displays is snapshotted), but "received so
far" math for a *new* GRN against that same PO won't see those older receipts against the new
item rows. Same class of trade-off already accepted for BOM↔PO linkage via `bom_item_id`.

## Delivery Order (DO) — sales-side mirror of GRN

Directly mirrors GRN's shape, on the Quotation side: raised against a specific **approved**
Quotation (many DOs per quotation, for split shipments), `draft`/`confirmed` two-state
workflow, `delivered_by_id`/`delivered_at` on confirm (Workforce, not User — matches GRN's
`received_by`, not Quotation's own User-based `approved_by`, since this is a delivery-note
signature block, not a digital approval). `delivery_order_items`: single `quantity_delivered`
field, **no accepted/rejected split** — that was explicitly GRN-only (goods arriving damaged
is a receiving concern; nothing analogous was asked for delivery), so don't copy GRN's shape
wholesale onto DO just because it looks symmetric.

**`Quotation::PROGRESS_TRANSITIONS` extended** with `partially_delivered`/`fully_delivered`
after `converted` (previously terminal) — confirming a DO derives and writes
`Quotation.progress` the same per-item-not-aggregate way GRN does for PO, via
`DeliveryOrderController::updateQuotationProgress()`, also bypassing the manual gate. These
two new stages are also reachable as **manual buttons** in `quotations/show.tsx`'s
`progressActions()`, same as how PO kept `partially_received`/`fully_received` manually
clickable even after GRN could derive them.

**`QuotationController::search()`/`::items()`** (new, mirroring the PO ones GRN needed) power
the DO create/edit form — same fixed-row-table shape, driven by the quotation's own items
(grouped and ungrouped alike; delivery doesn't care about the pricing-group structure, so the
endpoint doesn't filter on `quotation_group_id`).

**Cross-linked** from `quotations/show.tsx` via a "Delivery Orders" card + "Create DO"
shortcut (gated on `quotation.status === 'approved'`), own sidebar entry (Sales & CRM group).

## Invoice — the first financial module, individual payment tracking

Raised against a specific **approved** Quotation (many invoices per quotation — deposit/
progress/final billing schedules). Unlike every prior module, Invoice tracks *money*, not
fulfillment quantities, and was interviewed separately for that reason (`AskUserQuestion`,
four questions): parent document (Quotation, confirmed), cardinality (multiple per quotation,
confirmed), payment tracking shape, and whether it should extend `Quotation.progress`
further.

**Payment tracking — individual payments, not a status field**: the one place the client
picked *against* the recommended simpler default. `invoice_payments` (`amount`,
`payment_date`, `method` free text, `remarks`, `recorded_by` — a **User**, `auth()->id()`, not
a Workforce picker, since recording a payment is a digital bookkeeping entry by whoever's
logged in, not a signature on a physical paper form) lets multiple partial payments
accumulate against one invoice. `InvoicePaymentController::store()`/`destroy()` each
recompute `Invoice.payment_status` (`null`/`partially_paid`/`paid`) from
`sum(payments.amount)` vs `invoice.total` — **self-contained**, unlike GRN→PO/DO→Quotation's
cross-model derivation, since the same `Invoice` model owns both its payments and the derived
field. No overpayment cap (same "show context, don't block" choice as every
remaining-quantity feature elsewhere). Deleting a payment can move `payment_status` back down
(e.g. `paid` → `partially_paid`) — intentional, a correction mechanism, not a bug.

**`Quotation.progress` deliberately NOT extended further for invoicing/payment** — confirmed
explicitly. Progress already has a natural fulfillment endpoint at `fully_delivered`; payment
collection is a different axis (financial, not fulfillment) and stacking a third
auto-derived concern onto the same field would conflate two lifecycles that only shared a
home so far because GRN/DO's stages were purpose-built extensions of receiving/delivering.

**Schema/design defaults not covered by the interview** (flagged for visibility rather than
asked, since they follow clear precedent): `invoice_items` are **read-only pricing
snapshots** (`unit_price` copied from the quotation item at creation, never user-edited —
only "Invoice qty" is editable, same shape as every other module's fixed-row form); **no
per-item discount**, only header-level `discount_type`/`discount_value`/`tax_id` (mirrors
PO's simpler header-only pattern, not Quotation's per-item-plus-header one); **two-state
`status` only** (`draft`→`issued`, no void/cancel — nothing in the ask called for invoice
rejection); **no separate `currency_id`** on Invoice — always displays via
`invoice->quotation->currency`, avoiding a duplicated column that could drift from its
parent.

**Money math** (`InvoiceController::syncItems()`) reuses the exact
`calculateDiscountAmount`/`calculateTaxAmount` shape already proven in
`QuotationController`/`PurchaseOrderController` — copied, not shared, matching this
codebase's established per-controller duplication convention.

**`QuotationController::items()`/`::search()` extended again** (third consumer, after DO) —
additively: `unit_price`, `invoiced` (sum of `quantity_invoiced` across **all** invoice items
regardless of status, since unlike GRN/DO there's no draft-vs-confirmed distinction for
invoice items — a draft invoice still reserves its claimed quantity so two drafts can't
double-claim the same units), `remaining_to_invoice`, and (on `search()`) `currency` (needed
to display amounts in the right currency on the create form; DO never needed this). Confirmed
additive — existing DO tests asserting `data.0.delivered`/`data.0.remaining` kept passing
unchanged; this "extend a shared endpoint additively rather than duplicate it" approach is
now the established pattern for any future module that needs quotation-item context.

**Cross-linked** from `quotations/show.tsx` via an "Invoices" card + "Create Invoice"
shortcut, own sidebar entry (Finance group).

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
- **Migration edit dropped `timestamps()`**: while reworking `purchase_order_code_sequences`
  from a year+month key down to year-only, the migration was rewritten and accidentally lost
  its `$table->timestamps()` call, which broke every test that created a `PurchaseOrder`
  (its `booted()` hook writes to that table on every create). Since the migration was still
  uncommitted, fixed by rolling back + re-migrating in place rather than adding a patch
  migration — remember uncommitted migrations can be edited directly, but double-check nothing
  got silently dropped in the rewrite.
- **`PurchaseOrderController::store()` didn't capture the transaction's return value**: the
  `DB::transaction(function () use ($data): PurchaseOrder { ... return $purchaseOrder; })` call
  wasn't assigned to a variable, so `to_route('purchase-orders.show', $purchaseOrder)` after it
  referenced an undefined variable. Caught by the "redirect to detail page after create" rule
  requiring the created record's route-key — always assign `$x = DB::transaction(...)` when the
  redirect needs something the closure created.
- **Async combobox nested-route binding by numeric `id` instead of `uuid`**: the Project→
  Quotation cascading picker (see Purchase Orders section above) called the nested
  `projects/{project}/quotations` endpoint using the numeric `id` returned by
  `ProjectController::search()`, but `Project`'s route key is `uuid` — 404'd until `uuid` was
  added to the search endpoint's select list and the frontend switched to using it. General
  lesson: any endpoint reached via route-model-binding on a UUID-keyed model needs the picker's
  search response to actually include that UUID, not just the numeric id used for FK
  validation. **Recurred** when wiring the GRN item picker: the PO create/edit form's
  `quotationId` state is the numeric id (used for form submission), but the new
  `purchase-orders/{purchaseOrder}/items` endpoint needed the PO's uuid — fixed the same way,
  by tracking both id and uuid in separate state.
- **`AsyncCombobox` not showing the selected product after a programmatic (non-click) value
  change**: `AsyncCombobox` initializes its internal `selectedOption` display state once, from
  an `initialOption` prop, at mount — it does not derive the displayed label from the `value`
  prop alone. Manually picking from the dropdown always worked (the component's own
  `handleSelect` sets `selectedOption` internally), but items added *programmatically* — the
  "Import from BOM" modal setting `product_id` directly onto a newly-appended line item —
  bypassed that path, so the trigger showed the placeholder instead of the product name even
  though the hidden `product_id` input was correctly populated. Fixed by having the import
  modal also pass back full product data as `initialProduct`, threaded onto each newly
  appended `LineItem` and rendered via `initialOption` — since each newly-appended row is a
  fresh component mount (a new array index), this correctly seeds the display without needing
  `AsyncCombobox` itself to become reactive to prop changes after mount. Turned up a second,
  pre-existing gap in the same fix: `purchase-orders/create.tsx` was missing the
  `initialOption` wiring entirely even for its own normal manual-pick path (only `edit.tsx`
  had it) — fixed at the same time.

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
- Not every `Select` needs to become a searchable async combobox — only convert one once a
  table is genuinely high-cardinality (hundreds/thousands of rows). Small bounded reference
  data (Job Titles, Currencies, Taxes, Workforces) stays as a plain `Select` with the full list
  passed via Inertia props; converting those would just be unnecessary network round-trips.
  (Vendor was the one exception — client asked for the combobox treatment ahead of it actually
  becoming high-cardinality, for Purchase Orders; that's a one-off, not a reversal of the rule.)
- A field being "editable while draft" doesn't automatically mean *every* field on that
  document is editable — confirm per-field. Purchase Orders were originally built with every
  field (including Project) editable while draft, matching Quotation/BOM's general "all fields
  editable while draft" pattern, but the client then singled out Project as needing to be
  locked after creation, same as Quotation's project field already was. Don't assume a
  blanket rule from one module carries over uniformly to a new one — ask if unsure.
- Workflow steps that mirror a physical paper form's signature block (issuer, checkers,
  approver) should be tracked against `Workforce` records, not `User` logins — these represent
  named staff roles on a document, not necessarily people with system accounts. Purchase
  Order's issue/check/approve actions each take a `workforce_id` via a plain `Select`, distinct
  from Quotation's `approved_by`, which *is* tied to the logged-in `User`.
- "Editable while draft" isn't a fixed ceiling either — Purchase Order later grew "editable
  while `approved`, resets to `draft` on save" on top of that, while Quotation/BOM stayed
  `draft`-only. Don't assume every module's edit-lock behavior stays frozen at its original
  scope; ask before extending or copying it to a new module.
- A document's internal approval `status` and its real-world fulfillment `progress` are
  different axes and shouldn't be conflated into one field — see "Progress tracking" section
  above. `status` stops changing once terminal (`approved`); `progress` is a second, separate,
  manually-advanced field for what happens after. When asked for something like "what state is
  this document really in," check whether the ask is about the approval workflow or about
  fulfillment before reaching for `status`.
- **`progress` can also be *derived*, not just manually clicked** — once GRN and DO existed,
  confirming them recomputes `PurchaseOrder.progress`/`Quotation.progress` directly, bypassing
  the manual transition gate (`allowedNextProgress()`), since that gate exists to protect
  *manual* button-driven transitions from skipping/reversing steps, not a system-derived
  recomputation-from-scratch. When a derivation like this is added, always recompute **per
  line item, not as an aggregate total** — an aggregate sum can be masked by one
  over-received/over-delivered line hiding another line that never arrived at all. Both GRN→PO
  and DO→Quotation have a regression test specifically for this case; don't "simplify" the
  math back to a single sum.
- A "so far / remaining" quantity feature (BOM→PO import, GRN→PO progress, DO→Quotation
  progress, Invoice→Quotation invoiced-so-far) should be **computed live from existing rows,
  never a synced field** — and when a second module starts needing the same parent-item
  context an earlier module already exposed via an endpoint, **extend that endpoint
  additively** (new response fields) rather than duplicating it. `PurchaseOrderController::
  items()`/`::search()` and `QuotationController::items()`/`::search()` have each been
  extended twice this way (GRN, then Invoice) without breaking the earlier consumer's tests.
- Don't assume a sibling module needs the same field shape just because it looks symmetric.
  GRN's `quantity_accepted`/`quantity_rejected` split was an explicit interview answer for
  *receiving* (goods can arrive damaged); DO deliberately got a single `quantity_delivered`
  field instead, since nothing analogous was asked for delivery. Check per-module rather than
  copying the most recent module's shape by default.
- Not every new axis of state should live on `Quotation.progress`, even once it's already
  hosting two derived stages (delivery). Invoice's `status`/`payment_status` were explicitly
  kept off `Quotation.progress` — confirmed with the client — since payment collection is a
  financial lifecycle, not a fulfillment one, and stacking a third unrelated concern onto the
  same field starts to erode what it means.
- When a new module clearly tracks money rather than fulfillment quantities (Invoice was the
  first), that's worth flagging as a different *kind* of decision during the interview, not
  just another set of workflow questions — the client picked against the recommended simpler
  default specifically because real bookkeeping needed installment/partial payment history,
  something none of the quantity-tracking modules needed.

## What's NOT built yet (natural next steps)

- No pages/routes for: Stock Movements, Stock Adjustments, Users, Roles. These are still
  disabled placeholders in the sidebar. (Purchase Orders, Goods Receipt Notes, Delivery
  Orders, and Invoices are now all built — see their own sections above.)
- RBAC (`spatie/laravel-permission`) is installed but nothing is actually gated by
  roles/permissions yet — no seeded roles, no policy/gate wired to any route or UI element.
  This is arguably the most important gap, and it's gotten bigger with every module built
  since it was first flagged: approving/rejecting/voiding a quotation, purchase order, or
  invoice, confirming a GRN/DO, or recording/removing a payment is currently possible for
  anyone logged in.
- No API layer, no tests beyond Pest feature tests (no Dusk/browser tests). Relatedly, none of
  the modules built in this session (GRN, DO, Invoice) have been clicked through in an actual
  browser — this environment has no browser automation tool available, so verification for
  those three has been HTTP/test-level only (routes resolve, middleware behaves, no new
  errors logged), not a substitute for actually using the UI.
- No PDF/print export for **any** document (Quotation, PO, GRN, DO, or Invoice) — no
  `dompdf`/`snappy` package installed, no print route anywhere. Likely the single biggest
  missing piece for a set of modules whose whole point is producing a document to hand to a
  customer or vendor — this gap has only grown as more document types were added.
- `Project`'s own `status` (`planning`/`in_progress`/`completed`/`cancelled`) still doesn't
  reflect any of its child documents' state — a Project can say `completed` while its only
  quotation is still `draft`. Originally deferred because there wasn't much to roll up from
  until Deliver Order/Goods Receipt/Invoice existed — **that's no longer true**, all three now
  exist, so a real derived rollup (see "Progress tracking" section for why a manually-synced
  field was rejected in favor of always-computed) is more feasible now than when this was
  first written. Still not requested, so still not built.
- No customer-facing acceptance step (e-signature/self-service "customer accepted" status) —
  **partially addressed** by Quotation's `progress = 'accepted'` stage (see "Progress
  tracking" section above), but that's still an internal staff member manually recording that
  the customer accepted it, not something the customer does themselves. Likewise there's no
  customer-facing payment portal for Invoice — payments are recorded manually by staff.
- Workforce ("person in charge" on Projects, the issuer/checker/approver pickers on Purchase
  Orders, and the received-by/delivered-by pickers on GRN/DO) still uses a plain full-list
  `Select`, not the async combobox — deliberately deferred, but worth revisiting if headcount
  grows into the hundreds. Same `AsyncCombobox` component would apply directly.
- No linkage from an Invoice or Delivery Order back into any kind of inventory/stock
  deduction — there's no Stock Movements module yet for a DO's shipped quantities (or a GRN's
  received quantities) to actually adjust. Everything built so far is purely
  document/quantity tracking, not real inventory levels.

## Where to resume

The full document chain is now built: Project → Quotation → BOM/PO/GRN/DO/Invoice, each with
the interlocking `status`/`progress` derivation described above. Ask the user which module or
feature to build next. For a new document-style module raised against an existing parent
(the GRN/DO/Invoice shape), follow the GRN section above as the closest template — it's the
most reused pattern in the app at this point (DO and Invoice both mirrored it directly). For
anything workflow/revision-like, follow the Quotations pattern; for nested groupings, the BOM
pattern; otherwise the base CRUD pattern above. Given the gaps listed just above, RBAC
enforcement and PDF/print export are probably the two highest-leverage next picks — everything
else is a new module, but those two cut across every module already built.
