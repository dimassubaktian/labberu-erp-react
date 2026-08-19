<?php

use App\Http\Controllers\BomController;
use App\Http\Controllers\BusinessLineController;
use App\Http\Controllers\CompanySettingController;
use App\Http\Controllers\CurrencyController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DeliveryOrderController;
use App\Http\Controllers\DesignReferenceController;
use App\Http\Controllers\EquipmentAssignmentController;
use App\Http\Controllers\EquipmentCalibrationController;
use App\Http\Controllers\EquipmentController;
use App\Http\Controllers\GoodsReceiptNoteController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\InvoicePaymentController;
use App\Http\Controllers\JobTitleController;
use App\Http\Controllers\PaymentTermTemplateController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProjectAttachmentController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ProjectEquipmentCheckoutController;
use App\Http\Controllers\PurchaseInvoiceController;
use App\Http\Controllers\PurchaseInvoicePaymentController;
use App\Http\Controllers\PurchaseOrderController;
use App\Http\Controllers\QuotationController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\StockAdjustmentController;
use App\Http\Controllers\StockMovementController;
use App\Http\Controllers\TaxController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\VendorController;
use App\Http\Controllers\WorkforceController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/login')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::get('business-lines', [BusinessLineController::class, 'index'])->name('business-lines.index')->middleware('permission:business-lines.view');
    Route::get('business-lines/create', [BusinessLineController::class, 'create'])->name('business-lines.create')->middleware('permission:business-lines.create');
    Route::post('business-lines', [BusinessLineController::class, 'store'])->name('business-lines.store')->middleware('permission:business-lines.create');
    Route::get('business-lines/{businessLine}', [BusinessLineController::class, 'show'])->name('business-lines.show')->middleware('permission:business-lines.view');
    Route::get('business-lines/{businessLine}/edit', [BusinessLineController::class, 'edit'])->name('business-lines.edit')->middleware('permission:business-lines.update');
    Route::put('business-lines/{businessLine}', [BusinessLineController::class, 'update'])->name('business-lines.update')->middleware('permission:business-lines.update');
    Route::delete('business-lines/{businessLine}', [BusinessLineController::class, 'destroy'])->name('business-lines.destroy')->middleware('permission:business-lines.delete');

    Route::get('job-titles', [JobTitleController::class, 'index'])->name('job-titles.index')->middleware('permission:job-titles.view');
    Route::get('job-titles/create', [JobTitleController::class, 'create'])->name('job-titles.create')->middleware('permission:job-titles.create');
    Route::post('job-titles', [JobTitleController::class, 'store'])->name('job-titles.store')->middleware('permission:job-titles.create');
    Route::get('job-titles/{jobTitle}', [JobTitleController::class, 'show'])->name('job-titles.show')->middleware('permission:job-titles.view');
    Route::get('job-titles/{jobTitle}/edit', [JobTitleController::class, 'edit'])->name('job-titles.edit')->middleware('permission:job-titles.update');
    Route::put('job-titles/{jobTitle}', [JobTitleController::class, 'update'])->name('job-titles.update')->middleware('permission:job-titles.update');
    Route::delete('job-titles/{jobTitle}', [JobTitleController::class, 'destroy'])->name('job-titles.destroy')->middleware('permission:job-titles.delete');

    Route::get('workforces', [WorkforceController::class, 'index'])->name('workforces.index')->middleware('permission:workforces.view');
    Route::get('workforces/create', [WorkforceController::class, 'create'])->name('workforces.create')->middleware('permission:workforces.create');
    Route::post('workforces', [WorkforceController::class, 'store'])->name('workforces.store')->middleware('permission:workforces.create');
    Route::get('workforces/{workforce}', [WorkforceController::class, 'show'])->name('workforces.show')->middleware('permission:workforces.view');
    Route::get('workforces/{workforce}/edit', [WorkforceController::class, 'edit'])->name('workforces.edit')->middleware('permission:workforces.update');
    Route::put('workforces/{workforce}', [WorkforceController::class, 'update'])->name('workforces.update')->middleware('permission:workforces.update');
    Route::delete('workforces/{workforce}', [WorkforceController::class, 'destroy'])->name('workforces.destroy')->middleware('permission:workforces.delete');
    Route::get('workforces/{workforce}/photo', [WorkforceController::class, 'photo'])->name('workforces.photo')->middleware('permission:workforces.view');

    Route::get('currencies', [CurrencyController::class, 'index'])->name('currencies.index')->middleware('permission:currencies.view');
    Route::get('currencies/create', [CurrencyController::class, 'create'])->name('currencies.create')->middleware('permission:currencies.create');
    Route::post('currencies', [CurrencyController::class, 'store'])->name('currencies.store')->middleware('permission:currencies.create');
    Route::get('currencies/{currency}', [CurrencyController::class, 'show'])->name('currencies.show')->middleware('permission:currencies.view');
    Route::get('currencies/{currency}/edit', [CurrencyController::class, 'edit'])->name('currencies.edit')->middleware('permission:currencies.update');
    Route::put('currencies/{currency}', [CurrencyController::class, 'update'])->name('currencies.update')->middleware('permission:currencies.update');
    Route::delete('currencies/{currency}', [CurrencyController::class, 'destroy'])->name('currencies.destroy')->middleware('permission:currencies.delete');

    Route::get('taxes', [TaxController::class, 'index'])->name('taxes.index')->middleware('permission:taxes.view');
    Route::get('taxes/create', [TaxController::class, 'create'])->name('taxes.create')->middleware('permission:taxes.create');
    Route::post('taxes', [TaxController::class, 'store'])->name('taxes.store')->middleware('permission:taxes.create');
    Route::get('taxes/{tax}', [TaxController::class, 'show'])->name('taxes.show')->middleware('permission:taxes.view');
    Route::get('taxes/{tax}/edit', [TaxController::class, 'edit'])->name('taxes.edit')->middleware('permission:taxes.update');
    Route::put('taxes/{tax}', [TaxController::class, 'update'])->name('taxes.update')->middleware('permission:taxes.update');
    Route::delete('taxes/{tax}', [TaxController::class, 'destroy'])->name('taxes.destroy')->middleware('permission:taxes.delete');

    Route::get('payment-term-templates', [PaymentTermTemplateController::class, 'index'])->name('payment-term-templates.index')->middleware('permission:payment-term-templates.view');
    Route::get('payment-term-templates/create', [PaymentTermTemplateController::class, 'create'])->name('payment-term-templates.create')->middleware('permission:payment-term-templates.create');
    Route::post('payment-term-templates', [PaymentTermTemplateController::class, 'store'])->name('payment-term-templates.store')->middleware('permission:payment-term-templates.create');
    Route::get('payment-term-templates/{paymentTermTemplate}', [PaymentTermTemplateController::class, 'show'])->name('payment-term-templates.show')->middleware('permission:payment-term-templates.view');
    Route::get('payment-term-templates/{paymentTermTemplate}/edit', [PaymentTermTemplateController::class, 'edit'])->name('payment-term-templates.edit')->middleware('permission:payment-term-templates.update');
    Route::put('payment-term-templates/{paymentTermTemplate}', [PaymentTermTemplateController::class, 'update'])->name('payment-term-templates.update')->middleware('permission:payment-term-templates.update');
    Route::delete('payment-term-templates/{paymentTermTemplate}', [PaymentTermTemplateController::class, 'destroy'])->name('payment-term-templates.destroy')->middleware('permission:payment-term-templates.delete');

    Route::get('company-settings', [CompanySettingController::class, 'edit'])->name('company-settings.edit')->middleware('permission:company-settings.view');
    Route::put('company-settings', [CompanySettingController::class, 'update'])->name('company-settings.update')->middleware('permission:company-settings.update');

    Route::get('products', [ProductController::class, 'index'])->name('products.index')->middleware('permission:products.view');
    Route::get('products/create', [ProductController::class, 'create'])->name('products.create')->middleware('permission:products.create');
    Route::post('products', [ProductController::class, 'store'])->name('products.store')->middleware('permission:products.create');
    Route::get('products/search', [ProductController::class, 'search'])->name('products.search')->middleware('permission:products.view');
    Route::get('products/{product}', [ProductController::class, 'show'])->name('products.show')->middleware('permission:products.view');
    Route::get('products/{product}/edit', [ProductController::class, 'edit'])->name('products.edit')->middleware('permission:products.update');
    Route::put('products/{product}', [ProductController::class, 'update'])->name('products.update')->middleware('permission:products.update');
    Route::delete('products/{product}', [ProductController::class, 'destroy'])->name('products.destroy')->middleware('permission:products.delete');

    Route::get('stock-movements', [StockMovementController::class, 'index'])->name('stock-movements.index')->middleware('permission:stock-movements.view');

    Route::get('stock-adjustments', [StockAdjustmentController::class, 'index'])->name('stock-adjustments.index')->middleware('permission:stock-adjustments.view');
    Route::get('stock-adjustments/create', [StockAdjustmentController::class, 'create'])->name('stock-adjustments.create')->middleware('permission:stock-adjustments.create');
    Route::post('stock-adjustments', [StockAdjustmentController::class, 'store'])->name('stock-adjustments.store')->middleware('permission:stock-adjustments.create');

    Route::get('customers', [CustomerController::class, 'index'])->name('customers.index')->middleware('permission:customers.view');
    Route::get('customers/create', [CustomerController::class, 'create'])->name('customers.create')->middleware('permission:customers.create');
    Route::post('customers', [CustomerController::class, 'store'])->name('customers.store')->middleware('permission:customers.create');
    Route::post('customers/quick-create', [CustomerController::class, 'quickStore'])->name('customers.quick-create')->middleware('permission:customers.create');
    Route::get('customers/search', [CustomerController::class, 'search'])->name('customers.search')->middleware('permission:customers.view');
    Route::get('customers/{customer}', [CustomerController::class, 'show'])->name('customers.show')->middleware('permission:customers.view');
    Route::get('customers/{customer}/edit', [CustomerController::class, 'edit'])->name('customers.edit')->middleware('permission:customers.update');
    Route::put('customers/{customer}', [CustomerController::class, 'update'])->name('customers.update')->middleware('permission:customers.update');
    Route::delete('customers/{customer}', [CustomerController::class, 'destroy'])->name('customers.destroy')->middleware('permission:customers.delete');

    Route::get('vendors', [VendorController::class, 'index'])->name('vendors.index')->middleware('permission:vendors.view');
    Route::get('vendors/create', [VendorController::class, 'create'])->name('vendors.create')->middleware('permission:vendors.create');
    Route::post('vendors', [VendorController::class, 'store'])->name('vendors.store')->middleware('permission:vendors.create');
    Route::get('vendors/search', [VendorController::class, 'search'])->name('vendors.search')->middleware('permission:vendors.view');
    Route::get('vendors/{vendor}', [VendorController::class, 'show'])->name('vendors.show')->middleware('permission:vendors.view');
    Route::get('vendors/{vendor}/edit', [VendorController::class, 'edit'])->name('vendors.edit')->middleware('permission:vendors.update');
    Route::put('vendors/{vendor}', [VendorController::class, 'update'])->name('vendors.update')->middleware('permission:vendors.update');
    Route::delete('vendors/{vendor}', [VendorController::class, 'destroy'])->name('vendors.destroy')->middleware('permission:vendors.delete');

    Route::get('projects', [ProjectController::class, 'index'])->name('projects.index')->middleware('permission:projects.view');
    Route::get('projects/create', [ProjectController::class, 'create'])->name('projects.create')->middleware('permission:projects.create');
    Route::post('projects', [ProjectController::class, 'store'])->name('projects.store')->middleware('permission:projects.create');
    Route::get('projects/search', [ProjectController::class, 'search'])->name('projects.search')->middleware('permission:projects.view');
    Route::get('projects/{project}', [ProjectController::class, 'show'])->name('projects.show')->middleware('permission:projects.view');
    Route::get('projects/{project}/edit', [ProjectController::class, 'edit'])->name('projects.edit')->middleware('permission:projects.update');
    Route::put('projects/{project}', [ProjectController::class, 'update'])->name('projects.update')->middleware('permission:projects.update');
    Route::patch('projects/{project}/cancel', [ProjectController::class, 'cancel'])->name('projects.cancel')->middleware('permission:projects.update');
    Route::patch('projects/{project}/void', [ProjectController::class, 'void'])->name('projects.void')->middleware('permission:projects.update');
    Route::delete('projects/{project}', [ProjectController::class, 'destroy'])->name('projects.destroy')->middleware('permission:projects.delete');

    Route::get('projects/{project}/quotations', [ProjectController::class, 'quotations'])->name('projects.quotations.index')->middleware('permission:projects.view');

    Route::post('projects/{project}/attachments', [ProjectAttachmentController::class, 'store'])->name('projects.attachments.store')->middleware('permission:projects.attachments.create');
    Route::get('projects/{project}/attachments/{attachment}/download', [ProjectAttachmentController::class, 'download'])->name('projects.attachments.download')->middleware('permission:projects.view');
    Route::delete('projects/{project}/attachments/{attachment}', [ProjectAttachmentController::class, 'destroy'])->name('projects.attachments.destroy')->middleware('permission:projects.attachments.delete');

    Route::post('projects/{project}/equipment-checkouts', [ProjectEquipmentCheckoutController::class, 'store'])->name('projects.equipment-checkouts.store')->middleware('permission:equipment.assignments.create');

    Route::get('quotations', [QuotationController::class, 'index'])->name('quotations.index')->middleware('permission:quotations.view');
    Route::get('quotations/create', [QuotationController::class, 'create'])->name('quotations.create')->middleware('permission:quotations.create');
    Route::get('quotations/search', [QuotationController::class, 'search'])->name('quotations.search')->middleware('permission:quotations.view');
    Route::post('quotations', [QuotationController::class, 'store'])->name('quotations.store')->middleware('permission:quotations.create');
    Route::get('quotations/{quotation}', [QuotationController::class, 'show'])->name('quotations.show')->middleware('permission:quotations.view');
    Route::get('quotations/{quotation}/edit', [QuotationController::class, 'edit'])->name('quotations.edit')->middleware('permission:quotations.update');
    Route::put('quotations/{quotation}', [QuotationController::class, 'update'])->name('quotations.update')->middleware('permission:quotations.update');
    Route::patch('quotations/{quotation}/status', [QuotationController::class, 'updateStatus'])->name('quotations.status.update')->middleware('permission:quotations.status.update');
    Route::patch('quotations/{quotation}/progress', [QuotationController::class, 'updateProgress'])->name('quotations.progress.update')->middleware('permission:quotations.progress.update');
    Route::post('quotations/{quotation}/revisions', [QuotationController::class, 'storeRevision'])->name('quotations.revisions.store')->middleware('permission:quotations.revisions.create');
    Route::delete('quotations/{quotation}', [QuotationController::class, 'destroy'])->name('quotations.destroy')->middleware('permission:quotations.delete');
    Route::get('quotations/{quotation}/bom-items', [QuotationController::class, 'bomItems'])->name('quotations.bom-items.index')->middleware('permission:quotations.view');
    Route::get('quotations/{quotation}/items', [QuotationController::class, 'items'])->name('quotations.items.index')->middleware('permission:quotations.view');
    Route::get('quotations/{quotation}/print', [QuotationController::class, 'print'])->name('quotations.print')->middleware('permission:quotations.view');

    Route::get('delivery-orders', [DeliveryOrderController::class, 'index'])->name('delivery-orders.index')->middleware('permission:delivery-orders.view');
    Route::get('delivery-orders/create', [DeliveryOrderController::class, 'create'])->name('delivery-orders.create')->middleware('permission:delivery-orders.create');
    Route::post('delivery-orders', [DeliveryOrderController::class, 'store'])->name('delivery-orders.store')->middleware('permission:delivery-orders.create');
    Route::get('delivery-orders/{deliveryOrder}', [DeliveryOrderController::class, 'show'])->name('delivery-orders.show')->middleware('permission:delivery-orders.view');
    Route::get('delivery-orders/{deliveryOrder}/edit', [DeliveryOrderController::class, 'edit'])->name('delivery-orders.edit')->middleware('permission:delivery-orders.update');
    Route::put('delivery-orders/{deliveryOrder}', [DeliveryOrderController::class, 'update'])->name('delivery-orders.update')->middleware('permission:delivery-orders.update');
    Route::delete('delivery-orders/{deliveryOrder}', [DeliveryOrderController::class, 'destroy'])->name('delivery-orders.destroy')->middleware('permission:delivery-orders.delete');
    Route::patch('delivery-orders/{deliveryOrder}/confirm', [DeliveryOrderController::class, 'confirm'])->name('delivery-orders.confirm')->middleware('permission:delivery-orders.confirm');
    Route::patch('delivery-orders/{deliveryOrder}/cancel', [DeliveryOrderController::class, 'cancel'])->name('delivery-orders.cancel')->middleware('permission:delivery-orders.cancel');
    Route::get('delivery-orders/{deliveryOrder}/signed-document', [DeliveryOrderController::class, 'downloadSignedDocument'])->name('delivery-orders.signed-document')->middleware('permission:delivery-orders.view');
    Route::get('delivery-orders/{deliveryOrder}/print', [DeliveryOrderController::class, 'print'])->name('delivery-orders.print')->middleware('permission:delivery-orders.view');

    Route::get('invoices', [InvoiceController::class, 'index'])->name('invoices.index')->middleware('permission:invoices.view');
    Route::get('invoices/create', [InvoiceController::class, 'create'])->name('invoices.create')->middleware('permission:invoices.create');
    Route::post('invoices', [InvoiceController::class, 'store'])->name('invoices.store')->middleware('permission:invoices.create');
    Route::get('invoices/{invoice}', [InvoiceController::class, 'show'])->name('invoices.show')->middleware('permission:invoices.view');
    Route::get('invoices/{invoice}/edit', [InvoiceController::class, 'edit'])->name('invoices.edit')->middleware('permission:invoices.update');
    Route::put('invoices/{invoice}', [InvoiceController::class, 'update'])->name('invoices.update')->middleware('permission:invoices.update');
    Route::delete('invoices/{invoice}', [InvoiceController::class, 'destroy'])->name('invoices.destroy')->middleware('permission:invoices.delete');
    Route::patch('invoices/{invoice}/issue', [InvoiceController::class, 'issue'])->name('invoices.issue')->middleware('permission:invoices.issue');
    Route::patch('invoices/{invoice}/payment-terms', [InvoiceController::class, 'updatePaymentTerms'])->name('invoices.payment-terms.update')->middleware('permission:invoices.payment-terms.update');
    Route::get('invoices/{invoice}/print', [InvoiceController::class, 'print'])->name('invoices.print')->middleware('permission:invoices.view');
    Route::post('invoices/{invoice}/payments', [InvoicePaymentController::class, 'store'])->name('invoices.payments.store')->middleware('permission:invoices.payments.create');
    Route::patch('invoices/{invoice}/payments/{payment}/cancel', [InvoicePaymentController::class, 'cancel'])->name('invoices.payments.cancel')->middleware('permission:invoices.payments.cancel');

    Route::get('boms/search', [BomController::class, 'search'])->name('boms.search')->middleware('permission:bom.view');
    Route::get('boms/{bom}/import-data', [BomController::class, 'importData'])->name('boms.import-data')->middleware('permission:bom.view');

    Route::get('quotations/{quotation}/bom/create', [BomController::class, 'create'])->name('quotations.bom.create')->middleware('permission:bom.create');
    Route::post('quotations/{quotation}/bom', [BomController::class, 'store'])->name('quotations.bom.store')->middleware('permission:bom.create');
    Route::get('quotations/{quotation}/bom', [BomController::class, 'show'])->name('quotations.bom.show')->middleware('permission:bom.view');
    Route::get('quotations/{quotation}/bom/print', [BomController::class, 'print'])->name('quotations.bom.print')->middleware('permission:bom.view');
    Route::get('quotations/{quotation}/bom/edit', [BomController::class, 'edit'])->name('quotations.bom.edit')->middleware('permission:bom.update');
    Route::put('quotations/{quotation}/bom', [BomController::class, 'update'])->name('quotations.bom.update')->middleware('permission:bom.update');
    Route::delete('quotations/{quotation}/bom', [BomController::class, 'destroy'])->name('quotations.bom.destroy')->middleware('permission:bom.delete');

    Route::get('purchase-orders', [PurchaseOrderController::class, 'index'])->name('purchase-orders.index')->middleware('permission:purchase-orders.view');
    Route::get('purchase-orders/create', [PurchaseOrderController::class, 'create'])->name('purchase-orders.create')->middleware('permission:purchase-orders.create');
    Route::get('purchase-orders/search', [PurchaseOrderController::class, 'search'])->name('purchase-orders.search')->middleware('permission:purchase-orders.view');
    Route::post('purchase-orders', [PurchaseOrderController::class, 'store'])->name('purchase-orders.store')->middleware('permission:purchase-orders.create');
    Route::get('purchase-orders/{purchaseOrder}', [PurchaseOrderController::class, 'show'])->name('purchase-orders.show')->middleware('permission:purchase-orders.view');
    Route::get('purchase-orders/{purchaseOrder}/edit', [PurchaseOrderController::class, 'edit'])->name('purchase-orders.edit')->middleware('permission:purchase-orders.update');
    Route::put('purchase-orders/{purchaseOrder}', [PurchaseOrderController::class, 'update'])->name('purchase-orders.update')->middleware('permission:purchase-orders.update');
    Route::delete('purchase-orders/{purchaseOrder}', [PurchaseOrderController::class, 'destroy'])->name('purchase-orders.destroy')->middleware('permission:purchase-orders.delete');
    Route::patch('purchase-orders/{purchaseOrder}/issue', [PurchaseOrderController::class, 'issue'])->name('purchase-orders.issue')->middleware('permission:purchase-orders.issue');
    Route::patch('purchase-orders/{purchaseOrder}/check', [PurchaseOrderController::class, 'check'])->name('purchase-orders.check')->middleware('permission:purchase-orders.check');
    Route::patch('purchase-orders/{purchaseOrder}/approve', [PurchaseOrderController::class, 'approve'])->name('purchase-orders.approve')->middleware('permission:purchase-orders.approve');
    Route::patch('purchase-orders/{purchaseOrder}/reject', [PurchaseOrderController::class, 'reject'])->name('purchase-orders.reject')->middleware('permission:purchase-orders.reject');
    Route::patch('purchase-orders/{purchaseOrder}/cancel', [PurchaseOrderController::class, 'cancel'])->name('purchase-orders.cancel')->middleware('permission:purchase-orders.cancel');
    Route::patch('purchase-orders/{purchaseOrder}/void', [PurchaseOrderController::class, 'void'])->name('purchase-orders.void')->middleware('permission:purchase-orders.void');
    Route::patch('purchase-orders/{purchaseOrder}/progress', [PurchaseOrderController::class, 'updateProgress'])->name('purchase-orders.progress.update')->middleware('permission:purchase-orders.progress.update');
    Route::get('purchase-orders/{purchaseOrder}/items', [PurchaseOrderController::class, 'items'])->name('purchase-orders.items.index')->middleware('permission:purchase-orders.view');
    Route::get('purchase-orders/{purchaseOrder}/invoice-items', [PurchaseOrderController::class, 'invoiceItems'])->name('purchase-orders.invoice-items.index')->middleware('permission:purchase-orders.view');
    Route::get('purchase-orders/{purchaseOrder}/print', [PurchaseOrderController::class, 'print'])->name('purchase-orders.print')->middleware('permission:purchase-orders.view');

    Route::get('purchase-invoices', [PurchaseInvoiceController::class, 'index'])->name('purchase-invoices.index')->middleware('permission:purchase-invoices.view');
    Route::get('purchase-invoices/create', [PurchaseInvoiceController::class, 'create'])->name('purchase-invoices.create')->middleware('permission:purchase-invoices.create');
    Route::post('purchase-invoices', [PurchaseInvoiceController::class, 'store'])->name('purchase-invoices.store')->middleware('permission:purchase-invoices.create');
    Route::get('purchase-invoices/{purchaseInvoice}', [PurchaseInvoiceController::class, 'show'])->name('purchase-invoices.show')->middleware('permission:purchase-invoices.view');
    Route::get('purchase-invoices/{purchaseInvoice}/edit', [PurchaseInvoiceController::class, 'edit'])->name('purchase-invoices.edit')->middleware('permission:purchase-invoices.update');
    Route::put('purchase-invoices/{purchaseInvoice}', [PurchaseInvoiceController::class, 'update'])->name('purchase-invoices.update')->middleware('permission:purchase-invoices.update');
    Route::delete('purchase-invoices/{purchaseInvoice}', [PurchaseInvoiceController::class, 'destroy'])->name('purchase-invoices.destroy')->middleware('permission:purchase-invoices.delete');
    Route::patch('purchase-invoices/{purchaseInvoice}/issue', [PurchaseInvoiceController::class, 'issue'])->name('purchase-invoices.issue')->middleware('permission:purchase-invoices.issue');
    Route::post('purchase-invoices/{purchaseInvoice}/payments', [PurchaseInvoicePaymentController::class, 'store'])->name('purchase-invoices.payments.store')->middleware('permission:purchase-invoices.payments.create');
    Route::patch('purchase-invoices/{purchaseInvoice}/payments/{payment}/cancel', [PurchaseInvoicePaymentController::class, 'cancel'])->name('purchase-invoices.payments.cancel')->middleware('permission:purchase-invoices.payments.cancel');

    Route::get('goods-receipt-notes', [GoodsReceiptNoteController::class, 'index'])->name('goods-receipt-notes.index')->middleware('permission:goods-receipt-notes.view');
    Route::get('goods-receipt-notes/create', [GoodsReceiptNoteController::class, 'create'])->name('goods-receipt-notes.create')->middleware('permission:goods-receipt-notes.create');
    Route::post('goods-receipt-notes', [GoodsReceiptNoteController::class, 'store'])->name('goods-receipt-notes.store')->middleware('permission:goods-receipt-notes.create');
    Route::get('goods-receipt-notes/{goodsReceiptNote}', [GoodsReceiptNoteController::class, 'show'])->name('goods-receipt-notes.show')->middleware('permission:goods-receipt-notes.view');
    Route::get('goods-receipt-notes/{goodsReceiptNote}/edit', [GoodsReceiptNoteController::class, 'edit'])->name('goods-receipt-notes.edit')->middleware('permission:goods-receipt-notes.update');
    Route::put('goods-receipt-notes/{goodsReceiptNote}', [GoodsReceiptNoteController::class, 'update'])->name('goods-receipt-notes.update')->middleware('permission:goods-receipt-notes.update');
    Route::delete('goods-receipt-notes/{goodsReceiptNote}', [GoodsReceiptNoteController::class, 'destroy'])->name('goods-receipt-notes.destroy')->middleware('permission:goods-receipt-notes.delete');
    Route::patch('goods-receipt-notes/{goodsReceiptNote}/confirm', [GoodsReceiptNoteController::class, 'confirm'])->name('goods-receipt-notes.confirm')->middleware('permission:goods-receipt-notes.confirm');
    Route::patch('goods-receipt-notes/{goodsReceiptNote}/cancel', [GoodsReceiptNoteController::class, 'cancel'])->name('goods-receipt-notes.cancel')->middleware('permission:goods-receipt-notes.cancel');

    Route::get('users', [UserController::class, 'index'])->name('users.index')->middleware('permission:users.view');
    Route::get('users/create', [UserController::class, 'create'])->name('users.create')->middleware('permission:users.create');
    Route::post('users', [UserController::class, 'store'])->name('users.store')->middleware('permission:users.create');
    Route::get('users/{user}', [UserController::class, 'show'])->name('users.show')->middleware('permission:users.view');
    Route::get('users/{user}/edit', [UserController::class, 'edit'])->name('users.edit')->middleware('permission:users.update');
    Route::put('users/{user}', [UserController::class, 'update'])->name('users.update')->middleware('permission:users.update');
    Route::delete('users/{user}', [UserController::class, 'destroy'])->name('users.destroy')->middleware('permission:users.delete');

    Route::get('design-reference', [DesignReferenceController::class, 'index'])->name('design-reference')->middleware('role:Super Admin');

    Route::get('equipment', [EquipmentController::class, 'index'])->name('equipment.index')->middleware('permission:equipment.view');
    Route::get('equipment/create', [EquipmentController::class, 'create'])->name('equipment.create')->middleware('permission:equipment.create');
    Route::post('equipment', [EquipmentController::class, 'store'])->name('equipment.store')->middleware('permission:equipment.create');
    Route::get('equipment/search', [EquipmentController::class, 'search'])->name('equipment.search')->middleware('permission:equipment.view');
    Route::get('equipment/{equipment}', [EquipmentController::class, 'show'])->name('equipment.show')->middleware('permission:equipment.view');
    Route::get('equipment/{equipment}/edit', [EquipmentController::class, 'edit'])->name('equipment.edit')->middleware('permission:equipment.update');
    Route::put('equipment/{equipment}', [EquipmentController::class, 'update'])->name('equipment.update')->middleware('permission:equipment.update');
    Route::delete('equipment/{equipment}', [EquipmentController::class, 'destroy'])->name('equipment.destroy')->middleware('permission:equipment.delete');
    Route::get('equipment/{equipment}/picture', [EquipmentController::class, 'picture'])->name('equipment.picture')->middleware('permission:equipment.view');

    Route::post('equipment/{equipment}/calibrations', [EquipmentCalibrationController::class, 'store'])->name('equipment.calibrations.store')->middleware('permission:equipment.calibrations.create');
    Route::get('equipment/{equipment}/calibrations/{calibration}/certificate', [EquipmentCalibrationController::class, 'download'])->name('equipment.calibrations.download')->middleware('permission:equipment.view');
    Route::put('equipment/{equipment}/calibrations/{calibration}', [EquipmentCalibrationController::class, 'update'])->name('equipment.calibrations.update')->middleware('permission:equipment.calibrations.update');
    Route::delete('equipment/{equipment}/calibrations/{calibration}', [EquipmentCalibrationController::class, 'destroy'])->name('equipment.calibrations.destroy')->middleware('permission:equipment.calibrations.delete');

    Route::post('equipment/{equipment}/assignments', [EquipmentAssignmentController::class, 'store'])->name('equipment.assignments.store')->middleware('permission:equipment.assignments.create');
    Route::patch('equipment/{equipment}/assignments/{assignment}/return', [EquipmentAssignmentController::class, 'return'])->name('equipment.assignments.return')->middleware('permission:equipment.assignments.update');

    Route::get('roles', [RoleController::class, 'index'])->name('roles.index')->middleware('permission:roles.view');
    Route::get('roles/create', [RoleController::class, 'create'])->name('roles.create')->middleware('permission:roles.create');
    Route::post('roles', [RoleController::class, 'store'])->name('roles.store')->middleware('permission:roles.create');
    Route::get('roles/{role}', [RoleController::class, 'show'])->name('roles.show')->middleware('permission:roles.view');
    Route::get('roles/{role}/edit', [RoleController::class, 'edit'])->name('roles.edit')->middleware('permission:roles.update');
    Route::put('roles/{role}', [RoleController::class, 'update'])->name('roles.update')->middleware('permission:roles.update');
    Route::delete('roles/{role}', [RoleController::class, 'destroy'])->name('roles.destroy')->middleware('permission:roles.delete');
});

require __DIR__.'/settings.php';
