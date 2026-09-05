import { Form, Head } from '@inertiajs/react';
import {
    Building2,
    Camera,
    FileCheck2,
    Globe2,
    Landmark,
    Save,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import InputError from '@/components/input-error';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { edit, update } from '@/routes/company-settings';

type CompanySetting = {
    legal_name: string | null;
    trade_name: string | null;
    tax_id: string | null;
    business_registration_number: string | null;
    email: string | null;
    phone: string | null;
    website: string | null;
    address: string | null;
    city: string | null;
    province: string | null;
    postal_code: string | null;
    country: string | null;
    logo_url: string | null;
    certified_picture_url: string | null;
};

type Props = {
    companySetting: CompanySetting;
};

export default function CompanySettingsEdit({ companySetting }: Props) {
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [certifiedPicturePreview, setCertifiedPicturePreview] = useState<
        string | null
    >(null);

    useEffect(() => {
        return () => {
            if (logoPreview) {
                URL.revokeObjectURL(logoPreview);
            }

            if (certifiedPicturePreview) {
                URL.revokeObjectURL(certifiedPicturePreview);
            }
        };
    }, [logoPreview, certifiedPicturePreview]);

    function handleLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];

        setLogoPreview((previous) => {
            if (previous) {
                URL.revokeObjectURL(previous);
            }

            return file ? URL.createObjectURL(file) : null;
        });
    }

    function handleCertifiedPictureChange(
        event: React.ChangeEvent<HTMLInputElement>,
    ) {
        const file = event.target.files?.[0];

        setCertifiedPicturePreview((previous) => {
            if (previous) {
                URL.revokeObjectURL(previous);
            }

            return file ? URL.createObjectURL(file) : null;
        });
    }

    return (
        <>
            <Head title="Company Settings" />

            <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
                <section className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
                    <div className="flex flex-col gap-5 bg-linear-to-br from-primary/[0.08] via-card to-card p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex min-w-0 items-center gap-4">
                            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                                <Building2 className="size-6" />
                            </div>
                            <div className="min-w-0 space-y-1">
                                <p className="text-sm font-medium text-primary">
                                    Organization profile
                                </p>
                                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                                    Company settings
                                </h1>
                                <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                                    Keep your legal, contact, and brand details
                                    accurate across business documents.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/70 px-4 py-3 text-sm text-muted-foreground">
                            <Landmark className="size-4 text-primary" />
                            <span>Used on official records</span>
                        </div>
                    </div>
                    <div className="grid divide-y divide-border/60 border-t border-border/60 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                        <div className="p-4">
                            <p className="text-xs font-medium text-muted-foreground">
                                Legal identity
                            </p>
                            <p className="mt-1 truncate text-sm font-semibold">
                                {companySetting.legal_name || 'Not configured'}
                            </p>
                        </div>
                        <div className="p-4">
                            <p className="text-xs font-medium text-muted-foreground">
                                Primary contact
                            </p>
                            <p className="mt-1 truncate text-sm font-semibold">
                                {companySetting.email ||
                                    companySetting.phone ||
                                    'Not configured'}
                            </p>
                        </div>
                        <div className="p-4">
                            <p className="text-xs font-medium text-muted-foreground">
                                Registered location
                            </p>
                            <p className="mt-1 truncate text-sm font-semibold">
                                {companySetting.city ||
                                    companySetting.country ||
                                    'Not configured'}
                            </p>
                        </div>
                    </div>
                </section>

                <Form
                    {...update.form()}
                    encType="multipart/form-data"
                    className="space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <Card>
                                <CardHeader className="border-b border-border/60 pb-5">
                                    <div className="flex items-start gap-3">
                                        <div className="rounded-lg bg-primary/10 p-2 text-primary">
                                            <Building2 className="size-5" />
                                        </div>
                                        <div className="space-y-1">
                                            <CardTitle>
                                                Business identity
                                            </CardTitle>
                                            <CardDescription>
                                                Legal and registration details
                                                used on records and tax
                                                documents.
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="grid gap-5 pt-6 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="legal_name">
                                            Legal name
                                        </Label>
                                        <Input
                                            id="legal_name"
                                            name="legal_name"
                                            required
                                            autoFocus
                                            defaultValue={
                                                companySetting.legal_name ?? ''
                                            }
                                            placeholder="e.g. PT Labberu Teknologi Indonesia"
                                        />
                                        <InputError
                                            message={errors.legal_name}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="trade_name">
                                            Trade name
                                        </Label>
                                        <Input
                                            id="trade_name"
                                            name="trade_name"
                                            defaultValue={
                                                companySetting.trade_name ?? ''
                                            }
                                            placeholder="Optional, e.g. Labberu"
                                        />
                                        <InputError
                                            message={errors.trade_name}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="tax_id">Tax ID</Label>
                                        <Input
                                            id="tax_id"
                                            name="tax_id"
                                            defaultValue={
                                                companySetting.tax_id ?? ''
                                            }
                                            placeholder="Optional"
                                        />
                                        <InputError message={errors.tax_id} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="business_registration_number">
                                            Business registration number
                                        </Label>
                                        <Input
                                            id="business_registration_number"
                                            name="business_registration_number"
                                            defaultValue={
                                                companySetting.business_registration_number ??
                                                ''
                                            }
                                            placeholder="Optional"
                                        />
                                        <InputError
                                            message={
                                                errors.business_registration_number
                                            }
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="grid gap-6 lg:grid-cols-5">
                                <Card className="lg:col-span-3">
                                    <CardHeader className="border-b border-border/60 pb-5">
                                        <div className="flex items-start gap-3">
                                            <div className="rounded-lg bg-primary/10 p-2 text-primary">
                                                <Globe2 className="size-5" />
                                            </div>
                                            <div className="space-y-1">
                                                <CardTitle>
                                                    Contact and address
                                                </CardTitle>
                                                <CardDescription>
                                                    Help customers and partners
                                                    reach the right company
                                                    details.
                                                </CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="grid gap-5 pt-6 sm:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="email">Email</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                name="email"
                                                defaultValue={
                                                    companySetting.email ?? ''
                                                }
                                                placeholder="Optional"
                                            />
                                            <InputError
                                                message={errors.email}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="phone">Phone</Label>
                                            <Input
                                                id="phone"
                                                name="phone"
                                                defaultValue={
                                                    companySetting.phone ?? ''
                                                }
                                                placeholder="Optional"
                                            />
                                            <InputError
                                                message={errors.phone}
                                            />
                                        </div>
                                        <div className="grid gap-2 sm:col-span-2">
                                            <Label htmlFor="website">
                                                Website
                                            </Label>
                                            <Input
                                                id="website"
                                                type="url"
                                                name="website"
                                                defaultValue={
                                                    companySetting.website ?? ''
                                                }
                                                placeholder="Optional, e.g. https://example.com"
                                            />
                                            <InputError
                                                message={errors.website}
                                            />
                                        </div>
                                        <div className="grid gap-2 sm:col-span-2">
                                            <Label htmlFor="address">
                                                Address
                                            </Label>
                                            <Textarea
                                                id="address"
                                                name="address"
                                                defaultValue={
                                                    companySetting.address ?? ''
                                                }
                                                placeholder="Optional"
                                            />
                                            <InputError
                                                message={errors.address}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="city">City</Label>
                                            <Input
                                                id="city"
                                                name="city"
                                                defaultValue={
                                                    companySetting.city ?? ''
                                                }
                                                placeholder="Optional"
                                            />
                                            <InputError message={errors.city} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="province">
                                                Province
                                            </Label>
                                            <Input
                                                id="province"
                                                name="province"
                                                defaultValue={
                                                    companySetting.province ??
                                                    ''
                                                }
                                                placeholder="Optional"
                                            />
                                            <InputError
                                                message={errors.province}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="postal_code">
                                                Postal code
                                            </Label>
                                            <Input
                                                id="postal_code"
                                                name="postal_code"
                                                defaultValue={
                                                    companySetting.postal_code ??
                                                    ''
                                                }
                                                placeholder="Optional"
                                            />
                                            <InputError
                                                message={errors.postal_code}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="country">
                                                Country
                                            </Label>
                                            <Input
                                                id="country"
                                                name="country"
                                                defaultValue={
                                                    companySetting.country ?? ''
                                                }
                                                placeholder="Optional"
                                            />
                                            <InputError
                                                message={errors.country}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="lg:col-span-2">
                                    <CardHeader className="border-b border-border/60 pb-5">
                                        <div className="flex items-start gap-3">
                                            <div className="rounded-lg bg-primary/10 p-2 text-primary">
                                                <Camera className="size-5" />
                                            </div>
                                            <div className="space-y-1">
                                                <CardTitle>
                                                    Brand assets
                                                </CardTitle>
                                                <CardDescription>
                                                    Keep visuals current for
                                                    company documents.
                                                </CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-6 pt-6">
                                        <div className="grid gap-3">
                                            <Label htmlFor="logo">Logo</Label>
                                            <div className="flex items-center gap-4 rounded-xl border border-dashed border-border/80 bg-muted/20 p-3">
                                                <Avatar className="size-14 rounded-lg border bg-background">
                                                    {(logoPreview ||
                                                        companySetting.logo_url) && (
                                                        <AvatarImage
                                                            src={
                                                                logoPreview ??
                                                                companySetting.logo_url ??
                                                                undefined
                                                            }
                                                            alt="Company logo"
                                                        />
                                                    )}
                                                    <AvatarFallback className="rounded-lg text-xs font-semibold">
                                                        CO
                                                    </AvatarFallback>
                                                </Avatar>
                                                <Input
                                                    id="logo"
                                                    type="file"
                                                    name="logo"
                                                    accept="image/*"
                                                    className="flex-1"
                                                    onChange={handleLogoChange}
                                                />
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                Leave empty to keep the current
                                                logo.
                                            </p>
                                            <InputError message={errors.logo} />
                                        </div>

                                        <div className="grid gap-3">
                                            <Label htmlFor="certified_picture">
                                                Certified picture
                                            </Label>
                                            <div className="flex items-center gap-4 rounded-xl border border-dashed border-border/80 bg-muted/20 p-3">
                                                <Avatar className="size-14 rounded-lg border bg-background">
                                                    {(certifiedPicturePreview ||
                                                        companySetting.certified_picture_url) && (
                                                        <AvatarImage
                                                            src={
                                                                certifiedPicturePreview ??
                                                                companySetting.certified_picture_url ??
                                                                undefined
                                                            }
                                                            alt="Certified picture"
                                                        />
                                                    )}
                                                    <AvatarFallback className="rounded-lg">
                                                        <FileCheck2 className="size-5 text-muted-foreground" />
                                                    </AvatarFallback>
                                                </Avatar>
                                                <Input
                                                    id="certified_picture"
                                                    type="file"
                                                    name="certified_picture"
                                                    accept="image/*"
                                                    className="flex-1"
                                                    onChange={
                                                        handleCertifiedPictureChange
                                                    }
                                                />
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                Leave empty to keep the current
                                                certified picture.
                                            </p>
                                            <InputError
                                                message={
                                                    errors.certified_picture
                                                }
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <Card>
                                <CardFooter className="flex-col gap-4 py-4 sm:flex-row sm:justify-between">
                                    <p className="text-sm text-muted-foreground">
                                        Changes are applied to new documents
                                        after saving.
                                    </p>
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full sm:w-auto"
                                    >
                                        {processing ? (
                                            <Spinner />
                                        ) : (
                                            <Save className="size-4" />
                                        )}
                                        Save changes
                                    </Button>
                                </CardFooter>
                            </Card>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}

CompanySettingsEdit.layout = {
    breadcrumbs: [
        {
            title: 'Company Settings',
            href: edit(),
        },
    ],
};
