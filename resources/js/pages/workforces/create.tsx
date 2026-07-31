import { Form, Head, Link } from '@inertiajs/react';
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
import { create, index, store } from '@/routes/workforces';

type JobTitleOption = {
    id: number;
    name: string;
};

type Props = {
    jobTitles: JobTitleOption[];
};

export default function WorkforcesCreate({ jobTitles }: Props) {
    const [jobTitleId, setJobTitleId] = useState('');
    const [gender, setGender] = useState('male');
    const [status, setStatus] = useState('active');

    return (
        <>
            <Head title="New Workforce" />

            <div className="mx-auto w-full max-w-2xl space-y-6 p-4">
                <Heading
                    title="New Workforce"
                    description="Add a new employee to your organization"
                />

                <Form
                    {...store.form()}
                    encType="multipart/form-data"
                    className="space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="full_name">Full name</Label>
                                <Input
                                    id="full_name"
                                    name="full_name"
                                    required
                                    autoFocus
                                    placeholder="e.g. Jane Doe"
                                />
                                <InputError message={errors.full_name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    placeholder="e.g. jane.doe@example.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input
                                        id="phone"
                                        name="phone"
                                        placeholder="Optional"
                                    />
                                    <InputError message={errors.phone} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="job_title_id">
                                        Job title
                                    </Label>
                                    <input
                                        type="hidden"
                                        name="job_title_id"
                                        value={jobTitleId}
                                    />
                                    <Select
                                        value={jobTitleId}
                                        onValueChange={setJobTitleId}
                                    >
                                        <SelectTrigger
                                            id="job_title_id"
                                            className="w-full"
                                        >
                                            <SelectValue placeholder="Select a job title" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {jobTitles.map((jobTitle) => (
                                                <SelectItem
                                                    key={jobTitle.id}
                                                    value={String(jobTitle.id)}
                                                >
                                                    {jobTitle.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.job_title_id} />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="address">Address</Label>
                                <Textarea
                                    id="address"
                                    name="address"
                                    placeholder="Optional"
                                />
                                <InputError message={errors.address} />
                            </div>

                            <div className="grid gap-2 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="gender">Gender</Label>
                                    <input
                                        type="hidden"
                                        name="gender"
                                        value={gender}
                                    />
                                    <Select
                                        value={gender}
                                        onValueChange={setGender}
                                    >
                                        <SelectTrigger
                                            id="gender"
                                            className="w-full"
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="male">
                                                Male
                                            </SelectItem>
                                            <SelectItem value="female">
                                                Female
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.gender} />
                                </div>

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
                                            <SelectItem value="active">
                                                Active
                                            </SelectItem>
                                            <SelectItem value="inactive">
                                                Inactive
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.status} />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="photo">Photo</Label>
                                <Input
                                    id="photo"
                                    type="file"
                                    name="photo"
                                    accept="image/*"
                                />
                                <InputError message={errors.photo} />
                            </div>

                            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <Button type="button" variant="outline" asChild>
                                    <Link href={index()}>Cancel</Link>
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing && <Spinner />}
                                    Create workforce
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}

WorkforcesCreate.layout = {
    breadcrumbs: [
        { title: 'Workforces', href: index() },
        { title: 'New', href: create() },
    ],
};
