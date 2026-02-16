'use client';

import { useState, useEffect, use } from 'react';
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, onSnapshot, orderBy, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Customer, CustomerRating, Project, CustomerActivityLog } from '@/lib/types';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CustomerFormDialog } from '@/components/customer-form-dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mail, Phone, Building, MapPin, Calendar, Activity, Star, ChevronLeft, Pencil, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';

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
    // isSubmittingEdit is managed by CustomerFormDialog internal state (mostly), but we can't see it from outside easily? 
    // Actually the dialog prop `onSubmit` is async so dialog handles the loading state. 
    // But we might want to manually close logic.
    // The previous logic used `isSubmittingEdit` for the button loading state.
    // CustomerFormDialog has its own loading state.
    // We don't need `editForm` anymore.


    // When the rate dialog opens, pre-fill with the latest rating if available
    useEffect(() => {
        if (isRateOpen && ratings.length > 0) {
            // Get the latest rating (assuming the array is chronological or we just take the last one)
            const latestRating = ratings[ratings.length - 1];
            setNewRating({
                payer: latestRating.payer,
                visioner: latestRating.visioner,
                harder: latestRating.harder,
                niceGuy: latestRating.niceGuy,
            });
        }
    }, [isRateOpen, ratings]);

    useEffect(() => {
        if (!id) return;

        const fetchCustomerData = async () => {
            // 1. Fetch Customer Details
            const customerUnsub = onSnapshot(doc(db, 'customers', id), (docSnap) => {
                if (docSnap.exists()) {
                    const data = { id: docSnap.id, ...docSnap.data() } as Customer;
                    setCustomer(data);
                    // setEditForm(data); // Removed
                    // Fix: Sync ratings when customer data arrives
                    setRatings((data as any).ratings || []);
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

            setLoading(false);

            return () => {
                customerUnsub();
                projectsUnsub();
            };
        };

        fetchCustomerData();
    }, [id]);

    const handleUpdateCustomer = async (formData: Partial<Customer>) => {
        if (!customer?.id) return;
        try {
            await updateDoc(doc(db, 'customers', customer.id), {
                ...formData,
                updatedAt: new Date().toISOString()
            });
            // setIsEditOpen(false); // Dialog handles closing on submit? No, we closed it manually before? 
            // In shared component: "await onSubmit(formData); onOpenChange(false);" -> It closes itself.
            // But we should verify if we need to do anything else.

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
            throw error; // Re-throw so dialog stays open/handles error state if it catches it
        }
    };

    const handleSaveRating = async () => {
        setIsSubmittingRating(true);
        try {
            toast({ title: "Debug", description: "Step 1: Updating customer doc with new rating..." });

            const newRatingEntry = {
                id: crypto.randomUUID(), // Generate a client-side ID
                customerId: id,
                raterId: 'user-123',
                ...newRating,
                updatedAt: new Date().toISOString(),
            };

            // Recalculate Health Score
            const currentRatings = (customer as any)?.ratings || [];
            const allRatings = [...currentRatings, newRatingEntry];

            const avgPayer = allRatings.reduce((sum: number, r: any) => sum + r.payer, 0) / allRatings.length;
            const avgVisioner = allRatings.reduce((sum: number, r: any) => sum + r.visioner, 0) / allRatings.length;
            const avgNiceGuy = allRatings.reduce((sum: number, r: any) => sum + r.niceGuy, 0) / allRatings.length;
            const avgHarder = allRatings.reduce((sum: number, r: any) => sum + r.harder, 0) / allRatings.length;

            const healthScore = ((avgPayer + avgVisioner + avgNiceGuy + (10 - avgHarder)) / 40) * 100;

            await updateDoc(doc(db, 'customers', id), {
                ratings: arrayUnion(newRatingEntry),
                healthScore: Math.round(healthScore),
            });

            toast({
                title: "Rated Successfully!",
                description: "Customer health score updated.",
                variant: "default"
            });

            // Manually update local state to reflect change immediately if snapshot is slow
            setRatings(allRatings);
            setCustomer(prev => prev ? { ...prev, healthScore: Math.round(healthScore) } : null);
            setIsRateOpen(false);

        } catch (error: any) {
            console.error("Error saving rating:", error);
            toast({
                title: "Permission Error Debug",
                description: `Failed at ${error.message || error}`,
                variant: "destructive",
                duration: 10000,
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
    // Prepare Radar Chart Data with separate Display vs Plot values
    const chartData = [
        { subject: 'Payer', A: ratings.length > 0 ? ratings.reduce((sum, r) => sum + r.payer, 0) / ratings.length : 0, fullMark: 10, displayValue: ratings.length > 0 ? ratings.reduce((sum, r) => sum + r.payer, 0) / ratings.length : 0 },
        { subject: 'Visioner', A: ratings.length > 0 ? ratings.reduce((sum, r) => sum + r.visioner, 0) / ratings.length : 0, fullMark: 10, displayValue: ratings.length > 0 ? ratings.reduce((sum, r) => sum + r.visioner, 0) / ratings.length : 0 },
        { subject: 'Nice Guy', A: ratings.length > 0 ? ratings.reduce((sum, r) => sum + r.niceGuy, 0) / ratings.length : 0, fullMark: 10, displayValue: ratings.length > 0 ? ratings.reduce((sum, r) => sum + r.niceGuy, 0) / ratings.length : 0 },
        { subject: 'Harder', A: ratings.length > 0 ? ratings.reduce((sum, r) => sum + r.harder, 0) / ratings.length : 0, fullMark: 10, displayValue: ratings.length > 0 ? ratings.reduce((sum, r) => sum + r.harder, 0) / ratings.length : 0 },
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

                    <Button onClick={() => setIsEditOpen(true)}>
                        <Pencil className="mr-2 h-4 w-4" /> Edit Profile
                    </Button>

                    <CustomerFormDialog
                        isOpen={isEditOpen}
                        onOpenChange={setIsEditOpen}
                        mode="edit"
                        initialData={customer || undefined}
                        onSubmit={handleUpdateCustomer}
                    />
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
                        <CardContent className="h-[300px] relative">
                            {ratings.length === 0 && (
                                <div className="absolute inset-0 flex items-center justify-center z-10 bg-background/50 backdrop-blur-[1px]">
                                    <p className="text-muted-foreground font-medium">No Ratings Yet</p>
                                </div>
                            )}
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                                    <PolarGrid stroke="hsl(var(--foreground))" strokeOpacity={0.1} />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} stroke="hsl(var(--foreground))" strokeOpacity={0.1} />
                                    <Tooltip
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const data = payload[0].payload;
                                                return (
                                                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div className="flex flex-col">
                                                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                                    {data.subject}
                                                                </span>
                                                                <span className="font-bold text-muted-foreground">
                                                                    {Number(data.displayValue).toFixed(1)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Radar
                                        name="Rating"
                                        dataKey="A"
                                        stroke="hsl(var(--primary))"
                                        fill="hsl(var(--primary))"
                                        fillOpacity={0.5}
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
                                <span suppressHydrationWarning className="text-sm">Last Contact: {customer.lastContactDate ? new Date(customer.lastContactDate).toLocaleDateString() : 'Never'}</span>
                            </div>

                            {/* Social Media Section */}
                            {(customer.lineId || customer.facebookName || customer.whatsappNumber) && (
                                <div className="border-t pt-4 mt-4 space-y-3">
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Social Media</h4>

                                    {/* Line */}
                                    {customer.lineId && (
                                        <div className="flex items-center gap-3">
                                            <div className="h-4 w-4 flex items-center justify-center font-bold text-[10px] bg-green-500 text-white rounded-sm">L</div>
                                            {customer.lineLink ? (
                                                <a href={customer.lineLink} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline text-primary flex items-center gap-1">
                                                    {customer.lineId} <ExternalLink className="h-3 w-3" />
                                                </a>
                                            ) : (
                                                <span className="text-sm">{customer.lineId}</span>
                                            )}
                                        </div>
                                    )}

                                    {/* Facebook */}
                                    {customer.facebookName && (
                                        <div className="flex items-center gap-3">
                                            <div className="h-4 w-4 flex items-center justify-center font-bold text-[10px] bg-blue-600 text-white rounded-sm">F</div>
                                            {customer.facebookLink ? (
                                                <a href={customer.facebookLink} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline text-primary flex items-center gap-1">
                                                    {customer.facebookName} <ExternalLink className="h-3 w-3" />
                                                </a>
                                            ) : (
                                                <span className="text-sm">{customer.facebookName}</span>
                                            )}
                                        </div>
                                    )}

                                    {/* WhatsApp */}
                                    {customer.whatsappNumber && (
                                        <div className="flex items-center gap-3">
                                            <div className="h-4 w-4 flex items-center justify-center font-bold text-[10px] bg-green-600 text-white rounded-sm">W</div>
                                            {customer.whatsappLink ? (
                                                <a href={customer.whatsappLink} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline text-primary flex items-center gap-1">
                                                    {customer.whatsappNumber} <ExternalLink className="h-3 w-3" />
                                                </a>
                                            ) : (
                                                <span className="text-sm">{customer.whatsappNumber}</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
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
