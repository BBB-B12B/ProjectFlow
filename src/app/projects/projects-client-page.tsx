"use client";

import { useState } from 'react';
import type { Project } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { ProjectGanttChart } from '@/components/project-gantt-chart';
import { NewProjectDialog } from '@/components/new-project-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutGrid, GanttChart as GanttChartIcon } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import Link from 'next/link';

export function ProjectsClientPage({ projects }: { projects: Project[] }) {
    const [isNewProjectDialogOpen, setIsNewProjectDialogOpen] = useState(false);
    const [timeframe, setTimeframe] = useState('monthly');

    return (
        <div className="flex h-full flex-col gap-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
                    <p className="text-muted-foreground">
                        An overview of all your projects.
                    </p>
                </div>
                <Button onClick={() => setIsNewProjectDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Project
                </Button>
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
                            <Link href={`/project/${project.id}`} key={project.id}>
                                <Card className="cursor-pointer transition-all hover:shadow-md">
                                    <CardHeader>
                                        <CardTitle>{project.name}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground">
                                            {project.description}
                                        </p>
                                    </CardContent>
                                </Card>
                            </Link>
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
        </div>
    )
}
