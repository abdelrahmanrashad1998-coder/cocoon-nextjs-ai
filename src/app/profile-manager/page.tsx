'use client'

import DashboardLayout from "@/components/dashboard-layout"
import ProfileManager from "@/components/profile/profile-manager"

export default function ProfileManagerPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto max-w-7xl">
        <ProfileManager />
      </div>
    </DashboardLayout>
  )
}
