"use client";

import { useState, useCallback, useMemo } from "react";
import {
    QuoteItem,
    QuoteData,
    ContactInfo,
    QuoteSettings,
    QuoteTotals,
    PricedItem,
} from "@/types/quote";
import {
    calculateItemPricing,
    calculateQuoteTotals,
} from "@/lib/pricing-calculator";

interface ExportOptions {
    type: "pdf" | "print" | "email";
    format: string;
    pricingType: string;
    customNotes: string;
    expirationDays: number;
    projectDuration: number;
    discountPercentage: number;
    quoteData: QuoteData;
    totals: QuoteTotals;
}

const defaultProfile = {
    profile_code: "AL001",
    brand: "Cocoon",
    profile_name: "Standard Aluminum Profile",
    frame_price: 150,
    frame_price_3: 200,
    leaf_price: 80,
    accessories_2_leaves: 50,
    accessories_3_leaves: 75,
    accessories_4_leaves: 100,
    glass_price_single: 120,
    glass_price_double: 200,
    arc_price: 300,
    net_price: 60,
    net_price_plisse: 120,
    net_price_panda: 180,
    base_profit_rate: 0.3,
};

const createDefaultItem = (): QuoteItem => ({
    id: Math.random().toString(36).substr(2, 9),
    type: "window",
    system: "Sliding",
    width: 1.2,
    height: 1.5,
    leaves: 2,
    quantity: 1,
    glassType: "double",
    mosquito: false,
    arch: false,
    profile: undefined,
});

const createDefaultQuote = (): QuoteData => ({
    id: Math.random().toString(36).substr(2, 9),
    createdAt: new Date().toISOString(),
    contactInfo: {
        name: "",
        email: "",
        phone: "",
        location: "",
        notes: "",
    },
    items: [],
    settings: {
        expirationDays: 30,
        projectDuration: 60,
        discountPercentage: 0,
        customNotes:
            "Standard aluminum work installation with professional finishing.",
        pricingType: "totals",
        exportFormat: "pdf",
    },
});

