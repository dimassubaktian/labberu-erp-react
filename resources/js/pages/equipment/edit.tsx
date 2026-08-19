import { Form, Head, Link, setLayoutProps } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { AsyncCombobox } from '@/components/async-combobox';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { edit, index, picture, show, update } from '@/routes/equipment';
import { search as searchVendors } from '@/routes/vendors';

const CATEGORY_OPTIONS = [
    'Multimeter',
    'Clamp Meter',
    'Insulation Tester',
    'Earth Resistance Tester',
    'Power Quality Analyzer',
    'Oscilloscope',
    'Torque Wrench',
    'Pressure Gauge',
    'Thermometer',
    'Caliper',
    'Other',
];

const STATUS_OPTIONS = [
    { value: 'available', label: 'Available' },
    { value: 'in_use', label: 'In use' },
    { value: 'in_calibration', label: 'In calibration' },
    { value: 'under_maintenance', label: 'Under maintenance' },
    { value: 'retired', label: 'Retired' },
    { value: 'lost', label: 'Lost' },
    { value: 'damaged', label: 'Damaged' },
];

type VendorOption = {
    id: number;
    name: string;
    vendor_code: string;
};

function toDateInputValue(value: string | null): string {
    return value ? value.slice(0, 10) : '';
}

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
    vendor_id: number | null;
    vendor: { id: number; uuid: string; name: string } | null;
    warranty_expiry_date: string | null;
    calibration_required: boolean;
    calibration_interval_months: number | null;
    status: string;
    remarks: string | null;
};

type Props = {
    equipment: Equipment;
};

