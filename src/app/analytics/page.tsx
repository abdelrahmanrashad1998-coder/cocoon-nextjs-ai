'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3 } from "lucide-react"
import DashboardLayout from "@/components/dashboard-layout"

export default function AnalyticsPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto p-5">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">Analytics</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Business Analytics</CardTitle>
            <CardDescription>
              View detailed analytics and business insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Analytics dashboard is under development. This will include detailed 
              business metrics, sales reports, and performance analytics.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
