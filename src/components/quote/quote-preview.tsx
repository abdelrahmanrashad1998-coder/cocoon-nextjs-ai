"use client";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { QuoteData, QuoteTotals } from "@/types/quote";
import { calculateItemPricing } from "@/lib/pricing-calculator";

interface QuotePreviewProps {
    quoteData: QuoteData;
    totals: QuoteTotals;
}

export function QuotePreview({ quoteData, totals }: QuotePreviewProps) {
    const formatCurrency = (amount: number) => {
        return `EGP ${amount.toLocaleString()}`;
    };

    const getItemIcon = (type: string) => {
        switch (type) {
            case "window":
                return "🪟";
            case "door":
                return "🚪";
            case "sliding_door":
                return "🪟";
            case "curtain_wall":
                return "🏢";
            default:
                return "📦";
        }
    };

    const getGlassTypeLabel = (type: string) => {
        return type === "double" ? "Double Glazed" : "Single Glazed";
    };

    const getFeatures = (item: any) => {
        const features = [];
        if (item.glassType === "double") features.push("Double Glazed");
        if (item.mosquito) features.push("Mosquito Net");
        if (item.arch) features.push("Arch Trave");
        return features;
    };

    return (
        <div className="space-y-6">
            {/* Quote Header */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl">
                                Quote Preview
                            </CardTitle>
                            <CardDescription>
                                Review your quote before saving or exporting
                            </CardDescription>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-muted-foreground">
                                Quote ID
                            </div>
                            <div className="font-mono text-sm">
                                {quoteData.id}
                            </div>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Customer Information */}
            <Card>
                <CardHeader>
                    <CardTitle>Customer Information</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <div className="text-sm font-medium text-muted-foreground">
                                Customer Name
                            </div>
                            <div className="text-lg">
                                {quoteData.contactInfo.name || "Not specified"}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm font-medium text-muted-foreground">
                                Email
                            </div>
                            <div className="text-lg">
                                {quoteData.contactInfo.email || "Not specified"}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm font-medium text-muted-foreground">
                                Phone
                            </div>
                            <div className="text-lg">
                                {quoteData.contactInfo.phone || "Not specified"}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm font-medium text-muted-foreground">
                                Project Location
                            </div>
                            <div className="text-lg">
                                {quoteData.contactInfo.location ||
                                    "Not specified"}
                            </div>
                        </div>
                    </div>
                    {quoteData.contactInfo.notes && (
                        <div className="mt-4">
                            <div className="text-sm font-medium text-muted-foreground">
                                Project Notes
                            </div>
                            <div className="text-sm mt-1">
                                {quoteData.contactInfo.notes}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Items Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Quote Items</CardTitle>
                    <CardDescription>
                        {quoteData.items.length} items • Total Area:{" "}
                        {totals.totalArea.toFixed(2)} m²
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Item</TableHead>
                                <TableHead>Dimensions</TableHead>
                                <TableHead>System</TableHead>
                                <TableHead>Specifications</TableHead>
                                <TableHead className="text-right">
                                    Area
                                </TableHead>
                                {quoteData.settings.pricingType ===
                                    "detailed" && (
                                    <TableHead className="text-right">
                                        Price
                                    </TableHead>
                                )}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {quoteData.items.map((item, index) => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">
                                                {getItemIcon(item.type)}
                                            </span>
                                            <div>
                                                <div className="font-medium">
                                                    {item.type === "window"
                                                        ? "Window"
                                                        : item.type === "door"
                                                        ? "Door"
                                                        : item.type ===
                                                          "sliding_door"
                                                        ? "Sliding Door"
                                                        : item.type ===
                                                          "sky_light"
                                                        ? "Sky Light"
                                                        : "Curtain Wall"}{" "}
                                                    {index + 1}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    Qty: {item.quantity}
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">
                                            {item.width}m × {item.height}m
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">
                                            {item.system}
                                            {item.leaves > 1 && (
                                                <div className="text-xs text-muted-foreground">
                                                    {item.leaves} leaves
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-1">
                                            <Badge
                                                variant="secondary"
                                                className="text-xs"
                                            >
                                                {getGlassTypeLabel(
                                                    item.glassType
                                                )}
                                            </Badge>
                                            {getFeatures(item).map(
                                                (feature, i) => (
                                                    <Badge
                                                        key={i}
                                                        variant="outline"
                                                        className="text-xs"
                                                    >
                                                        {feature}
                                                    </Badge>
                                                )
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {(
                                            item.width *
                                            item.height *
                                            item.quantity
                                        ).toFixed(2)}{" "}
                                        m²
                                    </TableCell>
                                    {quoteData.settings.pricingType ===
                                        "detailed" && (
                                        <TableCell className="text-right">
                                            <div className="text-sm font-medium">
                                                {formatCurrency(
                                                    calculateItemPricing(item)
                                                        .totalPrice
                                                )}
                                            </div>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Quote Summary */}
            <Card>
                <CardHeader>
                    <CardTitle>Quote Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-4 bg-muted rounded-lg text-center">
                            <div className="text-sm text-muted-foreground">
                                Total Area (m²)
                            </div>
                            <div className="text-2xl font-bold text-primary">
                                {totals.totalArea.toFixed(2)}
                            </div>
                        </div>
                        <div className="p-4 bg-muted rounded-lg text-center">
                            <div className="text-sm text-muted-foreground">
                                Total Price
                            </div>
                            <div className="text-2xl font-bold text-primary">
                                {formatCurrency(totals.totalPrice)}
                            </div>
                        </div>
                        <div className="p-4 bg-muted rounded-lg text-center">
                            <div className="text-sm text-muted-foreground">
                                Down Payment
                            </div>
                            <div className="text-2xl font-bold text-primary">
                                {formatCurrency(totals.downPayment)}
                            </div>
                        </div>
                        <div className="p-4 bg-muted rounded-lg text-center">
                            <div className="text-sm text-muted-foreground">
                                Profit Margin
                            </div>
                            <div className="text-2xl font-bold text-primary">
                                {totals.profitPercentage * 100}%
                            </div>
                        </div>
                    </div>

                    <Separator className="my-6" />

                    {/* Payment Schedule */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">
                            Payment Schedule
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 border rounded-lg flex flex-col justify-center items-center">
                                <div className="text-sm j font-medium text-muted-foreground">
                                    Down Payment
                                </div>
                                <div className="text-xl font-bold text-primary">
                                    {formatCurrency(totals.downPayment)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    80% of total
                                </div>
                            </div>
                            <div className="p-4 border rounded-lg flex flex-col justify-center items-center">
                                <div className="text-sm font-medium text-muted-foreground">
                                    On Supply
                                </div>
                                <div className="text-xl font-bold text-primary">
                                    {formatCurrency(totals.supplyPayment)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    10% of total
                                </div>
                            </div>
                            <div className="p-4 border rounded-lg flex flex-col justify-center items-center">
                                <div className="text-sm font-medium text-muted-foreground">
                                    On Completion
                                </div>
                                <div className="text-xl font-bold text-primary">
                                    {formatCurrency(totals.completePayment)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    10% of total
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quote Validity */}
                    <Separator className="my-6" />
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">
                            Quote Validity
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 border rounded-lg flex flex-col justify-center items-center">
                                <div className="text-sm font-medium text-muted-foreground">
                                    Quote Valid For
                                </div>
                                <div className="text-xl font-bold text-primary">
                                    {quoteData.settings.expirationDays} days
                                </div>
                            </div>
                            <div className="p-4 border rounded-lg flex flex-col justify-center items-center">
                                <div className="text-sm font-medium text-muted-foreground">
                                    Project Duration
                                </div>
                                <div className="text-xl font-bold text-primary">
                                    {quoteData.settings.projectDuration} days
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Custom Notes */}
                    {quoteData.settings.customNotes && (
                        <>
                            <Separator className="my-6" />
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">
                                    Special Notes
                                </h3>
                                <div className="p-4 bg-muted rounded-lg">
                                    <p className="text-sm">
                                        {quoteData.settings.customNotes}
                                    </p>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
