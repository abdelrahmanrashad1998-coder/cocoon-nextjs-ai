// Quote Generator Types
import { AluminiumProfile } from "@/components/profile/profile-manager";

export interface ColorOption {
    id?: string;
    code: string;
    brand: string;
    color: string;
    finish: string;
}

export interface QuoteItem {
    id: string;
    type: "window" | "door" | "sky_light" | "curtain_wall";
    system: "Sliding" | "hinged" | "fixed" | "Curtain Wall";
    width: number;
    height: number;
    leaves: number;
    quantity: number;
    glassType: "single" | "double";
    mosquito: boolean;
    netType?: "fixed" | "plisse" | "panda";
    arch: boolean;
    upperPanelType?: "fixed" | "hinged";
    profile?: AluminiumProfile;
    color?: ColorOption;
    // Curtain wall specific properties
    designData?: {
        wallWidth: number;
        wallHeight: number;
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
        panels: Array<{
            type: "window" | "door" | "structure";
            widthMeters: number;
            heightMeters: number;
            left: number;
            top: number;
            col: number;
            row: number;
            colSpan: number;
            rowSpan: number;
            mergedId?: string;
            isSpanned?: boolean;
        }>;
        visualSvg?: string;
    };
    visualSvg?: string;
}

export interface ContactInfo {
    name: string;
    email: string;
    phone: string;
    location: string;
    notes: string;
}

export interface QuoteSettings {
    expirationDays: number;
    projectDuration: number;
    discountPercentage: number;
    customNotes: string;
    pricingType: "totals" | "detailed";
    exportFormat: "pdf" | "print" | "email";
}

export interface QuoteData {
    id: string;
    name: string;
    createdAt: string;
    contactInfo: ContactInfo;
    items: QuoteItem[];
    settings: QuoteSettings;
    globalColor?: ColorOption;
}

export interface QuoteTotals {
    totalM2: number;
    totalBefore: number;
    totalAfter: number;
    totalProfit: number;
    totalProfitPercentage: number;
    totalM2Price: number;
    downPayment: number;
    supplyPayment: number;
    completePayment: number;
    // Legacy fields for compatibility
    totalArea: number;
    totalBeforeProfit: number;
    totalPrice: number;
    m2Price: number;
    profitPercentage: number;
}

export interface PricedItem extends QuoteItem {
    area: number;
    frameLength: number;
    leafPerimeter: number;
    totalLeafLength: number;
    accessories: number;
    frameCost: number;
    leafCost: number;
    glassCost: number;
    netCost: number;
    archCost: number;
    totalBeforeProfit: number;
    profitAmount: number;
    totalPrice: number;
    m2Price: number;
    profitPercentage: number;
    base_profit_rate: number;
    // Curtain wall specific
    frameMeters?: number;
    windowMeters?: number;
    glassArea?: number;
    numWindows?: number;
    numDoors?: number;
    cornerCount?: number;
    frameAccessories?: number;
    cornersCost?: number;
    windowsCost?: number;
    accessoriesWindowsDoors?: number;
    totalArea?: number;
}
