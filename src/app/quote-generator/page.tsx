"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Calculator, Save, Plus } from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";
import { QuoteItemEditor } from "@/components/quote/quote-item-editor";
import { QuotePreview } from "@/components/quote/quote-preview";
import { QuoteSettings } from "@/components/quote/quote-settings";
import { useQuoteGenerator } from "@/hooks/use-quote-generator";

export default function QuoteGeneratorPage() {
    const {
        quoteData,
        addItem,
        updateItem,
        removeItem,
        updateContactInfo,
        updateSettings,
        calculateTotals,
        saveQuote,
        exportQuote,
        loading,
        error,
    } = useQuoteGenerator();

    const [activeTab, setActiveTab] = useState("items");

    const handleAddItem = () => {
        addItem();
        setActiveTab("items");
    };

    const handleSaveQuote = async () => {
        try {
            await saveQuote();
            // Show success message
        } catch (error) {
            console.error("Error saving quote:", error);
        }
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
                            onClick={handleSaveQuote}
                            disabled={loading}
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
                                                key={item.id}
                                                item={item}
                                                onUpdate={(updatedItem) =>
                                                    updateItem(
                                                        index,
                                                        updatedItem
                                                    )
                                                }
                                                onRemove={() =>
                                                    removeItem(index)
                                                }
                                                index={index}
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
                                            value={quoteData.contactInfo.name}
                                            onChange={(e) =>
                                                updateContactInfo(
                                                    "name",
                                                    e.target.value
                                                )
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
                                            value={quoteData.contactInfo.email}
                                            onChange={(e) =>
                                                updateContactInfo(
                                                    "email",
                                                    e.target.value
                                                )
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
                                            value={quoteData.contactInfo.phone}
                                            onChange={(e) =>
                                                updateContactInfo(
                                                    "phone",
                                                    e.target.value
                                                )
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
                                                quoteData.contactInfo.location
                                            }
                                            onChange={(e) =>
                                                updateContactInfo(
                                                    "location",
                                                    e.target.value
                                                )
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
                                        value={quoteData.contactInfo.notes}
                                        onChange={(e) =>
                                            updateContactInfo(
                                                "notes",
                                                e.target.value
                                            )
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
                        <QuoteSettings
                            settings={quoteData.settings}
                            onUpdate={updateSettings}
                            onExport={(type) =>
                                exportQuote({
                                    type,
                                    format: quoteData.settings.exportFormat,
                                    pricingType: quoteData.settings.pricingType,
                                    customNotes: quoteData.settings.customNotes,
                                    expirationDays:
                                        quoteData.settings.expirationDays,
                                    projectDuration:
                                        quoteData.settings.projectDuration,
                                    discountPercentage:
                                        quoteData.settings.discountPercentage,
                                    quoteData,
                                    totals: calculateTotals(),
                                })
                            }
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
        </DashboardLayout>
    );
}
