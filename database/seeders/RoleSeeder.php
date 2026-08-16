<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $superAdmin = Role::findOrCreate('Super Admin', 'web');
        $superAdmin->syncPermissions(Permission::all());

        $admin = Role::findOrCreate('Admin', 'web');
        $admin->syncPermissions(
            Permission::all()->reject(fn (Permission $permission) => str_starts_with($permission->name, 'roles.'))
        );

        $this->assignPermissions('Manager', [
            'projects' => ['view', 'create', 'update', 'attachments.create'],
            'quotations' => ['view', 'create', 'update', 'status.update', 'progress.update', 'revisions.create'],
            'bom' => ['view', 'create', 'update'],
            'purchase-orders' => ['view', 'check', 'approve', 'reject', 'progress.update'],
            'delivery-orders' => ['view', 'confirm', 'cancel'],
            'invoices' => ['view', 'issue'],
            'purchase-invoices' => ['view', 'issue'],
            'goods-receipt-notes' => ['view', 'confirm', 'cancel'],
            'customers' => ['view'],
            'vendors' => ['view'],
            'products' => ['view'],
            'workforces' => ['view'],
            'business-lines' => ['view'],
            'job-titles' => ['view'],
            'currencies' => ['view'],
            'taxes' => ['view'],
            'payment-term-templates' => ['view'],
            'stock-movements' => ['view'],
            'stock-adjustments' => ['view'],
            'company-settings' => ['view'],
        ]);

        $this->assignPermissions('Project Manager', [
            'projects' => ['view', 'create', 'update', 'delete', 'attachments.create', 'attachments.delete'],
            'quotations' => ['view', 'create', 'update', 'progress.update', 'revisions.create'],
            'bom' => ['view', 'create', 'update'],
            'delivery-orders' => ['view', 'create', 'update', 'confirm', 'cancel'],
            'goods-receipt-notes' => ['view', 'confirm', 'cancel'],
            'purchase-orders' => ['view', 'progress.update'],
            'products' => ['view'],
            'customers' => ['view'],
            'vendors' => ['view'],
            'stock-movements' => ['view'],
        ]);

        $this->assignPermissions('HR', [
            'job-titles' => ['view', 'create', 'update', 'delete'],
            'workforces' => ['view', 'create', 'update', 'delete'],
            'users' => ['view', 'create', 'update'],
            'company-settings' => ['view'],
        ]);

        $this->assignPermissions('Finance', [
            'invoices' => ['view', 'create', 'update', 'delete', 'issue', 'payment-terms.update', 'payments.create', 'payments.cancel'],
            'purchase-invoices' => ['view', 'create', 'update', 'delete', 'issue', 'payments.create', 'payments.cancel'],
            'taxes' => ['view', 'create', 'update', 'delete'],
            'payment-term-templates' => ['view', 'create', 'update', 'delete'],
            'currencies' => ['view', 'create', 'update', 'delete'],
            'purchase-orders' => ['view'],
            'quotations' => ['view'],
            'customers' => ['view'],
            'vendors' => ['view'],
            'company-settings' => ['view'],
        ]);

        $this->assignPermissions('Procurement', [
            'vendors' => ['view', 'create', 'update', 'delete'],
            'purchase-orders' => ['view', 'create', 'update', 'delete', 'issue', 'cancel', 'void'],
            'goods-receipt-notes' => ['view', 'create', 'update', 'delete', 'confirm', 'cancel'],
            'products' => ['view'],
            'stock-movements' => ['view'],
            'stock-adjustments' => ['view', 'create'],
            'bom' => ['view'],
        ]);

        $this->assignPermissions('Staff', [
            'products' => ['view'],
            'customers' => ['view'],
            'vendors' => ['view'],
            'stock-movements' => ['view'],
            'stock-adjustments' => ['view', 'create'],
            'quotations' => ['view'],
            'projects' => ['view'],
            'delivery-orders' => ['view'],
            'goods-receipt-notes' => ['view'],
        ]);
    }

    /**
     * Create (or update) a role and sync it to the given module => actions permission map.
     *
     * @param  array<string, array<int, string>>  $modules
     */
    private function assignPermissions(string $roleName, array $modules): void
    {
        $names = [];

        foreach ($modules as $module => $actions) {
            foreach ($actions as $action) {
                $names[] = "{$module}.{$action}";
            }
        }

        $role = Role::findOrCreate($roleName, 'web');
        $role->syncPermissions(Permission::whereIn('name', $names)->get());
    }
}
