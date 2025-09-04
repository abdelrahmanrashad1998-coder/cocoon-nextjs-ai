import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Network connectivity test function
export async function testNetworkConnectivity(): Promise<{ isConnected: boolean; latency?: number }> {
  try {
    const startTime = Date.now()
    const response = await fetch('https://www.google.com/favicon.ico', {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-cache'
    })
    const endTime = Date.now()
    const latency = endTime - startTime
    
    return { isConnected: true, latency }
  } catch (error) {
    return { isConnected: false }
  }
}

// Simple Firebase domain test (safer approach)
export async function testFirebaseDomain(): Promise<{ isReachable: boolean; error?: string }> {
  try {
    const response = await fetch('https://cocoon-aluminum-works.firebaseapp.com', {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-cache'
    })
    return { isReachable: true }
  } catch (error: any) {
    return { isReachable: false, error: error.message }
  }
}

// Minimal network diagnostic (no external API calls)
export async function runMinimalDiagnostic(): Promise<{
  isOnline: boolean
  canReachGoogle: boolean
  canReachFirebase: boolean
  message: string
}> {
  const isOnline = navigator.onLine
  
  if (!isOnline) {
    return {
      isOnline: false,
      canReachGoogle: false,
      canReachFirebase: false,
      message: "❌ Browser reports offline status"
    }
  }
  
  // Test Google connectivity (usually reliable)
  let canReachGoogle = false
  try {
    await fetch('https://www.google.com/favicon.ico', {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-cache'
    })
    canReachGoogle = true
  } catch (error) {
    canReachGoogle = false
  }
  
  // Test Firebase domain (simple HEAD request)
  let canReachFirebase = false
  try {
    await fetch('https://cocoon-aluminum-works.firebaseapp.com', {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-cache'
    })
    canReachFirebase = true
  } catch (error) {
    canReachFirebase = false
  }
  
  if (canReachGoogle && canReachFirebase) {
    return {
      isOnline: true,
      canReachGoogle: true,
      canReachFirebase: true,
      message: "✅ Network connectivity appears normal"
    }
  } else if (canReachGoogle && !canReachFirebase) {
    return {
      isOnline: true,
      canReachGoogle: true,
      canReachFirebase: false,
      message: "⚠️ Internet OK but Firebase domain blocked. Check firewall/proxy settings."
    }
  } else {
    return {
      isOnline: true,
      canReachGoogle: false,
      canReachFirebase: false,
      message: "❌ Internet connectivity issues detected"
    }
  }
}
