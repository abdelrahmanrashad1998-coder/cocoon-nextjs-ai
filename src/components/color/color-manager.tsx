"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
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
    Palette,
    Download,
    Search,
    Save,
    Edit,
    Trash2,
    Upload,
    Database,
} from "lucide-react";
import { ColorOption } from "@/types/quote";

interface ColorManagerProps {
    onColorSelect?: (color: ColorOption) => void;
    showSelection?: boolean;
}

export default function ColorManager({
    onColorSelect,
    showSelection = false,
}: ColorManagerProps) {
    const { user, loading: authLoading } = useAuth();
    const [colors, setColors] = useState<ColorOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [brandFilter, setBrandFilter] = useState("all");
    const [selectedAvailableColor, setSelectedAvailableColor] =
        useState<ColorOption>();
    const [activeTab, setActiveTab] = useState("browse");
    const [userRole, setUserRole] = useState("user");
    const [canManageColors, setCanManageColors] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingColor, setEditingColor] = useState<ColorOption | null>(null);
    const [createForm, setCreateForm] = useState<Partial<ColorOption>>({});
    const [csvImportStatus, setCsvImportStatus] = useState<{
        type: "success" | "error";
        message: string;
    } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load user role and check permissions
    const loadUserRole = useCallback(async () => {
        if (!user) return;

        try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const role = userData.role || "user";
                setUserRole(role);

                // Check if user can manage colors
                const canManage = role === "admin" || role === "manager";
                setCanManageColors(canManage);
            }
        } catch (error) {
            console.error("Error loading user role:", error);
            setUserRole("user");
            setCanManageColors(false);
        }
    }, [user]);

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

    const loadColors = useCallback(async () => {
        if (!user) {
            setError("Please log in to access colors");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const colorsCollection = collection(db, "colorOptions");
            const colorsSnapshot = await getDocs(colorsCollection);
            const colorsList = colorsSnapshot.docs
                .filter((doc) => !doc.data().deleted) // Filter out deleted colors
                .map((doc) => {
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
    }, [user]);

    // Load colors from Firebase when user is authenticated
    useEffect(() => {
        if (user && !authLoading) {
            loadUserRole();
            loadColors();
        }
    }, [user, authLoading, loadColors, loadUserRole]);

    const createColor = async () => {
        if (!user) {
            setError("Please log in to create colors");
            return;
        }

        // Validate required fields
        if (
            !createForm.code ||
            !createForm.brand ||
            !createForm.color ||
            !createForm.finish
        ) {
            setError("Please fill in all required fields");
            return;
        }

        try {
            const colorsCollection = collection(db, "colorOptions");
            const colorData = {
                code: createForm.code.trim(),
                brand: createForm.brand.trim(),
                color: createForm.color.trim(),
                finish: createForm.finish.trim(),
            };

            await addDoc(colorsCollection, colorData);

            setSuccess("Color created successfully");
            setShowCreateModal(false);
            setCreateForm({});
            loadColors();
        } catch (error: unknown) {
            const err = error as { code?: string; message?: string };
            if (err.code === "permission-denied") {
                setError(
                    "Permission denied: Please check your Firebase security rules. You may need to update them to allow access to the colorOptions collection."
                );
            } else {
                setError(
                    `Error creating color: ${err.message || "Unknown error"}`
                );
            }
        }
    };

    const updateColor = async () => {
        if (!user || !editingColor?.id) {
            setError("Please log in to update colors");
            return;
        }

        try {
            const colorRef = doc(db, "colorOptions", editingColor.id);
            const colorData = {
                code: editingColor.code || "",
                brand: editingColor.brand || "",
                color: editingColor.color || "",
                finish: editingColor.finish || "",
            };

            await updateDoc(colorRef, colorData);

            setSuccess("Color updated successfully");
            setShowEditModal(false);
            setEditingColor(null);
            loadColors();
        } catch (error: unknown) {
            const err = error as { code?: string; message?: string };
            setError(`Error updating color: ${err.message || "Unknown error"}`);
        }
    };

    const handleSelectedAvailableColor = (color: ColorOption) => {
        setSelectedAvailableColor(color);
        onColorSelect!(color);
    };

    const handleEditColor = (color: ColorOption) => {
        setEditingColor(color);
        setShowEditModal(true);
    };

    const deleteColor = async (id: string) => {
        if (!user) {
            setError("Please log in to delete colors");
            return;
        }

        try {
            const colorRef = doc(db, "colorOptions", id);
            await updateDoc(colorRef, { deleted: true }); // Soft delete
            setSuccess("Color deleted successfully");
            loadColors();
        } catch (error: unknown) {
            const err = error as { code?: string; message?: string };
            setError(`Error deleting color: ${err.message || "Unknown error"}`);
        }
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

    // Check if color exists in Firebase
    const checkColorExists = async (code: string): Promise<boolean> => {
        try {
            console.log(`Checking if color exists: ${code}`);
            const colorsCollection = collection(db, "colorOptions");
            const q = query(colorsCollection, where("code", "==", code));
            const querySnapshot = await getDocs(q);
            const exists = !querySnapshot.empty;
            console.log(`Color ${code} exists:`, exists);
            return exists;
        } catch (error) {
            console.error("Error checking color existence:", error);
            return false;
        }
    };

    // Handle CSV import for colors
    const handleColorCSVImport = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];
        if (!file) {
            console.log("No file selected");
            return;
        }

        console.log("Starting CSV import for file:", file.name);
        console.log("User:", user?.email, "Role:", userRole, "Can manage colors:", canManageColors);

        if (!canManageColors) {
            setCsvImportStatus({
                type: "error",
                message: "You don't have permission to import colors. Only admin and manager users can import colors.",
            });
            setTimeout(() => setCsvImportStatus(null), 5000);
            return;
        }

        setCsvImportStatus({
            type: "error",
            message: "Processing color CSV file...",
        });

        try {
            const text = await file.text();
            console.log("File content:", text.substring(0, 200) + "...");
            
            const lines = text.split("\n").filter(line => line.trim() !== "");
            console.log("Number of lines:", lines.length);
            
            if (lines.length < 2) {
                throw new Error("CSV file must have at least a header row and one data row");
            }

            const headers = lines[0]
                .split(",")
                .map((h) => h.trim().replace(/"/g, "").toLowerCase());
            
            console.log("Headers found:", headers);

            // Validate headers
            const requiredHeaders = ['code', 'brand', 'color', 'finish'];
            const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
            if (missingHeaders.length > 0) {
                throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
            }

            let importedCount = 0;
            let skippedCount = 0;
            let invalidCount = 0;

            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                console.log(`Processing line ${i}:`, line);

                // Better CSV parsing that handles quoted values
                const values = parseCSVLine(line);
                const color: Record<string, string> = {};

                headers.forEach((header, index) => {
                    color[header] = (values[index] || "").trim();
                });

                console.log("Parsed color data:", color);

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
                        console.log(`Imported color: ${color.code}`);
                    } else {
                        skippedCount++;
                        console.log(`Skipped existing color: ${color.code}`);
                    }
                } else {
                    invalidCount++;
                    console.log(`Invalid color data:`, color);
                }
            }

            setCsvImportStatus({
                type: "success",
                message: `Color import complete! ${importedCount} imported, ${skippedCount} skipped, ${invalidCount} invalid`,
            });

            // Clear status after 5 seconds
            setTimeout(() => setCsvImportStatus(null), 5000);
            
            // Reload colors to show the imported ones
            loadColors();
        } catch (error: unknown) {
            const err = error as { code?: string; message?: string };
            console.error("Error importing color CSV:", error);
            
            let errorMessage = "Unknown error occurred";
            if (err.code === "permission-denied") {
                errorMessage = "Permission denied: Please check your Firebase security rules. You may need to update them to allow access to the colorOptions collection.";
            } else if (err.message) {
                errorMessage = err.message;
            }
            
            setCsvImportStatus({
                type: "error",
                message: `Error importing color CSV: ${errorMessage}`,
            });
            setTimeout(() => setCsvImportStatus(null), 5000);
        }

        // Reset file input
        event.target.value = "";
    };

    // Helper function to parse CSV line properly handling quoted values
    const parseCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current);
        return result;
    };


    const handleCreateChange = (field: keyof ColorOption, value: string) => {
        setCreateForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleEditChange = (field: keyof ColorOption, value: string) => {
        if (editingColor) {
            setEditingColor((prev) =>
                prev ? { ...prev, [field]: value } : null
            );
        }
    };

    const getBrands = () => {
        const brands = colors.map((color) => color.brand).filter(Boolean);
        return [...new Set(brands)];
    };

    const exportColors = () => {
        const csvContent = [
            ["Code", "Brand", "Color", "Finish"],
            ...colors.map((color) => [
                color.code,
                color.brand,
                color.color,
                color.finish,
            ]),
        ]
            .map((row) => row.join(","))
            .join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "color-options.csv";
        a.click();
        window.URL.revokeObjectURL(url);
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
                        Please log in to access the Color Manager.
                    </p>
                </div>
            )}

            {/* Authenticated Content */}
            {!authLoading && user && (
                <>
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Palette className="h-6 w-6 text-primary" />
                            <h2 className="text-2xl font-bold">
                                Color Manager
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
                            {canManageColors && (
                                <>
                                    <Button
                                        onClick={() => setShowCreateModal(true)}
                                    >
                                        <Palette className="mr-2 h-4 w-4" />
                                        Create Color
                                    </Button>
                                    <Button
                                        onClick={exportColors}
                                        disabled={colors.length === 0}
                                    >
                                        <Download className="mr-2 h-4 w-4" />
                                        Export Colors
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
                        <Card className="border-green-200 bg-green-50">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-2 text-green-600">
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
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="browse">
                                Browse Colors
                            </TabsTrigger>
                            {canManageColors && (
                                <TabsTrigger value="import">
                                    Import Colors
                                </TabsTrigger>
                            )}
                        </TabsList>

                        <TabsContent
                            value="browse"
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
                                                        className={`cursor-pointer transition-all hover:shadow-md ${
                                                            selectedAvailableColor?.code ===
                                                            color.code
                                                                ? "ring-2 ring-blue-500 bg-blue-50"
                                                                : ""
                                                        }`}
                                                        onClick={() => {
                                                            if (showSelection) {
                                                                handleSelectedAvailableColor(
                                                                    color
                                                                );
                                                            }
                                                        }}
                                                    >
                                                        <CardContent className="p-4">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <h4 className="font-semibold text-gray-800">
                                                                    {color.code}
                                                                </h4>
                                                                <div className="flex items-center gap-2">
                                                                    {showSelection && (
                                                                        <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex items-center justify-center">
                                                                            {selectedAvailableColor?.code ===
                                                                                color.code && (
                                                                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                    {canManageColors && (
                                                                        <div className="flex gap-1">
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleEditColor(color);
                                                                                }}
                                                                                className="p-1 hover:bg-gray-100 rounded transition-colors"
                                                                                title="Edit color"
                                                                            >
                                                                                <Edit className="h-3 w-3 text-gray-600" />
                                                                            </button>
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    if (color.id) deleteColor(color.id);
                                                                                }}
                                                                                className="p-1 hover:bg-red-100 rounded transition-colors"
                                                                                title="Delete color"
                                                                            >
                                                                                <Trash2 className="h-3 w-3 text-red-600" />
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="space-y-1 text-sm">
                                                                <div className="flex items-center gap-2">
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="text-blue-700"
                                                                    >
                                                                        {
                                                                            color.brand
                                                                        }
                                                                    </Badge>
                                                                </div>
                                                                <div>
                                                                    <span className="font-medium">
                                                                        Color:
                                                                    </span>{" "}
                                                                    <span className="text-gray-600">
                                                                        {
                                                                            color.color
                                                                        }
                                                                    </span>
                                                                </div>
                                                                <div>
                                                                    <span className="font-medium">
                                                                        Finish:
                                                                    </span>{" "}
                                                                    <span className="text-gray-600">
                                                                        {
                                                                            color.finish
                                                                        }
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

                        {canManageColors && (
                            <TabsContent
                                value="import"
                                className="space-y-6"
                            >
                                {console.log("Import tab is being rendered, canManageColors:", canManageColors)}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Database className="h-5 w-5" />
                                            Import Colors from CSV
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {/* CSV Import Section */}
                                        <div className="border border-blue-200 rounded-lg p-6 bg-blue-50">
                                            <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
                                                <Upload className="h-5 w-5" />
                                                Import Color Options
                                            </h3>
                                            <p className="text-blue-700 mb-4">
                                                Upload a CSV file with your color data. The file should include columns: code, brand, color, finish.
                                            </p>
                                            
                                            <div className="flex gap-4 mb-4">
                                                <Button
                                                    onClick={downloadColorSampleCSV}
                                                    variant="outline"
                                                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                                                >
                                                    <Download className="mr-2 h-4 w-4" />
                                                    Download Sample CSV
                                                </Button>
                                                
                                                <Button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        console.log("Choose CSV button clicked");
                                                        console.log("File input ref:", fileInputRef.current);
                                                        if (fileInputRef.current) {
                                                            console.log("Triggering file input click");
                                                            fileInputRef.current.click();
                                                        } else {
                                                            console.error("File input ref not found");
                                                        }
                                                    }}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                                >
                                                    <Upload className="mr-2 h-4 w-4" />
                                                    Choose CSV File
                                                </Button>
                                                
                                                <input
                                                    ref={fileInputRef}
                                                    id="colorCsvFileInput"
                                                    type="file"
                                                    accept=".csv"
                                                    title="Choose CSV file for color import"
                                                    onChange={(e) => {
                                                        console.log("File input changed:", e.target.files);
                                                        handleColorCSVImport(e);
                                                    }}
                                                    className="hidden"
                                                />
                                            </div>
                                            
                                            {/* Alternative file input for testing */}
                                            <div className="mt-4 p-4 border border-gray-300 rounded-lg bg-gray-50">
                                                <p className="text-sm text-gray-600 mb-2">Alternative file input (for testing):</p>
                                                <input
                                                    type="file"
                                                    accept=".csv"
                                                    onChange={(e) => {
                                                        console.log("Alternative file input changed:", e.target.files);
                                                        handleColorCSVImport(e);
                                                    }}
                                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                                />
                                            </div>

                                            {/* CSV Format Instructions */}
                                            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                                                    CSV Format Requirements
                                                </h4>
                                                <div className="text-sm text-gray-700 mb-3">
                                                    Your CSV file must have the following columns (in any order):
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="text-xs">code</Badge>
                                                        <span className="text-gray-600">Color code (e.g., RAL-9005)</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="text-xs">brand</Badge>
                                                        <span className="text-gray-600">Brand name (e.g., Cocoon)</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="text-xs">color</Badge>
                                                        <span className="text-gray-600">Color name (e.g., Black)</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="text-xs">finish</Badge>
                                                        <span className="text-gray-600">Finish type (e.g., Matte)</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* CSV Import Status */}
                                        {csvImportStatus && (
                                            <Card className={`border-2 ${
                                                csvImportStatus.type === "success" 
                                                    ? "border-green-200 bg-green-50" 
                                                    : "border-red-200 bg-red-50"
                                            }`}>
                                                <CardContent className="pt-6">
                                                    <div className={`flex items-center gap-2 ${
                                                        csvImportStatus.type === "success" 
                                                            ? "text-green-600" 
                                                            : "text-red-600"
                                                    }`}>
                                                        {csvImportStatus.type === "success" ? (
                                                            <CheckCircle className="h-4 w-4" />
                                                        ) : (
                                                            <AlertCircle className="h-4 w-4" />
                                                        )}
                                                        {csvImportStatus.message}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        )}
                    </Tabs>
                </>
            )}

            {/* Create Color Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-semibold mb-4">
                            Create New Color
                        </h3>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <Label>Code</Label>
                                    <Input
                                        value={createForm.code || ""}
                                        onChange={(e) =>
                                            handleCreateChange(
                                                "code",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Color code (e.g., RAL-9005)"
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
                                    <Label>Color</Label>
                                    <Input
                                        value={createForm.color || ""}
                                        onChange={(e) =>
                                            handleCreateChange(
                                                "color",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Color name (e.g., Black)"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Finish</Label>
                                    <Input
                                        value={createForm.finish || ""}
                                        onChange={(e) =>
                                            handleCreateChange(
                                                "finish",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Finish type (e.g., Matte)"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-2 mt-6">
                                <Button
                                    onClick={createColor}
                                    className="flex items-center gap-2"
                                >
                                    <Save className="h-4 w-4" />
                                    Create Color
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

            {/* Edit Color Modal */}
            {showEditModal && editingColor && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-semibold mb-4">
                            Edit Color
                        </h3>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <Label>Code</Label>
                                    <Input
                                        value={editingColor.code || ""}
                                        onChange={(e) =>
                                            handleEditChange(
                                                "code",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Color code"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Brand</Label>
                                    <Input
                                        value={editingColor.brand || ""}
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
                                    <Label>Color</Label>
                                    <Input
                                        value={editingColor.color || ""}
                                        onChange={(e) =>
                                            handleEditChange(
                                                "color",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Color name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Finish</Label>
                                    <Input
                                        value={editingColor.finish || ""}
                                        onChange={(e) =>
                                            handleEditChange(
                                                "finish",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Finish type"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-2 mt-6">
                                <Button
                                    onClick={updateColor}
                                    className="flex items-center gap-2"
                                >
                                    <Save className="h-4 w-4" />
                                    Update Color
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
