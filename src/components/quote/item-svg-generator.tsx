"use client";

import { useMemo, useEffect } from "react";
import { QuoteItem } from "@/types/quote";

interface ItemSvgGeneratorProps {
    item: QuoteItem;
    width?: number;
    height?: number;
    onSvgUpdate?: (svg: string) => void;
}

export function ItemSvgGenerator({
    item,
    width = 300,
    height = 200,
    onSvgUpdate,
}: ItemSvgGeneratorProps) {
    const svgContent = useMemo(() => {
        if (item.type === "curtain_wall") {
            return generateCurtainWallSvg(item, width, height);
        } else {
            return generateNormalItemSvg(item, width, height);
        }
    }, [
        item,
        width,
        height,
    ]);

    // Update the visualSvg field when SVG changes
    useEffect(() => {
        if (onSvgUpdate && svgContent) {
            onSvgUpdate(svgContent);
        }
    }, [svgContent, onSvgUpdate]);

    return (
        <div className="border rounded-lg p-2 bg-white">
            <div className="text-xs text-muted-foreground mb-2 text-center">
                {item.type === "curtain_wall"
                    ? "Curtain Wall Layout"
                    : `${item.system} System`}
            </div>
            <div
                className="flex justify-center"
                dangerouslySetInnerHTML={{ __html: svgContent }}
            />
        </div>
    );
}

function generateNormalItemSvg(
    item: QuoteItem,
    width: number,
    height: number
): string {
    const { width: itemWidth, height: itemHeight, system, leaves, type } = item;

    // Scale dimensions to fit the SVG container
    const scale = Math.min(width / itemWidth, height / itemHeight) * 0.8;
    const scaledWidth = itemWidth * scale;
    const scaledHeight = itemHeight * scale;
    const offsetX = (width - scaledWidth) / 2;
    const offsetY = (height - scaledHeight) / 2;

    let svgElements = "";

    // Draw the main frame
    svgElements += `
        <rect x="${offsetX}" y="${offsetY}" width="${scaledWidth}" height="${scaledHeight}"
              fill="none" stroke="#374151" stroke-width="2" rx="4"/>
    `;

    // Draw glass panel
    const glassInset = 8;
    svgElements += `
        <rect x="${offsetX + glassInset}" y="${offsetY + glassInset}"
              width="${scaledWidth - glassInset * 2}" height="${
        scaledHeight - glassInset * 2
    }"
              fill="#87CEEB" stroke="#666" stroke-width="1" opacity="0.7"/>
    `;

    // Add system-specific elements
    if (system === "Sliding") {
        // Draw sliding panels and handles
        const panelWidth = (scaledWidth - glassInset * 2) / leaves;
        for (let i = 0; i < leaves; i++) {
            const panelX = offsetX + glassInset + i * panelWidth;

            // Panel divider (if multiple leaves)
            if (i > 0) {
                svgElements += `
                    <line x1="${panelX}" y1="${offsetY + glassInset}"
                          x2="${panelX}" y2="${
                    offsetY + scaledHeight - glassInset
                }"
                          stroke="#666" stroke-width="1"/>
                `;
            }

            // Handle (on the sides for sliding)
            const handleY = offsetY + scaledHeight / 2;
            const handleSize = 8;
            if (i === 0 || i === leaves - 1) {
                // Handles on first and last panels
                svgElements += `
                    <circle cx="${panelX + panelWidth / 2}" cy="${handleY}"
                            r="${handleSize}" fill="#666"/>
                    <rect x="${panelX + panelWidth / 2 - handleSize / 2}" y="${
                    handleY - 2
                }"
                          width="${handleSize}" height="4" fill="#666"/>
                `;
            }
        }
    } else if (system === "hinged") {
        // Draw hinged elements
        const hingeSpacing = scaledHeight / (leaves + 1);
        for (let i = 1; i <= leaves; i++) {
            const hingeY = offsetY + i * hingeSpacing;
            svgElements += `
                <circle cx="${offsetX}" cy="${hingeY}" r="3" fill="#666"/>
                <circle cx="${
                    offsetX + scaledWidth
                }" cy="${hingeY}" r="3" fill="#666"/>
            `;
        }

        // Handle on the door
        if (type === "door") {
            const handleX =
                leaves === 1
                    ? offsetX + scaledWidth - 20
                    : offsetX + scaledWidth / 2;
            const handleY = offsetY + scaledHeight / 2;
            svgElements += `
                <circle cx="${handleX}" cy="${handleY}" r="4" fill="#FFD700"/>
                <rect x="${handleX - 8}" y="${
                handleY - 2
            }" width="16" height="4" fill="#FFD700"/>
            `;
        }
    } else if (system === "fixed") {
        // Fixed system - just the frame and glass, no moving parts
        svgElements += `
            <text x="${offsetX + scaledWidth / 2}" y="${
            offsetY + scaledHeight / 2
        }"
                  text-anchor="middle" dominant-baseline="middle"
                  font-size="12" fill="#666">Fixed</text>
        `;
    }

    // Add dimensions
    svgElements += `
        <text x="${offsetX + scaledWidth / 2}" y="${offsetY - 5}"
              text-anchor="middle" font-size="10" fill="#666">${itemWidth}m</text>
        <text x="${offsetX - 5}" y="${offsetY + scaledHeight / 2}"
              text-anchor="middle" dominant-baseline="middle" font-size="10" fill="#666"
              transform="rotate(-90, ${offsetX - 5}, ${
        offsetY + scaledHeight / 2
    })">${itemHeight}m</text>
    `;

    return `
        <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
            ${svgElements}
        </svg>
    `;
}

