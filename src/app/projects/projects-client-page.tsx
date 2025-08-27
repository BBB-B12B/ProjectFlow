"use client";

// --- (1) IMPORT useEffect and useTheme ---
import { useState, useTransition, useEffect } from 'react';
import type { Project } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreHorizontal, Archive, Loader2 } from 'lucide-react'; // Import Loader2
import { ProjectGanttChart } from '@/components/project-gantt-chart';
import { NewProjectDialog } from '@/components/new-project-dialog';
import { EditProjectDialog } from '@/components/edit-project-dialog';
import { ArchivedProjectsDialog } from '@/components/archived-projects-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutGrid, GanttChart as GanttChartIcon } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteProject, archiveProject } from './actions';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useTheme } from "next-themes"; // Import useTheme

// --- (2) IMPORT firebase/firestore ---
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export function ProjectsClientPage({ projects: initialProjects }: { projects: Project[] }) {
    // --- (3) SETUP STATE FOR REAL-TIME UPDATES ---
    const [projects, setProjects] = useState(initialProjects);
    const { theme } = useTheme(); // Get current theme
    const [isLoading, setIsLoading] = useState(true); // Add isLoading state
    
    const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isArchivedDialogOpen, setIsArchivedDialogOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);

    const [timeframe, setTimeframe] = useState('monthly');
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [isArchiveAlertOpen, setIsArchiveAlertOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    // --- (4) SETUP REAL-TIME LISTENER ---
    useEffect(() => {
        setIsLoading(true); // Set loading to true when starting to fetch/filter
        // Query for projects that are not archived
        const q = query(collection(db, 'projects'), where('status', '!=', 'Archived'));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const projectsFromFirestore = querySnapshot.docs.map(doc => {
                const data = doc.data();
                const projectId = doc.id;

                // IMPORTANT: Real-time updates for task counts is complex and costly on the client.
                // We will merge the live data with the initial data to preserve the task counts
                // calculated on the server. A full refresh (or navigating) will get fresh counts.
                const initialProjectData = initialProjects.find(p => p.id === projectId);
                
                return {
                    id: projectId,
                    name: data.name || data.ProjectName,
                    description: data.description,
                    startDate: data.startDate || data.StartDate,
                    endDate: data.endDate || data.EndDate,
                    status: data.status || 'กำลังดำเนินการ',
                    team: data.team,
                    // Use initial task counts, default to 0 if it's a brand new project not in the initial list
                    completedTasks: initialProjectData?.completedTasks || 0,
                    totalTasks: initialProjectData?.totalTasks || 0,
                    isDarkModeOnly: data.isDarkModeOnly || false, // Ensure this field is included
                } as Project;
            }).filter(project => { // Modified filter logic
                if (theme === "dark") {
                    return project.isDarkModeOnly; // In dark mode, show only if isDarkModeOnly is true
                } else {
                    return !project.isDarkModeOnly; // In light mode, hide if isDarkModeOnly is true
                }
            }); 
            setProjects(projectsFromFirestore);
            setIsLoading(false); // Set loading to false after projects are set
        });

        // Cleanup function to unsubscribe when the component unmounts
        return () => unsubscribe();
    }, [initialProjects, theme]); // Add theme to dependency array

    const handleActionClick = (project: Project, action: 'edit' | 'delete' | 'archive') => {
        setSelectedProject(project);
        if (action === 'edit') setIsEditDialogOpen(true);
        if (action === 'delete') setIsDeleteAlertOpen(true);
        if (action === 'archive') setIsArchiveAlertOpen(true);
    };

    const handleConfirm = async (action: 'delete' | 'archive') => {
        if (selectedProject) {
            startTransition(async () => {
                const result = action === 'delete' 
                    ? await deleteProject(selectedProject.id)
                    : await archiveProject(selectedProject.id);

                if (result.success) {
                    toast({
                        title: "Success",
                        description: result.message,
                    });
                } else {
                    toast({
                        title: "Error",
                        description: result.message,
                        variant: "destructive",
                    });
                }
                setIsDeleteAlertOpen(false);
                setIsArchiveAlertOpen(false);
                setSelectedProject(null);
            });
        }
    };

    return (
        <div className="flex h-full flex-col gap-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
                    <p className="text-muted-foreground">
                        An overview of all your projects.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setIsArchivedDialogOpen(true)}>
                        <Archive className="mr-2 h-4 w-4" />
                        View Archived
                    </Button>
                    <Button onClick={() => setIsNewProjectDialogOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        New Project
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="cards">
                <div className="flex justify-end">
                    <TabsList>
                        <TabsTrigger value="cards">
                            <LayoutGrid className="mr-2 h-4 w-4" />
                            Cards
                        </TabsTrigger>
                        <TabsTrigger value="gantt">
                            <GanttChartIcon className="mr-2 h-4 w-4" />
                            Gantt Chart
                        </TabsTrigger>
                    </TabsList>
                </div>
                <TabsContent value="cards" className="mt-4">
                    <div className="relative">
                        {isLoading && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        )}
                        <div className={`grid gap-6 md:grid-cols-2 lg:grid-cols-3 ${isLoading ? "opacity-50" : "opacity-100"}`}> {/* Apply opacity based on loading state */}
                            {/* --- (5) RENDER THE STATE-managed `projects` LIST --- */}
                            {projects.map((project) => (
                                <Card key={project.id} className="flex h-48 flex-col justify-between">
                                    <div>
                                        <CardHeader>
                                            <div className="flex items-start justify-between">
                                                <Link href={`/project/${project.id}`} className="flex-grow overflow-hidden pr-2">
                                                    <CardTitle className="cursor-pointer hover:underline truncate">{project.name}</CardTitle>
                                                </Link>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="flex-shrink-0">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent>
                                                        <DropdownMenuItem onSelect={() => handleActionClick(project, 'edit')}>
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onSelect={() => handleActionClick(project, 'archive')}>
                                                            Archive
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem 
                                                            className="text-red-500"
                                                            onSelect={() => handleActionClick(project, 'delete')}
                                                        >
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <Link href={`/project/${project.id}`}>
                                                <p className="text-sm text-muted-foreground cursor-pointer line-clamp-2">
                                                    {project.description}
                                                </p>
                                            </Link>
                                        </CardContent>
                                    </div>
                                    <CardFooter className="flex justify-between items-center">
                                        {project.team && (
                                            <Badge variant="outline">{project.team}</Badge>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            Complete {project.completedTasks}/{project.totalTasks}
                                        </p>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    </div>
                </TabsContent>
                <TabsContent value="gantt" className="mt-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-end">
                                <RadioGroup defaultValue="monthly" onValueChange={setTimeframe} className="flex items-center gap-4">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="monthly" id="monthly" />
                                        <Label htmlFor="monthly">Monthly</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="weekly" id="weekly" />
                                        <Label htmlFor="weekly">Weekly</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <ProjectGanttChart projects={projects} timeframe={timeframe} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
            <NewProjectDialog isOpen={isNewProjectDialogOpen} onOpenChange={setIsNewProjectDialogOpen} />
            <EditProjectDialog isOpen={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} project={selectedProject} />
            <ArchivedProjectsDialog isOpen={isArchivedDialogOpen} onOpenChange={setIsArchivedDialogOpen} />

            <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to delete?</AlertDialogTitle>
                        <AlertDialogDescription>\
                            This action cannot be undone. This will permanently delete the project and all its tasks.\
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleConfirm('delete')} disabled={isPending}>
                            {isPending ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            <AlertDialog open={isArchiveAlertOpen} onOpenChange={setIsArchiveAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to archive?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This project will be hidden from the main view. You can recover it later.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleConfirm('archive')} disabled={isPending}>
                            {isPending ? "Archiving..." : "Archive"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
