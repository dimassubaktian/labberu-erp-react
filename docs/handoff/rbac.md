# Users, Roles & RBAC enforcement

Part of the `docs/handoff/` detail set — see `HANDOFF.md` at the repo root for the index.

## What this closed

Two long-standing gaps from `HANDOFF.md`'s "not built yet" list, deliberately closed together:
the missing Users/Roles admin UI, and RBAC (`spatie/laravel-permission`, installed since early
in the project per `docs/handoff/history.md` item 4) actually being enforced anywhere.

## User ↔ Workforce link

`workforces.user_id` (nullable, unique, **no DB-level foreign key** — see the SQLite gotcha
below) — `Workforce::user(): BelongsTo`, `User::workforce(): HasOne`. Workforce is the "owning"
side: most workforce members have no login; a `User` account may or may not be linked to an
employee profile (e.g. admin-only accounts). `UserController::store()`/`update()` handle
linking/unlinking transactionally — relinking a user to a different workforce nulls out the
previous workforce's `user_id` first.

`User` also adopted this app's `uuid` + `getRouteKeyName()` convention (like every other model)
and gained `SoftDeletes` and a `status` (`active`/`inactive`) column — none of which existed
before. `Auth::id()`, sessions, and the 4 existing `belongsTo(User::class, ...)` FKs
(`Quotation::approver`, `InvoicePayment::recordedBy`, `ProjectAttachment::uploader`,
`StockAdjustment::adjustedBy`) still use the numeric `id`, unaffected.

## Permission naming & enforcement mechanism

Convention: `{module}.{action}` where `module` matches the route-name prefix and `action` is
`view`/`create`/`update`/`delete` for standard CRUD routes, or the literal route-name suffix for
custom workflow routes (`status.update`, `issue`, `approve`, `confirm`, etc.) — see
`database/data/permissions.php` for the exact per-module action list (not a blanket CRUD
assumption; several modules have fewer actions, e.g. `stock-movements` is `view`-only).
`PermissionSeeder` flattens that file into `Permission::findOrCreate()` calls; `RoleSeeder`
creates a `Super Admin` role with every permission; `DatabaseSeeder` assigns it to the seeded
`Test User` **and** backfills it onto any pre-existing roleless account (so a developer's own
login isn't locked out the first time this seeds against an existing local database).

**Enforcement is route-level, not controller/policy-level** — every route in `routes/web.php`
got `->middleware('permission:{name}')` appended **in place, one line at a time**, without
reordering anything. This was a deliberate correction mid-build: regrouping routes into
`Route::middleware(...)->group()` blocks by permission would reorder wildcard routes (`show`)
ahead of later static ones (`create`), reintroducing the exact static-before-wildcard bug
`docs/handoff/crud-pattern.md` already warns about. No policy classes were created — 16+ policy
classes for a pure "does this user have permission X" check would have been pure boilerplate
next to route middleware, especially since these aren't resource controllers.

## Self-lockout guards

`UserUpdateRequest::authorize()` blocks deactivating your own account or submitting an empty
`roles` array while editing yourself (403, not a validation error — matches the existing
"business-rule guard belongs in `authorize()`" convention). `UserController::destroy()` blocks
deleting your own account. Roles have no equivalent guard — only a "can't delete a role that's
still assigned to a user" check, same shape as `JobTitleController`'s reference guard.

## Sidebar gating

`HandleInertiaRequests::share()` now sends `auth.permissions` (flat string array, from
`getAllPermissions()->pluck('name')`). `app-sidebar.tsx`'s `mainNavGroups` moved from a
module-level `const` into `AppSidebar()` so it can read `usePage().props.auth.permissions`;
items without a matching permission are filtered out, and any nav **group** left with zero
items is dropped entirely (e.g. the whole "HR" group disappears without `job-titles.view` or
`workforces.view`). This is UI-only defense-in-depth — the real gate is the route middleware.

## Roles UI: the checkbox-group pattern

No multi-select/checkbox precedent existed in this codebase before this. Both Users (role
assignment, flat list) and Roles (permission assignment, grouped by module in Cards) use the
same technique: local `number[]` state, one hidden `<input type="hidden" name="roles[]">` (or
`permissions[]`) per selected id, rendered as siblings inside the `<Form>` — the direct
extension of the already-established "Radix `Select` isn't a native form control, needs a
hidden input" pattern, just repeated per array element instead of once.

## Login gating for inactive accounts

`FortifyServiceProvider` registers a custom `Fortify::authenticateUsing()` callback (previously
absent — Fortify used its default pipeline) that checks credentials manually and throws a
validation error if `status === 'inactive'`. Soft-deleted accounts are rejected for free since
the `User::where('email', ...)` lookup already excludes trashed rows.

## Test suite: the `actingAs()` override

Every existing Feature test (~80+ files across 16 modules) calls `$this->actingAs($user)` with
a plain factory user and zero permission setup — all written before routes were gated. Rather
than touch every file, `tests/TestCase.php` overrides `actingAs()`: it **always** runs
`PermissionSeeder` (idempotent via `findOrCreate`, so cheap to call unconditionally — an
earlier version only seeded `if (Permission::count() === 0)`, which broke any test that created
one ad-hoc `Permission` before its first `actingAs()` call, since that made the count non-zero
and skipped seeding the rest) and grants the acting user every permission. Tests needing a
deliberately limited user call `$user->syncPermissions([...])` **after** `actingAs()` to
override the blanket grant (calling it before is silently undone by the override). `tests/Pest.php`
also clears spatie's permission cache in a global `beforeEach()` — the `array` cache driver used
in tests persists for the process lifetime while `RefreshDatabase` rolls back each test's
transaction, so a `Permission`/`Role` row from one test can otherwise appear to still exist (or
vanish) in the next.

`tests/Feature/Permissions/EnforcementTest.php` is dataset-driven (a loop generating one
`test()` per route, not a literal hand-written case per route) covering every module's `.view`
and `.create` routes — workflow/action routes (approve, confirm, etc.) share the same
`permission:` middleware mechanism already proven there and weren't re-verified individually,
since several also carry business-rule guards that would confound a generic pass/fail check.

## A real SQLite migration gotcha hit while building this

Adding `workforces.user_id` with a real DB-level foreign key (`->constrained()`) corrupted the
table mid-migration: SQLite has no `ALTER TABLE ADD CONSTRAINT`, so Laravel rebuilds the whole
table to add one — and that rebuild silently drops the `WHERE` clause on
`workforces_email_active_unique` (the partial index from `docs/handoff/bugs-fixed.md`'s
soft-delete-unique fix), turning it into a plain unique index. On this dev machine that surfaced
immediately as a migration failure (a real duplicate active+trashed email already existed), but
on a fresh empty database it would have silently succeeded while leaving the **wrong** index in
place — reintroducing the exact bug that partial index exists to prevent, invisibly, only to
resurface later when someone actually soft-deletes-and-reuses an email. Fixed by **not** giving
`workforces.user_id` a real FK constraint — just a plain column + a manually-created
`CREATE UNIQUE INDEX` (same raw-`DB::statement` pattern already used for the partial indexes
elsewhere), which doesn't trigger a table rebuild at all. Referential integrity for this link is
enforced at the application layer (`UserController`) instead. Worth remembering before adding
any future FK column to a table that already has a raw partial index.
