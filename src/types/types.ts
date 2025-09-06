export interface CurtainPanel {
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

export interface DesignState {
    id: string;
    panels: CurtainPanel[];
    columns: number;
    rows: number;
    material: "aluminum" | "steel" | "composite";
    glassType: "single" | "double" | "triple" | "laminated";
    frameColor: string;
    timestamp: number;
    action: string;
    description: string;
}

export interface DesignPreset {
    name: string;
    description: string;
    columns: number;
    rows: number;
    layout: string[][];
}

export interface CurtainWallDesignerProps {
    wallWidth: number;
    wallHeight: number;
    initialDesignData?: {
        panels: CurtainPanel[];
        columns: number;
        rows: number;
        columnSizes: number[];
        rowSizes: number[];
    };
    onDesignChange: (design: {
        panels: CurtainPanel[];
        frameMeters: number;
        windowMeters: number;
        glassArea: number;
        cornerCount: number;
        totalCost: number;
        materialBreakdown: Record<string, number>;
        columns: number;
        rows: number;
        columnSizes: number[];
        rowSizes: number[];
    }) => void;
}
