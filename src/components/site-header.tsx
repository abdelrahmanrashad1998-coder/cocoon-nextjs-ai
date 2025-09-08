"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth-context";
import { LogOut } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export function SiteHeader() {
    const { user, userProfile, logout } = useAuth();

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    const getUserInitials = (displayName: string, email: string) => {
        if (displayName) {
            return displayName.substring(0, 2).toUpperCase();
        }
        return email.substring(0, 2).toUpperCase();
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case "admin":
                return "bg-destructive/10 text-destructive-foreground";
            case "manager":
                return "bg-info/10 text-info-foreground";
            case "user":
                return "bg-success/10 text-success-foreground";
            case "pending":
                return "bg-warning/10 text-warning-foreground";
            default:
                return "bg-muted text-muted-foreground";
        }
    };

    return (
        <header
            className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)"
            style={{ fontFamily: '"TacticSans-Reg", sans-serif' }}
        >
            <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
                <SidebarTrigger className="-ml-1" />
                <Separator
                    orientation="vertical"
                    className="mx-2 data-[orientation=vertical]:h-4"
                />
                <h1
                    className="text-base font-medium"
                    style={{ fontFamily: '"TacticSans-Reg", sans-serif' }}
                >
                    Cocoon Company For Aluminum Works
                </h1>
                <div className="ml-auto flex items-center gap-2">
                    {user && userProfile && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="relative h-8 w-8 rounded-full"
                                >
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback>
                                            {getUserInitials(
                                                userProfile.displayName,
                                                user.email || ""
                                            )}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-56"
                                align="end"
                                forceMount
                            >
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p
                                            className="text-sm font-medium leading-none"
                                            style={{
                                                fontFamily:
                                                    '"TacticSans-Reg", sans-serif',
                                            }}
                                        >
                                            {userProfile.displayName || "User"}
                                        </p>
                                        <p
                                            className="text-xs leading-none text-muted-foreground"
                                            style={{
                                                fontFamily:
                                                    '"TacticSans-Reg", sans-serif',
                                            }}
                                        >
                                            {userProfile.email}
                                        </p>
                                        <Badge
                                            variant="secondary"
                                            className={`text-xs ${getRoleBadgeColor(
                                                userProfile.role
                                            )}`}
                                        >
                                            {userProfile.role
                                                .charAt(0)
                                                .toUpperCase() +
                                                userProfile.role.slice(1)}
                                        </Badge>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span
                                        style={{
                                            fontFamily:
                                                '"TacticSans-Reg", sans-serif',
                                        }}
                                    >
                                        Log out
                                    </span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>
        </header>
    );
}
