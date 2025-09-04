'use client'

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Square, 
  Layout, 
  DoorOpen, 
  Calculator, 
  Grid3X3, 
  Move, 
  Group, 
  Ungroup,
  X,
  Info
} from "lucide-react"

interface CurtainPanel {
  id: string
  type: 'structure' | 'window' | 'door'
  widthMeters: number
  heightMeters: number
  left: number
  top: number
  col: number
  row: number
  mergedId?: string
  selected?: boolean
}

interface CurtainWallDesignerProps {
  wallWidth: number
  wallHeight: number
  onDesignChange: (design: {
    panels: CurtainPanel[]
    frameMeters: number
    windowMeters: number
    glassArea: number
    cornerCount: number
  }) => void
}

export function CurtainWallDesigner({ wallWidth, wallHeight, onDesignChange }: CurtainWallDesignerProps) {
  const [mode, setMode] = useState<'structure' | 'window' | 'door'>('structure')
  const [columns, setColumns] = useState(4)
  const [rows, setRows] = useState(3)
  const [panels, setPanels] = useState<CurtainPanel[]>([])
  const [selectedPanels, setSelectedPanels] = useState<string[]>([])
  const [columnSizes, setColumnSizes] = useState<number[]>([])
  const [rowSizes, setRowSizes] = useState<number[]>([])

  // Initialize grid when dimensions change
  useEffect(() => {
    generateGrid()
  }, [generateGrid])

  // Update column sizes when columns change
  useEffect(() => {
    const newColumnSizes = Array(columns).fill(wallWidth / columns)
    setColumnSizes(newColumnSizes)
  }, [columns, wallWidth])

  // Update row sizes when rows change
  useEffect(() => {
    const newRowSizes = Array(rows).fill(wallHeight / rows)
    setRowSizes(newRowSizes)
  }, [rows, wallHeight])

  const generateGrid = useCallback(() => {
    const newPanels: CurtainPanel[] = []
    let panelId = 0

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const panel: CurtainPanel = {
          id: `panel-${panelId}`,
          type: 'structure',
          widthMeters: columnSizes[col] || wallWidth / columns,
          heightMeters: rowSizes[row] || wallHeight / rows,
          left: col * (100 / columns),
          top: row * (100 / rows),
          col,
          row,
        }
        newPanels.push(panel)
        panelId++
      }
    }
    setPanels(newPanels)
  }, [columns, rows, wallWidth, wallHeight, columnSizes, rowSizes])

  const handlePanelClick = (panelId: string, event: React.MouseEvent) => {
    if (event.ctrlKey || event.metaKey) {
      // Multi-select
      setSelectedPanels(prev => 
        prev.includes(panelId) 
          ? prev.filter(id => id !== panelId)
          : [...prev, panelId]
      )
    } else {
      // Single select
      setSelectedPanels([panelId])
    }
  }

  const handlePanelTypeChange = () => {
    if (selectedPanels.length === 0) return

    const updatedPanels = panels.map(panel => 
      selectedPanels.includes(panel.id) 
        ? { ...panel, type: mode }
        : panel
    )
    setPanels(updatedPanels)
    calculateDesign(updatedPanels)
  }

  const mergePanels = () => {
    if (selectedPanels.length < 2) return

    const mergedId = `merged-${Date.now()}`
    
    const updatedPanels = panels.map(panel => 
      selectedPanels.includes(panel.id) 
        ? { ...panel, mergedId, selected: true }
        : panel
    )
    
    setPanels(updatedPanels)
    setSelectedPanels([mergedId])
    calculateDesign(updatedPanels)
  }

  const splitPanels = () => {
    const updatedPanels = panels.map(panel => ({
      ...panel,
      mergedId: undefined,
      selected: false
    }))
    setPanels(updatedPanels)
    setSelectedPanels([])
    calculateDesign(updatedPanels)
  }

  const clearSelection = () => {
    setSelectedPanels([])
  }

  const calculateDesign = (currentPanels: CurtainPanel[]) => {
    let frameMeters = 0
    let windowMeters = 0
    let glassArea = 0
    let cornerCount = 0

    // Calculate external perimeter
    frameMeters = 2 * (wallWidth + wallHeight)

    // Calculate window/door meters and glass area
    currentPanels.forEach(panel => {
      if (panel.type === 'window' || panel.type === 'door') {
        windowMeters += 2 * (panel.widthMeters + panel.heightMeters)
        glassArea += panel.widthMeters * panel.heightMeters
      }
    })

    // Calculate corners (4 corners for rectangular wall)
    cornerCount = 4

    onDesignChange({
      panels: currentPanels,
      frameMeters,
      windowMeters,
      glassArea,
      cornerCount
    })
  }

  const getPanelStyle = (panel: CurtainPanel) => {
    const baseStyle = {
      position: 'absolute' as const,
      left: `${panel.left}%`,
      top: `${panel.top}%`,
      width: `${100 / columns}%`,
      height: `${100 / rows}%`,
      border: '2px solid',
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column' as const,
      padding: '8px',
      fontSize: '0.75rem',
      fontWeight: 600,
    }

    let borderColor = '#ddd'
    let backgroundColor = 'white'

    if (panel.type === 'structure') {
      borderColor = '#2ecc71'
      backgroundColor = '#e9f7ef'
    } else if (panel.type === 'window') {
      borderColor = '#42a5f5'
      backgroundColor = '#e3f2fd'
    } else if (panel.type === 'door') {
      borderColor = '#ffca28'
      backgroundColor = '#ffecb3'
    }

    if (selectedPanels.includes(panel.id)) {
      borderColor = '#a72036'
      backgroundColor = 'rgba(167, 32, 54, 0.1)'
    }

    if (panel.mergedId) {
      borderColor = '#a72036'
      backgroundColor = 'rgba(167, 32, 54, 0.1)'
    }

    return {
      ...baseStyle,
      borderColor,
      backgroundColor,
    }
  }

  const getPanelIcon = (type: string) => {
    switch (type) {
      case 'structure':
        return <Square className="h-4 w-4 text-green-600" />
      case 'window':
        return <Layout className="h-4 w-4 text-blue-600" />
      case 'door':
        return <DoorOpen className="h-4 w-4 text-yellow-600" />
      default:
        return <Square className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid3X3 className="h-5 w-5" />
            Curtain Wall Designer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Design Tools */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Design Tools</Label>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={mode === 'structure' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMode('structure')}
                className="flex items-center gap-2"
              >
                <Square className="h-4 w-4 text-green-600" />
                Structure
              </Button>
              <Button
                variant={mode === 'window' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMode('window')}
                className="flex items-center gap-2"
              >
                <Layout className="h-4 w-4 text-blue-600" />
                Window
              </Button>
              <Button
                variant={mode === 'door' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMode('door')}
                className="flex items-center gap-2"
              >
                <DoorOpen className="h-4 w-4 text-yellow-600" />
                Door
              </Button>
            </div>
          </div>

          {/* Setup Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Columns (Width)</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={columns}
                onChange={(e) => setColumns(parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="space-y-2">
              <Label>Rows (Height)</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={rows}
                onChange={(e) => setRows(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>

          {/* Wall Dimensions */}
          <div className="space-y-2">
            <Label>Wall Dimensions</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Width (m)"
                value={wallWidth}
                disabled
              />
              <Input
                type="number"
                placeholder="Height (m)"
                value={wallHeight}
                disabled
              />
            </div>
          </div>

          {/* Panel Actions */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={clearSelection}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Clear Selection
            </Button>
                          <Button
                variant="outline"
                size="sm"
                onClick={mergePanels}
                disabled={selectedPanels.length < 2}
                className="flex items-center gap-2"
              >
                <Group className="h-4 w-4" />
                Merge Panels
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={splitPanels}
                className="flex items-center gap-2"
              >
                <Ungroup className="h-4 w-4" />
                Split Panel
              </Button>
            <Button
              size="sm"
              onClick={handlePanelTypeChange}
              disabled={selectedPanels.length === 0}
              className="flex items-center gap-2"
            >
              <Move className="h-4 w-4" />
              Apply {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </Button>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
            <div className="flex items-start gap-2">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium mb-2">How to design your curtain wall:</p>
                <ul className="space-y-1 text-gray-700">
                  <li>• Set the number of columns and rows</li>
                  <li>• Select a tool (Structure, Window, or Door)</li>
                  <li>• Click on panels to assign types</li>
                  <li>• Hold Ctrl/Cmd and click to select multiple panels</li>
                  <li>• Use Merge/Split to combine or separate panels</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Design Area */}
      <Card>
        <CardHeader>
          <CardTitle>Design Area</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative border-2 border-dashed border-gray-300 rounded-lg bg-white min-h-[400px] p-4">
            <div className="relative w-full h-[400px] bg-gray-50 rounded">
              {panels.map((panel) => (
                <div
                  key={panel.id}
                  style={getPanelStyle(panel)}
                  onClick={(e) => handlePanelClick(panel.id, e)}
                  className="hover:scale-105 hover:shadow-md"
                >
                  {getPanelIcon(panel.type)}
                  <span className="text-xs mt-1">
                    {panel.type.charAt(0).toUpperCase() + panel.type.slice(1)}
                  </span>
                  {panel.mergedId && (
                    <Badge variant="secondary" className="text-xs mt-1">
                      Merged
                    </Badge>
                  )}
                </div>
              ))}
            </div>
            <div className="text-center text-sm text-gray-500 mt-2">
              Hold Ctrl/Cmd and click to select multiple panels
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calculations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Calculations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {panels.filter(p => p.type === 'window' || p.type === 'door').length}
              </div>
              <div className="text-sm text-gray-600">Windows/Doors</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {panels.filter(p => p.type === 'structure').length}
              </div>
              <div className="text-sm text-gray-600">Structure Panels</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {panels.length}
              </div>
              <div className="text-sm text-gray-600">Total Panels</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {panels.filter(p => p.mergedId).length}
              </div>
              <div className="text-sm text-gray-600">Merged Groups</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
