<?php

return [
    'job-titles' => ['view', 'create', 'update', 'delete'],
    'workforces' => ['view', 'create', 'update', 'delete'],
    'currencies' => ['view', 'create', 'update', 'delete'],
    'taxes' => ['view', 'create', 'update', 'delete'],
    'company-settings' => ['view', 'update'],
    'products' => ['view', 'create', 'update', 'delete'],
    'stock-movements' => ['view'],
    'stock-adjustments' => ['view', 'create'],
    'customers' => ['view', 'create', 'update', 'delete'],
    'vendors' => ['view', 'create', 'update', 'delete'],
    'projects' => ['view', 'create', 'update', 'delete', 'attachments.create', 'attachments.delete'],
    'quotations' => ['view', 'create', 'update', 'delete', 'status.update', 'progress.update', 'revisions.create'],
    'bom' => ['view', 'create', 'update', 'delete'],
    'delivery-orders' => ['view', 'create', 'update', 'delete', 'confirm'],
    'invoices' => ['view', 'create', 'update', 'delete', 'issue', 'payments.create', 'payments.delete'],
    'purchase-orders' => ['view', 'create', 'update', 'delete', 'issue', 'check', 'approve', 'reject', 'cancel', 'void', 'progress.update'],
    'goods-receipt-notes' => ['view', 'create', 'update', 'delete', 'confirm'],
    'users' => ['view', 'create', 'update', 'delete'],
    'roles' => ['view', 'create', 'update', 'delete'],
];
