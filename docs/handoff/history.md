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
35. **Table header standout background** — the shared `TableHeader` component
    (`resources/js/components/ui/table.tsx`) gained `bg-muted`, matching the existing
    `AppSidebarHeader`'s treatment (`bg-muted` on the page header). Applies to every table in
    the app at once since none of the ~35 call sites override `TableHeader`'s className.
36. **Appearance (light/dark) shortcut in the user nav dropdown** — `UserMenuContent`
    (`resources/js/components/user-menu-content.tsx`) gained a single toggle menu item between
    Settings and Log out (Sun/Moon icon, flips `resolvedAppearance` via the existing
    `useAppearance()` hook) so users don't have to visit Settings → Appearance just to swap
    light/dark. Deliberately a simple two-way toggle, not a submenu or inline 3-way control —
    `system` mode is still only reachable from the full Settings page. Also got `cursor-pointer`
    added, since the base `DropdownMenuItem` intentionally defaults to `cursor-default` (native
    OS-menu convention) which read wrong for a button-like action.
37. **Demo dataset seeders built for a client demo** — 8 new/extended seeders covering Roles
    (8 roles, least-privilege permission matrix), Users (8 demo logins), Job Titles, Workforces
    (linked to the demo users), Currencies (ASEAN + USD), Taxes (Indonesian PPN/PPh types),
    Products (electrical panel + solar equipment catalog), Vendors, and Customers. Uncovered and
    fixed a real bug along the way: `DatabaseSeeder`'s `WithoutModelEvents` trait was silently
    disabling every model's `uuid`/code auto-generation for **every** seeder called via
    `$this->call([...])`, not just its own inline code — removed the trait. See
    `docs/handoff/demo-seeder.md` for the full permission matrix, demo credentials, and the
    vendor/customer "legal suffix goes last" naming convention.
38. **Searchable Person in Charge picker + redirect-to-detail after Project create** — new
    `resources/js/components/combobox.tsx` (`Combobox<T>`), a local-filtering sibling of
    `async-combobox.tsx`: same `Popover`+`Command` structure/styling, but filters an
    already-loaded `options` array via cmdk's built-in `shouldFilter` instead of debouncing a
    server search. Added because Project's Workforce list for the Person in Charge field is
    already fetched in full by `ProjectController::create()`/`::edit()` (no pagination) — a
    server search endpoint would've been unnecessary round-trip overhead. Wired into
    `projects/create.tsx` and `edit.tsx`, replacing the old plain `<Select>` for
    `person_in_charge_id`. Separately, `ProjectController::store()` now redirects to
    `projects.show` (the newly created project) instead of `projects.index`, matching
    `update()`'s existing behavior — landing on the record you just touched rather than the
    list. `tests/Feature/Projects/StoreTest.php`'s two redirect assertions updated to match.
39. **Dark-mode border/contrast fixes batch** — started as matching two "boxed section"
    borders (Project's Attachments form/rows in `projects/show.tsx`, and the Quotation
    line-item entry form — `LineItemForm` in `quotations/create.tsx`/`edit.tsx`) to the
    `Table` component's border color (`border-border/50`) instead of the older
    `border-sidebar-border/70`/`dark:border-sidebar-border` convention, for visual consistency
    with tables elsewhere. That surfaced a real dark-mode design-token bug in
    `resources/css/app.css`: `.dark`'s `--border` was defined as the *exact same* oklch value
    as `--card`/`--muted`/`--popover`/`--secondary`/`--input`, so any `border-border` element
    sitting on a card/muted surface was invisible regardless of opacity (alpha-blending a
    color with itself is a no-op). Fixed by lightening `.dark`'s `--border`
    (`oklch(0.366 0.071 160.779)` → `oklch(0.479 0.071 160.779)`, same hue/chroma) — a global
    token fix chosen by the user, so it also fixes table borders app-wide, not just the two
    spots above. Separately, `text-destructive` (used ~39 times across 22 page files for
    Danger Zone card titles, delete icons, row-error text) had the same root problem —
    `--destructive` (0.396) barely differs from `--card`/`--background` in dark mode. Since the
    user wanted the destructive `Button`'s background (which also reads `--destructive`) left
    untouched, this one was fixed text-only instead of via the token: appended
    `dark:text-destructive-foreground` to every `text-destructive` occurrence, reusing the
    existing `--destructive-foreground` token (already lighter in dark mode, identical to
    `--destructive` in light mode, so light mode is visually unchanged).
