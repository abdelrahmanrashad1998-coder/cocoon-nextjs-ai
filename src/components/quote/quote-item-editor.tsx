"use client";

import { useState, useCallback } from "react";
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
import {
    Trash2,
    Settings,
    Calculator,
    ChevronDown,
    ChevronRight,
} from "lucide-react";
import { QuoteItem } from "@/types/quote";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { CurtainWallDesigner } from "./curtain-wall-designer";
import ProfileManager, { AluminiumProfile } from "../profile/profile-manager";
import ColorManager from "../color/color-manager";
import { ColorOption } from "@/types/quote";
import { Database, X, Palette } from "lucide-react";
import { calculateItemPricing } from "@/lib/pricing-calculator";
import { CurtainPanel } from "@/types/types";

interface QuoteItemEditorProps {
    item: QuoteItem;
    onUpdate: (item: QuoteItem) => void;
    onRemove: () => void;
    index: number;
    globalColor?: ColorOption;
    onUpdateGlobalColor?: (color: ColorOption) => void;
}

export function QuoteItemEditor({
    item,
    onUpdate,
    onRemove,
    index,
    globalColor,
    onUpdateGlobalColor,
}: QuoteItemEditorProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [showProfileManager, setShowProfileManager] = useState(false);
    const [showPricingDetails, setShowPricingDetails] = useState(false);
    const [showColorManager, setShowColorManager] = useState(false);
    const [svgContent, setSvgContent] = useState<string>("");

    const isCurtainWall = item.type === "curtain_wall" || item.type === "sky_light";

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

    const handleCurtainWallDesignChange = useCallback(
        (design: {
            panels: CurtainPanel[];
            //Array<{
            //    type: "window" | "door" | "structure";
            //    widthMeters: number;
            //    heightMeters: number;
            //    left: number;
            //    top: number;
            //    col: number;
            //    row: number;
            //    colSpan: number;
            //    rowSpan: number;
            //    mergedId?: string;
            //    isSpanned?: boolean;
            //}>;
            frameMeters: number;
            windowMeters: number;
            glassArea: number;
            cornerCount: number;
            totalCost?: number;
            materialBreakdown?: Record<string, number>;
            columns: number;
            rows: number;
            columnSizes: number[];
            rowSizes: number[];
        }) => {
            // Update the entire designData object at once to ensure proper state updates
            onUpdate({
                ...item,
                designData: {
                    wallWidth: item.width || 0,
                    wallHeight: item.height || 0,
                    panels: design.panels,
                    frameMeters: design.frameMeters,
                    windowMeters: design.windowMeters,
                    glassArea: design.glassArea,
                    cornerCount: design.cornerCount,
                    totalCost: design.totalCost,
                    materialBreakdown: design.materialBreakdown,
                    columns: design.columns,
                    rows: design.rows,
                    columnSizes: design.columnSizes,
                    rowSizes: design.rowSizes,
                    visualSvg: item.designData?.visualSvg,
                },
            });
        },
        [item, onUpdate]
    );

    const handleProfileSelect = (profile: AluminiumProfile) => {
        handleUpdate("profile", profile);
        setShowProfileManager(false);
    };

    const handleColorSelect = (color: ColorOption) => {
        // If no global color is set, set the global color
        // Otherwise, set the item-specific color
        if (!globalColor && onUpdateGlobalColor) {
            onUpdateGlobalColor(color);
        } else {
            handleUpdate("color", color);
        }
        setShowColorManager(false);
    };

    const getNormalizedSystemType = (system: string) => {
        const systemMap: Record<string, string> = {
            Sliding: "sliding",
            hinged: "hinged",
            fixed: "fixed",
            "Tilt and Turn": "tilt_and_turn",
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

    // Handle type change with automatic system update
    const handleTypeChange = (
        newType: "window" | "door" | "sky_light" | "curtain_wall"
    ) => {
        const newSystem =
            newType === "curtain_wall" || newType === "sky_light" ? "Curtain Wall" : "Sliding";
        onUpdate({
            ...item,
            type: newType,
            system: newSystem,
        });
    };

    const generateItemSvg = () => {
        let svgContent = "";

        if (item.type === "curtain_wall" || item.type === "sky_light") {
            // For curtain wall, use the existing logic from ItemSvgGenerator
            if (item.designData?.panels) {
                const { panels } = item.designData;
                const wallWidth = item.width || 0;
                const wallHeight = item.height || 0;
                const scale = Math.min(300 / wallWidth, 200 / wallHeight) * 0.9;
                const scaledWallWidth = wallWidth * scale;
                const scaledWallHeight = wallHeight * scale;
                const offsetX = (300 - scaledWallWidth) / 2;
                const offsetY = (200 - scaledWallHeight) / 2;

                let svgElements = "";
                svgElements += `<rect x="${offsetX}" y="${offsetY}" width="${scaledWallWidth}" height="${scaledWallHeight}" fill="none" stroke="#374151" stroke-width="2"/>`;

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
                        if (
                            item.designData?.columnSizes &&
                            item.designData.columnSizes.length > 0
                        ) {
                            for (
                                let i = 0;
                                i < item.designData.columnSizes.length;
                                i++
                            ) {
                                cumulativeColumnPositions.push(
                                    cumulativeColumnPositions[i] +
                                        item.designData.columnSizes[i]
                                );
                            }
                        } else {
                            const uniformColumnWidth =
                                wallWidth / (item.designData?.columns || 4);
                            for (
                                let i = 0;
                                i <= (item.designData?.columns || 4);
                                i++
                            ) {
                                cumulativeColumnPositions.push(
                                    i * uniformColumnWidth
                                );
                            }
                        }

                        if (
                            item.designData?.rowSizes &&
                            item.designData.rowSizes.length > 0
                        ) {
                            for (
                                let i = 0;
                                i < item.designData.rowSizes.length;
                                i++
                            ) {
                                cumulativeRowPositions.push(
                                    cumulativeRowPositions[i] +
                                        item.designData.rowSizes[i]
                                );
                            }
                        } else {
                            const uniformRowHeight =
                                wallHeight / (item.designData?.rows || 3);
                            for (
                                let i = 0;
                                i <= (item.designData?.rows || 3);
                                i++
                            ) {
                                cumulativeRowPositions.push(
                                    i * uniformRowHeight
                                );
                            }
                        }

                        const col = Math.min(
                            panel.col,
                            cumulativeColumnPositions.length - 1
                        );
                        const row = Math.min(
                            panel.row,
                            cumulativeRowPositions.length - 1
                        );
                        const colSpan = panel.colSpan || 1;
                        const rowSpan = panel.rowSpan || 1;

                        // Calculate position based on cumulative positions
                        const leftMeters = cumulativeColumnPositions[col];
                        const topMeters = cumulativeRowPositions[row];
                        const rightMeters =
                            cumulativeColumnPositions[
                                Math.min(
                                    col + colSpan,
                                    cumulativeColumnPositions.length - 1
                                )
                            ];
                        const bottomMeters =
                            cumulativeRowPositions[
                                Math.min(
                                    row + rowSpan,
                                    cumulativeRowPositions.length - 1
                                )
                            ];

                        // Convert to SVG coordinates
                        panelX =
                            offsetX +
                            (leftMeters / totalWidth) * scaledWallWidth;
                        panelY =
                            offsetY +
                            (topMeters / totalHeight) * scaledWallHeight;
                        panelWidth =
                            ((rightMeters - leftMeters) / totalWidth) *
                            scaledWallWidth;
                        panelHeight =
                            ((bottomMeters - topMeters) / totalHeight) *
                            scaledWallHeight;
                    } else if (
                        panel.left !== undefined &&
                        panel.top !== undefined &&
                        panel.width !== undefined &&
                        panel.height !== undefined
                    ) {
                        // Fallback to percentage-based positioning
                        panelX = offsetX + (panel.left / 100) * scaledWallWidth;
                        panelY = offsetY + (panel.top / 100) * scaledWallHeight;
                        panelWidth = (panel.width / 100) * scaledWallWidth;
                        panelHeight = (panel.height / 100) * scaledWallHeight;
                    } else {
                        // Final fallback to meter-based positioning
                        panelWidth =
                            (panel.widthMeters / wallWidth) * scaledWallWidth;
                        panelHeight =
                            (panel.heightMeters / wallHeight) *
                            scaledWallHeight;
                        panelX = offsetX + (panel.left / 100) * scaledWallWidth;
                        panelY = offsetY + (panel.top / 100) * scaledWallHeight;
                    }

                    // All panels use the same blue color as hinged panels
                    const fillColor = "#87CEEB";
                    const strokeColor = "#666";

                    svgElements += `<rect x="${panelX}" y="${panelY}" width="${panelWidth}" height="${panelHeight}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="1" opacity="0.7"/>`;

                    // Add V shape for window panels, labels for fixed and door panels
                    if (panel.type === "window") {
                        // Add V shape for window panels
                        const panelCenterX = panelX + panelWidth / 2;
                        const panelCenterY = panelY + panelHeight / 2;
                        const vSize = Math.min(panelWidth, panelHeight) * 0.6;

                        svgElements += `<path d="M ${
                            panelCenterX - vSize / 2
                        } ${panelCenterY - vSize / 2} 
                              L ${panelCenterX} ${panelCenterY + vSize / 2} 
                              L ${panelCenterX + vSize / 2} ${
                            panelCenterY - vSize / 2
                        }" 
                              stroke="#FFD700" stroke-width="2" fill="none"/>`;
                    } else if (
                        panel.type === "door" ||
                        panel.type === "structure"
                    ) {
                        // Add labels for door and fixed panels
                        const label =
                            panel.type === "structure" ? "Fixed" : "Door";
                        svgElements += `<text x="${
                            panelX + panelWidth / 2
                        }" y="${
                            panelY + panelHeight / 2
                        }" text-anchor="middle" dominant-baseline="middle" font-size="8" fill="#333" font-weight="bold">${label}</text>`;
                    }
                });

                svgElements += `<text x="${offsetX + scaledWallWidth / 2}" y="${
                    offsetY - 5
                }" text-anchor="middle" font-size="10" fill="#666">${wallWidth}m</text>`;
                svgElements += `<text x="${offsetX - 5}" y="${
                    offsetY + scaledWallHeight / 2
                }" text-anchor="middle" dominant-baseline="middle" font-size="10" fill="#666" transform="rotate(-90, ${
                    offsetX - 5
                }, ${offsetY + scaledWallHeight / 2})">${wallHeight}m</text>`;

                svgContent = `<svg width="300" height="200" viewBox="0 0 300 200">${svgElements}</svg>`;
            } else if (item.type === "sky_light") {
                // For sky_light without designData, create a simple rectangular representation
                const skyLightWidth = item.width || 1;
                const skyLightHeight = item.height || 1;
                const scale = Math.min(300 / skyLightWidth, 200 / skyLightHeight) * 0.8;
                const scaledWidth = skyLightWidth * scale;
                const scaledHeight = skyLightHeight * scale;
                const offsetX = (300 - scaledWidth) / 2;
                const offsetY = (200 - scaledHeight) / 2;

                let svgElements = "";
                // Draw sky light frame
                svgElements += `<rect x="${offsetX}" y="${offsetY}" width="${scaledWidth}" height="${scaledHeight}" fill="none" stroke="#374151" stroke-width="3"/>`;
                // Draw glass area
                const glassInset = 8;
                svgElements += `<rect x="${offsetX + glassInset}" y="${offsetY + glassInset}" width="${scaledWidth - glassInset * 2}" height="${scaledHeight - glassInset * 2}" fill="#87CEEB" stroke="#666" stroke-width="1" opacity="0.7"/>`;
                // Add "Sky Light" label
                svgElements += `<text x="${offsetX + scaledWidth / 2}" y="${offsetY + scaledHeight / 2}" text-anchor="middle" dominant-baseline="middle" font-size="12" fill="#374151" font-weight="bold">Sky Light</text>`;
                // Add dimensions
                svgElements += `<text x="${offsetX + scaledWidth / 2}" y="${offsetY - 5}" text-anchor="middle" font-size="10" fill="#666">${skyLightWidth}m</text>`;
                svgElements += `<text x="${offsetX - 5}" y="${offsetY + scaledHeight / 2}" text-anchor="middle" dominant-baseline="middle" font-size="10" fill="#666" transform="rotate(-90, ${offsetX - 5}, ${offsetY + scaledHeight / 2})">${skyLightHeight}m</text>`;

                svgContent = `<svg width="300" height="200" viewBox="0 0 300 200">${svgElements}</svg>`;
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
            const scale = Math.min(300 / itemWidth, 200 / itemHeight) * 0.8;
            const scaledWidth = itemWidth * scale;
            const scaledHeight = itemHeight * scale;
            const offsetX = (300 - scaledWidth) / 2;
            const offsetY = (200 - scaledHeight) / 2;

            let svgElements = "";
            const glassInset = 8;

            // Draw main frame and glass panel (skip for hinged items as they have individual sash panels)
            if (system !== "hinged") {
                svgElements += `<rect x="${offsetX}" y="${offsetY}" width="${scaledWidth}" height="${scaledHeight}" fill="none" stroke="#374151" stroke-width="2" rx="4"/>`;
                svgElements += `<rect x="${offsetX + glassInset}" y="${
                    offsetY + glassInset
                }" width="${scaledWidth - glassInset * 2}" height="${
                    scaledHeight - glassInset * 2
                }" fill="#87CEEB" stroke="#666" stroke-width="1" opacity="0.7"/>`;
            }

            if (system === "Sliding") {
                const panelWidth = (scaledWidth - glassInset * 2) / leaves;
                for (let i = 0; i < leaves; i++) {
                    const panelX = offsetX + glassInset + i * panelWidth;
                    if (i > 0) {
                        svgElements += `<line x1="${panelX}" y1="${
                            offsetY + glassInset
                        }" x2="${panelX}" y2="${
                            offsetY + scaledHeight - glassInset
                        }" stroke="#666" stroke-width="1"/>`;
                    }
                    const handleY = offsetY + scaledHeight / 2;
                    const handleSize = 8;
                    if (i === 0 || i === leaves - 1) {
                        const cx = panelX + panelWidth / 2;
                        const cy = handleY;
                        if (i === 0) {
                            // Right arrow for left panel
                            svgElements += `<line x1="${
                                cx - handleSize
                            }" y1="${cy}" x2="${cx}" y2="${cy}" stroke="#666" stroke-width="2"/><polygon points="${cx},${
                                cy - handleSize / 2
                            } ${cx + handleSize},${cy} ${cx},${
                                cy + handleSize / 2
                            }" fill="#666"/>`;
                        } else {
                            // Left arrow for right panel
                            svgElements += `<line x1="${cx}" y1="${cy}" x2="${
                                cx + handleSize
                            }" y2="${cy}" stroke="#666" stroke-width="2"/><polygon points="${cx},${
                                cy - handleSize / 2
                            } ${cx - handleSize},${cy} ${cx},${
                                cy + handleSize / 2
                            }" fill="#666"/>`;
                        }
                    }
                }
            } else if (system === "hinged") {
                // Draw individual sash panels for hinged items - stacked vertically
                const sashHeight = scaledHeight / leaves;
                const sashInset = 4; // Inset for each sash panel

                for (let i = 0; i < leaves; i++) {
                    const sashY = offsetY + i * sashHeight;
                    const sashPanelHeight = sashHeight - sashInset;

                    // Check if this is the top panel and should be fixed
                    const isTopPanel = i === 0;
                    const isFixedUpperPanel =
                        isTopPanel &&
                        leaves === 2 &&
                        type === "window" &&
                        item.upperPanelType === "fixed";

                    // Draw individual sash panel
                    svgElements += `<rect x="${offsetX + sashInset / 2}" y="${
                        sashY + sashInset / 2
                    }" 
                          width="${
                              scaledWidth - sashInset
                          }" height="${sashPanelHeight}"
                          fill="none" stroke="#666" stroke-width="1.5" rx="2"/>`;

                    // Draw glass panel within each sash
                    const glassInsetSash = 6;
                    svgElements += `<rect x="${
                        offsetX + sashInset / 2 + glassInsetSash
                    }" y="${sashY + sashInset / 2 + glassInsetSash}"
                          width="${
                              scaledWidth - sashInset - glassInsetSash * 2
                          }" height="${sashPanelHeight - glassInsetSash * 2}"
                          fill="#87CEEB" stroke="#666" stroke-width="1" opacity="0.7"/>`;

                    // Draw hinges only for hinged panels (not for fixed upper panel)
                    if (!isFixedUpperPanel) {
                        const hingeY = sashY + sashHeight / 2;
                        svgElements += `<circle cx="${offsetX}" cy="${hingeY}" r="3" fill="#666"/><circle cx="${
                            offsetX + scaledWidth
                        }" cy="${hingeY}" r="3" fill="#666"/>`;
                    }

                    // Add V shape for hinged panels or "Fixed" label for fixed upper panel
                    if (type === "door" || type === "window") {
                        const glassX = offsetX + sashInset / 2 + glassInsetSash;
                        const glassY = sashY + sashInset / 2 + glassInsetSash;
                        const glassWidth =
                            scaledWidth - sashInset - glassInsetSash * 2;
                        const glassHeight =
                            sashPanelHeight - glassInsetSash * 2;

                        if (isFixedUpperPanel) {
                            // Add "Fixed" label for fixed upper panel
                            const glassCenterX = glassX + glassWidth / 2;
                            const glassCenterY = glassY + glassHeight / 2;
                            svgElements += `<text x="${glassCenterX}" y="${glassCenterY}"
                                  text-anchor="middle" dominant-baseline="middle" font-size="8" fill="#333" font-weight="bold">Fixed</text>`;
                        } else {
                            // Add V shape for hinged panels
                            const glassCenterX = glassX + glassWidth / 2;
                            const glassCenterY = glassY + glassHeight / 2;
                            const vSize =
                                Math.min(glassWidth, glassHeight) * 0.9;

                            // Draw inverted V shape (from top corners to bottom middle) within glass bounds
                            svgElements += `<path d="M ${
                                glassCenterX - vSize / 2
                            } ${glassCenterY - vSize / 2} 
                                  L ${glassCenterX} ${glassCenterY + vSize / 2} 
                                  L ${glassCenterX + vSize / 2} ${
                                glassCenterY - vSize / 2
                            }" 
                                  stroke="#FFD700" stroke-width="3" fill="none"/>`;
                        }
                    }
                }
            } else if (system === "Tilt and Turn") {
                // Draw tilt and turn system - similar to hinged but with special handles
                const sashHeight = scaledHeight / leaves;
                const sashInset = 4;

                for (let i = 0; i < leaves; i++) {
                    const sashY = offsetY + i * sashHeight;
                    const sashPanelHeight = sashHeight - sashInset;

                    // Draw sash panel
                    svgElements += `<rect x="${offsetX + sashInset / 2}" y="${sashY + sashInset / 2}" width="${scaledWidth - sashInset}" height="${sashPanelHeight}" fill="none" stroke="#666" stroke-width="2" rx="2"/>`;

                    // Draw glass area
                    const glassInsetSash = 8;
                    svgElements += `<rect x="${offsetX + sashInset / 2 + glassInsetSash}" y="${sashY + sashInset / 2 + glassInsetSash}" width="${scaledWidth - sashInset - glassInsetSash * 2}" height="${sashPanelHeight - glassInsetSash * 2}" fill="#87CEEB" stroke="#666" stroke-width="1" opacity="0.7"/>`;

                    // Draw tilt and turn handles (special handles)
                    const handleY = sashY + sashPanelHeight / 2;
                    const handleSize = 6;
                    const leftHandleX = offsetX + scaledWidth * 0.2;
                    const rightHandleX = offsetX + scaledWidth * 0.8;

                    // Tilt handle (left side) - horizontal line
                    svgElements += `<line x1="${leftHandleX - handleSize}" y1="${handleY}" x2="${leftHandleX + handleSize}" y2="${handleY}" stroke="#FF6B35" stroke-width="3"/>`;
                    
                    // Turn handle (right side) - vertical line
                    svgElements += `<line x1="${rightHandleX}" y1="${handleY - handleSize}" x2="${rightHandleX}" y2="${handleY + handleSize}" stroke="#FF6B35" stroke-width="3"/>`;

                    // Draw hinges
                    const hingeY = sashY + sashHeight / 2;
                    svgElements += `<circle cx="${offsetX}" cy="${hingeY}" r="3" fill="#666"/><circle cx="${offsetX + scaledWidth}" cy="${hingeY}" r="3" fill="#666"/>`;
                }
            } else if (system === "fixed") {
                svgElements += `<text x="${offsetX + scaledWidth / 2}" y="${
                    offsetY + scaledHeight / 2
                }" text-anchor="middle" dominant-baseline="middle" font-size="12" fill="#666">Fixed</text>`;
            }

            svgElements += `<text x="${offsetX + scaledWidth / 2}" y="${
                offsetY - 5
            }" text-anchor="middle" font-size="10" fill="#666">${itemWidth}m</text>`;
            svgElements += `<text x="${offsetX - 5}" y="${
                offsetY + scaledHeight / 2
            }" text-anchor="middle" dominant-baseline="middle" font-size="10" fill="#666" transform="rotate(-90, ${
                offsetX - 5
            }, ${offsetY + scaledHeight / 2})">${itemHeight}m</text>`;

            svgContent = `<svg width="300" height="200" viewBox="0 0 300 200">${svgElements}</svg>`;
        }

        setSvgContent(svgContent);
    };

    const renderPricingBreakdown = (item: QuoteItem) => {
        const pricing = calculateItemPricing(item);
        const formatCurrency = (amount: number) =>
            `EGP ${amount.toLocaleString()}`;
        const isCurtainWall = item.type === "curtain_wall" || item.type === "sky_light";

        if (isCurtainWall) {
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
                                Sach Meters:
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
                            <div className="font-medium">
                                {pricing.numWindows}
                            </div>
                        </div>
                        <div>
                            <span className="font-medium text-muted-foreground">
                                Doors:
                            </span>
                            <div className="font-medium">
                                {pricing.numDoors}
                            </div>
                        </div>
                        <div>
                            <span className="font-medium text-muted-foreground">
                                Corners:
                            </span>
                            <div className="font-medium">
                                {pricing.cornerCount}
                            </div>
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
                        <h4 className="font-semibold text-lg">
                            Cost Breakdown
                        </h4>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Component</TableHead>
                                    <TableHead className="text-right">
                                        Calculation
                                    </TableHead>
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
                                    <TableCell className="text-right text-sm text-muted-foreground">
                                        {pricing.frameMeters?.toFixed(2)}m ×{" "}
                                        {formatCurrency(
                                            item.profile?.frame_price || 0
                                        )}
                                        /m
                                    </TableCell>
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
                                    <TableCell>Glass Cost</TableCell>
                                    <TableCell className="text-right text-sm text-muted-foreground">
                                        {pricing.glassArea?.toFixed(2)}m² ×{" "}
                                        {formatCurrency(
                                            item.glassType === "single"
                                                ? item.profile
                                                      ?.glass_price_single || 0
                                                : item.glassType === "double"
                                                ? item.profile
                                                      ?.glass_price_double || 0
                                                : item.glassType === "triple"
                                                ? item.profile
                                                      ?.glass_price_triple || 0
                                                : item.glassType === "laminated"
                                                ? item.profile
                                                      ?.glass_price_laminated ||
                                                  0
                                                : item.profile
                                                      ?.glass_price_single || 0
                                        )}
                                        /m²
                                    </TableCell>
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
                                <TableRow>
                                    <TableCell>Sach Cost</TableCell>
                                    <TableCell className="text-right text-sm text-muted-foreground">
                                        {pricing.windowMeters?.toFixed(2)}m ×{" "}
                                        {formatCurrency(
                                            item.profile?.sach_price ||
                                                (
                                                    item.profile as {
                                                        leaf_price?: number;
                                                    }
                                                )?.leaf_price ||
                                                0
                                        )}
                                        /m
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(
                                            (pricing.windowsCost || 0) /
                                                item.quantity
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {item.quantity}
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        {formatCurrency(
                                            pricing.windowsCost || 0
                                        )}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>
                                        Window/Door Accessories
                                    </TableCell>
                                    <TableCell className="text-right text-sm text-muted-foreground">
                                        {(pricing.numWindows || 0) +
                                            (pricing.numDoors || 0)}{" "}
                                        ×{" "}
                                        {formatCurrency(
                                            item.profile
                                                ?.accessories_2_leaves || 0
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(
                                            (pricing.accessoriesWindowsDoors ||
                                                0) / item.quantity
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {item.quantity}
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        {formatCurrency(
                                            pricing.accessoriesWindowsDoors || 0
                                        )}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Frame Accessories</TableCell>
                                    <TableCell className="text-right text-sm text-muted-foreground">
                                        {pricing.frameMeters?.toFixed(2)}m ×{" "}
                                        {formatCurrency(
                                            item.profile
                                                ?.accessories_3_leaves || 0
                                        )}
                                        /m
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(
                                            (pricing.frameAccessories || 0) /
                                                item.quantity
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {item.quantity}
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        {formatCurrency(
                                            pricing.frameAccessories || 0
                                        )}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Corner Accessories</TableCell>
                                    <TableCell className="text-right text-sm text-muted-foreground">
                                        {pricing.cornerCount || 0} ×{" "}
                                        {formatCurrency(
                                            item.profile
                                                ?.accessories_4_leaves || 0
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(
                                            (pricing.cornersCost || 0) /
                                                item.quantity
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {item.quantity}
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        {formatCurrency(
                                            pricing.cornersCost || 0
                                        )}
                                    </TableCell>
                                </TableRow>
                                {pricing.additionalCostTotal > 0 && (
                                    <TableRow>
                                        <TableCell>Additional Cost</TableCell>
                                        <TableCell className="text-right text-sm text-muted-foreground">
                                            Per item
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {formatCurrency(
                                                pricing.additionalCostTotal /
                                                    item.quantity
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {item.quantity}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {formatCurrency(
                                                pricing.additionalCostTotal
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )}
                                {item.arch && (
                                    <TableRow>
                                        <TableCell>Arch Trave</TableCell>
                                        <TableCell className="text-right text-sm text-muted-foreground">
                                            1 × 500
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {"EGP "}
                                            {500}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {item.quantity}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {"EGP "}
                                            {500}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <Separator />

                    {/* Profit and Totals */}
                    <div className="space-y-3">
                        <h4 className="font-semibold text-lg">
                            Profit & Totals
                        </h4>
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
                                    {(pricing.base_profit_rate * 100).toFixed(
                                        2
                                    )}
                                    %
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
        } else {
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
                                Sach:
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
                                {item.glassType.toUpperCase()}
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
                                Sach Perimeter (m):
                            </span>
                            <div className="font-medium">
                                {pricing.sachPerimeter.toFixed(2)}
                            </div>
                        </div>
                        <div>
                            <span className="font-medium text-muted-foreground">
                                Total Sach Length (m):
                            </span>
                            <div className="font-medium">
                                {pricing.totalSachLength.toFixed(2)}
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Cost Breakdown */}
                    <div className="space-y-3">
                        <h4 className="font-semibold text-lg">
                            Cost Breakdown
                        </h4>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Component</TableHead>
                                    <TableHead className="text-right">
                                        Calculation
                                    </TableHead>
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
                                    <TableCell className="text-right text-sm text-muted-foreground">
                                        {pricing.frameLength.toFixed(2)}m ×{" "}
                                        {formatCurrency(
                                            item.profile?.frame_price || 0
                                        )}
                                        /m
                                    </TableCell>
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
                                    <TableCell>Sach Cost</TableCell>
                                    <TableCell className="text-right text-sm text-muted-foreground">
                                        {pricing.totalSachLength.toFixed(2)}m ×{" "}
                                        {formatCurrency(
                                            item.profile?.sach_price ||
                                                (
                                                    item.profile as {
                                                        leaf_price?: number;
                                                    }
                                                )?.leaf_price ||
                                                0
                                        )}
                                        /m
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(
                                            pricing.sachCost / item.quantity
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {item.quantity}
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        {formatCurrency(pricing.sachCost)}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Glass Cost</TableCell>
                                    <TableCell className="text-right text-sm text-muted-foreground">
                                        {(item.width * item.height).toFixed(2)}
                                        m² ×{" "}
                                        {formatCurrency(
                                            item.glassType === "single"
                                                ? item.profile
                                                      ?.glass_price_single || 0
                                                : item.glassType === "double"
                                                ? item.profile
                                                      ?.glass_price_double || 0
                                                : item.glassType === "triple"
                                                ? item.profile
                                                      ?.glass_price_triple || 0
                                                : item.glassType === "laminated"
                                                ? item.profile
                                                      ?.glass_price_laminated ||
                                                  0
                                                : item.profile
                                                      ?.glass_price_single || 0 // fallback to single
                                        )}
                                        /m²
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(
                                            (item.glassType === "single"
                                                ? item.profile
                                                      ?.glass_price_single || 0
                                                : item.glassType === "double"
                                                ? item.profile
                                                      ?.glass_price_double || 0
                                                : item.glassType === "triple"
                                                ? item.profile
                                                      ?.glass_price_triple || 0
                                                : item.glassType === "laminated"
                                                ? item.profile
                                                      ?.glass_price_laminated ||
                                                  0
                                                : item.profile
                                                      ?.glass_price_single ||
                                                  0) / item.quantity
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
                                        <TableCell className="text-right text-sm text-muted-foreground">
                                            {item.system === "Tilt and Turn" 
                                                ? `${item.leaves} sach × EGP 3,000`
                                                : `${item.leaves} sach × ${formatCurrency(
                                                    item.leaves === 2
                                                        ? item.profile?.accessories_2_leaves || 0
                                                        : item.leaves === 3
                                                        ? item.profile?.accessories_3_leaves || 0
                                                        : item.leaves === 4
                                                        ? item.profile?.accessories_4_leaves || 0
                                                        : 0
                                                )}`
                                            }
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {formatCurrency(
                                                pricing.accessories / item.quantity
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {item.system === "Tilt and Turn" 
                                                ? item.leaves
                                                : item.quantity
                                            }
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {formatCurrency(pricing.accessories)}
                                        </TableCell>
                                    </TableRow>
                                )}
                                {(pricing.netCost > 0 ||
                                    (item.mosquito &&
                                        item.system?.toLowerCase() ===
                                            "hinged")) && (
                                    <TableRow>
                                        <TableCell>Mosquito Net</TableCell>
                                        <TableCell className="text-right text-sm text-muted-foreground">
                                            {pricing.sachPerimeter.toFixed(2)}m
                                            ×{" "}
                                            {formatCurrency(
                                                item.netType === "fixed"
                                                    ? item.profile
                                                          ?.mosquito_price_fixed ||
                                                          0
                                                    : item.netType === "plisse"
                                                    ? item.profile
                                                          ?.mosquito_price_plisse ||
                                                      0
                                                    : item.netType === "panda"
                                                    ? item.profile
                                                          ?.net_price_panda || 0
                                                    : item.profile
                                                          ?.mosquito_price_fixed ||
                                                      0
                                            )}
                                            /m
                                        </TableCell>
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
                                        <TableCell className="text-right text-sm text-muted-foreground">
                                            {pricing.frameLength.toFixed(2)}m ×{" "}
                                            {formatCurrency(
                                                item.profile?.arc_price || 0
                                            )}
                                            /m
                                        </TableCell>
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
                                {pricing.additionalCostTotal > 0 && (
                                    <TableRow>
                                        <TableCell>Additional Cost</TableCell>
                                        <TableCell className="text-right text-sm text-muted-foreground">
                                            Per item
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {formatCurrency(
                                                pricing.additionalCostTotal /
                                                    item.quantity
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {item.quantity}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {formatCurrency(
                                                pricing.additionalCostTotal
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <Separator />

                    {/* Profit and Totals */}
                    <div className="space-y-3">
                        <h4 className="font-semibold text-lg">
                            Profit & Totals
                        </h4>
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
                                    {(pricing.base_profit_rate * 100).toFixed(
                                        2
                                    )}
                                    %
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
                                        onValueChange={handleTypeChange}
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
                                            {(item.type === "window" || item.type === "door") && (
                                                <SelectItem value="Tilt and Turn">
                                                    Tilt and Turn
                                                </SelectItem>
                                            )}
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
                                        Sach
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
                                            <SelectValue placeholder="Select sach" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">
                                                1 Sash
                                            </SelectItem>
                                            <SelectItem value="2">
                                                2 Sash
                                            </SelectItem>
                                            <SelectItem value="3">
                                                3 Sash
                                            </SelectItem>
                                            <SelectItem value="4">
                                                4 Sash
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
                                    <Label
                                        htmlFor={`additionalCost-${item.id}`}
                                    >
                                        Additional Cost (per item)
                                    </Label>
                                    <Input
                                        id={`additionalCost-${item.id}`}
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={item.additionalCost || 0}
                                        onChange={(e) =>
                                            handleUpdate(
                                                "additionalCost",
                                                parseFloat(e.target.value) || 0
                                            )
                                        }
                                        placeholder="0.00"
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
                                            <SelectItem value="triple">
                                                Triple Glazed
                                            </SelectItem>
                                            <SelectItem value="laminated">
                                                Laminated
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
                                        {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                                        item.width || 0
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
                                                        item.height || 0
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
                                        </div> */}

                                        {/* Curtain Wall Designer */}
                                        {(item.width || 0) > 0 &&
                                            (item.height || 0) > 0 &&
                                            (item.type === "curtain_wall" || item.type === "sky_light") && (
                                                <div className="mt-6">
                                                    <CurtainWallDesigner
                                                        initGlassType={
                                                            item.glassType
                                                        }
                                                        wallWidth={
                                                            item.width || 0
                                                        }
                                                        wallHeight={
                                                            item.height || 0
                                                        }
                                                        initialDesignData={
                                                            item.designData
                                                                ? {
                                                                      panels: item
                                                                          .designData
                                                                          .panels,
                                                                      columns:
                                                                          item
                                                                              .designData
                                                                              .columns,
                                                                      rows: item
                                                                          .designData
                                                                          .rows,
                                                                      columnSizes:
                                                                          item
                                                                              .designData
                                                                              .columnSizes,
                                                                      rowSizes:
                                                                          item
                                                                              .designData
                                                                              .rowSizes,
                                                                  }
                                                                : undefined
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
                                                <div className="text-center p-3 bg-destructive/5 rounded-lg">
                                                    <div className="text-lg font-bold text-destructive">
                                                        {item.designData?.frameMeters?.toFixed(
                                                            2
                                                        ) || "0.00"}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        Frame Meters
                                                    </div>
                                                </div>
                                                <div className="text-center p-3 bg-destructive/5 rounded-lg">
                                                    <div className="text-lg font-bold text-destructive">
                                                        {item.designData?.windowMeters?.toFixed(
                                                            2
                                                        ) || "0.00"}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        Sach Meters
                                                    </div>
                                                </div>
                                                <div className="text-center p-3 bg-special/5 rounded-lg">
                                                    <div className="text-lg font-bold text-special">
                                                        {item.designData?.glassArea?.toFixed(
                                                            2
                                                        ) || "0.00"}{" "}
                                                        m²
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        Glass Area
                                                    </div>
                                                </div>
                                                <div className="text-center p-3 bg-warning/5 rounded-lg">
                                                    <div className="text-lg font-bold text-warning">
                                                        {item.designData
                                                            ?.cornerCount || 0}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        Corners
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            {/* Profile and Color Information */}
                            <Separator />
                            {/* Horizontal Layout: Profile Select | Item Preview | Color Select */}
                            <div className="grid grid-cols-3 gap-4">
                                {/* Left: Profile Select */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm font-medium">
                                            Profile
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

                                    {/* Profile Information */}
                                    <div className="border rounded-lg p-4 bg-card">
                                        {item.profile ? (
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-medium text-destructive">
                                                            {item.profile.name}
                                                        </span>
                                                        <Badge
                                                            variant="secondary"
                                                            className="text-destructive w-fit"
                                                        >
                                                            {item.profile.code}
                                                        </Badge>
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

                                                {/* Profile Details */}
                                                <div className="space-y-2 text-xs">
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">
                                                            System:
                                                        </span>
                                                        <span className="font-medium">
                                                            {
                                                                item.profile
                                                                    .system_type
                                                            }
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">
                                                            Brand:
                                                        </span>
                                                        <span className="font-medium">
                                                            {item.profile.brand}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">
                                                            Frame Price:
                                                        </span>
                                                        <span className="font-medium text-success">
                                                            {
                                                                item.profile
                                                                    .frame_price
                                                            }{" "}
                                                            EGP
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">
                                                            KG Price:
                                                        </span>
                                                        <span className="font-medium text-success">
                                                            {
                                                                item.profile
                                                                    .kg_price
                                                            }{" "}
                                                            EGP/kg
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                                                <Database className="h-8 w-8 mb-2" />
                                                <span className="text-sm">
                                                    No profile selected
                                                </span>
                                                <span className="text-xs mt-1">
                                                    Click &quotSelect
                                                    Profile&quote to choose
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Center: Item Preview */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm font-medium">
                                            Item Preview
                                        </Label>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={generateItemSvg}
                                            className="flex items-center gap-2"
                                        >
                                            Generate SVG
                                        </Button>
                                    </div>
                                    <div className="border rounded-lg p-4 bg-card h-48 flex flex-col items-center justify-center">
                                        {/* <div className="text-xs text-muted-foreground mb-2 text-center">
                                            {item.type === "curtain_wall"
                                                ? "Curtain Wall Layout"
                                                : `${item.system} System`}
                                        </div> */}
                                        <div className="flex justify-center flex-1 items-center">
                                            {svgContent ? (
                                                <div
                                                    className="max-h-full max-w-full scale-75 place-self-center p-2"
                                                    dangerouslySetInnerHTML={{
                                                        __html: svgContent,
                                                    }}
                                                />
                                            ) : (
                                                <div className="text-center text-muted-foreground">
                                                    Click &quot;Generate
                                                    SVG&quot; to create the
                                                    preview
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Color Select */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm font-medium">
                                            Color
                                        </Label>
                                        <div className="flex items-center gap-2">
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
                                            {globalColor && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        if (globalColor) {
                                                            handleUpdate(
                                                                "color",
                                                                globalColor
                                                            );
                                                        }
                                                    }}
                                                    className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 border-primary/30 text-primary"
                                                >
                                                    <Palette className="h-4 w-4" />
                                                    Use Global Color
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Color Information */}
                                    <div className="border rounded-lg p-4 bg-card">
                                        {item.color || globalColor ? (
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-medium text-info">
                                                            {
                                                                (
                                                                    item.color ||
                                                                    globalColor
                                                                )?.color
                                                            }
                                                        </span>
                                                        <Badge
                                                            variant="secondary"
                                                            className="text-info w-fit"
                                                        >
                                                            {
                                                                (
                                                                    item.color ||
                                                                    globalColor
                                                                )?.code
                                                            }
                                                        </Badge>
                                                    </div>
                                                    {item.color && (
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
                                                    )}
                                                </div>

                                                {/* Color Details */}
                                                <div className="space-y-2 text-xs">
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">
                                                            Brand:
                                                        </span>
                                                        <span className="font-medium">
                                                            {
                                                                (
                                                                    item.color ||
                                                                    globalColor
                                                                )?.brand
                                                            }
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">
                                                            Finish:
                                                        </span>
                                                        <span className="font-medium">
                                                            {
                                                                (
                                                                    item.color ||
                                                                    globalColor
                                                                )?.finish
                                                            }
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">
                                                            Type:
                                                        </span>
                                                        <span className="font-medium">
                                                            Powder Coating
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">
                                                            Status:
                                                        </span>
                                                        <span className="font-medium text-success">
                                                            Available
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                                                <Palette className="h-8 w-8 mb-2" />
                                                <span className="text-sm">
                                                    No color selected
                                                </span>
                                                <span className="text-xs mt-1">
                                                    Click &quoteSelect
                                                    Color&quote to choose
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
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
                                                onClick={() =>
                                                    setShowPricingDetails(
                                                        !showPricingDetails
                                                    )
                                                }
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
                                            Sach:
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
                <div className="fixed inset-0 bg-card border-border border bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-card rounded-lg p-6 max-w-[1400px] w-full max-h-[90vh] overflow-y-auto">
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
                <div className="fixed inset-0 bg-card border-border border bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-card rounded-lg p-6 max-w-[1400px] w-full max-h-[90vh] overflow-y-auto">
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
                            showSelection={true}
                        />
                    </div>
                </div>
            )}
        </>
    );
}
