"use client"

import { useState, useEffect } from "react"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import DashboardLayout from "@/components/dashboard-layout"
import { DashboardService, ProjectData } from "@/lib/dashboard-service"

export default function Page() {
  const [projects, setProjects] = useState<ProjectData[]>([])
  const [activeProjects, setActiveProjects] = useState<ProjectData[]>([])
  const [completedProjects, setCompletedProjects] = useState<ProjectData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const data = await DashboardService.getDashboardData()
        setProjects(data.projects)
        
        // Filter projects by status - need to filter at the quote level before conversion
        const quotes = await DashboardService.fetchQuotes()
        
        // Filter active projects (only approved and in_production)
        const activeQuotes = quotes.filter(quote => 
          ["approved", "in_production"].includes(quote.status || "draft")
        )
        const activeProjectsData = DashboardService.convertQuotesToProjects(activeQuotes)
        setActiveProjects(activeProjectsData)
        
        // Filter completed projects
        const completedQuotes = quotes.filter(quote => 
          quote.status === "completed"
        )
        const completedProjectsData = DashboardService.convertQuotesToProjects(completedQuotes)
        setCompletedProjects(completedProjectsData)
      } catch (error) {
        console.error("Failed to load dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading dashboard...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <SectionCards />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>
      <DataTable data={projects} activeData={activeProjects} completedData={completedProjects} />
    </DashboardLayout>
  )
}
