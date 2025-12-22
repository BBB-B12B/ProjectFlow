'use client';

import { useState, useEffect, use } from 'react';
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Customer, CustomerRating, Project, CustomerActivityLog } from '@/lib/types';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mail, Phone, Building, MapPin, Calendar, Activity, Star, ChevronLeft, Pencil } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';

interface CustomerDetailClientProps {
    params: Promise<{ id: string }>;
}

export default function CustomerDetailClient({ params }: CustomerDetailClientProps) {
    const { id } = use(params);
    const router = useRouter();
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [ratings, setRatings] = useState<CustomerRating[]>([]);
    const [loading, setLoading] = useState(true);

    // Rating State
    const [isRateOpen, setIsRateOpen] = useState(false);
    const [isSubmittingRating, setIsSubmittingRating] = useState(false);
    const [newRating, setNewRating] = useState({
        payer: 5,
        visioner: 5,
        harder: 5,
        niceGuy: 5,
    });

    // Edit State
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
    const [editForm, setEditForm] = useState<Partial<Customer>>({});

    useEffect(() => {
        if (!id) return;

        const fetchCustomerData = async () => {
            // 1. Fetch Customer Details
            const customerUnsub = onSnapshot(doc(db, 'customers', id), (docSnap) => {
                if (docSnap.exists()) {
                    const data = { id: docSnap.id, ...docSnap.data() } as Customer;
                    setCustomer(data);
                    setEditForm(data); // Initialize edit form
                } else {
                    toast({
                        title: "Error",
                        description: "Customer not found",
                        variant: "destructive",
                    });
                }
            }, (error) => {
                console.error("Error fetching customer:", error);
                toast({
                    title: "Access Denied",
                    description: "Could not fetch customer details. Check permissions.",
                    variant: "destructive",
                });
            });

            // 2. Fetch Related Projects
            const qProjects = query(collection(db, 'projects'), where('customerId', '==', id));
            const projectsUnsub = onSnapshot(qProjects, (snapshot) => {
                setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project)));
            }, (error) => {
                console.error("Error fetching projects:", error);
            });

            // 3. Fetch Ratings
            const qRatings = query(collection(db, 'customer_ratings'), where('customerId', '==', id));
            const ratingsUnsub = onSnapshot(qRatings, (snapshot) => {
                setRatings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CustomerRating)));
            }, (error) => {
                console.error("Error fetching ratings:", error);
                // Do not block UI if ratings fail (might be a new collection issue)
            });

            setLoading(false);

            return () => {
                customerUnsub();
                projectsUnsub();
                ratingsUnsub();
            };
        };

        fetchCustomerData();
    }, [id]);

    const handleUpdateCustomer = async () => {
        if (!customer?.id) return;
        setIsSubmittingEdit(true);
        try {
            await updateDoc(doc(db, 'customers', customer.id), {
                ...editForm,
                updatedAt: new Date().toISOString()
            });
            setIsEditOpen(false);
            toast({
                title: "Success",
                description: "Customer profile updated.",
            });
        } catch (error) {
            console.error("Error updating customer:", error);
            toast({
                title: "Error",
                description: "Failed to update profile. Check permissions.",
                variant: "destructive",
            });
        } finally {
            setIsSubmittingEdit(false);
        }
    };

    const handleSaveRating = async () => {
        setIsSubmittingRating(true);
        try {
            console.log("Attempting to add rating to customer_ratings...");
            await addDoc(collection(db, 'customer_ratings'), {
                customerId: id,
                raterId: 'user-123', // TODO: Get actual user ID
                ...newRating,
                updatedAt: new Date().toISOString(),
            });
            console.log("Rating added successfully.");
            setIsRateOpen(false);

            // Recalculate Health Score
            const allRatings = [...ratings, { ...newRating, id: 'temp', customerId: id, raterId: 'me', updatedAt: '' }];
            const avgPayer = allRatings.reduce((sum, r) => sum + r.payer, 0) / allRatings.length;
            const avgVisioner = allRatings.reduce((sum, r) => sum + r.visioner, 0) / allRatings.length;
            const avgNiceGuy = allRatings.reduce((sum, r) => sum + r.niceGuy, 0) / allRatings.length;
            const avgHarder = allRatings.reduce((sum, r) => sum + r.harder, 0) / allRatings.length;

            const healthScore = ((avgPayer + avgVisioner + avgNiceGuy + (10 - avgHarder)) / 40) * 100;

            console.log("Attempting to update customer health score...");
            await updateDoc(doc(db, 'customers', id), {
                healthScore: Math.round(healthScore),
            });
            console.log("Customer health score updated successfully.");

            toast({
                title: "Rated!",
                description: "Customer health score updated.",
            });

        } catch (error) {
            console.error("Error saving rating:", error);
            toast({
                title: "Error",
                description: "Failed to save rating or update health score. Check permissions.",
                variant: "destructive",
            });
        } finally {
            setIsSubmittingRating(false);
        }
    };

    if (loading || !customer) {
        return (
            <div className="flex flex-col items-center justify-center p-10 gap-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-muted-foreground">Loading customer details...</p>
                <Button variant="outline" onClick={() => router.back()}>
                    <ChevronLeft className="mr-2 h-4 w-4" /> Go Back
                </Button>
            </div>
        );
    }

    // Prepare Radar Chart Data
    const chartData = [
        { subject: 'Payer', A: ratings.length > 0 ? ratings.reduce((sum, r) => sum + r.payer, 0) / ratings.length : 0, fullMark: 10 },
        { subject: 'Visioner', A: ratings.length > 0 ? ratings.reduce((sum, r) => sum + r.visioner, 0) / ratings.length : 0, fullMark: 10 },
        { subject: 'Nice Guy', A: ratings.length > 0 ? ratings.reduce((sum, r) => sum + r.niceGuy, 0) / ratings.length : 0, fullMark: 10 },
        { subject: 'Harder', A: ratings.length > 0 ? ratings.reduce((sum, r) => sum + r.harder, 0) / ratings.length : 0, fullMark: 10 },
    ];

    return (
        <div className="flex flex-col gap-6">
            {/* Navigation */}
            <div>
                <Button variant="ghost" className="pl-0 hover:pl-2 transition-all" onClick={() => router.back()}>
                    <ChevronLeft className="mr-2 h-4 w-4" /> Back to Customers
                </Button>
            </div>

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight">{customer.name}</h1>
                        <Badge variant={
                            (customer.healthScore || 0) > 70 ? 'default' :
                                (customer.healthScore || 0) > 40 ? 'secondary' : 'destructive'
                        } className={`text-lg px-3 py-1 ${(customer.healthScore || 0) > 70 ? 'bg-green-500 hover:bg-green-600' : ''}`}>
                            Health: {customer.healthScore ? `${customer.healthScore}%` : 'N/A'}
                        </Badge>
                    </div>
                    <p className="text-muted-foreground flex items-center gap-2 mt-2">
                        <Building className="h-4 w-4" /> {customer.company || 'No Company'}
                        <span className="mx-2">•</span>
                        Status: <span className="font-medium text-foreground">{customer.status}</span>
                    </p>
                </div>
                <div className="flex gap-3">
                    <Dialog open={isRateOpen} onOpenChange={setIsRateOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <Star className="mr-2 h-4 w-4" /> Rate Customer
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Rate Customer Relationship</DialogTitle>
                                <DialogDescription>
                                    Rate based on your recent interactions. 0 = Lowest, 10 = Highest.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-6 py-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label>Payer (Payment Quality)</Label>
                                        <span className="text-sm text-muted-foreground">{newRating.payer}/10</span>
                                    </div>
                                    <Slider value={[newRating.payer]} max={10} step={1} onValueChange={(val) => setNewRating({ ...newRating, payer: val[0] })} />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label>Visioner (Potential Growth)</Label>
                                        <span className="text-sm text-muted-foreground">{newRating.visioner}/10</span>
                                    </div>
                                    <Slider value={[newRating.visioner]} max={10} step={1} onValueChange={(val) => setNewRating({ ...newRating, visioner: val[0] })} />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label>Nice Guy (Communication)</Label>
                                        <span className="text-sm text-muted-foreground">{newRating.niceGuy}/10</span>
                                    </div>
                                    <Slider value={[newRating.niceGuy]} max={10} step={1} onValueChange={(val) => setNewRating({ ...newRating, niceGuy: val[0] })} />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label className="text-red-500">Harder (Difficulty)</Label>
                                        <span className="text-sm text-muted-foreground">{newRating.harder}/10</span>
                                    </div>
                                    <Slider value={[newRating.harder]} max={10} step={1} onValueChange={(val) => setNewRating({ ...newRating, harder: val[0] })} />
                                    <p className="text-xs text-muted-foreground">The higher this score, the lower the total health.</p>
                                </div>
                            </div>
                            <DialogFooter>
                                <LoadingButton onClick={handleSaveRating} loading={isSubmittingRating}>
                                    Submit Rating
                                </LoadingButton>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Pencil className="mr-2 h-4 w-4" /> Edit Profile
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Edit Customer Profile</DialogTitle>
                                <DialogDescription>
                                    Update customer details below.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-name" className="text-right">Name</Label>
                                    <Input id="edit-name" value={editForm.name || ''} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="col-span-3" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-company" className="text-right">Company</Label>
                                    <Input id="edit-company" value={editForm.company || ''} onChange={(e) => setEditForm({ ...editForm, company: e.target.value })} className="col-span-3" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-email" className="text-right">Email</Label>
                                    <Input id="edit-email" type="email" value={editForm.email || ''} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="col-span-3" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-phone" className="text-right">Phone</Label>
                                    <Input id="edit-phone" value={editForm.phone || ''} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="col-span-3" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-status" className="text-right">Status</Label>
                                    <div className="col-span-3">
                                        {/* Simple Select using default select for now or reuse Shadcn Select if imported */}
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            value={editForm.status || 'Lead'}
                                            onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                                        >
                                            <option value="Lead">Lead</option>
                                            <option value="Active">Active</option>
                                            <option value="Churn">Churn</option>
                                            <option value="Inactive">Inactive</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <LoadingButton onClick={handleUpdateCustomer} loading={isSubmittingEdit}>
                                    Save Changes
                                </LoadingButton>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column: Stats & Radar */}
                <div className="md:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Relationship Health</CardTitle>
                            <CardDescription>Based on {ratings.length} ratings</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                                    <PolarGrid />
                                    <PolarAngleAxis dataKey="subject" />
                                    <PolarRadiusAxis angle={30} domain={[0, 10]} />
                                    <Radar
                                        name="Rating"
                                        dataKey="A"
                                        stroke="#8884d8"
                                        fill="#8884d8"
                                        fillOpacity={0.6}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Contact Info</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <a href={`mailto:${customer.email}`} className="hover:underline text-sm">{customer.email || 'N/A'}</a>
                            </div>
                            <div className="flex items-center gap-3">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{customer.phone || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{customer.address || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">Last Contact: {customer.lastContactDate ? new Date(customer.lastContactDate).toLocaleDateString() : 'Never'}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Projects & Activity */}
                <div className="md:col-span-2">
                    <Tabs defaultValue="projects" className="w-full">
                        <TabsList>
                            <TabsTrigger value="projects">Projects ({projects.length})</TabsTrigger>
                            <TabsTrigger value="activity">Activity Timeline</TabsTrigger>
                            <TabsTrigger value="notes">Notes</TabsTrigger>
                        </TabsList>
                        <TabsContent value="projects" className="space-y-4">
                            {projects.length === 0 ? (
                                <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg">
                                    <p className="text-muted-foreground">No projects linking to this customer yet.</p>
                                </div>
                            ) : (
                                projects.map(project => (
                                    <Card key={project.id}>
                                        <CardHeader className="pb-3">
                                            <div className="flex justify-between">
                                                <CardTitle className="text-lg">
                                                    <Link href={`/project/${project.id}`} className="hover:underline">{project.name}</Link>
                                                </CardTitle>
                                                <Badge variant="outline">{project.status}</Badge>
                                            </div>
                                            <CardDescription>{project.description}</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span>Progress</span>
                                                <span>{project.totalTasks > 0 ? Math.round((project.completedTasks / project.totalTasks) * 100) : 0}%</span>
                                            </div>
                                            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary transition-all"
                                                    style={{ width: `${project.totalTasks > 0 ? (project.completedTasks / project.totalTasks) * 100 : 0}%` }}
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </TabsContent>
                        <TabsContent value="activity">
                            <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg">
                                <Activity className="h-8 w-8 text-muted-foreground mb-2" />
                                <p className="text-muted-foreground">Activity Log integration coming soon via Calendar & Tasks.</p>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