function generateCurtainWallSvg(
    item: QuoteItem,
    width: number,
    height: number
): string {
    if (!item.designData?.panels) {
        return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-size="14" fill="#666">No design data</text></svg>`;
    }

    const { panels, wallWidth, wallHeight, columns, rows, columnSizes, rowSizes } = item.designData;

    // Filter panels to render (exclude merged children but include merged parents)
    const panelsToRender = panels.filter(
        (panel) => !panel.mergedId // Only show panels that aren't merged into another panel
    );

    if (panelsToRender.length === 0) {
        return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-size="14" fill="#666">No panels to display</text></svg>`;
    }

    // Calculate available space with padding
    const padding = 15;
    const availableWidth = width - padding * 2;
    const availableHeight = height - padding * 2;

    // Calculate content dimensions maintaining aspect ratio
    const wallRatio = wallWidth / wallHeight;
    let contentWidth, contentHeight;

    if (wallRatio > availableWidth / availableHeight) {
        // Wall is wider relative to available space
        contentWidth = availableWidth * 0.9;
        contentHeight = contentWidth / wallRatio;
    } else {
        // Wall is taller relative to available space
        contentHeight = availableHeight * 0.9;
        contentWidth = contentHeight * wallRatio;
    }

    // Center the content
    const offsetX = (width - contentWidth) / 2;
    const offsetY = (height - contentHeight) / 2;

    let svgElements = "";

    // Draw wall outline
    svgElements += `
        <rect x="${offsetX}" y="${offsetY}" width="${contentWidth}" height="${contentHeight}"
              fill="none" stroke="#374151" stroke-width="2" rx="4"/>
    `;

    // Generate unique IDs for gradients
    const gradientId = `glassGradient_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

    // Define gradients for glass effect
    svgElements = `
        <defs>
            <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#e3f2fd;stop-opacity:0.9" />
                <stop offset="25%" style="stop-color:#bbdefb;stop-opacity:0.7" />
                <stop offset="50%" style="stop-color:#90caf9;stop-opacity:0.5" />
                <stop offset="75%" style="stop-color:#64b5f6;stop-opacity:0.7" />
                <stop offset="100%" style="stop-color:#42a5f5;stop-opacity:0.9" />
            </linearGradient>
        </defs>
        ${svgElements}
    `;

    // Calculate cumulative positions for non-uniform column and row sizes
    const totalWidth = columnSizes?.reduce((sum, size) => sum + size, 0) || wallWidth;
    const totalHeight = rowSizes?.reduce((sum, size) => sum + size, 0) || wallHeight;
    
    // Precompute cumulative positions for columns
    const cumulativeColumnPositions = [0];
    if (columnSizes && columnSizes.length > 0) {
        for (let i = 0; i < columnSizes.length; i++) {
            cumulativeColumnPositions.push(cumulativeColumnPositions[i] + columnSizes[i]);
        }
    } else {
        // Fallback to uniform columns
        const uniformColumnWidth = wallWidth / (columns || 4);
        for (let i = 0; i <= (columns || 4); i++) {
            cumulativeColumnPositions.push(i * uniformColumnWidth);
        }
    }
    
    // Precompute cumulative positions for rows
    const cumulativeRowPositions = [0];
    if (rowSizes && rowSizes.length > 0) {
        for (let i = 0; i < rowSizes.length; i++) {
            cumulativeRowPositions.push(cumulativeRowPositions[i] + rowSizes[i]);
        }
    } else {
        // Fallback to uniform rows
        const uniformRowHeight = wallHeight / (rows || 3);
        for (let i = 0; i <= (rows || 3); i++) {
            cumulativeRowPositions.push(i * uniformRowHeight);
        }
    }

    // Process each panel
    panelsToRender.forEach((panel) => {
        let fillColor = "#87CEEB";
        let strokeColor = "#666";
        let label = "";

        switch (panel.type) {
            case "window":
                fillColor = `url(#${gradientId})`;
                strokeColor = "#42a5f5";
                label = "";
                break;
            case "door":
                fillColor = "#ffecb3";
                strokeColor = "#ffca28";
                label = "D";
                break;
            case "structure":
                fillColor = "#e3f2fd";
                strokeColor = "#1976d2";
                label = "F";
                break;
        }

        // Calculate panel position and size using cumulative positioning
        let panelX, panelY, panelWidth, panelHeight;

        // Use cumulative positioning for non-uniform sizes (primary method)
        if (panel.col !== undefined && panel.row !== undefined) {
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
            panelX = offsetX + (leftMeters / totalWidth) * contentWidth;
            panelY = offsetY + (topMeters / totalHeight) * contentHeight;
            panelWidth = ((rightMeters - leftMeters) / totalWidth) * contentWidth;
            panelHeight = ((bottomMeters - topMeters) / totalHeight) * contentHeight;
        }
        // Use left/top percentages if available (fallback method)
        else if (
            panel.left !== undefined &&
            panel.top !== undefined &&
            panel.width !== undefined &&
            panel.height !== undefined
        ) {
            panelX = offsetX + (panel.left / 100) * contentWidth;
            panelY = offsetY + (panel.top / 100) * contentHeight;
            panelWidth = (panel.width / 100) * contentWidth;
            panelHeight = (panel.height / 100) * contentHeight;
        }
        // Fallback to actual dimensions in meters
        else if (panel.widthMeters > 0 && panel.heightMeters > 0) {
            panelWidth = (panel.widthMeters / wallWidth) * contentWidth;
            panelHeight = (panel.heightMeters / wallHeight) * contentHeight;
            
            // Fallback to grid-based positioning
            const gridCols = columns || 4;
            const gridRows = rows || 3;
            const cellWidth = contentWidth / gridCols;
            const cellHeight = contentHeight / gridRows;
            panelX = offsetX + (panel.col || 0) * cellWidth;
            panelY = offsetY + (panel.row || 0) * cellHeight;
        }
        // Final fallback to uniform grid
        else {
            const gridCols = columns || 4;
            const gridRows = rows || 3;
            const cellWidth = contentWidth / gridCols;
            const cellHeight = contentHeight / gridRows;

            panelX = offsetX + (panel.col || 0) * cellWidth;
            panelY = offsetY + (panel.row || 0) * cellHeight;
            panelWidth = cellWidth * (panel.colSpan || 1);
            panelHeight = cellHeight * (panel.rowSpan || 1);
        }

        // Draw panel rectangle
        svgElements += `
            <rect x="${panelX}" y="${panelY}" width="${panelWidth}" height="${panelHeight}"
                  fill="${fillColor}" stroke="${strokeColor}" stroke-width="2" rx="3" opacity="0.8"/>
        `;

        // Special handling for windows
        if (panel.type === "window" && panelWidth > 20 && panelHeight > 20) {
            // Add window frame lines
            const frameInset = 2;
            const innerX = panelX + frameInset;
            const innerY = panelY + frameInset;
            const innerWidth = panelWidth - frameInset * 2;
            const innerHeight = panelHeight - frameInset * 2;

            // Vertical center line
            svgElements += `
                <line x1="${innerX + innerWidth / 2}" y1="${innerY}" 
                      x2="${innerX + innerWidth / 2}" y2="${
                innerY + innerHeight
            }"
                      stroke="${strokeColor}" stroke-width="1.5" opacity="0.9"/>
            `;

            // Horizontal center line
            svgElements += `
                <line x1="${innerX}" y1="${innerY + innerHeight / 2}" 
                      x2="${innerX + innerWidth}" y2="${
                innerY + innerHeight / 2
            }"
                      stroke="${strokeColor}" stroke-width="1.5" opacity="0.9"/>
            `;
        }

        // Add panel label for non-window panels
        if (label && panelWidth > 25 && panelHeight > 20) {
            const centerX = panelX + panelWidth / 2;
            const centerY = panelY + panelHeight / 2;
            const fontSize = Math.max(
                10,
                Math.min(panelWidth, panelHeight) / 4
            );

            svgElements += `
                <text x="${centerX}" y="${centerY}"
                      font-family="Arial, sans-serif" font-size="${fontSize}"
                      fill="${strokeColor}" text-anchor="middle" font-weight="bold"
                      dominant-baseline="middle">
                    ${label}
                </text>
            `;
        }
    });

    // Add dimensions
    svgElements += `
        <text x="${offsetX + contentWidth / 2}" y="${offsetY - 5}"
              text-anchor="middle" font-size="10" fill="#666">${wallWidth}m</text>
        <text x="${offsetX - 5}" y="${offsetY + contentHeight / 2}"
              text-anchor="middle" dominant-baseline="middle" font-size="10" fill="#666"
              transform="rotate(-90, ${offsetX - 5}, ${
        offsetY + contentHeight / 2
    })">${wallHeight}m</text>
    `;

    return `
        <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
            ${svgElements}
        </svg>
    `;
}
