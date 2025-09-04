'use client'

import { useState, useCallback, useMemo } from 'react'
import { QuoteItem, QuoteData, ContactInfo, QuoteSettings, QuoteTotals, PricedItem } from '@/types/quote'
import { calculateItemPricing, calculateQuoteTotals } from '@/lib/pricing-calculator'

const defaultProfile = {
  profile_code: 'AL001',
  brand: 'Cocoon',
  profile_name: 'Standard Aluminum Profile',
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
  base_profit_rate: 0.3
}

const createDefaultItem = (): QuoteItem => ({
  id: Math.random().toString(36).substr(2, 9),
  type: 'window',
  system: 'Sliding',
  width: 1.2,
  height: 1.5,
  leaves: 2,
  quantity: 1,
  glassType: 'double',
  mosquito: false,
  arch: false,
  profile: undefined
})

const createDefaultQuote = (): QuoteData => ({
  id: Math.random().toString(36).substr(2, 9),
  createdAt: new Date().toISOString(),
  contactInfo: {
    name: '',
    email: '',
    phone: '',
    location: '',
    notes: ''
  },
  items: [],
  settings: {
    expirationDays: 30,
    projectDuration: 60,
    discountPercentage: 0,
    customNotes: 'Standard aluminum work installation with professional finishing.',
    pricingType: 'totals'
  }
})

export const useQuoteGenerator = () => {
  const [quoteData, setQuoteData] = useState<QuoteData>(createDefaultQuote())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addItem = useCallback(() => {
    setQuoteData(prev => ({
      ...prev,
      items: [...prev.items, createDefaultItem()]
    }))
  }, [])

  const updateItem = useCallback((index: number, updatedItem: QuoteItem) => {
    setQuoteData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => i === index ? updatedItem : item)
    }))
  }, [])

  const removeItem = useCallback((index: number) => {
    setQuoteData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }, [])

  const updateContactInfo = useCallback((field: keyof ContactInfo, value: string) => {
    setQuoteData(prev => ({
      ...prev,
      contactInfo: {
        ...prev.contactInfo,
        [field]: value
      }
    }))
  }, [])

  const updateSettings = useCallback((field: keyof QuoteSettings, value: string | number) => {
    setQuoteData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [field]: value
      }
    }))
  }, [])

  const calculateDetailedPricing = useCallback((item: QuoteItem): PricedItem => {
    return calculateItemPricing(item)
  }, [])

  const calculateTotals = useCallback((): QuoteTotals => {
    const pricedItems = quoteData.items.map(calculateDetailedPricing)
    const totals = calculateQuoteTotals(pricedItems)
    
    // Apply discount
    const discountAmount = (totals.totalPrice * quoteData.settings.discountPercentage) / 100
    const discountedTotal = totals.totalPrice - discountAmount
    
    return {
      ...totals,
      totalPrice: +discountedTotal.toFixed(2),
      downPayment: +(discountedTotal * 0.8).toFixed(2),
      supplyPayment: +(discountedTotal * 0.1).toFixed(2),
      completePayment: +(discountedTotal * 0.1).toFixed(2),
      m2Price: totals.totalArea > 0 ? +(discountedTotal / totals.totalArea).toFixed(2) : 0,
    }
  }, [quoteData, calculateDetailedPricing])

  const saveQuote = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      // TODO: Implement Firebase save
      console.log('Saving quote:', quoteData)
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
    } catch (err) {
      setError('Failed to save quote')
      throw err
    } finally {
      setLoading(false)
    }
  }, [quoteData])

  const exportQuote = useCallback(async (exportOptions: any) => {
    setLoading(true)
    setError(null)
    
    try {
      // TODO: Implement PDF export
      console.log('Exporting quote with options:', exportOptions)
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
    } catch (err) {
      setError('Failed to export quote')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

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
    error
  }
}
