# Labberu ERP — Session Handoff

This document summarizes the work done in a previous Claude Code CLI session so a new
conversation (e.g. Claude Desktop) can pick up where it left off. This file is not meant
to be permanent project documentation — feel free to delete it once you no longer need it.

## Project

Laravel 13 + Inertia v3 + React 19 starter kit (`laravel/react-starter-kit`), being turned
into "Labberu ERP" — an internal ERP system. Stack: Fortify (auth), Inertia React, Tailwind
v4, shadcn/ui-style components (hand-copied into `resources/js/components/ui/`, not managed
by the shadcn CLI), Pest for tests, Pint for formatting, Larastan for static analysis,
SQLite for the database.

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
6. **Three full CRUD modules built end-to-end**, each following the identical pattern below.

## The established CRUD pattern (repeat this for future modules)

For a model like `JobTitle`, `Workforce`, `Currency`:

- **Migration**: `id`, `uuid` (unique, used for route-model-binding — see below), business
  columns, `status` (plain string `active`/`inactive`, no enum class), `timestamps()`,
  `softDeletes()`. If a column needs to be unique *and* the table is soft-deletable, use a
  **partial unique index** scoped to `where deleted_at is null` via `DB::statement(...)` in
  the migration — see "Bugs fixed" below for why a plain `->unique()` breaks.
- **Model**: `SoftDeletes` trait, `getRouteKeyName()` returns `'uuid'` (so all detail/edit/
  delete URLs use the UUID, not the sequential id), auto-generates `uuid` in a `booted()`
  `creating` hook, `#[Fillable([...])]` PHP attribute (not `protected $fillable`) — this is
  this project's established convention, matching the `User` model.
- **FormRequest** per action (`{Model}StoreRequest`, `{Model}UpdateRequest`) — `authorize()`
  returns `true` (no per-field authorization built yet), rules use `Rule::unique(...)->
  whereNull('deleted_at')` (and `->ignore($model->id)` on update) to match the partial index.
- **Controller**: one method per action (`index`, `create`, `store`, `show`, `edit`, `update`,
  `destroy`), NOT a resource controller class — built up incrementally, one HTTP verb/page at
  a time, in the order the user asked for them. `Inertia::flash('toast', ['type' => ...,
  'message' => ...])` on every mutating action (success or error), then `to_route(...)`.
- **Routes** in `routes/web.php` inside the existing `auth`+`verified` group. Static segments
  (like `/create`) MUST be registered before the `{model}` wildcard route or Laravel will try
  to match "create" as the route-model-bound parameter.
