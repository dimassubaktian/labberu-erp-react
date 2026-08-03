# Stock Adjustments — manual corrections, third source into the same ledger

Part of the `docs/handoff/` detail set — see `HANDOFF.md` at the repo root for the index.

Built immediately after Stock Movements (`docs/handoff/stock-movements.md`), in a session
where a parallel `/subtask` background agent interviewed the user on this module's shape
*while* the main agent built Stock Movements — the two modules were designed together even
though implemented sequentially.

**Decided in that interview (all recommended defaults)**:
1. **Single-step, immediate effect on save** — no draft/confirm ceremony like GRN/DO, since an
   adjustment is a quick correction, not goods arriving/leaving over a process. Reflected in
   the controller having only `index`/`create`/`store` — no `edit`/`update`/`destroy`/`show`.
2. `type` (`increase`/`decrease`) + `quantity` — mirrors `StockMovement`'s own `in`/`out`
   vocabulary rather than a signed-number field.
3. **Fixed reason list** — `Stock Count Correction`/`Damage`/`Loss or Theft`/`Initial Stock
   Load`/`Other`, validated via a plain `in:...` rule (matching `Product`'s own
   brand/unit-list precedent, not `Rule::in()` — see `ProductStoreRequest`), plus an optional
   free-text `note`.
4. **Writes into the existing `stock_movements` table as a third source** — see the
   `stock_adjustment_id` FK in `docs/handoff/stock-movements.md` — so
   `StockMovement::quantityOnHandFor()` stays the single source of truth for on-hand quantity;
   there is no second, competing ledger.

**Design defaults not covered by the interview** (flagged for visibility, following clear
precedent rather than asked): `adjusted_by` is a **User** (`auth()->id()`, never
user-selected — enforced by the controller overwriting whatever the client sends), matching
`InvoicePayment.recorded_by`'s precedent (`docs/handoff/invoices.md`), not the
`Workforce`-picker convention used for GRN/DO/PO signatures — this is a digital correction
entry by whoever's logged in, not a signature on a physical paper form. No separate "effective
date" field — `created_at` **is** the effective moment, since adjustments take effect
immediately.

**Schema** (`stock_adjustments`): `product_id`, `type`, `quantity`, `reason`, `note`
(nullable), `adjusted_by` (FK `users`), `timestamps()`. Same "no `uuid`, no `softDeletes()`"
omission as `StockMovement`, for the same reason — no show/edit/delete page exists.

**`StockAdjustmentController::store()`** — inside a `DB::transaction()`: creates the
`StockAdjustment` (`adjusted_by` always taken from `$request->user()->id`, ignoring anything
the client submits under that key), then immediately creates the matching `StockMovement`
(`type: increase → in, decrease → out`, `movement_date: now()->toDateString()`,
`stock_adjustment_id` set) — same shape as `createStockMovements()`
(`docs/handoff/stock-movements.md`), just synchronous with the create instead of gated behind
a separate confirm step. Redirects to `stock-adjustments.index`, not a detail page — there
isn't one.

**`ProductController::search()` extended additively** with an optional `?type=` query filter
(`goods`/`service`) — every existing caller that omits it keeps today's unfiltered behavior.
The Stock Adjustment create form is the first consumer, passing `?type=goods` since service
products have no physical stock to adjust (same reasoning already applied to Stock Movement
creation above).

**`stock-movements/index.tsx`'s Source column** gained a third case for adjustment-sourced
rows: plain text ("Adjustment — {reason}"), not a link, since there's no per-adjustment page
to send it to.
