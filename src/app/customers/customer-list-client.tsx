'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, getDocs, limit, startAfter, startAt, endAt } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Customer, Project } from '@/lib/types';
import { Plus, Search, MoreHorizontal, Phone, Mail, Building, Briefcase, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Switch } from '@/components/ui/switch';
import { useTheme } from 'next-themes';
import { AddCustomerDialog } from '@/components/add-customer-dialog';
import { useDataCache } from '@/context/data-cache-context';

export default function CustomerListClient() {
    const { customers: cachedCustomers, refreshCustomers: refreshCache, isCustomersLoaded } = useDataCache();
    const [searchResults, setSearchResults] = useState<Customer[]>([]);

    // Derived state: What to show?
    const [searchTerm, setSearchTerm] = useState('');
    const customers = searchTerm ? searchResults : cachedCustomers;

    const [loading, setLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);

    // Pagination for Search Results (Optional/Simplified)
    const [lastVisible, setLastVisible] = useState<any>(null);
    const [hasMore, setHasMore] = useState(true);

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({
        name: '',
        email: '',
        phone: '',
        company: '',
        status: 'Lead',
        isDarkModeOnly: false,
    });
    const router = useRouter();
    const { theme } = useTheme();

    const ITEMS_PER_PAGE = 50;

    // Fetch Customers Function (Used for SEARCH primarily now)
    const fetchCustomers = async (isNewSearch = false) => {
        try {
            if (!searchTerm) {
                // If clearing search, ensure cache is loaded
                if (!isCustomersLoaded) {
                    setLoading(true);
                    await refreshCache();
                    setLoading(false);
                }
                setIsSearching(false);
                return;
            }

            setLoading(true);
            let q = query(collection(db, 'customers'));

            // Search Logic
            q = query(q,
                orderBy('name'),
                startAt(searchTerm),
                endAt(searchTerm + '\uf8ff'),
                limit(ITEMS_PER_PAGE)
            );

            const snapshot = await getDocs(q);
            const customerData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Customer[];

            if (isNewSearch) {
                setSearchResults(customerData);
            } else {
                setSearchResults(prev => [...prev, ...customerData]);
            }

            setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
            setHasMore(snapshot.docs.length === ITEMS_PER_PAGE);

        } catch (error) {
            console.error("Error fetching customers:", error);
        } finally {
            setLoading(false);
            setIsSearching(false);
        }
    };

    // Initial Load & Search Effect
    useEffect(() => {
        if (!searchTerm) {
            setIsSearching(false);
            if (!isCustomersLoaded) {
                setLoading(true);
                refreshCache().finally(() => setLoading(false));
            }
            return;
        }

        const timeoutId = setTimeout(() => {
            setIsSearching(true);
            fetchCustomers(true);
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchTerm, isCustomersLoaded, refreshCache]);

    const handleAddCustomer = async () => {
        if (!newCustomer.name) return;
        setIsSubmitting(true);
        try {
            const docRef = await addDoc(collection(db, 'customers'), {
                ...newCustomer,
                tags: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });
            setIsAddOpen(false);
            setNewCustomer({ name: '', email: '', phone: '', company: '', status: 'Lead', isDarkModeOnly: false });

            // Refresh Global Cache
            await refreshCache();
            setSearchTerm(''); // Clear search to show new item
        } catch (error) {
            console.error("Error adding customer:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getCustomerStats = (customer: Customer) => {
        return {
            total: customer.totalProjects !== undefined ? customer.totalProjects : '-',
            completed: customer.completedProjects !== undefined ? customer.completedProjects : '-'
        };
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="relative w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search customers (Case Sensitive)..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Add Customer
                        </Button>
                    </DialogTrigger>
                </Dialog>
                <AddCustomerDialog
                    isOpen={isAddOpen}
                    onOpenChange={setIsAddOpen}
                    onSuccess={() => fetchCustomers(true)}
                />
            </div>

            {/* Loading Indicator for Search */}
            {isSearching && customers.length === 0 && (
                <div className="flex justify-center p-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {!isSearching && customers.length === 0 ? (
                    <div className="col-span-full h-24 flex items-center justify-center text-muted-foreground border border-dashed rounded-lg">
                        {searchTerm ? "No customers found matching your search." : "No customers found. Click \"Add Customer\" to create one."}
                    </div>
                ) : (
                    customers.filter(customer => {
                        if (theme === 'dark') {
                            return customer.isDarkModeOnly;
                        } else {
                            return !customer.isDarkModeOnly;
                        }
                    }).map((customer) => {
                        const stats = getCustomerStats(customer);
                        return (
                            <div key={customer.id} className="group relative flex flex-col gap-2 rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md cursor-pointer" onClick={() => router.push(`/customers/${customer.id}`)}>
                                {/* Header */}
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                                            {customer.name?.substring(0, 2).toUpperCase() || "??"}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-sm truncate" title={customer.name}>
                                                {customer.name}
                                            </h3>
                                            {customer.company && (
                                                <p className="text-[11px] text-muted-foreground flex items-center gap-1 truncate">
                                                    <Building className="h-3 w-3" /> {customer.company}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => router.push(`/customers/${customer.id}`)}>View Details</DropdownMenuItem>
                                            <DropdownMenuItem>Edit</DropdownMenuItem>
                                            <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                {/* Body */}
                                <div className="flex flex-col gap-1 text-xs mt-1">
                                    {customer.email ? (
                                        <div className="flex items-center gap-2 text-muted-foreground truncate" title={customer.email}>
                                            <Mail className="h-3 w-3 flex-shrink-0" />
                                            <span className="truncate">{customer.email}</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-muted-foreground/50">
                                            <Mail className="h-3 w-3" /> <span>No email</span>
                                        </div>
                                    )}
                                    {customer.phone ? (
                                        <div className="flex items-center gap-2 text-muted-foreground" title={customer.phone}>
                                            <Phone className="h-3 w-3 flex-shrink-0" />
                                            <span>{customer.phone}</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-muted-foreground/50">
                                            <Phone className="h-3 w-3" /> <span>No phone</span>
                                        </div>
                                    )}
                                </div>

                                {/* Project Stats */}
                                <div className="flex items-center justify-between py-2 border-t border-b bg-muted/20 -mx-5 px-5 my-1">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Briefcase className="h-3.5 w-3.5" />
                                        <span>Projects: <span className="font-medium text-foreground">{stats.completed}/{stats.total}</span></span>
                                    </div>
                                    {customer.healthScore !== undefined ? (
                                        <div className="flex items-center gap-1">
                                            <Trophy className={`h-3.5 w-3.5 ${(customer.healthScore || 0) > 70 ? 'text-green-600' :
                                                (customer.healthScore || 0) > 40 ? 'text-yellow-600' : 'text-red-600'
                                                }`} />
                                            <span className={`text-xs font-bold ${(customer.healthScore || 0) > 70 ? 'text-green-700' :
                                                (customer.healthScore || 0) > 40 ? 'text-yellow-700' : 'text-red-700'
                                                }`}>
                                                {customer.healthScore}%
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-[10px] text-muted-foreground">No Rating</span>
                                    )}
                                </div>

                                {/* Footer Tags */}
                                <div className="mt-auto flex items-center justify-between">
                                    <Badge variant={
                                        customer.status === 'Active' ? 'default' :
                                            customer.status === 'Lead' ? 'secondary' :
                                                customer.status === 'Churn' ? 'destructive' : 'outline'
                                    } className="capitalize text-[10px] px-2 h-5">
                                        {customer.status || 'Unknown'}
                                    </Badge>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Load More Button */}
            {hasMore && !searchTerm && customers.length > 0 && (
                <div className="flex justify-center mt-6">
                    <Button variant="outline" onClick={() => fetchCustomers(false)} disabled={loading}>
                        {loading ? "Loading..." : "Load More Customers"}
                    </Button>
                </div>
            )}
        </div>
    );
}
