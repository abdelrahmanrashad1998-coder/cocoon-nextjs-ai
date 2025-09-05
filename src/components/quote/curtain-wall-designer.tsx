"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Square,
    Layout,
    DoorOpen,
    Calculator,
    Grid3X3,
    Move,
    Group,
    Ungroup,
    X,
    RotateCcw,
    Eye,
    Settings,
    Package,
    DollarSign,
    Layers,
    Plus,
    Minus,
    Undo2,
    Redo2,
    ChevronDown,
} from "lucide-react";

interface CurtainPanel {
    id: string;
    type: "structure" | "window" | "door";
    widthMeters: number;
    heightMeters: number;
    left: number;
    top: number;
    col: number;
    row: number;
    colSpan: number;
    rowSpan: number;
    mergedId?: string;
    selected?: boolean;
    material?: "aluminum" | "steel" | "composite";
    glassType?: "single" | "double" | "triple" | "laminated";
    frameColor?: string;
    isSpanned?: boolean;
}

interface DesignState {
    id: string;
    panels: CurtainPanel[];
    columns: number;
    rows: number;
    material: 'aluminum' | 'steel' | 'composite';
    glassType: 'single' | 'double' | 'triple' | 'laminated';
    frameColor: string;
    timestamp: number;
    action: string;
    description: string;
}


interface DesignPreset {
    name: string;
    description: string;
    columns: number;
    rows: number;
    layout: string[][];
}

interface CurtainWallDesignerProps {
    wallWidth: number;
    wallHeight: number;
    onDesignChange: (design: {
        panels: CurtainPanel[];
        frameMeters: number;
        windowMeters: number;
        glassArea: number;
        cornerCount: number;
        totalCost: number;
        materialBreakdown: Record<string, number>;
    }) => void;
}

