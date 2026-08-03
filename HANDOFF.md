# Labberu ERP — Session Handoff (index)

This document summarizes work from previous sessions so a new conversation can pick up where
it left off. It's an index only — full detail for each topic lives in `docs/handoff/*.md`.
**When a task touches one of the topics below, `Read` the linked file rather than assuming
this index has enough detail.** Not permanent project documentation — feel free to delete
once no longer needed.

## Project

Laravel 13 + Inertia v3 + React 19 starter kit (`laravel/react-starter-kit`), being turned
into "Labberu ERP" — an internal ERP system. Stack: Fortify (auth), Inertia React, Tailwind
v4, shadcn/ui-style components (hand-copied into `resources/js/components/ui/`, not managed
by the shadcn CLI), Pest for tests, Pint for formatting, Larastan for static analysis,
SQLite for the database. Laravel Boost MCP is configured — prefer its tools (`search-docs`,
`database-schema`, `database-query`, `browser-logs`, etc.) over manual equivalents.

## Detail docs (`docs/handoff/`)

- [`history.md`](docs/handoff/history.md) — full chronological log of what's been done,
  session by session (31 numbered items).
- [`crud-pattern.md`](docs/handoff/crud-pattern.md) — the established CRUD pattern every
  simple module follows (migration/model/request/controller/routes/pages/tests shape).
- [`quotations.md`](docs/handoff/quotations.md) — status workflow, revisioning, item groups,
  two-layer totals, line-item edit UX.
- [`bom.md`](docs/handoff/bom.md) — Bill of Materials cost tiers, groups/subgroups, discount
  multiplier semantics.
- [`project-attachments.md`](docs/handoff/project-attachments.md) — file uploads on Project.
- [`async-combobox.md`](docs/handoff/async-combobox.md) — searchable Customer/Project/Product
  pickers, `AsyncCombobox` component, backend `search()` endpoints.
- [`purchase-orders.md`](docs/handoff/purchase-orders.md) — cascading discounts,
  issuer/checker/approver sign-off workflow, Project→Quotation cascading picker.
- [`progress-tracking.md`](docs/handoff/progress-tracking.md) — the `progress` field on
  Quotation/PO, separate from `status`.
- [`grn.md`](docs/handoff/grn.md) — Goods Receipt Notes, per-item PO progress derivation.
- [`delivery-orders.md`](docs/handoff/delivery-orders.md) — Delivery Orders, sales-side
  mirror of GRN.
- [`invoices.md`](docs/handoff/invoices.md) — the first financial module, payment tracking.
- [`stock-movements.md`](docs/handoff/stock-movements.md) — auto-generated inventory ledger.
- [`stock-adjustments.md`](docs/handoff/stock-adjustments.md) — manual stock corrections.
- [`bugs-fixed.md`](docs/handoff/bugs-fixed.md) — notable bugs hit and fixed, worth knowing
  before repeating the same mistake.
- [`conventions.md`](docs/handoff/conventions.md) — explicit user preferences/conventions
  that cut across modules (button colors, workflow patterns, when to interview first, etc).

## Modules built so far (in this order)

1. **Job Titles** (`job_titles`) — `name`, `status`. Full CRUD. Has a `workforces()`
   hasMany relation used on its detail page, and a delete restriction: blocks deletion if
   any workforce member is assigned to it.
2. **Workforces** (`workforces`) — employee records, photo upload on private `local` disk.
   Full CRUD.
3. **Currencies** (`currencies`) — `iso_code`, `name`, `symbol`, `status`, `base_currency`
   flag (see `docs/handoff/history.md` item 29). Full CRUD, no relations.
4. **Taxes** — percentage/fixed tax rates used by Quotations.
5. **Customers** — used by Projects and Quotations' code generation.
6. **Vendors** — Purchase-side master data.
7. **Products** (`products`) — `product_code`, `reference_number`, `price`/`cost`,
   `type` (`goods`/`service`), `status`. Full CRUD, used as line-item source in Quotations.
