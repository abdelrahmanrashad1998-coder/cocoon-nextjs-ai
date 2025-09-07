"use client";

import { useState, useMemo } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { QuoteData, QuoteTotals, QuoteItem } from "@/types/quote";
import { calculateItemPricing } from "@/lib/pricing-calculator";
import { DetailedPricingBreakdown } from "./detailed-pricing-breakdown";
import { Calculator, Eye, EyeOff, Download, Printer } from "lucide-react";

interface QuotePreviewProps {
    quoteData: QuoteData;
    totals: QuoteTotals;
    onExport?: (type: "pdf" | "print") => void;
}

export function QuotePreview({
    quoteData,
    totals,
    onExport,
}: QuotePreviewProps) {
    const [showDetailedPricing, setShowDetailedPricing] = useState(false);

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

    const getFeatures = (item: QuoteItem) => {
        const features = [];
        if (item.glassType === "double") features.push("Double Glazed");
        if (item.mosquito) features.push("Mosquito Net");
        if (item.arch) features.push("Arch Trave");
        return features;
    };

    const generateItemSvg = (item: QuoteItem) => {
        let svgContent = "";

        if (item.type === "curtain_wall") {
            // For curtain wall, use the existing logic from ItemSvgGenerator
            if (item.designData?.panels) {
                const { panels, wallWidth, wallHeight } = item.designData;
                const scale = Math.min(150 / wallWidth, 100 / wallHeight) * 0.9;
                const scaledWallWidth = wallWidth * scale;
                const scaledWallHeight = wallHeight * scale;
                const offsetX = (150 - scaledWallWidth) / 2;
                const offsetY = (100 - scaledWallHeight) / 2;

                let svgElements = "";
                svgElements += `<rect x="${offsetX}" y="${offsetY}" width="${scaledWallWidth}" height="${scaledWallHeight}" fill="none" stroke="#374151" stroke-width="1"/>`;

                panels.forEach((panel) => {
                    // Use cumulative positioning for non-uniform sizes (primary method)
                    let panelX, panelY, panelWidth, panelHeight;
                    
                    if (panel.col !== undefined && panel.row !== undefined) {
                        // Calculate cumulative positions for columns
                        const totalWidth = wallWidth;
                        const totalHeight = wallHeight;
                        const cumulativeColumnPositions = [0];
                        const cumulativeRowPositions = [0];
                        
                        // Build cumulative positions based on column/row sizes if available
                        if (item.designData?.columnSizes && item.designData.columnSizes.length > 0) {
                            for (let i = 0; i < item.designData.columnSizes.length; i++) {
                                cumulativeColumnPositions.push(cumulativeColumnPositions[i] + item.designData.columnSizes[i]);
                            }
                        } else {
                            const uniformColumnWidth = wallWidth / (item.designData?.columns || 4);
                            for (let i = 0; i <= (item.designData?.columns || 4); i++) {
                                cumulativeColumnPositions.push(i * uniformColumnWidth);
                            }
                        }
                        
                        if (item.designData?.rowSizes && item.designData.rowSizes.length > 0) {
                            for (let i = 0; i < item.designData.rowSizes.length; i++) {
                                cumulativeRowPositions.push(cumulativeRowPositions[i] + item.designData.rowSizes[i]);
                            }
                        } else {
                            const uniformRowHeight = wallHeight / (item.designData?.rows || 3);
                            for (let i = 0; i <= (item.designData?.rows || 3); i++) {
                                cumulativeRowPositions.push(i * uniformRowHeight);
                            }
                        }
                        
                        const col = Math.min(panel.col, cumulativeColumnPositions.length - 1);
                        const row = Math.min(panel.row, cumulativeRowPositions.length - 1);
                        const colSpan = panel.colSpan || 1;
                        const rowSpan = panel.rowSpan || 1;
                        
                        // Calculate position based on cumulative positions
                        const leftMeters = cumulativeColumnPositions[col];
                        const topMeters = cumulativeRowPositions[row];
                        const rightMeters = cumulativeColumnPositions[Math.min(col + colSpan, cumulativeColumnPositions.length - 1)];
                        const bottomMeters = cumulativeRowPositions[Math.min(row + rowSpan, cumulativeRowPositions.length - 1)];
                        
                        // Convert to SVG coordinates
                        panelX = offsetX + (leftMeters / totalWidth) * scaledWallWidth;
                        panelY = offsetY + (topMeters / totalHeight) * scaledWallHeight;
                        panelWidth = ((rightMeters - leftMeters) / totalWidth) * scaledWallWidth;
                        panelHeight = ((bottomMeters - topMeters) / totalHeight) * scaledWallHeight;
                    } else if (panel.left !== undefined && panel.top !== undefined && 
                        panel.width !== undefined && panel.height !== undefined) {
                        // Fallback to percentage-based positioning
                        panelX = offsetX + (panel.left / 100) * scaledWallWidth;
                        panelY = offsetY + (panel.top / 100) * scaledWallHeight;
                        panelWidth = (panel.width / 100) * scaledWallWidth;
                        panelHeight = (panel.height / 100) * scaledWallHeight;
                    } else {
                        // Final fallback to meter-based positioning
                        panelWidth = (panel.widthMeters / wallWidth) * scaledWallWidth;
                        panelHeight = (panel.heightMeters / wallHeight) * scaledWallHeight;
                        panelX = offsetX + (panel.left / 100) * scaledWallWidth;
                        panelY = offsetY + (panel.top / 100) * scaledWallHeight;
                    }

                    let fillColor = "#87CEEB";
                    let strokeColor = "#666";

                    switch (panel.type) {
                        case "window":
                            fillColor = "#87CEEB";
                            strokeColor = "#3b82f6";
                            break;
                        case "door":
                            fillColor = "#98FB98";
                            strokeColor = "#f59e0b";
                            break;
                        case "structure":
                            fillColor = "#D3D3D3";
                            strokeColor = "#10b981";
                            break;
                    }

                    svgElements += `<rect x="${panelX}" y="${panelY}" width="${panelWidth}" height="${panelHeight}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="1" opacity="0.8"/>`;

                    const label =
                        panel.type === "structure"
                            ? "Fixed"
                            : panel.type.charAt(0).toUpperCase() +
                              panel.type.slice(1);
                    svgElements += `<text x="${panelX + panelWidth / 2}" y="${
                        panelY + panelHeight / 2
                    }" text-anchor="middle" dominant-baseline="middle" font-size="6" fill="#333">${label}</text>`;
                });

                svgElements += `<text x="${offsetX + scaledWallWidth / 2}" y="${
                    offsetY - 3
                }" text-anchor="middle" font-size="8" fill="#666">${wallWidth}m</text>`;
                svgElements += `<text x="${offsetX - 3}" y="${
                    offsetY + scaledWallHeight / 2
                }" text-anchor="middle" dominant-baseline="middle" font-size="8" fill="#666" transform="rotate(-90, ${
                    offsetX - 3
                }, ${offsetY + scaledWallHeight / 2})">${wallHeight}m</text>`;

                svgContent = `<svg width="150" height="100" viewBox="0 0 150 100">${svgElements}</svg>`;
            }
        } else {
            // For regular items
            const {
                width: itemWidth,
                height: itemHeight,
                system,
                leaves,
                type,
            } = item;
            const scale = Math.min(150 / itemWidth, 100 / itemHeight) * 0.8;
            const scaledWidth = itemWidth * scale;
            const scaledHeight = itemHeight * scale;
            const offsetX = (150 - scaledWidth) / 2;
            const offsetY = (100 - scaledHeight) / 2;

            let svgElements = "";
            svgElements += `<rect x="${offsetX}" y="${offsetY}" width="${scaledWidth}" height="${scaledHeight}" fill="none" stroke="#374151" stroke-width="1" rx="2"/>`;

            const glassInset = 4;
            svgElements += `<rect x="${offsetX + glassInset}" y="${
                offsetY + glassInset
            }" width="${scaledWidth - glassInset * 2}" height="${
                scaledHeight - glassInset * 2
            }" fill="#87CEEB" stroke="#666" stroke-width="0.5" opacity="0.7"/>`;

            if (system === "Sliding") {
                const panelWidth = (scaledWidth - glassInset * 2) / leaves;
                for (let i = 0; i < leaves; i++) {
                    const panelX = offsetX + glassInset + i * panelWidth;
                    if (i > 0) {
                        svgElements += `<line x1="${panelX}" y1="${
                            offsetY + glassInset
                        }" x2="${panelX}" y2="${
                            offsetY + scaledHeight - glassInset
                        }" stroke="#666" stroke-width="0.5"/>`;
                    }
                    const handleY = offsetY + scaledHeight / 2;
                    const handleSize = 4;
                    if (i === 0 || i === leaves - 1) {
                        svgElements += `<circle cx="${
                            panelX + panelWidth / 2
                        }" cy="${handleY}" r="${handleSize}" fill="#666"/><rect x="${
                            panelX + panelWidth / 2 - handleSize / 2
                        }" y="${
                            handleY - 1
                        }" width="${handleSize}" height="2" fill="#666"/>`;
                    }
                }
            } else if (system === "hinged") {
                const hingeSpacing = scaledHeight / (leaves + 1);
                for (let i = 1; i <= leaves; i++) {
                    const hingeY = offsetY + i * hingeSpacing;
                    svgElements += `<circle cx="${offsetX}" cy="${hingeY}" r="2" fill="#666"/><circle cx="${
                        offsetX + scaledWidth
                    }" cy="${hingeY}" r="2" fill="#666"/>`;
                }
                if (type === "door") {
                    const handleX =
                        leaves === 1
                            ? offsetX + scaledWidth - 10
                            : offsetX + scaledWidth / 2;
                    const handleY = offsetY + scaledHeight / 2;
                    svgElements += `<circle cx="${handleX}" cy="${handleY}" r="2" fill="#FFD700"/><rect x="${
                        handleX - 4
                    }" y="${
                        handleY - 1
                    }" width="8" height="2" fill="#FFD700"/>`;
                }
            } else if (system === "fixed") {
                svgElements += `<text x="${offsetX + scaledWidth / 2}" y="${
                    offsetY + scaledHeight / 2
                }" text-anchor="middle" dominant-baseline="middle" font-size="8" fill="#666">Fixed</text>`;
            }

            svgElements += `<text x="${offsetX + scaledWidth / 2}" y="${
                offsetY - 3
            }" text-anchor="middle" font-size="8" fill="#666">${itemWidth}m</text>`;
            svgElements += `<text x="${offsetX - 3}" y="${
                offsetY + scaledHeight / 2
            }" text-anchor="middle" dominant-baseline="middle" font-size="8" fill="#666" transform="rotate(-90, ${
                offsetX - 3
            }, ${offsetY + scaledHeight / 2})">${itemHeight}m</text>`;

            svgContent = `<svg width="150" height="100" viewBox="0 0 150 100">${svgElements}</svg>`;
        }

        return svgContent;
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
                        <div className="flex items-center gap-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    setShowDetailedPricing(!showDetailedPricing)
                                }
                                className="flex items-center gap-2"
                            >
                                <Calculator className="h-4 w-4" />
                                {showDetailedPricing ? (
                                    <>
                                        <EyeOff className="h-4 w-4" />
                                        Hide Details
                                    </>
                                ) : (
                                    <>
                                        <Eye className="h-4 w-4" />
                                        Show Details
                                    </>
                                )}
                            </Button>
                            <div className="text-right">
                                <div className="text-sm text-muted-foreground">
                                    Quote Name
                                </div>
                                <div className="font-medium text-sm">
                                    {quoteData.name}
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">
                                    Quote ID
                                </div>
                                <div className="font-mono text-sm">
                                    {quoteData.id}
                                </div>
                            </div>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Export Actions */}
            {onExport && (
                <div className="flex justify-center gap-4">
                    <Button
                        onClick={() => onExport("pdf")}
                        className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 px-6 py-3"
                    >
                        <Download className="h-5 w-5" />
                        Export PDF
                    </Button>
                    <Button
                        onClick={() => onExport("print")}
                        variant="outline"
                        className="flex items-center gap-2 px-6 py-3"
                    >
                        <Printer className="h-5 w-5" />
                        Print Quote
                    </Button>
                </div>
            )}

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
                                <TableHead>Preview</TableHead>
                                <TableHead>Dimensions</TableHead>
                                <TableHead>System</TableHead>
                                <TableHead>Color</TableHead>
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
                                        <div className="flex justify-center">
                                            <div
                                                className="border rounded bg-white p-1"
                                                dangerouslySetInnerHTML={{
                                                    __html: generateItemSvg(
                                                        item
                                                    ),
                                                }}
                                            />
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
                                        <div className="text-sm">
                                            {item.color ? (
                                                <div className="space-y-1">
                                                    <Badge
                                                        variant="outline"
                                                        className="text-xs"
                                                    >
                                                        {item.color.code}
                                                    </Badge>
                                                    <div className="text-xs text-muted-foreground">
                                                        {item.color.color} -{" "}
                                                        {item.color.finish}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-xs">
                                                    No color selected
                                                </span>
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

            {/* Detailed Pricing Breakdown */}
            {showDetailedPricing && (
                <DetailedPricingBreakdown items={quoteData.items} />
            )}

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
