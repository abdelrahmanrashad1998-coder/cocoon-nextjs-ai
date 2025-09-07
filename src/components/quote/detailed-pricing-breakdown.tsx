/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { QuoteItem } from "@/types/quote";
import { calculateItemPricing } from "@/lib/pricing-calculator";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

interface DetailedPricingBreakdownProps {
    items: QuoteItem[];
}

export function DetailedPricingBreakdown({
    items,
}: DetailedPricingBreakdownProps) {
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

    const formatCurrency = (amount: number) => {
        return `EGP ${amount.toLocaleString()}`;
    };

    const getItemIcon = (type: string) => {
        switch (type) {
            case "window":
                return "🪟";
            case "door":
                return "🚪";
            case "sky_light":
                return "🪟";
            case "curtain_wall":
                return "🏢";
            default:
                return "📦";
        }
    };

    const toggleExpanded = (itemId: string) => {
        const newExpanded = new Set(expandedItems);
        if (newExpanded.has(itemId)) {
            newExpanded.delete(itemId);
        } else {
            newExpanded.add(itemId);
        }
        setExpandedItems(newExpanded);
    };

    const renderNormalItemBreakdown = (item: QuoteItem, pricing: any) => {
        return (
            <div className="space-y-4">
                {/* Basic Information */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                        <span className="font-medium text-muted-foreground">
                            Dimensions:
                        </span>
                        <div className="font-medium">
                            {item.width}m × {item.height}m
                        </div>
                    </div>
                    <div>
                        <span className="font-medium text-muted-foreground">
                            Leaves:
                        </span>
                        <div className="font-medium">{item.leaves}</div>
                    </div>
                    <div>
                        <span className="font-medium text-muted-foreground">
                            Quantity:
                        </span>
                        <div className="font-medium">{item.quantity}</div>
                    </div>
                    <div>
                        <span className="font-medium text-muted-foreground">
                            Glass Type:
                        </span>
                        <div className="font-medium">
                            {item.glassType === "double"
                                ? "Double Glazed"
                                : "Single Glazed"}
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Calculations */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                        <span className="font-medium text-muted-foreground">
                            Area (m²):
                        </span>
                        <div className="font-medium">
                            {(item.width * item.height).toFixed(2)}
                        </div>
                    </div>
                    <div>
                        <span className="font-medium text-muted-foreground">
                            Frame Length (m):
                        </span>
                        <div className="font-medium">
                            {pricing.frameLength.toFixed(2)}
                        </div>
                    </div>
                    <div>
                        <span className="font-medium text-muted-foreground">
                            Leaf Perimeter (m):
                        </span>
                        <div className="font-medium">
                            {pricing.leafPerimeter.toFixed(2)}
                        </div>
                    </div>
                    <div>
                        <span className="font-medium text-muted-foreground">
                            Total Leaf Length (m):
                        </span>
                        <div className="font-medium">
                            {pricing.totalLeafLength.toFixed(2)}
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Cost Breakdown */}
                <div className="space-y-3">
                    <h4 className="font-semibold text-lg">Cost Breakdown</h4>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Component</TableHead>
                                <TableHead className="text-right">
                                    Unit Cost
                                </TableHead>
                                <TableHead className="text-right">
                                    Quantity
                                </TableHead>
                                <TableHead className="text-right">
                                    Total Cost
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell>Frame Cost</TableCell>
                                <TableCell className="text-right">
                                    {formatCurrency(
                                        pricing.frameCost / item.quantity
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    {item.quantity}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                    {formatCurrency(pricing.frameCost)}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Leaf Cost</TableCell>
                                <TableCell className="text-right">
                                    {formatCurrency(
                                        pricing.leafCost / item.quantity
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    {item.quantity}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                    {formatCurrency(pricing.leafCost)}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Glass Cost</TableCell>
                                <TableCell className="text-right">
                                    {formatCurrency(
                                        pricing.glassCost / item.quantity
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    {item.quantity}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                    {formatCurrency(pricing.glassCost)}
                                </TableCell>
                            </TableRow>
                            {pricing.accessories > 0 && (
                                <TableRow>
                                    <TableCell>Accessories</TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(
                                            pricing.accessories / item.quantity
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {item.quantity}
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        {formatCurrency(pricing.accessories)}
                                    </TableCell>
                                </TableRow>
                            )}
                            {pricing.netCost > 0 && (
                                <TableRow>
                                    <TableCell>Mosquito Net</TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(
                                            pricing.netCost / item.quantity
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {item.quantity}
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        {formatCurrency(pricing.netCost)}
                                    </TableCell>
                                </TableRow>
                            )}
                            {pricing.archCost > 0 && (
                                <TableRow>
                                    <TableCell>Architrave</TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(
                                            pricing.archCost / item.quantity
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {item.quantity}
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        {formatCurrency(pricing.archCost)}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                <Separator />

                {/* Profit and Totals */}
                <div className="space-y-3">
                    <h4 className="font-semibold text-lg">Profit & Totals</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="font-medium text-muted-foreground">
                                Subtotal (Before Profit):
                            </span>
                            <div className="font-medium text-lg">
                                {formatCurrency(pricing.totalBeforeProfit)}
                            </div>
                        </div>
                        <div>
                            <span className="font-medium text-muted-foreground">
                                Profit Rate:
                            </span>
                            <div className="font-medium text-lg">
                                {(pricing.base_profit_rate * 100).toFixed(2)}%
                            </div>
                        </div>
                        <div>
                            <span className="font-medium text-muted-foreground">
                                Profit Amount:
                            </span>
                            <div className="font-medium text-lg">
                                {formatCurrency(pricing.profitAmount)}
                            </div>
                        </div>
                        <div>
                            <span className="font-medium text-muted-foreground">
                                Total Price:
                            </span>
                            <div className="font-medium text-xl text-primary">
                                {formatCurrency(pricing.totalPrice)}
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="font-medium text-muted-foreground">
                                Price per m²:
                            </span>
                            <div className="font-medium">
                                {formatCurrency(pricing.m2Price)}
                            </div>
                        </div>
                        <div>
                            <span className="font-medium text-muted-foreground">
                                Profit Percentage:
                            </span>
                            <div className="font-medium">
                                {pricing.profitPercentage.toFixed(2)}%
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderCurtainWallBreakdown = (item: QuoteItem, pricing: any) => {
        return (
            <div className="space-y-4">
                {/* Basic Information */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                        <span className="font-medium text-muted-foreground">
                            Wall Dimensions:
                        </span>
                        <div className="font-medium">
                            {item.designData?.wallWidth}m ×{" "}
                            {item.designData?.wallHeight}m
                        </div>
                    </div>
                    <div>
                        <span className="font-medium text-muted-foreground">
                            Frame Meters:
                        </span>
                        <div className="font-medium">
                            {pricing.frameMeters?.toFixed(2)}m
                        </div>
                    </div>
                    <div>
                        <span className="font-medium text-muted-foreground">
                            Window Meters:
                        </span>
                        <div className="font-medium">
                            {pricing.windowMeters?.toFixed(2)}m
                        </div>
                    </div>
                    <div>
                        <span className="font-medium text-muted-foreground">
                            Glass Area:
                        </span>
                        <div className="font-medium">
                            {pricing.glassArea?.toFixed(2)}m²
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                        <span className="font-medium text-muted-foreground">
                            Windows:
                        </span>
                        <div className="font-medium">{pricing.numWindows}</div>
                    </div>
                    <div>
                        <span className="font-medium text-muted-foreground">
                            Doors:
                        </span>
                        <div className="font-medium">{pricing.numDoors}</div>
                    </div>
                    <div>
                        <span className="font-medium text-muted-foreground">
                            Corners:
                        </span>
                        <div className="font-medium">{pricing.cornerCount}</div>
                    </div>
                    <div>
                        <span className="font-medium text-muted-foreground">
                            Total Area:
                        </span>
                        <div className="font-medium">
                            {pricing.totalArea?.toFixed(2)}m²
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Cost Breakdown */}
                <div className="space-y-3">
                    <h4 className="font-semibold text-lg">Cost Breakdown</h4>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Component</TableHead>
                                <TableHead className="text-right">
                                    Unit Cost
                                </TableHead>
                                <TableHead className="text-right">
                                    Quantity
                                </TableHead>
                                <TableHead className="text-right">
                                    Total Cost
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell>Frame Cost</TableCell>
                                <TableCell className="text-right">
                                    {formatCurrency(
                                        pricing.frameCost / item.quantity
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    {item.quantity}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                    {formatCurrency(pricing.frameCost)}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Windows Cost</TableCell>
                                <TableCell className="text-right">
                                    {formatCurrency(
                                        pricing.windowsCost / item.quantity
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    {item.quantity}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                    {formatCurrency(pricing.windowsCost)}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Window/Door Accessories</TableCell>
                                <TableCell className="text-right">
                                    {formatCurrency(
                                        pricing.accessoriesWindowsDoors /
                                            item.quantity
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    {item.quantity}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                    {formatCurrency(
                                        pricing.accessoriesWindowsDoors
                                    )}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Frame Accessories</TableCell>
                                <TableCell className="text-right">
                                    {formatCurrency(
                                        pricing.frameAccessories / item.quantity
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    {item.quantity}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                    {formatCurrency(pricing.frameAccessories)}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Corner Accessories</TableCell>
                                <TableCell className="text-right">
                                    {formatCurrency(
                                        pricing.cornersCost / item.quantity
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    {item.quantity}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                    {formatCurrency(pricing.cornersCost)}
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>

                <Separator />

                {/* Profit and Totals */}
                <div className="space-y-3">
                    <h4 className="font-semibold text-lg">Profit & Totals</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="font-medium text-muted-foreground">
                                Subtotal (Before Profit):
                            </span>
                            <div className="font-medium text-lg">
                                {formatCurrency(pricing.totalBeforeProfit)}
                            </div>
                        </div>
                        <div>
                            <span className="font-medium text-muted-foreground">
                                Profit Rate:
                            </span>
                            <div className="font-medium text-lg">
                                {(pricing.base_profit_rate * 100).toFixed(2)}%
                            </div>
                        </div>
                        <div>
                            <span className="font-medium text-muted-foreground">
                                Profit Amount:
                            </span>
                            <div className="font-medium text-lg">
                                {formatCurrency(pricing.profitAmount)}
                            </div>
                        </div>
                        <div>
                            <span className="font-medium text-muted-foreground">
                                Total Price:
                            </span>
                            <div className="font-medium text-xl text-primary">
                                {formatCurrency(pricing.totalPrice)}
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="font-medium text-muted-foreground">
                                Price per m²:
                            </span>
                            <div className="font-medium">
                                {formatCurrency(pricing.m2Price)}
                            </div>
                        </div>
                        <div>
                            <span className="font-medium text-muted-foreground">
                                Profit Percentage:
                            </span>
                            <div className="font-medium">
                                {pricing.profitPercentage.toFixed(2)}%
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        📊 Detailed Pricing Breakdown
                    </CardTitle>
                    <CardDescription>
                        Complete cost analysis for each item with all
                        calculations and components
                    </CardDescription>
                </CardHeader>
            </Card>

            {items.map((item, index) => {
                const pricing = calculateItemPricing(item);
                const isExpanded = expandedItems.has(item.id);
                const isCurtainWall = item.type === "curtain_wall";

                return (
                    <Card
                        key={item.id}
                        className="overflow-hidden"
                    >
                        <Collapsible
                            open={isExpanded}
                            onOpenChange={() => toggleExpanded(item.id)}
                        >
                            <CollapsibleTrigger asChild>
                                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">
                                                {getItemIcon(item.type)}
                                            </span>
                                            <div>
                                                <CardTitle className="text-lg">
                                                    {item.type === "window"
                                                        ? "Window"
                                                        : item.type === "door"
                                                        ? "Door"
                                                        : item.type ===
                                                          "sky_light"
                                                        ? "Sky Light"
                                                        : "Curtain Wall"}{" "}
                                                    {index + 1}
                                                </CardTitle>
                                                <CardDescription>
                                                    {item.system} • {item.width}
                                                    m × {item.height}m • Qty:{" "}
                                                    {item.quantity}
                                                    {isCurtainWall &&
                                                        item.designData && (
                                                            <span>
                                                                {" "}
                                                                •{" "}
                                                                {
                                                                    item
                                                                        .designData
                                                                        .wallWidth
                                                                }
                                                                m ×{" "}
                                                                {
                                                                    item
                                                                        .designData
                                                                        .wallHeight
                                                                }
                                                                m Wall
                                                            </span>
                                                        )}
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <div className="text-sm text-muted-foreground">
                                                    Total Price
                                                </div>
                                                <div className="text-lg font-bold text-primary">
                                                    {formatCurrency(
                                                        pricing.totalPrice
                                                    )}
                                                </div>
                                            </div>
                                            {isExpanded ? (
                                                <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                            ) : (
                                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <CardContent className="pt-0">
                                    {isCurtainWall
                                        ? renderCurtainWallBreakdown(
                                              item,
                                              pricing
                                          )
                                        : renderNormalItemBreakdown(
                                              item,
                                              pricing
                                          )}
                                </CardContent>
                            </CollapsibleContent>
                        </Collapsible>
                    </Card>
                );
            })}
        </div>
    );
}
