/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Trash2, Settings, Calculator, ChevronDown, ChevronRight } from "lucide-react";
import { QuoteItem } from "@/types/quote";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { CurtainWallDesigner } from "./curtain-wall-designer";
import ProfileManager, { AluminiumProfile } from "../profile/profile-manager";
import ColorManager from "../color/color-manager";
import { ColorOption } from "@/types/quote";
import { Database, X, Palette } from "lucide-react";
import { calculateItemPricing } from "@/lib/pricing-calculator";

interface QuoteItemEditorProps {
    item: QuoteItem;
    onUpdate: (item: QuoteItem) => void;
    onRemove: () => void;
    index: number;
}

export function QuoteItemEditor({
    item,
    onUpdate,
    onRemove,
    index,
}: QuoteItemEditorProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [showProfileManager, setShowProfileManager] = useState(false);
    const [showPricingDetails, setShowPricingDetails] = useState(false);
    const [showColorManager, setShowColorManager] = useState(false);

    const handleUpdate = (
        field: keyof QuoteItem,
        value:
            | string
            | number
            | boolean
            | undefined
            | AluminiumProfile
            | ColorOption
    ) => {
        onUpdate({
            ...item,
            [field]: value,
        });
    };

    const handleNestedUpdate = (
        parent: keyof QuoteItem,
        field: string,
        value: unknown
    ) => {
        const parentObj = item[parent] as Record<string, unknown>;
        onUpdate({
            ...item,
            [parent]: {
                ...parentObj,
                [field]: value,
            },
        });
    };

    const handleCurtainWallDesignChange = (design: {
        panels: Array<{
            type: "window" | "door" | "structure";
            widthMeters: number;
            heightMeters: number;
            left: number;
            top: number;
            col: number;
            row: number;
            mergedId?: string;
        }>;
        frameMeters: number;
        windowMeters: number;
        glassArea: number;
        cornerCount: number;
    }) => {
        // Update the entire designData object at once to ensure proper state updates
        onUpdate({
            ...item,
            designData: {
                wallWidth: item.designData?.wallWidth || 0,
                wallHeight: item.designData?.wallHeight || 0,
                panels: design.panels,
                frameMeters: design.frameMeters,
                windowMeters: design.windowMeters,
                glassArea: design.glassArea,
                cornerCount: design.cornerCount,
                visualSvg: item.designData?.visualSvg,
            },
        });
    };

    const handleProfileSelect = (profile: AluminiumProfile) => {
        handleUpdate("profile", profile);
        setShowProfileManager(false);
    };

    const handleColorSelect = (color: ColorOption) => {
        handleUpdate("color", color);
        setShowColorManager(false);
    };

    const getNormalizedSystemType = (system: string) => {
        const systemMap: Record<string, string> = {
            Sliding: "sliding",
            hinged: "hinged",
            fixed: "fixed",
            curtain_wall: "curtain wall", // Added Curtain Wall mapping
        };
        if (system === "Curtain Wall") system = "curtain_wall";
        console.log(systemMap[system]);
        return systemMap[system] || system.toLowerCase().replace(" ", "_");
    };

    const getItemIcon = () => {
        switch (item.type) {
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

    const getItemTitle = () => {
        const typeNames = {
            window: "Window",
            door: "Door",
            sky_light: "Sky Light",
            curtain_wall: "Curtain Wall",
        };
        return `${typeNames[item.type]} ${index + 1}`;
    };

    // Check if curtain wall is selected to disable system dropdown
    const isCurtainWall = item.type === "curtain_wall";

    // Update system to "Curtain Wall" when curtain wall type is selected
    useEffect(() => {
        if (isCurtainWall && item.system !== "Curtain Wall") {
            handleUpdate("system", "Curtain Wall");
        }
        if (!isCurtainWall && item.system === "Curtain Wall") {
            handleUpdate("system", "Sliding");
        }
    }, [isCurtainWall, item.system]);

    const renderPricingBreakdown = (item: QuoteItem) => {
        const pricing = calculateItemPricing(item);
        const formatCurrency = (amount: number) => `EGP ${amount.toLocaleString()}`;
        const isCurtainWall = item.type === 'curtain_wall';

        if (isCurtainWall) {
            return (
                <div className="space-y-4">
                    {/* Basic Information */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <span className="font-medium text-muted-foreground">Wall Dimensions:</span>
                            <div className="font-medium">{item.designData?.wallWidth}m × {item.designData?.wallHeight}m</div>
                        </div>
                        <div>
                            <span className="font-medium text-muted-foreground">Frame Meters:</span>
                            <div className="font-medium">{pricing.frameMeters?.toFixed(2)}m</div>
                        </div>
                        <div>
                            <span className="font-medium text-muted-foreground">Window Meters:</span>
                            <div className="font-medium">{pricing.windowMeters?.toFixed(2)}m</div>
                        </div>
                        <div>
                            <span className="font-medium text-muted-foreground">Glass Area:</span>
                            <div className="font-medium">{pricing.glassArea?.toFixed(2)}m²</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <span className="font-medium text-muted-foreground">Windows:</span>
                            <div className="font-medium">{pricing.numWindows}</div>
                        </div>
                        <div>
                            <span className="font-medium text-muted-foreground">Doors:</span>
                            <div className="font-medium">{pricing.numDoors}</div>
                        </div>
                        <div>
                            <span className="font-medium text-muted-foreground">Corners:</span>
                            <div className="font-medium">{pricing.cornerCount}</div>
                        </div>
                        <div>
                            <span className="font-medium text-muted-foreground">Total Area:</span>
                            <div className="font-medium">{pricing.totalArea?.toFixed(2)}m²</div>
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
                                    <TableHead className="text-right">Calculation</TableHead>
                                    <TableHead className="text-right">Unit Cost</TableHead>
                                    <TableHead className="text-right">Quantity</TableHead>
                                    <TableHead className="text-right">Total Cost</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow>
                                    <TableCell>Frame Cost</TableCell>
                                    <TableCell className="text-right text-sm text-muted-foreground">
                                        {pricing.frameMeters?.toFixed(2)}m × {formatCurrency(item.profile?.frame_price || 0)}/m
                                    </TableCell>
                                    <TableCell className="text-right">{formatCurrency(pricing.frameCost / item.quantity)}</TableCell>
                                    <TableCell className="text-right">{item.quantity}</TableCell>
                                    <TableCell className="text-right font-medium">{formatCurrency(pricing.frameCost)}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Windows Cost</TableCell>
                                    <TableCell className="text-right text-sm text-muted-foreground">
                                        {pricing.windowMeters?.toFixed(2)}m × {formatCurrency(item.profile?.leaf_price || 0)}/m
                                    </TableCell>
                                    <TableCell className="text-right">{formatCurrency((pricing.windowsCost || 0) / item.quantity)}</TableCell>
                                    <TableCell className="text-right">{item.quantity}</TableCell>
                                    <TableCell className="text-right font-medium">{formatCurrency(pricing.windowsCost || 0)}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Window/Door Accessories</TableCell>
                                    <TableCell className="text-right text-sm text-muted-foreground">
                                        {(pricing.numWindows || 0) + (pricing.numDoors || 0)} × {formatCurrency(item.profile?.accessories_2_leaves || 0)}
                                    </TableCell>
                                    <TableCell className="text-right">{formatCurrency((pricing.accessoriesWindowsDoors || 0) / item.quantity)}</TableCell>
                                    <TableCell className="text-right">{item.quantity}</TableCell>
                                    <TableCell className="text-right font-medium">{formatCurrency(pricing.accessoriesWindowsDoors || 0)}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Frame Accessories</TableCell>
                                    <TableCell className="text-right text-sm text-muted-foreground">
                                        {pricing.frameMeters?.toFixed(2)}m × {formatCurrency(item.profile?.accessories_3_leaves || 0)}/m
                                    </TableCell>
                                    <TableCell className="text-right">{formatCurrency((pricing.frameAccessories || 0) / item.quantity)}</TableCell>
                                    <TableCell className="text-right">{item.quantity}</TableCell>
                                    <TableCell className="text-right font-medium">{formatCurrency(pricing.frameAccessories || 0)}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Corner Accessories</TableCell>
                                    <TableCell className="text-right text-sm text-muted-foreground">
                                        {pricing.cornerCount || 0} × {formatCurrency(item.profile?.accessories_4_leaves || 0)}
                                    </TableCell>
                                    <TableCell className="text-right">{formatCurrency((pricing.cornersCost || 0) / item.quantity)}</TableCell>
                                    <TableCell className="text-right">{item.quantity}</TableCell>
                                    <TableCell className="text-right font-medium">{formatCurrency(pricing.cornersCost || 0)}</TableCell>
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
                                <span className="font-medium text-muted-foreground">Subtotal (Before Profit):</span>
                                <div className="font-medium text-lg">{formatCurrency(pricing.totalBeforeProfit)}</div>
                            </div>
                            <div>
                                <span className="font-medium text-muted-foreground">Profit Rate:</span>
                                <div className="font-medium text-lg">{(pricing.base_profit_rate * 100).toFixed(2)}%</div>
                            </div>
                            <div>
                                <span className="font-medium text-muted-foreground">Profit Amount:</span>
                                <div className="font-medium text-lg">{formatCurrency(pricing.profitAmount)}</div>
                            </div>
                            <div>
                                <span className="font-medium text-muted-foreground">Total Price:</span>
                                <div className="font-medium text-xl text-primary">{formatCurrency(pricing.totalPrice)}</div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="font-medium text-muted-foreground">Price per m²:</span>
                                <div className="font-medium">{formatCurrency(pricing.m2Price)}</div>
                            </div>
                            <div>
                                <span className="font-medium text-muted-foreground">Profit Percentage:</span>
                                <div className="font-medium">{pricing.profitPercentage.toFixed(2)}%</div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        } else {
            return (
                <div className="space-y-4">
                    {/* Basic Information */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <span className="font-medium text-muted-foreground">Dimensions:</span>
                            <div className="font-medium">{item.width}m × {item.height}m</div>
                        </div>
                        <div>
                            <span className="font-medium text-muted-foreground">Leaves:</span>
                            <div className="font-medium">{item.leaves}</div>
                        </div>
                        <div>
                            <span className="font-medium text-muted-foreground">Quantity:</span>
                            <div className="font-medium">{item.quantity}</div>
                        </div>
                        <div>
                            <span className="font-medium text-muted-foreground">Glass Type:</span>
                            <div className="font-medium">{item.glassType === 'double' ? 'Double Glazed' : 'Single Glazed'}</div>
                        </div>
                    </div>

                    <Separator />

                    {/* Calculations */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <span className="font-medium text-muted-foreground">Area (m²):</span>
                            <div className="font-medium">{(item.width * item.height).toFixed(2)}</div>
                        </div>
                        <div>
                            <span className="font-medium text-muted-foreground">Frame Length (m):</span>
                            <div className="font-medium">{pricing.frameLength.toFixed(2)}</div>
                        </div>
                        <div>
                            <span className="font-medium text-muted-foreground">Leaf Perimeter (m):</span>
                            <div className="font-medium">{pricing.leafPerimeter.toFixed(2)}</div>
                        </div>
                        <div>
                            <span className="font-medium text-muted-foreground">Total Leaf Length (m):</span>
                            <div className="font-medium">{pricing.totalLeafLength.toFixed(2)}</div>
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
                                    <TableHead className="text-right">Calculation</TableHead>
                                    <TableHead className="text-right">Unit Cost</TableHead>
                                    <TableHead className="text-right">Quantity</TableHead>
                                    <TableHead className="text-right">Total Cost</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow>
                                    <TableCell>Frame Cost</TableCell>
                                    <TableCell className="text-right text-sm text-muted-foreground">
                                        {pricing.frameLength.toFixed(2)}m × {formatCurrency(item.profile?.frame_price || 0)}/m
                                    </TableCell>
                                    <TableCell className="text-right">{formatCurrency(pricing.frameCost / item.quantity)}</TableCell>
                                    <TableCell className="text-right">{item.quantity}</TableCell>
                                    <TableCell className="text-right font-medium">{formatCurrency(pricing.frameCost)}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Leaf Cost</TableCell>
                                    <TableCell className="text-right text-sm text-muted-foreground">
                                        {pricing.totalLeafLength.toFixed(2)}m × {formatCurrency(item.profile?.leaf_price || 0)}/m
                                    </TableCell>
                                    <TableCell className="text-right">{formatCurrency(pricing.leafCost / item.quantity)}</TableCell>
                                    <TableCell className="text-right">{item.quantity}</TableCell>
                                    <TableCell className="text-right font-medium">{formatCurrency(pricing.leafCost)}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Glass Cost</TableCell>
                                    <TableCell className="text-right text-sm text-muted-foreground">
                                        {(item.width * item.height).toFixed(2)}m² × {formatCurrency(item.glassType === 'double' ? (item.profile?.glass_price_double || 0) : (item.profile?.glass_price_single || 0))}/m²
                                    </TableCell>
                                    <TableCell className="text-right">{formatCurrency(pricing.glassCost / item.quantity)}</TableCell>
                                    <TableCell className="text-right">{item.quantity}</TableCell>
                                    <TableCell className="text-right font-medium">{formatCurrency(pricing.glassCost)}</TableCell>
                                </TableRow>
                                {pricing.accessories > 0 && (
                                    <TableRow>
                                        <TableCell>Accessories</TableCell>
                                        <TableCell className="text-right text-sm text-muted-foreground">
                                            {item.leaves} leaves × {formatCurrency(
                                                item.leaves === 2 ? (item.profile?.accessories_2_leaves || 0) :
                                                item.leaves === 3 ? (item.profile?.accessories_3_leaves || 0) :
                                                item.leaves === 4 ? (item.profile?.accessories_4_leaves || 0) : 0
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">{formatCurrency(pricing.accessories / item.quantity)}</TableCell>
                                        <TableCell className="text-right">{item.quantity}</TableCell>
                                        <TableCell className="text-right font-medium">{formatCurrency(pricing.accessories)}</TableCell>
                                    </TableRow>
                                )}
                                {pricing.netCost > 0 && (
                                    <TableRow>
                                        <TableCell>Mosquito Net</TableCell>
                                        <TableCell className="text-right text-sm text-muted-foreground">
                                            {pricing.leafPerimeter.toFixed(2)}m × {formatCurrency(
                                                item.netType === 'fixed' ? (item.profile?.net_price || 0) :
                                                item.netType === 'plisse' ? (item.profile?.net_price_plisse || 0) :
                                                item.netType === 'panda' ? (item.profile?.net_price_panda || 0) : (item.profile?.net_price || 0)
                                            )}/m
                                        </TableCell>
                                        <TableCell className="text-right">{formatCurrency(pricing.netCost / item.quantity)}</TableCell>
                                        <TableCell className="text-right">{item.quantity}</TableCell>
                                        <TableCell className="text-right font-medium">{formatCurrency(pricing.netCost)}</TableCell>
                                    </TableRow>
                                )}
                                {pricing.archCost > 0 && (
                                    <TableRow>
                                        <TableCell>Architrave</TableCell>
                                        <TableCell className="text-right text-sm text-muted-foreground">
                                            {pricing.frameLength.toFixed(2)}m × {formatCurrency(item.profile?.arc_price || 0)}/m
                                        </TableCell>
                                        <TableCell className="text-right">{formatCurrency(pricing.archCost / item.quantity)}</TableCell>
                                        <TableCell className="text-right">{item.quantity}</TableCell>
                                        <TableCell className="text-right font-medium">{formatCurrency(pricing.archCost)}</TableCell>
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
                                <span className="font-medium text-muted-foreground">Subtotal (Before Profit):</span>
                                <div className="font-medium text-lg">{formatCurrency(pricing.totalBeforeProfit)}</div>
                            </div>
                            <div>
                                <span className="font-medium text-muted-foreground">Profit Rate:</span>
                                <div className="font-medium text-lg">{(pricing.base_profit_rate * 100).toFixed(2)}%</div>
                            </div>
                            <div>
                                <span className="font-medium text-muted-foreground">Profit Amount:</span>
                                <div className="font-medium text-lg">{formatCurrency(pricing.profitAmount)}</div>
                            </div>
                            <div>
                                <span className="font-medium text-muted-foreground">Total Price:</span>
                                <div className="font-medium text-xl text-primary">{formatCurrency(pricing.totalPrice)}</div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="font-medium text-muted-foreground">Price per m²:</span>
                                <div className="font-medium">{formatCurrency(pricing.m2Price)}</div>
                            </div>
                            <div>
                                <span className="font-medium text-muted-foreground">Profit Percentage:</span>
                                <div className="font-medium">{pricing.profitPercentage.toFixed(2)}%</div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
    };

    return (
        <>
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">{getItemIcon()}</span>
                            <div>
                                <CardTitle className="text-lg">
                                    {getItemTitle()}
                                </CardTitle>
                                <CardDescription>
                                    {item.system} • {item.width}m ×{" "}
                                    {item.height}m • Qty: {item.quantity}
                                </CardDescription>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsExpanded(!isExpanded)}
                            >
                                <Settings className="h-4 w-4 mr-2" />
                                {isExpanded ? "Hide" : "Show"} Details
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onRemove}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                <Collapsible
                    open={isExpanded}
                    onOpenChange={setIsExpanded}
                >
                    <CollapsibleContent>
                        <CardContent className="space-y-6">
                            {/* Basic Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor={`type-${item.id}`}>
                                        Type
                                    </Label>
                                    <Select
                                        value={item.type}
                                        onValueChange={(value) =>
                                            handleUpdate("type", value)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="window">
                                                Window
                                            </SelectItem>
                                            <SelectItem value="door">
                                                Door
                                            </SelectItem>
                                            <SelectItem value="sky_light">
                                                Sky Light
                                            </SelectItem>
                                            <SelectItem value="curtain_wall">
                                                Curtain Wall
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor={`system-${item.id}`}>
                                        System
                                    </Label>
                                    <Select
                                        value={item.system}
                                        onValueChange={(value) =>
                                            handleUpdate("system", value)
                                        }
                                        disabled={isCurtainWall}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select system" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Sliding">
                                                Sliding
                                            </SelectItem>
                                            <SelectItem value="hinged">
                                                Hinged
                                            </SelectItem>
                                            <SelectItem value="fixed">
                                                Fixed
                                            </SelectItem>
                                            <SelectItem
                                                value="Curtain Wall"
                                                className="hidden"
                                            >
                                                Curtain Wall
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor={`width-${item.id}`}>
                                        Width (m)
                                    </Label>
                                    <Input
                                        id={`width-${item.id}`}
                                        type="number"
                                        step="0.1"
                                        value={item.width}
                                        onChange={(e) =>
                                            handleUpdate(
                                                "width",
                                                parseFloat(e.target.value) || 0
                                            )
                                        }
                                        placeholder="Width"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor={`height-${item.id}`}>
                                        Height (m)
                                    </Label>
                                    <Input
                                        id={`height-${item.id}`}
                                        type="number"
                                        step="0.1"
                                        value={item.height}
                                        onChange={(e) =>
                                            handleUpdate(
                                                "height",
                                                parseFloat(e.target.value) || 0
                                            )
                                        }
                                        placeholder="Height"
                                    />
                                </div>
                            </div>

                            <Separator />

                            {/* Specifications */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor={`leaves-${item.id}`}>
                                        Leaves
                                    </Label>
                                    <Select
                                        value={item.leaves.toString()}
                                        onValueChange={(value) =>
                                            handleUpdate(
                                                "leaves",
                                                parseInt(value)
                                            )
                                        }
                                        disabled={isCurtainWall}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select leaves" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">
                                                1 Leaf
                                            </SelectItem>
                                            <SelectItem value="2">
                                                2 Leaves
                                            </SelectItem>
                                            <SelectItem value="3">
                                                3 Leaves
                                            </SelectItem>
                                            <SelectItem value="4">
                                                4 Leaves
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor={`quantity-${item.id}`}>
                                        Quantity
                                    </Label>
                                    <Input
                                        id={`quantity-${item.id}`}
                                        type="number"
                                        min="1"
                                        value={item.quantity}
                                        onChange={(e) =>
                                            handleUpdate(
                                                "quantity",
                                                parseInt(e.target.value) || 1
                                            )
                                        }
                                        placeholder="Quantity"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor={`glassType-${item.id}`}>
                                        Glass Type
                                    </Label>
                                    <Select
                                        value={item.glassType}
                                        onValueChange={(value) =>
                                            handleUpdate("glassType", value)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select glass type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="single">
                                                Single Glazed
                                            </SelectItem>
                                            <SelectItem value="double">
                                                Double Glazed
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {item.system === "hinged" &&
                                    item.leaves === 2 && (
                                        <div className="space-y-2">
                                            <Label
                                                htmlFor={`upperPanelType-${item.id}`}
                                            >
                                                Upper Panel
                                            </Label>
                                            <Select
                                                value={
                                                    item.upperPanelType ||
                                                    "hinged"
                                                }
                                                onValueChange={(value) =>
                                                    handleUpdate(
                                                        "upperPanelType",
                                                        value
                                                    )
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="hinged">
                                                        Hinged
                                                    </SelectItem>
                                                    <SelectItem value="fixed">
                                                        Fixed
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                            </div>

                            <Separator />

                            {/* Additional Features */}
                            <div className="space-y-4">
                                <Label className="text-sm font-medium">
                                    Additional Features
                                </Label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`mosquito-${item.id}`}
                                            checked={item.mosquito}
                                            onCheckedChange={(checked) =>
                                                handleUpdate(
                                                    "mosquito",
                                                    checked
                                                )
                                            }
                                        />
                                        <Label htmlFor={`mosquito-${item.id}`}>
                                            Mosquito Net
                                        </Label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`arch-${item.id}`}
                                            checked={item.arch}
                                            onCheckedChange={(checked) =>
                                                handleUpdate("arch", checked)
                                            }
                                        />
                                        <Label htmlFor={`arch-${item.id}`}>
                                            Arch Trave
                                        </Label>
                                    </div>
                                </div>

                                {item.mosquito && item.system === "hinged" && (
                                    <div className="space-y-2">
                                        <Label htmlFor={`netType-${item.id}`}>
                                            Net Type
                                        </Label>
                                        <Select
                                            value={item.netType || "fixed"}
                                            onValueChange={(value) =>
                                                handleUpdate("netType", value)
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="fixed">
                                                    Fixed
                                                </SelectItem>
                                                <SelectItem value="plisse">
                                                    Plisse
                                                </SelectItem>
                                                <SelectItem value="panda">
                                                    Panda
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>

                            {/* Curtain Wall Specific Settings */}
                            {isCurtainWall && (
                                <>
                                    <Separator />
                                    <div className="space-y-4">
                                        <Label className="text-sm font-medium">
                                            Curtain Wall Design
                                        </Label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label
                                                    htmlFor={`wallWidth-${item.id}`}
                                                >
                                                    Wall Width (m)
                                                </Label>
                                                <Input
                                                    id={`wallWidth-${item.id}`}
                                                    type="number"
                                                    step="0.1"
                                                    value={
                                                        item.designData
                                                            ?.wallWidth || 0
                                                    }
                                                    onChange={(e) =>
                                                        handleNestedUpdate(
                                                            "designData",
                                                            "wallWidth",
                                                            parseFloat(
                                                                e.target.value
                                                            ) || 0
                                                        )
                                                    }
                                                    placeholder="Wall Width"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label
                                                    htmlFor={`wallHeight-${item.id}`}
                                                >
                                                    Wall Height (m)
                                                </Label>
                                                <Input
                                                    id={`wallHeight-${item.id}`}
                                                    type="number"
                                                    step="0.1"
                                                    value={
                                                        item.designData
                                                            ?.wallHeight || 0
                                                    }
                                                    onChange={(e) =>
                                                        handleNestedUpdate(
                                                            "designData",
                                                            "wallHeight",
                                                            parseFloat(
                                                                e.target.value
                                                            ) || 0
                                                        )
                                                    }
                                                    placeholder="Wall Height"
                                                />
                                            </div>
                                        </div>

                                        {/* Curtain Wall Designer */}
                                        {(item.designData?.wallWidth || 0) >
                                            0 &&
                                            (item.designData?.wallHeight || 0) >
                                                0 && (
                                                <div className="mt-6">
                                                    <CurtainWallDesigner
                                                        wallWidth={
                                                            item.designData
                                                                ?.wallWidth || 0
                                                        }
                                                        wallHeight={
                                                            item.designData
                                                                ?.wallHeight ||
                                                            0
                                                        }
                                                        onDesignChange={(
                                                            design
                                                        ) =>
                                                            handleCurtainWallDesignChange(
                                                                {
                                                                    ...design,
                                                                    // Provide default values for missing fields to match expected type
                                                                    frameMeters:
                                                                        design.frameMeters ??
                                                                        0,
                                                                    windowMeters:
                                                                        design.windowMeters ??
                                                                        0,
                                                                    glassArea:
                                                                        design.glassArea ??
                                                                        0,
                                                                    cornerCount:
                                                                        design.cornerCount ??
                                                                        0,
                                                                    panels:
                                                                        design.panels ??
                                                                        [],
                                                                }
                                                            )
                                                        }
                                                    />
                                                </div>
                                            )}

                                        {/* Curtain Wall Results */}
                                        {item.designData && (
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                                <div className="text-center p-3 bg-red-50 rounded-lg">
                                                    <div className="text-lg font-bold text-red-600">
                                                        {item.designData?.frameMeters?.toFixed(2) || "0.00"}
                                                    </div>
                                                    <div className="text-sm text-gray-600">
                                                        Frame Meters
                                                    </div>
                                                </div>
                                                <div className="text-center p-3 bg-red-50 rounded-lg">
                                                    <div className="text-lg font-bold text-red-600">
                                                        {item.designData?.windowMeters?.toFixed(2) || "0.00"}
                                                    </div>
                                                    <div className="text-sm text-gray-600">
                                                        Window Meters
                                                    </div>
                                                </div>
                                                <div className="text-center p-3 bg-purple-50 rounded-lg">
                                                    <div className="text-lg font-bold text-purple-600">
                                                        {item.designData?.glassArea?.toFixed(2) || "0.00"} m²
                                                    </div>
                                                    <div className="text-sm text-gray-600">
                                                        Glass Area
                                                    </div>
                                                </div>
                                                <div className="text-center p-3 bg-orange-50 rounded-lg">
                                                    <div className="text-lg font-bold text-orange-600">
                                                        {item.designData?.cornerCount || 0}
                                                    </div>
                                                    <div className="text-sm text-gray-600">
                                                        Corners
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            {/* Profile Information */}
                            <Separator />
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium">
                                        Profile Information
                                    </Label>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            setShowProfileManager(true)
                                        }
                                        className="flex items-center gap-2"
                                    >
                                        <Database className="h-4 w-4" />
                                        Select Profile
                                    </Button>
                                </div>

                                {item.profile ? (
                                    <Card className="border-red-200 bg-red-50">
                                        <CardContent className="pt-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-semibold text-red-800">
                                                        {item.profile.name}
                                                    </h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge
                                                            variant="outline"
                                                            className="text-red-700"
                                                        >
                                                            {item.profile.brand}
                                                        </Badge>
                                                        <Badge
                                                            variant="secondary"
                                                            className="text-red-700"
                                                        >
                                                            {item.profile.code}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        handleUpdate(
                                                            "profile",
                                                            undefined
                                                        )
                                                    }
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                                                <div>
                                                    <span className="font-medium">
                                                        Frame Price:
                                                    </span>
                                                    <span className="text-red-600 ml-2">
                                                        EGP
                                                        {
                                                            item.profile
                                                                .frame_price
                                                        }
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="font-medium">
                                                        Leaf Price:
                                                    </span>
                                                    <span className="text-red-600 ml-2">
                                                        EGP
                                                        {
                                                            item.profile
                                                                .leaf_price
                                                        }
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="font-medium">
                                                        Glass (Double):
                                                    </span>
                                                    <span className="text-red-600 ml-2">
                                                        EGP{" "}
                                                        {
                                                            item.profile
                                                                .glass_price_double
                                                        }
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="font-medium">
                                                        Profit Rate:
                                                    </span>
                                                    <span className="text-orange-600 ml-2">
                                                        {item.profile
                                                            .base_profit_rate *
                                                            100}
                                                        %
                                                    </span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
                                        <Database className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                        <p className="text-gray-600">
                                            No profile selected
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            Click &quot;Select Profile&quot; to
                                            choose an aluminium profile
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Pricing Details */}
                            {item.profile && (
                                <>
                                    <Separator />
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-sm font-medium">
                                                Pricing Breakdown
                                            </Label>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setShowPricingDetails(!showPricingDetails)}
                                                className="flex items-center gap-2"
                                            >
                                                <Calculator className="h-4 w-4" />
                                                {showPricingDetails ? (
                                                    <>
                                                        <ChevronDown className="h-4 w-4" />
                                                        Hide Details
                                                    </>
                                                ) : (
                                                    <>
                                                        <ChevronRight className="h-4 w-4" />
                                                        Show Details
                                                    </>
                                                )}
                                            </Button>
                                        </div>

                                        {showPricingDetails && (
                                            <div className="mt-4">
                                                {renderPricingBreakdown(item)}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            {/* Color Information */}
                            <Separator />
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium">
                                        Color Information
                                    </Label>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            setShowColorManager(true)
                                        }
                                        className="flex items-center gap-2"
                                    >
                                        <Palette className="h-4 w-4" />
                                        Select Color
                                    </Button>
                                </div>

                                {item.color ? (
                                    <Card className="border-blue-200 bg-blue-50">
                                        <CardContent className="pt-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-semibold text-blue-800">
                                                        {item.color.code}
                                                    </h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge
                                                            variant="outline"
                                                            className="text-blue-700"
                                                        >
                                                            {item.color.brand}
                                                        </Badge>
                                                        <Badge
                                                            variant="secondary"
                                                            className="text-blue-700"
                                                        >
                                                            {item.color.color}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        handleUpdate(
                                                            "color",
                                                            undefined
                                                        )
                                                    }
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <div className="mt-3 text-sm">
                                                <span className="font-medium">
                                                    Finish:
                                                </span>{" "}
                                                <span className="text-blue-600 ml-2">
                                                    {item.color.finish}
                                                </span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
                                        <Palette className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                        <p className="text-gray-600">
                                            No color selected
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            Click "Select Color" to choose a
                                            color option
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Item Summary */}
                            <div className="bg-muted p-4 rounded-lg">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                        <span className="font-medium">
                                            Area:
                                        </span>{" "}
                                        {(
                                            item.width *
                                            item.height *
                                            item.quantity
                                        ).toFixed(2)}{" "}
                                        m²
                                    </div>
                                    <div>
                                        <span className="font-medium">
                                            System:
                                        </span>{" "}
                                        {item.system}
                                    </div>
                                    <div>
                                        <span className="font-medium">
                                            Leaves:
                                        </span>{" "}
                                        {item.leaves}
                                    </div>
                                    <div>
                                        <span className="font-medium">
                                            Features:
                                        </span>
                                        <div className="flex gap-1 mt-1">
                                            {item.glassType === "double" && (
                                                <Badge
                                                    variant="secondary"
                                                    className="text-xs"
                                                >
                                                    Double Glazed
                                                </Badge>
                                            )}
                                            {item.mosquito && (
                                                <Badge
                                                    variant="secondary"
                                                    className="text-xs"
                                                >
                                                    Net
                                                </Badge>
                                            )}
                                            {item.arch && (
                                                <Badge
                                                    variant="secondary"
                                                    className="text-xs"
                                                >
                                                    Arch
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </CollapsibleContent>
                </Collapsible>
            </Card>

            {/* Profile Manager Modal */}
            {showProfileManager && (
                <div className="fixed inset-0 bg-white border-gray-600 border bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-[1400px] w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">
                                Select Aluminium Profile
                            </h3>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowProfileManager(false)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <ProfileManager
                            onProfileSelect={handleProfileSelect}
                            selectedProfile={item.profile}
                            showSelection={true}
                            initialSystemTypeFilter={getNormalizedSystemType(
                                item.system
                            )}
                        />
                    </div>
                </div>
            )}

            {/* Color Manager Modal */}
            {showColorManager && (
                <div className="fixed inset-0 bg-white border-gray-600 border bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-[1400px] w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">
                                Select Color Option
                            </h3>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowColorManager(false)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <ColorManager
                            onColorSelect={handleColorSelect}
                            selectedColor={item.color}
                            showSelection={true}
                        />
                    </div>
                </div>
            )}
        </>
    );
}
