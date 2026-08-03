import { Link } from '@inertiajs/react';
import {
    ArrowLeftRight,
    Briefcase,
    Building2,
    ClipboardEdit,
    Coins,
    Contact,
    FileText,
    FolderKanban,
    LayoutGrid,
    Package,
    PackageCheck,
    Percent,
    Receipt,
    Settings,
    ShieldCheck,
    ShoppingCart,
    Truck,
    UserCog,
    Users,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { edit as companySettingsEdit } from '@/routes/company-settings';
import { index as currenciesIndex } from '@/routes/currencies';
import { index as customersIndex } from '@/routes/customers';
import { index as deliveryOrdersIndex } from '@/routes/delivery-orders';
import { index as goodsReceiptNotesIndex } from '@/routes/goods-receipt-notes';
import { index as invoicesIndex } from '@/routes/invoices';
import { index as jobTitlesIndex } from '@/routes/job-titles';
import { index as productsIndex } from '@/routes/products';
import { index as projectsIndex } from '@/routes/projects';
import { index as purchaseOrdersIndex } from '@/routes/purchase-orders';
import { index as quotationsIndex } from '@/routes/quotations';
import { index as stockAdjustmentsIndex } from '@/routes/stock-adjustments';
import { index as stockMovementsIndex } from '@/routes/stock-movements';
import { index as taxesIndex } from '@/routes/taxes';
import { index as vendorsIndex } from '@/routes/vendors';
import { index as workforcesIndex } from '@/routes/workforces';
import type { NavGroup } from '@/types';

const mainNavGroups: NavGroup[] = [
    {
        label: 'Menu',
        items: [
            {
                title: 'Dashboard',
                href: dashboard(),
                icon: LayoutGrid,
            },
        ],
    },
    {
        label: 'Sales & CRM',
        items: [
            {
                title: 'Projects',
                href: projectsIndex(),
                icon: FolderKanban,
            },
            { title: 'Quotations', href: quotationsIndex(), icon: FileText },
            {
                title: 'Deliver Orders',
                href: deliveryOrdersIndex(),
                icon: Truck,
            },
            { title: 'Customers', href: customersIndex(), icon: Contact },
        ],
    },
    {
        label: 'Purchase',
        items: [
            {
                title: 'Purchase Orders',
                href: purchaseOrdersIndex(),
                icon: ShoppingCart,
            },
            {
                title: 'Goods Receipt Note',
                href: goodsReceiptNotesIndex(),
                icon: PackageCheck,
            },
            { title: 'Vendors', href: vendorsIndex(), icon: Building2 },
        ],
    },
    {
        label: 'Inventory',
        items: [
            { title: 'Products', href: productsIndex(), icon: Package },
            {
                title: 'Stock Movements',
                href: stockMovementsIndex(),
                icon: ArrowLeftRight,
            },
            {
                title: 'Stock Adjustments',
                href: stockAdjustmentsIndex(),
                icon: ClipboardEdit,
            },
        ],
    },
    {
        label: 'Finance',
        items: [
            { title: 'Invoice', href: invoicesIndex(), icon: Receipt },
            { title: 'Taxes', href: taxesIndex(), icon: Percent },
            {
                title: 'Currencies',
                href: currenciesIndex(),
                icon: Coins,
            },
        ],
    },
    {
        label: 'HR',
        items: [
            {
                title: 'Workforces',
                href: workforcesIndex(),
                icon: Users,
            },
            {
                title: 'Job Titles',
                href: jobTitlesIndex(),
                icon: Briefcase,
            },
        ],
    },
    {
        label: 'System',
        items: [
            { title: 'Users', href: '#', icon: UserCog, disabled: true },
            { title: 'Roles', href: '#', icon: ShieldCheck, disabled: true },
            {
                title: 'Settings',
                href: companySettingsEdit(),
                icon: Settings,
            },
        ],
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain groups={mainNavGroups} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
