# Async search comboboxes — Customer / Project / Product pickers

Part of the `docs/handoff/` detail set — see `HANDOFF.md` at the repo root for the index.

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
`VendorController`, added for Purchase Orders — see `docs/handoff/purchase-orders.md`) gained a
`search(Request $request): JsonResponse` action — `?q=` matched against name *or* code (`LIKE
'%...%'`), capped at 20 results, ordered the same way the existing `index()`/`create()` queries
were. Routes are `GET {resource}/search`, registered **before** the `{resource}` wildcard route
(same static-before-wildcard rule as everywhere else in `routes/web.php`). Product's search also
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

**`ProductController::search()` also matches `reference_number`** (added later — see
`docs/handoff/history.md` item 30) — additive to the existing name/`product_code` `LIKE` match,
same three-way `orWhere` clause. Every `AsyncCombobox<ProductOption>` call site's
`getOptionLabel` shows the reference number in parentheses when present.

**Product pickers also show a goods/service type badge** (see `docs/handoff/history.md` item
40) — `renderOption` (already part of `AsyncCombobox`'s API, previously unused) renders the
label plus a capitalized `Badge` for `product.type`. `ProductController::search()`'s selected
columns and `QuotationController::bomItems()`'s eager-loads both had to add `type` for this.
