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
import { Trash2, Settings } from "lucide-react";
import { QuoteItem } from "@/types/quote";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { CurtainWallDesigner } from "./curtain-wall-designer";
import ProfileManager, { AluminiumProfile } from "../profile/profile-manager";
import { Database, X } from "lucide-react";

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

    const handleUpdate = (
        field: keyof QuoteItem,
        value: string | number | boolean | undefined | AluminiumProfile
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
        handleNestedUpdate("designData", "panels", design.panels);
        handleNestedUpdate("designData", "frameMeters", design.frameMeters);
        handleNestedUpdate("designData", "windowMeters", design.windowMeters);
        handleNestedUpdate("designData", "glassArea", design.glassArea);
        handleNestedUpdate("designData", "cornerCount", design.cornerCount);
    };

    const handleProfileSelect = (profile: AluminiumProfile) => {
        handleUpdate("profile", profile);
        setShowProfileManager(false);
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
                                                        onDesignChange={
                                                            handleCurtainWallDesignChange
                                                        }
                                                    />
                                                </div>
                                            )}

                                        {/* Curtain Wall Results */}
                                        {item.designData && (
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                                <div className="text-center p-3 bg-blue-50 rounded-lg">
                                                    <div className="text-lg font-bold text-blue-600">
                                                        {item.designData.frameMeters?.toFixed(
                                                            2
                                                        ) || "0.00"}
                                                    </div>
                                                    <div className="text-sm text-gray-600">
                                                        Frame Meters
                                                    </div>
                                                </div>
                                                <div className="text-center p-3 bg-green-50 rounded-lg">
                                                    <div className="text-lg font-bold text-green-600">
                                                        {item.designData.windowMeters?.toFixed(
                                                            2
                                                        ) || "0.00"}
                                                    </div>
                                                    <div className="text-sm text-gray-600">
                                                        Window Meters
                                                    </div>
                                                </div>
                                                <div className="text-center p-3 bg-purple-50 rounded-lg">
                                                    <div className="text-lg font-bold text-purple-600">
                                                        {item.designData.glassArea?.toFixed(
                                                            2
                                                        ) || "0.00"}{" "}
                                                        m²
                                                    </div>
                                                    <div className="text-sm text-gray-600">
                                                        Glass Area
                                                    </div>
                                                </div>
                                                <div className="text-center p-3 bg-orange-50 rounded-lg">
                                                    <div className="text-lg font-bold text-orange-600">
                                                        {item.designData
                                                            .cornerCount || 0}
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
                                    <Card className="border-green-200 bg-green-50">
                                        <CardContent className="pt-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-semibold text-green-800">
                                                        {item.profile.name}
                                                    </h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge
                                                            variant="outline"
                                                            className="text-green-700"
                                                        >
                                                            {item.profile.brand}
                                                        </Badge>
                                                        <Badge
                                                            variant="secondary"
                                                            className="text-green-700"
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
                                                    <span className="text-green-600 ml-2">
                                                        $
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
                                                    <span className="text-green-600 ml-2">
                                                        $
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
                                                    <span className="text-blue-600 ml-2">
                                                        ${item.profile.kg_price}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="font-medium">
                                                        Profit Rate:
                                                    </span>
                                                    <span className="text-orange-600 ml-2">
                                                        {
                                                            item.profile
                                                                .base_profit_rate
                                                        }
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
        </>
    );
}
