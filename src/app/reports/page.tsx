'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText } from "lucide-react"
import DashboardLayout from "@/components/dashboard-layout"

export default function ReportsPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <FileText className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">Reports</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Business Reports</CardTitle>
            <CardDescription>
              Generate and view business reports and documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Reports functionality is under development. This will include 
              quote reports, sales reports, and other business documents.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
