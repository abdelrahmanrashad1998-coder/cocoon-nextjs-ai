/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDoc,
    query,
    where,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    AlertCircle,
    CheckCircle,
    Database,
    Download,
    Search,
    Save,
    Palette,
} from "lucide-react";
import { ColorOption } from "@/types/quote";
import ProfileCard from "../profile-card";

export interface AluminiumProfile {
    id?: string;
    name: string;
    code: string;
    brand: string;
    system_type: string;
    glass_price_single: number;
    glass_price_double: number;
    kg_price: number;
    weight_6m: number;
    frame_price: number;
    frame_price_3: number;
    leaf_price: number;
    arc_price: number;
    accessories_2_leaves: number;
    accessories_3_leaves: number;
    accessories_4_leaves: number;
    net_price: number;
    net_price_plisse: number;
    net_price_panda: number;
    base_profit_rate: number;
}

interface ProfileManagerProps {
    onProfileSelect?: (profile: AluminiumProfile) => void;
    selectedProfile?: AluminiumProfile | null;
    showSelection?: boolean;
    initialSystemTypeFilter?: string;
}

export default function ProfileManager({
    onProfileSelect,
    initialSystemTypeFilter,
}: ProfileManagerProps) {
    const { user, loading: authLoading } = useAuth();
    const [profiles, setProfiles] = useState<AluminiumProfile[]>([]);
    const [colors, setColors] = useState<ColorOption[]>([]); // Add colors state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [brandFilter, setBrandFilter] = useState("all");
    const [selectedAvailableProfile, setSelectedAvailableProfile] =
        useState<AluminiumProfile>();
    const [systemTypeFilter, setSystemTypeFilter] = useState(
        initialSystemTypeFilter || "all"
    );
    const [activeTab, setActiveTab] = useState("browse");
    const [userRole, setUserRole] = useState("user");
    const [canManageProfiles, setCanManageProfiles] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingProfile, setEditingProfile] =
        useState<AluminiumProfile | null>(null);
    const [createForm, setCreateForm] = useState<Partial<AluminiumProfile>>({});
    const [csvImportStatus, setCsvImportStatus] = useState<{
        type: "success" | "error";
        message: string;
    } | null>(null);

    // Load user role and check permissions
    const loadUserRole = async () => {
        if (!user) return;

        try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const role = userData.role || "user";
                setUserRole(role);

                // Check if user can manage profiles
                const canManage = role === "admin" || role === "manager";
                setCanManageProfiles(canManage);
            }
        } catch (error) {
            console.error("Error loading user role:", error);
            // Default to user role if error
            setUserRole("user");
            setCanManageProfiles(false);
        }
    };

    // Load profiles from Firebase when user is authenticated
    useEffect(() => {
        if (user && !authLoading) {
            loadUserRole();
            loadProfiles();
            loadColors(); // Add this line
        }
    }, [user, authLoading]);

    // Filter profiles based on search, brand, and system type
    const filteredProfiles = profiles.filter((profile) => {
        // Add null checks to prevent errors
        const profileName = profile.name || "";
        const profileCode = profile.code || "";
        const profileBrand = profile.brand || "";
        const profileSystemType = (profile.system_type || "").toLowerCase();

        const matchesSearch =
            profileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            profileCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
            profileBrand.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesBrand =
            brandFilter === "all" || profileBrand === brandFilter;
        const matchesSystemType =
            systemTypeFilter === "all" ||
            profileSystemType === systemTypeFilter.toLowerCase();

        return matchesSearch && matchesBrand && matchesSystemType;
    });

    // Get unique system types for filter dropdown
    const getSystemTypes = () => {
        const systemTypes = profiles
            .map((profile) => profile.system_type)
            .filter(Boolean);
        const uniqueSystemTypes = [...new Set(systemTypes)];
        console.log("Available system types:", uniqueSystemTypes);
        return uniqueSystemTypes;
    };

    const loadProfiles = async () => {
        if (!user) {
            setError("Please log in to access profiles");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const profilesCollection = collection(db, "aluminiumProfiles");
            const profilesSnapshot = await getDocs(profilesCollection);
            const profilesList = profilesSnapshot.docs.map((doc) => {
                const data = doc.data();
                // Debug: Log the raw Firebase data
                console.log("Raw Firebase data for profile:", doc.id, data);

                // Map the correct field names from Firestore to our interface
                const mappedProfile = {
                    id: doc.id,
                    name: data.profile_name || data.name || "Unnamed Profile",
                    code: data.profile_code || data.code || "NO_CODE",
                    brand: data.profile_brand || data.brand || "Unknown Brand",
                    system_type:
                        data.profile_system_type ||
                        data.system_type ||
                        "unknown",
                    kg_price: data.glass_price_double || data.kg_price || 0,
                    weight_6m: data.weight_6m || 0,
                    frame_price: data.frame_price || 0,
                    frame_price_3: data.frame_price_3 || 0,
                    leaf_price: data.leaf_price || 0,
                    arc_price: data.arc_price || 0,
                    accessories_2_leaves: data.accessories_2_leaves || 0,
                    accessories_3_leaves: data.accessories_3_leaves || 0,
                    accessories_4_leaves: data.accessories_4_leaves || 0,
                    net_price: data.net_price || 0,
                    net_price_plisse: data.net_price_plisse || 0,
                    net_price_panda: data.net_price_panda || 0,
                    base_profit_rate: data.base_profit_rate || 0,
                    glass_price_single: data.glass_price_single || 0,
                    glass_price_double: data.glass_price_double || 0,
                };

                // Debug: Log the mapped profile
                console.log("Mapped profile from Firebase:", mappedProfile);

                return mappedProfile;
            }) as AluminiumProfile[];

            setProfiles(profilesList);
            setSuccess(`Loaded ${profilesList.length} profiles`);
        } catch (error: any) {
            console.error("Error loading profiles:", error);
            if (error.code === "permission-denied") {
                setError(
                    "Permission denied. Please check your Firebase security rules."
                );
            } else if (error.code === "unauthenticated") {
                setError("Please log in to access profiles");
            } else {
                setError(`Error loading profiles: ${error.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const createProfile = async () => {
        if (!user) {
            setError("Please log in to create profiles");
            return;
        }

        try {
            const profilesCollection = collection(db, "aluminiumProfiles");
            const profileData = {
                profile_name: createForm.name || "",
                profile_code: createForm.code || "",
                brand: createForm.brand || "",
                system_type: createForm.system_type || "",
                glass_price_single: createForm.glass_price_single || 0,
                glass_price_double: createForm.glass_price_double || 0,
                weight_6m: createForm.weight_6m || 0,
                frame_price: createForm.frame_price || 0,
                frame_price_3: createForm.frame_price_3 || 0,
                leaf_price: createForm.leaf_price || 0,
                arc_price: createForm.arc_price || 0,
                accessories_2_leaves: createForm.accessories_2_leaves || 0,
                accessories_3_leaves: createForm.accessories_3_leaves || 0,
                accessories_4_leaves: createForm.accessories_4_leaves || 0,
                net_price: createForm.net_price || 0,
                net_price_plisse: createForm.net_price_plisse || 0,
                net_price_panda: createForm.net_price_panda || 0,
                base_profit_rate: createForm.base_profit_rate || 0,
            };

            await addDoc(profilesCollection, profileData);

            setSuccess("Profile created successfully");
            setShowCreateModal(false);
            setCreateForm({});
            loadProfiles();
        } catch (error: any) {
            setError(`Error creating profile: ${error.message}`);
        }
    };

    const updateProfile = async () => {
        if (!user || !editingProfile?.id) {
            setError("Please log in to update profiles");
            return;
        }

        try {
            const profileRef = doc(db, "aluminiumProfiles", editingProfile.id);
            const profileData = {
                profile_name: editingProfile.name || "",
                profile_code: editingProfile.code || "",
                brand: editingProfile.brand || "",
                system_type: editingProfile.system_type || "",
                glass_price_single: editingProfile.glass_price_single || 0,
                glass_price_double: editingProfile.glass_price_double || 0,
                weight_6m: editingProfile.weight_6m || 0,
                frame_price: editingProfile.frame_price || 0,
                frame_price_3: editingProfile.frame_price_3 || 0,
                leaf_price: editingProfile.leaf_price || 0,
                arc_price: editingProfile.arc_price || 0,
                accessories_2_leaves: editingProfile.accessories_2_leaves || 0,
                accessories_3_leaves: editingProfile.accessories_3_leaves || 0,
                accessories_4_leaves: editingProfile.accessories_4_leaves || 0,
                net_price: editingProfile.net_price || 0,
                net_price_plisse: editingProfile.net_price_plisse || 0,
                net_price_panda: editingProfile.net_price_panda || 0,
                base_profit_rate: editingProfile.base_profit_rate || 0,
            };

            await updateDoc(profileRef, profileData);

            setSuccess("Profile updated successfully");
            setShowEditModal(false);
            setEditingProfile(null);
            loadProfiles();
        } catch (error: any) {
            setError(`Error updating profile: ${error.message}`);
        }
    };
    const handleSelectedAvailableProfile = (profile: AluminiumProfile) => {
        setSelectedAvailableProfile(profile);
        onProfileSelect!(profile);
    };
    const handleEditAvailableProfile = (_profile: AluminiumProfile) => {};
    const handleDeleteAvailableProfile = (_id: string) => {};
    const deleteProfile = async (profileId: string) => {
        if (!user) {
            setError("Please log in to delete profiles");
            return;
        }

        if (!confirm("Are you sure you want to delete this profile?")) return;

        try {
            const profileRef = doc(db, "aluminiumProfiles", profileId);
            await deleteDoc(profileRef);

            setSuccess("Profile deleted successfully");
            loadProfiles();
        } catch (error: any) {
            setError(`Error deleting profile: ${error.message}`);
        }
    };

    const handleCreateChange = (field: keyof AluminiumProfile, value: any) => {
        setCreateForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleEditChange = (field: keyof AluminiumProfile, value: any) => {
        if (editingProfile) {
            setEditingProfile((prev) =>
                prev ? { ...prev, [field]: value } : null
            );
        }
    };

    const getBrands = () => {
        const brands = profiles.map((profile) => profile.brand).filter(Boolean);
        return [...new Set(brands)];
    };

    const exportProfiles = () => {
        const csvContent = [
            [
                "Name",
                "Code",
                "Brand",
                "System Type",
                "KG Price",
                "Weight 6m",
                "Frame Price",
                "Frame Price 3",
                "Leaf Price",
            ],
            ...profiles.map((profile) => [
                profile.name,
                profile.code,
                profile.brand,
                profile.system_type,
                profile.kg_price,
                profile.weight_6m,
                profile.frame_price,
                profile.frame_price_3,
                profile.leaf_price,
            ]),
        ]
            .map((row) => row.join(","))
            .join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "aluminium-profiles.csv";
        a.click();
        window.URL.revokeObjectURL(url);
    };

    // Download sample CSV template
    const downloadSampleCSV = () => {
        const sampleData = `profile_code,brand,profile_name,system_type,kg_price,weight_6m,frame_price,frame_price_3,leaf_price,arc_price,accessories_2_leaves,accessories_3_leaves,accessories_4_leaves,net_price,net_price_plisse,net_price_panda,base_profit_rate
AL001,Cocoon,Standard Sliding Window,sliding,15.50,25.00,64.58,193.75,64.58,300,50,75,100,60,120,180,30
AL002,Cocoon,Premium Hinged Door,hinged,18.00,30.00,90.00,270.00,90.00,400,60,90,120,80,160,240,35
AL003,Cocoon,Curtain Wall System,curtain_wall,20.00,35.00,116.67,350.00,116.67,500,80,120,160,100,200,300,40
AL004,Alumil,Classic Window Series,sliding,16.00,22.00,58.67,176.00,58.67,350,55,85,110,70,140,210,32
AL005,Alumil,Modern Door System,hinged,19.00,28.00,88.67,266.00,88.67,450,65,100,130,85,170,255,38`;

        const blob = new Blob([sampleData], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "sample-aluminum-profiles.csv";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        setCsvImportStatus({
            type: "success",
            message: "Sample CSV file downloaded successfully!",
        });
        setTimeout(() => setCsvImportStatus(null), 3000);
    };

    // Download sample CSV template for colors
    const downloadColorSampleCSV = () => {
        const sampleData = `code,brand,color,finish
RAL-9005,Cocoon,Black,Matte
RAL-9010,Cocoon,Pure White,Glossy
RAL-7016,Cocoon,Anthracite Grey,Satin
RAL-8017,Cocoon,Chocolate Brown,Matte
RAL-6005,Cocoon,Moss Green,Satin
RAL-5010,Cocoon,Gentian Blue,Glossy
RAL-3000,Cocoon,Flame Red,Matte
RAL-1020,Cocoon,Olive Yellow,Satin`;

        const blob = new Blob([sampleData], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "sample-colors.csv";
        a.click();
        window.URL.revokeObjectURL(url);

        setCsvImportStatus({
            type: "success",
            message: "Sample color CSV file downloaded successfully!",
        });
        setTimeout(() => setCsvImportStatus(null), 3000);
    };

    // Handle CSV import
    const handleCSVImport = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setCsvImportStatus({
            type: "error",
            message: "Processing CSV file...",
        });

        try {
            const text = await file.text();
            const lines = text.split("\n");
            const headers = lines[0]
                .split(",")
                .map((h) => h.trim().replace(/"/g, ""));

            let importedCount = 0;
            let skippedCount = 0;
            let invalidCount = 0;

            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                console.log(`line number ${i} : ${line}`);
                const values = line
                    .split(",")
                    .map((v) => v.trim().replace(/"/g, ""));
                const profile: any = {};

                headers.forEach((header, index) => {
                    profile[header] = values[index] || "";
                });

                // Validate required fields
                if (profile.profile_code && profile.profile_name) {
                    // Check if profile already exists
                    const existingProfile = profiles.find(
                        (p) => p.code === profile.profile_code
                    );
                    if (!existingProfile) {
                        // Convert numeric fields
                        const numericFields = [
                            "kg_price",
                            "weight_6m",
                            "frame_price",
                            "frame_price_3",
                            "leaf_price",
                            "arc_price",
                            "accessories_2_leaves",
                            "accessories_3_leaves",
                            "accessories_4_leaves",
                            "net_price",
                            "net_price_plisse",
                            "net_price_panda",
                            "base_profit_rate",
                        ];

                        numericFields.forEach((field) => {
                            if (
                                profile[field] &&
                                !isNaN(Number(profile[field]))
                            ) {
                                profile[field] = Number(profile[field]);
                            } else {
                                profile[field] = 0;
                            }
                        });

                        // Debug: Log the profile data before mapping
                        console.log(
                            "CSV Profile data before mapping:",
                            profile
                        );

                        // Map CSV fields to our interface
                        const newProfile: AluminiumProfile = {
                            name: profile.profile_name,
                            code: profile.profile_code,
                            brand: profile.brand || "Unknown",
                            system_type: (
                                profile.system_type || "unknown"
                            ).toLowerCase(),
                            kg_price: profile.kg_price || 0,
                            weight_6m: profile.weight_6m || 0,
                            frame_price: profile.frame_price || 0,
                            frame_price_3: profile.frame_price_3 || 0,
                            leaf_price: profile.leaf_price || 0,
                            arc_price: profile.arc_price || 0,
                            accessories_2_leaves:
                                profile.accessories_2_leaves || 0,
                            accessories_3_leaves:
                                profile.accessories_3_leaves || 0,
                            accessories_4_leaves:
                                profile.accessories_4_leaves || 0,
                            net_price: profile.net_price || 0,
                            net_price_plisse: profile.net_price_plisse || 0,
                            net_price_panda: profile.net_price_panda || 0,
                            base_profit_rate: profile.base_profit_rate || 0,
                            glass_price_single: profile.glass_price_single || 0,
                            glass_price_double: profile.glass_price_double || 0,
                        };

                        // Debug: Log the mapped profile
                        console.log("Mapped profile:", newProfile);

                        // Save to Firebase
                        const profilesCollection = collection(
                            db,
                            "aluminiumProfiles"
                        );
                        const profileData = {
                            profile_name: newProfile.name,
                            profile_code: newProfile.code,
                            brand: newProfile.brand,
                            system_type: newProfile.system_type,
                            glass_price_single: profile.glass_price_single || 0,
                            glass_price_double: profile.glass_price_double || 0,
                            weight_6m: newProfile.weight_6m,
                            frame_price: newProfile.frame_price,
                            frame_price_3: newProfile.frame_price_3,
                            leaf_price: newProfile.leaf_price,
                            arc_price: newProfile.arc_price,
                            accessories_2_leaves:
                                newProfile.accessories_2_leaves,
                            accessories_3_leaves:
                                newProfile.accessories_3_leaves,
                            accessories_4_leaves:
                                newProfile.accessories_4_leaves,
                            net_price: newProfile.net_price,
                            net_price_plisse: newProfile.net_price_plisse,
                            net_price_panda: newProfile.net_price_panda,
                            base_profit_rate: newProfile.base_profit_rate,
                        };

                        // Debug: Log the Firebase data
                        console.log("Firebase data to save:", profileData);

                        await addDoc(profilesCollection, profileData);
                        importedCount++;
                    } else {
                        skippedCount++;
                    }
                } else {
                    invalidCount++;
                }
            }

            // Reload profiles to show new data
            await loadProfiles();

            setCsvImportStatus({
                type: "success",
                message: `Import complete! ${importedCount} imported, ${skippedCount} skipped, ${invalidCount} invalid`,
            });

            // Clear status after 5 seconds
            setTimeout(() => setCsvImportStatus(null), 5000);
        } catch (error: any) {
            console.error("Error importing CSV:", error);
            setCsvImportStatus({
                type: "error",
                message: `Error importing CSV: ${error.message}`,
            });
            setTimeout(() => setCsvImportStatus(null), 5000);
        }

        // Reset file input
        event.target.value = "";
    };

    // Handle CSV import for colors
    const handleColorCSVImport = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setCsvImportStatus({
            type: "error",
            message: "Processing color CSV file...",
        });

        try {
            const text = await file.text();
            const lines = text.split("\n");
            const headers = lines[0]
                .split(",")
                .map((h) => h.trim().replace(/"/g, ""));

            let importedCount = 0;
            let skippedCount = 0;
            let invalidCount = 0;

            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                const values = line
                    .split(",")
                    .map((v) => v.trim().replace(/"/g, ""));
                const color: Record<string, string> = {};

                headers.forEach((header, index) => {
                    color[header] = values[index] || "";
                });

                // Validate required fields
                if (color.code && color.brand && color.color && color.finish) {
                    // Check if color already exists
                    const existingColor = await checkColorExists(color.code);
                    if (!existingColor) {
                        // Save to Firebase
                        const colorsCollection = collection(db, "colorOptions");
                        const colorData = {
                            code: color.code,
                            brand: color.brand,
                            color: color.color,
                            finish: color.finish,
                        };

                        await addDoc(colorsCollection, colorData);
                        importedCount++;
                    } else {
                        skippedCount++;
                    }
                } else {
                    invalidCount++;
                }
            }

            setCsvImportStatus({
                type: "success",
                message: `Color import complete! ${importedCount} imported, ${skippedCount} skipped, ${invalidCount} invalid`,
            });

            // Clear status after 5 seconds
            setTimeout(() => setCsvImportStatus(null), 5000);
        } catch (error: unknown) {
            const err = error as { code?: string; message?: string };
            console.error("Error importing color CSV:", error);
            if (err.code === "permission-denied") {
                setCsvImportStatus({
                    type: "error",
                    message:
                        "Permission denied: Please check your Firebase security rules. You may need to update them to allow access to the colorOptions collection.",
                });
            } else {
                setCsvImportStatus({
                    type: "error",
                    message: `Error importing color CSV: ${
                        err.message || "Unknown error"
                    }`,
                });
            }
            setTimeout(() => setCsvImportStatus(null), 5000);
        }

        // Reset file input
        event.target.value = "";
    };

    // Check if color exists in Firebase
    const checkColorExists = async (code: string): Promise<boolean> => {
        try {
            const colorsCollection = collection(db, "colorOptions");
            const q = query(colorsCollection, where("code", "==", code));
            const querySnapshot = await getDocs(q);
            return !querySnapshot.empty;
        } catch (error) {
            console.error("Error checking color existence:", error);
            return false;
        }
    };

    const calculatePrices = (kgPrice: number, weight6m: number) => {
        const pricePerMeter = (kgPrice * weight6m) / 6;
        return {
            framePrice: pricePerMeter,
            framePrice3: pricePerMeter * 3,
            leafPrice: pricePerMeter,
        };
    };

    const handleKgPriceChange = (value: number, isEdit: boolean = false) => {
        const form = isEdit ? editingProfile : createForm;
        const weight = isEdit
            ? editingProfile?.weight_6m
            : createForm.weight_6m;

        if (form && weight) {
            const prices = calculatePrices(value, weight);
            if (isEdit && editingProfile) {
                setEditingProfile({
                    ...editingProfile,
                    kg_price: value,
                    frame_price: prices.framePrice,
                    frame_price_3: prices.framePrice3,
                    leaf_price: prices.leafPrice,
                });
            } else {
                setCreateForm({
                    ...createForm,
                    kg_price: value,
                    frame_price: prices.framePrice,
                    frame_price_3: prices.framePrice3,
                    leaf_price: prices.leafPrice,
                });
            }
        }
    };

    const handleWeightChange = (value: number, isEdit: boolean = false) => {
        const form = isEdit ? editingProfile : createForm;
        const kgPrice = isEdit ? editingProfile?.kg_price : createForm.kg_price;

        if (form && kgPrice) {
            const prices = calculatePrices(kgPrice, value);
            if (isEdit && editingProfile) {
                setEditingProfile({
                    ...editingProfile,
                    weight_6m: value,
                    frame_price: prices.framePrice,
                    frame_price_3: prices.framePrice3,
                    leaf_price: prices.leafPrice,
                });
            } else {
                setCreateForm({
                    ...createForm,
                    weight_6m: value,
                    frame_price: prices.framePrice,
                    frame_price_3: prices.framePrice3,
                    leaf_price: prices.leafPrice,
                });
            }
        }
    };

    // Load colors from Firebase
    const loadColors = async () => {
        if (!user) {
            setError("Please log in to access colors");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const colorsCollection = collection(db, "colorOptions");
            const colorsSnapshot = await getDocs(colorsCollection);
            const colorsList = colorsSnapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    code: data.code || "",
                    brand: data.brand || "",
                    color: data.color || "",
                    finish: data.finish || "",
                } as ColorOption;
            });

            setColors(colorsList);
            setSuccess(`Loaded ${colorsList.length} colors`);
        } catch (error: unknown) {
            console.error("Error loading colors:", error);
            const err = error as { code?: string; message?: string };
            if (err.code === "permission-denied") {
                setError(
                    "Permission denied. Please check your Firebase security rules."
                );
            } else if (err.code === "unauthenticated") {
                setError("Please log in to access colors");
            } else {
                setError(
                    `Error loading colors: ${err.message || "Unknown error"}`
                );
            }
        } finally {
            setLoading(false);
        }
    };

    // Filter colors based on search and brand
    const filteredColors = colors.filter((color) => {
        const matchesSearch =
            color.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            color.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
            color.color.toLowerCase().includes(searchTerm.toLowerCase()) ||
            color.finish.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesBrand =
            brandFilter === "all" || color.brand === brandFilter;

        return matchesSearch && matchesBrand;
    });

    // Get unique brands from colors
    const getColorBrands = () => {
        const brands = colors.map((color) => color.brand).filter(Boolean);
        return [...new Set(brands)];
    };

    // Get unique finish types from colors
    const getFinishTypes = () => {
        const finishTypes = colors.map((color) => color.finish).filter(Boolean);
        return [...new Set(finishTypes)];
    };

    return (
        <div className="space-y-6">
            {/* Authentication Loading */}
            {authLoading && (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-gray-600">
                        Checking authentication...
                    </p>
                </div>
            )}

            {/* Not Authenticated */}
            {!authLoading && !user && (
                <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Authentication Required
                    </h3>
                    <p className="text-gray-600">
                        Please log in to access the Aluminium Profile Manager.
                    </p>
                </div>
            )}

            {/* Authenticated Content */}
            {!authLoading && user && (
                <>
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Database className="h-6 w-6 text-primary" />
                            <h2 className="text-2xl font-bold">
                                Aluminium Profile Manager
                            </h2>
                            <Badge
                                variant="secondary"
                                className="ml-2"
                            >
                                {userRole.charAt(0).toUpperCase() +
                                    userRole.slice(1)}
                            </Badge>
                        </div>
                        <div className="flex gap-2">
                            {canManageProfiles && (
                                <>
                                    <Button
                                        onClick={() => setShowCreateModal(true)}
                                    >
                                        <Database className="mr-2 h-4 w-4" />
                                        Create Profile
                                    </Button>
                                    <Button
                                        onClick={exportProfiles}
                                        disabled={profiles.length === 0}
                                    >
                                        <Download className="mr-2 h-4 w-4" />
                                        Export Profiles
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Status Messages */}
                    {error && (
                        <Card className="border-red-200 bg-red-50">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-2 text-red-600">
                                    <AlertCircle className="h-4 w-4" />
                                    {error}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {success && (
                        <Card className="border-red-200 bg-red-50">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-2 text-red-600">
                                    <CheckCircle className="h-4 w-4" />
                                    {success}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Tabs
                        value={activeTab}
                        onValueChange={setActiveTab}
                    >
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="browse">
                                Browse Profiles
                            </TabsTrigger>
                            
                            <TabsTrigger value="browseColors">
                                Browse Colors
                            </TabsTrigger>
                            
                            {canManageProfiles && (
                                <TabsTrigger value="import">
                                    Import Profiles
                                </TabsTrigger>
                            )}
                            {canManageProfiles && (
                                <TabsTrigger value="colors">
                                    Import Colors
                                </TabsTrigger>
                            )}
                            
                        </TabsList>

                        <TabsContent
                            value="browse"
                            className="space-y-6"
                        >
                            {/* Search and Filter */}
                            <Card className="border-0 shadow-sm bg-gradient-to-r from-gray-50 to-red-50">
                                <CardHeader className="pb-4">
                                    <CardTitle className="flex items-center gap-2 text-gray-800">
                                        <Search className="h-5 w-5 text-red-600" />
                                        Search & Filter Profiles
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-gray-700">
                                                Search Profiles
                                            </Label>
                                            <Input
                                                placeholder="Search by name, code, or brand..."
                                                value={searchTerm}
                                                onChange={(e) =>
                                                    setSearchTerm(
                                                        e.target.value
                                                    )
                                                }
                                                className="border-gray-300 focus:border-red-500 focus:ring-red-500"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-gray-700">
                                                Filter by Brand
                                            </Label>
                                            <Select
                                                value={brandFilter}
                                                onValueChange={setBrandFilter}
                                            >
                                                <SelectTrigger className="border-gray-300 focus:border-red-500 focus:ring-red-500">
                                                    <SelectValue placeholder="All brands" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">
                                                        All brands
                                                    </SelectItem>
                                                    {getBrands()
                                                        .filter(
                                                            (brand) => brand
                                                        )
                                                        .map((brand) => (
                                                            <SelectItem
                                                                key={brand}
                                                                value={brand}
                                                            >
                                                                {brand}
                                                            </SelectItem>
                                                        ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-gray-700">
                                                Filter by System Type
                                            </Label>
                                            <Select
                                                value={systemTypeFilter}
                                                onValueChange={
                                                    setSystemTypeFilter
                                                }
                                            >
                                                <SelectTrigger className="border-gray-300 focus:border-red-500 focus:ring-red-500">
                                                    <SelectValue placeholder="All system types" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">
                                                        All system types
                                                    </SelectItem>
                                                    {getSystemTypes().map(
                                                        (systemType) => (
                                                            <SelectItem
                                                                key={systemType}
                                                                value={systemType.toLowerCase()}
                                                            >
                                                                {systemType
                                                                    .replace(
                                                                        "_",
                                                                        " "
                                                                    )
                                                                    .replace(
                                                                        /\b\w/g,
                                                                        (l) =>
                                                                            l.toUpperCase()
                                                                    )}
                                                            </SelectItem>
                                                        )
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Profiles List */}
                            <Card className="border-0 shadow-sm">
                                <CardHeader className="bg-gradient-to-r from-gray-50 to-red-50 border-b">
                                    <CardTitle className="flex items-center justify-between">
                                        <span className="text-gray-800">
                                            Available Profiles
                                        </span>
                                        <Badge
                                            variant="secondary"
                                            className="text-sm"
                                        >
                                            {filteredProfiles.length}{" "}
                                            {filteredProfiles.length === 1
                                                ? "profile"
                                                : "profiles"}
                                        </Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {loading ? (
                                        <div className="text-center py-8">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                                            <p className="mt-2 text-gray-600">
                                                Loading profiles...
                                            </p>
                                        </div>
                                    ) : filteredProfiles.length === 0 ? (
                                        <div className="text-center py-8">
                                            <p className="text-gray-600">
                                                No profiles found
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {filteredProfiles.map(
                                                (profile, index) => (
                                                    //                                              {/**
                                                    //                                                interface Profile {
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
                                                    //                                                */}

                                                    <ProfileCard
                                                        key={index}
                                                        profile={profile}
                                                        selectedProfile={
                                                            selectedAvailableProfile
                                                        }
                                                        onProfileSelect={
                                                            handleSelectedAvailableProfile
                                                        }
                                                        onEdit={
                                                            handleEditAvailableProfile
                                                        }
                                                        onDelete={
                                                            handleDeleteAvailableProfile
                                                        }
                                                        showSelection={true}
                                                        canManageProfiles={
                                                            canManageProfiles
                                                        }
                                                    />
                                                )
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {canManageProfiles && (
                            <TabsContent
                                value="import"
                                className="space-y-6"
                            >
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Database className="h-5 w-5" />
                                            Import Profiles from CSV
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {/* CSV Import Section */}
                                        <div className="border border-red-200 rounded-lg p-6 bg-red-50">
                                            <h3 className="text-lg font-semibold text-red-900 mb-3 flex items-center gap-2">
                                                <Download className="h-5 w-5" />
                                                Import from CSV File
                                            </h3>
                                            <p className="text-red-700 mb-4">
                                                Upload a CSV file with your
                                                aluminum profile data. The file
                                                should include columns like:
                                                profile_code, brand,
                                                profile_name, system_type,
                                                kg_price, weight_6m,
                                                frame_price, etc.
                                            </p>

                                            <div className="flex gap-3 mb-4">
                                                <Button
                                                    onClick={() =>
                                                        document
                                                            .getElementById(
                                                                "csvFileInput"
                                                            )
                                                            ?.click()
                                                    }
                                                    className="bg-red-600 hover:bg-red-700"
                                                >
                                                    <Download className="h-4 w-4 mr-2" />
                                                    Choose CSV File
                                                </Button>

                                                <Button
                                                    variant="outline"
                                                    onClick={downloadSampleCSV}
                                                >
                                                    <Download className="h-4 w-4 mr-2" />
                                                    Download Sample CSV
                                                </Button>
                                            </div>

                                            <input
                                                title="csvInput"
                                                id="csvFileInput"
                                                type="file"
                                                accept=".csv"
                                                onChange={handleCSVImport}
                                                className="hidden"
                                            />

                                            {csvImportStatus && (
                                                <div
                                                    className={`p-4 rounded-lg ${
                                                        csvImportStatus.type ===
                                                        "success"
                                                            ? "bg-red-100 border border-red-300 text-red-800"
                                                            : "bg-red-100 border border-red-300 text-red-800"
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {csvImportStatus.type ===
                                                        "success" ? (
                                                            <CheckCircle className="h-5 w-5" />
                                                        ) : (
                                                            <AlertCircle className="h-5 w-5" />
                                                        )}
                                                        <span className="font-medium">
                                                            {
                                                                csvImportStatus.message
                                                            }
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Sample CSV Format */}
                                        <div className="border border-yellow-200 rounded-lg p-6 bg-yellow-50">
                                            <h3 className="text-lg font-semibold text-yellow-900 mb-3 flex items-center gap-2">
                                                <AlertCircle className="h-5 w-5" />
                                                Sample CSV Format
                                            </h3>
                                            <div className="bg-white p-4 rounded border font-mono text-sm overflow-x-auto">
                                                <div className="text-yellow-800 font-semibold mb-2">
                                                    Required columns:
                                                </div>
                                                <div className="text-gray-700 mb-4">
                                                    profile_code,brand,profile_name,system_type,kg_price,weight_6m,frame_price,frame_price_3,leaf_price
                                                </div>
                                                <div className="text-yellow-800 font-semibold mb-2">
                                                    Example data:
                                                </div>
                                                <div className="text-gray-700 space-y-1">
                                                    <div>
                                                        AL001,Cocoon,Standard
                                                        Sliding
                                                        Window,sliding,15.50,25.00,64.58,193.75,64.58
                                                    </div>
                                                    <div>
                                                        AL002,Cocoon,Premium
                                                        Hinged
                                                        Door,hinged,18.00,30.00,90.00,270.00,90.00
                                                    </div>
                                                    <div>
                                                        AL003,Cocoon,Curtain
                                                        Wall
                                                        System,curtain_wall,20.00,35.00,116.67,350.00,116.67
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Import Instructions */}
                                        <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-3">
                                                Import Instructions
                                            </h3>
                                            <div className="space-y-2 text-gray-700">
                                                <div className="flex items-start gap-2">
                                                    <span className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                                                        1
                                                    </span>
                                                    <span>
                                                        Download the sample CSV
                                                        file to see the required
                                                        format
                                                    </span>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <span className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                                                        2
                                                    </span>
                                                    <span>
                                                        Fill in your profile
                                                        data following the
                                                        sample format
                                                    </span>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <span className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                                                        3
                                                    </span>
                                                    <span>
                                                        Save your file as CSV
                                                        format
                                                    </span>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <span className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                                                        4
                                                    </span>
                                                    <span>
                                                        Click &#34;Choose CSV
                                                        File&rdquo; and select
                                                        your file
                                                    </span>
                                                </div>
                                                <div className="flex items-start gap-2">
                                                    <span className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                                                        5
                                                    </span>
                                                    <span>
                                                        Review the import
                                                        results and check for
                                                        any errors
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        )}

                        {canManageProfiles && (
                            <TabsContent
                                value="colors"
                                className="space-y-6"
                            >
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Palette className="h-5 w-5" />
                                            Import Colors from CSV
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="border border-blue-200 rounded-lg p-6 bg-blue-50">
                                            <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
                                                <Download className="h-5 w-5" />
                                                Import Color Options
                                            </h3>
                                            <p className="text-blue-700 mb-4">
                                                Upload a CSV file with your
                                                color data. The file should
                                                include columns like: code,
                                                brand, color, finish
                                            </p>

                                            <div className="flex gap-3 mb-4">
                                                <Button
                                                    onClick={() =>
                                                        document
                                                            .getElementById(
                                                                "colorCsvFileInput"
                                                            )
                                                            ?.click()
                                                    }
                                                    className="bg-blue-600 hover:bg-blue-700"
                                                >
                                                    <Download className="h-4 w-4 mr-2" />
                                                    Choose CSV File
                                                </Button>

                                                <Button
                                                    variant="outline"
                                                    onClick={
                                                        downloadColorSampleCSV
                                                    }
                                                >
                                                    <Download className="h-4 w-4 mr-2" />
                                                    Download Sample CSV
                                                </Button>
                                            </div>

                                            <input
                                                id="colorCsvFileInput"
                                                type="file"
                                                accept=".csv"
                                                title="Choose CSV file for color import"
                                                onChange={handleColorCSVImport}
                                                className="hidden"
                                            />

                                            {/* CSV Format Instructions */}
                                            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                                                    CSV Format Requirements
                                                </h4>
                                                <div className="text-sm text-gray-700 mb-3">
                                                    Your CSV file should include
                                                    these columns in order:
                                                </div>
                                                <div className="bg-white p-3 rounded border font-mono text-sm">
                                                    <div className="text-gray-800 font-semibold mb-1">
                                                        Required columns:
                                                    </div>
                                                    <div className="text-gray-700">
                                                        code,brand,color,finish
                                                    </div>
                                                </div>
                                            </div>

                                            {csvImportStatus && (
                                                <div
                                                    className={`p-4 rounded-lg ${
                                                        csvImportStatus.type ===
                                                        "success"
                                                            ? "bg-blue-100 border border-blue-300 text-blue-800"
                                                            : "bg-red-100 border border-red-300 text-red-800"
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {csvImportStatus.type ===
                                                        "success" ? (
                                                            <CheckCircle className="h-5 w-5" />
                                                        ) : (
                                                            <AlertCircle className="h-5 w-5" />
                                                        )}
                                                        <span className="font-medium">
                                                            {
                                                                csvImportStatus.message
                                                            }
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        )}
                        {/* Colors browse */}
                        <TabsContent
                            value="browseColors"
                            className="space-y-6"
                        >
                            {/* Search and Filter */}
                            <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-purple-50">
                                <CardHeader className="pb-4">
                                    <CardTitle className="flex items-center gap-2 text-gray-800">
                                        <Search className="h-5 w-5 text-blue-600" />
                                        Search & Filter Colors
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-gray-700">
                                                Search Colors
                                            </Label>
                                            <Input
                                                placeholder="Search by code, brand, color, or finish..."
                                                value={searchTerm}
                                                onChange={(e) =>
                                                    setSearchTerm(
                                                        e.target.value
                                                    )
                                                }
                                                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-gray-700">
                                                Filter by Brand
                                            </Label>
                                            <Select
                                                value={brandFilter}
                                                onValueChange={setBrandFilter}
                                            >
                                                <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                                                    <SelectValue placeholder="All brands" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">
                                                        All brands
                                                    </SelectItem>
                                                    {getColorBrands()
                                                        .filter(
                                                            (brand) => brand
                                                        )
                                                        .map((brand) => (
                                                            <SelectItem
                                                                key={brand}
                                                                value={brand}
                                                            >
                                                                {brand}
                                                            </SelectItem>
                                                        ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Colors List */}
                            <Card className="border-0 shadow-sm">
                                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
                                    <CardTitle className="flex items-center justify-between">
                                        <span className="text-gray-800">
                                            Available Colors
                                        </span>
                                        <Badge
                                            variant="secondary"
                                            className="text-sm"
                                        >
                                            {filteredColors.length}{" "}
                                            {filteredColors.length === 1
                                                ? "color"
                                                : "colors"}
                                        </Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {loading ? (
                                        <div className="text-center py-8">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                                            <p className="mt-2 text-gray-600">
                                                Loading colors...
                                            </p>
                                        </div>
                                    ) : filteredColors.length === 0 ? (
                                        <div className="text-center py-8">
                                            <p className="text-gray-600">
                                                No colors found
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {filteredColors.map(
                                                (color, index) => (                                        

                                                    <Card
                                                        key={index}
                                                        className="cursor-pointer transition-all hover:shadow-md"
                                                    >
                                                        <CardContent className="p-4">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <h4 className="font-semibold text-gray-800">
                                                                    {color.code}
                                                                </h4>
                                                            </div>
                                                            <div className="space-y-1 text-sm">
                                                                <div className="flex items-center gap-2">
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="text-blue-700"
                                                                    >
                                                                        {color.brand}
                                                                    </Badge>
                                                                </div>
                                                                <div>
                                                                    <span className="font-medium">
                                                                        Color:
                                                                    </span>{" "}
                                                                    <span className="text-gray-600">
                                                                        {color.color}
                                                                    </span>
                                                                </div>
                                                                <div>
                                                                    <span className="font-medium">
                                                                        Finish:
                                                                    </span>{" "}
                                                                    <span className="text-gray-600">
                                                                        {color.finish}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                )
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                        
                    </Tabs>
                </>
            )}

            

            {/* Create Profile Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-semibold mb-4">
                            Create New Profile
                        </h3>

                        <div className="space-y-4">
                            {/* Basic Info */}
                            <div>
                                <h4 className="font-medium mb-3">
                                    Basic Information
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Profile Name</Label>
                                        <Input
                                            value={createForm.name || ""}
                                            onChange={(e) =>
                                                handleCreateChange(
                                                    "name",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Profile name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Profile Code</Label>
                                        <Input
                                            value={createForm.code || ""}
                                            onChange={(e) =>
                                                handleCreateChange(
                                                    "code",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Profile code"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Brand</Label>
                                        <Input
                                            value={createForm.brand || ""}
                                            onChange={(e) =>
                                                handleCreateChange(
                                                    "brand",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Brand name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>System Type</Label>
                                        <Select
                                            value={createForm.system_type || ""}
                                            onValueChange={(value) =>
                                                handleCreateChange(
                                                    "system_type",
                                                    value
                                                )
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select system type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="sliding">
                                                    Sliding
                                                </SelectItem>
                                                <SelectItem value="hinged">
                                                    Hinged
                                                </SelectItem>
                                                <SelectItem value="fixed">
                                                    Fixed
                                                </SelectItem>
                                                <SelectItem value="curtain_wall">
                                                    Curtain Wall
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            {/* Pricing */}
                            <div>
                                <h4 className="font-medium mb-3">Pricing</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label>KG Price</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={createForm.kg_price || ""}
                                            onChange={(e) =>
                                                handleKgPriceChange(
                                                    parseFloat(
                                                        e.target.value
                                                    ) || 0
                                                )
                                            }
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Weight (6m)</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={createForm.weight_6m || ""}
                                            onChange={(e) =>
                                                handleWeightChange(
                                                    parseFloat(
                                                        e.target.value
                                                    ) || 0
                                                )
                                            }
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Frame Price (calculated)</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={createForm.frame_price || ""}
                                            disabled
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>
                                            Frame Price 3 (calculated)
                                        </Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={
                                                createForm.frame_price_3 || ""
                                            }
                                            disabled
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Leaf Price (calculated)</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={createForm.leaf_price || ""}
                                            disabled
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2 mt-6">
                                <Button
                                    onClick={createProfile}
                                    className="flex items-center gap-2"
                                >
                                    <Save className="h-4 w-4" />
                                    Create Profile
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setShowCreateModal(false)}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Profile Modal */}
            {showEditModal && editingProfile && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-semibold mb-4">
                            Edit Profile
                        </h3>

                        <div className="space-y-4">
                            {/* Basic Info */}
                            <div>
                                <h4 className="font-medium mb-3">
                                    Basic Information
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Profile Name</Label>
                                        <Input
                                            value={editingProfile.name || ""}
                                            onChange={(e) =>
                                                handleEditChange(
                                                    "name",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Profile name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Profile Code</Label>
                                        <Input
                                            value={editingProfile.code || ""}
                                            onChange={(e) =>
                                                handleEditChange(
                                                    "code",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Profile code"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Brand</Label>
                                        <Input
                                            value={editingProfile.brand || ""}
                                            onChange={(e) =>
                                                handleEditChange(
                                                    "brand",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Brand name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>System Type</Label>
                                        <Select
                                            value={
                                                editingProfile.system_type || ""
                                            }
                                            onValueChange={(value) =>
                                                handleEditChange(
                                                    "system_type",
                                                    value
                                                )
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select system type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="sliding">
                                                    Sliding
                                                </SelectItem>
                                                <SelectItem value="hinged">
                                                    Hinged
                                                </SelectItem>
                                                <SelectItem value="fixed">
                                                    Fixed
                                                </SelectItem>
                                                <SelectItem value="curtain_wall">
                                                    Curtain Wall
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            {/* Pricing */}
                            <div>
                                <h4 className="font-medium mb-3">Pricing</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label>KG Price</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={
                                                editingProfile.kg_price || ""
                                            }
                                            onChange={(e) =>
                                                handleKgPriceChange(
                                                    parseFloat(
                                                        e.target.value
                                                    ) || 0,
                                                    true
                                                )
                                            }
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Weight (6m)</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={
                                                editingProfile.weight_6m || ""
                                            }
                                            onChange={(e) =>
                                                handleWeightChange(
                                                    parseFloat(
                                                        e.target.value
                                                    ) || 0,
                                                    true
                                                )
                                            }
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Frame Price (calculated)</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={
                                                editingProfile.frame_price || ""
                                            }
                                            disabled
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>
                                            Frame Price 3 (calculated)
                                        </Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={
                                                editingProfile.frame_price_3 ||
                                                ""
                                            }
                                            disabled
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Leaf Price (calculated)</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={
                                                editingProfile.leaf_price || ""
                                            }
                                            disabled
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2 mt-6">
                                <Button
                                    onClick={updateProfile}
                                    className="flex items-center gap-2"
                                >
                                    <Save className="h-4 w-4" />
                                    Update Profile
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setShowEditModal(false)}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
