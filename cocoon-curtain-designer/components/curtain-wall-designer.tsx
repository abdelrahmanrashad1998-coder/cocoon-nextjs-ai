"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Grid, Square, DoorOpen, Calculator, Settings, Merge, Split, Trash2, RotateCcw } from "lucide-react"

interface Panel {
  id: string
  type: "structure" | "window" | "door"
  selected: boolean
  merged?: boolean
  colSpan?: number
  rowSpan?: number
  isSpanned?: boolean
}

interface GridState {
  cols: number
  rows: number
  width: number
  height: number
  panels: Panel[][]
  colRatios: number[]
  rowRatios: number[]
}

export function CurtainWallDesigner() {
  const [activeMode, setActiveMode] = useState<"structure" | "window" | "door">("structure")
  const [selectedPanels, setSelectedPanels] = useState<string[]>([])
  const [gridState, setGridState] = useState<GridState>({
    cols: 4,
    rows: 3,
    width: 4.0,
    height: 3.0,
    panels: [],
    colRatios: [1, 1, 1, 1],
    rowRatios: [1, 1, 1],
  })
  const [projectType, setProjectType] = useState("")
  const [measurements, setMeasurements] = useState({
    width: "",
    height: "",
    depth: "",
  })

  const initializeGrid = useCallback(() => {
    const newPanels: Panel[][] = []
    const newColRatios = Array(gridState.cols).fill(1)
    const newRowRatios = Array(gridState.rows).fill(1)

    for (let row = 0; row < gridState.rows; row++) {
      const panelRow: Panel[] = []
      for (let col = 0; col < gridState.cols; col++) {
        panelRow.push({
          id: `${row}-${col}`,
          type: "structure",
          selected: false,
          colSpan: 1,
          rowSpan: 1,
          isSpanned: false,
        })
      }
      newPanels.push(panelRow)
    }
    setGridState((prev) => ({
      ...prev,
      panels: newPanels,
      colRatios: newColRatios,
      rowRatios: newRowRatios,
    }))
  }, [gridState.rows, gridState.cols])

  const mergePanels = () => {
    if (selectedPanels.length < 2) return

    const positions = selectedPanels.map((id) => {
      const [row, col] = id.split("-").map(Number)
      return { row, col, id }
    })

    const minRow = Math.min(...positions.map((p) => p.row))
    const maxRow = Math.max(...positions.map((p) => p.row))
    const minCol = Math.min(...positions.map((p) => p.col))
    const maxCol = Math.max(...positions.map((p) => p.col))

    const newPanels = [...gridState.panels]

    const masterPanel = newPanels[minRow][minCol]
    masterPanel.colSpan = maxCol - minCol + 1
    masterPanel.rowSpan = maxRow - minRow + 1
    masterPanel.merged = true

    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        if (row !== minRow || col !== minCol) {
          newPanels[row][col].isSpanned = true
        }
      }
    }

    setGridState((prev) => ({ ...prev, panels: newPanels }))
    clearSelection()
  }

  const splitPanels = () => {
    if (selectedPanels.length !== 1) return

    const [row, col] = selectedPanels[0].split("-").map(Number)
    const panel = gridState.panels[row][col]

    if (!panel.merged) return

    const newPanels = [...gridState.panels]

    const originalColSpan = panel.colSpan || 1
    const originalRowSpan = panel.rowSpan || 1

    // Reset the master panel
    panel.colSpan = 1
    panel.rowSpan = 1
    panel.merged = false

    for (let r = row; r < row + originalRowSpan; r++) {
      for (let c = col; c < col + originalColSpan; c++) {
        if (newPanels[r] && newPanels[r][c]) {
          // Restore each cell as an individual panel
          newPanels[r][c] = {
            id: `${r}-${c}`,
            type: "structure", // Reset to default type
            selected: false,
            colSpan: 1,
            rowSpan: 1,
            isSpanned: false,
            merged: false,
          }
        }
      }
    }

    setGridState((prev) => ({ ...prev, panels: newPanels }))
    clearSelection()
  }

  const updateColRatio = (colIndex: number, ratio: number) => {
    const newRatios = [...gridState.colRatios]
    newRatios[colIndex] = ratio
    setGridState((prev) => ({ ...prev, colRatios: newRatios }))
  }

  const updateRowRatio = (rowIndex: number, ratio: number) => {
    const newRatios = [...gridState.rowRatios]
    newRatios[rowIndex] = ratio
    setGridState((prev) => ({ ...prev, rowRatios: newRatios }))
  }

  const handlePanelClick = (rowIndex: number, colIndex: number) => {
    const panel = gridState.panels[rowIndex][colIndex]
    if (panel.isSpanned) return

    const panelId = `${rowIndex}-${colIndex}`
    const newPanels = [...gridState.panels]

    if (activeMode !== "structure") {
      panel.type = activeMode
    } else {
      panel.selected = !panel.selected
      if (panel.selected) {
        setSelectedPanels((prev) => [...prev, panelId])
      } else {
        setSelectedPanels((prev) => prev.filter((id) => id !== panelId))
      }
    }

    setGridState((prev) => ({ ...prev, panels: newPanels }))
  }

  const clearSelection = () => {
    const newPanels = gridState.panels.map((row) => row.map((panel) => ({ ...panel, selected: false })))
    setGridState((prev) => ({ ...prev, panels: newPanels }))
    setSelectedPanels([])
  }

  const getPanelColor = (panel: Panel) => {
    if (panel.isSpanned) return "bg-transparent border-transparent"
    if (panel.selected) return "bg-primary/20 border-primary border-2"
    switch (panel.type) {
      case "structure":
        return "bg-muted border-border hover:bg-muted/80"
      case "window":
        return "bg-blue-100 border-blue-300 hover:bg-blue-200"
      case "door":
        return "bg-yellow-100 border-yellow-300 hover:bg-yellow-200"
      default:
        return "bg-muted border-border"
    }
  }

  const getPanelDimensions = (rowIndex: number, colIndex: number) => {
    const panel = gridState.panels[rowIndex][colIndex]
    if (panel.isSpanned) return { width: 0, height: 0 }

    const totalColRatio = gridState.colRatios.reduce((sum, ratio) => sum + ratio, 0)
    const totalRowRatio = gridState.rowRatios.reduce((sum, ratio) => sum + ratio, 0)

    let width = 0
    let height = 0

    for (let i = colIndex; i < colIndex + (panel.colSpan || 1); i++) {
      width += (gridState.colRatios[i] / totalColRatio) * gridState.width
    }

    for (let i = rowIndex; i < rowIndex + (panel.rowSpan || 1); i++) {
      height += (gridState.rowRatios[i] / totalRowRatio) * gridState.height
    }

    return { width: width.toFixed(2), height: height.toFixed(2) }
  }

  const calculateTotals = () => {
    const visiblePanels = gridState.panels.flat().filter((p) => !p.isSpanned)
    const totalPanels = visiblePanels.length
    const windowPanels = visiblePanels.filter((p) => p.type === "window").length
    const doorPanels = visiblePanels.filter((p) => p.type === "door").length
    const structurePanels = totalPanels - windowPanels - doorPanels

    return { totalPanels, windowPanels, doorPanels, structurePanels }
  }

  const totals = calculateTotals()

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src="https://img1.wsimg.com/isteam/ip/b11b2784-66bc-4ac4-9b05-6ba6d416d22d/Untitled%20design%20(1).jpg"
                alt="Cocoon Logo"
                className="h-12 w-auto rounded-lg"
              />
              <div>
                <h1 className="text-2xl font-bold">Cocoon Alumil</h1>
                <p className="text-primary-foreground/80">The Quality You Deserve</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="bg-gradient-to-b from-primary/5 to-background py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-foreground mb-4">Quote Cocoon Alumil aluminium works in minutes!</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Complete the form below to receive a customized quote for your project
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Project Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="project-type">Project Type</Label>
                  <Select value={projectType} onValueChange={setProjectType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="curtain-wall">Curtain Wall</SelectItem>
                      <SelectItem value="window">Window</SelectItem>
                      <SelectItem value="door">Door</SelectItem>
                      <SelectItem value="shopfront">Shopfront</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="width">Width (m)</Label>
                    <Input
                      id="width"
                      type="number"
                      step="0.1"
                      value={measurements.width}
                      onChange={(e) => setMeasurements((prev) => ({ ...prev, width: e.target.value }))}
                      placeholder="4.0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="height">Height (m)</Label>
                    <Input
                      id="height"
                      type="number"
                      step="0.1"
                      value={measurements.height}
                      onChange={(e) => setMeasurements((prev) => ({ ...prev, height: e.target.value }))}
                      placeholder="3.0"
                    />
                  </div>
                </div>

                <Separator />

                <div>
                  <Label>Grid Dimensions</Label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <Label htmlFor="cols" className="text-sm">
                        Columns
                      </Label>
                      <Input
                        id="cols"
                        type="number"
                        min="1"
                        max="10"
                        value={gridState.cols}
                        onChange={(e) =>
                          setGridState((prev) => ({ ...prev, cols: Number.parseInt(e.target.value) || 1 }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="rows" className="text-sm">
                        Rows
                      </Label>
                      <Input
                        id="rows"
                        type="number"
                        min="1"
                        max="10"
                        value={gridState.rows}
                        onChange={(e) =>
                          setGridState((prev) => ({ ...prev, rows: Number.parseInt(e.target.value) || 1 }))
                        }
                      />
                    </div>
                  </div>
                  <Button onClick={initializeGrid} className="w-full mt-4">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Apply Grid
                  </Button>
                </div>

                <Separator />
                <div>
                  <Label>Column Ratios</Label>
                  <div className="grid gap-2 mt-2">
                    {gridState.colRatios.map((ratio, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Label className="text-xs w-12">Col {index + 1}:</Label>
                        <Input
                          type="number"
                          min="0.1"
                          step="0.1"
                          value={ratio}
                          onChange={(e) => updateColRatio(index, Number.parseFloat(e.target.value) || 1)}
                          className="h-8"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Row Ratios</Label>
                  <div className="grid gap-2 mt-2">
                    {gridState.rowRatios.map((ratio, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Label className="text-xs w-12">Row {index + 1}:</Label>
                        <Input
                          type="number"
                          min="0.1"
                          step="0.1"
                          value={ratio}
                          onChange={(e) => updateRowRatio(index, Number.parseFloat(e.target.value) || 1)}
                          className="h-8"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <Label>Design Tools</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <Button
                      variant={activeMode === "structure" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveMode("structure")}
                      className="flex flex-col gap-1 h-auto py-3"
                    >
                      <Square className="h-4 w-4" />
                      <span className="text-xs">Structure</span>
                    </Button>
                    <Button
                      variant={activeMode === "window" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveMode("window")}
                      className="flex flex-col gap-1 h-auto py-3"
                    >
                      <Grid className="h-4 w-4" />
                      <span className="text-xs">Window</span>
                    </Button>
                    <Button
                      variant={activeMode === "door" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveMode("door")}
                      className="flex flex-col gap-1 h-auto py-3"
                    >
                      <DoorOpen className="h-4 w-4" />
                      <span className="text-xs">Door</span>
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={clearSelection}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                  <Button variant="outline" size="sm" disabled={selectedPanels.length < 2} onClick={mergePanels}>
                    <Merge className="h-4 w-4 mr-1" />
                    Merge
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={
                      selectedPanels.length !== 1 ||
                      !gridState.panels.flat().find((p) => selectedPanels.includes(p.id))?.merged
                    }
                    onClick={splitPanels}
                  >
                    <Split className="h-4 w-4 mr-1" />
                    Split
                  </Button>
                </div>

                {selectedPanels.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    {selectedPanels.length} panel{selectedPanels.length > 1 ? "s" : ""} selected
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Calculations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Total Panels:</span>
                    <Badge variant="secondary">{totals.totalPanels}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Structure Panels:</span>
                    <Badge variant="outline">{totals.structurePanels}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Window Panels:</span>
                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">{totals.windowPanels}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Door Panels:</span>
                    <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">{totals.doorPanels}</Badge>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total Area:</span>
                    <span>{(gridState.width * gridState.height).toFixed(2)} m²</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Grid className="h-5 w-5" />
                  Curtain Wall Designer
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Click panels to select them or change their type using the design tools. Select multiple panels to
                  merge them.
                </p>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/30 p-8 rounded-lg">
                  <div
                    className="grid gap-2 mx-auto"
                    style={{
                      gridTemplateColumns: gridState.colRatios.map((ratio) => `${ratio}fr`).join(" "),
                      gridTemplateRows: gridState.rowRatios.map((ratio) => `${ratio}fr`).join(" "),
                      maxWidth: "600px",
                      aspectRatio: `${gridState.cols}/${gridState.rows}`,
                    }}
                  >
                    {gridState.panels.map((row, rowIndex) =>
                      row.map((panel, colIndex) => {
                        if (panel.isSpanned) return null

                        const dimensions = getPanelDimensions(rowIndex, colIndex)

                        return (
                          <button
                            key={panel.id}
                            className={`
                              border-2 rounded-md transition-all duration-200 
                              flex flex-col items-center justify-center text-xs font-medium
                              ${getPanelColor(panel)}
                              hover:scale-105 active:scale-95 relative
                            `}
                            style={{
                              gridColumn: `span ${panel.colSpan || 1}`,
                              gridRow: `span ${panel.rowSpan || 1}`,
                              minHeight: "60px",
                            }}
                            onClick={() => handlePanelClick(rowIndex, colIndex)}
                          >
                            <div className="flex flex-col items-center gap-1">
                              {panel.type === "window" && <Grid className="h-4 w-4" />}
                              {panel.type === "door" && <DoorOpen className="h-4 w-4" />}
                              {panel.type === "structure" && <Square className="h-3 w-3" />}

                              <div className="text-[10px] text-center leading-tight">
                                <div className="font-semibold capitalize">{panel.type}</div>
                                <div className="text-muted-foreground">
                                  {dimensions.width}×{dimensions.height}m
                                </div>
                                {panel.merged && <div className="text-primary font-medium">Merged</div>}
                              </div>
                            </div>
                          </button>
                        )
                      }),
                    )}
                  </div>
                </div>

                <div className="mt-6 flex justify-center">
                  <Button size="lg" className="px-8">
                    Generate Quote
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
