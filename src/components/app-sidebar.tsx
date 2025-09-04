"use client"

import * as React from "react"
import {
  IconChartBar,
  IconDashboard,
  IconFileDescription,
  IconHelp,
  IconSearch,
  IconSettings,
  IconUsers,
  IconCalculator,
  IconClipboardList,
  IconUserCheck,
} from "@tabler/icons-react"
import Link from "next/link"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useAuth } from "@/lib/auth-context"

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Quote Generator",
      url: "/quote-generator",
      icon: IconCalculator,
    },
    {
      title: "Quotes",
      url: "/quotes",
      icon: IconFileDescription,
    },
    {
      title: "Profile Manager",
      url: "/profile-manager",
      icon: IconUsers,
    },
    {
      title: "Admin Panel",
      url: "/admin",
      icon: IconUserCheck,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/settings",
      icon: IconSettings,
    },
    {
      title: "Get Help",
      url: "/help",
      icon: IconHelp,
    },
    {
      title: "Search",
      url: "/search",
      icon: IconSearch,
    },
  ],
  documents: [
    {
      name: "Analytics",
      url: "/analytics",
      icon: IconChartBar,
    },
    {
      name: "Reports",
      url: "/reports",
      icon: IconClipboardList,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()

  const userData = {
    name: user?.displayName || "User",
    email: user?.email || "user@example.com",
    avatar: "/avatars/user.jpg",
  }

  return (
    <Sidebar collapsible="offcanvas" {...props} style={{ fontFamily: '"TacticSans-Reg", sans-serif' }}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/dashboard" style={{ fontFamily: '"TacticSans-Reg", sans-serif' }}>
                <img
                  src="https://img1.wsimg.com/isteam/ip/b11b2784-66bc-4ac4-9b05-6ba6d416d22d/Untitled%20design%20(1).jpg"
                  alt="Cocoon Logo"
                  className="!size-5"
                />
                <span className="text-base font-semibold" style={{ fontFamily: '"TacticSans-Reg", sans-serif' }}>Cocoon Aluminum</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}
