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
import { StatusBadge } from "@/components/ui/status-badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
    FileText, 
    Search, 
    Edit, 
    Trash2, 
    CheckCircle, 
    XCircle, 
    Clock, 
    AlertCircle,
    Filter,
    Eye,
    Calendar,
    History,
    RotateCcw
} from "lucide-react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import { QuoteData, QuoteStatus, QuoteHistoryEntry } from "@/types/quote";
import { useQuoteGenerator } from "@/hooks/use-quote-generator";
import { calculateItemPricing } from "@/lib/pricing-calculator";

export default function QuotesPage() {
    const [quotes, setQuotes] = useState<QuoteData[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<QuoteStatus | "all">("all");
    const [loading, setLoading] = useState(true);
    const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
    const [selectedQuote, setSelectedQuote] = useState<QuoteData | null>(null);
    const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [approvalNotes, setApprovalNotes] = useState("");
    const [showHistory, setShowHistory] = useState(false);
    const [historyQuote, setHistoryQuote] = useState<QuoteData | null>(null);
    const router = useRouter();
    const { fetchQuotes, deleteQuote, updateQuoteStatus } = useQuoteGenerator();

    useEffect(() => {
        const loadQuotes = async () => {
            try {
                const fetchedQuotes = await fetchQuotes();
                // Add default status and other fields if missing
                const quotesWithDefaults = fetchedQuotes.map(quote => ({
                    ...quote,
                    status: quote.status || "draft",
                    updatedAt: quote.updatedAt || quote.createdAt,
                }));
                setQuotes(quotesWithDefaults);
            } catch (error) {
                console.error("Failed to fetch quotes:", error);
            } finally {
                setLoading(false);
            }
        };

        loadQuotes();
    }, [fetchQuotes]);

    const filteredQuotes = quotes.filter((quote) => {
        const matchesSearch = 
            quote.contactInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            quote.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            quote.items.some((item) =>
                item.type.toLowerCase().includes(searchTerm.toLowerCase())
            );
        
        const matchesStatus = statusFilter === "all" || quote.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status: QuoteStatus) => {
        return <StatusBadge status={status} />;
    };


    const handleEdit = (quoteId: string) => {
        router.push(`/quote-generator?id=${quoteId}`);
    };

    const handleView = (quoteId: string) => {
        router.push(`/quote-generator?id=${quoteId}&mode=view`);
    };

    const handleViewHistory = (quote: QuoteData) => {
        setHistoryQuote(quote);
        setShowHistory(true);
    };

    const handleRestoreFromHistory = async (quote: QuoteData, historyEntry: QuoteHistoryEntry) => {
        if (confirm("Are you sure you want to restore this version? This will replace the current quote data.")) {
            try {
                // Update the quote with the restored data
                const updatedQuote = {
                    ...quote,
                    ...historyEntry.data,
                    updatedAt: new Date().toISOString(),
                };
                
                // Save the restored quote
                const { setDoc, doc } = await import("firebase/firestore");
                const { db } = await import("@/lib/firebase");
                const sanitizedQuoteName = quote.name
                    .replace(/[^a-zA-Z0-9]/g, "_")
                    .replace(/^_+|_+$/g, "")
                    .substring(0, 150);
                
                const docRef = doc(db, "quotes", sanitizedQuoteName);
                await setDoc(docRef, updatedQuote);
                
                // Update local state
                setQuotes(prev => 
                    prev.map(q => q.id === quote.id ? updatedQuote : q)
                );
                
                setShowHistory(false);
                alert("Quote restored successfully!");
            } catch (error) {
                console.error("Failed to restore quote:", error);
                alert("Failed to restore quote. Please try again.");
            }
        }
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

    const handleStatusChange = async (quoteId: string, newStatus: QuoteStatus) => {
        setUpdatingStatus(quoteId);
        try {
            // Update Firebase first
            await updateQuoteStatus(quoteId, newStatus);
            
            // Update local state after successful Firebase update
            setQuotes((prev) =>
                prev.map((quote) =>
                    quote.id === quoteId
                        ? {
                              ...quote,
                              status: newStatus,
                              updatedAt: new Date().toISOString(),
                          }
                        : quote
                )
            );
            
            console.log(`Quote ${quoteId} status changed to ${newStatus} and saved to Firebase`);
        } catch (error) {
            console.error("Failed to update quote status:", error);
            alert("Failed to update quote status. Please try again.");
        } finally {
            setUpdatingStatus(null);
        }
    };

    const handleApprove = async () => {
        if (!selectedQuote) return;
        
        try {
            await updateQuoteStatus(selectedQuote.id, "approved");
            
            // Update local state
            setQuotes((prev) =>
                prev.map((quote) =>
                    quote.id === selectedQuote.id 
                        ? { 
                            ...quote, 
                            status: "approved" as QuoteStatus,
                            approval: {
                                ...quote.approval,
                                approvedBy: "Current User",
                                approvedAt: new Date().toISOString(),
                                notes: approvalNotes,
                            },
                            updatedAt: new Date().toISOString(),
                        }
                        : quote
                )
            );
            
            setApprovalDialogOpen(false);
            setApprovalNotes("");
            setSelectedQuote(null);
        } catch (error) {
            console.error("Failed to approve quote:", error);
            alert("Failed to approve quote. Please try again.");
        }
    };

    const handleReject = async () => {
        if (!selectedQuote || !rejectionReason.trim()) return;
        
        try {
            await updateQuoteStatus(selectedQuote.id, "rejected");
            
            // Update local state
            setQuotes((prev) =>
                prev.map((quote) =>
                    quote.id === selectedQuote.id 
                        ? { 
                            ...quote, 
                            status: "rejected" as QuoteStatus,
                            approval: {
                                ...quote.approval,
                                rejectedBy: "Current User",
                                rejectedAt: new Date().toISOString(),
                                rejectionReason: rejectionReason,
                                notes: approvalNotes,
                            },
                            updatedAt: new Date().toISOString(),
                        }
                        : quote
                )
            );
            
            setApprovalDialogOpen(false);
            setRejectionReason("");
            setApprovalNotes("");
            setSelectedQuote(null);
        } catch (error) {
            console.error("Failed to reject quote:", error);
            alert("Failed to reject quote. Please try again.");
        }
    };

    const calculateTotalPrice = (quote: QuoteData) => {
        return quote.items.reduce((sum, item) => {
            return sum + calculateItemPricing(item).totalPrice;
        }, 0);
    };


    const getStatusCounts = () => {
        const counts = quotes.reduce((acc, quote) => {
            acc[quote.status] = (acc[quote.status] || 0) + 1;
            return acc;
        }, {} as Record<QuoteStatus, number>);
        
        return {
            total: quotes.length,
            draft: counts.draft || 0,
            pending_review: counts.pending_review || 0,
            approved: counts.approved || 0,
            rejected: counts.rejected || 0,
            in_production: counts.in_production || 0,
            completed: counts.completed || 0,
            cancelled: counts.cancelled || 0,
        };
    };

    const statusCounts = getStatusCounts();

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
            <div className="container mx-auto max-w-7xl">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <FileText className="h-6 w-6 text-primary" />
                        <h1 className="text-3xl font-bold">Quote Management</h1>
                    </div>
                </div>

                <div className="space-y-6">

                {/* Status Overview Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold">{statusCounts.total}</div>
                            <p className="text-xs text-muted-foreground">Total</p>
                        </CardContent>
                    </Card>
                    <Card className="border-info/20 bg-info/5">
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold text-info">{statusCounts.draft}</div>
                            <p className="text-xs text-info/80">Draft</p>
                        </CardContent>
                    </Card>
                    <Card className="border-warning/20 bg-warning/5">
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold text-warning">{statusCounts.pending_review}</div>
                            <p className="text-xs text-warning/80">Pending</p>
                        </CardContent>
                    </Card>
                    <Card className="border-success/20 bg-success/5">
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold text-success">{statusCounts.approved}</div>
                            <p className="text-xs text-success/80">Approved</p>
                        </CardContent>
                    </Card>
                    <Card className="border-destructive/20 bg-destructive/5">
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold text-destructive">{statusCounts.rejected}</div>
                            <p className="text-xs text-destructive/80">Rejected</p>
                        </CardContent>
                    </Card>
                    <Card className="border-special/20 bg-special/5">
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold text-special">{statusCounts.in_production}</div>
                            <p className="text-xs text-special/80">Production</p>
                        </CardContent>
                    </Card>
                    <Card className="border-success/20 bg-success/5">
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold text-success">{statusCounts.completed}</div>
                            <p className="text-xs text-success/80">Completed</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters and Search */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quote Management</CardTitle>
                        <CardDescription>
                            Track, manage, and approve quotes with comprehensive status monitoring
                        </CardDescription>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex items-center gap-2">
                                <Search className="h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search quotes..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="max-w-sm"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4 text-muted-foreground" />
                                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as QuoteStatus | "all")}>
                                    <SelectTrigger className="w-40">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="pending_review">Pending Review</SelectItem>
                                        <SelectItem value="approved">Approved</SelectItem>
                                        <SelectItem value="rejected">Rejected</SelectItem>
                                        <SelectItem value="in_production">In Production</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Total Price</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead>History</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredQuotes.map((quote) => {
                                    const totalPrice = calculateTotalPrice(quote);

                                    return (
                                        <TableRow key={quote.id}>
                                            <TableCell className="font-medium">
                                                <div>
                                                    <div>{quote.contactInfo.name}</div>
                                                    <div className="text-sm text-muted-foreground">{quote.name}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{totalPrice.toLocaleString()} EGP</TableCell>
                                            <TableCell>{getStatusBadge(quote.status)}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(quote.createdAt).toLocaleDateString()}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {quote.history && quote.history.length > 0 ? (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleViewHistory(quote)}
                                                        className="flex items-center gap-1"
                                                    >
                                                        <History className="h-3 w-3" />
                                                        {quote.history.length}
                                                    </Button>
                                                ) : (
                                                    <span className="text-muted-foreground text-sm">No history</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-1">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleView(quote.id)}
                                                        title="View Quote"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleEdit(quote.id)}
                                                        title="Edit Quote"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    {quote.status === "pending_review" && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => {
                                                                setSelectedQuote(quote);
                                                                setApprovalDialogOpen(true);
                                                            }}
                                                            title="Review Quote"
                                                        >
                                                            <CheckCircle className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    <Select
                                                        value={quote.status}
                                                        onValueChange={(value) => handleStatusChange(quote.id, value as QuoteStatus)}
                                                        disabled={updatingStatus === quote.id}
                                                    >
                                                        <SelectTrigger className="w-32 h-8">
                                                            <SelectValue />
                                                            {updatingStatus === quote.id && (
                                                                <div className="ml-2 h-3 w-3 animate-spin rounded-full border-2 border-border border-t-gray-600"></div>
                                                            )}
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="draft">Draft</SelectItem>
                                                            <SelectItem value="pending_review">Pending Review</SelectItem>
                                                            <SelectItem value="approved">Approved</SelectItem>
                                                            <SelectItem value="rejected">Rejected</SelectItem>
                                                            <SelectItem value="in_production">In Production</SelectItem>
                                                            <SelectItem value="completed">Completed</SelectItem>
                                                            <SelectItem value="cancelled">Cancelled</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleDelete(quote.id)}
                                                        title="Delete Quote"
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
                                    No quotes found matching your criteria
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Approval Dialog */}
                <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Review Quote</DialogTitle>
                            <DialogDescription>
                                Approve or reject the quote for {selectedQuote?.contactInfo.name}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Add any notes about this quote..."
                                    value={approvalNotes}
                                    onChange={(e) => setApprovalNotes(e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="rejection-reason">Rejection Reason (if rejecting)</Label>
                                <Textarea
                                    id="rejection-reason"
                                    placeholder="Explain why this quote is being rejected..."
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setApprovalDialogOpen(false);
                                    setRejectionReason("");
                                    setApprovalNotes("");
                                    setSelectedQuote(null);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleReject}
                                disabled={!rejectionReason.trim()}
                            >
                                <XCircle className="mr-2 h-4 w-4" />
                                Reject
                            </Button>
                            <Button onClick={handleApprove}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Approve
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Quote History Modal */}
                {showHistory && historyQuote && (
                    <Dialog open={showHistory} onOpenChange={setShowHistory}>
                        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Quote History - {historyQuote.name}</DialogTitle>
                                <DialogDescription>
                                    View and restore previous versions of this quote
                                </DialogDescription>
                            </DialogHeader>
                            
                            {historyQuote.history && historyQuote.history.length > 0 ? (
                                <div className="space-y-4">
                                    {historyQuote.history.map((entry, index) => (
                                        <Card key={entry.id} className="border-l-4 border-l-blue-500">
                                            <CardContent className="pt-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <History className="h-4 w-4 text-info" />
                                                            <span className="font-medium">
                                                                {entry.changeDescription || `Version ${historyQuote.history!.length - index}`}
                                                            </span>
                                                            <Badge 
                                                                variant={entry.changeDescription === "Auto-save" ? "secondary" : "outline"} 
                                                                className="text-xs"
                                                            >
                                                                {entry.changeDescription === "Auto-save" ? "Auto" : "Manual"}
                                                            </Badge>
                                                        </div>
                                                        <div className="text-sm text-muted-foreground mb-2">
                                                            {new Date(entry.timestamp).toLocaleString()}
                                                        </div>
                                                        <div className="text-sm">
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div>
                                                                    <span className="font-medium">Items:</span> {entry.data.items.length}
                                                                </div>
                                                                <div>
                                                                    <span className="font-medium">Customer:</span> {entry.data.contactInfo.name || "Not specified"}
                                                                </div>
                                                                <div>
                                                                    <span className="font-medium">Status:</span> {entry.data.status}
                                                                </div>
                                                                <div>
                                                                    <span className="font-medium">Total Price:</span> {calculateTotalPrice(entry.data).toLocaleString()} EGP
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleRestoreFromHistory(historyQuote, entry)}
                                                        className="ml-4"
                                                    >
                                                        <RotateCcw className="h-4 w-4 mr-2" />
                                                        Restore
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="text-lg font-medium mb-2">No History Available</h3>
                                    <p className="text-muted-foreground">
                                        This quote doesn&apos;t have any saved history yet.
                                    </p>
                                </div>
                            )}
                        </DialogContent>
                    </Dialog>
                )}
                </div>
            </div>
        </DashboardLayout>
    );
}
