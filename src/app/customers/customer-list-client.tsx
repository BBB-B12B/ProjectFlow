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

export default function CustomerListClient() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    // Search & Pagination State
    const [searchTerm, setSearchTerm] = useState('');
    const [lastVisible, setLastVisible] = useState<any>(null);
    const [hasMore, setHasMore] = useState(true);
    const [isSearching, setIsSearching] = useState(false);

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({
        name: '',
        email: '',
        phone: '',
        company: '',
        status: 'Lead',
    });
    const router = useRouter();

    const ITEMS_PER_PAGE = 12;

    // Fetch Customers Function
    const fetchCustomers = async (isNewSearch = false) => {
        try {
            setLoading(true);

            let q = query(collection(db, 'customers'));

            // Search Logic (Order by name for prefix search)
            if (searchTerm) {
                // Note: Firestore Require Exact Case for this simple prefix search
                // For advanced search, we need a 3rd party service or computed 'name_lower' field
                q = query(q,
                    orderBy('name'),
                    startAt(searchTerm),
                    endAt(searchTerm + '\uf8ff'),
                    limit(ITEMS_PER_PAGE)
                );
            } else {
                // Default View: Order by updatedAt desc
                q = query(q, orderBy('updatedAt', 'desc'), limit(ITEMS_PER_PAGE));
            }

            // Pagination Logic
            if (!isNewSearch && lastVisible && !searchTerm) {
                // For now, simple pagination only supported on default view to avoid complex query cursors with search
                // If searching, we just load the first page of matches (or implement more complex scroll later)
                q = query(q, startAfter(lastVisible));
            }

            const snapshot = await getDocs(q);
            const customerData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Customer[];

            if (isNewSearch) {
                setCustomers(customerData);
            } else {
                setCustomers(prev => [...prev, ...customerData]);
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
        const timeoutId = setTimeout(() => {
            setIsSearching(true);
            fetchCustomers(true);
        }, 500); // 500ms debounce

        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    // Fetch Projects for Stats (Keep real-time for now, or optimize later)
    useEffect(() => {
        const qProjects = query(collection(db, 'projects'));
        const unsubProjects = onSnapshot(qProjects, (snapshot) => {
            const projectData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Project[];
            setProjects(projectData);
        });

        return () => unsubProjects();
    }, []);

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
            setNewCustomer({ name: '', email: '', phone: '', company: '', status: 'Lead' });
            // Refresh list to show new item
            fetchCustomers(true);
        } catch (error) {
            console.error("Error adding customer:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getCustomerStats = (customerId: string) => {
        const customerProjects = projects.filter(p => p.customerId === customerId);
        const total = customerProjects.length;
        const completed = customerProjects.filter(p => p.status === 'เสร็จสิ้น').length;
        return { total, completed };
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
                    <DialogContent className="sm:max-w-[425px]">
                        {/* ... Dialog Content (Same as before) ... */}
                        <DialogHeader>
                            <DialogTitle>Add Customer</DialogTitle>
                            <DialogDescription>
                                Add a new customer to your CRM. Click save when you're done.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">Name</Label>
                                <Input id="name" value={newCustomer.name} onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })} className="col-span-3" placeholder="John Doe" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="company" className="text-right">Company</Label>
                                <Input id="company" value={newCustomer.company} onChange={(e) => setNewCustomer({ ...newCustomer, company: e.target.value })} className="col-span-3" placeholder="Acme Inc." />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="email" className="text-right">Email</Label>
                                <Input id="email" type="email" value={newCustomer.email} onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })} className="col-span-3" placeholder="john@example.com" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="phone" className="text-right">Phone</Label>
                                <Input id="phone" value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} className="col-span-3" placeholder="+1 234 567 890" />
                            </div>
                        </div>
                        <DialogFooter>
                            <LoadingButton onClick={handleAddCustomer} loading={isSubmitting}>Save changes</LoadingButton>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Loading Indicator for Search */}
            {isSearching && customers.length === 0 && (
                <div className="flex justify-center p-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {!isSearching && customers.length === 0 ? (
                    <div className="col-span-full h-24 flex items-center justify-center text-muted-foreground border border-dashed rounded-lg">
                        {searchTerm ? "No customers found matching your search." : "No customers found. Click \"Add Customer\" to create one."}
                    </div>
                ) : (
                    customers.map((customer) => {
                        const stats = getCustomerStats(customer.id);
                        return (
                            <div key={customer.id} className="group relative flex flex-col gap-3 rounded-lg border bg-card p-5 shadow-sm transition-all hover:shadow-md cursor-pointer" onClick={() => router.push(`/customers/${customer.id}`)}>
                                {/* Header */}
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                                            {customer.name?.substring(0, 2).toUpperCase() || "??"}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold truncate" title={customer.name}>
                                                {customer.name}
                                            </h3>
                                            {customer.company && (
                                                <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                                                    <Building className="h-3 w-3" /> {customer.company}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
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
                                <div className="flex flex-col gap-2 text-sm mt-1">
                                    {customer.email ? (
                                        <div className="flex items-center gap-2 text-muted-foreground truncate" title={customer.email}>
                                            <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                                            <span className="truncate">{customer.email}</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-muted-foreground/50">
                                            <Mail className="h-3.5 w-3.5" /> <span>No email</span>
                                        </div>
                                    )}
                                    {customer.phone ? (
                                        <div className="flex items-center gap-2 text-muted-foreground" title={customer.phone}>
                                            <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                                            <span>{customer.phone}</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-muted-foreground/50">
                                            <Phone className="h-3.5 w-3.5" /> <span>No phone</span>
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