export default function EquipmentEdit({ equipment }: Props) {
    const [category, setCategory] = useState(
        equipment.category ?? CATEGORY_OPTIONS[0],
    );
    const [status, setStatus] = useState(equipment.status);
    const [calibrationRequired, setCalibrationRequired] = useState(
        equipment.calibration_required,
    );
    const [vendorId, setVendorId] = useState(
        equipment.vendor_id ? String(equipment.vendor_id) : '',
    );
    const [picturePreview, setPicturePreview] = useState<string | null>(null);

    useEffect(() => {
        return () => {
            if (picturePreview) {
                URL.revokeObjectURL(picturePreview);
            }
        };
    }, [picturePreview]);

    function handlePictureChange(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];

        setPicturePreview((previous) => {
            if (previous) {
                URL.revokeObjectURL(previous);
            }

            return file ? URL.createObjectURL(file) : null;
        });
    }

    setLayoutProps({
        breadcrumbs: [
            { title: 'Equipment', href: index() },
            { title: equipment.name, href: show(equipment) },
            { title: 'Edit', href: edit(equipment) },
        ],
    });

    return (
        <>
            <Head title={`Edit ${equipment.name}`} />

            <div className="mx-auto w-full max-w-5xl space-y-6 p-4">
                <Heading
                    title="Edit Equipment"
                    description="Update this equipment's details"
                />

                <Form
                    {...update.form(equipment)}
                    encType="multipart/form-data"
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
                                    defaultValue={equipment.name}
                                    placeholder="e.g. Digital Multimeter"
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-2 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="category">Category</Label>
                                    <input
                                        type="hidden"
                                        name="category"
                                        value={category}
                                    />
                                    <Select
                                        value={category}
                                        onValueChange={setCategory}
                                    >
                                        <SelectTrigger
                                            id="category"
                                            className="w-full"
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CATEGORY_OPTIONS.map((option) => (
                                                <SelectItem
                                                    key={option}
                                                    value={option}
                                                >
                                                    {option}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.category} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="brand">Brand</Label>
                                    <Input
                                        id="brand"
                                        name="brand"
                                        defaultValue={equipment.brand ?? ''}
                                        placeholder="e.g. Fluke"
                                    />
                                    <InputError message={errors.brand} />
                                </div>
                            </div>

                            <div className="grid gap-2 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="model_type">
                                        Model / type
                                    </Label>
                                    <Input
                                        id="model_type"
                                        name="model_type"
                                        defaultValue={
                                            equipment.model_type ?? ''
                                        }
                                        placeholder="e.g. Fluke 87V"
                                    />
                                    <InputError message={errors.model_type} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="serial_number">
                                        Serial number
                                    </Label>
                                    <Input
                                        id="serial_number"
                                        name="serial_number"
                                        defaultValue={
                                            equipment.serial_number ?? ''
                                        }
                                        placeholder="Optional"
                                    />
                                    <InputError
                                        message={errors.serial_number}
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="picture">Picture</Label>
                                <div className="flex items-center gap-4">
                                    {(picturePreview || equipment.picture) && (
                                        <img
                                            src={
                                                picturePreview ??
                                                picture(equipment).url
                                            }
                                            alt={equipment.name}
                                            className="size-14 rounded-md border border-border/50 object-cover"
                                        />
                                    )}
                                    <Input
                                        id="picture"
                                        type="file"
                                        name="picture"
                                        accept="image/*"
                                        className="flex-1"
                                        onChange={handlePictureChange}
                                    />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Leave empty to keep the current picture.
                                </p>
                                <InputError message={errors.picture} />
                            </div>

                            <div className="grid gap-2 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="purchase_date">
                                        Purchase date
                                    </Label>
                                    <Input
                                        id="purchase_date"
                                        type="date"
                                        name="purchase_date"
                                        defaultValue={toDateInputValue(
                                            equipment.purchase_date,
                                        )}
                                    />
                                    <InputError
                                        message={errors.purchase_date}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="purchase_cost">
                                        Purchase cost
                                    </Label>
                                    <Input
                                        id="purchase_cost"
                                        type="number"
                                        step="1"
                                        min="0"
                                        name="purchase_cost"
                                        defaultValue={
                                            equipment.purchase_cost ?? ''
                                        }
                                        placeholder="Optional"
                                    />
                                    <InputError
                                        message={errors.purchase_cost}
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="vendor_id">
                                        Purchased from
                                    </Label>
                                    <input
                                        type="hidden"
                                        name="vendor_id"
                                        value={vendorId}
                                    />
                                    <AsyncCombobox<VendorOption>
                                        id="vendor_id"
                                        value={vendorId}
                                        onValueChange={setVendorId}
                                        searchUrl={searchVendors().url}
                                        getOptionId={(vendor) =>
                                            String(vendor.id)
                                        }
                                        getOptionLabel={(vendor) =>
                                            `${vendor.vendor_code}: ${vendor.name}`
                                        }
                                        initialOption={
                                            equipment.vendor
                                                ? {
                                                      id: equipment.vendor.id,
                                                      name: equipment.vendor
                                                          .name,
                                                      vendor_code: '',
                                                  }
                                                : null
                                        }
                                        placeholder="Select a vendor (optional)"
                                    />
                                    <InputError message={errors.vendor_id} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="warranty_expiry_date">
                                        Warranty expiry date
                                    </Label>
                                    <Input
                                        id="warranty_expiry_date"
                                        type="date"
                                        name="warranty_expiry_date"
                                        defaultValue={toDateInputValue(
                                            equipment.warranty_expiry_date,
                                        )}
                                    />
                                    <InputError
                                        message={errors.warranty_expiry_date}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 rounded-lg border border-border/50 p-4">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="hidden"
                                        name="calibration_required"
                                        value={calibrationRequired ? '1' : '0'}
                                    />
                                    <Checkbox
                                        id="calibration_required"
                                        checked={calibrationRequired}
                                        onCheckedChange={(checked) =>
                                            setCalibrationRequired(
                                                checked === true,
                                            )
                                        }
                                    />
                                    <Label htmlFor="calibration_required">
                                        This equipment requires periodic
                                        calibration
                                    </Label>
                                </div>

                                {calibrationRequired && (
                                    <div className="grid gap-2 sm:max-w-xs">
                                        <Label htmlFor="calibration_interval_months">
                                            Calibration interval (months)
                                        </Label>
                                        <Input
                                            id="calibration_interval_months"
                                            type="number"
                                            step="1"
                                            min="1"
                                            max="120"
                                            name="calibration_interval_months"
                                            defaultValue={
                                                equipment.calibration_interval_months ??
                                                ''
                                            }
                                            placeholder="e.g. 12"
                                        />
                                        <InputError
                                            message={
                                                errors.calibration_interval_months
                                            }
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="grid gap-2 sm:max-w-xs">
                                <Label htmlFor="status">Status</Label>
                                <input
                                    type="hidden"
                                    name="status"
                                    value={status}
                                />
                                <Select value={status} onValueChange={setStatus}>
                                    <SelectTrigger
                                        id="status"
                                        className="w-full"
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {STATUS_OPTIONS.map((option) => (
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
                                <Label htmlFor="remarks">Remarks</Label>
                                <Textarea
                                    id="remarks"
                                    name="remarks"
                                    defaultValue={equipment.remarks ?? ''}
                                    placeholder="Optional notes about this equipment"
                                />
                                <InputError message={errors.remarks} />
                            </div>

                            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <Button type="button" variant="outline" asChild>
                                    <Link href={show(equipment)}>Cancel</Link>
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
