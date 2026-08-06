import { Head, router } from '@inertiajs/react';
import * as React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { dashboard } from '@/routes';
import { FinanceTab } from '@/pages/dashboard/finance-tab';
import { ManagementTab } from '@/pages/dashboard/management-tab';
import { PurchasingTab } from '@/pages/dashboard/purchasing-tab';
import { StaffTab } from '@/pages/dashboard/staff-tab';

type ManagementData = React.ComponentProps<typeof ManagementTab>;
type FinanceData = React.ComponentProps<typeof FinanceTab>;
type PurchasingData = React.ComponentProps<typeof PurchasingTab>;
type StaffData = Omit<React.ComponentProps<typeof StaffTab>, 'staffStatus' | 'staffPriority' | 'onFilterChange'>;

type Filters = {
    year: number;
    staff_status: string;
    staff_priority: string;
};

type Props = {
    management?: ManagementData;
    finance?: FinanceData;
    purchasing?: PurchasingData;
    staff: StaffData;
    filters: Filters;
    available_years: number[];
};

const DEFAULT_FILTERS: Filters = {
    year: new Date().getFullYear(),
    staff_status: 'all',
    staff_priority: 'all',
};

const CHART_TABS = ['management', 'finance', 'purchasing'];

export default function Dashboard({ management, finance, purchasing, staff, filters, available_years }: Props) {
    const tabs = [
        management && { value: 'management', label: 'Management' },
        finance && { value: 'finance', label: 'Finance' },
        purchasing && { value: 'purchasing', label: 'Purchasing' },
        { value: 'staff', label: 'My Projects' },
    ].filter(Boolean) as { value: string; label: string }[];

    const defaultTab = tabs[0]?.value ?? 'staff';
    const [activeTab, setActiveTab] = React.useState(defaultTab);

    function applyFilters(overrides: Partial<Filters>): void {
        const next = { ...filters, ...overrides };
        router.get(
            dashboard.url({
                query: {
                    year: next.year !== DEFAULT_FILTERS.year ? String(next.year) : undefined,
                    staff_status: next.staff_status !== 'all' ? next.staff_status : undefined,
                    staff_priority: next.staff_priority !== 'all' ? next.staff_priority : undefined,
                },
            }),
            {},
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    return (
        <>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto p-4">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <div className="flex items-center gap-2">
                        {tabs.length > 1 && (
                            <TabsList>
                                {tabs.map((tab) => (
                                    <TabsTrigger key={tab.value} value={tab.value}>
                                        {tab.label}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        )}
                        {CHART_TABS.includes(activeTab) && available_years.length > 0 && (
                            <Select
                                value={String(filters.year)}
                                onValueChange={(v) => applyFilters({ year: Number(v) })}
                            >
                                <SelectTrigger className="w-[100px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {available_years.map((y) => (
                                        <SelectItem key={y} value={String(y)}>
                                            {y}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    {management && (
                        <TabsContent value="management">
                            <ManagementTab {...management} />
                        </TabsContent>
                    )}

                    {finance && (
                        <TabsContent value="finance">
                            <FinanceTab {...finance} />
                        </TabsContent>
                    )}

                    {purchasing && (
                        <TabsContent value="purchasing">
                            <PurchasingTab {...purchasing} />
                        </TabsContent>
                    )}

                    <TabsContent value="staff">
                        <StaffTab
                            {...staff}
                            staffStatus={filters.staff_status}
                            staffPriority={filters.staff_priority}
                            onFilterChange={applyFilters}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [{ title: 'Dashboard', href: dashboard() }],
};
