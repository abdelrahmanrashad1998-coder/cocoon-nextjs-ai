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
        item.type,
        item.width,
        item.height,
        item.system,
        item.leaves,
        item.designData?.panels,
        item.designData?.wallWidth,
        item.designData?.wallHeight,
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

    const { panels, wallWidth, wallHeight } = item.designData;

    // Scale to fit the SVG container
    const scale = Math.min(width / wallWidth, height / wallHeight) * 0.9;
    const scaledWallWidth = wallWidth * scale;
    const scaledWallHeight = wallHeight * scale;
    const offsetX = (width - scaledWallWidth) / 2;
    const offsetY = (height - scaledWallHeight) / 2;

    let svgElements = "";

    // Draw wall outline
    svgElements += `
        <rect x="${offsetX}" y="${offsetY}" width="${scaledWallWidth}" height="${scaledWallHeight}"
              fill="none" stroke="#374151" stroke-width="2"/>
    `;

    // Draw panels
    panels.forEach((panel) => {
        const panelX = offsetX + (panel.left / 100) * scaledWallWidth;
        const panelY = offsetY + (panel.top / 100) * scaledWallHeight;
        const panelWidth = (panel.widthMeters / wallWidth) * scaledWallWidth;
        const panelHeight =
            (panel.heightMeters / wallHeight) * scaledWallHeight;

        let fillColor = "#87CEEB"; // Default glass color
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

        svgElements += `
            <rect x="${panelX}" y="${panelY}" width="${panelWidth}" height="${panelHeight}"
                  fill="${fillColor}" stroke="${strokeColor}" stroke-width="1" opacity="0.8"/>
        `;

        // Add panel type label
        const label =
            panel.type === "structure"
                ? "Fixed"
                : panel.type.charAt(0).toUpperCase() + panel.type.slice(1);
        svgElements += `
            <text x="${panelX + panelWidth / 2}" y="${panelY + panelHeight / 2}"
                  text-anchor="middle" dominant-baseline="middle"
                  font-size="8" fill="#333">${label}</text>
        `;
    });

    // Add dimensions
    svgElements += `
        <text x="${offsetX + scaledWallWidth / 2}" y="${offsetY - 5}"
              text-anchor="middle" font-size="10" fill="#666">${wallWidth}m</text>
        <text x="${offsetX - 5}" y="${offsetY + scaledWallHeight / 2}"
              text-anchor="middle" dominant-baseline="middle" font-size="10" fill="#666"
              transform="rotate(-90, ${offsetX - 5}, ${
        offsetY + scaledWallHeight / 2
    })">${wallHeight}m</text>
    `;

    return `
        <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
            ${svgElements}
        </svg>
    `;
}
