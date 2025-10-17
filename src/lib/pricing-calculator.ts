/* eslint-disable @typescript-eslint/no-explicit-any */
import { QuoteItem, PricedItem } from "@/types/quote";

export function calculateItemPricing(item: QuoteItem): PricedItem {
    // Clone so we don't mutate original input object
    const raw = JSON.parse(JSON.stringify(item));

    // quantity
    const qty = Number(raw.quantity || raw.curtain?.quantity || 1);

    // normalize profile fields into item.profile (same as your mapping)
    const p = raw.profile
        ? {
              profile_code: raw.profile.code,
              brand: raw.profile.brand,
              profile_name: raw.profile.name,
              frame_price: Number(raw.profile.frame_price || 0),
              frame_price_3: Number(raw.profile.frame_price_3 || 0),
              leaf_price: Number(
                  raw.profile.sach_price || raw.profile.leaf_price || 0
              ),
              accessories_2_leaves: Number(
                  raw.profile.accessories_2_sach ||
                      raw.profile.accessories_2_leaves ||
                      0
              ),
              accessories_3_leaves: Number(
                  raw.profile.accessories_3_sach ||
                      raw.profile.accessories_3_leaves ||
                      0
              ),
              accessories_4_leaves: Number(
                  raw.profile.accessories_4_sach ||
                      raw.profile.accessories_4_leaves ||
                      0
              ),
              glass_price_single: Number(raw.profile.glass_price_single || 0),
              glass_price_double: Number(raw.profile.glass_price_double || 0),
              glass_price_triple: Number(raw.profile.glass_price_triple || 0),
              glass_price_laminated: Number(
                  raw.profile.glass_price_laminated || 0
              ),
              arc_price: Number(raw.profile.arc_price || 0),
              net_price: Number(raw.profile.mosquito_price_fixed || 0),
              net_price_plisse: Number(raw.profile.mosquito_price_plisse || 0),
              net_price_panda: Number(raw.profile.net_price_panda || 0),
              base_profit_rate: Number(raw.profile.base_profit_rate || 0),
          }
        : {
              profile_code: "",
              brand: "",
              profile_name: "",
              frame_price: 0,
              frame_price_3: 0,
              leaf_price: 0,
              accessories_2_leaves: 0,
              accessories_3_leaves: 0,
              accessories_4_leaves: 0,
              glass_price_single: 0,
              glass_price_double: 0,
              glass_price_triple: 0,
              glass_price_laminated: 0,
              arc_price: 0,
              net_price: 0,
              net_price_plisse: 0,
              net_price_panda: 0,
              base_profit_rate: 0,
          };

    // -------------------------
    // CURTAIN WALL: NEW LOGIC
    // -------------------------
    if (raw.type === "curtain_wall") {
        // safe numeric extraction (fallbacks)
        const frameMeters = Number(
            raw.frameMeters || raw.designData?.frameMeters || 0
        );
        const windowMeters = Number(
            raw.windowMeters || raw.designData?.windowMeters || 0
        );
        const glassArea = Number(
            raw.glassArea || raw.designData?.glassArea || 0
        );

        // panels array -> count windows & doors safely
        const panels = Array.isArray(raw.designData?.panels)
            ? raw.designData.panels
            : Array.isArray(raw.panels)
            ? raw.panels
            : [];
        const numWindows = panels.filter(
            (pl: any) => String(pl?.type).toLowerCase() === "window"
        ).length;
        const numDoors = panels.filter(
            (pl: any) => String(pl?.type).toLowerCase() === "door"
        ).length;
        const cornerCount = Number(
            raw.designData?.cornerCount || raw.cornerCount || 0
        );

        // NEW: Calculate total area by summing each panel's area
        let totalPanelArea = 0;
        panels.forEach((panel: any) => {
            const width = Number(panel.widthMeters || panel.width || 0);
            const height = Number(panel.heightMeters || panel.height || 0);
            totalPanelArea += width * height;
        });

        // If we can't calculate from panels, fall back to glassArea
        const totalAreaUnit = totalPanelArea > 0 ? totalPanelArea : glassArea;

        // Determine per-meter rates
        const framePricePerMeter = Number(
            raw.designData?.frameProfile?.frame_price ??
                raw.designData?.frameProfile?.price ??
                p.frame_price ??
                0
        );

        const windowPricePerMeter = Number(
            raw.designData?.windowProfile?.frame_price ??
                raw.designData?.windowProfile?.price ??
                p.leaf_price ??
                0
        );

        // accessory unit prices
        const accessoriesPerWindowDoor = p.accessories_2_leaves || 0;
        const frameAccessoriesPerMeter = p.accessories_3_leaves || 0;
        const cornerAccessory = p.accessories_4_leaves || 0;

        // Component costs
        const frameCostUnit = framePricePerMeter * frameMeters;
        const windowsCostUnit = windowPricePerMeter * windowMeters;
        const accessoriesWinDoorUnit =
            (numWindows + numDoors) * accessoriesPerWindowDoor;
        const frameAccessoriesUnit = frameMeters * frameAccessoriesPerMeter;
        const cornersUnit = cornerCount * cornerAccessory;

        // Additional cost per unit
        const additionalCostUnit = Number(raw.additionalCost || 0);

        // Calculate glass cost
        const denomArea = totalAreaUnit > 0 ? totalAreaUnit : 1;
        const originalWidth = Number(raw.width);
        const originalHeight = Number(raw.height);

        const calcWidth = originalWidth < 1 ? 1 : originalWidth;
        const calcHeight = originalHeight < 1 ? 1 : originalHeight;

        const areaUnit = calcWidth * calcHeight;
        const glassRateCurtain =
            raw.glassType === "double"
                ? p.glass_price_double
                : raw.glassType === "triple"
                ? p.glass_price_triple
                : raw.glassType === "laminated"
                ? p.glass_price_laminated
                : p.glass_price_single;
        const glassCostUnit = glassRateCurtain * areaUnit;

        // Subtotal before profit (including glass cost)
        const totalBeforeProfitUnit =
            frameCostUnit +
            windowsCostUnit +
            accessoriesWinDoorUnit +
            frameAccessoriesUnit +
            cornersUnit +
            glassCostUnit +
            additionalCostUnit;

        // Profit calculation
        const profitRate = Number(p.base_profit_rate || 0);
        const profitAmountUnit = profitRate * totalBeforeProfitUnit;
        const totalPriceUnit = totalBeforeProfitUnit + profitAmountUnit;

        return {
            ...raw,
            quantity: qty,
            frameMeters,
            windowMeters,
            glassArea,
            totalArea: totalAreaUnit, // NEW: Total area from panels
            numWindows,
            numDoors,
            cornerCount,

            // breakdown
            frameCost: +(frameCostUnit * qty).toFixed(2),
            windowsCost: +(windowsCostUnit * qty).toFixed(2),
            accessoriesWindowsDoors: +(accessoriesWinDoorUnit * qty).toFixed(2),
            frameAccessories: +(frameAccessoriesUnit * qty).toFixed(2),
            cornersCost: +(cornersUnit * qty).toFixed(2),

            // totals
            additionalCostTotal: +(additionalCostUnit * qty).toFixed(2),
            totalBeforeProfit: +(totalBeforeProfitUnit * qty).toFixed(2),
            base_profit_rate: +profitRate.toFixed(4),
            profitAmount: +(profitAmountUnit * qty).toFixed(2),
            totalPrice: +(totalPriceUnit * qty).toFixed(2),

            // derived metrics - NOW USING TOTAL PANEL AREA
            m2Price: +(totalPriceUnit / denomArea).toFixed(2),
            profitPercentage: +(
                totalPriceUnit ? (profitAmountUnit / totalPriceUnit) * 100 : 0
            ).toFixed(2),
            area: +(totalAreaUnit * qty).toFixed(2), // NEW: Now uses total panel area

            // keep these for compatibility
            frameLength: 0,
            sachPerimeter: 0,
            totalSachLength: 0,
            sachCost: 0,
            glassCost: +(glassCostUnit * qty).toFixed(2),
            accessories: 0,
        };
    }

    // -----------------------------------
    // DOORS + WINDOWS (unchanged)
    // -----------------------------------
    const originalWidth = Number(raw.width);
    const originalHeight = Number(raw.height);
    const leaves = Number(raw.leaves) || 1;

    const calcWidth = originalWidth < 1 ? 1 : originalWidth;
    const calcHeight = originalHeight < 1 ? 1 : originalHeight;

    const areaUnit = calcWidth * calcHeight;
    const frameLengthUnit = 2 * (calcWidth + calcHeight);
    const sachPerimeter = 2 * (calcWidth / leaves + calcHeight);
    const totalSachLengthUnit = sachPerimeter * leaves;

    // Accessories calculation - different logic for Tilt and Turn vs other systems
    let accessoriesUnit = 0;
    if (raw.system === "Tilt and Turn") {
        // For Tilt and Turn: EGP 3,000 per sach (replaces regular accessories)
        accessoriesUnit = leaves * 3000;
    } else {
        // For Sliding, hinged, fixed: use regular accessories calculation
        if (leaves === 2) accessoriesUnit = p.accessories_2_leaves;
        else if (leaves === 3) accessoriesUnit = p.accessories_3_leaves;
        else if (leaves === 4) accessoriesUnit = p.accessories_4_leaves;
    }

    const selectedFramePrice = leaves === 3 ? p.frame_price_3 : p.frame_price;
    const frameCostUnit = selectedFramePrice * frameLengthUnit;
    const sachCostUnit = p.leaf_price * totalSachLengthUnit;

    const glassType = raw.glassType?.toLowerCase() || "single";
    const glassRate =
        glassType === "double"
            ? p.glass_price_double
            : glassType === "triple"
            ? p.glass_price_triple
            : glassType === "laminated"
            ? p.glass_price_laminated
            : p.glass_price_single;
    const glassCostUnit = glassRate * areaUnit;

    let netCostUnit = 0;
    if (raw.mosquito) {
        const netType = raw.netType?.toLowerCase() || "fixed";

        if (netType === "fixed") {
            netCostUnit = p.net_price * sachPerimeter;
        } else if (netType === "plisse") {
            netCostUnit = p.net_price_plisse * sachPerimeter;
        } else if (netType === "panda") {
            netCostUnit = p.net_price_panda * sachPerimeter;
        }
    }

    const archCostUnit = raw.arch ? p.arc_price * frameLengthUnit : 0;

    // Additional cost per unit
    const additionalCostUnit = Number(raw.additionalCost || 0);

    const totalBeforeProfitUnit =
        accessoriesUnit +
        frameCostUnit +
        sachCostUnit +
        glassCostUnit +
        netCostUnit +
        archCostUnit +
        additionalCostUnit;
    let profitRate = Number(p.base_profit_rate || 0);
    const extraArea = areaUnit > 4 ? Math.ceil(areaUnit - 4) : 0;
    profitRate += extraArea * 0.1;

    const profitAmountUnit = profitRate * totalBeforeProfitUnit;
    const totalPriceUnit = totalBeforeProfitUnit + profitAmountUnit;

    return {
        ...raw,
        quantity: qty,
        width: originalWidth,
        height: originalHeight,
        frameLength: +(frameLengthUnit * qty).toFixed(2),
        sachPerimeter: +sachPerimeter.toFixed(2),
        totalSachLength: +(totalSachLengthUnit * qty).toFixed(2),
        area: +(areaUnit * qty).toFixed(2),
        accessories: +(accessoriesUnit * qty).toFixed(2),
        frameCost: +(frameCostUnit * qty).toFixed(2),
        sachCost: +(sachCostUnit * qty).toFixed(2),
        glassCost: +(glassCostUnit * qty).toFixed(2),
        netCost: +(netCostUnit * qty).toFixed(2),
        archCost: +(archCostUnit * qty).toFixed(2),
        additionalCostTotal: +(additionalCostUnit * qty).toFixed(2),
        totalBeforeProfit: +(totalBeforeProfitUnit * qty).toFixed(2),
        base_profit_rate: +profitRate.toFixed(2),
        profitAmount: +(profitAmountUnit * qty).toFixed(2),
        totalPrice: +(totalPriceUnit * qty).toFixed(2),
        m2Price: +(totalPriceUnit / (areaUnit || 1)).toFixed(2),
        profitPercentage: +((profitAmountUnit / totalPriceUnit) * 100).toFixed(
            2
        ),
        // Curtain wall specific fields (set to 0 for non-curtain wall items)
        frameMeters: 0,
        windowMeters: 0,
        glassArea: 0,
        numWindows: 0,
        numDoors: 0,
        cornerCount: 0,
        frameAccessories: 0,
        cornersCost: 0,
        windowsCost: 0,
        accessoriesWindowsDoors: 0,
    };
}

