# Session history log (chronological)

Part of the `docs/handoff/` detail set — see `HANDOFF.md` at the repo root for the index.

Roughly in order:

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
6. **Ten full modules built end-to-end** (see `HANDOFF.md`'s module list), most following the
   identical CRUD pattern (see `docs/handoff/crud-pattern.md`); Quotations layers a status
   workflow and revisioning on top of it, and BOM (module 10) layers a nested grouping
   structure on top of that same pattern.
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
    `Quotation` revision (zero-or-one, optional). See `docs/handoff/bom.md`.
11. **Project Attachments** — file upload capability added to `Project` (deliberately *not*
    `Quotation`). See `docs/handoff/project-attachments.md`.
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
14. **Searchable async pickers for high-cardinality selects** — Customer (Projects), Project
    (Quotations), and Product (every Quotation/BOM line item). See
    `docs/handoff/async-combobox.md`.
15. **Purchase Order (PO) module** built end-to-end. See `docs/handoff/purchase-orders.md`.
16. **PO edit-while-approved, resetting to draft** — POs were originally draft-only-editable
    like every other module. Client asked for `approved` POs to also be editable; editing one
    now reverts it to `draft` and clears every sign-off column (issuer/checkers/approver +
    timestamps), requiring the whole issue → check → approve workflow to be redone. An amber
    warning banner on `purchase-orders/edit.tsx` tells the user this before they save.
17. **Post-approval `progress` field on Quotation and PO** — see
    `docs/handoff/progress-tracking.md`.
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
22. **Goods Receipt Note (GRN) module** built — receiving against a Purchase Order. See
    `docs/handoff/grn.md`.
23. **Delivery Order (DO) module** built — the sales-side mirror of GRN, against a Quotation.
    See `docs/handoff/delivery-orders.md`.
24. **Invoice module** built — the first genuinely financial module (payment tracking, not
    fulfillment quantities), against a Quotation. See `docs/handoff/invoices.md`.
25. **Stock Movements module** built — a strictly auto-generated, read-only inventory ledger,
    created as a side effect of confirming a GRN (`in`) or DO (`out`), never entered directly.
    See `docs/handoff/stock-movements.md`.
26. **Stock Adjustments module** built — manual corrections (stock count, damage, loss,
    initial load) that write into the same `stock_movements` ledger as a third source. See
    `docs/handoff/stock-adjustments.md`.
27. **Project gained a `new` early-stage status** — added ahead of `planning` in the fixed
    `status` list (`ProjectStoreRequest`/`ProjectUpdateRequest`'s `in:...` rule, both
    `create.tsx`/`edit.tsx` status `Select`s), and made the default on the create form and in
    `ProjectFactory` (previously `planning` held both defaults). Interviewed via
    `AskUserQuestion` — the label "New" (not "Inquiry"/"Lead"/"Draft") and making it the new
    default were both explicit choices, not assumptions. The `projects` migration's DB-level
    column default is still `planning` — deliberately left alone, since `status` is always
    required through the form request so that fallback is never actually hit; not worth a new
    migration for dead code.
28. **Project → Quotation quick-create with preselected project** — a "New Quotation" button
    on `projects/show.tsx`'s Quotations card header, linking to `quotations.create` with
    `?project={project.uuid}` in the query string (same `query: {...}` Wayfinder-link pattern
    already used by the DO/Invoice quick-create buttons on `quotations/show.tsx`).
    `QuotationController::create()` now accepts that query param, loads the project, and
    passes it as `initialProject`; `quotations/create.tsx` uses it to preselect `projectId`
    state and seed the project `AsyncCombobox`'s `initialOption` — mirrors the existing
    `initialQuotation` pattern `DeliveryOrderController::create()`/`InvoiceController::create()`
    already used for their own preselected-parent create flows, just one level up the document
    chain (Project → Quotation instead of Quotation → DO/Invoice).
29. **Currency `base_currency` flag** — a `base_currency` boolean column, enforced single-row
    invariant (marking one currency as base atomically unsets any other, inside a
    `DB::transaction()` in `CurrencyController::store()`/`update()`, same "demote the old one"
    shape as `Quotation.is_current`, just without a partial unique index since `false` is a
    valid value for every other row). Surfaced as a "Set as base currency" `Checkbox` on
    `currencies/create.tsx`/`edit.tsx` (hidden-input-synced, same pattern as every other
    checkbox/select in the app) and a "Base" `Badge` on `currencies/index.tsx`/`show.tsx`.
    **Quotation and Purchase Order create forms** (the only two forms with a `currency_id`
    select — Invoice has none, it derives currency from its parent quotation) now default
    `currencyId` to the base currency's id (`currencies.find(c => c.base_currency)`) instead of
    starting blank; both controllers' `create()` methods select `base_currency` in the
    currencies query for this. Edit forms were left untouched — they already preselect the
    record's own saved currency, so there's nothing to default.
30. **Product picker shows and searches by `reference_number`** — `ProductController::search()`
    now also matches `reference_number` (previously name/`product_code` only).
    `reference_number` is a **required** field on `Product` (not optional, despite how it may
    read elsewhere) — this was confirmed explicitly via `AskUserQuestion` rather than assumed,
    so the picker's `(REF-XXXXX)` suffix in `getOptionLabel` is a defensive conditional
    (`product.reference_number ? ... : ...`), not evidence the field can be blank today. Applied
    to every `AsyncCombobox<ProductOption>` call site: Quotation/BOM/Purchase Order
    create+edit, and Stock Adjustment create — six files, same duplicated-per-file conditional
    each time (matches the established create/edit duplication convention, not a shared
    helper).
31. **Quotation line items reworked into a single add/edit form + click-to-edit summary
    table** — replaces the old "one full stacked-card `LineItemFields` per item" layout on
    `quotations/create.tsx`/`edit.tsx` (both the ungrouped-items list and every group's own
    item list). Went through two iterations before landing here: the first pass turned each
    item into its own editable table *row* (still one set of inputs per item, just
    horizontal) — the user clarified that wasn't the ask and asked for a plan first, so the
    second pass (built via `EnterPlanMode`, confirmed via `AskUserQuestion` on two specifics:
    one form per items-list rather than one shared form with a target selector, and
    edit-in-place rather than remove-and-reappend) replaced it with what's described below.
    Don't revert to the per-row-editable table shape.

    Each items-list now renders **one** `LineItemForm` (the original stacked-card field
    layout: product combobox, description, qty/unit/price/cost grid, discount grid, live
    totals preview) plus a read-only `LineItemRow` summary `Table` below it (Product / Qty /
    Unit price / Discount / Total price / trash icon). Submitting the form appends a new row;
    clicking anywhere on an existing row (except the trash button, which
    `e.stopPropagation()`s) loads that item back into the form for editing — the submit
    button relabels "Add line" → "Update line", a "Cancel edit" button appears, and the row
    highlights via `TableRow`'s existing `data-[state=selected]:bg-muted` class
    (`data-state={isEditing ? 'selected' : undefined}`). Saving an edit replaces that item in
    place; the trash icon removes a row directly, independent of the form.

    State-wise, each items-list (`items`/`GroupState.items`) gained a sibling `draft: LineItem`
    (the form's working value) and `editingItemIndex: number | null`. `LineItem` gained a
    `product: ProductOption | null` field so the summary row can render the product's label
    without a re-fetch — `edit.tsx`'s `toLineItem()` sets it from the already-loaded
    `item.product`, and `create.tsx`'s form sets it from `AsyncCombobox`'s `onValueChange`
    callback, which already hands back the full option object. This also let `edit.tsx` drop
    the old separate `initialProduct` field/prop entirely — `draft.product` now serves as
    `AsyncCombobox`'s `initialOption` directly. All 8 `LineItem` fields for each *committed*
    item are still submitted via hidden `<input>`s (same `name={`${namePrefix}[field]`}`
    convention, backend contract unchanged) nested inside the row's Product `TableCell`, since
    the row itself has no live inputs anymore. Per-item validation errors surface two places:
    a compact red line under the product name in the row, and the full per-field errors in
    `LineItemForm` once that row is reopened for editing (`errorPrefix` is only set while
    `editingItemIndex !== null` — a brand-new unsaved draft has no server-side error key yet).
32. **Active-tab color on shared `Tabs` component** — `TabsTrigger`'s `data-[state=active]`
    style changed from the shadcn default (muted `bg-background`/`shadow-sm`) to the `Button`
    "default" variant look (`bg-primary`/`text-primary-foreground`). `Tabs` is currently only
    used in one place — the linked-documents section (BOM / Purchase Orders / Delivery Orders
    / Invoices) on `quotations/show.tsx` — so this was a safe direct edit to the shared
    component rather than a page-scoped override. Asked via `AskUserQuestion` whether the rest
    of that tab block (section heading, per-tab counts, BOM-vs-others layout consistency,
    empty states) should also be reworked; the user scoped it down to just the active-tab
    color, so the tab content/layout itself is unchanged.
33. **Small UI polish batch**: `quotations/show.tsx`'s linked-documents `TabsList` (BOM /
    Purchase Orders / Delivery Orders / Invoices) changed from wrapping to a horizontal-scroll
    strip (`flex-nowrap overflow-x-auto`) when the tab titles don't fit — a page-scoped
    `className` override, not a change to the shared `Tabs` component (unlike item 32, which
    did edit the shared component when `Tabs` had only one call site). `invoices/show.tsx`'s
    Record Payment dialog got `sm:items-start` on the Method/Remarks two-column grid so the
    shorter Method `Input` field no longer stretches to match the taller Remarks `Textarea`.
    Also added a **"Session Start"** section to the repo's `CLAUDE.md` instructing future
    sessions to `Read` `HANDOFF.md` first.
34. **Users, Roles & full RBAC enforcement** — the module 4 plumbing (spatie/laravel-permission
    installed, `HasRoles` on `User`) finally got wired up: seeded permissions, Users/Roles admin
    pages, and every existing route in `routes/web.php` gated by `permission:` middleware. See
    `docs/handoff/rbac.md` for the full design (permission naming scheme, User↔Workforce link,
    self-lockout guards, the SQLite migration gotcha that corrupted a partial index mid-session,
    and the test-suite-wide `actingAs()` override).
