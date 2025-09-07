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
    DialogTrigger,
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
    User,
    Calendar
} from "lucide-react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import { QuoteData, QuoteStatus } from "@/types/quote";
import { useQuoteGenerator } from "@/hooks/use-quote-generator";

export default function QuotesPage() {
    const [quotes, setQuotes] = useState<QuoteData[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<QuoteStatus | "all">("all");
    const [priorityFilter, setPriorityFilter] = useState<"all" | "low" | "medium" | "high">("all");
    const [loading, setLoading] = useState(true);
    const [selectedQuote, setSelectedQuote] = useState<QuoteData | null>(null);
    const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [approvalNotes, setApprovalNotes] = useState("");
    const router = useRouter();
    const { fetchQuotes, deleteQuote } = useQuoteGenerator();

    useEffect(() => {
        const loadQuotes = async () => {
            try {
                const fetchedQuotes = await fetchQuotes();
                // Add default status and other fields if missing
                const quotesWithDefaults = fetchedQuotes.map(quote => ({
                    ...quote,
                    status: quote.status || "draft",
                    priority: quote.priority || "medium",
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
        const matchesPriority = priorityFilter === "all" || quote.priority === priorityFilter;
        
        return matchesSearch && matchesStatus && matchesPriority;
    });

    const getStatusBadge = (status: QuoteStatus) => {
        const statusConfig = {
            draft: { variant: "secondary" as const, text: "Draft", icon: FileText },
            pending_review: { variant: "outline" as const, text: "Pending Review", icon: Clock },
            approved: { variant: "default" as const, text: "Approved", icon: CheckCircle },
            rejected: { variant: "destructive" as const, text: "Rejected", icon: XCircle },
            in_production: { variant: "default" as const, text: "In Production", icon: AlertCircle },
            completed: { variant: "default" as const, text: "Completed", icon: CheckCircle },
            cancelled: { variant: "secondary" as const, text: "Cancelled", icon: XCircle },
        };

        const config = statusConfig[status] || statusConfig.draft;
        const IconComponent = config.icon;
        
        return (
            <Badge variant={config.variant} className="flex items-center gap-1">
                <IconComponent className="h-3 w-3" />
                {config.text}
            </Badge>
        );
    };

    const getPriorityBadge = (priority: "low" | "medium" | "high") => {
        const priorityConfig = {
            low: { variant: "secondary" as const, text: "Low" },
            medium: { variant: "outline" as const, text: "Medium" },
            high: { variant: "destructive" as const, text: "High" },
        };

        const config = priorityConfig[priority] || priorityConfig.medium;
        return <Badge variant={config.variant}>{config.text}</Badge>;
    };

    const handleEdit = (quoteId: string) => {
        router.push(`/quote-generator?id=${quoteId}`);
    };

    const handleView = (quoteId: string) => {
        router.push(`/quote-generator?id=${quoteId}&mode=view`);
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
        try {
            // Update local state immediately for better UX
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

            // Here you would typically make an API call to update the quote status
            // await updateQuoteStatus(quoteId, newStatus);
            
            console.log(`Quote ${quoteId} status changed to ${newStatus}`);
        } catch (error) {
            console.error("Failed to update quote status:", error);
            alert("Failed to update quote status. Please try again.");
        }
    };

    const handleApprove = async () => {
        if (!selectedQuote) return;
        
        try {
            const updatedQuote = {
                ...selectedQuote,
                status: "approved" as QuoteStatus,
                approval: {
                    ...selectedQuote.approval,
                    approvedBy: "Current User", // Replace with actual user
                    approvedAt: new Date().toISOString(),
                    notes: approvalNotes,
                },
                updatedAt: new Date().toISOString(),
            };

            setQuotes((prev) =>
                prev.map((quote) =>
                    quote.id === selectedQuote.id ? updatedQuote : quote
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
            const updatedQuote = {
                ...selectedQuote,
                status: "rejected" as QuoteStatus,
                approval: {
                    ...selectedQuote.approval,
                    rejectedBy: "Current User", // Replace with actual user
                    rejectedAt: new Date().toISOString(),
                    rejectionReason: rejectionReason,
                    notes: approvalNotes,
                },
                updatedAt: new Date().toISOString(),
            };

            setQuotes((prev) =>
                prev.map((quote) =>
                    quote.id === selectedQuote.id ? updatedQuote : quote
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
            const area = item.width * item.height * item.quantity;
            return sum + area * 1200; // Mock calculation - replace with actual pricing
        }, 0);
    };

    const getProjectType = (quote: QuoteData) => {
        if (quote.items.length === 1) {
            return quote.items[0].type.replace('_', ' ').toUpperCase();
        }
        return `${quote.items.length} Items`;
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
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold text-blue-600">{statusCounts.draft}</div>
                            <p className="text-xs text-muted-foreground">Draft</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold text-yellow-600">{statusCounts.pending_review}</div>
                            <p className="text-xs text-muted-foreground">Pending</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold text-green-600">{statusCounts.approved}</div>
                            <p className="text-xs text-muted-foreground">Approved</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold text-red-600">{statusCounts.rejected}</div>
                            <p className="text-xs text-muted-foreground">Rejected</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold text-orange-600">{statusCounts.in_production}</div>
                            <p className="text-xs text-muted-foreground">Production</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-2xl font-bold text-purple-600">{statusCounts.completed}</div>
                            <p className="text-xs text-muted-foreground">Completed</p>
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
                                <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as "all" | "low" | "medium" | "high")}>
                                    <SelectTrigger className="w-32">
                                        <SelectValue placeholder="Priority" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Priority</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="low">Low</SelectItem>
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
                                    <TableHead>Project Type</TableHead>
                                    <TableHead>Total Price</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Priority</TableHead>
                                    <TableHead>Assigned To</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredQuotes.map((quote) => {
                                    const totalPrice = calculateTotalPrice(quote);
                                    const projectType = getProjectType(quote);

                                    return (
                                        <TableRow key={quote.id}>
                                            <TableCell className="font-medium">
                                                <div>
                                                    <div>{quote.contactInfo.name}</div>
                                                    <div className="text-sm text-muted-foreground">{quote.name}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{projectType}</TableCell>
                                            <TableCell>${totalPrice.toLocaleString()}</TableCell>
                                            <TableCell>{getStatusBadge(quote.status)}</TableCell>
                                            <TableCell>{getPriorityBadge(quote.priority || "medium")}</TableCell>
                                            <TableCell>
                                                {quote.assignedTo ? (
                                                    <div className="flex items-center gap-1">
                                                        <User className="h-3 w-3" />
                                                        {quote.assignedTo}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">Unassigned</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(quote.createdAt).toLocaleDateString()}
                                                </div>
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
                                                    >
                                                        <SelectTrigger className="w-32 h-8">
                                                            <SelectValue />
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
                </div>
            </div>
        </DashboardLayout>
    );
}
