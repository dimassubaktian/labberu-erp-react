import { Form, Head, Link, setLayoutProps } from '@inertiajs/react';
import { useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
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
import { edit, index, show, update } from '@/routes/projects';

type CustomerOption = {
    id: number;
    name: string;
};

type WorkforceOption = {
    id: number;
    full_name: string;
};

type Project = {
    id: number;
    uuid: string;
    project_code: string;
    name: string;
    customer_id: number;
    request_date: string;
    person_in_charge_id: number | null;
    description: string | null;
    status: string;
    priority: string;
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
    customers: CustomerOption[];
    workforces: WorkforceOption[];
};

function toDateInputValue(value: string | null): string {
    return value ? value.slice(0, 10) : '';
}

export default function ProjectsEdit({
    project,
    customers,
    workforces,
}: Props) {
    const [customerId, setCustomerId] = useState(String(project.customer_id));
    const [personInChargeId, setPersonInChargeId] = useState(
        project.person_in_charge_id ? String(project.person_in_charge_id) : '',
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

            <div className="mx-auto w-full max-w-2xl space-y-6 p-4">
                <Heading
                    title="Edit Project"
                    description="Update this project's details"
                />

                <Form {...update.form(project)} className="space-y-6">
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
                                    <Select
                                        value={customerId}
                                        onValueChange={setCustomerId}
                                    >
                                        <SelectTrigger
                                            id="customer_id"
                                            className="w-full"
                                        >
                                            <SelectValue placeholder="Select a customer" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {customers.map((customer) => (
                                                <SelectItem
                                                    key={customer.id}
                                                    value={String(customer.id)}
                                                >
                                                    {customer.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
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
                                <Select
                                    value={personInChargeId}
                                    onValueChange={setPersonInChargeId}
                                >
                                    <SelectTrigger
                                        id="person_in_charge_id"
                                        className="w-full"
                                    >
                                        <SelectValue placeholder="Optional" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {workforces.map((workforce) => (
                                            <SelectItem
                                                key={workforce.id}
                                                value={String(workforce.id)}
                                            >
                                                {workforce.full_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError
                                    message={errors.person_in_charge_id}
                                />
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
                                        step="0.01"
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
                                        step="0.01"
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
                                        step="0.01"
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
                                        step="0.01"
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
                                <Button type="button" variant="outline" asChild>
                                    <Link href={show(project)}>Cancel</Link>
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
