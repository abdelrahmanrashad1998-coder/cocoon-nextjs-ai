"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Calculator, Save, Plus, X } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/dashboard-layout";
import { QuoteItemEditor } from "@/components/quote/quote-item-editor";
import { QuotePreview } from "@/components/quote/quote-preview";
import { QuoteSettings } from "@/components/quote/quote-settings";
import { useQuoteGenerator } from "@/hooks/use-quote-generator";
import ColorManager from "@/components/color/color-manager";
import { ColorOption, QuoteData, QuoteItem } from "@/types/quote";
import { Palette } from "lucide-react";

export default function QuoteGeneratorPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const quoteId = searchParams.get("id");

    const {
        quoteData,
        addItem,
        updateItem,
        removeItem,
        updateContactInfo,
        updateQuoteName,
        updateSettings,
        updateGlobalColor,
        calculateTotals,
        saveQuote,
        exportQuote,
        fetchQuoteById,
        loadQuote,
        resetQuote,
        loading,
        error,
    } = useQuoteGenerator();

    const [activeTab, setActiveTab] = useState("items");
    const [showGlobalColorManager, setShowGlobalColorManager] = useState(false);

    // Load quote data if ID is provided
    useEffect(() => {
        const loadQuoteData = async () => {
            if (quoteId) {
                try {
                    console.log("Loading quote with ID:", quoteId);
                    const quote: QuoteData | null = await fetchQuoteById(
                        quoteId
                    );
                    console.log("Fetched quote:", quote);
                    if (quote) {
                        console.log("Quote found, loading data...");
                        // Use the proper loadQuote function from the hook
                        loadQuote(quote);
                        toast.success("Quote loaded successfully!");
                    } else {
                        console.log("Quote not found");
                        toast.error("Quote not found");
                    }
                } catch (error) {
                    console.error("Failed to load quote:", error);
                    toast.error("Failed to load quote for editing");
                }
            }
        };

        loadQuoteData();
    }, [quoteId, fetchQuoteById, loadQuote]);

    const handleAddItem = () => {
        addItem({
            type: "window",
            system: "Sliding",
            width: 1.2,
            height: 1.5,
            leaves: 2,
            quantity: 1,
            glassType: "double",
            mosquito: false,
            arch: false,
        });
        setActiveTab("items");
    };

    const handleSaveQuote = async () => {
        // Validate customer name
        if (
            !quoteData.contactInfo.name ||
            quoteData.contactInfo.name.trim() === ""
        ) {
            toast.error("Customer name is required", {
                description:
                    "Please enter the customer name before saving the quote.",
                duration: 5000,
                position: "top-center",
                style: {
                    fontSize: "16px",
                    padding: "20px 28px",
                    minWidth: "380px",
                    background: "linear-gradient(135deg, #ef4444, #dc2626)",
                    color: "white",
                    border: "none",
                    borderRadius: "12px",
                    boxShadow: "0 10px 25px rgba(239, 68, 68, 0.3)",
                    fontWeight: "500",
                    textAlign: "center",
                },
                icon: "❌",
            });
            // Switch to contact tab to show the required field
            setActiveTab("contact");
            return;
        }

        try {
            await saveQuote();
            toast.success("Quote saved successfully!", {
                description: "Your quote has been saved to the database.",
                duration: 5000,
                position: "top-center",
                style: {
                    fontSize: "16px",
                    padding: "20px 28px",
                    minWidth: "380px",
                    background: "linear-gradient(135deg, #10b981, #059669)",
                    color: "white",
                    border: "none",
                    borderRadius: "12px",
                    boxShadow: "0 10px 25px rgba(16, 185, 129, 0.3)",
                    fontWeight: "500",
                    textAlign: "center",
                },
                icon: "✅",
            });
        } catch (error) {
            console.error("Error saving quote:", error);
            toast.error("Failed to save quote", {
                description: "Please check your connection and try again.",
                duration: 5000,
                position: "top-center",
                style: {
                    fontSize: "16px",
                    padding: "20px 28px",
                    minWidth: "380px",
                    background: "linear-gradient(135deg, #ef4444, #dc2626)",
                    color: "white",
                    border: "none",
                    borderRadius: "12px",
                    boxShadow: "0 10px 25px rgba(239, 68, 68, 0.3)",
                    fontWeight: "500",
                    textAlign: "center",
                },
                icon: "❌",
            });
        }
    };

    const handleCancelEdit = () => {
        resetQuote();
        if (quoteId) {
            router.push("/quote-generator");
        }
    };

    const handleGlobalColorSelect = (color: ColorOption) => {
        updateGlobalColor(color);
        setShowGlobalColorManager(false);
    };

    return (
        <DashboardLayout>
            <div className="container mx-auto max-w-7xl">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Calculator className="h-6 w-6 text-primary" />
                        <h1 className="text-3xl font-bold">Quote Generator</h1>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={handleCancelEdit}
                        >
                            <X className="mr-2 h-4 w-4" />
                            Cancel Edit
                        </Button>
                        <Button
                            onClick={handleSaveQuote}
                            disabled={
                                loading ||
                                quoteData.items.length === 0 ||
                                !quoteData.contactInfo.name ||
                                quoteData.contactInfo.name.trim() === ""
                            }
                        >
                            <Save className="mr-2 h-4 w-4" />
                            Save Quote
                        </Button>
                    </div>
                </div>

                {error && (
                    <Card className="mb-6 border-red-200 bg-red-50">
                        <CardContent className="pt-6">
                            <p className="text-red-600">{error}</p>
                        </CardContent>
                    </Card>
                )}

                <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="w-full"
                >
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="items">Items</TabsTrigger>
                        <TabsTrigger value="contact">Contact Info</TabsTrigger>
                        <TabsTrigger value="settings">Settings</TabsTrigger>
                        <TabsTrigger value="preview">Preview</TabsTrigger>
                    </TabsList>

                    <TabsContent
                        value="items"
                        className="space-y-6"
                    >
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Quote Items</CardTitle>
                                        <CardDescription>
                                            Add and configure aluminum work
                                            items for your quote
                                        </CardDescription>
                                    </div>
                                    <Button onClick={handleAddItem}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Item
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {quoteData.items.length === 0 ? (
                                    <div className="text-center py-8">
                                        <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                        <h3 className="text-lg font-medium mb-2">
                                            No items added
                                        </h3>
                                        <p className="text-muted-foreground mb-4">
                                            Start by adding your first aluminum
                                            work item
                                        </p>
                                        <Button onClick={handleAddItem}>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Add First Item
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {quoteData.items.map((item, index) => (
                                            <QuoteItemEditor
                                                key={index}
                                                item={item}
                                                onUpdate={(updatedItem) =>
                                                    updateItem(
                                                        updatedItem.id,
                                                        updatedItem
                                                    )
                                                }
                                                onRemove={() =>
                                                    removeItem(
                                                        quoteData.items[index]
                                                            .id
                                                    )
                                                }
                                                index={index}
                                                globalColor={
                                                    quoteData.globalColor
                                                }
                                            />
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {quoteData.items.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Quote Summary</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="text-center p-4 bg-muted rounded-lg">
                                            <div className="text-2xl font-bold text-primary">
                                                {quoteData.items.length}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                Items
                                            </div>
                                        </div>
                                        <div className="text-center p-4 bg-muted rounded-lg">
                                            <div className="text-2xl font-bold text-primary">
                                                {calculateTotals().totalArea.toFixed(
                                                    2
                                                )}{" "}
                                                m²
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                Total Area
                                            </div>
                                        </div>
                                        <div className="text-center p-4 bg-muted rounded-lg">
                                            <div className="text-2xl font-bold text-primary">
                                                {calculateTotals().totalPrice.toLocaleString()}{" "}
                                                EGP
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                Total Price
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent
                        value="contact"
                        className="space-y-6"
                    >
                        <Card>
                            <CardHeader>
                                <CardTitle>Customer Information</CardTitle>
                                <CardDescription>
                                    Enter customer details and project
                                    information
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="customerName">
                                            Customer Name
                                        </Label>
                                        <Input
                                            id="customerName"
                                            value={
                                                quoteData.contactInfo.name || ""
                                            }
                                            onChange={(e) =>
                                                updateContactInfo({
                                                    name: e.target.value,
                                                })
                                            }
                                            placeholder="Enter customer name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="customerEmail">
                                            Email
                                        </Label>
                                        <Input
                                            id="customerEmail"
                                            type="email"
                                            value={
                                                quoteData.contactInfo.email ||
                                                ""
                                            }
                                            onChange={(e) =>
                                                updateContactInfo({
                                                    email: e.target.value,
                                                })
                                            }
                                            placeholder="Enter email address"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="customerPhone">
                                            Phone
                                        </Label>
                                        <Input
                                            id="customerPhone"
                                            type="tel"
                                            value={
                                                quoteData.contactInfo.phone ||
                                                ""
                                            }
                                            onChange={(e) =>
                                                updateContactInfo({
                                                    phone: e.target.value,
                                                })
                                            }
                                            placeholder="Enter phone number"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="projectLocation">
                                            Project Location
                                        </Label>
                                        <Input
                                            id="projectLocation"
                                            value={
                                                quoteData.contactInfo
                                                    .location || ""
                                            }
                                            onChange={(e) =>
                                                updateContactInfo({
                                                    location: e.target.value,
                                                })
                                            }
                                            placeholder="Enter project location"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="projectNotes">
                                        Project Notes
                                    </Label>
                                    <Textarea
                                        id="projectNotes"
                                        value={
                                            quoteData.contactInfo.notes || ""
                                        }
                                        onChange={(e) =>
                                            updateContactInfo({
                                                notes: e.target.value,
                                            })
                                        }
                                        placeholder="Enter any special requirements or notes..."
                                        rows={4}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent
                        value="settings"
                        className="space-y-6"
                    >
                        {/* Global Color Settings */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Palette className="h-5 w-5 text-primary" />
                                    <CardTitle>Global Color Settings</CardTitle>
                                </div>
                                <CardDescription>
                                    Set a global color that will be applied to
                                    all items by default
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium">
                                        Global Color
                                    </Label>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            setShowGlobalColorManager(true)
                                        }
                                        className="flex items-center gap-2"
                                    >
                                        <Palette className="h-4 w-4" />
                                        {quoteData.globalColor
                                            ? "Change Color"
                                            : "Select Color"}
                                    </Button>
                                </div>

                                {quoteData.globalColor ? (
                                    <Card className="border-blue-200 bg-blue-50">
                                        <CardContent className="pt-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-semibold text-blue-800">
                                                        {
                                                            quoteData
                                                                .globalColor
                                                                .code
                                                        }
                                                    </h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge
                                                            variant="outline"
                                                            className="text-blue-700"
                                                        >
                                                            {
                                                                quoteData
                                                                    .globalColor
                                                                    .brand
                                                            }
                                                        </Badge>
                                                        <Badge
                                                            variant="secondary"
                                                            className="text-blue-700"
                                                        >
                                                            {
                                                                quoteData
                                                                    .globalColor
                                                                    .color
                                                            }
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        updateGlobalColor(
                                                            undefined
                                                        )
                                                    }
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                            <div className="mt-3 text-sm">
                                                <span className="font-medium">
                                                    Finish:
                                                </span>{" "}
                                                <span className="text-blue-600 ml-2">
                                                    {
                                                        quoteData.globalColor
                                                            .finish
                                                    }
                                                </span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
                                        <Palette className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                        <p className="text-gray-600">
                                            No global color selected
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            Select a color to apply to all items
                                            by default
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <QuoteSettings
                            settings={quoteData.settings}
                            onUpdate={updateSettings}
                            onExport={(type) => {
                                if (type === "pdf" || type === "print") {
                                    exportQuote(type);
                                }
                            }}
                            quoteName={quoteData.name}
                            onUpdateQuoteName={updateQuoteName}
                        />
                    </TabsContent>

                    <TabsContent
                        value="preview"
                        className="space-y-6"
                    >
                        <QuotePreview
                            quoteData={quoteData}
                            totals={calculateTotals()}
                        />
                    </TabsContent>
                </Tabs>
            </div>

            {/* Global Color Manager Modal */}
            {showGlobalColorManager && (
                <div className="fixed inset-0 bg-white border-gray-600 border bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-[1400px] w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">
                                Select Global Color
                            </h3>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowGlobalColorManager(false)}
                            >
                                Close
                            </Button>
                        </div>
                        <ColorManager
                            onColorSelect={handleGlobalColorSelect}
                            selectedColor={quoteData.globalColor}
                            showSelection={true}
                        />
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
