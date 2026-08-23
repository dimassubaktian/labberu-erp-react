import { Form, Head, Link, usePage } from '@inertiajs/react';
import { InfoIcon, X } from 'lucide-react';
import { useState } from 'react';
import { AsyncCombobox } from '@/components/async-combobox';
import { Combobox } from '@/components/combobox';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { QuickCreateCustomerDialog } from '@/components/quick-create-customer-dialog';
import type { QuickCreatedCustomer } from '@/components/quick-create-customer-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { create as businessLineCreate } from '@/routes/business-lines';
import { search as searchCustomers } from '@/routes/customers';
import { create, index, store } from '@/routes/projects';

type CustomerOption = {
    id: number;
    name: string;
    customer_code: string;
};

type WorkforceOption = {
    id: number;
    full_name: string;
};

type BusinessLineOption = {
    id: number;
    name: string;
};

function todayDate(): string {
    return new Date().toISOString().slice(0, 10);
}

type Props = {
    workforces: WorkforceOption[];
    businessLines: BusinessLineOption[];
};

export default function ProjectsCreate({ workforces, businessLines }: Props) {
    const { auth } = usePage().props;
    const canCreateCustomer = auth.permissions.includes('customers.create');
    const canCreateBusinessLine = auth.permissions.includes(
        'business-lines.create',
    );

    const [customerId, setCustomerId] = useState('');
    const [selectedCustomer, setSelectedCustomer] =
        useState<CustomerOption | null>(null);
    const [personInChargeId, setPersonInChargeId] = useState('');
    const [businessLineId, setBusinessLineId] = useState('');
    const [status, setStatus] = useState('new');
    const [priority, setPriority] = useState('medium');

    function handleCustomerCreated(customer: QuickCreatedCustomer): void {
        setCustomerId(String(customer.id));
        setSelectedCustomer(customer);
    }

    return (
        <>
            <Head title="New Project" />

            <div className="mx-auto w-full max-w-5xl space-y-6 p-4">
                <Heading
                    title="New Project"
                    description="Add a new project for your organization"
                />

                <Form noValidate {...store.form()} className="space-y-6">
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    required
                                    autoFocus
                                    placeholder="e.g. Panel Retrofit"
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-2 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <Label htmlFor="customer_id">
                                            Customer
                                        </Label>
                                        {canCreateCustomer && (
                                            <QuickCreateCustomerDialog
                                                onCreated={
                                                    handleCustomerCreated
                                                }
                                            />
                                        )}
                                    </div>
                                    <input
                                        type="hidden"
                                        name="customer_id"
                                        value={customerId}
                                    />
                                    <AsyncCombobox<CustomerOption>
                                        id="customer_id"
                                        value={customerId}
                                        onValueChange={(value, option) => {
                                            setCustomerId(value);
                                            setSelectedCustomer(option ?? null);
                                        }}
                                        searchUrl={searchCustomers().url}
                                        getOptionId={(customer) =>
                                            String(customer.id)
                                        }
                                        getOptionLabel={(customer) =>
                                            customer.name
                                        }
                                        initialOption={selectedCustomer}
                                        placeholder="Select a customer"
                                    />
                                    <InputError message={errors.customer_id} />
                                </div>

                                <div className="grid gap-2">
                                    <div className="flex h-8 items-center gap-2">
                                        <Label htmlFor="request_date">
                                            Request date
                                        </Label>
                                    </div>
                                    <Input
                                        id="request_date"
                                        type="date"
                                        name="request_date"
                                        required
                                        defaultValue={todayDate()}
                                    />
                                    <InputError message={errors.request_date} />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="person_in_charge_id">
                                    Person in charge
                                </Label>
                                <input
                                    type="hidden"
                                    name="person_in_charge_id"
                                    value={personInChargeId}
                                />
                                <Combobox<WorkforceOption>
                                    id="person_in_charge_id"
                                    value={personInChargeId}
                                    onValueChange={setPersonInChargeId}
                                    options={workforces}
                                    getOptionId={(workforce) =>
                                        String(workforce.id)
                                    }
                                    getOptionLabel={(workforce) =>
                                        workforce.full_name
                                    }
                                    placeholder="Optional"
                                />
                                <InputError
                                    message={errors.person_in_charge_id}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="business_line_id">
                                    Business line
                                </Label>
                                {businessLines.length === 0 && (
                                    <Alert variant="info">
                                        <InfoIcon />
                                        <AlertTitle>
                                            No business lines yet
                                        </AlertTitle>
                                        <AlertDescription>
                                            {canCreateBusinessLine ? (
                                                <span>
                                                    Add one from{' '}
                                                    <Link
                                                        href={businessLineCreate()}
                                                        className="underline"
                                                    >
                                                        Business Lines
                                                    </Link>{' '}
                                                    before assigning it here.
                                                </span>
                                            ) : (
                                                'Ask an admin to add a business line before it can be assigned here.'
                                            )}
                                        </AlertDescription>
                                    </Alert>
                                )}
                                <input
                                    type="hidden"
                                    name="business_line_id"
                                    value={businessLineId}
                                />
                                <Select
                                    value={businessLineId}
                                    onValueChange={setBusinessLineId}
                                >
                                    <SelectTrigger
                                        id="business_line_id"
                                        className="w-full"
                                    >
                                        <SelectValue placeholder="Optional" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {businessLines.map((bl) => (
                                            <SelectItem
                                                key={bl.id}
                                                value={String(bl.id)}
                                            >
                                                {bl.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.business_line_id} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    placeholder="Optional"
                                />
                                <InputError message={errors.description} />
                            </div>

                            <div className="grid gap-2 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="status">Status</Label>
                                    <input
                                        type="hidden"
                                        name="status"
                                        value={status}
                                    />
                                    <Select
                                        value={status}
                                        onValueChange={setStatus}
                                    >
                                        <SelectTrigger
                                            id="status"
                                            className="w-full"
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="new">
                                                New
                                            </SelectItem>
                                            <SelectItem value="planning">
                                                Planning
                                            </SelectItem>
                                            <SelectItem value="in_progress">
                                                In progress
                                            </SelectItem>
                                            <SelectItem value="completed">
                                                Completed
                                            </SelectItem>
                                            <SelectItem value="cancelled">
                                                Cancelled
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.status} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="priority">Priority</Label>
                                    <input
                                        type="hidden"
                                        name="priority"
                                        value={priority}
                                    />
                                    <Select
                                        value={priority}
                                        onValueChange={setPriority}
                                    >
                                        <SelectTrigger
                                            id="priority"
                                            className="w-full"
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">
                                                Low
                                            </SelectItem>
                                            <SelectItem value="medium">
                                                Medium
                                            </SelectItem>
                                            <SelectItem value="high">
                                                High
                                            </SelectItem>
                                            <SelectItem value="urgent">
                                                Urgent
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.priority} />
                                </div>
                            </div>

                            <div className="grid gap-2 sm:max-w-xs">
                                <Label htmlFor="equipment_calibration_max_age_months">
                                    Required equipment calibration recency
                                    (months)
                                </Label>
                                <Input
                                    id="equipment_calibration_max_age_months"
                                    type="number"
                                    step="1"
                                    min="1"
                                    max="120"
                                    name="equipment_calibration_max_age_months"
                                    placeholder="Optional"
                                />
                                <p className="text-sm text-muted-foreground">
                                    If set, equipment checked out to this
                                    project must have been calibrated within
                                    this many months, or checkout is blocked.
                                    Leave empty if the customer has no such
                                    requirement.
                                </p>
                                <InputError
                                    message={
                                        errors.equipment_calibration_max_age_months
                                    }
                                />
                            </div>

                            <div className="grid gap-2 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="start_date">
                                        Start date
                                    </Label>
                                    <Input
                                        id="start_date"
                                        type="date"
                                        name="start_date"
                                    />
                                    <InputError message={errors.start_date} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="end_date">End date</Label>
                                    <Input
                                        id="end_date"
                                        type="date"
                                        name="end_date"
                                    />
                                    <InputError message={errors.end_date} />
                                </div>
                            </div>

                            <div className="grid gap-2 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="estimate_contract_value">
                                        Estimated contract value
                                    </Label>
                                    <Input
                                        id="estimate_contract_value"
                                        type="number"
                                        step="1"
                                        min="0"
                                        name="estimate_contract_value"
                                        placeholder="Optional"
                                    />
                                    <InputError
                                        message={errors.estimate_contract_value}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="estimate_cost">
                                        Estimated cost
                                    </Label>
                                    <Input
                                        id="estimate_cost"
                                        type="number"
                                        step="1"
                                        min="0"
                                        name="estimate_cost"
                                        placeholder="Optional"
                                    />
                                    <InputError
                                        message={errors.estimate_cost}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                    asChild
                                >
                                    <Link href={index()}>
                                        <X /> Cancel
                                    </Link>
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing && <Spinner />}
                                    Create project
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}

ProjectsCreate.layout = {
    breadcrumbs: [
        { title: 'Projects', href: index() },
        { title: 'New', href: create() },
    ],
};
