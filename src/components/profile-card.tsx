import React from "react";
import {
    CheckCircle,
    Edit,
    Trash2,
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
            <div className={`p-4 ${
                isSelected ? "border-[#A72036]/20" : "border-gray-100"
            }`}>
                <div className="flex items-center justify-between">
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
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {isSelected && (
                            <div className="w-6 h-6 bg-[#A72036] rounded-full flex items-center justify-center">
                                <CheckCircle className="h-4 w-4 text-white" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

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
