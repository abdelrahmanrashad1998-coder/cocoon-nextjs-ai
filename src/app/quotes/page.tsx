"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { FileText, Search, Edit, Trash2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import { QuoteData } from "@/types/quote";
import { useQuoteGenerator } from "@/hooks/use-quote-generator";

export default function QuotesPage() {
    const [quotes, setQuotes] = useState<QuoteData[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { fetchQuotes, deleteQuote } = useQuoteGenerator();

    useEffect(() => {
        const loadQuotes = async () => {
            try {
                const fetchedQuotes = await fetchQuotes();
                setQuotes(fetchedQuotes);
            } catch (error) {
                console.error("Failed to fetch quotes:", error);
            } finally {
                setLoading(false);
            }
        };

        loadQuotes();
    }, [fetchQuotes]);

    const filteredQuotes = quotes.filter(
        (quote) =>
            quote.contactInfo.name
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            quote.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            quote.items.some((item) =>
                item.type.toLowerCase().includes(searchTerm.toLowerCase())
            )
    );

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            pending: { variant: "secondary" as const, text: "Pending" },
            approved: { variant: "default" as const, text: "Approved" },
            completed: { variant: "default" as const, text: "Completed" },
            rejected: { variant: "destructive" as const, text: "Rejected" },
        };

        const config =
            statusConfig[status as keyof typeof statusConfig] ||
            statusConfig.pending;
        return <Badge variant={config.variant}>{config.text}</Badge>;
    };

    const handleEdit = (quoteId: string) => {
        router.push(`/quote-generator?id=${quoteId}`);
    };

    const handleDelete = async (quoteId: string) => {
        if (confirm("Are you sure you want to delete this quote?")) {
            try {
                await deleteQuote(quoteId);
                setQuotes((prev) =>
                    prev.filter((quote) => quote.id !== quoteId)
                );
            } catch (error) {
                console.error("Failed to delete quote:", error);
                alert("Failed to delete quote. Please try again.");
            }
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="container mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <FileText className="h-6 w-6 text-primary" />
                        <h1 className="text-3xl font-bold">Quotes</h1>
                    </div>
                    <Button onClick={() => router.push("/quote-generator")}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Quote
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Quote Management</CardTitle>
                        <CardDescription>
                            View and manage all your quotes
                        </CardDescription>
                        <div className="flex items-center gap-2">
                            <Search className="h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search quotes..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="max-w-sm"
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Project Type</TableHead>
                                    <TableHead>Total Price</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredQuotes.map((quote) => {
                                    // Calculate total price
                                    const totalPrice = quote.items.reduce(
                                        (sum, item) =>
                                            sum +
                                            item.width *
                                                item.height *
                                                item.quantity *
                                                1200, // Mock calculation
                                        0
                                    );

                                    // Get project type
                                    const projectType =
                                        quote.items.length === 1
                                            ? quote.items[0].type
                                            : `${quote.items.length} Items`;

                                    return (
                                        <TableRow key={quote.id}>
                                            <TableCell className="font-medium">
                                                {quote.contactInfo.name}
                                            </TableCell>
                                            <TableCell>{projectType}</TableCell>
                                            <TableCell>
                                                ${totalPrice.toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge("pending")}
                                            </TableCell>
                                            <TableCell>
                                                {new Date(
                                                    quote.createdAt
                                                ).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            handleEdit(quote.id)
                                                        }
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            handleDelete(
                                                                quote.id
                                                            )
                                                        }
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>

                        {filteredQuotes.length === 0 && (
                            <div className="text-center py-8">
                                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">
                                    No quotes found
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
