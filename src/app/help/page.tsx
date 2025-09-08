'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { HelpCircle } from "lucide-react"
import DashboardLayout from "@/components/dashboard-layout"

export default function HelpPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto p-4">
        <div className="flex items-center gap-2 mb-6">
          <HelpCircle className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">Help & Support</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Help Center</CardTitle>
            <CardDescription>
              Get help with using the Cocoon Company For Aluminum Works application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Please contact us at <a href="mailto:abashraf9803@gmail.com" className="text-primary">abashraf9803@gmail.com</a> or call us at <a href="tel:+201092201107" className="text-primary">+201092201107</a> for help.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