40. **Goods/service type badge on product pickers** — every `AsyncCombobox<ProductOption>`
    product picker (Quotations, Purchase Orders, BOMs — create and edit — plus the "Import from
    BOM" dialog on Purchase Orders) now shows a capitalized `Badge` for the product's `type`
    (`goods`/`service`) next to its label in the dropdown list, matching how `products/index.tsx`
    already displays it. Used `AsyncCombobox`'s existing `renderOption` prop rather than adding
    new API surface. Backend: `ProductController::search()` now selects `type` (it filtered by
    type already, via `stock-adjustments/create.tsx`'s `type: 'goods'` query param, but never
    returned the column); `QuotationController::bomItems()` also had to start eager-loading
    `product.type` since the BOM-import dialog builds its own `ProductOption`-shaped object from
    that endpoint's response. `stock-adjustments/create.tsx` was deliberately left out — it
    already filters to `type: 'goods'` only, so every result would show the same badge.
41. **Removed `Card` wrapping from every page in favor of plain `<div><h2>` sections**, to give
    small-screen forms more horizontal room — `Card`'s `border py-6 shadow-sm` plus
    `CardHeader`/`CardContent`'s `px-6` padding was eating a lot of width on top of each page's
    own `p-4` container padding. Started as a user-requested POC on `quotations/create.tsx`
    only; once approved, rolled out to the remaining 29 files that imported `Card`
    (`resources/js/components/ui/card.tsx` itself is untouched — still used by the sign-in/2FA
    auth pages, which were out of scope). The straight swap (`Card`/`CardHeader`/`CardTitle`/
    `CardContent` → `<div className="space-y-6"><h2 className="text-base font-semibold">Title</h2>…</div>`,
    reusing `CardContent`'s original spacing className, or `mb-4` on the `<h2>` if it had none)
    covered most sections, but four repeatable exceptions needed different treatment so meaning
    wasn't silently lost: a "Danger Zone" section keeps a `border-destructive/50` bordered `div`
    (the red border is a deliberate warning cue, not decoration — new convention, see
    `docs/handoff/conventions.md`); a section header with an inline action button (PO's Line
    Items/Discounts, GRN button on PO/Project show pages) wraps the `<h2>` and button in a
    `flex items-center justify-between` row; a headerless "container" Card (the `Tabs` wrapper on
    `quotations/show.tsx`, the avatar/name hero row on `workforces/show.tsx`) just drops the
    `Card` entirely with no heading added; and `roles/create.tsx`/`edit.tsx`'s permission-module
    cards — genuinely laid out side-by-side in a `sm:grid-cols-2` grid, where the border is the
    only thing separating adjacent modules — kept a plain `border-border/50` bordered `div`
    instead of dropping the border outright. `boms/show.tsx`'s `SubgroupCard` component, which
    already conditionally rendered as a `Card` only when top-level (vs. a plain `<h4>`-headed
    `div` when nested, to avoid double-boxing), had only its top-level branch converted, matched
    to the nested branch's existing `<h4>` heading level rather than introducing a mismatched
    `<h2>`. One file (`roles/show.tsx`) was missed off the initial file-list plan and caught
    during final verification — worth double-checking `grep -rl "from '@/components/ui/card'"
    resources/js/pages` after any future batch like this rather than trusting a hand-built list.
    Execution note: the work was split across 6 parallel background agents by file group; the
    first attempt used `isolation: "worktree"` for each, which silently created every worktree
    from a stale commit (missing the Roles feature and all in-session uncommitted changes) — one
    batch failed outright, the rest were killed before finishing. Re-running the same 6 agents
    without worktree isolation (safe here since each batch touched a disjoint file set, so no
    real conflict risk) completed cleanly. Verified with `tsc --noEmit` and `eslint` across
    `resources/js/pages` (both clean) plus a live Vite dev server whose HMR log showed zero
    compile errors across every touched file.
42. **Product picker label reformatted to `[Type] Name` + consolidated into a shared helper** —
    previously each of the 7 product pickers (Quotations/Purchase Orders/BOMs create+edit, Stock
    Adjustments create) independently copy-pasted its own `productLabel()` function and
    `ProductOption` type, hand-edited three times across items 30, 40, and this one. Extracted a
    single `resources/js/lib/product-options.ts` exporting `ProductOption` (the full column set
    `ProductController::search()` returns) and `productLabel()`, imported by all 7 call sites —
    future label tweaks now need one edit instead of seven. Label went through two revisions in
    this session: first `[Type] Name (Code)` with `(Reference)` appended when present, then the
    user asked to drop the code entirely, landing on `[Type] Name` / `[Type] Name (Reference)`.
    The per-row type `Badge` added in item 40 was removed from `renderOption` since type is now
    in the label text itself — showing it twice was redundant; `AsyncCombobox` falls back to
    `getOptionLabel` for row rendering when `renderOption` is omitted, so no other markup changed.
    Consolidating the type onto one shared shape surfaced a latent gap: `import-bom-items-dialog.tsx`'s
    `ImportedBomItem.initialProduct` had its own narrower inline type (missing `brand`/`price`),
    which only became a `tsc` error once Purchase Orders switched to the shared `ProductOption` —
    fixed by widening it to the shared type and filling `brand` from the BOM item row (`price`
    defaults to `'0'`, unused in the PO flow). Verified with `tsc --noEmit`, `eslint`, `prettier
    --check`, and `npm run build` (all clean) after each revision; no backend or test changes
    needed since the label is pure frontend display logic.
43. **Quotation line-item table containers matched to the `border-border/50` convention** — the
    two `<Table>`-wrapping `<div>`s on `quotations/create.tsx`/`edit.tsx` (ungrouped items table,
    per-group items table) were still on the older `border-sidebar-border/70
    dark:border-sidebar-border` convention that item 39 had already migrated other elements away
    from. Swapped to `border-border/50` in all 4 spots (2 per file); `rounded-lg` and everything
    else in the className left untouched — pure Tailwind class change, no test needed.
44. **Currency field disabled on Quotation create/edit, auto-selection kept** — the `currency_id`
    `Select` on both pages is now `disabled`; the pre-existing hidden `<input name="currency_id">`
    still carries the value (base-currency default on create, the quotation's existing currency
    on edit) into form submission unchanged, so the field still auto-selects and submits, it's
    just no longer user-editable.
45. **Searchable "Overall tax" picker on Quotation create/edit** — replaced the quotation-level
    `tax_id` `Select` (label "Overall tax"; the per-group "Tax" selects inside item groups were
    left alone, out of scope) with the existing local-filtering `Combobox` component
    (`resources/js/components/combobox.tsx`, previously only used for Project's Person in Charge
    field — see item 38). `docs/handoff/async-combobox.md` explicitly keeps small bounded
    reference data like Taxes on a full-list picker with no server round-trip; `Combobox` adds
    typeahead search on top of the already-loaded `taxes` prop without turning it into a
    server-searching `AsyncCombobox`, which stays reserved for genuinely high-cardinality data.
    A small derived `taxOptions` array (`{ id: 'none', label: 'No tax' }` prepended to the mapped
    tax list) preserves the existing `'none'` sentinel the hidden `tax_id` input already relied
    on — no controller/backend change needed.
46. **New `quotations.approval` permission gates Quotation approve/reject specifically** —
    previously all quotation status transitions (submit, approve, reject, cancel, void) shared
    one blanket `quotations.status.update` permission via the single generic `PATCH quotations/
    {quotation}/status` route, with no way to let someone submit/cancel without also being able
    to approve/reject. Added `'approval'` to the `quotations` list in `database/data/
    permissions.php` (auto-flows through `PermissionSeeder` and the Roles admin UI, no frontend
    change needed there), then extended `QuotationStatusUpdateRequest::authorize()` — previously
    a blanket `return true;` — to require `quotations.approval` specifically when the submitted
    `status` is `approved` or `rejected`, leaving every other transition governed by the existing
    route-level `quotations.status.update` middleware alone. Kept as a single shared route/request
    rather than splitting into dedicated `approve`/`reject` routes (the way Purchase Order does
    with two separate permissions) since the user wanted one shared permission for both, and
    `show.tsx`'s `statusActions()` already submits every transition through one generic `Form` —
    splitting the route would have meant restructuring that loop for no benefit. This is the same
    "business-rule guard inside `authorize()`" escape hatch `docs/handoff/rbac.md` already
    documents for `UserUpdateRequest`'s self-lockout check, and that
    `tests/Feature/Permissions/EnforcementTest.php` explicitly calls out `status.update` as
    relying on rather than the generic per-route pass/fail check. 4 new tests added to
    `tests/Feature/Quotations/StatusUpdateTest.php` (denied without the permission on both
    approve and reject, unaffected on a non-approval transition, succeeds once granted). See
    `docs/handoff/rbac.md`.
47. **Tax option display reordered to "(rate) name"** — every tax `<SelectItem>`/`Combobox`
    option across `invoices/create.tsx`/`edit.tsx`, `purchase-orders/create.tsx`/`edit.tsx`,
    and `quotations/create.tsx`/`edit.tsx` (both the per-group `Select` and the header-level
    `taxOptions` array feeding the "Overall tax" `Combobox` from item 45) previously read
    `{tax.name} ({rate}%)`, e.g. "PPN (11%)". Flipped to `({rate}%) {tax.name}` so the rate is
    the leading, scannable part. Pure display-string change, no prop/type/backend changes.
48. **Quotation & BOM line-item "Unit" field converted from free text to a fixed `Select`** —
    to cut down on typos (`pcs` vs `Pcs` vs `PC`), the `unit` `<Input>` inside `LineItemForm`
    on `quotations/create.tsx`/`edit.tsx` and `boms/create.tsx`/`edit.tsx` was replaced with a
    `<Select>` bound to the same hardcoded `units` list already used on
    `products/create.tsx`/`edit.tsx` (`Pcs, Unit, Set, Box, Roll, Meter, Kg, Liter, Pack,
    Other`). Backend validation tightened to match: `items.*.unit`/`groups.*.items.*.unit` in
    `QuotationStoreRequest`/`QuotationUpdateRequest`, and the shared `itemRules()` helper's
    `unit` rule in `BomStoreRequest`/`BomUpdateRequest`, changed from `['required', 'string',
    'max:50']` to `['required', 'string', 'in:Pcs,Unit,Set,Box,Roll,Meter,Kg,Liter,Pack,Other']`
    — the same plain-string `in:` format `ProductStoreRequest`/`ProductUpdateRequest` already
    used for `unit`. Confirmed safe before tightening: both `quotation_items` and `bom_items`
    had zero rows, and every existing factory/test already hardcoded `unit => 'Pcs'`.
49. **Workflow/Progress action sections moved above Details on the Quotation detail page** —
    on `quotations/show.tsx`, the "Workflow" (status transition buttons) and "Progress"
    (progress-advance buttons) blocks previously rendered *after* the "Details" card. Moved
    both (in the same order) to sit directly under the page heading/action-button row and
    above Details, so available actions are visible without scrolling. Pure JSX reordering —
    no logic, prop, or styling changes to either block.
50. **Approve/Reject buttons hidden from users without `quotations.approval`** — bug: the
    backend was already correctly gated (`QuotationStatusUpdateRequest::authorize()` requires
    `quotations.approval` for `approved`/`rejected`, see item 46), but `show.tsx`'s
    `statusActions()` decided which buttons to render purely from the quotation's `status`,
    with no awareness of the viewer's permissions — so Approve/Reject rendered for everyone
    and clicking dead-ended in a 403. Fixed by reading `usePage().props.auth.permissions` in
    `QuotationsShow` (the same `auth.permissions` share already used by
    `app-sidebar.tsx` for nav-item gating, see `docs/handoff/rbac.md`'s "Sidebar gating"
    section) and filtering the `approved`/`rejected` entries out of `actions` when the
    permission is absent. UI-only defense-in-depth, matching the sidebar's documented pattern
    — the route/request-level gate remains the real enforcement.
51. **New "Cancel Request Approval" transition (Request for Approval → Draft)** — previously
    `Quotation::TRANSITIONS['request_for_approval']` allowed a direct `cancelled` transition
    (same "Cancel Quotation" button shown in `draft`). Per the user's requested workflow, a
    pending-approval quotation can no longer be cancelled outright: `cancelled` was removed
    from that transition list and replaced with `draft`, surfaced in `show.tsx`'s
    `statusActions()` as a new **red/`destructive`** "Cancel Request Approval" button (no
    extra permission — same as every other non-approval transition, gated only by the base
    `quotations.status.update` route permission). "Cancel Quotation" still shows in `draft`
    only now. 2 new tests added to `tests/Feature/Quotations/StatusUpdateTest.php` (RFA→draft
    succeeds; RFA→cancelled now rejected). `docs/handoff/quotations.md`'s workflow line updated
    to match.
52. **Read-only relation display fields restyled to match adjacent form controls** — the
    locked "Project"/"Quotation"/"Purchase order" `<p>` boxes shown instead of an editable
    field on 5 edit pages (`quotations/edit.tsx`, `purchase-orders/edit.tsx`,
    `invoices/edit.tsx`, `delivery-orders/edit.tsx`, `goods-receipt-notes/edit.tsx`) used
    `border-sidebar-border/70 dark:border-sidebar-border` (this app's divider/panel-border
    color) instead of `border-input` (the actual `Select`/`Input`/`Textarea` border token),
    which stood out next to sibling form fields — fixed by swapping the className on all 5.
    Separately, on the two pages where that box sits beside a `Select` in the same
    `sm:grid-cols-2` row (`quotations/edit.tsx`'s Project+Currency row,
    `purchase-orders/edit.tsx`'s Project+Quotation row), CSS Grid's default `align-items:
    stretch` made the `Select` column stretch to match whenever a long project/customer name
    wrapped the `<p>` to two lines — added `items-start` to those two row `<div>`s so each
    column sizes independently and both stay top-aligned instead. Both are pure Tailwind
    class changes, no test impact.
53. **Quotation progress: "accepted" renamed to "signed"; "converted" removed, manual
    progress capped at Signed** — two related changes to `Quotation::PROGRESS_TRANSITIONS`
    (`sent → accepted → converted → partially_delivered/fully_delivered`) and `show.tsx`'s
    `progressActions()`. First, `accepted` was renamed to `signed` throughout (model map,
    button label "Mark as Signed", confirm dialog text, `ProgressUpdateTest.php`,
    `progress-tracking.md`, `HANDOFF.md`) — no other code depended on the literal string, and
    no existing quotation had `progress = 'accepted'` in the database, so this was a clean
    rename. Second, after clarifying that `converted` had **no automatic trigger anywhere**
    (a manual-only note that nothing read or gated on) while `partially_delivered`/
    `fully_delivered` were **already** auto-derived by
    `DeliveryOrderController::updateQuotationProgress()` on every DO confirmation (bypassing
    the manual-gate validation entirely) yet *also* manually clickable, the user opted to
    remove `converted` outright and make the two delivery stages automatic-only.
    `PROGRESS_TRANSITIONS` was trimmed to `'' => ['sent'], 'sent' => ['signed'], 'signed' =>
    []`, and `progressActions()` now only returns actions for `null`/`sent` — the manual
    chain terminates at Signed, while DO confirmation can still push progress straight to
    `partially_delivered`/`fully_delivered` since that code path never consulted the
    transitions map. `docs/handoff/progress-tracking.md` and `docs/handoff/delivery-orders.md`
    updated to describe the new automatic-only shape; `ProgressUpdateTest.php`'s
    sent→accepted→converted test rewritten to assert `signed → converted` is now rejected.
