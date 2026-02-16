"use client";

import { useState, useTransition, useEffect, useMemo } from 'react';
import type { Project } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreHorizontal, Archive, Loader2, Calendar, ArrowUpDown, CalendarClock, FolderKanban, Paperclip, ExternalLink, Hammer, CheckCircle2 } from 'lucide-react';
import { NewProjectDialog } from '@/components/new-project-dialog';
import { EditProjectDialog } from '@/components/edit-project-dialog';
import { ArchivedProjectsDialog } from '@/components/archived-projects-dialog';
import { ProjectFilesGallery } from '@/components/project-files-gallery';
import dynamic from 'next/dynamic';

const ProjectGanttChart = dynamic(() => import('@/components/project-gantt-chart').then(mod => mod.ProjectGanttChart), {
    loading: () => <div className="h-64 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>,
    ssr: false
});
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useTheme } from "next-themes";
import { db } from '@/lib/firebase';
import { collection, query, limit, onSnapshot } from 'firebase/firestore'; // Removed orderBy as it's not used in initial query
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils'; // Assuming cn exists or I should inline it if not, but it usually exists in shadcn

const getCategoryColor = (category?: string) => {
    if (!category) return 'transparent';
    const colors = [
        '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981',
        '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e'
    ];
    let hash = 0;
    for (let i = 0; i < category.length; i++) {
        hash = category.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
};

export function ProjectsClientPage({ projects: initialProjects }: { projects: Project[] }) {
    const [allProjects, setAllProjects] = useState(initialProjects);
    const { theme } = useTheme();
    const [isLoading, setIsLoading] = useState(true);

    // T-118: Default to 'category'
    const [sortBy, setSortBy] = useState<'default' | 'category' | 'startDate' | 'endDate' | 'hasInProgress'>('category');

    const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isArchivedDialogOpen, setIsArchivedDialogOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [galleryProject, setGalleryProject] = useState<{ id: string, name: string } | null>(null);

    const [timeframe, setTimeframe] = useState('monthly');
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [isArchiveAlertOpen, setIsArchiveAlertOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    // --- Presence (Lock) State ---
    const [presenceMap, setPresenceMap] = useState<Record<string, import('@/lib/types').Presence>>({});

    // T-119: Load/Save Filter Settings
    useEffect(() => {
        const savedSort = localStorage.getItem('projectSortBy');
        if (savedSort) {
            setSortBy(savedSort as any);
        }
    }, []);

    const handleSortChange = (val: string) => {
        setSortBy(val as any);
        localStorage.setItem('projectSortBy', val);
    };

    useEffect(() => {
        if (typeof window === 'undefined') return;

        import("@/lib/firebase").then(({ db }) => {
            if (!db) return;
            import("firebase/firestore").then(({ collection, onSnapshot }) => {
                const q = collection(db, 'presence');
                const unsubscribe = onSnapshot(q, (snapshot) => {
                    const map: Record<string, import('@/lib/types').Presence> = {};
                    snapshot.forEach(doc => {
                        map[doc.id] = doc.data() as import('@/lib/types').Presence;
                    });
                    setPresenceMap(map);
                });
                return () => unsubscribe();
            });
        });
    }, []);

    // --- SETUP REAL-TIME LISTENER ---
    useEffect(() => {
        setIsLoading(true);
        const q = query(collection(db, 'projects'), limit(100));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const projectsFromFirestore = querySnapshot.docs.map(doc => {
                const data = doc.data();
                const projectId = doc.id;
                const initialProjectData = initialProjects.find(p => p.id === projectId);

                return {
                    id: projectId,
                    name: data.name || data.ProjectName,
                    description: data.description,
                    startDate: data.startDate || data.StartDate,
                    endDate: data.endDate || data.EndDate,
                    status: data.status || 'กำลังดำเนินการ',
                    team: data.team,
                    completedTasks: initialProjectData?.completedTasks || 0,
                    totalTasks: initialProjectData?.totalTasks || 0,
                    isDarkModeOnly: data.isDarkModeOnly || false,
                    customerId: data.customerId,
                    owner: data.owner,
                    category: data.category,
                    githubLink: data.githubLink,
                    links: data.links,
                    inProgressTasks: data.inProgressTasks || 0,
                    totalFiles: data.totalFiles || 0,
                } as Project;
            });
            setAllProjects(projectsFromFirestore);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [initialProjects]);

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Memoize filtered and sorted projects
    const projects = useMemo(() => {
        if (!mounted) return allProjects;

        let filtered = allProjects.filter(project => {
            if (theme === "dark") {
                return project.isDarkModeOnly;
            } else {
                return !project.isDarkModeOnly;
            }
        });

        if (sortBy === 'hasInProgress') {
            filtered = filtered.filter(p => (p.inProgressTasks || 0) > 0);
        }

        // Sorting Logic
        return filtered.sort((a, b) => {
            if (sortBy === 'category') {
                return (a.category || '').localeCompare(b.category || '');
            } else if (sortBy === 'startDate') {
                const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
                const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
                if (dateA === 0 && dateB === 0) return 0;
                if (dateA === 0) return 1;
                if (dateB === 0) return -1;
                return dateA - dateB;
            } else if (sortBy === 'endDate') {
                const dateA = a.endDate ? new Date(a.endDate).getTime() : 0;
                const dateB = b.endDate ? new Date(b.endDate).getTime() : 0;
                if (dateA === 0 && dateB === 0) return 0;
                if (dateA === 0) return 1;
                if (dateB === 0) return -1;
                return dateA - dateB;
            }
            return 0;
        });
    }, [allProjects, theme, mounted, sortBy]);

    // Grouping Logic for T-118
    const groupedProjects = useMemo(() => {
        if (sortBy !== 'category') return null;

        const groups: Record<string, Project[]> = {};
        projects.forEach(p => {
            const cat = p.category || 'Uncategorized';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(p);
        });
        return groups;
    }, [projects, sortBy]);


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

    const ProjectCard = ({ project }: { project: Project }) => (
        <Card
            key={project.id}
            className="flex flex-col justify-between transition-all hover:shadow-md min-h-[280px]"
            style={{
                borderLeft: project.category ? `4px solid ${getCategoryColor(project.category)}` : undefined
            }}
        >
            <div>
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="flex-grow overflow-hidden pr-2 flex flex-col gap-1">
                            <Link href={`/project/${project.id}`}>
                                <CardTitle className="cursor-pointer hover:underline text-lg leading-tight">{project.name}</CardTitle>
                            </Link>
                            {(() => {
                                const editors = presenceMap[project.id]?.editors;
                                const activeEditor = editors ? Object.values(editors)[0] : null;

                                if (activeEditor) {
                                    return (
                                        <div className="flex items-center gap-1.5 text-xs text-amber-600 animate-pulse">
                                            <div className="relative w-4 h-4 rounded-full overflow-hidden bg-gray-200">
                                                {activeEditor.avatarUrl ? (
                                                    <img src={activeEditor.avatarUrl} alt="User" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-amber-500 text-[8px] text-white">
                                                        {activeEditor.userName.charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                            <span className="font-medium">
                                                Editing by {activeEditor.userName}
                                            </span>
                                        </div>
                                    );
                                }
                                return null;
                            })()}
                        </div>
                        <div className="flex gap-1 items-start">
                            {/* GitHub Link moved to footer */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="flex-shrink-0">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    {(() => {
                                        const editors = presenceMap[project.id]?.editors;
                                        const activeEditor = editors ? Object.values(editors)[0] : null;
                                        const isLocked = !!activeEditor;

                                        return (
                                            <>
                                                <DropdownMenuItem
                                                    onSelect={() => handleActionClick(project, 'edit')}
                                                    disabled={isLocked}
                                                    className={isLocked ? "opacity-50 cursor-not-allowed" : ""}
                                                >
                                                    {isLocked ? `Locked by ${activeEditor?.userName}` : "Edit"}
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
                                            </>
                                        );
                                    })()}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Link href={`/project/${project.id}`}>
                        <p className="text-sm text-muted-foreground cursor-pointer line-clamp-2 mb-6 min-h-[2.5rem]">
                            {project.description || "No description provided."}
                        </p>
                        {(project.startDate || project.endDate) && (
                            <div className="flex items-center text-xs text-muted-foreground mt-2">
                                <Calendar className="mr-2 h-3 w-3" />
                                <span suppressHydrationWarning>
                                    {project.startDate ? new Date(project.startDate).toLocaleDateString('th-TH') : '...'}
                                    {' - '}
                                    {project.endDate ? new Date(project.endDate).toLocaleDateString('th-TH') : '...'}
                                </span>
                            </div>
                        )}
                    </Link>
                </CardContent>
            </div>
            <CardFooter className="flex flex-col gap-3 items-start">
                <div className="flex flex-wrap gap-2 w-full">
                    {project.team && (
                        <Badge variant="outline" className="whitespace-normal h-auto py-1">{project.team}</Badge>
                    )}
                    {project.owner && (
                        <Badge variant="secondary" className="whitespace-normal h-auto py-1" title={project.owner}>
                            {project.owner}
                        </Badge>
                    )}
                    {project.category && (
                        <Badge variant="outline" className="whitespace-normal h-auto py-1" style={{ borderColor: getCategoryColor(project.category), color: getCategoryColor(project.category) }}>
                            {project.category}
                        </Badge>
                    )}
                </div>
                <div className="w-full flex justify-between items-center mt-2">
                    <div onClick={(e) => e.stopPropagation()} className="flex gap-2">
                        {(project.links?.length && project.links.length > 0) || project.githubLink ? (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-6 px-2 text-muted-foreground hover:text-primary gap-1">
                                        <Paperclip className="h-3 w-3" />
                                        <span className="text-xs">
                                            {project.links && project.links.length > 0 ? `${project.links.length} Links` : 'GitHub'}
                                        </span>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-2" align="start">
                                    <div className="flex flex-col gap-2">
                                        {project.links && project.links.length > 0 ? (
                                            project.links.map((link, idx) => (
                                                <a
                                                    key={idx}
                                                    href={link.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm text-blue-600 hover:underline flex items-center gap-2"
                                                >
                                                    <ExternalLink className="h-3 w-3" />
                                                    {link.label || link.url}
                                                </a>
                                            ))
                                        ) : project.githubLink ? (
                                            <a
                                                href={project.githubLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm text-blue-600 hover:underline flex items-center gap-2"
                                            >
                                                <ExternalLink className="h-3 w-3" />
                                                GitHub
                                            </a>
                                        ) : null}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        ) : null}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-muted-foreground hover:text-primary gap-1"
                            onClick={() => {
                                setGalleryProject({ id: project.id, name: project.name });
                                setIsGalleryOpen(true);
                            }}
                        >
                            <FolderKanban className="h-3 w-3" />
                            <span className="text-xs">Files ({project.totalFiles || 0})</span>
                        </Button>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* In-Progress Tasks Indicator */}
                        {project.inProgressTasks ? (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground" title="In Progress">
                                <Hammer className="h-3 w-3 text-amber-600" />
                                <span>{project.inProgressTasks}</span>
                            </div>
                        ) : null}

                        <div className="flex items-center gap-1 text-xs text-muted-foreground" title="Completed Tasks">
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                            <span>{project.completedTasks}/{project.totalTasks}</span>
                        </div>
                    </div>
                </div>
            </CardFooter>
        </Card >
    );

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
                    <Select value={sortBy} onValueChange={handleSortChange}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Sort by..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="default">Default</SelectItem>
                            <SelectItem value="category">
                                <div className="flex items-center gap-2">
                                    <FolderKanban className="h-4 w-4" /> Group by Category
                                </div>
                            </SelectItem>
                            <SelectItem value="startDate">
                                <div className="flex items-center gap-2">
                                    <CalendarClock className="h-4 w-4" /> Start Date
                                </div>
                            </SelectItem>
                            <SelectItem value="endDate">
                                <div className="flex items-center gap-2">
                                    <ArrowUpDown className="h-4 w-4" /> End Date
                                </div>
                            </SelectItem>
                            <SelectItem value="hasInProgress">
                                <div className="flex items-center gap-2">
                                    <Hammer className="h-4 w-4" /> Has In Progress
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>

                    <Button variant="outline" onClick={() => setIsArchivedDialogOpen(true)}>
                        <Archive className="mr-2 h-4 w-4" />
                        View Archived
                    </Button>
                    <Button onClick={() => setIsNewProjectDialogOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        New Project
                    </Button>
                    <Button variant="outline" onClick={async () => {
                        setIsLoading(true);
                        const { syncAllProjectsStats } = await import('./actions');
                        await syncAllProjectsStats();
                        setIsLoading(false);
                        toast({ title: "Data Synced", description: "Project stats have been refreshed." });
                    }}>
                        <ArrowUpDown className="mr-2 h-4 w-4" />
                        Sync Stats
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
                        <div className={`min-h-[200px] ${isLoading ? "opacity-50" : "opacity-100"}`}>
                            {sortBy === 'category' && groupedProjects ? (
                                // Render Grouped Projects
                                <div className="space-y-8">
                                    {Object.entries(groupedProjects).map(([category, projs]) => (
                                        <div key={category}>
                                            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur py-2 mb-4 border-b">
                                                <h1 className="text-xl font-semibold flex items-center gap-2">
                                                    <span className="w-2 h-6 rounded-sm bg-primary/20" style={{ backgroundColor: getCategoryColor(category) }} />
                                                    {category} <span className="text-sm font-normal text-muted-foreground ml-2">({projs.length})</span>
                                                </h1>
                                            </div>
                                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                                {projs.map(project => <ProjectCard key={project.id} project={project} />)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                // Render Normal Grid
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {projects.map((project) => (
                                        <ProjectCard key={project.id} project={project} />
                                    ))}
                                </div>
                            )}
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
            <EditProjectDialog
                key={selectedProject ? selectedProject.id : `new-project-${isEditDialogOpen}`}
                isOpen={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                project={selectedProject}
            /><ArchivedProjectsDialog isOpen={isArchivedDialogOpen} onOpenChange={setIsArchivedDialogOpen} />

            <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to delete?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the project and all its tasks.
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

            {galleryProject && (
                <ProjectFilesGallery
                    isOpen={isGalleryOpen}
                    onOpenChange={setIsGalleryOpen}
                    projectId={galleryProject.id}
                    projectName={galleryProject.name}
                />
            )}
        </div>
    )
}
