"use client";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Settings, Calendar, Percent, FileText } from "lucide-react";
import { QuoteSettings as QuoteSettingsType } from "@/types/quote";

interface QuoteSettingsProps {
    settings: QuoteSettingsType;
    onUpdate: (field: keyof QuoteSettingsType, value: string | number) => void;
    quoteName: string;
    onUpdateQuoteName: (name: string) => void;
}

export function QuoteSettings({
    settings,
    onUpdate,
    quoteName,
    onUpdateQuoteName,
}: QuoteSettingsProps) {
    return (
        <div className="space-y-6">
            {/* Quote Name Settings */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Settings className="h-5 w-5 text-primary" />
                        <CardTitle>Quote Name</CardTitle>
                    </div>
                    <CardDescription>
                        Give your quote a custom name
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Label htmlFor="quoteName">Quote Name</Label>
                        <Input
                            id="quoteName"
                            value={quoteName}
                            onChange={(e) => onUpdateQuoteName(e.target.value)}
                            placeholder="Enter quote name"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Quote Validity Settings */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        <CardTitle>Quote Validity</CardTitle>
                    </div>
                    <CardDescription>
                        Configure quote expiration and project duration settings
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="expirationDays">
                                Quote Expiration (days)
                            </Label>
                            <Input
                                id="expirationDays"
                                type="number"
                                min="1"
                                max="365"
                                value={settings.expirationDays}
                                onChange={(e) =>
                                    onUpdate(
                                        "expirationDays",
                                        parseInt(e.target.value) || 30
                                    )
                                }
                                placeholder="30"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="projectDuration">
                                Project Duration (days)
                            </Label>
                            <Input
                                id="projectDuration"
                                type="number"
                                min="1"
                                max="365"
                                value={settings.projectDuration}
                                onChange={(e) =>
                                    onUpdate(
                                        "projectDuration",
                                        parseInt(e.target.value) || 60
                                    )
                                }
                                placeholder="60"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Pricing Settings */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Percent className="h-5 w-5 text-primary" />
                        <CardTitle>Pricing Settings</CardTitle>
                    </div>
                    <CardDescription>
                        Configure discount and pricing display options
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="discountPercentage">
                                Discount Percentage
                            </Label>
                            <Input
                                id="discountPercentage"
                                type="number"
                                min="0"
                                max="50"
                                step="0.5"
                                value={settings.discountPercentage}
                                onChange={(e) =>
                                    onUpdate(
                                        "discountPercentage",
                                        parseFloat(e.target.value) || 0
                                    )
                                }
                                placeholder="0"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="pricingType">Pricing Display</Label>
                            <Select
                                value={settings.pricingType}
                                onValueChange={(value) =>
                                    onUpdate("pricingType", value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="totals">
                                        Show Totals Only
                                    </SelectItem>
                                    <SelectItem value="detailed">
                                        Show Detailed Pricing
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Custom Notes */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <CardTitle>Custom Notes</CardTitle>
                    </div>
                    <CardDescription>
                        Add custom notes that will appear on the quote
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Label htmlFor="customNotes">Quote Notes</Label>
                        <Textarea
                            id="customNotes"
                            value={settings.customNotes}
                            onChange={(e) =>
                                onUpdate("customNotes", e.target.value)
                            }
                            placeholder="Enter custom notes for this quote (e.g., special installation requirements, warranty details, etc.)"
                            rows={4}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Settings Summary */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Settings className="h-5 w-5 text-primary" />
                        <CardTitle>Settings Summary</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 text-sm">
                        <div className="p-3 bg-muted rounded-lg">
                            <div className="font-medium">Quote Expiration</div>
                            <div className="text-primary">
                                {settings.expirationDays} days
                            </div>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                            <div className="font-medium">Project Duration</div>
                            <div className="text-primary">
                                {settings.projectDuration} days
                            </div>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                            <div className="font-medium">Discount</div>
                            <div className="text-primary">
                                {settings.discountPercentage}%
                            </div>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                            <div className="font-medium">Pricing Display</div>
                            <div className="text-primary capitalize">
                                {settings.pricingType}
                            </div>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                            <div className="font-medium">Export Format</div>
                            <div className="text-primary capitalize">
                                {settings.exportFormat}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
