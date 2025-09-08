'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search } from "lucide-react"
import DashboardLayout from "@/components/dashboard-layout"

export default function SearchPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto p-4">
        <div className="flex items-center gap-2 mb-6">
          <Search className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">Search</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Global Search</CardTitle>
            <CardDescription>
              Search across all quotes, customers, and documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Global search functionality is under development. This will allow you to 
              search across all quotes, customer profiles, and system documents.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
