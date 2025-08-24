"use client";

import { useState, useTransition } from 'react';
import type { Project } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreHorizontal, Archive } from 'lucide-react';
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

export function ProjectsClientPage({ projects }: { projects: Project[] }) {
    const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isArchivedDialogOpen, setIsArchivedDialogOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);

    const [timeframe, setTimeframe] = useState('monthly');
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [isArchiveAlertOpen, setIsArchiveAlertOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

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
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
        </div>
    )
}
