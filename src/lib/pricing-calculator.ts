import { QuoteItem, PricedItem } from "@/types/quote"
import { AluminiumProfile } from "@/components/profile/profile-manager"

export function calculateItemPricing(item: QuoteItem): PricedItem {
  const area = item.width * item.height * item.quantity
  const frameLength = 2 * (item.width + item.height) * item.quantity
  const leafPerimeter = 2 * (item.width + item.height) * item.quantity
  const totalLeafLength = leafPerimeter * item.leaves

  let frameCost = 0
  let leafCost = 0
  let glassCost = 0
  let netCost = 0
  let archCost = 0
  let accessories = 0

  if (item.profile) {
    const profile = item.profile as AluminiumProfile
    
    // Frame cost calculation
    frameCost = frameLength * profile.frame_price
    
    // Leaf cost calculation
    leafCost = totalLeafLength * profile.leaf_price
    
    // Glass cost calculation
    const glassPrice = item.glassType === 'double' ? profile.glass_price_double : profile.glass_price_single
    glassCost = area * glassPrice
    
    // Net cost calculation
    if (item.mosquito) {
      if (item.netType === 'plisse') {
        netCost = area * profile.net_price_plisse
      } else if (item.netType === 'panda') {
        netCost = area * profile.net_price_panda
      } else {
        netCost = area * profile.net_price
      }
    }
    
    // Architrave cost calculation
    if (item.arch) {
      archCost = frameLength * profile.arc_price
    }
    
    // Accessories cost calculation
    if (item.leaves === 2) {
      accessories = profile.accessories_2_leaves
    } else if (item.leaves === 3) {
      accessories = profile.accessories_3_leaves
    } else if (item.leaves === 4) {
      accessories = profile.accessories_4_leaves
    }
  }

  const totalBeforeProfit = frameCost + leafCost + glassCost + netCost + archCost + accessories
  const profitAmount = totalBeforeProfit * ((item.profile?.base_profit_rate || 0) / 100)
  const totalPrice = totalBeforeProfit + profitAmount
  const m2Price = area > 0 ? totalPrice / area : 0
  const profitPercentage = totalBeforeProfit > 0 ? ((profitAmount / totalBeforeProfit) * 100) : 0

  // Curtain wall specific calculations
  let frameMeters = 0
  let windowMeters = 0
  let glassArea = 0
  let numWindows = 0
  let numDoors = 0
  let cornerCount = 0
  let frameAccessories = 0
  let cornersCost = 0

  if (item.type === 'curtain_wall' && item.designData) {
    frameMeters = item.designData.frameMeters || 0
    windowMeters = item.designData.windowMeters || 0
    glassArea = item.designData.glassArea || 0
    cornerCount = item.designData.cornerCount || 0
    
    // Count windows and doors from panels
    if (item.designData.panels) {
      numWindows = item.designData.panels.filter(p => p.type === 'window').length
      numDoors = item.designData.panels.filter(p => p.type === 'door').length
    }

    // Curtain wall specific pricing
    if (item.profile) {
      const profile = item.profile as AluminiumProfile
      
      // Frame cost for curtain wall
      frameCost = frameMeters * profile.frame_price
      
      // Window/door cost
      leafCost = windowMeters * profile.leaf_price
      
      // Glass cost for curtain wall
      const glassPrice = item.glassType === 'double' ? profile.glass_price_double : profile.glass_price_single
      glassCost = glassArea * glassPrice
      
      // Corner costs (if any)
      cornersCost = cornerCount * (profile.frame_price * 0.5) // Estimate corner cost
      
      // Frame accessories
      frameAccessories = frameMeters * (profile.frame_price * 0.1) // Estimate accessories
    }
  }

  return {
    ...item,
    area,
    frameLength,
    leafPerimeter,
    totalLeafLength,
    accessories,
    frameCost,
    leafCost,
    glassCost,
    netCost,
    archCost,
    totalBeforeProfit,
    profitAmount,
    totalPrice,
    m2Price,
    profitPercentage,
    // Curtain wall specific
    frameMeters,
    windowMeters,
    glassArea,
    numWindows,
    numDoors,
    cornerCount,
    frameAccessories,
    cornersCost,
  }
}

export function calculateQuoteTotals(items: PricedItem[]) {
  const totals = {
    totalArea: 0,
    totalBeforeProfit: 0,
    totalPrice: 0,
    totalProfit: 0,
    downPayment: 0,
    supplyPayment: 0,
    completePayment: 0,
    m2Price: 0,
    profitPercentage: 0,
  }

  items.forEach(item => {
    totals.totalArea += item.area
    totals.totalBeforeProfit += item.totalBeforeProfit
    totals.totalPrice += item.totalPrice
    totals.totalProfit += item.profitAmount
  })

  if (totals.totalArea > 0) {
    totals.m2Price = totals.totalPrice / totals.totalArea
  }

  if (totals.totalBeforeProfit > 0) {
    totals.profitPercentage = (totals.totalProfit / totals.totalBeforeProfit) * 100
  }

  // Payment schedule (80% down, 10% supply, 10% completion)
  totals.downPayment = totals.totalPrice * 0.8
  totals.supplyPayment = totals.totalPrice * 0.1
  totals.completePayment = totals.totalPrice * 0.1

  return totals
}
