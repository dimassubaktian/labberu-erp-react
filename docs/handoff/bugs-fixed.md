# Bugs fixed along the way (worth knowing about)

Part of the `docs/handoff/` detail set — see `HANDOFF.md` at the repo root for the index.

- **Soft-delete + unique constraint bug**: `workforces.email` had a plain DB-level
  `->unique()` index. App-level validation correctly allowed reusing a soft-deleted record's
  email, but the raw `INSERT` still hit the DB constraint. Fixed via a partial unique index
  (`where deleted_at is null`) — SQLite supports this natively. Use this pattern proactively
  for any future unique+soft-deletable column. See `docs/handoff/crud-pattern.md`.
- **Fast Refresh / HMR gotcha**: renaming a top-level `const`/`function` in a file already
  loaded in the browser can leave Vite's Fast Refresh in a broken state. Fix is a hard
  browser refresh or restarting the dev server — not a real code bug.
- **`#[Fillable]` silently drops unlisted columns**: happened twice — once for `Quotation`'s
  `root_quotation_id`/`version_major`/`version_minor`/`is_current` after adding the
  revisioning columns without updating the attribute list, causing revision creation to
  silently fail to set them (no error, just wrong data). Always update `#[Fillable]` in the
  same change that adds a mass-assigned column. See `docs/handoff/quotations.md`.
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
  `RevisionTest.php` → `'a non-current quotation cannot be revised'`. See
  `docs/handoff/quotations.md`.
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
  got silently dropped in the rewrite. See `docs/handoff/purchase-orders.md`.
- **`PurchaseOrderController::store()` didn't capture the transaction's return value**: the
  `DB::transaction(function () use ($data): PurchaseOrder { ... return $purchaseOrder; })` call
  wasn't assigned to a variable, so `to_route('purchase-orders.show', $purchaseOrder)` after it
  referenced an undefined variable. Caught by the "redirect to detail page after create" rule
  requiring the created record's route-key — always assign `$x = DB::transaction(...)` when the
  redirect needs something the closure created.
- **Async combobox nested-route binding by numeric `id` instead of `uuid`**: the Project→
  Quotation cascading picker (`docs/handoff/purchase-orders.md`) called the nested
  `projects/{project}/quotations` endpoint using the numeric `id` returned by
  `ProjectController::search()`, but `Project`'s route key is `uuid` — 404'd until `uuid` was
  added to the search endpoint's select list and the frontend switched to using it. General
  lesson: any endpoint reached via route-model-binding on a UUID-keyed model needs the picker's
  search response to actually include that UUID, not just the numeric id used for FK
  validation. **Recurred** when wiring the GRN item picker: the PO create/edit form's
  `quotationId` state is the numeric id (used for form submission), but the new
  `purchase-orders/{purchaseOrder}/items` endpoint needed the PO's uuid — fixed the same way,
  by tracking both id and uuid in separate state. See `docs/handoff/async-combobox.md`.
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
  had it) — fixed at the same time. See `docs/handoff/async-combobox.md`.