export const useQuoteGenerator = () => {
    const [quoteData, setQuoteData] = useState<QuoteData>(createDefaultQuote());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const addItem = useCallback(() => {
        setQuoteData((prev) => ({
            ...prev,
            items: [...prev.items, createDefaultItem()],
        }));
    }, []);

    const updateItem = useCallback((index: number, updatedItem: QuoteItem) => {
        setQuoteData((prev) => ({
            ...prev,
            items: prev.items.map((item, i) =>
                i === index ? updatedItem : item
            ),
        }));
    }, []);

    const removeItem = useCallback((index: number) => {
        setQuoteData((prev) => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index),
        }));
    }, []);

    const updateContactInfo = useCallback(
        (field: keyof ContactInfo, value: string) => {
            setQuoteData((prev) => ({
                ...prev,
                contactInfo: {
                    ...prev.contactInfo,
                    [field]: value,
                },
            }));
        },
        []
    );

    const updateSettings = useCallback(
        (field: keyof QuoteSettings, value: string | number) => {
            setQuoteData((prev) => ({
                ...prev,
                settings: {
                    ...prev.settings,
                    [field]: value,
                },
            }));
        },
        []
    );

    const calculateDetailedPricing = useCallback(
        (item: QuoteItem): PricedItem => {
            return calculateItemPricing(item);
        },
        []
    );

    const calculateTotals = useCallback((): QuoteTotals => {
        const pricedItems = quoteData.items.map(calculateDetailedPricing);
        const totals = calculateQuoteTotals(pricedItems);

        // Apply discount
        const discountAmount =
            (totals.totalPrice * quoteData.settings.discountPercentage) / 100;
        const discountedTotal = totals.totalPrice - discountAmount;

        return {
            ...totals,
            totalPrice: +discountedTotal.toFixed(2),
            downPayment: +(discountedTotal * 0.8).toFixed(2),
            supplyPayment: +(discountedTotal * 0.1).toFixed(2),
            completePayment: +(discountedTotal * 0.1).toFixed(2),
            m2Price:
                totals.totalArea > 0
                    ? +(discountedTotal / totals.totalArea).toFixed(2)
                    : 0,
        };
    }, [quoteData, calculateDetailedPricing]);

    const saveQuote = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // TODO: Implement Firebase save
            console.log("Saving quote:", quoteData);
            await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
        } catch (err) {
            setError("Failed to save quote");
            throw err;
        } finally {
            setLoading(false);
        }
    }, [quoteData]);

    const exportQuote = useCallback(async (exportOptions: ExportOptions) => {
        setLoading(true);
        setError(null);

        try {
            const { type, quoteData, totals } = exportOptions;

            if (type === "pdf") {
                // Use browser's native print to PDF functionality - most reliable approach
                const printWindow = window.open(
                    "",
                    "_blank",
                    "width=800,height=600"
                );
                if (!printWindow) {
                    throw new Error(
                        "Unable to open print window. Please allow popups for this site."
                    );
                }

                const htmlContent = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Quote - ${quoteData.id}</title>
                        <style>
                            body {
                                font-family: Arial, sans-serif;
                                margin: 20px;
                                line-height: 1.4;
                                color: #000;
                                background: #fff;
                            }
                            .header {
                                text-align: center;
                                margin-bottom: 30px;
                                border-bottom: 2px solid #000;
                                padding-bottom: 20px;
                            }
                            .company-name {
                                font-size: 24px;
                                font-weight: bold;
                                margin-bottom: 5px;
                            }
                            .info-section {
                                margin-bottom: 20px;
                            }
                            .info-section h3 {
                                font-size: 16px;
                                font-weight: bold;
                                margin-bottom: 10px;
                                color: #000;
                            }
                            .info-grid {
                                display: table;
                                width: 100%;
                            }
                            .info-row {
                                display: table-row;
                            }
                            .info-label {
                                display: table-cell;
                                font-weight: bold;
                                padding: 5px 10px 5px 0;
                                width: 150px;
                            }
                            .info-value {
                                display: table-cell;
                                padding: 5px 0;
                            }
                            table {
                                width: 100%;
                                border-collapse: collapse;
                                margin: 20px 0;
                            }
                            th, td {
                                border: 1px solid #000;
                                padding: 8px;
                                text-align: left;
                                font-size: 12px;
                            }
                            th {
                                background-color: #f0f0f0;
                                font-weight: bold;
                            }
                            .summary-section {
                                margin: 20px 0;
                                padding: 15px;
                                background-color: #f9f9f9;
                                border: 1px solid #ddd;
                            }
                            .currency {
                                font-weight: bold;
                                color: #000;
                            }
                            .footer {
                                margin-top: 40px;
                                padding-top: 20px;
                                border-top: 1px solid #000;
                                text-align: center;
                                font-size: 11px;
                                color: #000;
                            }
                            @media print {
                                body { margin: 10mm; }
                                .no-print { display: none; }
                            }
                        </style>
                    </head>
                    <body>
                        <div class="header">
                            <div class="company-name">COCOON COMPANY FOR ALUMINUM WORKS</div>
                        </div>

                        <div class="info-section">
                            <div class="info-grid">
                                <div class="info-row">
                                    <div class="info-label">Quote Date:</div>
                                    <div class="info-value">${new Date().toLocaleDateString()}</div>
                                </div>
                                <div class="info-row">
                                    <div class="info-label">Customer Name:</div>
                                    <div class="info-value">${
                                        quoteData.contactInfo.name ||
                                        "Not Provided"
                                    }</div>
                                </div>
                                <div class="info-row">
                                    <div class="info-label">Project:</div>
                                    <div class="info-value">${
                                        quoteData.contactInfo.location ||
                                        "Not Provided"
                                    }</div>
                                </div>
                                <div class="info-row">
                                    <div class="info-label">Quote Reference:</div>
                                    <div class="info-value">${
                                        quoteData.id
                                    }</div>
                                </div>
                            </div>
                        </div>

                        <div class="info-section">
                            <p><em>This is a price quotation for the listed aluminum works, based on the dimensions and system type provided.</em></p>
                        </div>

                        <table>
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th>Width (m)</th>
                                    <th>Height (m)</th>
                                    <th>Qty</th>
                                    <th>Area (m²)</th>
                                    <th>System</th>
                                    ${
                                        exportOptions.pricingType === "detailed"
                                            ? "<th>Price (EGP)</th>"
                                            : ""
                                    }
                                </tr>
                            </thead>
                            <tbody>
                                ${quoteData.items
                                    .map((item: QuoteItem, index: number) => {
                                        const itemType =
                                            item.type === "window"
                                                ? "Window"
                                                : item.type === "door"
                                                ? "Door"
                                                : item.type === "sky_light"
                                                ? "Sky Light"
                                                : "Curtain Wall";

                                        const itemName =
                                            item.system !== "Curtain Wall"
                                                ? `${item.system} ${itemType} ${
                                                      index + 1
                                                  }`
                                                : `${item.system} ${index + 1}`;

                                        const area = (
                                            item.width *
                                            item.height *
                                            item.quantity
                                        ).toFixed(2);

                                        const itemPrice =
                                            exportOptions.pricingType ===
                                            "detailed"
                                                ? Math.round(
                                                      calculateItemPricing(item)
                                                          .totalPrice
                                                  ).toLocaleString()
                                                : "";

                                        return `
                                        <tr>
                                            <td>${itemName}</td>
                                            <td>${item.width}</td>
                                            <td>${item.height}</td>
                                            <td>${item.quantity}</td>
                                            <td>${area}</td>
                                            <td>${item.system}</td>
                                            ${
                                                exportOptions.pricingType ===
                                                "detailed"
                                                    ? `<td class="currency">${itemPrice}</td>`
                                                    : ""
                                            }
                                        </tr>
                                    `;
                                    })
                                    .join("")}
                            </tbody>
                        </table>

                        <div class="summary-section">
                            <h3>Quote Summary</h3>
                            <div class="info-grid">
                                <div class="info-row">
                                    <div class="info-label">Total Price:</div>
                                    <div class="info-value currency">${Math.round(
                                        totals.totalPrice
                                    ).toLocaleString()} EGP</div>
                                </div>
                                <div class="info-row">
                                    <div class="info-label">Total Area:</div>
                                    <div class="info-value">${totals.totalArea.toFixed(
                                        2
                                    )} m²</div>
                                </div>
                                <div class="info-row">
                                    <div class="info-label">Down Payment (80%):</div>
                                    <div class="info-value currency">${Math.round(
                                        totals.downPayment
                                    ).toLocaleString()} EGP</div>
                                </div>
                                <div class="info-row">
                                    <div class="info-label">On Supply (10%):</div>
                                    <div class="info-value currency">${Math.round(
                                        totals.supplyPayment
                                    ).toLocaleString()} EGP</div>
                                </div>
                                <div class="info-row">
                                    <div class="info-label">On Completion (10%):</div>
                                    <div class="info-value currency">${Math.round(
                                        totals.completePayment
                                    ).toLocaleString()} EGP</div>
                                </div>
                            </div>
                        </div>

                        <div class="summary-section">
                            <h3>Quote Validity</h3>
                            <div class="info-grid">
                                <div class="info-row">
                                    <div class="info-label">Valid for:</div>
                                    <div class="info-value">${
                                        quoteData.settings.expirationDays
                                    } days</div>
                                </div>
                                <div class="info-row">
                                    <div class="info-label">Project Duration:</div>
                                    <div class="info-value">${
                                        quoteData.settings.projectDuration
                                    } days</div>
                                </div>
                            </div>
                        </div>

                        ${
                            quoteData.settings.customNotes
                                ? `
                            <div class="summary-section">
                                <h3>Special Notes</h3>
                                <p>${quoteData.settings.customNotes.replace(
                                    /\n/g,
                                    "<br>"
                                )}</p>
                            </div>
                        `
                                : ""
                        }

                        <div class="footer">
                            <div><strong>Cocoon company for Aluminum Works</strong></div>
                            <div>61 Seventh Neighborhood, Fourth District, El-Shaikh Zayed, Giza</div>
                            <div>Tel: +20 2 38501291 | +20 11 51717149</div>
                            <div>Email: sales.department@cocoonaluminum.com</div>
                            <div>Website: www.cocoonaluminum.com</div>
                        </div>
                    </body>
                    </html>
                `;

                printWindow.document.write(htmlContent);
                printWindow.document.close();

                // Wait for content to load then trigger print
                printWindow.onload = () => {
                    setTimeout(() => {
                        printWindow.print();
                        console.log("PDF export completed using browser print");
                    }, 500);
                };
            } else if (type === "print") {
                // For print, use the same approach
                const printWindow = window.open("", "_blank");
                if (printWindow) {
                    printWindow.document.write(`
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <title>Quote - ${quoteData.id}</title>
                            <style>
                                body { font-family: Arial, sans-serif; margin: 20px; }
                                .header { text-align: center; margin-bottom: 20px; }
                                .section { margin-bottom: 20px; }
                                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                                th { background-color: #f2f2f2; }
                            </style>
                        </head>
                        <body>
                            <div class="header">
                                <h1>COCOON ALUMINUM QUOTE</h1>
                                <p>Quote ID: ${quoteData.id}</p>
                            </div>
                            <div class="section">
                                <h2>Customer Information</h2>
                                <p>Name: ${
                                    quoteData.contactInfo.name ||
                                    "Not specified"
                                }</p>
                                <p>Email: ${
                                    quoteData.contactInfo.email ||
                                    "Not specified"
                                }</p>
                                <p>Phone: ${
                                    quoteData.contactInfo.phone ||
                                    "Not specified"
                                }</p>
                                <p>Location: ${
                                    quoteData.contactInfo.location ||
                                    "Not specified"
                                }</p>
                            </div>
                            <div class="section">
                                <h2>Items</h2>
                                <table>
                                    <tr><th>Item</th><th>Dimensions</th><th>System</th><th>Area (m²)</th></tr>
                                    ${quoteData.items
                                        .map(
                                            (
                                                item: QuoteItem,
                                                index: number
                                            ) => `
                                        <tr>
                                            <td>${item.type} ${index + 1}</td>
                                            <td>${item.width}m × ${
                                                item.height
                                            }m</td>
                                            <td>${item.system}</td>
                                            <td>${(
                                                item.width *
                                                item.height *
                                                item.quantity
                                            ).toFixed(2)}</td>
                                        </tr>
                                    `
                                        )
                                        .join("")}
                                </table>
                            </div>
                            <div class="section">
                                <h3>Summary</h3>
                                <p>Total Area: ${totals.totalArea.toFixed(
                                    2
                                )} m²</p>
                                <p>Total Price: EGP ${totals.totalPrice.toLocaleString()}</p>
                            </div>
                        </body>
                        </html>
                    `);
                    printWindow.document.close();
                    printWindow.print();
                }
            }
        } catch (err) {
            console.error("Export failed:", err);
            setError(
                `Failed to export quote: ${
                    err instanceof Error ? err.message : "Unknown error"
                }`
            );
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);
    return {
        quoteData,
        addItem,
        updateItem,
        removeItem,
        updateContactInfo,
        updateSettings,
        calculateTotals,
        saveQuote,
        exportQuote,
        loading,
        error,
    };
};
