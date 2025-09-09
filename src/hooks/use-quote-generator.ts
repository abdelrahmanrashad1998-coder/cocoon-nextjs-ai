import { useState, useCallback, useEffect, useRef } from "react";
import {
    QuoteItem,
    QuoteData,
    ContactInfo,
    QuoteSettings,
    QuoteTotals,
    ColorOption,
    QuoteStatus,
    QuoteHistoryEntry,
} from "@/types/quote";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { calculateItemPricing, calculateQuoteTotals } from "@/lib/pricing-calculator";

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
        status: "draft",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
    const [lastSaved, setLastSaved] = useState<string | null>(null);
    const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const lastQuoteDataRef = useRef<QuoteData | null>(null);

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
            status: "draft",
            history: [],
        });

        setError(null);
        setLastSaved(null);
        lastQuoteDataRef.current = null;
    }, []);

    // Auto-save functionality
    const autoSaveQuote = useCallback(async (isManualSave = false) => {
        if (!autoSaveEnabled || loading) return;

        try {
            // Check if quote has meaningful data to save
            const hasData = quoteData.contactInfo.name?.trim() || quoteData.items.length > 0;
            if (!hasData) return;

            // Check if data has changed since last save
            const currentDataString = JSON.stringify(quoteData);
            const lastDataString = lastQuoteDataRef.current ? JSON.stringify(lastQuoteDataRef.current) : null;
            
            if (currentDataString === lastDataString && !isManualSave) return;

            console.log("Auto-saving quote...");
            
            // Create history entry for both manual and auto saves
            const historyEntry: QuoteHistoryEntry = {
                id: `history-${Date.now()}`,
                timestamp: new Date().toISOString(),
                data: { ...quoteData },
                changeDescription: isManualSave ? "Manual save" : "Auto-save",
                savedBy: "Current User",
            };

            const quoteDataToSave = {
                ...quoteData,
                updatedAt: new Date().toISOString(),
                lastAutoSaved: new Date().toISOString(),
                history: [...(quoteData.history || []), historyEntry].slice(-10), // Keep only last 10 history entries
            };

            // Handle production start date tracking
            if (
                quoteDataToSave.status === "in_production" &&
                !quoteDataToSave.productionStartDate
            ) {
                quoteDataToSave.productionStartDate = new Date().toISOString();
            }

            // Save to Firebase
            const { getAuth } = await import("firebase/auth");
            const auth = getAuth();
            const user = auth.currentUser;

            if (!user) {
                console.warn("User not authenticated for auto-save");
                return;
            }

            const sanitizedQuoteName = quoteData.name
                .replace(/[^a-zA-Z0-9]/g, "_")
                .replace(/^_+|_+$/g, "")
                .substring(0, 150);

            // Ensure the ID matches the document ID
            quoteDataToSave.id = sanitizedQuoteName;

            const sanitizeForFirestore = (obj: unknown): unknown => {
                if (obj === null || obj === undefined) {
                    return null;
                }
                if (typeof obj === "object" && !Array.isArray(obj) && obj !== null) {
                    const sanitized: Record<string, unknown> = {};
                    for (const key in obj) {
                        if (obj.hasOwnProperty(key)) {
                            sanitized[key] = sanitizeForFirestore((obj as Record<string, unknown>)[key]);
                        }
                    }
                    return sanitized;
                }
                if (Array.isArray(obj)) {
                    return obj.map(sanitizeForFirestore);
                }
                return obj;
            };

            const sanitizedQuoteData = sanitizeForFirestore(quoteDataToSave);
            const { setDoc, doc } = await import("firebase/firestore");
            const docRef = doc(db, "quotes", sanitizedQuoteName);
            await setDoc(docRef, sanitizedQuoteData);

            // Update local state
            lastQuoteDataRef.current = { ...quoteDataToSave };
            setLastSaved(new Date().toISOString());
            
            // Always update the quote data with history for both manual and auto saves
            setQuoteData(quoteDataToSave);

            console.log("Auto-save completed successfully");
            
            // Show toast notification for auto-save (only for auto-saves, not manual saves)
            if (!isManualSave) {
                const { toast } = await import("sonner");
                toast.success("Quote auto-saved", {
                    description: `Saved at ${new Date().toLocaleTimeString()}`,
                    duration: 2000,
                });
            }
        } catch (error) {
            console.error("Auto-save failed:", error);
        }
    }, [quoteData, autoSaveEnabled, loading]);

    // Set up auto-save interval
    useEffect(() => {
        if (autoSaveEnabled) {
            autoSaveIntervalRef.current = setInterval(() => {
                autoSaveQuote(false);
            }, 60000); // Auto-save every minute

            return () => {
                if (autoSaveIntervalRef.current) {
                    clearInterval(autoSaveIntervalRef.current);
                }
            };
        }
    }, [autoSaveEnabled, autoSaveQuote]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (autoSaveIntervalRef.current) {
                clearInterval(autoSaveIntervalRef.current);
            }
        };
    }, []);

    // History management functions
    const addToHistory = useCallback((changeDescription: string) => {
        const historyEntry: QuoteHistoryEntry = {
            id: `history-${Date.now()}`,
            timestamp: new Date().toISOString(),
            data: { ...quoteData },
            changeDescription,
            savedBy: "Current User",
        };

        setQuoteData(prev => ({
            ...prev,
            history: [...(prev.history || []), historyEntry].slice(-10), // Keep only last 10 entries
        }));
    }, [quoteData]);

    const restoreFromHistory = useCallback((historyEntry: QuoteHistoryEntry) => {
        setQuoteData(historyEntry.data);
        setLastSaved(historyEntry.timestamp);
        lastQuoteDataRef.current = historyEntry.data;
    }, []);

    const clearHistory = useCallback(() => {
        setQuoteData(prev => ({
            ...prev,
            history: [],
        }));
    }, []);

    const calculateTotals = useCallback((): QuoteTotals => {
        // Calculate pricing for all items
        const pricedItems = quoteData.items.map(item => calculateItemPricing(item));
        
        // Calculate totals using the proper pricing calculator
        const totals = calculateQuoteTotals(pricedItems);
        
        // Apply discount to the total after profit
        const discountAmount = (totals.totalAfter * quoteData.settings.discountPercentage) / 100;
        const discountedTotal = totals.totalAfter - discountAmount;
        
        // Recalculate profit percentage after discount
        const adjustedProfit = totals.totalProfit - discountAmount;
        const adjustedProfitPercentage = discountedTotal > 0 ? (adjustedProfit / discountedTotal) * 100 : 0;

        return {
            totalM2: totals.totalM2,
            totalBefore: totals.totalBefore,
            totalAfter: discountedTotal,
            totalProfit: adjustedProfit,
            totalProfitPercentage: adjustedProfitPercentage,
            totalM2Price: totals.totalM2 > 0 ? discountedTotal / totals.totalM2 : 0,
            downPayment: discountedTotal * 0.8,
            supplyPayment: discountedTotal * 0.1,
            completePayment: discountedTotal * 0.1,
            // Legacy fields for compatibility
            totalArea: totals.totalM2,
            totalBeforeProfit: totals.totalBefore,
            totalPrice: discountedTotal,
            m2Price: totals.totalM2 > 0 ? discountedTotal / totals.totalM2 : 0,
            profitPercentage: adjustedProfitPercentage,
        };
    }, [quoteData.items, quoteData.settings.discountPercentage]);

    const saveQuote = useCallback(async () => {
        setLoading(true);
        try {
            console.log("Starting manual save quote process...");
            
            // Use the auto-save function with manual flag
            await autoSaveQuote(true);
            
            console.log("Manual save completed successfully");
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
    }, [autoSaveQuote]);

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

                                if (
                                    panel.col !== undefined &&
                                    panel.row !== undefined
                                ) {
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
                                            i <
                                            item.designData.columnSizes.length;
                                            i++
                                        ) {
                                            cumulativeColumnPositions.push(
                                                cumulativeColumnPositions[i] +
                                                    item.designData.columnSizes[
                                                        i
                                                    ]
                                            );
                                        }
                                    } else {
                                        const uniformColumnWidth =
                                            wallWidth /
                                            (item.designData?.columns || 4);
                                        for (
                                            let i = 0;
                                            i <=
                                            (item.designData?.columns || 4);
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
                                            wallHeight /
                                            (item.designData?.rows || 3);
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
                                    const leftMeters =
                                        cumulativeColumnPositions[col];
                                    const topMeters =
                                        cumulativeRowPositions[row];
                                    const rightMeters =
                                        cumulativeColumnPositions[
                                            Math.min(
                                                col + colSpan,
                                                cumulativeColumnPositions.length -
                                                    1
                                            )
                                        ];
                                    const bottomMeters =
                                        cumulativeRowPositions[
                                            Math.min(
                                                row + rowSpan,
                                                cumulativeRowPositions.length -
                                                    1
                                            )
                                        ];

                                    // Convert to SVG coordinates
                                    panelX =
                                        offsetX +
                                        (leftMeters / totalWidth) *
                                            scaledWallWidth;
                                    panelY =
                                        offsetY +
                                        (topMeters / totalHeight) *
                                            scaledWallHeight;
                                    panelWidth =
                                        ((rightMeters - leftMeters) /
                                            totalWidth) *
                                        scaledWallWidth;
                                    panelHeight =
                                        ((bottomMeters - topMeters) /
                                            totalHeight) *
                                        scaledWallHeight;
                                } else if (
                                    panel.left !== undefined &&
                                    panel.top !== undefined &&
                                    panel.width !== undefined &&
                                    panel.height !== undefined
                                ) {
                                    // Fallback to percentage-based positioning
                                    panelX =
                                        offsetX +
                                        (panel.left / 100) * scaledWallWidth;
                                    panelY =
                                        offsetY +
                                        (panel.top / 100) * scaledWallHeight;
                                    panelWidth =
                                        (panel.width / 100) * scaledWallWidth;
                                    panelHeight =
                                        (panel.height / 100) * scaledWallHeight;
                                } else {
                                    // Final fallback to meter-based positioning
                                    panelWidth =
                                        (panel.widthMeters / wallWidth) *
                                        scaledWallWidth;
                                    panelHeight =
                                        (panel.heightMeters / wallHeight) *
                                        scaledWallHeight;
                                    panelX =
                                        offsetX +
                                        (panel.left / 100) * scaledWallWidth;
                                    panelY =
                                        offsetY +
                                        (panel.top / 100) * scaledWallHeight;
                                }

                                // All panels use the same blue color as hinged panels
                                let fillColor = "#87CEEB";
                                let strokeColor = "#666";

                                svgElements += `<rect x="${panelX}" y="${panelY}" width="${panelWidth}" height="${panelHeight}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="1" opacity="0.7"/>`;

                                // Add V shape for window panels, labels for fixed and door panels
                                if (panel.type === "window") {
                                    // Add V shape for window panels
                                    const panelCenterX = panelX + panelWidth / 2;
                                    const panelCenterY = panelY + panelHeight / 2;
                                    const vSize = Math.min(panelWidth, panelHeight) * 0.6;
                                    
                                    svgElements += `<path d="M ${panelCenterX - vSize/2} ${panelCenterY - vSize/2} 
                                          L ${panelCenterX} ${panelCenterY + vSize/2} 
                                          L ${panelCenterX + vSize/2} ${panelCenterY - vSize/2}" 
                                          stroke="#FFD700" stroke-width="1" fill="none"/>`;
                                } else if (panel.type === "door" || panel.type === "structure") {
                                    // Add labels for door and fixed panels
                                    const label = panel.type === "structure" ? "Fixed" : "Door";
                                    svgElements += `<text x="${
                                        panelX + panelWidth / 2
                                    }" y="${
                                        panelY + panelHeight / 2
                                    }" text-anchor="middle" dominant-baseline="middle" font-size="5" fill="#333" font-weight="bold">${label}</text>`;
                                }
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
                        const glassInset = 3;
                        
                        // Draw main frame and glass panel (skip for hinged items as they have individual sash panels)
                        if (system !== "hinged") {
                            svgElements += `<rect x="${offsetX}" y="${offsetY}" width="${scaledWidth}" height="${scaledHeight}" fill="none" stroke="#374151" stroke-width="1" rx="1"/>`;
                            svgElements += `<rect x="${offsetX + glassInset}" y="${
                                offsetY + glassInset
                            }" width="${scaledWidth - glassInset * 2}" height="${
                                scaledHeight - glassInset * 2
                            }" fill="#87CEEB" stroke="#666" stroke-width="0.5" opacity="0.7"/>`;
                        }

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
                            // Draw individual sash panels for hinged items - stacked vertically
                            const sashHeight = scaledHeight / leaves;
                            const sashInset = 1; // Inset for each sash panel
                            
                            for (let i = 0; i < leaves; i++) {
                                const sashY = offsetY + i * sashHeight;
                                const sashPanelHeight = sashHeight - sashInset;
                                
                                // Check if this is the top panel and should be fixed
                                const isTopPanel = i === 0;
                                const isFixedUpperPanel = isTopPanel && leaves === 2 && type === "window" && item.upperPanelType === "fixed";
                                
                                // Draw individual sash panel
                                svgElements += `<rect x="${offsetX + sashInset/2}" y="${sashY + sashInset/2}" 
                                      width="${scaledWidth - sashInset}" height="${sashPanelHeight}"
                                      fill="none" stroke="#666" stroke-width="0.5" rx="0.5"/>`;
                                
                                // Draw glass panel within each sash
                                const glassInsetSash = 1.5;
                                svgElements += `<rect x="${offsetX + sashInset/2 + glassInsetSash}" y="${sashY + sashInset/2 + glassInsetSash}"
                                      width="${scaledWidth - sashInset - glassInsetSash * 2}" height="${sashPanelHeight - glassInsetSash * 2}"
                                      fill="#87CEEB" stroke="#666" stroke-width="0.3" opacity="0.7"/>`;
                                
                                // Draw hinges only for hinged panels (not for fixed upper panel)
                                if (!isFixedUpperPanel) {
                                    const hingeY = sashY + sashHeight / 2;
                                    svgElements += `<circle cx="${offsetX}" cy="${hingeY}" r="1" fill="#666"/><circle cx="${
                                        offsetX + scaledWidth
                                    }" cy="${hingeY}" r="1" fill="#666"/>`;
                                }
                                
                                // Add V shape for hinged panels or "Fixed" label for fixed upper panel
                                if (type === "door" || type === "window") {
                                    const glassX = offsetX + sashInset/2 + glassInsetSash;
                                    const glassY = sashY + sashInset/2 + glassInsetSash;
                                    const glassWidth = scaledWidth - sashInset - glassInsetSash * 2;
                                    const glassHeight = sashPanelHeight - glassInsetSash * 2;
                                    
                                    if (isFixedUpperPanel) {
                                        // Add "Fixed" label for fixed upper panel
                                        const glassCenterX = glassX + glassWidth / 2;
                                        const glassCenterY = glassY + glassHeight / 2;
                                        svgElements += `<text x="${glassCenterX}" y="${glassCenterY}"
                                              text-anchor="middle" dominant-baseline="middle" font-size="3" fill="#333" font-weight="bold">Fixed</text>`;
                                    } else {
                                        // Add V shape for hinged panels
                                        const glassCenterX = glassX + glassWidth / 2;
                                        const glassCenterY = glassY + glassHeight / 2;
                                        const vSize = Math.min(glassWidth, glassHeight) * 0.9;
                                        
                                        // Draw inverted V shape (from top corners to bottom middle) within glass bounds
                                        svgElements += `<path d="M ${glassCenterX - vSize/2} ${glassCenterY - vSize/2} 
                                              L ${glassCenterX} ${glassCenterY + vSize/2} 
                                              L ${glassCenterX + vSize/2} ${glassCenterY - vSize/2}" 
                                              stroke="#FFD700" stroke-width="0.8" fill="none"/>`;
                                    }
                                }
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
            <title>Cocoon Company For Aluminum Works - Quotation</title>
            <link
              href="https://db.onlinewebfonts.com/c/28c0ba929947563500b21da15a88c6fe?family=TacticSans-Reg"
              rel="stylesheet"
            />
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                font-family: "TacticSans-Reg", sans-serif;
              }
              
              body {
                font-family: "TacticSans-Reg", sans-serif;
                line-height: 1.6;
                color: #1a202c;
                background: #ffffff;
                font-size: 14px;
              }
              
              .container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 24px;
                background: #ffffff;
              }
              
              .header {
                text-align: center;
                margin-bottom: 32px;
                padding: 24px;
                background: #ffffff;
                color: #1a202c;
                border-radius: 12px;
                border: 1px solid #e2e8f0;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
              }
              
              
              .logo-section {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 16px;
                margin-bottom: 16px;
              }
              
              .logo {
                width: 60px;
                height: 60px;
                border-radius: 8px;
                object-fit: cover;
              }
              
              .company-info {
                text-align: left;
              }
              
              .company-name {
                font-size: 20px;
                font-weight: 600;
                margin-bottom: 4px;
                color: #A72036;
              }
              
              .company-tagline {
                font-size: 14px;
                color: #64748b;
                font-weight: 400;
              }
              
              
              .quote-details {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 24px;
                margin-bottom: 32px;
              }
              
              .detail-card {
                background: linear-gradient(to-t, rgba(167, 32, 54, 0.05), #ffffff);
                padding: 24px;
                border-radius: 12px;
                border: 1px solid #e2e8f0;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                position: relative;
                overflow: hidden;
              }
              
              .detail-card h3 {
                font-size: 16px;
                font-weight: 600;
                color: #1a202c;
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
                color: #64748b;
                font-size: 13px;
              }
              
              .detail-value {
                font-weight: 600;
                color: #1a202c;
              }
              
              .items-section {
                margin-bottom: 32px;
              }
              
              .section-title {
                font-size: 20px;
                font-weight: 600;
                color: #1a202c;
                margin-bottom: 24px;
                padding-bottom: 8px;
                border-bottom: 1px solid #e2e8f0;
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
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                border: 1px solid #e2e8f0;
              }
              
              .items-table thead {
                background: #A72036;
              }
              
              .items-table th {
                padding: 12px;
                color: white;
                font-weight: 600;
                font-size: 12px;
                text-align: left;
                letter-spacing: 0.5px;
                text-transform: uppercase;
              }
              
              .items-table td {
                padding: 12px;
                border-bottom: 1px solid #e2e8f0;
                vertical-align: middle;
                font-size: 13px;
              }
              
              .items-table tbody tr:hover {
                background-color: #f8fafc;
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
                color: #64748b;
              }
              
              .specs-container {
                display: flex;
                flex-wrap: wrap;
                gap: 4px;
                max-width: 200px;
              }
              
              .spec-tag {
                display: inline-block;
                padding: 2px 8px;
                border-radius: 6px;
                font-size: 10px;
                font-weight: 500;
                text-align: center;
                line-height: 1.2;
                border: 1px solid transparent;
              }
              
              .glass-double {
                background: #0ea5e9;
                color: white;
              }
              
              .glass-single {
                background: #64748b;
                color: white;
              }
              
              .tag-net {
                background: #22c55e;
                color: white;
              }
              
              .tag-arch {
                background: #f59e0b;
                color: #1a202c;
              }
              
              .system-badge {
                background: #8b5cf6;
                color: white;
                padding: 4px 8px;
                border-radius: 6px;
                font-weight: 500;
                font-size: 11px;
                text-align: center;
              }
              
              .price-value {
                font-weight: 600;
                color: #A72036;
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
                margin-bottom: 32px;
              }
              
              .totals-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 24px;
                margin-bottom: 24px;
              }
              
              .total-card {
                background: linear-gradient(to-t, rgba(167, 32, 54, 0.05), #ffffff);
                color: #1a202c;
                padding: 24px;
                border-radius: 12px;
                text-align: center;
                border: 1px solid #e2e8f0;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
              }
              
              .total-label {
                font-size: 14px;
                font-weight: 500;
                color: #64748b;
                margin-bottom: 8px;
              }
              
              .total-value {
                font-size: 24px;
                font-weight: 600;
                color: #A72036;
              }
              
              .payment-schedule {
                background: linear-gradient(to-t, rgba(167, 32, 54, 0.05), #ffffff);
                padding: 24px;
                border-radius: 12px;
                border: 1px solid #e2e8f0;
                margin-bottom: 24px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
              }
              
              .payment-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 16px;
                margin-top: 16px;
              }
              
              .payment-item {
                text-align: center;
                padding: 16px;
                background: white;
                border-radius: 8px;
                border: 1px solid #e2e8f0;
                box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
              }
              
              .payment-label {
                font-size: 12px;
                font-weight: 500;
                color: #64748b;
                margin-bottom: 8px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              
              .payment-amount {
                font-size: 18px;
                font-weight: 600;
                color: #1a202c;
              }
              
              .validity-section {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 16px;
                margin-bottom: 24px;
              }
              
              .validity-card {
                background: #A72036;
                color: white;
                padding: 16px;
                border-radius: 8px;
                text-align: center;
                box-shadow: 0 1px 3px rgba(167, 32, 54, 0.2);
              }
              
              .validity-label {
                font-size: 14px;
                opacity: 0.9;
                margin-bottom: 8px;
              }
              
              .validity-value {
                font-size: 20px;
                font-weight: 600;
              }
              
              .notes-section {
                background: linear-gradient(to-t, rgba(167, 32, 54, 0.05), #ffffff);
                padding: 24px;
                border-radius: 12px;
                border-left: 4px solid #A72036;
                margin-bottom: 32px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
              }
              
              .notes-title {
                font-size: 16px;
                font-weight: 600;
                color: #A72036;
                margin-bottom: 12px;
                display: flex;
                align-items: center;
                gap: 8px;
              }
              
              .notes-content {
                color: #1a202c;
                line-height: 1.7;
              }
              
              .footer {
                margin-top: 32px;
                padding: 24px;
                background: #A72036;
                color: white;
                border-radius: 12px;
                text-align: center;
                position: relative;
                overflow: hidden;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
              }
              
              .footer::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 4px;
                background: #A72036;
              }
              
              .footer-title {
                font-size: 18px;
                font-weight: 600;
                margin-bottom: 16px;
                color: white;
              }
              
              .footer-content {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 16px;
                margin-top: 16px;
              }
              
              .footer-section {
                display: flex;
                flex-direction: column;
                justify-content: start;
                align-items: flex-start;
                margin-bottom: 8px;
                font-size: 13px;
                opacity: 0.9;
              }
              
              .footer-section strong {
                color: white;
              }
              
              @media print {
                body { 
                  margin: 0; 
                  font-size: 12px;
                }
                .container {
                  padding: 16px;
                  max-width: none;
                }
                .no-print { 
                  display: none; 
                }
                .header {
                  margin-bottom: 24px;
                  padding: 16px;
                }
                .quote-details,
                .totals-grid,
                .payment-grid,
                .validity-section,
                .footer-content {
                  page-break-inside: avoid;
                }
                .items-table {
                  font-size: 11px;
                }
                .items-table th,
                .items-table td {
                  padding: 8px 6px;
                }
                .detail-card,
                .total-card,
                .payment-schedule,
                .validity-card,
                .notes-section,
                .footer {
                  box-shadow: none;
                  border: 1px solid #e2e8f0;
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
                    <h1 class="company-name">Cocoon Company For Aluminum Works</h1>
                    <p class="company-tagline">The Quality You Deserve</p>
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
                      Date.now() + quoteData.settings.expirationDays * 24 * 60 * 60 * 1000
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
                      ${quoteData.settings.pricingType === "detailed" ? '<th>Price (EGP)</th>' : ''}
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
                            if (item.additionalCost && item.additionalCost > 0) {
                                specs +=
                                    '<span class="spec-tag" style="background: linear-gradient(135deg, #9f7aea, #b794f6); color: white;">Additional Cost</span>';
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
                          ${quoteData.settings.pricingType === "detailed" ? `<td class="price-value">${itemPrice.toLocaleString()} EGP</td>` : ''}
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
                    
                  </div>
                  <div class="footer-section">
                    <p><strong>Email:</strong> sales.department@cocoonaluminum.com</p>
                    <p><strong>Website:</strong> www.cocoonaluminum.com</p>
                    <p><strong>Mobile:</strong> +20 11 51717149</p>
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
              <link
                href="https://db.onlinewebfonts.com/c/28c0ba929947563500b21da15a88c6fe?family=TacticSans-Reg"
                rel="stylesheet"
              />
              <style>
                body { font-family: "TacticSans-Reg", sans-serif; margin: 20px; line-height: 1.6; }
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

    const updateQuoteStatus = useCallback(
        async (quoteId: string, newStatus: QuoteStatus) => {
            setLoading(true);
            setError(null);
            try {
                console.log("Updating quote status:", quoteId, "to", newStatus);

                // Get current quote data
                const {
                    getDoc,
                    doc,
                    setDoc,
                    query,
                    where,
                    getDocs,
                    collection,
                } = await import("firebase/firestore");

                // First try direct document lookup
                let docRef = doc(db, "quotes", quoteId);
                let docSnap = await getDoc(docRef);

                // If document doesn't exist, try to find it by searching for the quote ID in the data
                if (!docSnap.exists()) {
                    console.log(
                        "Document not found with ID:",
                        quoteId,
                        "Searching by quote ID field..."
                    );
                    const quotesQuery = query(
                        collection(db, "quotes"),
                        where("id", "==", quoteId)
                    );
                    const querySnapshot = await getDocs(quotesQuery);

                    if (querySnapshot.empty) {
                        throw new Error(`Quote not found with ID: ${quoteId}`);
                    }

                    // Use the first matching document
                    const foundDoc = querySnapshot.docs[0];
                    docRef = doc(db, "quotes", foundDoc.id);
                    docSnap = foundDoc;
                    console.log("Found quote with document ID:", foundDoc.id);
                }

                const currentData = docSnap.data() as QuoteData;
                const updatedData = { ...currentData };

                // Update status
                updatedData.status = newStatus;
                updatedData.updatedAt = new Date().toISOString();

                // If changing to in_production and no production start date, set it
                if (
                    newStatus === "in_production" &&
                    !updatedData.productionStartDate
                ) {
                    updatedData.productionStartDate = new Date().toISOString();
                }

                // If changing to completed, set actual completion date
                if (
                    newStatus === "completed" &&
                    !updatedData.actualCompletionDate
                ) {
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
        },
        []
    );

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
        // Auto-save and history functions
        autoSaveQuote,
        addToHistory,
        restoreFromHistory,
        clearHistory,
        setAutoSaveEnabled,
        // State
        loading,
        error,
        autoSaveEnabled,
        lastSaved,
    };
};