export function CurtainWallDesigner({
    wallWidth,
    wallHeight,
    onDesignChange,
}: CurtainWallDesignerProps) {
    const [mode, setMode] = useState<
        "structure" | "window" | "door"
    >("structure");
    const [columns, setColumns] = useState(4);
    const [rows, setRows] = useState(3);
    const [panels, setPanels] = useState<CurtainPanel[]>([]);
    const [selectedPanels, setSelectedPanels] = useState<string[]>([]);
    const [columnSizes, setColumnSizes] = useState<number[]>([]);
    const [rowSizes, setRowSizes] = useState<number[]>([]);
    const [material, setMaterial] = useState<
        "aluminum" | "steel" | "composite"
    >("aluminum");
    const [glassType, setGlassType] = useState<
        "single" | "double" | "triple" | "laminated"
    >("double");
    const [frameColor, setFrameColor] = useState("#606060");
    const [showGrid, setShowGrid] = useState(true);
    const [zoom, setZoom] = useState(1);
    const [activeTab, setActiveTab] = useState("design");
    const [designHistory, setDesignHistory] = useState<DesignState[]>([]);
    const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);
    const [isUndoRedoOperation, setIsUndoRedoOperation] = useState(false);
    const [showCustomSizes, setShowCustomSizes] = useState(false);
    const [primaryColumnIndex, setPrimaryColumnIndex] = useState(0);
    const [primaryRowIndex, setPrimaryRowIndex] = useState(0);
    const canvasRef = useRef<HTMLDivElement>(null);

    // Design presets
    const presets: DesignPreset[] = [
        {
            name: "Standard Office",
            description: "4x3 grid with mixed windows and structure",
            columns: 4,
            rows: 3,
            layout: [
                ["structure", "window", "window", "structure"],
                ["structure", "window", "window", "structure"],
                ["structure", "structure", "structure", "structure"],
            ],
        },
        {
            name: "Retail Front",
            description: "Wide windows with minimal structure",
            columns: 6,
            rows: 2,
            layout: [
                [
                    "structure",
                    "window",
                    "window",
                    "window",
                    "window",
                    "structure",
                ],
                [
                    "structure",
                    "structure",
                    "structure",
                    "structure",
                    "structure",
                    "structure",
                ],
            ],
        },
        {
            name: "Residential",
            description: "Balanced mix for homes",
            columns: 3,
            rows: 4,
            layout: [
                ["structure", "window", "structure"],
                ["structure", "window", "structure"],
                ["structure", "door", "structure"],
                ["structure", "structure", "structure"],
            ],
        },
    ];

    // Enhanced calculations with pricing
    const calculateDesign = useCallback(
        (currentPanels: CurtainPanel[], currentColumns: number = columns, currentRows: number = rows) => {
            let frameMeters = 0;
            let windowMeters = 0;
            let glassArea = 0;
            let totalCost = 0;
            const materialBreakdown: Record<string, number> = {
                aluminum: 0,
                steel: 0,
                composite: 0,
                glass: 0,
                hardware: 0,
            };

            // Calculate external perimeter
            frameMeters = 2 * (wallWidth + wallHeight);

            // Calculate window/door meters and glass area
            currentPanels.forEach((panel) => {
                if (panel.type === "window" || panel.type === "door") {
                    windowMeters +=
                        2 * (panel.widthMeters + panel.heightMeters);
                    glassArea += panel.widthMeters * panel.heightMeters;
                }
            });

            // Calculate corners automatically based on panel intersections and external perimeter
            let cornerCount = 4; // Base corners for external perimeter
            
            // Count internal corners where panels meet
            // This is a simplified calculation - in a real implementation, 
            // you'd analyze the actual panel layout to find intersections
            const internalCorners = Math.max(0, (currentColumns - 1) * (currentRows - 1));
            cornerCount += internalCorners;

            // Calculate costs based on material and glass type
            const materialCosts = {
                aluminum: 45, // per meter
                steel: 65,
                composite: 55,
                glass: {
                    single: 80,
                    double: 120,
                    triple: 180,
                    laminated: 150,
                },
            };

            // Frame cost
            const frameCost = frameMeters * materialCosts[material];
            materialBreakdown[material] = frameCost;

            // Glass cost
            const glassCost = glassArea * materialCosts.glass[glassType];
            materialBreakdown.glass = glassCost;

            // Hardware cost (estimated 15% of total)
            const hardwareCost = (frameCost + glassCost) * 0.15;
            materialBreakdown.hardware = hardwareCost;

            totalCost = frameCost + glassCost + hardwareCost;

            onDesignChange({
                panels: currentPanels,
                frameMeters,
                windowMeters,
                glassArea,
                cornerCount,
                totalCost,
                materialBreakdown,
            });
        },
        [wallWidth, wallHeight, material, glassType, onDesignChange]
    );

    // Helper function to add a design state to history
    const addDesignState = useCallback(
        (action: string, description: string) => {
            if (isUndoRedoOperation) return; // Don't add to history during undo/redo operations

            const newState: DesignState = {
                id: `state-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                panels: panels.map(p => ({ ...p })),
                columns,
                rows,
                material,
                glassType,
                frameColor,
                timestamp: Date.now(),
                action,
                description,
            };

            setDesignHistory((prev) => {
                // Remove any states after current index (when branching from history)
                const newHistory = prev.slice(0, currentHistoryIndex + 1);
                // Limit history to 50 states to prevent memory issues
                const limitedHistory = [...newHistory, newState].slice(-50);
                return limitedHistory;
            });
            setCurrentHistoryIndex((prev) => {
                const newIndex = Math.min(prev + 1, 49); // Cap at 49 to match slice(-50)
                return newIndex;
            });
        },
        [panels, columns, rows, material, glassType, frameColor, currentHistoryIndex, isUndoRedoOperation]
    );

    // Helper function to restore design from a state
    const restoreFromState = useCallback((state: DesignState) => {
        setIsUndoRedoOperation(true);
        setPanels(state.panels.map(p => ({ ...p })));
        setColumns(state.columns);
        setRows(state.rows);
        setMaterial(state.material);
        setGlassType(state.glassType);
        setFrameColor(state.frameColor);
        setSelectedPanels([]);
        calculateDesign(state.panels, state.columns, state.rows);
        setTimeout(() => setIsUndoRedoOperation(false), 100);
    },
        [calculateDesign]
    );

    const generateGrid = useCallback(() => {
        const newPanels: CurtainPanel[] = [];
        let panelId = 0;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < columns; col++) {
                const panel: CurtainPanel = {
                    id: `panel-${panelId}`,
                    type: "structure",
                    widthMeters: columnSizes[col] || wallWidth / columns,
                    heightMeters: rowSizes[row] || wallHeight / rows,
                    left: col * (100 / columns),
                    top: row * (100 / rows),
                    col,
                    row,
                    colSpan: 1,
                    rowSpan: 1,
                    material,
                    glassType,
                    frameColor,
                    isSpanned: false,
                };
                newPanels.push(panel);
                panelId++;
            }
        }
        setPanels(newPanels);
        // Clear design history when generating new grid
        setDesignHistory([]);
        setCurrentHistoryIndex(-1);
        // Add initial state to history
        addDesignState('grid_generate', `Generated ${columns}×${rows} grid`);
    }, [
        columns,
        rows,
        wallWidth,
        wallHeight,
        columnSizes,
        rowSizes,
        material,
        glassType,
        frameColor,
    ]);

    // Update column sizes when columns change
    useEffect(() => {
        const newColumnSizes = Array(columns).fill(wallWidth / columns);
        setColumnSizes(newColumnSizes);
        // Show custom sizes when grid changes
        setShowCustomSizes(true);
    }, [columns, wallWidth]);

    // Update row sizes when rows change
    useEffect(() => {
        const newRowSizes = Array(rows).fill(wallHeight / rows);
        setRowSizes(newRowSizes);
        // Show custom sizes when grid changes
        setShowCustomSizes(true);
    }, [rows, wallHeight]);

    // Handle custom column size changes
    const handleColumnSizeChange = (index: number, value: number) => {
        const constrainedValue = Math.max(0.1, Math.min(wallWidth, value));
        const newColumnSizes = [...columnSizes];
        
        // Set this column as the primary one
        setPrimaryColumnIndex(index);
        
        // Calculate remaining space
        const remainingSpace = wallWidth - constrainedValue;
        const otherColumnsCount = columns - 1;
        
        if (otherColumnsCount > 0) {
            // Distribute remaining space equally among other columns
            const remainingSizePerColumn = remainingSpace / otherColumnsCount;
            
            // Update all columns
            for (let i = 0; i < columns; i++) {
                if (i === index) {
                    newColumnSizes[i] = constrainedValue;
                } else {
                    newColumnSizes[i] = Math.max(0.1, remainingSizePerColumn);
                }
            }
        } else {
            // Only one column, use the constrained value
            newColumnSizes[index] = constrainedValue;
        }
        
        setColumnSizes(newColumnSizes);
        
        // Update all panels with new column sizes
        const updatedPanels = panels.map(panel => ({
            ...panel,
            widthMeters: newColumnSizes[panel.col],
        }));
        setPanels(updatedPanels);
        calculateDesign(updatedPanels, columns, rows);
        
        // Add to history
        addDesignState('column_size_change', `Updated column ${index + 1} size to ${constrainedValue.toFixed(1)}m`);
    };

    // Handle custom row size changes
    const handleRowSizeChange = (index: number, value: number) => {
        const constrainedValue = Math.max(0.1, Math.min(wallHeight, value));
        const newRowSizes = [...rowSizes];
        
        // Set this row as the primary one
        setPrimaryRowIndex(index);
        
        // Calculate remaining space
        const remainingSpace = wallHeight - constrainedValue;
        const otherRowsCount = rows - 1;
        
        if (otherRowsCount > 0) {
            // Distribute remaining space equally among other rows
            const remainingSizePerRow = remainingSpace / otherRowsCount;
            
            // Update all rows
            for (let i = 0; i < rows; i++) {
                if (i === index) {
                    newRowSizes[i] = constrainedValue;
                } else {
                    newRowSizes[i] = Math.max(0.1, remainingSizePerRow);
                }
            }
        } else {
            // Only one row, use the constrained value
            newRowSizes[index] = constrainedValue;
        }
        
        setRowSizes(newRowSizes);
        
        // Update all panels with new row sizes
        const updatedPanels = panels.map(panel => ({
            ...panel,
            heightMeters: newRowSizes[panel.row],
        }));
        setPanels(updatedPanels);
        calculateDesign(updatedPanels, columns, rows);
        
        // Add to history
        addDesignState('row_size_change', `Updated row ${index + 1} size to ${constrainedValue.toFixed(1)}m`);
    };

    // Reset to equal sizes
    const resetToEqualSizes = () => {
        const equalColumnSize = wallWidth / columns;
        const equalRowSize = wallHeight / rows;
        
        setColumnSizes(Array(columns).fill(equalColumnSize));
        setRowSizes(Array(rows).fill(equalRowSize));
        setShowCustomSizes(false);
        setPrimaryColumnIndex(0);
        setPrimaryRowIndex(0);
        
        // Update all panels with equal sizes
        const updatedPanels = panels.map(panel => ({
            ...panel,
            widthMeters: equalColumnSize,
            heightMeters: equalRowSize,
        }));
        setPanels(updatedPanels);
        calculateDesign(updatedPanels, columns, rows);
        
        addDesignState('reset_sizes', 'Reset to equal column and row sizes');
    };

    // Initialize grid when dimensions change
    useEffect(() => {
        generateGrid();
    }, [generateGrid]);


    const handlePanelClick = (panelId: string, event: React.MouseEvent) => {
        if (event.ctrlKey || event.metaKey) {
            // Multi-select
            setSelectedPanels((prev) =>
                prev.includes(panelId)
                    ? prev.filter((id) => id !== panelId)
                    : [...prev, panelId]
            );
        } else {
            // Single select
            setSelectedPanels([panelId]);
        }
    };

    const handlePanelTypeChange = () => {
        if (selectedPanels.length === 0) return;

        // Add current state to history before making changes
        addDesignState('panel_type_change', `Changed ${selectedPanels.length} panel(s) to ${mode}`);

        const updatedPanels = panels.map((panel) =>
            selectedPanels.includes(panel.id) ? { ...panel, type: mode } : panel
        );
        setPanels(updatedPanels);
        calculateDesign(updatedPanels, columns, rows);
    };

    const mergePanels = () => {
        if (selectedPanels.length < 2) return;

        // Get all selected panels (including spanned ones)
        const selected = panels.filter((p) => selectedPanels.includes(p.id));

        // Calculate the actual bounds considering existing spans
        let minRow = Infinity,
            maxRow = -1,
            minCol = Infinity,
            maxCol = -1;

        selected.forEach((panel) => {
            const panelMinRow = panel.row;
            const panelMaxRow = panel.row + (panel.rowSpan || 1) - 1;
            const panelMinCol = panel.col;
            const panelMaxCol = panel.col + (panel.colSpan || 1) - 1;

            minRow = Math.min(minRow, panelMinRow);
            maxRow = Math.max(maxRow, panelMaxRow);
            minCol = Math.min(minCol, panelMinCol);
            maxCol = Math.max(maxCol, panelMaxCol);
        });

        // For single cell merging, just check if we have at least 2 panels
        // For multi-cell merging, check if selection forms a valid rectangle
        if (selected.length > 2) {
            // Check if selection forms a valid rectangle by ensuring all cells in the rectangle are covered
            const allCellsInRectangle = [];
            for (let r = minRow; r <= maxRow; r++) {
                for (let c = minCol; c <= maxCol; c++) {
                    allCellsInRectangle.push({ row: r, col: c });
                }
            }

            // Check if all cells in the rectangle are covered by selected panels
            const coveredCells = new Set();
            selected.forEach((panel) => {
                for (
                    let r = panel.row;
                    r < panel.row + (panel.rowSpan || 1);
                    r++
                ) {
                    for (
                        let c = panel.col;
                        c < panel.col + (panel.colSpan || 1);
                        c++
                    ) {
                        coveredCells.add(`${r},${c}`);
                    }
                }
            });

            const allCellsCovered = allCellsInRectangle.every((cell) =>
                coveredCells.has(`${cell.row},${cell.col}`)
            );

            if (!allCellsCovered) {
                return; // Selection doesn't form a complete rectangle
            }
        }

        const mergedGroupId = `merged-${Date.now()}`;
        const newPanels = panels.map((p) => ({ ...p }));

        // Find the top-left panel to be the master
        const masterIndex = newPanels.findIndex(
            (p) => p.row === minRow && p.col === minCol && !p.isSpanned
        );
        if (masterIndex === -1) return;

        const master = newPanels[masterIndex];
        master.colSpan = maxCol - minCol + 1;
        master.rowSpan = maxRow - minRow + 1;
        master.mergedId = mergedGroupId;
        master.selected = true;
        master.isSpanned = false;

        // Calculate combined dimensions in meters
        const combinedWidth = Array(master.colSpan)
            .fill(0 as number)
            .reduce(
                (acc: number, _val, i) =>
                    acc + (columnSizes[minCol + i] || wallWidth / columns),
                0
            );
        const combinedHeight = Array(master.rowSpan)
            .fill(0 as number)
            .reduce(
                (acc: number, _val, i) =>
                    acc + (rowSizes[minRow + i] || wallHeight / rows),
                0
            );

        master.widthMeters = combinedWidth;
        master.heightMeters = combinedHeight;

        // Remove all other selected panels (keep only the master)
        const filteredPanels = newPanels.filter((panel) => {
            if (panel.id === master.id) {
                return true; // Keep the master panel
            }
            // Remove all other selected panels
            return !selectedPanels.includes(panel.id);
        });

        // Add current state to history before making changes
        addDesignState('panel_merge', `Merged ${selectedPanels.length} panels into ${master.colSpan}×${master.rowSpan} group`);

        setPanels(filteredPanels);
        setSelectedPanels([master.id]);
        calculateDesign(filteredPanels, columns, rows);
    };

    const splitPanels = () => {
        const mergedPanels = panels.filter(
            (panel) =>
                (panel.colSpan > 1 || panel.rowSpan > 1) && panel.mergedId
        );

        if (mergedPanels.length === 0) return;

        // Add current state to history before making changes
        addDesignState('panel_split', `Split ${mergedPanels.length} merged panel(s) into individual panels`);

        const newPanels: CurtainPanel[] = [];

        // Process each merged panel
        mergedPanels.forEach((mergedPanel) => {
            const {
                row,
                col,
                colSpan,
                rowSpan,
                type,
                material,
                glassType,
                frameColor,
            } = mergedPanel;

            // Create individual panels for each cell in the merged area
            for (let r = row; r < row + rowSpan; r++) {
                for (let c = col; c < col + colSpan; c++) {
                    const panelId = `panel-${Date.now()}-${r}-${c}`;
                    const newPanel: CurtainPanel = {
                        id: panelId,
                        type,
                        widthMeters: columnSizes[c] || wallWidth / columns,
                        heightMeters: rowSizes[r] || wallHeight / rows,
                        left: c * (100 / columns),
                        top: r * (100 / rows),
                        col: c,
                        row: r,
                        colSpan: 1,
                        rowSpan: 1,
                        material,
                        glassType,
                        frameColor,
                        isSpanned: false,
                        selected: false,
                    };
                    newPanels.push(newPanel);
                }
            }
        });

        // Add all non-merged panels
        const nonMergedPanels = panels.filter(
            (panel) =>
                !((panel.colSpan > 1 || panel.rowSpan > 1) && panel.mergedId)
        );

        const allPanels = [...nonMergedPanels, ...newPanels];

        setPanels(allPanels);
        setSelectedPanels([]);
        calculateDesign(allPanels, columns, rows);
    };

    const clearSelection = () => {
        setSelectedPanels([]);
    };

    // Comprehensive Undo/Redo functionality
    const undoDesign = () => {
        if (currentHistoryIndex >= 0) {
            const stateToRestore = designHistory[currentHistoryIndex];
            restoreFromState(stateToRestore);
            setCurrentHistoryIndex(currentHistoryIndex - 1);
        }
    };

    const redoDesign = () => {
        if (currentHistoryIndex < designHistory.length - 1) {
            const stateToRestore = designHistory[currentHistoryIndex + 1];
            restoreFromState(stateToRestore);
            setCurrentHistoryIndex(currentHistoryIndex + 1);
        }
    };

    const canUndo = currentHistoryIndex >= 0 && designHistory.length > 0;
    const canRedo = currentHistoryIndex < designHistory.length - 1;

    // Function to undo only merge operations
    const undoMergeOperations = () => {
        if (currentHistoryIndex < 0 || designHistory.length === 0) return;

        // Find the most recent merge operation by traversing backwards from current position
        let targetIndex = -1;
        for (let i = currentHistoryIndex; i >= 0; i--) {
            if (designHistory[i].action === 'panel_merge') {
                targetIndex = i;
                break;
            }
        }

        // If we found a merge operation, restore to the state before it
        if (targetIndex >= 0) {
            const stateToRestore = designHistory[targetIndex];
            restoreFromState(stateToRestore);
            setCurrentHistoryIndex(targetIndex - 1);
        }
    };

    // Check if there are any merge operations to undo
    const canUndoMerge = currentHistoryIndex >= 0 && designHistory.some((state, index) => 
        index <= currentHistoryIndex && state.action === 'panel_merge'
    );

    // Wrapper functions for material changes with history tracking
    const handleMaterialChange = (newMaterial: 'aluminum' | 'steel' | 'composite') => {
        addDesignState('material_change', `Changed frame material to ${newMaterial}`);
        setMaterial(newMaterial);
    };

    const handleGlassTypeChange = (newGlassType: 'single' | 'double' | 'triple' | 'laminated') => {
        addDesignState('glass_type_change', `Changed glass type to ${newGlassType}`);
        setGlassType(newGlassType);
    };

    const handleFrameColorChange = (newColor: string) => {
        addDesignState('color_change', `Changed frame color to ${newColor}`);
        setFrameColor(newColor);
    };

    // Apply preset design
    const applyPreset = (preset: DesignPreset) => {
        // Add current state to history before applying preset
        addDesignState('preset_apply', `Applied preset: ${preset.name}`);
        
        setColumns(preset.columns);
        setRows(preset.rows);

        setTimeout(() => {
            const newPanels: CurtainPanel[] = [];
            let panelId = 0;

            for (let row = 0; row < preset.rows; row++) {
                for (let col = 0; col < preset.columns; col++) {
                    const panelType = preset.layout[row]?.[col] || "structure";
                    const panel: CurtainPanel = {
                        id: `panel-${panelId}`,
                        type: panelType as
                            | "structure"
                            | "window"
                            | "door",
                        widthMeters: wallWidth / preset.columns,
                        heightMeters: wallHeight / preset.rows,
                        left: col * (100 / preset.columns),
                        top: row * (100 / preset.rows),
                        col,
                        row,
                        colSpan: 1,
                        rowSpan: 1,
                        material,
                        glassType,
                        frameColor,
                        isSpanned: false,
                    };
                    newPanels.push(panel);
                    panelId++;
                }
            }
            setPanels(newPanels);
            calculateDesign(newPanels, preset.columns, preset.rows);
        }, 100);
    };

    const getPanelStyle = (panel: CurtainPanel) => {
        // Calculate position and size based on custom sizes
        const totalWidth = columnSizes.reduce((sum, size) => sum + size, 0);
        const totalHeight = rowSizes.reduce((sum, size) => sum + size, 0);
        
        // Calculate left position based on column sizes
        let leftPercent = 0;
        for (let i = 0; i < panel.col; i++) {
            leftPercent += (columnSizes[i] / totalWidth) * 100;
        }
        
        // Calculate top position based on row sizes
        let topPercent = 0;
        for (let i = 0; i < panel.row; i++) {
            topPercent += (rowSizes[i] / totalHeight) * 100;
        }
        
        // Calculate width based on column spans
        let widthPercent = 0;
        for (let i = panel.col; i < panel.col + panel.colSpan; i++) {
            widthPercent += (columnSizes[i] / totalWidth) * 100;
        }
        
        // Calculate height based on row spans
        let heightPercent = 0;
        for (let i = panel.row; i < panel.row + panel.rowSpan; i++) {
            heightPercent += (rowSizes[i] / totalHeight) * 100;
        }

        const baseStyle = {
            position: "absolute" as const,
            left: `${leftPercent}%`,
            top: `${topPercent}%`,
            width: `${widthPercent}%`,
            height: `${heightPercent}%`,
            border: "2px solid",
            borderRadius: "8px",
            cursor: "pointer",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column" as const,
            padding: "12px",
            fontSize: "0.75rem",
            fontWeight: 600,
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            background:
                "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)",
            backdropFilter: "blur(10px)",
        };

        let borderColor = "#e5e7eb";
        let backgroundColor = "rgba(255,255,255,0.8)";
        let textColor = "#374151";

        switch (panel.type) {
            case "structure":
                borderColor = "#10b981";
                backgroundColor = "rgba(16, 185, 129, 0.1)";
                textColor = "#065f46";
                break;
            case "window":
                borderColor = "#3b82f6";
                backgroundColor = "rgba(59, 130, 246, 0.1)";
                textColor = "#1e40af";
                break;
            case "door":
                borderColor = "#f59e0b";
                backgroundColor = "rgba(245, 158, 11, 0.1)";
                textColor = "#92400e";
                break;
        }

        // Check merged state first (base styling)
        if (panel.mergedId) {
            borderColor = "#059669";
            backgroundColor = "rgba(5, 150, 105, 0.1)";
            textColor = "#064e3b";
            baseStyle.boxShadow =
                "0 0 0 2px rgba(5, 150, 105, 0.3), 0 2px 8px rgba(0,0,0,0.1)";
        }

        // Override with selection styling if selected (takes priority)
        if (selectedPanels.includes(panel.id)) {
            borderColor = "#2563eb";
            backgroundColor = "rgba(37, 99, 235, 0.15)";
            textColor = "#1e40af";
            baseStyle.boxShadow =
                "0 0 0 3px rgba(37, 99, 235, 0.4), 0 4px 12px rgba(37, 99, 235, 0.2)";
        }

        return {
            ...baseStyle,
            borderColor,
            backgroundColor,
            color: textColor,
        };
    };

    const getPanelIcon = (type: string) => {
        switch (type) {
            case "structure":
                return <Square className="h-5 w-5" />;
            case "window":
                return <Layout className="h-5 w-5" />;
            case "door":
                return <DoorOpen className="h-5 w-5" />;
            default:
                return <Square className="h-5 w-5" />;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Grid3X3 className="h-6 w-6 text-primary" />
                            <span>Advanced Curtain Wall Designer</span>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowGrid(!showGrid)}
                            >
                                <Eye className="h-4 w-4 mr-1" />
                                {showGrid ? "Hide" : "Show"} Grid
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={generateGrid}
                            >
                                <RotateCcw className="h-4 w-4 mr-1" />
                                Reset
                            </Button>
                        </div>
                    </CardTitle>
                </CardHeader>
            </Card>

            {/* Main Content with Tabs */}
            <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="space-y-6"
            >
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger
                        value="design"
                        className="flex items-center gap-2"
                    >
                        <Grid3X3 className="h-4 w-4" />
                        Design
                    </TabsTrigger>
                    <TabsTrigger
                        value="materials"
                        className="flex items-center gap-2"
                    >
                        <Package className="h-4 w-4" />
                        Materials
                    </TabsTrigger>
                    <TabsTrigger
                        value="calculations"
                        className="flex items-center gap-2"
                    >
                        <Calculator className="h-4 w-4" />
                        Calculations
                    </TabsTrigger>
                    <TabsTrigger
                        value="presets"
                        className="flex items-center gap-2"
                    >
                        <Layers className="h-4 w-4" />
                        Presets
                    </TabsTrigger>
                </TabsList>

                {/* Design Tab */}
                <TabsContent
                    value="design"
                    className="space-y-6"
                >
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Design Tools */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Settings className="h-5 w-5" />
                                    Design Tools
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label className="text-sm font-medium mb-3 block">
                                        Panel Type
                                    </Label>
                                    <Select value={mode} onValueChange={(value: "structure" | "window" | "door") => setMode(value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="structure">
                                                <div className="flex items-center gap-2">
                                                    <Square className="h-4 w-4" />
                                                    Fixed
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="window">
                                                <div className="flex items-center gap-2">
                                                    <Layout className="h-4 w-4" />
                                                    Window
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="door">
                                                <div className="flex items-center gap-2">
                                                    <DoorOpen className="h-4 w-4" />
                                                    Door
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Separator />

                                <div>
                                    <Label className="text-sm font-medium mb-3 block">
                                        Grid Settings
                                    </Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <Label
                                                htmlFor="cols"
                                                className="text-xs"
                                            >
                                                Columns
                                            </Label>
                                            <Input
                                                id="cols"
                                                type="number"
                                                min="1"
                                                max="10"
                                                value={columns}
                                                onChange={(e) =>
                                                    setColumns(
                                                        parseInt(
                                                            e.target.value
                                                        ) || 1
                                                    )
                                                }
                                                className="h-8"
                                            />
                                        </div>
                                        <div>
                                            <Label
                                                htmlFor="rows"
                                                className="text-xs"
                                            >
                                                Rows
                                            </Label>
                                            <Input
                                                id="rows"
                                                type="number"
                                                min="1"
                                                max="10"
                                                value={rows}
                                                onChange={(e) =>
                                                    setRows(
                                                        parseInt(
                                                            e.target.value
                                                        ) || 1
                                                    )
                                                }
                                                className="h-8"
                                            />
                                        </div>
                                    </div>
                                    
                                    {/* Custom Size Controls */}
                                    {showCustomSizes && (
                                        <div className="mt-4 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-sm font-medium">
                                                    Custom Sizes
                                                </Label>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={resetToEqualSizes}
                                                    className="h-6 px-2 text-xs"
                                                >
                                                    Reset to Equal
                                                </Button>
                                            </div>
                                            
                                            {/* Column Sizes */}
                                            <div>
                                                <Label className="text-xs text-muted-foreground mb-2 block">
                                                    Column Widths (m) - Auto-calculated values are shown in gray
                                                </Label>
                                                <div className="grid grid-cols-2 gap-1">
                                                    {columnSizes.map((size, index) => (
                                                        <div key={index} className="flex items-center gap-1">
                                                            <Label className="text-xs w-6">
                                                                C{index + 1}:
                                                            </Label>
                                                            <Input
                                                                type="number"
                                                                min="0.1"
                                                                max={wallWidth}
                                                                step="0.1"
                                                                value={size.toFixed(1)}
                                                                onChange={(e) =>
                                                                    handleColumnSizeChange(
                                                                        index,
                                                                        parseFloat(e.target.value) || 0.1
                                                                    )
                                                                }
                                                                className="h-6 text-xs"
                                                                style={{
                                                                    backgroundColor: index === primaryColumnIndex ? 'white' : '#f9fafb',
                                                                    color: index === primaryColumnIndex ? 'black' : '#6b7280'
                                                                }}
                                                                title={index === primaryColumnIndex ? "Primary input - other columns auto-calculate" : "Auto-calculated based on primary input"}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            
                                            {/* Row Sizes */}
                                            <div>
                                                <Label className="text-xs text-muted-foreground mb-2 block">
                                                    Row Heights (m) - Auto-calculated values are shown in gray
                                                </Label>
                                                <div className="grid grid-cols-2 gap-1">
                                                    {rowSizes.map((size, index) => (
                                                        <div key={index} className="flex items-center gap-1">
                                                            <Label className="text-xs w-6">
                                                                R{index + 1}:
                                                            </Label>
                                                            <Input
                                                                type="number"
                                                                min="0.1"
                                                                max={wallHeight}
                                                                step="0.1"
                                                                value={size.toFixed(1)}
                                                                onChange={(e) =>
                                                                    handleRowSizeChange(
                                                                        index,
                                                                        parseFloat(e.target.value) || 0.1
                                                                    )
                                                                }
                                                                className="h-6 text-xs"
                                                                style={{
                                                                    backgroundColor: index === primaryRowIndex ? 'white' : '#f9fafb',
                                                                    color: index === primaryRowIndex ? 'black' : '#6b7280'
                                                                }}
                                                                title={index === primaryRowIndex ? "Primary input - other rows auto-calculate" : "Auto-calculated based on primary input"}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            
                                            <div className="text-xs text-muted-foreground">
                                                Total Width: {columnSizes.reduce((sum, size) => sum + size, 0).toFixed(1)}m | 
                                                Total Height: {rowSizes.reduce((sum, size) => sum + size, 0).toFixed(1)}m
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <Separator />

                                <div>
                                    <Label className="text-sm font-medium mb-3 block">
                                        Actions
                                    </Label>
                                    <div className="space-y-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={clearSelection}
                                            className="w-full justify-start"
                                        >
                                            <X className="h-4 w-4 mr-2" />
                                            Clear Selection
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={mergePanels}
                                            disabled={selectedPanels.length < 2}
                                            className="w-full justify-start"
                                        >
                                            <Group className="h-4 w-4 mr-2" />
                                            Merge Panels
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={undoMergeOperations}
                                            disabled={!canUndoMerge}
                                            className="w-full justify-start"
                                        >
                                            <Ungroup className="h-4 w-4 mr-2" />
                                            Revert last merge
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={handlePanelTypeChange}
                                            disabled={
                                                selectedPanels.length === 0
                                            }
                                            className="w-full justify-start"
                                        >
                                            <Move className="h-4 w-4 mr-2" />
                                            Apply{" "}
                                            {mode.charAt(0).toUpperCase() +
                                                mode.slice(1)}
                                        </Button>
                                    </div>
                                </div>

                                <Separator />

                                <div>
                                    <Label className="text-sm font-medium mb-3 block">
                                        Design History
                                    </Label>
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-2 gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={undoDesign}
                                                disabled={!canUndo}
                                                className="justify-start"
                                            >
                                                <Undo2 className="h-4 w-4 mr-2" />
                                                Undo
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={redoDesign}
                                                disabled={!canRedo}
                                                className="justify-start"
                                            >
                                                <Redo2 className="h-4 w-4 mr-2" />
                                                Redo
                                            </Button>
                                        </div>
                                        {designHistory.length > 0 && (
                                            <div className="text-xs text-muted-foreground">
                                                {designHistory.length} state
                                                {designHistory.length > 1
                                                    ? "s"
                                                    : ""}{" "}
                                                in history
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {selectedPanels.length > 0 && (
                                    <div className="text-sm text-muted-foreground">
                                        {selectedPanels.length} panel
                                        {selectedPanels.length > 1
                                            ? "s"
                                            : ""}{" "}
                                        selected
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Design Canvas */}
                        <div className="lg:col-span-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        <span>Design Canvas</span>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    setZoom(
                                                        Math.max(
                                                            0.5,
                                                            zoom - 0.1
                                                        )
                                                    )
                                                }
                                            >
                                                <Minus className="h-4 w-4" />
                                            </Button>
                                            <span className="text-sm font-medium">
                                                {Math.round(zoom * 100)}%
                                            </span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    setZoom(
                                                        Math.min(2, zoom + 0.1)
                                                    )
                                                }
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="relative border-2 border-dashed border-gray-300 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 min-h-[500px] p-4">
                                        <div
                                            ref={canvasRef}
                                            className="relative w-full h-[500px] bg-white rounded-lg shadow-inner"
                                            style={{
                                                transform: `scale(${zoom})`,
                                                transformOrigin: "top left",
                                            }}
                                        >
                                            {/* Grid Lines */}
                                            {showGrid && (
                                                <div className="absolute inset-0 pointer-events-none">
                                                    {/* Vertical grid lines based on custom column sizes */}
                                                    {(() => {
                                                        const totalWidth = columnSizes.reduce((sum, size) => sum + size, 0);
                                                        let cumulativeWidth = 0;
                                                        return Array.from({ length: columns + 1 }).map((_, i) => {
                                                            const leftPercent = (cumulativeWidth / totalWidth) * 100;
                                                            if (i < columns) cumulativeWidth += columnSizes[i];
                                                            return (
                                                                <div
                                                                    key={`v-${i}`}
                                                                    className="absolute top-0 bottom-0 w-px bg-gray-200"
                                                                    style={{ left: `${leftPercent}%` }}
                                                                />
                                                            );
                                                        });
                                                    })()}
                                                    
                                                    {/* Horizontal grid lines based on custom row sizes */}
                                                    {(() => {
                                                        const totalHeight = rowSizes.reduce((sum, size) => sum + size, 0);
                                                        let cumulativeHeight = 0;
                                                        return Array.from({ length: rows + 1 }).map((_, i) => {
                                                            const topPercent = (cumulativeHeight / totalHeight) * 100;
                                                            if (i < rows) cumulativeHeight += rowSizes[i];
                                                            return (
                                                                <div
                                                                    key={`h-${i}`}
                                                                    className="absolute left-0 right-0 h-px bg-gray-200"
                                                                    style={{ top: `${topPercent}%` }}
                                                                />
                                                            );
                                                        });
                                                    })()}
                                                </div>
                                            )}

                                            {/* Panels */}
                                            {panels.map((panel) => (
                                                <div
                                                    key={panel.id}
                                                    style={getPanelStyle(panel)}
                                                    onClick={(e) =>
                                                        handlePanelClick(
                                                            panel.id,
                                                            e
                                                        )
                                                    }
                                                    className="hover:scale-105 hover:shadow-lg hover:z-10 relative"
                                                >
                                                    <div className="flex flex-col items-center gap-1">
                                                        {getPanelIcon(
                                                            panel.type
                                                        )}
                                                        <span className="text-xs font-medium text-center leading-tight">
                                                            {panel.type === "structure" 
                                                                ? "Fixed"
                                                                : panel.type.charAt(0).toUpperCase() + panel.type.slice(1)
                                                            }
                                                        </span>
                                                        <div className="text-[10px] text-muted-foreground text-center">
                                                            {panel.widthMeters.toFixed(
                                                                1
                                                            )}
                                                            ×
                                                            {panel.heightMeters.toFixed(
                                                                1
                                                            )}
                                                            m
                                                        </div>
                                                        {panel.mergedId && (
                                                            <Badge
                                                                variant="secondary"
                                                                className="text-[10px] px-1 py-0"
                                                            >
                                                                Merged
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="text-center text-sm text-muted-foreground mt-3">
                                            Hold Ctrl/Cmd and click to select
                                            multiple panels • Use mouse wheel to
                                            zoom
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* Materials Tab */}
                <TabsContent
                    value="materials"
                    className="space-y-6"
                >
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                Material Configuration
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <Label className="text-sm font-medium">
                                            Frame Material
                                        </Label>
                                        <Select
                                            value={material}
                                            onValueChange={(
                                                value:
                                                    | "aluminum"
                                                    | "steel"
                                                    | "composite"
                                            ) => handleMaterialChange(value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="aluminum">
                                                    Aluminum
                                                </SelectItem>
                                                <SelectItem value="steel">
                                                    Steel
                                                </SelectItem>
                                                <SelectItem value="composite">
                                                    Composite
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium">
                                            Glass Type
                                        </Label>
                                        <Select
                                            value={glassType}
                                            onValueChange={(
                                                value:
                                                    | "single"
                                                    | "double"
                                                    | "triple"
                                                    | "laminated"
                                            ) => handleGlassTypeChange(value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="single">
                                                    Single Glazing
                                                </SelectItem>
                                                <SelectItem value="double">
                                                    Double Glazing
                                                </SelectItem>
                                                <SelectItem value="triple">
                                                    Triple Glazing
                                                </SelectItem>
                                                <SelectItem value="laminated">
                                                    Laminated Glass
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium">
                                            Frame Color
                                        </Label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="color"
                                                value={frameColor}
                                                onChange={(e) =>
                                                    handleFrameColorChange(
                                                        e.target.value
                                                    )
                                                }
                                                className="w-8 h-8 rounded border"
                                                aria-label="Frame color"
                                            />
                                            <Input
                                                value={frameColor}
                                                onChange={(e) =>
                                                    handleFrameColorChange(
                                                        e.target.value
                                                    )
                                                }
                                                className="flex-1"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    <Label className="text-sm font-medium mb-3 block">
                                        Material Specifications
                                    </Label>
                                    <div className="space-y-3">
                                        <div className="p-4 bg-blue-50 rounded-lg">
                                            <h4 className="font-medium text-blue-900 mb-2">
                                                Frame Material:{" "}
                                                {material
                                                    .charAt(0)
                                                    .toUpperCase() +
                                                    material.slice(1)}
                                            </h4>
                                            <p className="text-sm text-blue-700">
                                                {material === "aluminum" &&
                                                    "Lightweight, corrosion-resistant, excellent thermal performance"}
                                                {material === "steel" &&
                                                    "High strength, fire-resistant, suitable for large spans"}
                                                {material === "composite" &&
                                                    "Combines benefits of multiple materials, enhanced durability"}
                                            </p>
                                        </div>
                                        <div className="p-4 bg-green-50 rounded-lg">
                                            <h4 className="font-medium text-green-900 mb-2">
                                                Glass Type:{" "}
                                                {glassType
                                                    .charAt(0)
                                                    .toUpperCase() +
                                                    glassType.slice(1)}
                                            </h4>
                                            <p className="text-sm text-green-700">
                                                {glassType === "single" &&
                                                    "Basic glazing, cost-effective for interior applications"}
                                                {glassType === "double" &&
                                                    "Improved thermal insulation and sound reduction"}
                                                {glassType === "triple" &&
                                                    "Maximum energy efficiency and acoustic performance"}
                                                {glassType === "laminated" &&
                                                    "Safety glass with enhanced security and sound control"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Calculations Tab */}
                <TabsContent
                    value="calculations"
                    className="space-y-6"
                >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calculator className="h-5 w-5" />
                                    Panel Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                                            <div className="text-2xl font-bold text-blue-600">
                                                {
                                                    panels.filter(
                                                        (p) =>
                                                            p.type ===
                                                                "window" ||
                                                            p.type === "door"
                                                    ).length
                                                }
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                Windows/Doors
                                            </div>
                                        </div>
                                        <div className="text-center p-4 bg-green-50 rounded-lg">
                                            <div className="text-2xl font-bold text-green-600">
                                                {
                                                    panels.filter(
                                                        (p) =>
                                                            p.type ===
                                                            "structure"
                                                    ).length
                                                }
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                Structure Panels
                                            </div>
                                        </div>
                                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                                            <div className="text-2xl font-bold text-purple-600">
                                                {panels.length}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                Total Panels
                                            </div>
                                        </div>
                                        <div className="text-center p-4 bg-orange-50 rounded-lg">
                                            <div className="text-2xl font-bold text-orange-600">
                                                {
                                                    panels.filter(
                                                        (p) => p.mergedId
                                                    ).length
                                                }
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                Merged Groups
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign className="h-5 w-5" />
                                    Cost Estimation
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="text-center p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
                                        <div className="text-3xl font-bold text-green-600 mb-2">
                                            $
                                            {panels.length > 0
                                                ? panels
                                                      .reduce((acc, panel) => {
                                                          const frameCost =
                                                              2 *
                                                              (panel.widthMeters +
                                                                  panel.heightMeters) *
                                                              45;
                                                          const glassCost =
                                                              panel.type ===
                                                                  "window" ||
                                                              panel.type ===
                                                                  "door"
                                                                  ? panel.widthMeters *
                                                                    panel.heightMeters *
                                                                    120
                                                                  : 0;
                                                          return (
                                                              acc +
                                                              frameCost +
                                                              glassCost
                                                          );
                                                      }, 0)
                                                      .toLocaleString()
                                                : "0"}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            Estimated Total Cost
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>
                                                Frame Material ({material}):
                                            </span>
                                            <span>
                                                $
                                                {(
                                                    2 *
                                                    (wallWidth + wallHeight) *
                                                    (material === "aluminum"
                                                        ? 45
                                                        : material === "steel"
                                                        ? 65
                                                        : 55)
                                                ).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>Glass Area:</span>
                                            <span>
                                                {panels
                                                    .filter(
                                                        (p) =>
                                                            p.type ===
                                                                "window" ||
                                                            p.type === "door"
                                                    )
                                                    .reduce(
                                                        (acc, panel) =>
                                                            acc +
                                                            panel.widthMeters *
                                                                panel.heightMeters,
                                                        0
                                                    )
                                                    .toFixed(1)}{" "}
                                                m²
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>Glass Cost:</span>
                                            <span>
                                                $
                                                {(
                                                    panels
                                                        .filter(
                                                            (p) =>
                                                                p.type ===
                                                                    "window" ||
                                                                p.type ===
                                                                    "door"
                                                        )
                                                        .reduce(
                                                            (acc, panel) =>
                                                                acc +
                                                                panel.widthMeters *
                                                                    panel.heightMeters,
                                                            0
                                                        ) *
                                                    (glassType === "single"
                                                        ? 80
                                                        : glassType === "double"
                                                        ? 120
                                                        : glassType === "triple"
                                                        ? 180
                                                        : 150)
                                                ).toLocaleString()}
                                            </span>
                                        </div>
                                        <Separator />
                                        <div className="flex justify-between font-medium">
                                            <span>Total Area:</span>
                                            <span>
                                                {(
                                                    wallWidth * wallHeight
                                                ).toFixed(1)}{" "}
                                                m²
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Presets Tab */}
                <TabsContent
                    value="presets"
                    className="space-y-6"
                >
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Layers className="h-5 w-5" />
                                Design Presets
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {presets.map((preset, index) => (
                                    <Card
                                        key={index}
                                        className="cursor-pointer hover:shadow-md transition-shadow"
                                    >
                                        <CardHeader>
                                            <CardTitle className="text-lg">
                                                {preset.name}
                                            </CardTitle>
                                            <p className="text-sm text-muted-foreground">
                                                {preset.description}
                                            </p>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-2">
                                                <div className="text-sm">
                                                    <span className="font-medium">
                                                        Grid:
                                                    </span>{" "}
                                                    {preset.columns}×
                                                    {preset.rows}
                                                </div>
                                                <div className="text-sm">
                                                    <span className="font-medium">
                                                        Panels:
                                                    </span>{" "}
                                                    {preset.columns *
                                                        preset.rows}
                                                </div>
                                                <Button
                                                    onClick={() =>
                                                        applyPreset(preset)
                                                    }
                                                    className="w-full mt-3"
                                                    size="sm"
                                                >
                                                    Apply Preset
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
