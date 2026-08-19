<?php

use App\Models\User;

// Every `.view`-gated index route (or, for company-settings, its single edit/view page) and
// every `.create`-gated create route, generated from the exact route names registered in
// routes/web.php. Workflow/action routes (approve, confirm, status.update, etc.) share the same
// `permission:` middleware mechanism proven here — they're not re-verified individually since
// several of them also carry business-rule guards that would confound a generic pass/fail check.
$viewRoutes = [
    'job-titles.index' => 'job-titles.view',
    'workforces.index' => 'workforces.view',
    'currencies.index' => 'currencies.view',
    'taxes.index' => 'taxes.view',
    'payment-term-templates.index' => 'payment-term-templates.view',
    'company-settings.edit' => 'company-settings.view',
    'products.index' => 'products.view',
    'stock-movements.index' => 'stock-movements.view',
    'stock-adjustments.index' => 'stock-adjustments.view',
    'customers.index' => 'customers.view',
    'vendors.index' => 'vendors.view',
    'projects.index' => 'projects.view',
    'quotations.index' => 'quotations.view',
    'delivery-orders.index' => 'delivery-orders.view',
    'invoices.index' => 'invoices.view',
    'purchase-orders.index' => 'purchase-orders.view',
    'goods-receipt-notes.index' => 'goods-receipt-notes.view',
    'users.index' => 'users.view',
    'roles.index' => 'roles.view',
    'equipment.index' => 'equipment.view',
];

$createRoutes = [
    'job-titles.create' => 'job-titles.create',
    'workforces.create' => 'workforces.create',
    'currencies.create' => 'currencies.create',
    'taxes.create' => 'taxes.create',
    'payment-term-templates.create' => 'payment-term-templates.create',
    'products.create' => 'products.create',
    'stock-adjustments.create' => 'stock-adjustments.create',
    'customers.create' => 'customers.create',
    'vendors.create' => 'vendors.create',
    'projects.create' => 'projects.create',
    'quotations.create' => 'quotations.create',
    'delivery-orders.create' => 'delivery-orders.create',
    'invoices.create' => 'invoices.create',
    'purchase-orders.create' => 'purchase-orders.create',
    'goods-receipt-notes.create' => 'goods-receipt-notes.create',
    'users.create' => 'users.create',
    'roles.create' => 'roles.create',
    'equipment.create' => 'equipment.create',
];

foreach ([...$viewRoutes, ...$createRoutes] as $routeName => $permission) {
    test("route [{$routeName}] requires the [{$permission}] permission", function () use ($routeName, $permission) {
        $user = User::factory()->create();
        $this->actingAs($user);
        $user->syncPermissions([]);

        $this->get(route($routeName))->assertForbidden();

        $user->syncPermissions([$permission]);

        $this->get(route($routeName))->assertOk();
    });
}
