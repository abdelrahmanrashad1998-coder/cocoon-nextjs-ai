// Quote Generator Types
import { AluminiumProfile } from "@/components/profile/profile-manager";
import { CurtainPanel } from "./types";

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
    additionalCost?: number; // Additional cost per item
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
        panels: CurtainPanel[];
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

export type QuoteStatus = 
    | "draft" 
    | "pending_review" 
    | "approved" 
    | "rejected" 
    | "in_production" 
    | "completed" 
    | "cancelled";

export interface QuoteApproval {
    approvedBy?: string;
    approvedAt?: string;
    rejectedBy?: string;
    rejectedAt?: string;
    rejectionReason?: string;
    notes?: string;
}

export interface QuoteHistoryEntry {
    id: string;
    timestamp: string;
    data: QuoteData;
    changeDescription?: string;
    savedBy?: string;
}

export interface QuoteData {
    id: string;
    name: string;
    createdAt: string;
    updatedAt?: string;
    contactInfo: ContactInfo;
    items: QuoteItem[];
    settings: QuoteSettings;
    globalColor?: ColorOption;
    status: QuoteStatus;
    approval?: QuoteApproval;
    estimatedCompletionDate?: string;
    actualCompletionDate?: string;
    productionStartDate?: string;
    history?: QuoteHistoryEntry[];
    lastAutoSaved?: string;
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
    additionalCostTotal: number; // Total additional cost (additionalCost * quantity)
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