8. **Projects** (`projects`) — customer/PIC, dates, status/priority, cost/value fields.
   Full CRUD. Has Quotations and Attachments cards on its detail page — see
   `docs/handoff/project-attachments.md`.
9. **Quotations** — see `docs/handoff/quotations.md`.
10. **Bill of Materials (BOM)** — zero-or-one child of a Quotation revision, see
    `docs/handoff/bom.md`.
11. **Purchase Orders** — see `docs/handoff/purchase-orders.md`.
12. **Goods Receipt Notes** — see `docs/handoff/grn.md`.
13. **Delivery Orders** — see `docs/handoff/delivery-orders.md`.
14. **Invoices** — see `docs/handoff/invoices.md`.
15. **Stock Movements** — see `docs/handoff/stock-movements.md`.
16. **Stock Adjustments** — see `docs/handoff/stock-adjustments.md`.

## What's NOT built yet (natural next steps)

- No pages/routes for: Users, Roles. Still disabled placeholders in the sidebar.
- RBAC (`spatie/laravel-permission`) is installed but nothing is actually gated by
  roles/permissions yet — no seeded roles, no policy/gate wired to any route or UI element.
  This is arguably the most important gap, and it's gotten bigger with every module built:
  approving/rejecting/voiding a quotation, purchase order, or invoice, confirming a GRN/DO,
  recording/removing a payment, or recording a stock adjustment is currently possible for
  anyone logged in.
- No API layer, no tests beyond Pest feature tests (no Dusk/browser tests). Relatedly, GRN,
  DO, Invoice, Stock Movements, and Stock Adjustments haven't been clicked through in an
  actual browser — verification for those has been HTTP/test-level only.
- No PDF/print export for **any** document (Quotation, PO, GRN, DO, or Invoice) — likely the
  single biggest missing piece for a set of modules whose whole point is producing a document
  to hand to a customer or vendor.
- `Project`'s own `status` still doesn't reflect any of its child documents' state — a
  Project can say `completed` while its only quotation is still `draft`. A real derived
  rollup (never a synced field — see `docs/handoff/progress-tracking.md` for why) is more
  feasible now that DO/GRN/Invoice all exist, but still not requested/built.
- No customer-facing acceptance step or payment portal — Quotation's `progress = 'accepted'`
  (see `docs/handoff/progress-tracking.md`) is still an internal staff member manually
  recording it, not something the customer does themselves.
- Workforce pickers (Project PIC, PO issuer/checker/approver, GRN/DO received/delivered-by)
  still use a plain full-list `Select`, not `AsyncCombobox` — deliberately deferred, worth
  revisiting if headcount grows into the hundreds.
- Stock Movements/Adjustments only track quantity, not cost — no valuation layer
  (FIFO/weighted-average/standard cost), no low-stock alerting/reorder-point concept.

## Where to resume

The full document chain is built: Project → Quotation → BOM/PO/GRN/DO/Invoice, each with
interlocking `status`/`progress` derivation, and GRN/DO confirmations feed real inventory
levels via Stock Movements, with Stock Adjustments covering manual corrections on top. Ask
the user which module or feature to build next. For a new document-style module raised
against an existing parent (the GRN/DO/Invoice shape), follow `docs/handoff/grn.md` as the
closest template — it's the most reused pattern in the app at this point. For anything
workflow/revision-like, follow `docs/handoff/quotations.md`; for nested groupings,
`docs/handoff/bom.md`; for a strictly auto-generated, no-manual-entry ledger,
`docs/handoff/stock-movements.md`; for a single-step manual-entry-only module,
`docs/handoff/stock-adjustments.md`; otherwise the base pattern in
`docs/handoff/crud-pattern.md`. Given the gaps above, RBAC enforcement and PDF/print export
are probably the two highest-leverage next picks — everything else is a new module, but
those two cut across every module already built.
