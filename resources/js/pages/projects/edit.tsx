import { Form, Head, Link, setLayoutProps, usePage } from '@inertiajs/react';
import { InfoIcon, X } from 'lucide-react';
import { useState } from 'react';
import { AsyncCombobox } from '@/components/async-combobox';
import { Combobox } from '@/components/combobox';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
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
import { edit, index, show, update } from '@/routes/projects';

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

type Project = {
    id: number;
    uuid: string;
    project_code: string;
    name: string;
    customer_id: number;
    customer: CustomerOption;
    request_date: string;
    person_in_charge_id: number | null;
    business_line_id: number | null;
    description: string | null;
    status: string;
    priority: string;
    equipment_calibration_max_age_months: number | null;
    start_date: string | null;
    end_date: string | null;
    completed_at: string | null;
    estimate_contract_value: string | null;
    estimate_cost: string | null;
    actual_cost: string | null;
    actual_contract_value: string | null;
};

type Props = {
    project: Project;
    workforces: WorkforceOption[];
    businessLines: BusinessLineOption[];
};

function toDateInputValue(value: string | null): string {
    return value ? value.slice(0, 10) : '';
}

export default function ProjectsEdit({
    project,
    workforces,
    businessLines,
}: Props) {
    const { auth } = usePage().props;
    const canCreateBusinessLine = auth.permissions.includes(
        'business-lines.create',
    );
    const [customerId, setCustomerId] = useState(String(project.customer_id));
    const [personInChargeId, setPersonInChargeId] = useState(
        project.person_in_charge_id ? String(project.person_in_charge_id) : '',
    );
    const [businessLineId, setBusinessLineId] = useState(
        project.business_line_id ? String(project.business_line_id) : '',
    );
    const [status, setStatus] = useState(project.status);
    const [priority, setPriority] = useState(project.priority);

    setLayoutProps({
        breadcrumbs: [
            { title: 'Projects', href: index() },
            { title: project.name, href: show(project) },
            { title: 'Edit', href: edit(project) },
        ],
    });

    return (
        <>
            <Head title={`Edit ${project.name}`} />

            <div className="mx-auto w-full max-w-5xl space-y-6 p-4">
                <Heading
                    title="Edit Project"
                    description="Update this project's details"
                />

                <Form
                    noValidate
                    {...update.form(project)}
                    className="space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    required
                                    autoFocus
                                    defaultValue={project.name}
                                    placeholder="e.g. Panel Retrofit"
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-2 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="customer_id">
                                        Customer
                                    </Label>
                                    <input
                                        type="hidden"
                                        name="customer_id"
                                        value={customerId}
                                    />
                                    <AsyncCombobox<CustomerOption>
                                        id="customer_id"
                                        value={customerId}
                                        onValueChange={setCustomerId}
                                        searchUrl={searchCustomers().url}
                                        getOptionId={(customer) =>
                                            String(customer.id)
                                        }
                                        getOptionLabel={(customer) =>
                                            customer.name
                                        }
                                        initialOption={project.customer}
                                        placeholder="Select a customer"
                                    />
                                    <InputError message={errors.customer_id} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="request_date">
                                        Request date
                                    </Label>
                                    <Input
                                        id="request_date"
                                        type="date"
                                        name="request_date"
                                        required
                                        defaultValue={toDateInputValue(
                                            project.request_date,
                                        )}
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
                                    defaultValue={project.description ?? ''}
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

                            <div className="grid gap-2">
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
                                    defaultValue={
                                        project.equipment_calibration_max_age_months ??
                                        ''
                                    }
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
                                        defaultValue={toDateInputValue(
                                            project.start_date,
                                        )}
                                    />
                                    <InputError message={errors.start_date} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="end_date">End date</Label>
                                    <Input
                                        id="end_date"
                                        type="date"
                                        name="end_date"
                                        defaultValue={toDateInputValue(
                                            project.end_date,
                                        )}
                                    />
                                    <InputError message={errors.end_date} />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="completed_at">
                                    Completed at
                                </Label>
                                <Input
                                    id="completed_at"
                                    type="date"
                                    name="completed_at"
                                    defaultValue={toDateInputValue(
                                        project.completed_at,
                                    )}
                                    placeholder="Optional"
                                />
                                <InputError message={errors.completed_at} />
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
                                        defaultValue={
                                            project.estimate_contract_value ??
                                            ''
                                        }
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
                                        defaultValue={
                                            project.estimate_cost ?? ''
                                        }
                                        placeholder="Optional"
                                    />
                                    <InputError
                                        message={errors.estimate_cost}
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="actual_cost">
                                        Actual cost
                                    </Label>
                                    <Input
                                        id="actual_cost"
                                        type="number"
                                        step="1"
                                        min="0"
                                        name="actual_cost"
                                        defaultValue={project.actual_cost ?? ''}
                                        placeholder="Optional"
                                    />
                                    <InputError message={errors.actual_cost} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="actual_contract_value">
                                        Actual contract value
                                    </Label>
                                    <Input
                                        id="actual_contract_value"
                                        type="number"
                                        step="1"
                                        min="0"
                                        name="actual_contract_value"
                                        defaultValue={
                                            project.actual_contract_value ?? ''
                                        }
                                        placeholder="Optional"
                                    />
                                    <InputError
                                        message={errors.actual_contract_value}
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
                                    <Link href={show(project)}>
                                        <X /> Cancel
                                    </Link>
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing && <Spinner />}
                                    Save changes
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}
