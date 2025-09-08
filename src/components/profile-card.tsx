import React from "react";
import {
    CheckCircle,
    Edit,
    Trash2,
    DollarSign,
    Percent,
    Package,
} from "lucide-react";
import { AluminiumProfile } from "./profile/profile-manager";

//interface Profile {
//    id: string;
//    name: string;
//    code: string;
//    brand: string;
//    system_type: string;
//    frame_price: number;
//    frame_price_3: number;
//    net_price_panda: number;
//    sach_price: number;
//    kg_price: number;
//    base_profit_rate: number;
//}

interface ProfileCardProps {
    profile: AluminiumProfile;
    selectedProfile?: AluminiumProfile;
    showSelection?: boolean;
    canManageProfiles?: boolean;
    onProfileSelect?: (profile: AluminiumProfile) => void;
    onEdit?: (profile: AluminiumProfile) => void;
    onDelete?: (id: string) => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({
    profile,
    selectedProfile,
    showSelection,
    canManageProfiles,
    onProfileSelect,
    onEdit,
    onDelete,
}) => {
    // Debug: Log the profile data to see what's available
    console.log("ProfileCard received profile:", profile);
    console.log("Net price fields:", {
        net_price_panda: profile.net_price_panda,
        mosquito_price_fixed: profile.mosquito_price_fixed,
        net_price: profile.net_price
    });
    const isSelected = selectedProfile?.id === profile.id;

    return (
        <div
            className={`group relative bg-card rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border ${
                isSelected
                    ? "border-secondary/20 shadow-secondary/20"
                    : "border-border hover:border-border"
            }`}
        >
            {/* Selection Indicator */}
            {isSelected && (
                <div className="absolute -top-2 -right-2 bg-secondary text-primary-foreground rounded-full p-1.5 shadow-lg z-10">
                    <CheckCircle className="h-4 w-4" />
                </div>
            )}

            {/* Header Section */}
            <div
                className={`relative overflow-hidden rounded-t-2xl p-6 ${
                    isSelected
                        ? "bg-gradient-to-br from-secondary/20 via-muted to-destructive/5"
                        : "bg-gradient-to-br from-muted via-destructive/5 to-destructive/5"
                }`}
            >
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-foreground truncate mb-1">
                            {profile.name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Package className="h-4 w-4" />
                            <span className="font-medium">Code:</span>
                            <code className="bg-card/80 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-mono border border-card/50">
                                {profile.code}
                            </code>
                        </div>
                    </div>
                    <div className="ml-4">
                        <span
                            className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${
                                isSelected
                                    ? "bg-success/10 text-success-foreground border border-secondary/20"
                                    : "bg-destructive/10 text-destructive border border-destructive/20"
                            }`}
                        >
                            {profile.system_type
                                ?.replace("_", " ")
                                .toUpperCase()}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-medium">Brand:</span>
                    <span className="bg-card/80 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm border border-card/50 font-medium">
                        {profile.brand}
                    </span>
                </div>
            </div>

            {/* Pricing Grid */}
            <div className="p-6 pt-4">
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="group/price bg-gradient-to-br from-destructive/10 to-destructive/5 rounded-xl p-4 border border-destructive/20 hover:border-destructive/20 transition-colors">
                        <div className="text-xs font-medium text-destructive mb-1 uppercase tracking-wide">
                            Frame 2,4 sach
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-destructive">
                                {profile.frame_price?.toFixed(2) || "0.00"}
                            </span>
                            <span className="text-sm text-destructive font-medium">
                                EGP
                            </span>
                        </div>
                    </div>

                    <div className="group/price bg-gradient-to-br from-destructive/10 to-destructive/5 rounded-xl p-4 border border-destructive/20 hover:border-destructive/20 transition-colors">
                        <div className="text-xs font-medium text-destructive mb-1 uppercase tracking-wide">
                            Frame 3 sach
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-destructive">
                                {profile.frame_price_3?.toFixed(2) || "0.00"}
                            </span>
                            <span className="text-sm text-destructive font-medium">
                                EGP
                            </span>
                        </div>
                    </div>

                    <div className="group/price bg-gradient-to-br from-secondary/20 to-muted rounded-xl p-4 border border-secondary/20 hover:border-secondary/20 transition-colors">
                        <div className="text-xs font-medium text-success mb-1 uppercase tracking-wide flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            Net Price
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-success">
                                {(profile.net_price_panda || profile.mosquito_price_fixed || profile.net_price || 0)?.toFixed(2) || "0.00"}
                            </span>
                            <span className="text-sm text-success font-medium">
                                EGP
                            </span>
                        </div>
                    </div>

                    <div className="group/price bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4 border border-primary/20 hover:border-primary/30 transition-colors">
                        <div className="text-xs font-medium text-primary mb-1 uppercase tracking-wide">
                            Sach Price
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-primary">
                                {profile.sach_price?.toFixed(2) || "0.00"}
                            </span>
                            <span className="text-sm text-primary font-medium">
                                EGP
                            </span>
                        </div>
                    </div>
                </div>

                {/* Additional Info */}
                <div className="bg-muted rounded-xl p-4 mb-6 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground font-medium flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Glass Price(single):
                        </span>
                        <span className="font-bold text-foreground">
                            {profile.glass_price_single || "0.00"} EGP
                        </span>
                        
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground font-medium flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Glass Price(double):
                        </span>
                        <span className="font-bold text-foreground">
                            {profile.glass_price_double || "0.00"} EGP
                        </span>
                        
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground font-medium flex items-center gap-2">
                            <Percent className="h-4 w-4" />
                            Profit Rate:
                        </span>
                        <span className="font-bold text-success bg-success/10 px-2 py-1 rounded-lg">
                            {(profile.base_profit_rate * 100 || 0).toFixed(1)}%
                        </span>
                    </div>
                    
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                    {showSelection && onProfileSelect && (
                        <button
                            onClick={() => onProfileSelect(profile)}
                            className={`flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                isSelected
                                    ? "bg-secondary hover:bg-secondary/90 text-primary-foreground shadow-lg shadow-emerald-200 focus:ring-secondary"
                                    : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 focus:ring-primary"
                            }`}
                        >
                            {isSelected ? "Selected ✓" : "Select Profile"}
                        </button>
                    )}

                    {canManageProfiles && (
                        <>
                            <button
                                onClick={() => onEdit?.(profile)}
                                className="flex items-center justify-center gap-2 px-4 py-3 bg-card hover:bg-destructive/5 text-destructive rounded-xl border border-destructive/20 hover:border-destructive/30 font-medium text-sm transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                            >
                                <Edit className="h-4 w-4" />
                                Edit
                            </button>

                            <button
                                onClick={() =>
                                    profile.id && onDelete?.(profile.id)
                                }
                                className="flex items-center justify-center gap-2 px-4 py-3 bg-card hover:bg-destructive/5 text-destructive rounded-xl border border-destructive/20 hover:border-destructive/30 font-medium text-sm transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfileCard;
