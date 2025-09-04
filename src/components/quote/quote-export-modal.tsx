'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { FileText, Download, Mail, Printer } from "lucide-react"
import { QuoteData, QuoteTotals } from "@/types/quote"

interface QuoteExportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  quoteData: QuoteData
  totals: QuoteTotals
  onExport: (options: any) => Promise<void>
}

export function QuoteExportModal({ 
  open, 
  onOpenChange, 
  quoteData, 
  totals, 
  onExport 
}: QuoteExportModalProps) {
  const [exportOptions, setExportOptions] = useState({
    format: 'pdf',
    pricingType: quoteData.settings.pricingType,
    customNotes: quoteData.settings.customNotes,
    expirationDays: quoteData.settings.expirationDays,
    projectDuration: quoteData.settings.projectDuration,
    discountPercentage: quoteData.settings.discountPercentage
  })
  const [loading, setLoading] = useState(false)

  const handleExport = async (type: 'pdf' | 'print' | 'email') => {
    setLoading(true)
    try {
      await onExport({
        ...exportOptions,
        type,
        quoteData,
        totals
      })
      onOpenChange(false)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateOption = (field: string, value: string | number) => {
    setExportOptions(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Export Quote
          </DialogTitle>
          <DialogDescription>
            Configure export options and choose your preferred export method
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Format */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Export Format</Label>
            <Select value={exportOptions.format} onValueChange={(value) => updateOption('format', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF Document</SelectItem>
                <SelectItem value="print">Print</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Pricing Options */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Pricing Display</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="totals-only"
                  name="pricingType"
                  value="totals"
                  checked={exportOptions.pricingType === 'totals'}
                  onChange={(e) => updateOption('pricingType', e.target.value)}
                  className="h-4 w-4"
                />
                <Label htmlFor="totals-only" className="flex-1">
                  <div className="font-medium">Show Totals Only</div>
                  <div className="text-sm text-muted-foreground">
                    Display only final totals without individual item prices
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="detailed-pricing"
                  name="pricingType"
                  value="detailed"
                  checked={exportOptions.pricingType === 'detailed'}
                  onChange={(e) => updateOption('pricingType', e.target.value)}
                  className="h-4 w-4"
                />
                <Label htmlFor="detailed-pricing" className="flex-1">
                  <div className="font-medium">Show Detailed Pricing</div>
                  <div className="text-sm text-muted-foreground">
                    Include individual item prices and breakdown
                  </div>
                </Label>
              </div>
            </div>
          </div>

          <Separator />

          {/* Quote Settings */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Quote Settings</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expirationDays" className="text-xs">Quote Expiration (days)</Label>
                <Input
                  id="expirationDays"
                  type="number"
                  min="1"
                  max="365"
                  value={exportOptions.expirationDays}
                  onChange={(e) => updateOption('expirationDays', parseInt(e.target.value) || 30)}
                  className="h-8"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="projectDuration" className="text-xs">Project Duration (days)</Label>
                <Input
                  id="projectDuration"
                  type="number"
                  min="1"
                  max="365"
                  value={exportOptions.projectDuration}
                  onChange={(e) => updateOption('projectDuration', parseInt(e.target.value) || 60)}
                  className="h-8"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discountPercentage" className="text-xs">Discount (%)</Label>
                <Input
                  id="discountPercentage"
                  type="number"
                  min="0"
                  max="50"
                  step="0.5"
                  value={exportOptions.discountPercentage}
                  onChange={(e) => updateOption('discountPercentage', parseFloat(e.target.value) || 0)}
                  className="h-8"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Custom Notes */}
          <div className="space-y-4">
            <Label htmlFor="customNotes" className="text-sm font-medium">Custom Notes</Label>
            <Textarea
              id="customNotes"
              value={exportOptions.customNotes}
              onChange={(e) => updateOption('customNotes', e.target.value)}
              placeholder="Enter custom notes for this quote..."
              rows={3}
            />
          </div>

          <Separator />

          {/* Export Actions */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Export Options</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button 
                onClick={() => handleExport('pdf')} 
                disabled={loading}
                className="w-full"
              >
                <Download className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
              <Button 
                onClick={() => handleExport('print')} 
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                <Printer className="mr-2 h-4 w-4" />
                Print Quote
              </Button>
              <Button 
                onClick={() => handleExport('email')} 
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                <Mail className="mr-2 h-4 w-4" />
                Email Quote
              </Button>
            </div>
          </div>

          {/* Quote Summary */}
          <div className="bg-muted p-4 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-medium text-muted-foreground">Items</div>
                <div className="text-lg font-bold">{quoteData.items.length}</div>
              </div>
              <div>
                <div className="font-medium text-muted-foreground">Total Area</div>
                <div className="text-lg font-bold">{totals.totalArea} m²</div>
              </div>
              <div>
                <div className="font-medium text-muted-foreground">Total Price</div>
                <div className="text-lg font-bold">${totals.totalPrice.toLocaleString()}</div>
              </div>
              <div>
                <div className="font-medium text-muted-foreground">Customer</div>
                <div className="text-lg font-bold">{quoteData.contactInfo.name || 'Not specified'}</div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
