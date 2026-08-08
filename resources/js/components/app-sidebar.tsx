import { Link, usePage } from '@inertiajs/react';
import {
    ArrowLeftRight,
    Briefcase,
    Building2,
    ClipboardEdit,
    Coins,
    Contact,
    FileText,
    FolderKanban,
    Layers,
    LayoutGrid,
    Package,
    PackageCheck,
    Percent,
    Receipt,
    ScrollText,
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
import { index as businessLinesIndex } from '@/routes/business-lines';
import { index as jobTitlesIndex } from '@/routes/job-titles';
import { index as paymentTermTemplatesIndex } from '@/routes/payment-term-templates';
import { index as productsIndex } from '@/routes/products';
import { index as projectsIndex } from '@/routes/projects';
import { index as purchaseOrdersIndex } from '@/routes/purchase-orders';
import { index as quotationsIndex } from '@/routes/quotations';
import { index as rolesIndex } from '@/routes/roles';
import { index as stockAdjustmentsIndex } from '@/routes/stock-adjustments';
import { index as stockMovementsIndex } from '@/routes/stock-movements';
import { index as taxesIndex } from '@/routes/taxes';
import { index as usersIndex } from '@/routes/users';
import { index as vendorsIndex } from '@/routes/vendors';
import { index as workforcesIndex } from '@/routes/workforces';
import type { NavGroup } from '@/types';

const navGroups: NavGroup[] = [
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
                permission: 'projects.view',
            },
            {
                title: 'Quotations',
                href: quotationsIndex(),
                icon: FileText,
                permission: 'quotations.view',
            },
            {
                title: 'Delivery Orders',
                href: deliveryOrdersIndex(),
                icon: Truck,
                permission: 'delivery-orders.view',
            },
            {
                title: 'Customers',
                href: customersIndex(),
                icon: Contact,
                permission: 'customers.view',
            },
            {
                title: 'Business Lines',
                href: businessLinesIndex(),
                icon: Layers,
                permission: 'business-lines.view',
            },
        ],
    },
    {
        label: 'Purchase',
        items: [
            {
                title: 'Purchase Orders',
                href: purchaseOrdersIndex(),
                icon: ShoppingCart,
                permission: 'purchase-orders.view',
            },
            {
                title: 'Goods Receipt Note',
                href: goodsReceiptNotesIndex(),
                icon: PackageCheck,
                permission: 'goods-receipt-notes.view',
            },
            {
                title: 'Vendors',
                href: vendorsIndex(),
                icon: Building2,
                permission: 'vendors.view',
            },
        ],
    },
    {
        label: 'Inventory',
        items: [
            {
                title: 'Products',
                href: productsIndex(),
                icon: Package,
                permission: 'products.view',
            },
            {
                title: 'Stock Movements',
                href: stockMovementsIndex(),
                icon: ArrowLeftRight,
                permission: 'stock-movements.view',
            },
            {
                title: 'Stock Adjustments',
                href: stockAdjustmentsIndex(),
                icon: ClipboardEdit,
                permission: 'stock-adjustments.view',
            },
        ],
    },
    {
        label: 'Finance',
        items: [
            {
                title: 'Invoice',
                href: invoicesIndex(),
                icon: Receipt,
                permission: 'invoices.view',
            },
            {
                title: 'Taxes',
                href: taxesIndex(),
                icon: Percent,
                permission: 'taxes.view',
            },
            {
                title: 'Payment Term Templates',
                href: paymentTermTemplatesIndex(),
                icon: ScrollText,
                permission: 'payment-term-templates.view',
            },
            {
                title: 'Currencies',
                href: currenciesIndex(),
                icon: Coins,
                permission: 'currencies.view',
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
                permission: 'workforces.view',
            },
            {
                title: 'Job Titles',
                href: jobTitlesIndex(),
                icon: Briefcase,
                permission: 'job-titles.view',
            },
        ],
    },
    {
        label: 'System',
        items: [
            {
                title: 'Users',
                href: usersIndex(),
                icon: UserCog,
                permission: 'users.view',
            },
            {
                title: 'Roles',
                href: rolesIndex(),
                icon: ShieldCheck,
                permission: 'roles.view',
            },
            {
                title: 'Settings',
                href: companySettingsEdit(),
                icon: Settings,
                permission: 'company-settings.view',
            },
        ],
    },
];

export function AppSidebar() {
    const { auth } = usePage().props;
    const permissions = auth.permissions ?? [];

    const visibleNavGroups = navGroups
        .map((group) => ({
            ...group,
            items: group.items.filter(
                (item) =>
                    !item.permission || permissions.includes(item.permission),
            ),
        }))
        .filter((group) => group.items.length > 0);

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
                <NavMain groups={visibleNavGroups} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
