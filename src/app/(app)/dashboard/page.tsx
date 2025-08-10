
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect, useMemo } from "react";
import { LoaderCircle, BarChart3, ListTodo, AlertTriangle, CheckCircle2, Sigma, GitBranch } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { collection, query, onSnapshot, doc, getDoc, getDocs, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Task, Status, Release } from "@/lib/types";
import { isAfter } from 'date-fns';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

interface Project {
  id: string;
  name: string;
}

interface ProjectTask extends Task {
    projectId: string;
}

export default function DashboardPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [projects, setProjects] = useState<Project[]>([]);
    const [tasks, setTasks] = useState<ProjectTask[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [releases, setReleases] = useState<Release[]>([]);
    const [selectedReleaseId, setSelectedReleaseId] = useState<string | null>(null);

    const canViewPage = user?.role === 'admin' || user?.role === 'management';

    useEffect(() => {
        if (!canViewPage) return;

        const projectsQuery = query(collection(db, 'projects'));
        const unsubscribe = onSnapshot(projectsQuery, (snapshot) => {
            setProjects(snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name })));
        });

        return () => unsubscribe();
    }, [canViewPage]);

    useEffect(() => {
        if (!selectedProjectId) {
            setReleases([]);
            setSelectedReleaseId(null);
            return;
        }

        const releasesQuery = query(collection(db, 'projects', selectedProjectId, 'releases'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(releasesQuery, (snapshot) => {
            const releasesData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Release));
            setReleases(releasesData);
            if (releasesData.length > 0) {
                setSelectedReleaseId(releasesData[0].id);
            } else {
                setSelectedReleaseId(null);
            }
        });

        return () => unsubscribe();
    }, [selectedProjectId]);

     useEffect(() => {
        if (!selectedProjectId || !selectedReleaseId) {
            setTasks([]);
            return;
        }

        setLoading(true);
        const tasksQuery = query(
            collection(db, 'projects', selectedProjectId, 'tasks'),
            where('releaseId', '==', selectedReleaseId)
        );
        
        const unsubscribe = onSnapshot(tasksQuery, (snapshot) => {
            const fetchedTasks = snapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id,
                projectId: selectedProjectId,
                startDate: doc.data().startDate ? new Date(doc.data().startDate) : new Date(),
                endDate: doc.data().endDate ? new Date(doc.data().endDate) : new Date(),
            } as ProjectTask));
            setTasks(fetchedTasks);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching tasks for project:", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not fetch project tasks. Please try again.'
            });
            setLoading(false);
        });

        return () => unsubscribe();
    }, [selectedProjectId, selectedReleaseId, toast]);


    const projectMetrics = useMemo(() => {
        if (tasks.length === 0) {
            return {
                totalTasks: 0,
                completedTasks: 0,
                overdueTasks: 0,
                progress: 0,
                statusDistribution: [],
                teamWorkload: []
            };
        }

        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.status === 'Completed').length;
        const overdueTasks = tasks.filter(t => t.status !== 'Completed' && isAfter(new Date(), t.endDate)).length;
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        const statusCounts = tasks.reduce((acc, task) => {
            acc[task.status] = (acc[task.status] || 0) + 1;
            return acc;
        }, {} as Record<Status, number>);

        const statusDistribution = Object.entries(statusCounts).map(([name, value]) => ({ name, tasks: value }));
        
        const workloadCounts = tasks.reduce((acc, task) => {
            const assignee = task.assignedTo || 'Unassigned';
            acc[assignee] = (acc[assignee] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const teamWorkload = Object.entries(workloadCounts).map(([name, value]) => ({ name, tasks: value }));

        return { totalTasks, completedTasks, overdueTasks, progress, statusDistribution, teamWorkload };
    }, [tasks]);

    if (!canViewPage) {
        return (
            <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-muted/40">
                 <div className="max-w-6xl mx-auto">
                    <Card>
                        <CardHeader>
                            <CardTitle>Access Denied</CardTitle>
                            <CardDescription>You do not have permission to view this page.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p>Please contact your administrator if you believe this is an error.</p>
                        </CardContent>
                    </Card>
                </div>
            </main>
        )
    }

    return (
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-muted/40 flex flex-col">
            <div className="max-w-6xl mx-auto w-full flex flex-col flex-1">
                <Card className="flex flex-col flex-1">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Project Dashboard</CardTitle>
                                <CardDescription>
                                    Select a project and release for a real-time 360° view of its status.
                                </CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Select onValueChange={setSelectedProjectId} value={selectedProjectId || ''}>
                                    <SelectTrigger className="w-[220px]">
                                        <SelectValue placeholder="Select a project" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Select onValueChange={setSelectedReleaseId} value={selectedReleaseId || ''} disabled={!selectedProjectId}>
                                    <SelectTrigger className="w-[180px]">
                                        <GitBranch className="mr-2 h-4 w-4" />
                                        <SelectValue placeholder="Select a release" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {releases.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1">
                       {(loading) && (
                           <div className="flex flex-col items-center justify-center h-full border-2 border-dashed rounded-lg">
                              <LoaderCircle className="h-12 w-12 animate-spin text-primary mb-4" />
                              <p className="text-lg font-semibold text-muted-foreground">Loading project data...</p>
                         </div>
                       )}
                       {!loading && !selectedProjectId && (
                           <div className="flex flex-col items-center justify-center h-full border-2 border-dashed rounded-lg text-center p-4">
                              <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                              <h3 className="font-semibold text-lg">Select a Project</h3>
                              <p className="text-sm text-muted-foreground">
                                  Choose a project from the dropdown above to view its dashboard.
                              </p>
                           </div>
                       )}
                       {!loading && selectedProjectId && !selectedReleaseId && (
                            <div className="flex flex-col items-center justify-center h-full border-2 border-dashed rounded-lg text-center p-4">
                              <GitBranch className="h-12 w-12 text-muted-foreground mb-4" />
                              <h3 className="font-semibold text-lg">No Release Selected</h3>
                              <p className="text-sm text-muted-foreground">
                                  This project has no releases or none are selected.
                              </p>
                           </div>
                       )}
                        {!loading && selectedProjectId && selectedReleaseId && (
                         <div className="space-y-6 h-full overflow-y-auto">
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                               <Card>
                                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
                                    <div className="text-sm font-bold">{projectMetrics.progress}%</div>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="w-full bg-muted rounded-full h-2.5">
                                        <div className="bg-primary h-2.5 rounded-full" style={{width: `${projectMetrics.progress}%`}}></div>
                                    </div>
                                  </CardContent>
                                </Card>
                                <Card>
                                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                                    <Sigma className="h-4 w-4 text-muted-foreground" />
                                  </CardHeader>
                                  <CardContent>
                                    <div className="text-2xl font-bold">{projectMetrics.totalTasks}</div>
                                  </CardContent>
                                </Card>
                                <Card>
                                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Completed</CardTitle>
                                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                                  </CardHeader>
                                  <CardContent>
                                    <div className="text-2xl font-bold">{projectMetrics.completedTasks}</div>
                                  </CardContent>
                                </Card>
                               <Card>
                                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                                  </CardHeader>
                                  <CardContent>
                                    <div className="text-2xl font-bold text-destructive">{projectMetrics.overdueTasks}</div>
                                  </CardContent>
                                </Card>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Task Status</CardTitle>
                                        <CardDescription>Distribution of tasks across statuses.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <ChartContainer config={{
                                            tasks: { label: 'Tasks', color: 'hsl(var(--primary))' }
                                        }} className="h-[250px] w-full">
                                            <BarChart data={projectMetrics.statusDistribution} margin={{top: 5, right: 20, left: -10, bottom: 5}}>
                                                <XAxis dataKey="name" tickLine={false} axisLine={false} stroke="#888888" fontSize={12} />
                                                <YAxis tickLine={false} axisLine={false} stroke="#888888" fontSize={12} allowDecimals={false}/>
                                                <Tooltip content={<ChartTooltipContent />} />
                                                <Bar dataKey="tasks" fill="var(--color-tasks)" radius={4} />
                                            </BarChart>
                                        </ChartContainer>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Team Workload</CardTitle>
                                        <CardDescription>Number of tasks assigned per team member.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                          <ChartContainer config={{
                                            tasks: { label: 'Tasks', color: 'hsl(var(--primary))' }
                                        }} className="h-[250px] w-full">
                                            <BarChart data={projectMetrics.teamWorkload} layout="vertical" margin={{top: 5, right: 20, left: 20, bottom: 5}}>
                                                <XAxis type="number" tickLine={false} axisLine={false} stroke="#888888" fontSize={12} allowDecimals={false} />
                                                <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} stroke="#888888" fontSize={12} width={80} />
                                                <Tooltip content={<ChartTooltipContent />} />
                                                <Bar dataKey="tasks" fill="var(--color-tasks)" radius={4} />
                                            </BarChart>
                                        </ChartContainer>
                                    </CardContent>
                                </Card>
                            </div>
                         </div>
                       )}
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}

    