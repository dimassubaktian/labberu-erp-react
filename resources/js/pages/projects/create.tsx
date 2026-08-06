import { Form, Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import { AsyncCombobox } from '@/components/async-combobox';
import { Combobox } from '@/components/combobox';
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

function todayDate(): string {
    return new Date().toISOString().slice(0, 10);
}

type Props = {
    workforces: WorkforceOption[];
};

export default function ProjectsCreate({ workforces }: Props) {
    const [customerId, setCustomerId] = useState('');
    const [personInChargeId, setPersonInChargeId] = useState('');
    const [status, setStatus] = useState('new');
    const [priority, setPriority] = useState('medium');

    return (
        <>
            <Head title="New Project" />

            <div className="mx-auto w-full max-w-2xl space-y-6 p-4">
                <Heading
                    title="New Project"
                    description="Add a new project for your organization"
                />

                <Form {...store.form()} className="space-y-6">
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
                                        step="0.01"
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
                                        step="0.01"
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
                                <Button type="button" variant="outline" asChild>
                                    <Link href={index()}>Cancel</Link>
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
