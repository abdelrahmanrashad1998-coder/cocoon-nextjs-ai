'use client'

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Info,
  RotateCcw,
  Save,
  Download,
  Eye,
  Settings,
  Zap,
  Ruler,
  Package,
  DollarSign,
  Layers,
  Copy,
  Trash2,
  Plus,
  Minus,
  Maximize2,
  Minimize2
} from "lucide-react"

interface CurtainPanel {
  id: string
  type: 'structure' | 'window' | 'door' | 'corner' | 'mullion'
  widthMeters: number
  heightMeters: number
  left: number
  top: number
  col: number
  row: number
  colSpan: number
  rowSpan: number
  mergedId?: string
  selected?: boolean
  material?: 'aluminum' | 'steel' | 'composite'
  glassType?: 'single' | 'double' | 'triple' | 'laminated'
  frameColor?: string
  isSpanned?: boolean
}

interface DesignPreset {
  name: string
  description: string
  columns: number
  rows: number
  layout: string[][]
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
    totalCost: number
    materialBreakdown: Record<string, number>
  }) => void
}

export function CurtainWallDesigner({ wallWidth, wallHeight, onDesignChange }: CurtainWallDesignerProps) {
  const [mode, setMode] = useState<'structure' | 'window' | 'door' | 'corner' | 'mullion'>('structure')
  const [columns, setColumns] = useState(4)
  const [rows, setRows] = useState(3)
  const [panels, setPanels] = useState<CurtainPanel[]>([])
  const [selectedPanels, setSelectedPanels] = useState<string[]>([])
  const [columnSizes, setColumnSizes] = useState<number[]>([])
  const [rowSizes, setRowSizes] = useState<number[]>([])
  const [material, setMaterial] = useState<'aluminum' | 'steel' | 'composite'>('aluminum')
  const [glassType, setGlassType] = useState<'single' | 'double' | 'triple' | 'laminated'>('double')
  const [frameColor, setFrameColor] = useState('#606060')
  const [showGrid, setShowGrid] = useState(true)
  const [zoom, setZoom] = useState(1)
  const [activeTab, setActiveTab] = useState('design')
  const canvasRef = useRef<HTMLDivElement>(null)

  // Design presets
  const presets: DesignPreset[] = [
    {
      name: 'Standard Office',
      description: '4x3 grid with mixed windows and structure',
      columns: 4,
      rows: 3,
      layout: [
        ['structure', 'window', 'window', 'structure'],
        ['structure', 'window', 'window', 'structure'],
        ['structure', 'structure', 'structure', 'structure']
      ]
    },
    {
      name: 'Retail Front',
      description: 'Wide windows with minimal structure',
      columns: 6,
      rows: 2,
      layout: [
        ['structure', 'window', 'window', 'window', 'window', 'structure'],
        ['structure', 'structure', 'structure', 'structure', 'structure', 'structure']
      ]
    },
    {
      name: 'Residential',
      description: 'Balanced mix for homes',
      columns: 3,
      rows: 4,
      layout: [
        ['structure', 'window', 'structure'],
        ['structure', 'window', 'structure'],
        ['structure', 'door', 'structure'],
        ['structure', 'structure', 'structure']
      ]
    }
  ]

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
          colSpan: 1,
          rowSpan: 1,
          material,
          glassType,
          frameColor,
          isSpanned: false
        }
        newPanels.push(panel)
        panelId++
      }
    }
    setPanels(newPanels)
  }, [columns, rows, wallWidth, wallHeight, columnSizes, rowSizes, material, glassType, frameColor])

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

  // Initialize grid when dimensions change
  useEffect(() => {
    generateGrid()
  }, [generateGrid])

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

  // Apply preset design
  const applyPreset = (preset: DesignPreset) => {
    setColumns(preset.columns)
    setRows(preset.rows)
    
    setTimeout(() => {
      const newPanels: CurtainPanel[] = []
      let panelId = 0

      for (let row = 0; row < preset.rows; row++) {
        for (let col = 0; col < preset.columns; col++) {
          const panelType = preset.layout[row]?.[col] || 'structure'
          const panel: CurtainPanel = {
            id: `panel-${panelId}`,
            type: panelType as any,
            widthMeters: wallWidth / preset.columns,
            heightMeters: wallHeight / preset.rows,
            left: col * (100 / preset.columns),
            top: row * (100 / preset.rows),
            col,
            row,
            colSpan: 1,
            rowSpan: 1,
            material,
            glassType,
            frameColor,
            isSpanned: false
          }
          newPanels.push(panel)
          panelId++
        }
      }
      setPanels(newPanels)
      calculateDesign(newPanels)
    }, 100)
  }

  // Enhanced calculations with pricing
  const calculateDesign = (currentPanels: CurtainPanel[]) => {
    let frameMeters = 0
    let windowMeters = 0
    let glassArea = 0
    let cornerCount = 4
    let totalCost = 0
    const materialBreakdown: Record<string, number> = {
      aluminum: 0,
      steel: 0,
      composite: 0,
      glass: 0,
      hardware: 0
    }

    // Calculate external perimeter
    frameMeters = 2 * (wallWidth + wallHeight)

    // Calculate window/door meters and glass area
    currentPanels.forEach(panel => {
      if (panel.type === 'window' || panel.type === 'door') {
        windowMeters += 2 * (panel.widthMeters + panel.heightMeters)
        glassArea += panel.widthMeters * panel.heightMeters
      }
    })

    // Calculate costs based on material and glass type
    const materialCosts = {
      aluminum: 45, // per meter
      steel: 65,
      composite: 55,
      glass: {
        single: 80,
        double: 120,
        triple: 180,
        laminated: 150
      }
    }

    // Frame cost
    const frameCost = frameMeters * materialCosts[material]
    materialBreakdown[material] = frameCost

    // Glass cost
    const glassCost = glassArea * materialCosts.glass[glassType]
    materialBreakdown.glass = glassCost

    // Hardware cost (estimated 15% of total)
    const hardwareCost = (frameCost + glassCost) * 0.15
    materialBreakdown.hardware = hardwareCost

    totalCost = frameCost + glassCost + hardwareCost

    onDesignChange({
      panels: currentPanels,
      frameMeters,
      windowMeters,
      glassArea,
      cornerCount,
      totalCost,
      materialBreakdown
    })
  }

  const getPanelStyle = (panel: CurtainPanel) => {
    const baseStyle = {
      position: 'absolute' as const,
      left: `${panel.left}%`,
      top: `${panel.top}%`,
      width: `${(100 / columns) * panel.colSpan}%`,
      height: `${(100 / rows) * panel.rowSpan}%`,
      border: '2px solid',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column' as const,
      padding: '12px',
      fontSize: '0.75rem',
      fontWeight: 600,
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
      backdropFilter: 'blur(10px)',
    }

    let borderColor = '#e5e7eb'
    let backgroundColor = 'rgba(255,255,255,0.8)'
    let textColor = '#374151'

    switch (panel.type) {
      case 'structure':
        borderColor = '#10b981'
        backgroundColor = 'rgba(16, 185, 129, 0.1)'
        textColor = '#065f46'
        break
      case 'window':
        borderColor = '#3b82f6'
        backgroundColor = 'rgba(59, 130, 246, 0.1)'
        textColor = '#1e40af'
        break
      case 'door':
        borderColor = '#f59e0b'
        backgroundColor = 'rgba(245, 158, 11, 0.1)'
        textColor = '#92400e'
        break
      case 'corner':
        borderColor = '#8b5cf6'
        backgroundColor = 'rgba(139, 92, 246, 0.1)'
        textColor = '#5b21b6'
        break
      case 'mullion':
        borderColor = '#6b7280'
        backgroundColor = 'rgba(107, 114, 128, 0.1)'
        textColor = '#374151'
        break
    }

    if (selectedPanels.includes(panel.id)) {
      borderColor = '#a72036'
      backgroundColor = 'rgba(167, 32, 54, 0.15)'
      textColor = '#7f1d1d'
      baseStyle.boxShadow = '0 0 0 3px rgba(167, 32, 54, 0.3), 0 4px 12px rgba(0,0,0,0.15)'
    }

    if (panel.mergedId) {
      borderColor = '#a72036'
      backgroundColor = 'rgba(167, 32, 54, 0.1)'
      textColor = '#7f1d1d'
    }

    return {
      ...baseStyle,
      borderColor,
      backgroundColor,
      color: textColor,
    }
  }

  const getPanelIcon = (type: string) => {
    switch (type) {
      case 'structure':
        return <Square className="h-5 w-5" />
      case 'window':
        return <Layout className="h-5 w-5" />
      case 'door':
        return <DoorOpen className="h-5 w-5" />
      case 'corner':
        return <Maximize2 className="h-5 w-5" />
      case 'mullion':
        return <Minimize2 className="h-5 w-5" />
      default:
        return <Square className="h-5 w-5" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Grid3X3 className="h-6 w-6 text-primary" />
              <span>Advanced Curtain Wall Designer</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowGrid(!showGrid)}>
                <Eye className="h-4 w-4 mr-1" />
                {showGrid ? 'Hide' : 'Show'} Grid
              </Button>
              <Button variant="outline" size="sm" onClick={generateGrid}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Main Content with Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="design" className="flex items-center gap-2">
            <Grid3X3 className="h-4 w-4" />
            Design
          </TabsTrigger>
          <TabsTrigger value="materials" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Materials
          </TabsTrigger>
          <TabsTrigger value="calculations" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Calculations
          </TabsTrigger>
          <TabsTrigger value="presets" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Presets
          </TabsTrigger>
        </TabsList>

        {/* Design Tab */}
        <TabsContent value="design" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Design Tools */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Design Tools
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-3 block">Panel Types</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={mode === 'structure' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setMode('structure')}
                      className="flex flex-col gap-1 h-auto py-3"
                    >
                      <Square className="h-4 w-4" />
                      <span className="text-xs">Structure</span>
                    </Button>
                    <Button
                      variant={mode === 'window' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setMode('window')}
                      className="flex flex-col gap-1 h-auto py-3"
                    >
                      <Layout className="h-4 w-4" />
                      <span className="text-xs">Window</span>
                    </Button>
                    <Button
                      variant={mode === 'door' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setMode('door')}
                      className="flex flex-col gap-1 h-auto py-3"
                    >
                      <DoorOpen className="h-4 w-4" />
                      <span className="text-xs">Door</span>
                    </Button>
                    <Button
                      variant={mode === 'corner' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setMode('corner')}
                      className="flex flex-col gap-1 h-auto py-3"
                    >
                      <Maximize2 className="h-4 w-4" />
                      <span className="text-xs">Corner</span>
                    </Button>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-sm font-medium mb-3 block">Grid Settings</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="cols" className="text-xs">Columns</Label>
                      <Input
                        id="cols"
                        type="number"
                        min="1"
                        max="10"
                        value={columns}
                        onChange={(e) => setColumns(parseInt(e.target.value) || 1)}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label htmlFor="rows" className="text-xs">Rows</Label>
                      <Input
                        id="rows"
                        type="number"
                        min="1"
                        max="10"
                        value={rows}
                        onChange={(e) => setRows(parseInt(e.target.value) || 1)}
                        className="h-8"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-sm font-medium mb-3 block">Actions</Label>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearSelection}
                      className="w-full justify-start"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear Selection
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={mergePanels}
                      disabled={selectedPanels.length < 2}
                      className="w-full justify-start"
                    >
                      <Group className="h-4 w-4 mr-2" />
                      Merge Panels
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={splitPanels}
                      className="w-full justify-start"
                    >
                      <Ungroup className="h-4 w-4 mr-2" />
                      Split Panel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handlePanelTypeChange}
                      disabled={selectedPanels.length === 0}
                      className="w-full justify-start"
                    >
                      <Move className="h-4 w-4 mr-2" />
                      Apply {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </Button>
                  </div>
                </div>

                {selectedPanels.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    {selectedPanels.length} panel{selectedPanels.length > 1 ? "s" : ""} selected
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Design Canvas */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Design Canvas</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="text-sm font-medium">{Math.round(zoom * 100)}%</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative border-2 border-dashed border-gray-300 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 min-h-[500px] p-4">
                    <div 
                      ref={canvasRef}
                      className="relative w-full h-[500px] bg-white rounded-lg shadow-inner overflow-hidden"
                      style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
                    >
                      {/* Grid Lines */}
                      {showGrid && (
                        <div className="absolute inset-0 pointer-events-none">
                          {Array.from({ length: columns + 1 }).map((_, i) => (
                            <div
                              key={`v-${i}`}
                              className="absolute top-0 bottom-0 w-px bg-gray-200"
                              style={{ left: `${(i * 100) / columns}%` }}
                            />
                          ))}
                          {Array.from({ length: rows + 1 }).map((_, i) => (
                            <div
                              key={`h-${i}`}
                              className="absolute left-0 right-0 h-px bg-gray-200"
                              style={{ top: `${(i * 100) / rows}%` }}
                            />
                          ))}
                        </div>
                      )}

                      {/* Panels */}
                      {panels.map((panel) => (
                        <div
                          key={panel.id}
                          style={getPanelStyle(panel)}
                          onClick={(e) => handlePanelClick(panel.id, e)}
                          className="hover:scale-105 hover:shadow-lg hover:z-10 relative"
                        >
                          <div className="flex flex-col items-center gap-1">
                            {getPanelIcon(panel.type)}
                            <span className="text-xs font-medium text-center leading-tight">
                              {panel.type.charAt(0).toUpperCase() + panel.type.slice(1)}
                            </span>
                            <div className="text-[10px] text-muted-foreground text-center">
                              {panel.widthMeters.toFixed(1)}×{panel.heightMeters.toFixed(1)}m
                            </div>
                            {panel.mergedId && (
                              <Badge variant="secondary" className="text-[10px] px-1 py-0">
                                Merged
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="text-center text-sm text-muted-foreground mt-3">
                      Hold Ctrl/Cmd and click to select multiple panels • Use mouse wheel to zoom
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Materials Tab */}
        <TabsContent value="materials" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Material Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Frame Material</Label>
                    <Select value={material} onValueChange={(value: any) => setMaterial(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aluminum">Aluminum</SelectItem>
                        <SelectItem value="steel">Steel</SelectItem>
                        <SelectItem value="composite">Composite</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Glass Type</Label>
                    <Select value={glassType} onValueChange={(value: any) => setGlassType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single Glazing</SelectItem>
                        <SelectItem value="double">Double Glazing</SelectItem>
                        <SelectItem value="triple">Triple Glazing</SelectItem>
                        <SelectItem value="laminated">Laminated Glass</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Frame Color</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={frameColor}
                        onChange={(e) => setFrameColor(e.target.value)}
                        className="w-8 h-8 rounded border"
                      />
                      <Input
                        value={frameColor}
                        onChange={(e) => setFrameColor(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <Label className="text-sm font-medium mb-3 block">Material Specifications</Label>
                  <div className="space-y-3">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Frame Material: {material.charAt(0).toUpperCase() + material.slice(1)}</h4>
                      <p className="text-sm text-blue-700">
                        {material === 'aluminum' && 'Lightweight, corrosion-resistant, excellent thermal performance'}
                        {material === 'steel' && 'High strength, fire-resistant, suitable for large spans'}
                        {material === 'composite' && 'Combines benefits of multiple materials, enhanced durability'}
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-2">Glass Type: {glassType.charAt(0).toUpperCase() + glassType.slice(1)}</h4>
                      <p className="text-sm text-green-700">
                        {glassType === 'single' && 'Basic glazing, cost-effective for interior applications'}
                        {glassType === 'double' && 'Improved thermal insulation and sound reduction'}
                        {glassType === 'triple' && 'Maximum energy efficiency and acoustic performance'}
                        {glassType === 'laminated' && 'Safety glass with enhanced security and sound control'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calculations Tab */}
        <TabsContent value="calculations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Panel Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
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
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Cost Estimation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      ${panels.length > 0 ? (panels.reduce((acc, panel) => {
                        const frameCost = 2 * (panel.widthMeters + panel.heightMeters) * 45
                        const glassCost = panel.type === 'window' || panel.type === 'door' 
                          ? panel.widthMeters * panel.heightMeters * 120 
                          : 0
                        return acc + frameCost + glassCost
                      }, 0)).toLocaleString() : '0'}
                    </div>
                    <div className="text-sm text-gray-600">Estimated Total Cost</div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Frame Material ({material}):</span>
                      <span>${(2 * (wallWidth + wallHeight) * (material === 'aluminum' ? 45 : material === 'steel' ? 65 : 55)).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Glass Area:</span>
                      <span>{panels.filter(p => p.type === 'window' || p.type === 'door').reduce((acc, panel) => acc + panel.widthMeters * panel.heightMeters, 0).toFixed(1)} m²</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Glass Cost:</span>
                      <span>${(panels.filter(p => p.type === 'window' || p.type === 'door').reduce((acc, panel) => acc + panel.widthMeters * panel.heightMeters, 0) * (glassType === 'single' ? 80 : glassType === 'double' ? 120 : glassType === 'triple' ? 180 : 150)).toLocaleString()}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-medium">
                      <span>Total Area:</span>
                      <span>{(wallWidth * wallHeight).toFixed(1)} m²</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Presets Tab */}
        <TabsContent value="presets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Design Presets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {presets.map((preset, index) => (
                  <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg">{preset.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{preset.description}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="font-medium">Grid:</span> {preset.columns}×{preset.rows}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Panels:</span> {preset.columns * preset.rows}
                        </div>
                        <Button 
                          onClick={() => applyPreset(preset)}
                          className="w-full mt-3"
                          size="sm"
                        >
                          Apply Preset
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
