# The established CRUD pattern

Part of the `docs/handoff/` detail set — see `HANDOFF.md` at the repo root for the index.

For a model like `JobTitle`, `Workforce`, `Currency`:

- **Migration**: `id`, `uuid` (unique, used for route-model-binding — see below), business
  columns, `status` (plain string `active`/`inactive`, no enum class), `timestamps()`,
  `softDeletes()`. If a column needs to be unique *and* the table is soft-deletable, use a
  **partial unique index** scoped to `where deleted_at is null` via `DB::statement(...)` in
  the migration — see `docs/handoff/bugs-fixed.md` for why a plain `->unique()` breaks. If a
  numeric column has a DB `->default(...)`, do **not** also mark it `->nullable()` unless you
  truly want NULL to be a valid stored value — see the Products price/cost bug in
  `docs/handoff/bugs-fixed.md`.
- **Model**: `SoftDeletes` trait, `getRouteKeyName()` returns `'uuid'` (so all detail/edit/
  delete URLs use the UUID, not the sequential id), auto-generates `uuid` in a `booted()`
  `creating` hook, `#[Fillable([...])]` PHP attribute (not `protected $fillable`) — this is
  this project's established convention, matching the `User` model. **Every column set via
  `Model::create()`/`update()` must be listed here or it is silently dropped with no error**
  — this has caused real bugs (see `docs/handoff/bugs-fixed.md`), so double-check this list
  whenever you add a column that gets mass-assigned.
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
  name-reuse (see `docs/handoff/bugs-fixed.md`), guest redirect to login. For bug reports,
  prefer a regression test that reproduces the **actual** request shape the browser sends
  (e.g. blank form fields submit as empty strings, not omitted keys — a prior test that
  omitted keys entirely passed while the real bug still reproduced).
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
