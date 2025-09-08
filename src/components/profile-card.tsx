import React, { useState } from "react";
import {
    CheckCircle,
    Edit,
    Trash2,
    ChevronDown,
    MoreHorizontal,
} from "lucide-react";
import { AluminiumProfile } from "./profile/profile-manager";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";

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
    const [isExpanded, setIsExpanded] = useState(false);
    
    // Debug: Log the profile data to see what's available
    console.log("ProfileCard received profile:", profile);
    console.log("Net price fields:", {
        net_price_panda: profile.net_price_panda,
        mosquito_price_fixed: profile.mosquito_price_fixed,
        net_price: profile.net_price
    });
    const isSelected = selectedProfile?.id === profile.id;

    const handleCardClick = () => {
        if (showSelection && onProfileSelect) {
            onProfileSelect(profile);
        }
    };

    const handleActionClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    return (
        <div
            onClick={handleCardClick}
            className={`group relative bg-white rounded-lg border transition-all duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer ${
                isSelected
                    ? "border-[#A72036] shadow-[#A72036]/10"
                    : "border-gray-200 hover:border-gray-300"
            }`}
        >
            {/* Header */}
            <div className={`p-4 border-b ${
                isSelected ? "border-[#A72036]/20" : "border-gray-100"
            }`}>
                <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                        <h3 className={`text-lg font-semibold truncate ${
                            "text-[#A72036]"
                        }`}>
                            {profile.name}
                        </h3>
                        <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                            <span className="font-medium">Code:</span>
                            <code className="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono">
                                {profile.code}
                            </code>
                        </div>
                        <div className="mt-1 text-sm text-gray-500">
                            <span className="font-medium">Brand:</span> {profile.brand}
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            isSelected
                                ? "bg-[#A72036]/10 text-[#A72036]"
                                : "bg-gray-100 text-gray-600"
                        }`}>
                            {profile.system_type?.replace("_", " ").toUpperCase()}
                        </span>
                        
                        {isSelected && (
                            <div className="w-6 h-6 bg-[#A72036] rounded-full flex items-center justify-center">
                                <CheckCircle className="h-4 w-4 text-white" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Collapsible Content */}
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <CollapsibleTrigger asChild>
                    <button 
                        onClick={handleActionClick}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-150 flex items-center justify-between"
                    >
                        <span className="text-sm font-medium text-gray-700">
                            Pricing Details
                        </span>
                        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                            isExpanded ? "rotate-180" : ""
                        }`} />
                    </button>
                </CollapsibleTrigger>
                
                <CollapsibleContent className="overflow-hidden">
                    <div className="px-4 pb-4 space-y-4">
                        {/* Pricing Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gray-50 rounded-lg p-3">
                                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                                    Frame 2,4 sach
                                </div>
                                <div className="text-lg font-semibold text-gray-900">
                                    {profile.frame_price?.toFixed(2) || "0.00"} EGP
                                </div>
                            </div>
                            
                            <div className="bg-gray-50 rounded-lg p-3">
                                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                                    Frame 3 sach
                                </div>
                                <div className="text-lg font-semibold text-gray-900">
                                    {profile.frame_price_3?.toFixed(2) || "0.00"} EGP
                                </div>
                            </div>
                            
                            <div className="bg-gray-50 rounded-lg p-3">
                                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                                    Net Price
                                </div>
                                <div className="text-lg font-semibold text-gray-900">
                                    {(profile.net_price_panda || profile.mosquito_price_fixed || profile.net_price || 0)?.toFixed(2) || "0.00"} EGP
                                </div>
                            </div>
                            
                            <div className="bg-gray-50 rounded-lg p-3">
                                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                                    Sach Price
                                </div>
                                <div className="text-lg font-semibold text-gray-900">
                                    {profile.sach_price?.toFixed(2) || "0.00"} EGP
                                </div>
                            </div>
                        </div>

                        {/* Additional Info */}
                        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Glass Price (Single)</span>
                                <span className="font-medium text-gray-900">
                                    {profile.glass_price_single || "0.00"} EGP
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Glass Price (Double)</span>
                                <span className="font-medium text-gray-900">
                                    {profile.glass_price_double || "0.00"} EGP
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Profit Rate</span>
                                <span className="font-medium text-gray-900  text-success">
                                    {(profile.base_profit_rate * 100 || 0).toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    </div>
                </CollapsibleContent>
            </Collapsible>

            {/* Action Buttons */}
            {canManageProfiles && (
                <div className={`p-4 border-t ${
                    isSelected ? "border-[#A72036]/20" : "border-gray-100"
                }`}>
                    <div className="flex gap-2 justify-end">
                        <button
                            onClick={(e) => {
                                handleActionClick(e);
                                onEdit?.(profile);
                            }}
                            className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors duration-150"
                        >
                            <Edit className="h-4 w-4" />
                        </button>
                        <button
                            onClick={(e) => {
                                handleActionClick(e);
                                profile.id && onDelete?.(profile.id);
                            }}
                            className="px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors duration-150"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfileCard;
