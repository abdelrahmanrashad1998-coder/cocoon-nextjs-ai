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
//    net_price: number;
//    leaf_price: number;
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

    return (
        <div
            className={`group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border ${
                isSelected
                    ? "border-emerald-200 shadow-emerald-100"
                    : "border-gray-300 hover:border-gray-500"
            }`}
        >
            {/* Selection Indicator */}
            {isSelected && (
                <div className="absolute -top-2 -right-2 bg-emerald-500 text-white rounded-full p-1.5 shadow-lg z-10">
                    <CheckCircle className="h-4 w-4" />
                </div>
            )}

            {/* Header Section */}
            <div
                className={`relative overflow-hidden rounded-t-2xl p-6 ${
                    isSelected
                        ? "bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50"
                        : "bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50"
                }`}
            >
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-gray-900 truncate mb-1">
                            {profile.name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Package className="h-4 w-4" />
                            <span className="font-medium">Code:</span>
                            <code className="bg-white/80 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-mono border border-white/50">
                                {profile.code}
                            </code>
                        </div>
                    </div>
                    <div className="ml-4">
                        <span
                            className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${
                                isSelected
                                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                    : "bg-indigo-100 text-indigo-800 border border-indigo-200"
                            }`}
                        >
                            {profile.system_type
                                ?.replace("_", " ")
                                .toUpperCase()}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="font-medium">Brand:</span>
                    <span className="bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm border border-white/50 font-medium">
                        {profile.brand}
                    </span>
                </div>
            </div>

            {/* Pricing Grid */}
            <div className="p-6 pt-4">
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="group/price bg-gradient-to-br flex flex-col justify-center items-center from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100 hover:border-blue-200 transition-colors">
                        <div className="text-xs font-medium text-blue-600 mb-1 uppercase tracking-wide">
                            Frame 2,4 sach
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-blue-700">
                                {profile.frame_price?.toFixed(2) || "0.00"}
                            </span>
                            <span className="text-sm text-blue-600 font-medium">
                                EGP
                            </span>
                        </div>
                    </div>

                    <div className="group/price bg-gradient-to-br flex flex-col items-center justify-center from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100 hover:border-indigo-200 transition-colors">
                        <div className="text-xs font-medium text-indigo-600 mb-1 uppercase tracking-wide">
                            Frame 3 sach
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-indigo-700">
                                {profile.frame_price_3?.toFixed(2) || "0.00"}
                            </span>
                            <span className="text-sm text-indigo-600 font-medium">
                                EGP
                            </span>
                        </div>
                    </div>

                    <div className="group/price bg-gradient-to-br flex flex-col items-center justify-center from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100 hover:border-emerald-200 transition-colors">
                        <div className="text-xs font-medium text-emerald-600 mb-1 uppercase tracking-wide flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            Net Price
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-emerald-700">
                                {profile.net_price?.toFixed(2) || "0.00"}
                            </span>
                            <span className="text-sm text-emerald-600 font-medium">
                                EGP
                            </span>
                        </div>
                    </div>

                    <div className="group/price bg-gradient-to-br flex flex-col items-center justify-center from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100 hover:border-amber-200 transition-colors">
                        <div className="text-xs font-medium text-amber-600 mb-1 uppercase tracking-wide">
                            Leaf Price
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-amber-700">
                                {profile.leaf_price?.toFixed(2) || "0.00"}
                            </span>
                            <span className="text-sm text-amber-600 font-medium">
                                EGP
                            </span>
                        </div>
                    </div>
                </div>

                {/* Additional Info */}
                <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 font-medium flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Glass Price:
                        </span>
                        <span className="font-bold text-gray-900">
                            {profile.kg_price?.toFixed(2) || "0.00"} EGP
                        </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 font-medium flex items-center gap-2">
                            <Percent className="h-4 w-4" />
                            Profit Rate:
                        </span>
                        <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
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
                                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200 focus:ring-emerald-500"
                                    : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 focus:ring-indigo-500"
                            }`}
                        >
                            {isSelected ? "Selected ✓" : "Select Profile"}
                        </button>
                    )}

                    {canManageProfiles && (
                        <>
                            <button
                                onClick={() => onEdit?.(profile)}
                                className="flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-blue-50 text-blue-600 rounded-xl border border-blue-200 hover:border-blue-300 font-medium text-sm transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                                <Edit className="h-4 w-4" />
                                Edit
                            </button>

                            <button
                                onClick={() =>
                                    profile.id && onDelete?.(profile.id)
                                }
                                className="flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-red-50 text-red-600 rounded-xl border border-red-200 hover:border-red-300 font-medium text-sm transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
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
