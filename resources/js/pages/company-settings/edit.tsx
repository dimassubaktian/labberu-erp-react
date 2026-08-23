import { Form, Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
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

            <div className="mx-auto w-full max-w-5xl space-y-6 p-4">
                <Heading
                    title="Company Settings"
                    description="Manage your organization's company information"
                />

                <Form
                    {...update.form()}
                    encType="multipart/form-data"
                    className="space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2 sm:grid-cols-2">
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
                                    <InputError message={errors.legal_name} />
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
                                    <InputError message={errors.trade_name} />
                                </div>
                            </div>

                            <div className="grid gap-2 sm:grid-cols-2">
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
                            </div>

                            <div className="grid gap-2 sm:grid-cols-2">
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
                                    <InputError message={errors.email} />
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
                                    <InputError message={errors.phone} />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="website">Website</Label>
                                <Input
                                    id="website"
                                    type="url"
                                    name="website"
                                    defaultValue={companySetting.website ?? ''}
                                    placeholder="Optional, e.g. https://example.com"
                                />
                                <InputError message={errors.website} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="address">Address</Label>
                                <Textarea
                                    id="address"
                                    name="address"
                                    defaultValue={companySetting.address ?? ''}
                                    placeholder="Optional"
                                />
                                <InputError message={errors.address} />
                            </div>

                            <div className="grid gap-2 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="city">City</Label>
                                    <Input
                                        id="city"
                                        name="city"
                                        defaultValue={companySetting.city ?? ''}
                                        placeholder="Optional"
                                    />
                                    <InputError message={errors.city} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="province">Province</Label>
                                    <Input
                                        id="province"
                                        name="province"
                                        defaultValue={
                                            companySetting.province ?? ''
                                        }
                                        placeholder="Optional"
                                    />
                                    <InputError message={errors.province} />
                                </div>
                            </div>

                            <div className="grid gap-2 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="postal_code">
                                        Postal code
                                    </Label>
                                    <Input
                                        id="postal_code"
                                        name="postal_code"
                                        defaultValue={
                                            companySetting.postal_code ?? ''
                                        }
                                        placeholder="Optional"
                                    />
                                    <InputError message={errors.postal_code} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="country">Country</Label>
                                    <Input
                                        id="country"
                                        name="country"
                                        defaultValue={
                                            companySetting.country ?? ''
                                        }
                                        placeholder="Optional"
                                    />
                                    <InputError message={errors.country} />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="logo">Logo</Label>
                                <div className="flex items-center gap-4">
                                    <Avatar className="size-14 rounded-md">
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
                                        <AvatarFallback className="rounded-md">
                                            —
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
                                    Leave empty to keep the current logo.
                                </p>
                                <InputError message={errors.logo} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="certified_picture">
                                    Certified picture
                                </Label>
                                <div className="flex items-center gap-4">
                                    <Avatar className="size-14 rounded-md">
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
                                        <AvatarFallback className="rounded-md">
                                            —
                                        </AvatarFallback>
                                    </Avatar>
                                    <Input
                                        id="certified_picture"
                                        type="file"
                                        name="certified_picture"
                                        accept="image/*"
                                        className="flex-1"
                                        onChange={handleCertifiedPictureChange}
                                    />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Leave empty to keep the current certified
                                    picture.
                                </p>
                                <InputError
                                    message={errors.certified_picture}
                                />
                            </div>

                            <div className="flex justify-end">
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

CompanySettingsEdit.layout = {
    breadcrumbs: [
        {
            title: 'Company Settings',
            href: edit(),
        },
    ],
};
