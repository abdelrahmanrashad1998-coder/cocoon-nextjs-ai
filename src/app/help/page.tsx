'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { HelpCircle } from "lucide-react"
import DashboardLayout from "@/components/dashboard-layout"

export default function HelpPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto">
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
              Help and support documentation is under development. This will include 
              user guides, FAQs, and contact information for technical support.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