export function calculateQuoteTotals(items: PricedItem[]) {
    // ---------- totals ----------
    const totalM2 = items.reduce((sum, i) => sum + Number(i.area || 0), 0);
    const totalBefore = items.reduce(
        (sum, i) => sum + Number(i.totalBeforeProfit || 0),
        0
    );
    const totalAfter = items.reduce(
        (sum, i) => sum + Number(i.totalPrice || 0),
        0
    );
    const totalProfit = totalAfter - totalBefore;
    const totalProfitPercentage = totalAfter
        ? (totalProfit / totalAfter) * 100
        : 0;
    const totalM2Price = totalM2 ? totalAfter / totalM2 : 0;
    const downPayment = totalAfter * 0.8;
    const supplyPayment = totalAfter * 0.1;
    const completePayment = totalAfter * 0.1;

    return {
        totalM2: +totalM2.toFixed(2),
        totalBefore: +totalBefore.toFixed(2),
        totalAfter: +totalAfter.toFixed(2),
        totalProfit: +totalProfit.toFixed(2),
        totalProfitPercentage: +totalProfitPercentage.toFixed(2),
        totalM2Price: +totalM2Price.toFixed(2),
        downPayment: +downPayment.toFixed(2),
        supplyPayment: +supplyPayment.toFixed(2),
        completePayment: +completePayment.toFixed(2),
        // Legacy fields for compatibility
        totalArea: +totalM2.toFixed(2),
        totalBeforeProfit: +totalBefore.toFixed(2),
        totalPrice: +totalAfter.toFixed(2),
        m2Price: +totalM2Price.toFixed(2),
        profitPercentage: +totalProfitPercentage.toFixed(2),
    };
}
