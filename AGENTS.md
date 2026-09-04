# Repository Guidelines

## Project Structure

- `app/` contains Laravel application code, including `Http`, `Models`, `Services`, `Actions`, and `Concerns`.
- `routes/` contains web, settings, and console routes. Use named routes and Wayfinder functions when connecting React to Laravel endpoints.
- `resources/js/` contains Inertia React pages and components; `resources/css/` contains the Tailwind CSS entrypoint.
- `database/` contains migrations, factories, and seeders.
- `tests/Feature/` covers request and workflow behavior; `tests/Unit/` covers isolated logic.
- `public/` contains public assets, while `docs/` and `documents/` contain project reference material.

## Development and Build Commands

- `composer run setup` installs dependencies, prepares `.env`, generates the application key, migrates the database, and builds assets.
- `composer run dev` starts the Laravel server on port 8080, queue worker, and Vite development server.
- `npm run build` creates the production frontend bundle.
- `php artisan migrate` applies database migrations locally.
- `php artisan route:list` inspects registered routes.

## Coding Style and Naming

Use four spaces and LF line endings. Format PHP with Laravel Pint (`vendor/bin/pint --dirty --format agent`); use typed parameters and return types, curly braces, and Laravel conventions. Format and lint frontend code with Prettier and ESLint (`npm run format`, `npm run lint`). Use PascalCase for PHP classes and React components, camelCase for variables and functions, and descriptive names. Reuse existing components and patterns before adding new ones.

## Testing and Quality

This project uses Pest 4 with PHPUnit 12. Add or update tests for every behavior change, preferring feature tests and existing factories. Run `php artisan test --compact` for the full suite or target a file/filter, for example `php artisan test --compact tests/Feature/Workforces/IndexTest.php`. Before submitting, run `composer run ci:check`; it checks PHP and frontend formatting, static analysis, types, and tests. No explicit coverage threshold is configured.

## Commits and Pull Requests

History uses short, lowercase messages such as `develop: multiple features`, but these are broad. Prefer a concise, imperative, scoped subject, for example `quotations: validate item totals`. Pull requests should describe the user-visible change, list tests and checks run, call out migrations or configuration changes, link the relevant issue or task, and include screenshots for UI changes. Keep unrelated changes separate.

## Configuration and Security

Keep secrets and machine-specific values in `.env`; update `.env.example` when new variables are required. Do not commit credentials, generated production artifacts, or unrelated dependency changes.