- **Wayfinder**: after adding routes, run `php artisan wayfinder:generate --with-form` to
  regenerate `resources/js/actions/` and `resources/js/routes/` — frontend pages import route
  helpers from `@/routes/{model-plural}` (e.g. `import { show, edit } from '@/routes/job-titles'`).
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
    explicitly), "Edit X" button once edit exists, and a "Danger Zone" `Card` (red-tinted
    warning box + a `Dialog`-based delete confirmation) once delete exists.
  - Breadcrumbs: pages with **static** breadcrumbs use `PageComponent.layout = { breadcrumbs:
    [...] }`; pages needing **per-record** breadcrumbs (detail/edit pages, since they need the
    record's name) call `setLayoutProps({ breadcrumbs: [...] })` from `@inertiajs/react`
    *inside* the component body — this is an Inertia v3 feature, don't try to fake it with a
    static assignment since that has no access to props.
- **Tests**: `tests/Feature/{ModelPlural}/{Action}Test.php` (e.g. `tests/Feature/JobTitles/
  StoreTest.php`), using Pest. Cover: page renders with correct Inertia props, successful
  mutation + redirect + `assertDatabaseHas`, full validation rule matrix, soft-deleted-record-
  name-reuse (see bug below), guest redirect to login. Run `php artisan test --compact`,
  `vendor/bin/pint --dirty --format agent`, `composer types:check` (Larastan), and on the
  frontend `npm run types:check`, `npm run lint:check`, `npm run format:check` after every
  change — all must pass before considering a task done.

## Modules built so far (in this order)

1. **Job Titles** (`job_titles` table) — `name`, `status`. Full CRUD. Has a `workforces()`
   hasMany relation used on its detail page to list assigned employees, and a real delete
   restriction: `JobTitleController::hasWorkforce()` blocks deletion if any workforce member
   is assigned to it (shows an error toast instead of deleting).
2. **Workforces** (`workforces` table) — `employee_code` (auto-generated `LAB-EMP-001` style,
   never reused even after soft-delete, unlike other unique fields), `full_name`, `email`,
   `phone`/`address` (nullable), `job_title_id` (FK), `gender` (male/female), `photo`
   (nullable), `status`. Full CRUD, plus:
   - Photo upload stored on the **private** `local` disk (`storage/app/private`), under
     `workforce-photos/` — deliberately NOT on the public disk. Served via a dedicated
     `GET workforces/{workforce}/photo` route/controller method that checks auth and 404s if
     missing, so photos are only viewable by logged-in users.
   - Photo `<img>` src includes a `?v={updated_at}` cache-busting query param (browser was
     serving a stale cached image after replacing the photo, since the URL never changed).
   - Edit page shows a live preview of a newly-selected file before submit (via
     `URL.createObjectURL`, with proper `URL.revokeObjectURL` cleanup).
   - Create/edit job-title dropdown only offers **active** job titles (plus, on edit, the
     workforce's current job title even if it's since gone inactive, so the selection is
     never silently blank).
3. **Currencies** (`currencies` table) — `iso_code` (normalized to uppercase in
   `prepareForValidation()`, exactly 3 letters), `name`, `symbol` (nullable), `status`. Full
   CRUD, no relations, no delete restriction (nothing depends on a Currency yet).

## Bugs fixed along the way (worth knowing about)

- **Soft-delete + unique constraint bug**: `workforces.email` had a plain DB-level
  `->unique()` index. The app-level validation correctly allowed reusing a soft-deleted
  record's email (`Rule::unique(...)->whereNull('deleted_at')`), but the raw `INSERT` still
  hit the DB constraint and threw `UniqueConstraintViolationException`, because a plain
  unique index doesn't know about `deleted_at`. Fixed via a new migration that drops the
  plain index and replaces it with a **partial unique index** (`where deleted_at is null`) —
  SQLite (this project's DB) supports this natively. **Currencies' `iso_code` was built with
  this partial-index pattern from the start** to avoid repeating the same bug. If you add
  more unique+soft-deletable columns to future modules, use this pattern proactively.
- **Fast Refresh / HMR gotcha**: renaming a top-level `const`/`function` in a file already
  loaded in the browser can leave Vite's Fast Refresh in a broken state (`ReferenceError:
  x is not defined` referencing a stale module version). Fix is a hard browser refresh or
  restarting the dev server — not a real code bug, just a dev-server artifact to remember.

## Conventions / preferences the user has stated explicitly

- "Back to X" buttons on detail pages: always red (`variant="destructive"`).
- No modal-based CRUD — dedicated pages only (index/create/edit/detail), except delete
  confirmation which does use a `Dialog` (that one distinction was explicit).
- Delete confirmation always lives in a "Danger Zone" card at the bottom of the detail page.
- Wants mobile/tablet/desktop responsiveness considered on every page (stacking headers,
  buttons full-width on mobile via `w-full sm:w-auto`, tables scroll horizontally via the
  shared `Table` component rather than squishing).
- Cursor should be `pointer` on all clickable buttons, `not-allowed` on disabled ones —
  fixed globally, not per-component.
- Prefers being asked when there's a genuine architectural fork (e.g. was asked about
  `gender`/`status` enum values before building Currencies/Workforces, and about how to
  handle a Workforce photo's storage/access-control before implementing it).

## What's NOT built yet (natural next steps)

- No pages/routes for: Sales & CRM (Projects, Quotations, Deliver Orders, Customers),
  Purchase (Purchase Orders, Goods Receipt Note, Vendors), Inventory (Products, Stock
  Movements, Stock Adjustments), Finance (Invoice, Taxes — Currencies is done), System
  (Users, Roles, Settings). These are still disabled placeholders in the sidebar.
- RBAC (`spatie/laravel-permission`) is installed but nothing is actually gated by
  roles/permissions yet — no seeded roles, no policy/gate wired to any route or UI element.
- No API layer, no tests beyond Pest feature tests (no Dusk/browser tests).

## Where to resume

Ask the user which module or feature to build next, and follow the CRUD pattern above.
