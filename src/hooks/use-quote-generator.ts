import { useState, useCallback } from "react";
import {
    QuoteItem,
    QuoteData,
    ContactInfo,
    QuoteSettings,
    QuoteTotals,
    ColorOption,
} from "@/types/quote";
import { db } from "@/lib/firebase";
import { addDoc, collection, getDocs } from "firebase/firestore";

export const useQuoteGenerator = () => {
    const [quoteData, setQuoteData] = useState<QuoteData>({
        id: `QT${Date.now()}`,
        name: `Quote QT${Date.now()}`,
        createdAt: new Date().toISOString(),
        items: [],
        contactInfo: {
            name: "",
            email: "",
            phone: "",
            location: "",
            notes: "",
        },
        settings: {
            expirationDays: 30,
            projectDuration: 60,
            discountPercentage: 0,
            customNotes: "",
            pricingType: "totals",
            exportFormat: "pdf",
        },
        globalColor: undefined,
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Mock pricing calculation function
    const calculateItemPricing = (item: QuoteItem) => {
        const basePrice = item.width * item.height * item.quantity * 1200; // Mock calculation
        return { totalPrice: basePrice };
    };

    const addItem = useCallback((item: Omit<QuoteItem, "id">) => {
        setQuoteData((prev) => ({
            ...prev,
            items: [...prev.items, { ...item, id: `item-${Date.now()}` }],
        }));
    }, []);

    const updateItem = useCallback(
        (id: string, updates: Partial<QuoteItem>) => {
            setQuoteData((prev) => ({
                ...prev,
                items: prev.items.map((item) =>
                    item.id === id ? { ...item, ...updates } : item
                ),
            }));
        },
        []
    );

    const removeItem = useCallback((id: string) => {
        setQuoteData((prev) => ({
            ...prev,
            items: prev.items.filter((item) => item.id !== id),
        }));
    }, []);

    const updateContactInfo = useCallback((updates: Partial<ContactInfo>) => {
        setQuoteData((prev) => ({
            ...prev,
            contactInfo: { ...prev.contactInfo, ...updates },
        }));
    }, []);

    const updateQuoteName = useCallback((name: string) => {
        setQuoteData((prev) => ({
            ...prev,
            name,
        }));
    }, []);

    const updateSettings = useCallback((updates: Partial<QuoteSettings>) => {
        setQuoteData((prev) => ({
            ...prev,
            settings: { ...prev.settings, ...updates },
        }));
    }, []);

    const updateGlobalColor = useCallback((color: ColorOption | undefined) => {
        setQuoteData((prev) => ({
            ...prev,
            globalColor: color,
        }));
    }, []);

    const updateSettingsField = useCallback(
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

    const loadQuote = useCallback((quote: QuoteData) => {
        setQuoteData(quote);
        setError(null);
    }, []);

    const resetQuote = useCallback(() => {
        setQuoteData({
            id: `QT${Date.now()}`,
            name: `Quote QT${Date.now()}`,
            createdAt: new Date().toISOString(),
            items: [],
            contactInfo: {
                name: "",
                email: "",
                phone: "",
                location: "",
                notes: "",
            },
            settings: {
                expirationDays: 30,
                projectDuration: 60,
                discountPercentage: 0,
                customNotes: "",
                pricingType: "totals",
                exportFormat: "pdf",
            },
            globalColor: undefined,
        });
        setError(null);
    }, []);

    const calculateTotals = useCallback((): QuoteTotals => {
        const totalArea = quoteData.items.reduce(
            (sum, item) => sum + item.width * item.height * item.quantity,
            0
        );
        const totalPrice = quoteData.items.reduce(
            (sum, item) => sum + calculateItemPricing(item).totalPrice,
            0
        );

        // Apply discount
        const discountAmount =
            (totalPrice * quoteData.settings.discountPercentage) / 100;
        const discountedTotal = totalPrice - discountAmount;

        return {
            totalM2: totalArea,
            totalBefore: discountedTotal,
            totalAfter: discountedTotal,
            totalProfit: 0, // Mock value
            totalProfitPercentage: 0, // Mock value
            totalM2Price: totalArea > 0 ? discountedTotal / totalArea : 0,
            downPayment: discountedTotal * 0.8,
            supplyPayment: discountedTotal * 0.1,
            completePayment: discountedTotal * 0.1,
            // Legacy fields for compatibility
            totalArea,
            totalBeforeProfit: discountedTotal,
            totalPrice: discountedTotal,
            m2Price: totalArea > 0 ? discountedTotal / totalArea : 0,
            profitPercentage: 0, // Mock value
        };
    }, [quoteData.items, quoteData.settings.discountPercentage]);

    const saveQuote = useCallback(async () => {
        setLoading(true);
        try {
            console.log("Starting save quote process...");
            console.log("Quote data:", quoteData);

            // Check authentication status
            const { getAuth } = await import("firebase/auth");
            const auth = getAuth();
            const user = auth.currentUser;
            console.log(
                "Current user:",
                user ? user.email : "No user authenticated"
            );

            if (!user) {
                throw new Error(
                    "User not authenticated. Please log in to save quotes."
                );
            }

            console.log("Attempting to save to Firestore...");
            // Use quote name as document ID, sanitized for Firestore
            const sanitizedQuoteName = quoteData.name
                .replace(/[^a-zA-Z0-9]/g, "_") // Replace special chars with underscores
                .replace(/^_+|_+$/g, "") // Remove leading/trailing underscores
                .substring(0, 150); // Limit length

            // Function to recursively remove undefined values and replace with null
            const sanitizeForFirestore = (obj: unknown): unknown => {
                if (obj === null || obj === undefined) {
                    return null;
                }
                if (
                    typeof obj === "object" &&
                    !Array.isArray(obj) &&
                    obj !== null
                ) {
                    const sanitized: Record<string, unknown> = {};
                    for (const key in obj) {
                        if (obj.hasOwnProperty(key)) {
                            sanitized[key] = sanitizeForFirestore(
                                (obj as Record<string, unknown>)[key]
                            );
                        }
                    }
                    return sanitized;
                }
                if (Array.isArray(obj)) {
                    return obj.map(sanitizeForFirestore);
                }
                return obj;
            };

            // Handle production start date tracking
            const quoteDataToSave = { ...quoteData };
            
            // If status is changing to in_production and we don't have a production start date, set it
            if (quoteDataToSave.status === "in_production" && !quoteDataToSave.productionStartDate) {
                quoteDataToSave.productionStartDate = new Date().toISOString();
            }
            
            // Always update the updatedAt timestamp
            quoteDataToSave.updatedAt = new Date().toISOString();

            const sanitizedQuoteData = sanitizeForFirestore(quoteDataToSave);

            const { setDoc, doc } = await import("firebase/firestore");
            const docRef = doc(db, "quotes", sanitizedQuoteName);
            await setDoc(docRef, sanitizedQuoteData);
            console.log(
                "Quote saved successfully with ID:",
                sanitizedQuoteName
            );

            // Reset the quote data after successful save
            resetQuote();
        } catch (err) {
            console.error("Save quote error:", err);
            setError(
                `Failed to save quote: ${
                    err instanceof Error ? err.message : "Unknown error"
                }`
            );
            throw err;
        } finally {
            setLoading(false);
        }
    }, [quoteData]);

    const fetchQuotes = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            console.log("Fetching quotes from Firebase...");
            const querySnapshot = await getDocs(collection(db, "quotes"));
            const quotes: QuoteData[] = [];
            querySnapshot.forEach((doc) => {
                quotes.push({ id: doc.id, ...doc.data() } as QuoteData);
            });
            console.log("Fetched quotes:", quotes);
            return quotes;
        } catch (err) {
            console.error("Fetch quotes error:", err);
            setError(
                `Failed to fetch quotes: ${
                    err instanceof Error ? err.message : "Unknown error"
                }`
            );
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchQuoteById = useCallback(async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            console.log("Fetching quote by ID from Firebase:", id);
            const querySnapshot = await getDocs(collection(db, "quotes"));
            let quote: QuoteData | null = null;
            querySnapshot.forEach((doc) => {
                if (doc.data().id === id) {
                    quote = { id: doc.id, ...doc.data() } as QuoteData;
                }
            });
            if (!quote) {
                throw new Error("Quote not found");
            }
            console.log("Fetched quote:", quote);
            return quote;
        } catch (err) {
            console.error("Fetch quote by ID error:", err);
            setError(
                `Failed to fetch quote: ${
                    err instanceof Error ? err.message : "Unknown error"
                }`
            );
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteQuote = useCallback(async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            console.log("Deleting quote from Firebase:", id);
            const querySnapshot = await getDocs(collection(db, "quotes"));
            let docId: string | null = null;
            querySnapshot.forEach((doc) => {
                if (doc.data().id === id) {
                    docId = doc.id;
                }
            });
            if (!docId) {
                throw new Error("Quote not found");
            }
            const { deleteDoc, doc } = await import("firebase/firestore");
            await deleteDoc(doc(db, "quotes", docId));
            console.log("Quote deleted successfully:", id);
        } catch (err) {
            console.error("Delete quote error:", err);
            setError(
                `Failed to delete quote: ${
                    err instanceof Error ? err.message : "Unknown error"
                }`
            );
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const exportQuote = useCallback(
        async (type: "pdf" | "print") => {
            setLoading(true);
            setError(null);

            try {
                const totals = calculateTotals();

                // Function to generate SVG for PDF export
                const generateItemSvgForPdf = (item: QuoteItem) => {
                    let svgContent = "";

                    if (item.type === "curtain_wall") {
                        // For curtain wall, use the existing logic
                        if (item.designData?.panels) {
                            const { panels, wallWidth, wallHeight } =
                                item.designData;
                            const scale =
                                Math.min(120 / wallWidth, 80 / wallHeight) *
                                0.9;
                            const scaledWallWidth = wallWidth * scale;
                            const scaledWallHeight = wallHeight * scale;
                            const offsetX = (120 - scaledWallWidth) / 2;
                            const offsetY = (80 - scaledWallHeight) / 2;

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
                                svgElements += `<text x="${
                                    panelX + panelWidth / 2
                                }" y="${
                                    panelY + panelHeight / 2
                                }" text-anchor="middle" dominant-baseline="middle" font-size="5" fill="#333">${label}</text>`;
                            });

                            svgElements += `<text x="${
                                offsetX + scaledWallWidth / 2
                            }" y="${
                                offsetY - 2
                            }" text-anchor="middle" font-size="6" fill="#666">${wallWidth}m</text>`;
                            svgElements += `<text x="${offsetX - 2}" y="${
                                offsetY + scaledWallHeight / 2
                            }" text-anchor="middle" dominant-baseline="middle" font-size="6" fill="#666" transform="rotate(-90, ${
                                offsetX - 2
                            }, ${
                                offsetY + scaledWallHeight / 2
                            })">${wallHeight}m</text>`;

                            svgContent = `<svg width="120" height="80" viewBox="0 0 120 80">${svgElements}</svg>`;
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
                        const scale =
                            Math.min(120 / itemWidth, 80 / itemHeight) * 0.8;
                        const scaledWidth = itemWidth * scale;
                        const scaledHeight = itemHeight * scale;
                        const offsetX = (120 - scaledWidth) / 2;
                        const offsetY = (80 - scaledHeight) / 2;

                        let svgElements = "";
                        svgElements += `<rect x="${offsetX}" y="${offsetY}" width="${scaledWidth}" height="${scaledHeight}" fill="none" stroke="#374151" stroke-width="1" rx="1"/>`;

                        const glassInset = 3;
                        svgElements += `<rect x="${offsetX + glassInset}" y="${
                            offsetY + glassInset
                        }" width="${scaledWidth - glassInset * 2}" height="${
                            scaledHeight - glassInset * 2
                        }" fill="#87CEEB" stroke="#666" stroke-width="0.5" opacity="0.7"/>`;

                        if (system === "Sliding") {
                            const panelWidth =
                                (scaledWidth - glassInset * 2) / leaves;
                            for (let i = 0; i < leaves; i++) {
                                const panelX =
                                    offsetX + glassInset + i * panelWidth;
                                if (i > 0) {
                                    svgElements += `<line x1="${panelX}" y1="${
                                        offsetY + glassInset
                                    }" x2="${panelX}" y2="${
                                        offsetY + scaledHeight - glassInset
                                    }" stroke="#666" stroke-width="0.5"/>`;
                                }
                                const handleY = offsetY + scaledHeight / 2;
                                const handleSize = 3;
                                if (i === 0 || i === leaves - 1) {
                                    svgElements += `<circle cx="${
                                        panelX + panelWidth / 2
                                    }" cy="${handleY}" r="${handleSize}" fill="#666"/><rect x="${
                                        panelX + panelWidth / 2 - handleSize / 2
                                    }" y="${
                                        handleY - 0.5
                                    }" width="${handleSize}" height="1" fill="#666"/>`;
                                }
                            }
                        } else if (system === "hinged") {
                            const hingeSpacing = scaledHeight / (leaves + 1);
                            for (let i = 1; i <= leaves; i++) {
                                const hingeY = offsetY + i * hingeSpacing;
                                svgElements += `<circle cx="${offsetX}" cy="${hingeY}" r="1.5" fill="#666"/><circle cx="${
                                    offsetX + scaledWidth
                                }" cy="${hingeY}" r="1.5" fill="#666"/>`;
                            }
                            if (type === "door") {
                                const handleX =
                                    leaves === 1
                                        ? offsetX + scaledWidth - 6
                                        : offsetX + scaledWidth / 2;
                                const handleY = offsetY + scaledHeight / 2;
                                svgElements += `<circle cx="${handleX}" cy="${handleY}" r="1.5" fill="#FFD700"/><rect x="${
                                    handleX - 2
                                }" y="${
                                    handleY - 0.5
                                }" width="4" height="1" fill="#FFD700"/>`;
                            }
                        } else if (system === "fixed") {
                            svgElements += `<text x="${
                                offsetX + scaledWidth / 2
                            }" y="${
                                offsetY + scaledHeight / 2
                            }" text-anchor="middle" dominant-baseline="middle" font-size="6" fill="#666">Fixed</text>`;
                        }

                        svgElements += `<text x="${
                            offsetX + scaledWidth / 2
                        }" y="${
                            offsetY - 2
                        }" text-anchor="middle" font-size="6" fill="#666">${itemWidth}m</text>`;
                        svgElements += `<text x="${offsetX - 2}" y="${
                            offsetY + scaledHeight / 2
                        }" text-anchor="middle" dominant-baseline="middle" font-size="6" fill="#666" transform="rotate(-90, ${
                            offsetX - 2
                        }, ${
                            offsetY + scaledHeight / 2
                        })">${itemHeight}m</text>`;

                        svgContent = `<svg width="120" height="80" viewBox="0 0 120 80">${svgElements}</svg>`;
                    }

                    return svgContent;
                };

                if (type === "pdf") {
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
          <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <title>Cocoon Aluminum Works - Quotation</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              
              body {
                font-family: 'Inter', Arial, sans-serif;
                line-height: 1.6;
                color: #1a202c;
                background: #ffffff;
                font-size: 14px;
              }
              
              .container {
                max-width: 1000px;
                margin: 0 auto;
                padding: 40px;
              }
              
              .header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 40px;
                padding: 30px 0;
                border-bottom: 3px solid #e53e3e;
                position: relative;
              }
              
              .header::after {
                content: '';
                position: absolute;
                bottom: -3px;
                left: 0;
                width: 100px;
                height: 3px;
                background: linear-gradient(90deg, #e53e3e, #ff6b6b);
              }
              
              .logo-section {
                display: flex;
                align-items: center;
                gap: 20px;
              }
              
              .logo {
                width: 80px;
                height: 80px;
                border-radius: 12px;
                object-fit: cover;
                box-shadow: 0 8px 25px rgba(0,0,0,0.1);
              }
              
              .company-info {
                flex: 1;
              }
              
              .company-name {
                font-size: 24px;
                font-weight: 700;
                color: #1a202c;
                margin-bottom: 4px;
                letter-spacing: -0.5px;
              }
              
              .company-tagline {
                font-size: 14px;
                color: #718096;
                font-weight: 400;
              }
              
              .quote-badge {
                background: linear-gradient(135deg, #e53e3e, #ff6b6b);
                color: white;
                padding: 12px 24px;
                border-radius: 25px;
                font-weight: 600;
                font-size: 16px;
                box-shadow: 0 4px 15px rgba(229, 62, 62, 0.3);
              }
              
              .quote-details {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 30px;
                margin-bottom: 40px;
              }
              
              .detail-card {
                background: linear-gradient(135deg, #f7fafc, #edf2f7);
                padding: 24px;
                border-radius: 16px;
                border: 1px solid #e2e8f0;
                position: relative;
                overflow: hidden;
              }
              
              .detail-card::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 4px;
                background: linear-gradient(90deg, #e53e3e, #ff6b6b);
              }
              
              .detail-card h3 {
                font-size: 16px;
                font-weight: 600;
                color: #2d3748;
                margin-bottom: 16px;
                display: flex;
                align-items: center;
                gap: 8px;
              }
              
              .detail-card p {
                margin-bottom: 8px;
                display: flex;
                justify-content: space-between;
                align-items: center;
              }
              
              .detail-label {
                font-weight: 500;
                color: #4a5568;
                font-size: 13px;
              }
              
              .detail-value {
                font-weight: 600;
                color: #1a202c;
              }
              
              .items-section {
                margin-bottom: 40px;
              }
              
              .section-title {
                font-size: 20px;
                font-weight: 600;
                color: #1a202c;
                margin-bottom: 20px;
                padding-bottom: 8px;
                border-bottom: 2px solid #e2e8f0;
                display: flex;
                align-items: center;
                gap: 10px;
              }
              
              .items-table {
                width: 100%;
                border-collapse: separate;
                border-spacing: 0;
                background: #ffffff;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 25px rgba(0,0,0,0.08);
                border: 1px solid #e2e8f0;
              }
              
              .items-table thead {
                background: linear-gradient(135deg, #1a202c, #2d3748);
              }
              
              .items-table th {
                padding: 16px 12px;
                color: white;
                font-weight: 600;
                font-size: 12px;
                text-align: left;
                letter-spacing: 0.5px;
                text-transform: uppercase;
              }
              
              .items-table td {
                padding: 16px 12px;
                border-bottom: 1px solid #e2e8f0;
                vertical-align: middle;
                font-size: 13px;
              }
              
              .items-table tbody tr:hover {
                background-color: #f7fafc;
              }
              
              .items-table tbody tr:last-child td {
                border-bottom: none;
              }
              
              .item-name {
                font-weight: 600;
                color: #1a202c;
              }
              
              .dimension-value {
                font-weight: 500;
                color: #4a5568;
              }
              
              .specs-container {
                display: flex;
                flex-wrap: wrap;
                gap: 4px;
                max-width: 200px;
              }
              
              .spec-tag {
                display: inline-block;
                padding: 4px 8px;
                border-radius: 6px;
                font-size: 10px;
                font-weight: 500;
                text-align: center;
                line-height: 1.2;
              }
              
              .glass-double {
                background: linear-gradient(135deg, #3182ce, #63b3ed);
                color: white;
              }
              
              .glass-single {
                background: linear-gradient(135deg, #718096, #a0aec0);
                color: white;
              }
              
              .tag-net {
                background: linear-gradient(135deg, #38a169, #68d391);
                color: white;
              }
              
              .tag-arch {
                background: linear-gradient(135deg, #d69e2e, #f6e05e);
                color: #1a202c;
              }
              
              .system-badge {
                background: linear-gradient(135deg, #805ad5, #b794f6);
                color: white;
                padding: 6px 12px;
                border-radius: 8px;
                font-weight: 500;
                font-size: 11px;
                text-align: center;
              }
              
              .price-value {
                font-weight: 700;
                color: #e53e3e;
                font-size: 14px;
                text-align: right;
              }

              .preview-cell {
                text-align: center;
                padding: 8px;
                background: #ffffff;
                border-radius: 6px;
              }

              .preview-cell svg {
                max-width: 120px;
                max-height: 80px;
                border: 1px solid #e2e8f0;
                border-radius: 4px;
              }
              
              .totals-section {
                margin-bottom: 30px;
              }
              
              .totals-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-bottom: 30px;
              }
              
              .total-card {
                background: linear-gradient(135deg, #1a202c, #2d3748);
                color: white;
                padding: 24px;
                border-radius: 16px;
                text-align: center;
                position: relative;
                overflow: hidden;
              }
              
              .total-card::before {
                content: '';
                position: absolute;
                top: -50%;
                right: -50%;
                width: 100%;
                height: 100%;
                background: linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent);
                transform: rotate(45deg);
              }
              
              .total-label {
                font-size: 14px;
                font-weight: 500;
                opacity: 0.8;
                margin-bottom: 8px;
              }
              
              .total-value {
                font-size: 24px;
                font-weight: 700;
                color: #ff6b6b;
              }
              
              .payment-schedule {
                background: linear-gradient(135deg, #f7fafc, #edf2f7);
                padding: 24px;
                border-radius: 16px;
                border: 1px solid #e2e8f0;
                margin-bottom: 30px;
              }
              
              .payment-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 20px;
                margin-top: 16px;
              }
              
              .payment-item {
                text-align: center;
                padding: 16px;
                background: white;
                border-radius: 12px;
                border: 2px solid #e2e8f0;
                transition: all 0.3s ease;
              }
              
              .payment-item:hover {
                border-color: #e53e3e;
                transform: translateY(-2px);
              }
              
              .payment-label {
                font-size: 12px;
                font-weight: 500;
                color: #4a5568;
                margin-bottom: 8px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              
              .payment-amount {
                font-size: 18px;
                font-weight: 700;
                color: #1a202c;
              }
              
              .validity-section {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-bottom: 30px;
              }
              
              .validity-card {
                background: linear-gradient(135deg, #e53e3e, #ff6b6b);
                color: white;
                padding: 20px;
                border-radius: 12px;
                text-align: center;
              }
              
              .validity-label {
                font-size: 14px;
                opacity: 0.9;
                margin-bottom: 8px;
              }
              
              .validity-value {
                font-size: 20px;
                font-weight: 700;
              }
              
              .notes-section {
                background: linear-gradient(135deg, #fff8e1, #ffecb3);
                padding: 24px;
                border-radius: 16px;
                border-left: 5px solid #ffa726;
                margin-bottom: 40px;
              }
              
              .notes-title {
                font-size: 16px;
                font-weight: 600;
                color: #ef6c00;
                margin-bottom: 12px;
                display: flex;
                align-items: center;
                gap: 8px;
              }
              
              .notes-content {
                color: #5d4037;
                line-height: 1.7;
              }
              
              .footer {
                margin-top: 50px;
                padding: 30px;
                background: linear-gradient(135deg, #1a202c, #2d3748);
                color: white;
                border-radius: 16px;
                text-align: center;
                position: relative;
                overflow: hidden;
              }
              
              .footer::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 4px;
                background: linear-gradient(90deg, #e53e3e, #ff6b6b, #e53e3e);
              }
              
              .footer-title {
                font-size: 20px;
                font-weight: 700;
                margin-bottom: 16px;
                color: #ff6b6b;
              }
              
              .footer-content {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 20px;
                margin-top: 20px;
              }
              
              .footer-section  {
              display:flex;
              flex-direction:column;
              justify-content: start;
    
    align-items: flex-start;
                margin-bottom: 8px;
                font-size: 13px;
                opacity: 0.9;
              }
              
              .footer-section strong {
                color: #ff6b6b;
              }
              
              @media print {
                body { 
                  margin: 0; 
                  font-size: 12px;
                }
                .container {
                  padding: 20px;
                  max-width: none;
                }
                .no-print { 
                  display: none; 
                }
                .header {
                  margin-bottom: 30px;
                  padding: 20px 0;
                }
                .quote-details,
                .totals-grid,
                .payment-grid,
                .validity-section,
                .footer-content {
                  page-break-inside: avoid;
                }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <header class="header">
                <div class="logo-section">
                  <img src="https://img1.wsimg.com/isteam/ip/b11b2784-66bc-4ac4-9b05-6ba6d416d22d/Untitled%20design%20(1).jpg" alt="Cocoon Logo" class="logo" />
                  <div class="company-info">
                    <h1 class="company-name">Cocoon Aluminum Works</h1>
                    <p class="company-tagline">Premium Aluminum Solutions & Installation</p>
                  </div>
                </div>
                
              </header>

              <div class="quote-details">
                <div class="detail-card">
                  <h3>📋 Quote Information</h3>
                  <p><span class="detail-label">Quote Name:</span> <span class="detail-value">${
                      quoteData.name
                  }</span></p>
                  <p><span class="detail-label">Quote ID:</span> <span class="detail-value">${
                      quoteData.id
                  }</span></p>
                  <p><span class="detail-label">Date:</span> <span class="detail-value">${new Date().toLocaleDateString(
                      "en-GB"
                  )}</span></p>
                  <p><span class="detail-label">Valid Until:</span> <span class="detail-value">${new Date(
                      Date.now() + 3 * 24 * 60 * 60 * 1000
                  ).toLocaleDateString("en-GB")}</span></p>
                </div>
                
                <div class="detail-card">
                  <h3>👤 Customer Details</h3>
                  <p><span class="detail-label">Name:</span> <span class="detail-value">${
                      quoteData.contactInfo.name || "Not Provided"
                  }</span></p>
                  <p><span class="detail-label">Location:</span> <span class="detail-value">${
                      quoteData.contactInfo.location || "Not Provided"
                  }</span></p>
                  <p><span class="detail-label">Duration:</span> <span class="detail-value">${
                      quoteData.settings.projectDuration
                  } Days</span></p>
                </div>
              </div>

              <div class="items-section">
                <h2 class="section-title">🔧 Project Items & Specifications</h2>
                <table class="items-table">
                  <thead>
                    <tr>
                      <th>Item Description</th>
                      <th>Preview</th>
                      <th>Width (m)</th>
                      <th>Height (m)</th>
                      <th>Qty</th>
                      <th>Area (m²)</th>
                      <th>Specifications</th>
                      <th>System</th>
                      <th>Price (EGP)</th>
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
                                    ? "Skylight"
                                    : "Curtain Wall";
                            const itemName =
                                item.system !== "Curtain Wall"
                                    ? `${item.system} ${itemType} ${index + 1}`
                                    : `${item.system} ${index + 1}`;
                            const area = (
                                item.width *
                                item.height *
                                item.quantity
                            ).toFixed(2);

                            let specs = "";
                            if (item.system === "Curtain Wall") {
                                specs =
                                    '<span class="spec-tag glass-double">Tempered Double Glazed 6MM + 21.3MM + 6MM Clear + Argon</span>';
                            } else {
                                if (item.glassType === "double") {
                                    specs =
                                        '<span class="spec-tag glass-double">Tempered Double Glazed 6MM + 6MM + Argon</span>';
                                } else {
                                    specs =
                                        '<span class="spec-tag glass-single">Tempered Single Glazed 6MM</span>';
                                }
                            }

                            if (item.mosquito) {
                                specs +=
                                    '<span class="spec-tag tag-net">Mosquito Net</span>';
                            }
                            if (item.arch) {
                                specs +=
                                    '<span class="spec-tag tag-arch">Arch Trave</span>';
                            }

                            const itemPrice = Math.round(
                                calculateItemPricing(item).totalPrice
                            );

                            const svgPreview = generateItemSvgForPdf(item);

                            return `
                        <tr>
                          <td class="item-name">${itemName}</td>
                          <td class="preview-cell">${svgPreview}</td>
                          <td class="dimension-value">${item.width.toFixed(
                              2
                          )}</td>
                          <td class="dimension-value">${item.height.toFixed(
                              2
                          )}</td>
                          <td class="dimension-value">${item.quantity}</td>
                          <td class="dimension-value">${area}</td>
                          <td><div class="specs-container">${specs}</div></td>
                          <td><div class="system-badge">${
                              item.system
                          }</div></td>
                          <td class="price-value">${itemPrice.toLocaleString()} EGP</td>
                        </tr>
                      `;
                        })
                        .join("")}
                  </tbody>
                </table>
              </div>

              <div class="totals-section">
                <div class="totals-grid">
                  <div class="total-card">
                    <div class="total-label">Total Project Value</div>
                    <div class="total-value">${Math.round(
                        totals.totalPrice
                    ).toLocaleString()} EGP</div>
                  </div>
                  <div class="total-card">
                    <div class="total-label">Total Coverage Area</div>
                    <div class="total-value">${totals.totalArea.toFixed(
                        2
                    )} m²</div>
                  </div>
                </div>

                <div class="payment-schedule">
                  <div class="payment-grid">
                    <div class="payment-item">
                      <div class="payment-label">Down Payment</div>
                      <div class="payment-amount">${Math.round(
                          totals.downPayment
                      ).toLocaleString()} EGP</div>
                    </div>
                    <div class="payment-item">
                      <div class="payment-label">On Supply</div>
                      <div class="payment-amount">${Math.round(
                          totals.supplyPayment
                      ).toLocaleString()} EGP</div>
                    </div>
                    <div class="payment-item">
                      <div class="payment-label">On Completion</div>
                      <div class="payment-amount">${Math.round(
                          totals.completePayment
                      ).toLocaleString()} EGP</div>
                    </div>
                  </div>
                </div>

                <div class="validity-section">
                  <div class="validity-card">
                    <div class="validity-label">Offer Valid For</div>
                    <div class="validity-value">3 Days</div>
                  </div>
                  <div class="validity-card">
                    <div class="validity-label">Project Duration</div>
                    <div class="validity-value">${
                        quoteData.settings.projectDuration
                    } Days</div>
                  </div>
                </div>
              </div>

              ${
                  quoteData.settings.customNotes
                      ? `
                <div class="notes-section">
                  <h3 class="notes-title">📝 Special Notes & Terms</h3>
                  <div class="notes-content">${quoteData.settings.customNotes.replace(
                      /\n/g,
                      "<br>"
                  )}</div>
                </div>
              `
                      : ""
              }

              <footer class="footer">
                <h3 class="footer-title">Cocoon Company for Aluminum Works</h3>
                <div class="footer-content">
                  <div class="footer-section">
                    <p><strong>Address:</strong> 61 Seventh Neighborhood, Fourth District</p>
                    <p>El-Shaikh Zayed, Giza, Egypt</p>
                    <p><strong>Phone:</strong> +20 2 38501291</p>
                    <p><strong>Mobile:</strong> +20 11 51717149</p>
                  </div>
                  <div class="footer-section">
                    <p><strong>Email:</strong> sales.department@cocoonaluminum.com</p>
                    <p><strong>Website:</strong> www.cocoonaluminum.com</p>
                    <p><strong>Quality Assured:</strong> Premium Materials & Expert Installation</p>
                    <p><strong>Warranty:</strong> Comprehensive Coverage Included</p>
                  </div>
                </div>
              </footer>
            </div>

            <script>
              // Enhanced number formatting with Arabic locale support
              function formatNumberWithCommas(num) {
                return new Intl.NumberFormat('en-EG', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                }).format(num);
              }

              // Format all currency values
              document.addEventListener('DOMContentLoaded', function() {
                document.querySelectorAll('.price-value, .total-value, .payment-amount').forEach(el => {
                  const text = el.textContent;
                  const match = text.match(/([\d,]+)/);
                  if (match) {
                    const number = parseInt(match[1].replace(/,/g, ''));
                    if (!isNaN(number)) {
                      el.textContent = text.replace(match[1], formatNumberWithCommas(number));
                    }
                  }
                });

                // Auto-print after content loads
                setTimeout(() => {
                  window.print();
                }, 1000);
              });
            </script>
          </body>
          </html>
        `;

                    printWindow.document.write(htmlContent);
                    printWindow.document.close();

                    printWindow.onload = () => {
                        setTimeout(() => {
                            printWindow.print();
                            console.log("Professional PDF export completed");
                        }, 500);
                    };
                } else if (type === "print") {
                    // Simplified print version
                    const printWindow = window.open("", "_blank");
                    if (printWindow) {
                        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>Quote - ${quoteData.id}</title>
              <style>
                body { font-family: 'Inter', Arial, sans-serif; margin: 20px; line-height: 1.6; }
                .header { text-align: center; margin-bottom: 30px; padding: 20px; border-bottom: 3px solid #e53e3e; }
                .header h1 { color: #1a202c; margin-bottom: 10px; }
                .section { margin-bottom: 25px; }
                .section h2 { color: #2d3748; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; }
                th { background-color: #1a202c; color: white; font-weight: 600; }
                .summary { background: #f7fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #e53e3e; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>COCOON ALUMINUM QUOTATION</h1>
                <p>Quote Name: ${quoteData.name} | Quote ID: ${
                            quoteData.id
                        } | Date: ${new Date().toLocaleDateString()}</p>
              </div>
              <div class="section">
                <h2>Customer Information</h2>
                <p><strong>Name:</strong> ${
                    quoteData.contactInfo.name || "Not specified"
                }</p>
                <p><strong>Email:</strong> ${
                    quoteData.contactInfo.email || "Not specified"
                }</p>
                <p><strong>Phone:</strong> ${
                    quoteData.contactInfo.phone || "Not specified"
                }</p>
                <p><strong>Location:</strong> ${
                    quoteData.contactInfo.location || "Not specified"
                }</p>
              </div>
              <div class="section">
                <h2>Project Items</h2>
                <table>
                  <tr><th>Item</th><th>Dimensions</th><th>System</th><th>Area (m²)</th><th>Price (EGP)</th></tr>
                  ${quoteData.items
                      .map(
                          (item: QuoteItem, index: number) => `
                    <tr>
                      <td>${item.type} ${index + 1}</td>
                      <td>${item.width}m × ${item.height}m</td>
                      <td>${item.system}</td>
                      <td>${(item.width * item.height * item.quantity).toFixed(
                          2
                      )}</td>
                      <td>${Math.round(
                          calculateItemPricing(item).totalPrice
                      ).toLocaleString()}</td>
                    </tr>
                  `
                      )
                      .join("")}
                </table>
              </div>
              <div class="summary">
                <h2>Project Summary</h2>
                <p><strong>Total Area:</strong> ${totals.totalArea.toFixed(
                    2
                )} m²</p>
                <p><strong>Total Price:</strong> ${Math.round(
                    totals.totalPrice
                ).toLocaleString()} EGP</p>
                <p><strong>Project Duration:</strong> ${
                    quoteData.settings.projectDuration
                } Days</p>
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
        },
        [quoteData, calculateTotals]
    );

    const updateQuoteStatus = useCallback(async (quoteId: string, newStatus: QuoteStatus) => {
        setLoading(true);
        setError(null);
        try {
            console.log("Updating quote status:", quoteId, "to", newStatus);
            
            // Get current quote data
            const { getDoc, doc, setDoc } = await import("firebase/firestore");
            const docRef = doc(db, "quotes", quoteId);
            const docSnap = await getDoc(docRef);
            
            if (!docSnap.exists()) {
                throw new Error("Quote not found");
            }
            
            const currentData = docSnap.data() as QuoteData;
            const updatedData = { ...currentData };
            
            // Update status
            updatedData.status = newStatus;
            updatedData.updatedAt = new Date().toISOString();
            
            // If changing to in_production and no production start date, set it
            if (newStatus === "in_production" && !updatedData.productionStartDate) {
                updatedData.productionStartDate = new Date().toISOString();
            }
            
            // If changing to completed, set actual completion date
            if (newStatus === "completed" && !updatedData.actualCompletionDate) {
                updatedData.actualCompletionDate = new Date().toISOString();
            }
            
            await setDoc(docRef, updatedData);
            console.log("Quote status updated successfully");
            
            return updatedData;
        } catch (err) {
            console.error("Update quote status error:", err);
            setError(
                `Failed to update quote status: ${
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
        updateQuoteName,
        updateSettings: updateSettingsField,
        updateGlobalColor,
        calculateTotals,
        saveQuote,
        exportQuote,
        fetchQuotes,
        fetchQuoteById,
        deleteQuote,
        updateQuoteStatus,
        loadQuote,
        resetQuote,
        loading,
        error,
    };
};
