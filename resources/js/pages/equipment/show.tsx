import { Form, Head, Link, setLayoutProps } from '@inertiajs/react';
import {
    ArrowLeft,
    Camera,
    Download,
    LogOut,
    MapPin,
    Package,
    Pencil,
    Trash2,
    Upload,
    X,
} from 'lucide-react';
import React from 'react';
import { AsyncCombobox } from '@/components/async-combobox';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { StatusBadge } from '@/components/project-badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { formatDate, formatDateTime, formatNumber } from '@/lib/utils';
import { destroy, edit, index, picture, show } from '@/routes/equipment';
import {
    checkoutPhoto as checkoutPhotoUrl,
    returnPhoto as returnPhotoUrl,
} from '@/routes/equipment/assignments';
import assignments from '@/routes/equipment/assignments';
import {
    destroy as destroyCalibration,
    download as downloadCalibration,
    store as storeCalibration,
    update as updateCalibration,
} from '@/routes/equipment/calibrations';
import { store as storeLocationMove } from '@/routes/equipment/location-moves';
import { search as searchProjects } from '@/routes/projects';
import { search as searchVendors } from '@/routes/vendors';

const RESULT_OPTIONS = [
    { value: 'passed', label: 'Passed' },
    { value: 'failed', label: 'Failed' },
    { value: 'conditional', label: 'Conditional' },
];

const RETURN_STATUS_OPTIONS = [
    { value: 'available', label: 'Available' },
    { value: 'in_calibration', label: 'In calibration' },
    { value: 'under_maintenance', label: 'Under maintenance' },
    { value: 'retired', label: 'Retired' },
    { value: 'lost', label: 'Lost' },
    { value: 'damaged', label: 'Damaged' },
];

type VendorOption = { id: number; name: string; vendor_code: string };
type ProjectOption = { id: number; uuid: string; name: string };
type WorkforceOption = { id: number; full_name: string };
type LocationOption = { id: number; uuid: string; name: string };

function toDateInputValue(value: string): string {
    return value.slice(0, 10);
}

type Calibration = {
    id: number;
    uuid: string;
    certificate_number: string | null;
    calibration_date: string;
    due_date: string;
    result: string;
    certificate_file: string | null;
    cost: string | null;
    notes: string | null;
    provider: { id: number; name: string } | null;
    creator: { id: number; name: string };
};

type Assignment = {
    id: number;
    uuid: string;
    checked_out_at: string;
    expected_return_at: string | null;
    returned_at: string | null;
    notes: string | null;
    checkout_photo: string | null;
    return_photo: string | null;
    project: { id: number; uuid: string; name: string } | null;
    custodian: { id: number; full_name: string } | null;
    creator: { id: number; name: string };
};

type LocationMove = {
    id: number;
    uuid: string;
    moved_at: string;
    notes: string | null;
    location: { id: number; uuid: string; name: string } | null;
    creator: { id: number; name: string };
};

type Equipment = {
    id: number;
    uuid: string;
    equipment_code: string;
    name: string;
    category: string | null;
    model_type: string | null;
    serial_number: string | null;
    brand: string | null;
    picture: string | null;
    purchase_date: string | null;
    purchase_cost: string | null;
    warranty_expiry_date: string | null;
    calibration_required: boolean;
    calibration_interval_months: number | null;
    next_calibration_due_date: string | null;
    status: string;
    remarks: string | null;
    created_at: string;
    updated_at: string;
    vendor: { id: number; uuid: string; name: string } | null;
    current_project: { id: number; uuid: string; name: string } | null;
    current_custodian: { id: number; full_name: string } | null;
    current_location: { id: number; uuid: string; name: string } | null;
    calibrations: Calibration[];
    assignments: Assignment[];
    location_moves: LocationMove[];
};

type Props = {
    equipment: Equipment;
    workforces: WorkforceOption[];
    locations: LocationOption[];
};

