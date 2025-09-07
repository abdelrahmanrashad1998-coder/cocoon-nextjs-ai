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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Users, Search, Mail, Phone, MapPin, FileText, Calendar, X, Eye } from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";
import { QuoteData, ContactInfo } from "@/types/quote";
import { useQuoteGenerator } from "@/hooks/use-quote-generator";

interface ClientData {
    name: string;
    email: string;
    phone: string;
    location: string;
    notes: string;
    quoteCount: number;
    totalValue: number;
    lastQuoteDate: string;
    quotes: QuoteData[];
}

export default function ClientsPage() {
    const [clients, setClients] = useState<ClientData[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
    const { fetchQuotes } = useQuoteGenerator();

    useEffect(() => {
        const loadClients = async () => {
            try {
                const quotes = await fetchQuotes();
                const clientMap = new Map<string, ClientData>();

                quotes.forEach((quote) => {
                    const contactInfo = quote.contactInfo;
                    const clientKey = `${contactInfo.name}-${contactInfo.email}`.toLowerCase();

                    if (clientMap.has(clientKey)) {
                        const existingClient = clientMap.get(clientKey)!;
                        existingClient.quoteCount += 1;
                        existingClient.quotes.push(quote);
                        
                        // Update last quote date if this quote is more recent
                        if (new Date(quote.createdAt) > new Date(existingClient.lastQuoteDate)) {
                            existingClient.lastQuoteDate = quote.createdAt;
                        }
                    } else {
                        clientMap.set(clientKey, {
                            name: contactInfo.name,
                            email: contactInfo.email,
                            phone: contactInfo.phone,
                            location: contactInfo.location,
                            notes: contactInfo.notes,
                            quoteCount: 1,
                            totalValue: 0, // Will be calculated below
                            lastQuoteDate: quote.createdAt,
                            quotes: [quote],
                        });
                    }
                });

                // Calculate total values for each client
                const clientsArray = Array.from(clientMap.values()).map((client) => {
                    const totalValue = client.quotes.reduce((sum, quote) => {
                        return sum + quote.items.reduce((itemSum, item) => {
                            return itemSum + (item.width * item.height * item.quantity * 1200); // Using same calculation as in hook
                        }, 0);
                    }, 0);

                    return {
                        ...client,
                        totalValue,
                    };
                });

                // Sort by last quote date (most recent first)
                clientsArray.sort((a, b) => new Date(b.lastQuoteDate).getTime() - new Date(a.lastQuoteDate).getTime());

                setClients(clientsArray);
            } catch (error) {
                console.error("Failed to fetch clients:", error);
            } finally {
                setLoading(false);
            }
        };

        loadClients();
    }, [fetchQuotes]);

    const filteredClients = clients.filter(
        (client) =>
            client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.location.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-EG', {
            style: 'currency',
            currency: 'EGP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading clients...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="container mx-auto max-w-7xl">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Users className="h-6 w-6 text-primary" />
                        <h1 className="text-3xl font-bold">Client Management</h1>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">{clients.length}</div>
                        <div className="text-sm text-gray-600">Total Clients</div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Search */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Search className="h-5 w-5" />
                                Search Clients
                            </CardTitle>
                            <CardDescription>
                                Find clients by name, email, or location
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                    placeholder="Search clients..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Clients Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Client Directory</CardTitle>
                            <CardDescription>
                                {filteredClients.length} of {clients.length} clients
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {filteredClients.length === 0 ? (
                                <div className="text-center py-12">
                                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        {searchTerm ? "No clients found" : "No clients yet"}
                                    </h3>
                                    <p className="text-gray-600">
                                        {searchTerm 
                                            ? "Try adjusting your search criteria"
                                            : "Clients will appear here once you create quotes with contact information"
                                        }
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Client Information</TableHead>
                                                <TableHead>Contact Details</TableHead>
                                                <TableHead>Quote Statistics</TableHead>
                                                <TableHead>Total Value</TableHead>
                                                <TableHead>Last Quote</TableHead>
                                                <TableHead>Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredClients.map((client, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>
                                                        <div className="space-y-1">
                                                            <div className="font-semibold text-gray-900">
                                                                {client.name || "Unnamed Client"}
                                                            </div>
                                                            {client.location && (
                                                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                                                    <MapPin className="h-3 w-3" />
                                                                    {client.location}
                                                                </div>
                                                            )}
                                                            {client.notes && (
                                                                <div className="text-xs text-gray-500 max-w-xs truncate">
                                                                    {client.notes}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="space-y-1">
                                                            {client.email && (
                                                                <div className="flex items-center gap-1 text-sm">
                                                                    <Mail className="h-3 w-3 text-gray-400" />
                                                                    <span className="text-gray-600">{client.email}</span>
                                                                </div>
                                                            )}
                                                            {client.phone && (
                                                                <div className="flex items-center gap-1 text-sm">
                                                                    <Phone className="h-3 w-3 text-gray-400" />
                                                                    <span className="text-gray-600">{client.phone}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="space-y-1">
                                                            <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                                                                <FileText className="h-3 w-3" />
                                                                {client.quoteCount} Quote{client.quoteCount !== 1 ? 's' : ''}
                                                            </Badge>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-semibold text-green-600">
                                                            {formatCurrency(client.totalValue)}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1 text-sm text-gray-600">
                                                            <Calendar className="h-3 w-3" />
                                                            {formatDate(client.lastQuoteDate)}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex gap-2">
                                                            <Dialog>
                                                                <DialogTrigger asChild>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => setSelectedClient(client)}
                                                                    >
                                                                        <Eye className="mr-2 h-4 w-4" />
                                                                        View Details
                                                                    </Button>
                                                                </DialogTrigger>
                                                                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                                                    <DialogHeader>
                                                                        <DialogTitle className="flex items-center gap-2">
                                                                            <Users className="h-5 w-5" />
                                                                            Client Details
                                                                        </DialogTitle>
                                                                        <DialogDescription>
                                                                            Complete information and quote history for {client.name || "Unnamed Client"}
                                                                        </DialogDescription>
                                                                    </DialogHeader>
                                                                    
                                                                    <div className="space-y-6">
                                                                        {/* Client Information Card */}
                                                                        <Card>
                                                                            <CardHeader>
                                                                                <CardTitle className="flex items-center gap-2">
                                                                                    <Users className="h-5 w-5" />
                                                                                    Client Information
                                                                                </CardTitle>
                                                                            </CardHeader>
                                                                            <CardContent className="space-y-4">
                                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                                    <div>
                                                                                        <label className="text-sm font-medium text-gray-600">Name</label>
                                                                                        <p className="text-lg font-semibold">{client.name || "Not provided"}</p>
                                                                                    </div>
                                                                                    <div>
                                                                                        <label className="text-sm font-medium text-gray-600">Location</label>
                                                                                        <p className="text-lg">{client.location || "Not provided"}</p>
                                                                                    </div>
                                                                                    <div>
                                                                                        <label className="text-sm font-medium text-gray-600">Email</label>
                                                                                        <p className="text-lg flex items-center gap-2">
                                                                                            <Mail className="h-4 w-4 text-gray-400" />
                                                                                            {client.email || "Not provided"}
                                                                                        </p>
                                                                                    </div>
                                                                                    <div>
                                                                                        <label className="text-sm font-medium text-gray-600">Phone</label>
                                                                                        <p className="text-lg flex items-center gap-2">
                                                                                            <Phone className="h-4 w-4 text-gray-400" />
                                                                                            {client.phone || "Not provided"}
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                                {client.notes && (
                                                                                    <div>
                                                                                        <label className="text-sm font-medium text-gray-600">Notes</label>
                                                                                        <p className="text-lg bg-gray-50 p-3 rounded-md">{client.notes}</p>
                                                                                    </div>
                                                                                )}
                                                                            </CardContent>
                                                                        </Card>

                                                                        {/* Quote Statistics Card */}
                                                                        <Card>
                                                                            <CardHeader>
                                                                                <CardTitle className="flex items-center gap-2">
                                                                                    <FileText className="h-5 w-5" />
                                                                                    Quote Statistics
                                                                                </CardTitle>
                                                                            </CardHeader>
                                                                            <CardContent>
                                                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                                                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                                                                                        <div className="text-2xl font-bold text-blue-600">{client.quoteCount}</div>
                                                                                        <div className="text-sm text-gray-600">Total Quotes</div>
                                                                                    </div>
                                                                                    <div className="text-center p-4 bg-green-50 rounded-lg">
                                                                                        <div className="text-2xl font-bold text-green-600">{formatCurrency(client.totalValue)}</div>
                                                                                        <div className="text-sm text-gray-600">Total Value</div>
                                                                                    </div>
                                                                                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                                                                                        <div className="text-2xl font-bold text-purple-600">{formatDate(client.lastQuoteDate)}</div>
                                                                                        <div className="text-sm text-gray-600">Last Quote</div>
                                                                                    </div>
                                                                                </div>
                                                                            </CardContent>
                                                                        </Card>

                                                                        {/* Quote History Card */}
                                                                        <Card>
                                                                            <CardHeader>
                                                                                <CardTitle className="flex items-center gap-2">
                                                                                    <Calendar className="h-5 w-5" />
                                                                                    Quote History
                                                                                </CardTitle>
                                                                                <CardDescription>
                                                                                    All quotes created for this client
                                                                                </CardDescription>
                                                                            </CardHeader>
                                                                            <CardContent>
                                                                                <div className="space-y-3">
                                                                                    {client.quotes.map((quote, index) => (
                                                                                        <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                                                                            <div className="flex items-center justify-between mb-2">
                                                                                                <div>
                                                                                                    <h4 className="font-semibold text-lg">{quote.name}</h4>
                                                                                                    <p className="text-sm text-gray-600">ID: {quote.id}</p>
                                                                                                </div>
                                                                                                <div className="text-right">
                                                                                                    <div className="text-lg font-bold text-green-600">
                                                                                                        {formatCurrency(quote.items.reduce((sum, item) => 
                                                                                                            sum + (item.width * item.height * item.quantity * 1200), 0
                                                                                                        ))}
                                                                                                    </div>
                                                                                                    <div className="text-sm text-gray-600">
                                                                                                        {formatDate(quote.createdAt)}
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                                                                                <div>
                                                                                                    <span className="font-medium">Items:</span> {quote.items.length}
                                                                                                </div>
                                                                                                <div>
                                                                                                    <span className="font-medium">Area:</span> {quote.items.reduce((sum, item) => 
                                                                                                        sum + (item.width * item.height * item.quantity), 0
                                                                                                    ).toFixed(2)} m²
                                                                                                </div>
                                                                                                <div>
                                                                                                    <span className="font-medium">Duration:</span> {quote.settings.projectDuration} days
                                                                                                </div>
                                                                                                <div>
                                                                                                    <span className="font-medium">Discount:</span> {quote.settings.discountPercentage}%
                                                                                                </div>
                                                                                            </div>
                                                                                            {quote.settings.customNotes && (
                                                                                                <div className="mt-2 p-2 bg-yellow-50 rounded text-sm">
                                                                                                    <span className="font-medium">Notes:</span> {quote.settings.customNotes}
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </CardContent>
                                                                        </Card>
                                                                    </div>
                                                                </DialogContent>
                                                            </Dialog>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-gray-600">
                                    Total Clients
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-gray-900">{clients.length}</div>
                                <p className="text-xs text-gray-600">Unique clients with quotes</p>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-gray-600">
                                    Total Quotes
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-gray-900">
                                    {clients.reduce((sum, client) => sum + client.quoteCount, 0)}
                                </div>
                                <p className="text-xs text-gray-600">Across all clients</p>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-gray-600">
                                    Total Value
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">
                                    {formatCurrency(clients.reduce((sum, client) => sum + client.totalValue, 0))}
                                </div>
                                <p className="text-xs text-gray-600">Combined quote value</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
