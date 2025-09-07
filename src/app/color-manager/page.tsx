'use client'

import DashboardLayout from "@/components/dashboard-layout"
import ColorManager from "@/components/color/color-manager"

export default function ColorManagerPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto max-w-7xl">
        <ColorManager />
      </div>
    </DashboardLayout>
  )
}