function CalibrationEditDialog({
    equipment,
    calibration,
}: {
    equipment: { id: number; uuid: string };
    calibration: Calibration;
}) {
    const [open, setOpen] = React.useState(false);
    const [providerId, setProviderId] = React.useState(
        calibration.provider ? String(calibration.provider.id) : '',
    );
    const [result, setResult] = React.useState(calibration.result);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm">
                    <Pencil />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto">
                <DialogTitle>Edit calibration record</DialogTitle>
                <DialogDescription>
                    Update the details recorded for this calibration.
                </DialogDescription>

                <Form
                    {...updateCalibration.form({ equipment, calibration })}
                    encType="multipart/form-data"
                    options={{ preserveScroll: true }}
                    onSuccess={() => setOpen(false)}
                    className="space-y-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label
                                        htmlFor={`certificate_number-${calibration.id}`}
                                    >
                                        Certificate number
                                    </Label>
                                    <Input
                                        id={`certificate_number-${calibration.id}`}
                                        name="certificate_number"
                                        defaultValue={
                                            calibration.certificate_number ?? ''
                                        }
                                        placeholder="Optional"
                                    />
                                    <InputError
                                        message={errors.certificate_number}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label
                                        htmlFor={`provider_id-${calibration.id}`}
                                    >
                                        Provider
                                    </Label>
                                    <input
                                        type="hidden"
                                        name="provider_id"
                                        value={providerId}
                                    />
                                    <AsyncCombobox<VendorOption>
                                        id={`provider_id-${calibration.id}`}
                                        value={providerId}
                                        onValueChange={setProviderId}
                                        searchUrl={searchVendors().url}
                                        getOptionId={(vendor) =>
                                            String(vendor.id)
                                        }
                                        getOptionLabel={(vendor) => vendor.name}
                                        initialOption={
                                            calibration.provider
                                                ? {
                                                      id: calibration.provider
                                                          .id,
                                                      name: calibration.provider
                                                          .name,
                                                      vendor_code: '',
                                                  }
                                                : null
                                        }
                                        placeholder="Select a provider (optional)"
                                    />
                                    <InputError message={errors.provider_id} />
                                </div>

                                <div className="grid gap-2">
                                    <Label
                                        htmlFor={`calibration_date-${calibration.id}`}
                                    >
                                        Calibration date
                                    </Label>
                                    <Input
                                        id={`calibration_date-${calibration.id}`}
                                        type="date"
                                        name="calibration_date"
                                        required
                                        defaultValue={toDateInputValue(
                                            calibration.calibration_date,
                                        )}
                                    />
                                    <InputError
                                        message={errors.calibration_date}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label
                                        htmlFor={`due_date-${calibration.id}`}
                                    >
                                        Due date
                                    </Label>
                                    <Input
                                        id={`due_date-${calibration.id}`}
                                        type="date"
                                        name="due_date"
                                        required
                                        defaultValue={toDateInputValue(
                                            calibration.due_date,
                                        )}
                                    />
                                    <InputError message={errors.due_date} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor={`result-${calibration.id}`}>
                                        Result
                                    </Label>
                                    <input
                                        type="hidden"
                                        name="result"
                                        value={result}
                                    />
                                    <Select
                                        value={result}
                                        onValueChange={setResult}
                                    >
                                        <SelectTrigger
                                            id={`result-${calibration.id}`}
                                            className="w-full"
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {RESULT_OPTIONS.map((option) => (
                                                <SelectItem
                                                    key={option.value}
                                                    value={option.value}
                                                >
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.result} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor={`cost-${calibration.id}`}>
                                        Cost
                                    </Label>
                                    <Input
                                        id={`cost-${calibration.id}`}
                                        type="number"
                                        step="1"
                                        min="0"
                                        name="cost"
                                        defaultValue={calibration.cost ?? ''}
                                        placeholder="Optional"
                                    />
                                    <InputError message={errors.cost} />
                                </div>

                                <div className="grid gap-2 sm:col-span-2">
                                    <Label
                                        htmlFor={`certificate_file-${calibration.id}`}
                                    >
                                        Certificate file
                                    </Label>
                                    <Input
                                        id={`certificate_file-${calibration.id}`}
                                        type="file"
                                        name="certificate_file"
                                        accept=".pdf,.png,.jpg,.jpeg"
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        Leave empty to keep the current file.
                                    </p>
                                    <InputError
                                        message={errors.certificate_file}
                                    />
                                </div>

                                <div className="grid gap-2 sm:col-span-2">
                                    <Label htmlFor={`notes-${calibration.id}`}>
                                        Notes
                                    </Label>
                                    <Textarea
                                        id={`notes-${calibration.id}`}
                                        name="notes"
                                        defaultValue={calibration.notes ?? ''}
                                        placeholder="Optional"
                                    />
                                    <InputError message={errors.notes} />
                                </div>
                            </div>

                            <DialogFooter className="gap-2">
                                <DialogClose asChild>
                                    <Button
                                        variant="ghost"
                                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                    >
                                        <X /> Cancel
                                    </Button>
                                </DialogClose>

                                <Button type="submit" disabled={processing}>
                                    {processing && <Spinner />}
                                    Save changes
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function ReturnEquipmentDialog({
    equipment,
    assignment,
}: {
    equipment: { id: number; uuid: string };
    assignment: { id: number; uuid: string };
}) {
    const [open, setOpen] = React.useState(false);
    const [status, setStatus] = React.useState('available');

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <LogOut />
                    Return to Storage
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogTitle>Return equipment</DialogTitle>
                <DialogDescription>
                    Record the condition this equipment came back in.
                </DialogDescription>

                <Form
                    {...assignments.return.form({ equipment, assignment })}
                    encType="multipart/form-data"
                    options={{ preserveScroll: true }}
                    onSuccess={() => {
                        setOpen(false);
                        setStatus('available');
                    }}
                    className="space-y-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="return_status">
                                    Condition / status
                                </Label>
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
                                        id="return_status"
                                        className="w-full"
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {RETURN_STATUS_OPTIONS.map((option) => (
                                            <SelectItem
                                                key={option.value}
                                                value={option.value}
                                            >
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.status} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="return_notes">
                                    Remarks
                                    {status !== 'available' && ' (required)'}
                                </Label>
                                <Textarea
                                    id="return_notes"
                                    name="notes"
                                    required={status !== 'available'}
                                    placeholder={
                                        status === 'available'
                                            ? 'Optional'
                                            : 'Explain the condition, e.g. what is damaged or missing'
                                    }
                                />
                                <InputError message={errors.notes} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="return_photo">
                                    Proof photo
                                </Label>
                                <Input
                                    id="return_photo"
                                    type="file"
                                    name="return_photo"
                                    accept="image/png,image/jpeg"
                                    capture="environment"
                                />
                                <p className="text-sm text-muted-foreground">
                                    Optional photo of the equipment as returned.
                                </p>
                                <InputError message={errors.return_photo} />
                            </div>

                            <DialogFooter className="gap-2">
                                <DialogClose asChild>
                                    <Button
                                        variant="ghost"
                                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                    >
                                        <X /> Cancel
                                    </Button>
                                </DialogClose>

                                <Button type="submit" disabled={processing}>
                                    {processing && <Spinner />}
                                    Confirm Return
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export default function EquipmentShow({
    equipment,
    workforces,
    locations,
}: Props) {
    const [providerId, setProviderId] = React.useState('');
    const [result, setResult] = React.useState('passed');
    const [projectId, setProjectId] = React.useState('');
    const [custodianId, setCustodianId] = React.useState('none');
    const [locationId, setLocationId] = React.useState(
        equipment.current_location ? String(equipment.current_location.id) : '',
    );

    const openAssignment = equipment.assignments.find(
        (a) => a.returned_at === null,
    );

    const isCalibrationOverdue =
        equipment.next_calibration_due_date !== null &&
        new Date(equipment.next_calibration_due_date) <
            new Date(new Date().toDateString());

    setLayoutProps({
        breadcrumbs: [
            { title: 'Equipment', href: index() },
            { title: equipment.name, href: show(equipment) },
        ],
    });

    return (
        <>
            <Head title={equipment.name} />

            <div className="mx-auto w-full max-w-5xl space-y-6 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Heading
                        title={equipment.name}
                        description={equipment.equipment_code}
                    />

                    <div className="flex flex-col gap-2 sm:flex-row">
                        <Button variant="destructive" asChild>
                            <Link href={index()}>
                                <ArrowLeft />
                                Back to Equipment
                            </Link>
                        </Button>

                        <Button asChild>
                            <Link href={edit(equipment)}>
                                <Pencil />
                                Edit Equipment
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="flex flex-col gap-6 sm:flex-row">
                    {equipment.picture && (
                        <img
                            src={picture(equipment).url}
                            alt={equipment.name}
                            className="size-32 shrink-0 rounded-lg border border-border/50 object-cover"
                        />
                    )}

                    <dl className="grid flex-1 gap-4 sm:grid-cols-2">
                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Category
                            </dt>
                            <dd className="font-medium">
                                {equipment.category ?? (
                                    <span className="text-muted-foreground">
                                        &mdash;
                                    </span>
                                )}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Status
                            </dt>
                            <dd>
                                <StatusBadge
                                    category="equipment_status"
                                    value={equipment.status}
                                />
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Model / type
                            </dt>
                            <dd className="font-medium">
                                {equipment.model_type ?? (
                                    <span className="text-muted-foreground">
                                        &mdash;
                                    </span>
                                )}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Serial number
                            </dt>
                            <dd className="font-medium">
                                {equipment.serial_number ?? (
                                    <span className="text-muted-foreground">
                                        &mdash;
                                    </span>
                                )}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Brand
                            </dt>
                            <dd className="font-medium">
                                {equipment.brand ?? (
                                    <span className="text-muted-foreground">
                                        &mdash;
                                    </span>
                                )}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Checked out to
                            </dt>
                            <dd className="font-medium">
                                {equipment.current_project ? (
                                    equipment.current_project.name
                                ) : equipment.current_custodian ? (
                                    equipment.current_custodian.full_name
                                ) : (
                                    <span className="text-muted-foreground">
                                        &mdash;
                                    </span>
                                )}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Storage location
                            </dt>
                            <dd className="font-medium">
                                {equipment.current_location?.name ?? (
                                    <span className="text-muted-foreground">
                                        Unassigned
                                    </span>
                                )}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Purchased from
                            </dt>
                            <dd className="font-medium">
                                {equipment.vendor?.name ?? (
                                    <span className="text-muted-foreground">
                                        &mdash;
                                    </span>
                                )}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Purchase date
                            </dt>
                            <dd className="font-medium">
                                {equipment.purchase_date ? (
                                    formatDate(equipment.purchase_date)
                                ) : (
                                    <span className="text-muted-foreground">
                                        &mdash;
                                    </span>
                                )}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Purchase cost
                            </dt>
                            <dd className="font-medium">
                                {equipment.purchase_cost ? (
                                    formatNumber(equipment.purchase_cost)
                                ) : (
                                    <span className="text-muted-foreground">
                                        &mdash;
                                    </span>
                                )}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Warranty expiry
                            </dt>
                            <dd className="font-medium">
                                {equipment.warranty_expiry_date ? (
                                    formatDate(equipment.warranty_expiry_date)
                                ) : (
                                    <span className="text-muted-foreground">
                                        &mdash;
                                    </span>
                                )}
                            </dd>
                        </div>

                        <div>
                            <dt className="text-sm text-muted-foreground">
                                Next calibration due
                            </dt>
                            <dd className="font-medium">
                                {!equipment.calibration_required ? (
                                    <span className="text-muted-foreground">
                                        Not required
                                    </span>
                                ) : equipment.next_calibration_due_date ? (
                                    <span
                                        className={
                                            isCalibrationOverdue
                                                ? 'text-destructive'
                                                : ''
                                        }
                                    >
                                        {formatDate(
                                            equipment.next_calibration_due_date,
                                        )}
                                        {isCalibrationOverdue && ' (overdue)'}
                                    </span>
                                ) : (
                                    <span className="text-muted-foreground">
                                        No calibration recorded yet
                                    </span>
                                )}
                            </dd>
                        </div>

                        <div className="sm:col-span-2">
                            <dt className="text-sm text-muted-foreground">
                                Remarks
                            </dt>
                            <dd className="font-medium whitespace-pre-line">
                                {equipment.remarks ?? (
                                    <span className="text-muted-foreground">
                                        &mdash;
                                    </span>
                                )}
                            </dd>
                        </div>
                    </dl>
                </div>

                <Tabs defaultValue="calibrations">
                    <TabsList className="w-full flex-nowrap justify-start overflow-x-auto">
                        <TabsTrigger value="calibrations">
                            Calibration History
                        </TabsTrigger>
                        <TabsTrigger value="assignments">
                            Custody History
                        </TabsTrigger>
                        <TabsTrigger value="locations">
                            Location History
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="calibrations" className="space-y-4">
                        {equipment.calibration_required && (
                            <Form
                                {...storeCalibration.form(equipment)}
                                encType="multipart/form-data"
                                options={{ preserveScroll: true }}
                                resetOnSuccess
                            >
                                {({ processing, errors }) => (
                                    <div className="space-y-4 rounded-lg border border-border/50 p-4">
                                        <h3 className="text-sm font-semibold">
                                            Record a calibration
                                        </h3>

                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="grid gap-2">
                                                <Label htmlFor="certificate_number">
                                                    Certificate number
                                                </Label>
                                                <Input
                                                    id="certificate_number"
                                                    name="certificate_number"
                                                    placeholder="Optional"
                                                />
                                                <InputError
                                                    message={
                                                        errors.certificate_number
                                                    }
                                                />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="provider_id">
                                                    Provider
                                                </Label>
                                                <input
                                                    type="hidden"
                                                    name="provider_id"
                                                    value={providerId}
                                                />
                                                <AsyncCombobox<VendorOption>
                                                    id="provider_id"
                                                    value={providerId}
                                                    onValueChange={
                                                        setProviderId
                                                    }
                                                    searchUrl={
                                                        searchVendors().url
                                                    }
                                                    getOptionId={(vendor) =>
                                                        String(vendor.id)
                                                    }
                                                    getOptionLabel={(vendor) =>
                                                        vendor.name
                                                    }
                                                    placeholder="Select a provider (optional)"
                                                />
                                                <InputError
                                                    message={errors.provider_id}
                                                />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="calibration_date">
                                                    Calibration date
                                                </Label>
                                                <Input
                                                    id="calibration_date"
                                                    type="date"
                                                    name="calibration_date"
                                                    required
                                                />
                                                <InputError
                                                    message={
                                                        errors.calibration_date
                                                    }
                                                />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="due_date">
                                                    Due date
                                                </Label>
                                                <Input
                                                    id="due_date"
                                                    type="date"
                                                    name="due_date"
                                                    required
                                                />
                                                <InputError
                                                    message={errors.due_date}
                                                />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="result">
                                                    Result
                                                </Label>
                                                <input
                                                    type="hidden"
                                                    name="result"
                                                    value={result}
                                                />
                                                <Select
                                                    value={result}
                                                    onValueChange={setResult}
                                                >
                                                    <SelectTrigger
                                                        id="result"
                                                        className="w-full"
                                                    >
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {RESULT_OPTIONS.map(
                                                            (option) => (
                                                                <SelectItem
                                                                    key={
                                                                        option.value
                                                                    }
                                                                    value={
                                                                        option.value
                                                                    }
                                                                >
                                                                    {
                                                                        option.label
                                                                    }
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                <InputError
                                                    message={errors.result}
                                                />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="cost">
                                                    Cost
                                                </Label>
                                                <Input
                                                    id="cost"
                                                    type="number"
                                                    step="1"
                                                    min="0"
                                                    name="cost"
                                                    placeholder="Optional"
                                                />
                                                <InputError
                                                    message={errors.cost}
                                                />
                                            </div>

                                            <div className="grid gap-2 sm:col-span-2">
                                                <Label htmlFor="certificate_file">
                                                    Certificate file
                                                </Label>
                                                <Input
                                                    id="certificate_file"
                                                    type="file"
                                                    name="certificate_file"
                                                    accept=".pdf,.png,.jpg,.jpeg"
                                                />
                                                <InputError
                                                    message={
                                                        errors.certificate_file
                                                    }
                                                />
                                            </div>

                                            <div className="grid gap-2 sm:col-span-2">
                                                <Label htmlFor="calibration_notes">
                                                    Notes
                                                </Label>
                                                <Textarea
                                                    id="calibration_notes"
                                                    name="notes"
                                                    placeholder="Optional"
                                                />
                                                <InputError
                                                    message={errors.notes}
                                                />
                                            </div>
                                        </div>

                                        <Button
                                            type="submit"
                                            disabled={processing}
                                        >
                                            {processing ? (
                                                <Spinner />
                                            ) : (
                                                <Upload />
                                            )}
                                            Record calibration
                                        </Button>
                                    </div>
                                )}
                            </Form>
                        )}

                        {equipment.calibrations.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No calibration records yet.
                            </p>
                        ) : (
                            <div className="overflow-hidden rounded-xl border border-border/50">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Certificate</TableHead>
                                            <TableHead>
                                                Calibration date
                                            </TableHead>
                                            <TableHead>Due date</TableHead>
                                            <TableHead>Provider</TableHead>
                                            <TableHead>Result</TableHead>
                                            <TableHead className="text-right">
                                                Actions
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {equipment.calibrations.map((cal) => (
                                            <TableRow key={cal.id}>
                                                <TableCell className="font-medium">
                                                    {cal.certificate_number ?? (
                                                        <span className="text-muted-foreground">
                                                            &mdash;
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {formatDate(
                                                        cal.calibration_date,
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {formatDate(cal.due_date)}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {cal.provider?.name ?? (
                                                        <span>&mdash;</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <StatusBadge
                                                        category="calibration_result"
                                                        value={cal.result}
                                                    />
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {cal.certificate_file && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                asChild
                                                            >
                                                                <a
                                                                    href={downloadCalibration.url(
                                                                        {
                                                                            equipment,
                                                                            calibration:
                                                                                cal,
                                                                        },
                                                                    )}
                                                                >
                                                                    <Download />
                                                                </a>
                                                            </Button>
                                                        )}

                                                        <CalibrationEditDialog
                                                            equipment={
                                                                equipment
                                                            }
                                                            calibration={cal}
                                                        />

                                                        <Dialog>
                                                            <DialogTrigger
                                                                asChild
                                                            >
                                                                <Button
                                                                    variant="destructive"
                                                                    size="sm"
                                                                >
                                                                    <Trash2 />
                                                                </Button>
                                                            </DialogTrigger>
                                                            <DialogContent>
                                                                <DialogTitle>
                                                                    Delete this
                                                                    calibration
                                                                    record?
                                                                </DialogTitle>
                                                                <DialogDescription>
                                                                    This action
                                                                    cannot be
                                                                    undone.
                                                                </DialogDescription>

                                                                <Form
                                                                    {...destroyCalibration.form(
                                                                        {
                                                                            equipment,
                                                                            calibration:
                                                                                cal,
                                                                        },
                                                                    )}
                                                                    options={{
                                                                        preserveScroll: true,
                                                                    }}
                                                                >
                                                                    {({
                                                                        processing,
                                                                    }) => (
                                                                        <DialogFooter className="gap-2">
                                                                            <DialogClose
                                                                                asChild
                                                                            >
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                                                >
                                                                                    <X />{' '}
                                                                                    Cancel
                                                                                </Button>
                                                                            </DialogClose>

                                                                            <Button
                                                                                variant="destructive"
                                                                                disabled={
                                                                                    processing
                                                                                }
                                                                                asChild
                                                                            >
                                                                                <button type="submit">
                                                                                    {processing && (
                                                                                        <Spinner />
                                                                                    )}
                                                                                    Delete
                                                                                </button>
                                                                            </Button>
                                                                        </DialogFooter>
                                                                    )}
                                                                </Form>
                                                            </DialogContent>
                                                        </Dialog>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="assignments" className="space-y-4">
                        {openAssignment ? (
                            <div className="flex flex-col gap-4 rounded-lg border border-border/50 p-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="space-y-0.5">
                                    <p className="font-medium">
                                        Currently checked out to{' '}
                                        {openAssignment.project?.name ??
                                            openAssignment.custodian
                                                ?.full_name ??
                                            'a custodian'}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Since{' '}
                                        {formatDateTime(
                                            openAssignment.checked_out_at,
                                        )}
                                    </p>
                                </div>

                                <ReturnEquipmentDialog
                                    equipment={equipment}
                                    assignment={openAssignment}
                                />
                            </div>
                        ) : equipment.status !== 'available' ? (
                            <div className="rounded-lg border border-border/50 p-4 text-sm text-muted-foreground">
                                This equipment is currently{' '}
                                <span className="font-medium">
                                    {equipment.status.replaceAll('_', ' ')}
                                </span>{' '}
                                and cannot be checked out until it&apos;s
                                available again.
                            </div>
                        ) : (
                            <Form
                                {...assignments.store.form(equipment)}
                                encType="multipart/form-data"
                                options={{ preserveScroll: true }}
                                resetOnSuccess
                            >
                                {({ processing, errors }) => (
                                    <div className="space-y-4 rounded-lg border border-border/50 p-4">
                                        <h3 className="text-sm font-semibold">
                                            Check out equipment
                                        </h3>

                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="grid gap-2">
                                                <Label htmlFor="project_id">
                                                    Project
                                                </Label>
                                                <input
                                                    type="hidden"
                                                    name="project_id"
                                                    value={projectId}
                                                />
                                                <AsyncCombobox<ProjectOption>
                                                    id="project_id"
                                                    value={projectId}
                                                    onValueChange={setProjectId}
                                                    searchUrl={
                                                        searchProjects().url
                                                    }
                                                    getOptionId={(project) =>
                                                        String(project.id)
                                                    }
                                                    getOptionLabel={(project) =>
                                                        project.name
                                                    }
                                                    placeholder="Select a project (optional)"
                                                />
                                                <InputError
                                                    message={errors.project_id}
                                                />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="custodian_id">
                                                    Custodian
                                                </Label>
                                                <input
                                                    type="hidden"
                                                    name="custodian_id"
                                                    value={
                                                        custodianId === 'none'
                                                            ? ''
                                                            : custodianId
                                                    }
                                                />
                                                <Select
                                                    value={custodianId}
                                                    onValueChange={
                                                        setCustodianId
                                                    }
                                                >
                                                    <SelectTrigger
                                                        id="custodian_id"
                                                        className="w-full"
                                                    >
                                                        <SelectValue placeholder="Optional" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">
                                                            None
                                                        </SelectItem>
                                                        {workforces.map(
                                                            (workforce) => (
                                                                <SelectItem
                                                                    key={
                                                                        workforce.id
                                                                    }
                                                                    value={String(
                                                                        workforce.id,
                                                                    )}
                                                                >
                                                                    {
                                                                        workforce.full_name
                                                                    }
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                <InputError
                                                    message={
                                                        errors.custodian_id
                                                    }
                                                />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="checked_out_at">
                                                    Checked out at
                                                </Label>
                                                <Input
                                                    id="checked_out_at"
                                                    type="datetime-local"
                                                    name="checked_out_at"
                                                    required
                                                    defaultValue={new Date()
                                                        .toISOString()
                                                        .slice(0, 16)}
                                                />
                                                <InputError
                                                    message={
                                                        errors.checked_out_at
                                                    }
                                                />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="expected_return_at">
                                                    Expected return date
                                                </Label>
                                                <Input
                                                    id="expected_return_at"
                                                    type="date"
                                                    name="expected_return_at"
                                                    placeholder="Optional"
                                                />
                                                <InputError
                                                    message={
                                                        errors.expected_return_at
                                                    }
                                                />
                                            </div>

                                            <div className="grid gap-2 sm:col-span-2">
                                                <Label htmlFor="assignment_notes">
                                                    Notes
                                                </Label>
                                                <Textarea
                                                    id="assignment_notes"
                                                    name="notes"
                                                    placeholder="Optional"
                                                />
                                                <InputError
                                                    message={errors.notes}
                                                />
                                            </div>

                                            <div className="grid gap-2 sm:col-span-2">
                                                <Label htmlFor="checkout_photo">
                                                    Proof photo
                                                </Label>
                                                <Input
                                                    id="checkout_photo"
                                                    type="file"
                                                    name="checkout_photo"
                                                    accept="image/png,image/jpeg"
                                                    capture="environment"
                                                />
                                                <p className="text-sm text-muted-foreground">
                                                    Optional photo of the
                                                    equipment as checked out.
                                                </p>
                                                <InputError
                                                    message={
                                                        errors.checkout_photo
                                                    }
                                                />
                                            </div>
                                        </div>

                                        <Button
                                            type="submit"
                                            disabled={processing}
                                        >
                                            {processing ? (
                                                <Spinner />
                                            ) : (
                                                <Package />
                                            )}
                                            Check out
                                        </Button>
                                    </div>
                                )}
                            </Form>
                        )}

                        {equipment.assignments.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No custody history yet.
                            </p>
                        ) : (
                            <div className="overflow-hidden rounded-xl border border-border/50">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Location</TableHead>
                                            <TableHead>Custodian</TableHead>
                                            <TableHead>Checked out</TableHead>
                                            <TableHead>Returned</TableHead>
                                            <TableHead>Remarks</TableHead>
                                            <TableHead>Proof</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {equipment.assignments.map(
                                            (assignment) => (
                                                <TableRow key={assignment.id}>
                                                    <TableCell className="font-medium">
                                                        {assignment.project
                                                            ?.name ??
                                                            'In storage'}
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        {assignment.custodian
                                                            ?.full_name ?? (
                                                            <span>&mdash;</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        {formatDateTime(
                                                            assignment.checked_out_at,
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        {assignment.returned_at ? (
                                                            formatDateTime(
                                                                assignment.returned_at,
                                                            )
                                                        ) : (
                                                            <StatusBadge
                                                                category="active"
                                                                value="active"
                                                                label="Active"
                                                            />
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="max-w-xs text-muted-foreground">
                                                        {assignment.notes ?? (
                                                            <span>&mdash;</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex gap-2">
                                                            {assignment.checkout_photo && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    asChild
                                                                >
                                                                    <a
                                                                        href={checkoutPhotoUrl.url(
                                                                            {
                                                                                equipment,
                                                                                assignment,
                                                                            },
                                                                        )}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        title="Checkout photo"
                                                                    >
                                                                        <Camera />
                                                                    </a>
                                                                </Button>
                                                            )}
                                                            {assignment.return_photo && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    asChild
                                                                >
                                                                    <a
                                                                        href={returnPhotoUrl.url(
                                                                            {
                                                                                equipment,
                                                                                assignment,
                                                                            },
                                                                        )}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        title="Return photo"
                                                                    >
                                                                        <LogOut />
                                                                    </a>
                                                                </Button>
                                                            )}
                                                            {!assignment.checkout_photo &&
                                                                !assignment.return_photo && (
                                                                    <span className="text-muted-foreground">
                                                                        &mdash;
                                                                    </span>
                                                                )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ),
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="locations" className="space-y-4">
                        <Form
                            {...storeLocationMove.form(equipment)}
                            options={{ preserveScroll: true }}
                            resetOnSuccess
                        >
                            {({ processing, errors }) => (
                                <div className="space-y-4 rounded-lg border border-border/50 p-4">
                                    <h3 className="text-sm font-semibold">
                                        Move to a storage location
                                    </h3>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="location_id">
                                                Location
                                            </Label>
                                            <input
                                                type="hidden"
                                                name="location_id"
                                                value={locationId}
                                            />
                                            <Select
                                                value={locationId}
                                                onValueChange={setLocationId}
                                            >
                                                <SelectTrigger
                                                    id="location_id"
                                                    className="w-full"
                                                >
                                                    <SelectValue placeholder="Select a location" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {locations.map(
                                                        (location) => (
                                                            <SelectItem
                                                                key={
                                                                    location.id
                                                                }
                                                                value={String(
                                                                    location.id,
                                                                )}
                                                            >
                                                                {location.name}
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            <InputError
                                                message={errors.location_id}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="moved_at">
                                                Moved at
                                            </Label>
                                            <Input
                                                id="moved_at"
                                                type="datetime-local"
                                                name="moved_at"
                                                required
                                                defaultValue={new Date()
                                                    .toISOString()
                                                    .slice(0, 16)}
                                            />
                                            <InputError
                                                message={errors.moved_at}
                                            />
                                        </div>

                                        <div className="grid gap-2 sm:col-span-2">
                                            <Label htmlFor="location_notes">
                                                Notes
                                            </Label>
                                            <Textarea
                                                id="location_notes"
                                                name="notes"
                                                placeholder="Optional"
                                            />
                                            <InputError
                                                message={errors.notes}
                                            />
                                        </div>
                                    </div>

                                    <Button type="submit" disabled={processing}>
                                        {processing ? <Spinner /> : <MapPin />}
                                        Record move
                                    </Button>
                                </div>
                            )}
                        </Form>

                        {equipment.location_moves.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No location history yet.
                            </p>
                        ) : (
                            <div className="overflow-hidden rounded-xl border border-border/50">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Location</TableHead>
                                            <TableHead>Moved at</TableHead>
                                            <TableHead>Recorded by</TableHead>
                                            <TableHead>Notes</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {equipment.location_moves.map(
                                            (move) => (
                                                <TableRow key={move.id}>
                                                    <TableCell className="font-medium">
                                                        {move.location
                                                            ?.name ?? (
                                                            <span className="text-muted-foreground">
                                                                &mdash;
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        {formatDateTime(
                                                            move.moved_at,
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        {move.creator.name}
                                                    </TableCell>
                                                    <TableCell className="max-w-xs text-muted-foreground">
                                                        {move.notes ?? (
                                                            <span>&mdash;</span>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ),
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>

                <div className="space-y-4 rounded-lg border border-destructive/50 p-4">
                    <h2 className="text-base font-semibold text-destructive dark:text-destructive-foreground">
                        Danger Zone
                    </h2>
                    <div className="flex flex-col gap-4 rounded-lg border border-red-100 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-red-200/10 dark:bg-red-700/10">
                        <div className="space-y-0.5 text-red-600 dark:text-red-100">
                            <p className="font-medium">Delete this equipment</p>
                            <p className="text-sm">
                                Once deleted, this equipment can be restored by
                                an administrator, but its history stays hidden
                                until then.
                            </p>
                        </div>

                        <Dialog>
                            <DialogTrigger asChild>
                                <Button
                                    variant="destructive"
                                    className="w-full sm:w-auto"
                                >
                                    <Trash2 />
                                    Delete Equipment
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogTitle>
                                    Delete &quot;{equipment.name}&quot;?
                                </DialogTitle>
                                <DialogDescription>
                                    This action cannot be undone from here.
                                </DialogDescription>

                                <Form
                                    {...destroy.form(equipment)}
                                    options={{ preserveScroll: true }}
                                >
                                    {({ processing }) => (
                                        <DialogFooter className="gap-2">
                                            <DialogClose asChild>
                                                <Button
                                                    variant="ghost"
                                                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                >
                                                    <X /> Cancel
                                                </Button>
                                            </DialogClose>

                                            <Button
                                                variant="destructive"
                                                disabled={processing}
                                                asChild
                                            >
                                                <button type="submit">
                                                    {processing && <Spinner />}
                                                    Delete Equipment
                                                </button>
                                            </Button>
                                        </DialogFooter>
                                    )}
                                </Form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>
        </>
    );
}
