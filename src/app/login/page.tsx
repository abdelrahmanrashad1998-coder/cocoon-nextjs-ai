'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { runMinimalDiagnostic } from "@/lib/utils"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isOnline, setIsOnline] = useState(true)
  const [isDiagnosing, setIsDiagnosing] = useState(false)
  const [diagnosticResult, setDiagnosticResult] = useState("")
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    displayName: "",
    confirmPassword: ""
  })
  
  const { signIn, signUp } = useAuth()
  const router = useRouter()

  // Check network connectivity
  useEffect(() => {
    const checkOnlineStatus = () => {
      setIsOnline(navigator.onLine)
    }

    window.addEventListener('online', checkOnlineStatus)
    window.addEventListener('offline', checkOnlineStatus)
    checkOnlineStatus()

    return () => {
      window.removeEventListener('online', checkOnlineStatus)
      window.removeEventListener('offline', checkOnlineStatus)
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isOnline) {
      setError("No internet connection. Please check your network and try again.")
      return
    }
    
    setIsLoading(true)
    setError("")
    
    let retryCount = 0
    const maxRetries = 3
    
    while (retryCount < maxRetries) {
      try {
        await signIn(formData.email, formData.password)
        router.push('/dashboard')
        return
      } catch (error: any) {
        retryCount++
        if (error.message.includes('Network connection failed') && retryCount < maxRetries) {
          setError(`Network error. Retrying... (${retryCount}/${maxRetries})`)
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)) // Exponential backoff
          continue
        }
        setError(error.message)
        break
      }
    }
    
    setIsLoading(false)
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isOnline) {
      setError("No internet connection. Please check your network and try again.")
      return
    }
    
    setIsLoading(true)
    setError("")
    
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }
    
    let retryCount = 0
    const maxRetries = 3
    
    while (retryCount < maxRetries) {
      try {
        await signUp(formData.email, formData.password, formData.displayName)
        router.push('/dashboard')
        return
      } catch (error: any) {
        retryCount++
        if (error.message.includes('Network connection failed') && retryCount < maxRetries) {
          setError(`Network error. Retrying... (${retryCount}/${maxRetries})`)
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)) // Exponential backoff
          continue
        }
       setError(error.message)
        break
      }
    }
    
    setIsLoading(false)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleDiagnostic = async () => {
    setIsDiagnosing(true)
    setDiagnosticResult("")
    
    try {
      const diagnostic = await runMinimalDiagnostic()
      setDiagnosticResult(diagnostic.message)
    } catch (error: any) {
      setDiagnosticResult(`❌ Diagnostic failed: ${error.message}`)
    } finally {
      setIsDiagnosing(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" style={{ fontFamily: '"TacticSans-Reg", sans-serif' }}>
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <img
              src="https://img1.wsimg.com/isteam/ip/b11b2784-66bc-4ac4-9b05-6ba6d416d22d/Untitled%20design%20(1).jpg"
              alt="Cocoon Logo"
              className="h-16 w-auto"
            />
          </div>
          <CardTitle className="text-2xl text-center text-primary" style={{ fontFamily: '"TacticSans-Reg", sans-serif' }}>
            Cocoon Aluminum Works
          </CardTitle>
          <CardDescription className="text-center" style={{ fontFamily: '"TacticSans-Reg", sans-serif' }}>
            Login to access your dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isOnline && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                ⚠️ You appear to be offline. Please check your internet connection.
              </p>
            </div>
          )}
          {diagnosticResult && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                {diagnosticResult}
              </p>
            </div>
          )}
          <div className="mb-4 flex justify-center">
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={handleDiagnostic}
              disabled={isDiagnosing}
              style={{ fontFamily: '"TacticSans-Reg", sans-serif' }}
            >
              {isDiagnosing ? "Testing..." : "🔧 Test Connection"}
            </Button>
          </div>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                    style={{ fontFamily: '"TacticSans-Reg", sans-serif' }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    required
                    style={{ fontFamily: '"TacticSans-Reg", sans-serif' }}
                  />
                </div>
                {error && (
                  <div className="text-sm text-destructive">{error}</div>
                )}
                <Button type="submit" className="w-full" disabled={isLoading} style={{ fontFamily: '"TacticSans-Reg", sans-serif' }}>
                  {isLoading ? "Loading..." : "Login"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-email">Email</Label>
                  <Input
                    id="new-email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                    style={{ fontFamily: '"TacticSans-Reg", sans-serif' }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="display-name">Display Name</Label>
                  <Input
                    id="display-name"
                    type="text"
                    placeholder="Enter your name"
                    value={formData.displayName}
                    onChange={(e) => handleInputChange('displayName', e.target.value)}
                    required
                    style={{ fontFamily: '"TacticSans-Reg", sans-serif' }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Enter password (min 6 characters)"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    required
                    style={{ fontFamily: '"TacticSans-Reg", sans-serif' }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    required
                    style={{ fontFamily: '"TacticSans-Reg", sans-serif' }}
                  />
                </div>
                {error && (
                  <div className="text-sm text-destructive">{error}</div>
                )}
                <Button type="submit" className="w-full" disabled={isLoading} style={{ fontFamily: '"TacticSans-Reg", sans-serif' }}>
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
