# Demo dataset seeders (client demo)

Part of the `docs/handoff/` detail set — see `HANDOFF.md` at the repo root for the index.

## What this built

Before this, `database/seeders/` only had `PermissionSeeder` and `RoleSeeder` (one `Super Admin`
role) plus a single generic `test@example.com` user in `DatabaseSeeder`. Nothing seeded
JobTitle, Workforce, Currency, Tax, Product, Vendor, or Customer. The user needed a realistic
dataset to demo the app to a client — a manufacturing/EPC company making electrical
distribution panels and solar power plant installations — so every new seeder writes
domain-appropriate data instead of generic Faker output.

New seeders (all plain `Seeder` subclasses, run via `DatabaseSeeder`'s `$this->call([...])` in
this order): `CurrencySeeder`, `TaxSeeder`, `JobTitleSeeder`, `UserSeeder`, `WorkforceSeeder`,
`ProductSeeder`, `VendorSeeder`, `CustomerSeeder`. `RoleSeeder` was extended rather than
replaced (still creates `Super Admin` with every permission first).

## The `WithoutModelEvents` gotcha this uncovered

`DatabaseSeeder` used Laravel's default scaffold trait `use WithoutModelEvents;`. Every domain
model in this app (`Product`, `Vendor`, `Customer`, `Workforce`, `Currency`, `Tax`, `JobTitle`,
`User`) generates its `uuid` — and `Product`/`Workforce`/`Vendor`/`Customer` their sequential
codes — inside a `static::creating()` closure registered in `booted()`. `Model::withoutEvents()`
(what the trait wraps `DatabaseSeeder::run()` in) disables the event dispatcher for the **entire
synchronous call stack**, including every seeder invoked via `$this->call([...])` inside that
`run()` — not just `DatabaseSeeder`'s own inline code. So every new seeder's inserts failed with
`NOT NULL constraint failed: <table>.uuid`. This is why the pre-existing `DatabaseSeeder` code
manually passed `'uuid' => (string) Str::uuid()` for the Test User — it had no other way to get
one. **Fix: removed `use WithoutModelEvents;` from `DatabaseSeeder` entirely.** If a future
seeder needs to be fast-pathed around model events again, do it as a local
`Model::withoutEvents(fn () => ...)` wrap around just that seeder's body, not as a trait on the
top-level `DatabaseSeeder` — the blast radius of the class-level trait is every nested seeder.

## Roles & permissions

User asked for 6 roles (Super Admin, Admin, Manager, HR, Finance, Procurement), then added
**Project Manager** and **Staff** via follow-up note — 8 total. Given 8 roles need to look
meaningfully different in a demo, `RoleSeeder` uses a **least-privilege, function-scoped**
permission matrix (not "everyone gets everything except X") — see `RoleSeeder::assignPermissions()`
and its 7 module-map arrays for the exact grants. Rough shape: Admin = everything except
`roles.*`; Manager = cross-functional approval/oversight (PO check/approve/reject, quotation
status/progress) without delete rights; Project Manager = hands-on execution (BOM, delivery
orders, GRN confirm) without financial or approval authority; HR/Finance/Procurement scoped
tightly to their own modules; Staff = view-only plus `stock-adjustments.create`. Permission
counts after seeding: Super Admin 86, Admin 82, Manager 34, Project Manager 26, Finance 20,
Procurement 21, HR 12, Staff 10 — confirms 8 visibly distinct role footprints.

## Demo logins

8 users, one per role, password `password` for all: `superadmin@labberu.test`,
`admin@labberu.test`, `manager@labberu.test`, `pm@labberu.test`, `hr@labberu.test`,
`finance@labberu.test`, `procurement@labberu.test`, `staff@labberu.test`. The pre-existing
`test@example.com` Test User (still `Super Admin`) was left untouched — nothing else in the app
relies on it (checked: the two tests that mention `test@example.com` create their own row
independently via factory/registration, not via the seeded one).

Each demo user has a matching `Workforce` row (`WorkforceSeeder`, `user_id` linked), each with a
job title mirroring their role (Super Admin → Managing Director, Admin → Admin Manager, Manager
→ Operations Manager, Project Manager → Project Manager, HR → HR Manager, Finance → Finance
Manager, Procurement → Procurement Manager, Staff → Warehouse Staff). Plus 12 more unlinked
Workforce rows across Electrical/Mechanical Engineer, Solar Installation/Panel Assembly
Technician, QA/QC Inspector, and Warehouse Staff — 20 workforces, 13 job titles total.

## Currencies & taxes

11 currencies: IDR (`base_currency: true`) + the other 9 ASEAN currencies (SGD, MYR, THB, PHP,
VND, BND, MMK, KHR, LAK) + USD. 5 Indonesian taxes, all `type: percentage` (the `taxes` schema
has no separate withholding/final-tax column, so that nuance lives in `name` only): `PPN` 11%,
`PPN0` (zero-rated export) 0%, `PPH22` (purchase of goods) 1.5%, `PPH23` (services withholding)
2%, `PPH4A2` (Final Pasal 4(2), construction services — directly relevant given the EPC business)
2.65%.

## Products, Vendors, Customers

40 products across 4 categories: electrical panel components (MCCB/MCB/ACB/contactors/busbars/
enclosures/meters/PLC — 18 items), solar equipment (PV modules/inverters/mounting/combiner
boxes/batteries — 12 items), cables (5), and services (Panel Assembly/Solar Installation/
Design/Commissioning/Maintenance — 5). `brand`/`unit` values are constrained by
`ProductStoreRequest`'s `in:` whitelist (11 real electrical brands + `Other`; 10 units +
`Other`) — solar-specific items use `Other` since none of the whitelisted brands are solar
manufacturers.

9 vendors, 9 customers — realistic Indonesian company names matching the domain (component
distributors/cable manufacturers/fabricators as vendors; property developers/factories/
hospitals/airport operator/EPC customers as customers).

### Company name convention: legal suffix goes last

Company names read `Schneider Electric Indonesia PT` (not `PT Schneider Electric Indonesia`) —
explicit user request to move the `PT`/`Tbk` legal-entity marker to the end of the name.
`RS Siloam Hospitals` was left alone since "RS" (Rumah Sakit) is a business-type descriptor, not
a legal entity form.

This interacts with `PartnerCodeSequence` (`app/Models/PartnerCodeSequence.php`), which derives
`vendor_code`/`customer_code` from the **first letter of the name**, and is **shared** between
Vendor and Customer per starting letter. Before the suffix move, every seeded name started with
"PT " so all 18 vendor+customer codes clustered as `P001`-`P018`. After moving the suffix, codes
now vary naturally by each company's real first word (`S001` Schneider, `A001` ABB, `K001`
Kabelindo, `N001` Nestlé, etc.) — a better demo look, and worth knowing if more vendors/customers
get added later (the shared-sequence-by-letter behavior is pre-existing, not something this
seeder changed).

## Re-seeding

`php artisan migrate:fresh --seed --no-interaction`. Full Pest suite (636 tests) passes
unaffected after all of the above.
