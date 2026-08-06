import { Head, usePage } from '@inertiajs/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { dashboard } from '@/routes';
import { FinanceTab } from '@/pages/dashboard/finance-tab';
import { ManagementTab } from '@/pages/dashboard/management-tab';
import { PurchasingTab } from '@/pages/dashboard/purchasing-tab';
import { StaffTab } from '@/pages/dashboard/staff-tab';

type ManagementData = React.ComponentProps<typeof ManagementTab>;
type FinanceData = React.ComponentProps<typeof FinanceTab>;
type PurchasingData = React.ComponentProps<typeof PurchasingTab>;
type StaffData = React.ComponentProps<typeof StaffTab>;

type Props = {
    management?: ManagementData;
    finance?: FinanceData;
    purchasing?: PurchasingData;
    staff: StaffData;
};

export default function Dashboard({ management, finance, purchasing, staff }: Props) {
    const tabs = [
        management && { value: 'management', label: 'Management' },
        finance && { value: 'finance', label: 'Finance' },
        purchasing && { value: 'purchasing', label: 'Purchasing' },
        { value: 'staff', label: 'My Projects' },
    ].filter(Boolean) as { value: string; label: string }[];

    const defaultTab = tabs[0]?.value ?? 'staff';

    return (
        <>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto p-4">
                <Tabs defaultValue={defaultTab}>
                    {tabs.length > 1 && (
                        <TabsList>
                            {tabs.map((tab) => (
                                <TabsTrigger key={tab.value} value={tab.value}>
                                    {tab.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    )}

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
                        <StaffTab {...staff} />
                    </TabsContent>
                </Tabs>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [{ title: 'Dashboard', href: dashboard() }],
};
