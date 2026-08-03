<?php

use App\Http\Controllers\BomController;
use App\Http\Controllers\CompanySettingController;
use App\Http\Controllers\CurrencyController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DeliveryOrderController;
use App\Http\Controllers\GoodsReceiptNoteController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\InvoicePaymentController;
use App\Http\Controllers\JobTitleController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProjectAttachmentController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\PurchaseOrderController;
use App\Http\Controllers\QuotationController;
use App\Http\Controllers\StockAdjustmentController;
use App\Http\Controllers\StockMovementController;
use App\Http\Controllers\TaxController;
use App\Http\Controllers\VendorController;
use App\Http\Controllers\WorkforceController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/login')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    Route::get('job-titles', [JobTitleController::class, 'index'])->name('job-titles.index');
    Route::get('job-titles/create', [JobTitleController::class, 'create'])->name('job-titles.create');
    Route::post('job-titles', [JobTitleController::class, 'store'])->name('job-titles.store');
    Route::get('job-titles/{jobTitle}', [JobTitleController::class, 'show'])->name('job-titles.show');
    Route::get('job-titles/{jobTitle}/edit', [JobTitleController::class, 'edit'])->name('job-titles.edit');
    Route::put('job-titles/{jobTitle}', [JobTitleController::class, 'update'])->name('job-titles.update');
    Route::delete('job-titles/{jobTitle}', [JobTitleController::class, 'destroy'])->name('job-titles.destroy');

    Route::get('workforces', [WorkforceController::class, 'index'])->name('workforces.index');
    Route::get('workforces/create', [WorkforceController::class, 'create'])->name('workforces.create');
    Route::post('workforces', [WorkforceController::class, 'store'])->name('workforces.store');
    Route::get('workforces/{workforce}', [WorkforceController::class, 'show'])->name('workforces.show');
    Route::get('workforces/{workforce}/edit', [WorkforceController::class, 'edit'])->name('workforces.edit');
    Route::put('workforces/{workforce}', [WorkforceController::class, 'update'])->name('workforces.update');
    Route::delete('workforces/{workforce}', [WorkforceController::class, 'destroy'])->name('workforces.destroy');
    Route::get('workforces/{workforce}/photo', [WorkforceController::class, 'photo'])->name('workforces.photo');

    Route::get('currencies', [CurrencyController::class, 'index'])->name('currencies.index');
    Route::get('currencies/create', [CurrencyController::class, 'create'])->name('currencies.create');
    Route::post('currencies', [CurrencyController::class, 'store'])->name('currencies.store');
    Route::get('currencies/{currency}', [CurrencyController::class, 'show'])->name('currencies.show');
    Route::get('currencies/{currency}/edit', [CurrencyController::class, 'edit'])->name('currencies.edit');
    Route::put('currencies/{currency}', [CurrencyController::class, 'update'])->name('currencies.update');
    Route::delete('currencies/{currency}', [CurrencyController::class, 'destroy'])->name('currencies.destroy');

    Route::get('taxes', [TaxController::class, 'index'])->name('taxes.index');
    Route::get('taxes/create', [TaxController::class, 'create'])->name('taxes.create');
    Route::post('taxes', [TaxController::class, 'store'])->name('taxes.store');
    Route::get('taxes/{tax}', [TaxController::class, 'show'])->name('taxes.show');
    Route::get('taxes/{tax}/edit', [TaxController::class, 'edit'])->name('taxes.edit');
    Route::put('taxes/{tax}', [TaxController::class, 'update'])->name('taxes.update');
    Route::delete('taxes/{tax}', [TaxController::class, 'destroy'])->name('taxes.destroy');

    Route::get('company-settings', [CompanySettingController::class, 'edit'])->name('company-settings.edit');
    Route::put('company-settings', [CompanySettingController::class, 'update'])->name('company-settings.update');

    Route::get('products', [ProductController::class, 'index'])->name('products.index');
    Route::get('products/create', [ProductController::class, 'create'])->name('products.create');
    Route::post('products', [ProductController::class, 'store'])->name('products.store');
    Route::get('products/search', [ProductController::class, 'search'])->name('products.search');
    Route::get('products/{product}', [ProductController::class, 'show'])->name('products.show');
    Route::get('products/{product}/edit', [ProductController::class, 'edit'])->name('products.edit');
    Route::put('products/{product}', [ProductController::class, 'update'])->name('products.update');
    Route::delete('products/{product}', [ProductController::class, 'destroy'])->name('products.destroy');

    Route::get('stock-movements', [StockMovementController::class, 'index'])->name('stock-movements.index');

    Route::get('stock-adjustments', [StockAdjustmentController::class, 'index'])->name('stock-adjustments.index');
    Route::get('stock-adjustments/create', [StockAdjustmentController::class, 'create'])->name('stock-adjustments.create');
    Route::post('stock-adjustments', [StockAdjustmentController::class, 'store'])->name('stock-adjustments.store');

    Route::get('customers', [CustomerController::class, 'index'])->name('customers.index');
    Route::get('customers/create', [CustomerController::class, 'create'])->name('customers.create');
    Route::post('customers', [CustomerController::class, 'store'])->name('customers.store');
    Route::get('customers/search', [CustomerController::class, 'search'])->name('customers.search');
    Route::get('customers/{customer}', [CustomerController::class, 'show'])->name('customers.show');
    Route::get('customers/{customer}/edit', [CustomerController::class, 'edit'])->name('customers.edit');
    Route::put('customers/{customer}', [CustomerController::class, 'update'])->name('customers.update');
    Route::delete('customers/{customer}', [CustomerController::class, 'destroy'])->name('customers.destroy');

    Route::get('vendors', [VendorController::class, 'index'])->name('vendors.index');
    Route::get('vendors/create', [VendorController::class, 'create'])->name('vendors.create');
    Route::post('vendors', [VendorController::class, 'store'])->name('vendors.store');
    Route::get('vendors/search', [VendorController::class, 'search'])->name('vendors.search');
    Route::get('vendors/{vendor}', [VendorController::class, 'show'])->name('vendors.show');
    Route::get('vendors/{vendor}/edit', [VendorController::class, 'edit'])->name('vendors.edit');
    Route::put('vendors/{vendor}', [VendorController::class, 'update'])->name('vendors.update');
    Route::delete('vendors/{vendor}', [VendorController::class, 'destroy'])->name('vendors.destroy');

    Route::get('projects', [ProjectController::class, 'index'])->name('projects.index');
    Route::get('projects/create', [ProjectController::class, 'create'])->name('projects.create');
    Route::post('projects', [ProjectController::class, 'store'])->name('projects.store');
    Route::get('projects/search', [ProjectController::class, 'search'])->name('projects.search');
    Route::get('projects/{project}', [ProjectController::class, 'show'])->name('projects.show');
    Route::get('projects/{project}/edit', [ProjectController::class, 'edit'])->name('projects.edit');
    Route::put('projects/{project}', [ProjectController::class, 'update'])->name('projects.update');
    Route::delete('projects/{project}', [ProjectController::class, 'destroy'])->name('projects.destroy');

    Route::get('projects/{project}/quotations', [ProjectController::class, 'quotations'])->name('projects.quotations.index');

    Route::post('projects/{project}/attachments', [ProjectAttachmentController::class, 'store'])->name('projects.attachments.store');
    Route::get('projects/{project}/attachments/{attachment}/download', [ProjectAttachmentController::class, 'download'])->name('projects.attachments.download');
    Route::delete('projects/{project}/attachments/{attachment}', [ProjectAttachmentController::class, 'destroy'])->name('projects.attachments.destroy');

    Route::get('quotations', [QuotationController::class, 'index'])->name('quotations.index');
    Route::get('quotations/create', [QuotationController::class, 'create'])->name('quotations.create');
    Route::get('quotations/search', [QuotationController::class, 'search'])->name('quotations.search');
    Route::post('quotations', [QuotationController::class, 'store'])->name('quotations.store');
    Route::get('quotations/{quotation}', [QuotationController::class, 'show'])->name('quotations.show');
    Route::get('quotations/{quotation}/edit', [QuotationController::class, 'edit'])->name('quotations.edit');
    Route::put('quotations/{quotation}', [QuotationController::class, 'update'])->name('quotations.update');
    Route::patch('quotations/{quotation}/status', [QuotationController::class, 'updateStatus'])->name('quotations.status.update');
    Route::patch('quotations/{quotation}/progress', [QuotationController::class, 'updateProgress'])->name('quotations.progress.update');
    Route::post('quotations/{quotation}/revisions', [QuotationController::class, 'storeRevision'])->name('quotations.revisions.store');
    Route::delete('quotations/{quotation}', [QuotationController::class, 'destroy'])->name('quotations.destroy');
    Route::get('quotations/{quotation}/bom-items', [QuotationController::class, 'bomItems'])->name('quotations.bom-items.index');
    Route::get('quotations/{quotation}/items', [QuotationController::class, 'items'])->name('quotations.items.index');

    Route::get('delivery-orders', [DeliveryOrderController::class, 'index'])->name('delivery-orders.index');
    Route::get('delivery-orders/create', [DeliveryOrderController::class, 'create'])->name('delivery-orders.create');
    Route::post('delivery-orders', [DeliveryOrderController::class, 'store'])->name('delivery-orders.store');
    Route::get('delivery-orders/{deliveryOrder}', [DeliveryOrderController::class, 'show'])->name('delivery-orders.show');
    Route::get('delivery-orders/{deliveryOrder}/edit', [DeliveryOrderController::class, 'edit'])->name('delivery-orders.edit');
    Route::put('delivery-orders/{deliveryOrder}', [DeliveryOrderController::class, 'update'])->name('delivery-orders.update');
    Route::delete('delivery-orders/{deliveryOrder}', [DeliveryOrderController::class, 'destroy'])->name('delivery-orders.destroy');
    Route::patch('delivery-orders/{deliveryOrder}/confirm', [DeliveryOrderController::class, 'confirm'])->name('delivery-orders.confirm');

    Route::get('invoices', [InvoiceController::class, 'index'])->name('invoices.index');
    Route::get('invoices/create', [InvoiceController::class, 'create'])->name('invoices.create');
    Route::post('invoices', [InvoiceController::class, 'store'])->name('invoices.store');
    Route::get('invoices/{invoice}', [InvoiceController::class, 'show'])->name('invoices.show');
    Route::get('invoices/{invoice}/edit', [InvoiceController::class, 'edit'])->name('invoices.edit');
    Route::put('invoices/{invoice}', [InvoiceController::class, 'update'])->name('invoices.update');
    Route::delete('invoices/{invoice}', [InvoiceController::class, 'destroy'])->name('invoices.destroy');
    Route::patch('invoices/{invoice}/issue', [InvoiceController::class, 'issue'])->name('invoices.issue');
    Route::post('invoices/{invoice}/payments', [InvoicePaymentController::class, 'store'])->name('invoices.payments.store');
    Route::delete('invoices/{invoice}/payments/{payment}', [InvoicePaymentController::class, 'destroy'])->name('invoices.payments.destroy');

    Route::get('quotations/{quotation}/bom/create', [BomController::class, 'create'])->name('quotations.bom.create');
    Route::post('quotations/{quotation}/bom', [BomController::class, 'store'])->name('quotations.bom.store');
    Route::get('quotations/{quotation}/bom', [BomController::class, 'show'])->name('quotations.bom.show');
    Route::get('quotations/{quotation}/bom/edit', [BomController::class, 'edit'])->name('quotations.bom.edit');
    Route::put('quotations/{quotation}/bom', [BomController::class, 'update'])->name('quotations.bom.update');
    Route::delete('quotations/{quotation}/bom', [BomController::class, 'destroy'])->name('quotations.bom.destroy');

    Route::get('purchase-orders', [PurchaseOrderController::class, 'index'])->name('purchase-orders.index');
    Route::get('purchase-orders/create', [PurchaseOrderController::class, 'create'])->name('purchase-orders.create');
    Route::get('purchase-orders/search', [PurchaseOrderController::class, 'search'])->name('purchase-orders.search');
    Route::post('purchase-orders', [PurchaseOrderController::class, 'store'])->name('purchase-orders.store');
    Route::get('purchase-orders/{purchaseOrder}', [PurchaseOrderController::class, 'show'])->name('purchase-orders.show');
    Route::get('purchase-orders/{purchaseOrder}/edit', [PurchaseOrderController::class, 'edit'])->name('purchase-orders.edit');
    Route::put('purchase-orders/{purchaseOrder}', [PurchaseOrderController::class, 'update'])->name('purchase-orders.update');
    Route::delete('purchase-orders/{purchaseOrder}', [PurchaseOrderController::class, 'destroy'])->name('purchase-orders.destroy');
    Route::patch('purchase-orders/{purchaseOrder}/issue', [PurchaseOrderController::class, 'issue'])->name('purchase-orders.issue');
    Route::patch('purchase-orders/{purchaseOrder}/check', [PurchaseOrderController::class, 'check'])->name('purchase-orders.check');
    Route::patch('purchase-orders/{purchaseOrder}/approve', [PurchaseOrderController::class, 'approve'])->name('purchase-orders.approve');
    Route::patch('purchase-orders/{purchaseOrder}/reject', [PurchaseOrderController::class, 'reject'])->name('purchase-orders.reject');
    Route::patch('purchase-orders/{purchaseOrder}/cancel', [PurchaseOrderController::class, 'cancel'])->name('purchase-orders.cancel');
    Route::patch('purchase-orders/{purchaseOrder}/void', [PurchaseOrderController::class, 'void'])->name('purchase-orders.void');
    Route::patch('purchase-orders/{purchaseOrder}/progress', [PurchaseOrderController::class, 'updateProgress'])->name('purchase-orders.progress.update');
    Route::get('purchase-orders/{purchaseOrder}/items', [PurchaseOrderController::class, 'items'])->name('purchase-orders.items.index');

    Route::get('goods-receipt-notes', [GoodsReceiptNoteController::class, 'index'])->name('goods-receipt-notes.index');
    Route::get('goods-receipt-notes/create', [GoodsReceiptNoteController::class, 'create'])->name('goods-receipt-notes.create');
    Route::post('goods-receipt-notes', [GoodsReceiptNoteController::class, 'store'])->name('goods-receipt-notes.store');
    Route::get('goods-receipt-notes/{goodsReceiptNote}', [GoodsReceiptNoteController::class, 'show'])->name('goods-receipt-notes.show');
    Route::get('goods-receipt-notes/{goodsReceiptNote}/edit', [GoodsReceiptNoteController::class, 'edit'])->name('goods-receipt-notes.edit');
    Route::put('goods-receipt-notes/{goodsReceiptNote}', [GoodsReceiptNoteController::class, 'update'])->name('goods-receipt-notes.update');
    Route::delete('goods-receipt-notes/{goodsReceiptNote}', [GoodsReceiptNoteController::class, 'destroy'])->name('goods-receipt-notes.destroy');
    Route::patch('goods-receipt-notes/{goodsReceiptNote}/confirm', [GoodsReceiptNoteController::class, 'confirm'])->name('goods-receipt-notes.confirm');
});

require __DIR__.'/settings.php';
