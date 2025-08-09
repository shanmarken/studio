
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BrainCircuit, LoaderCircle, BarChart3, AlertTriangle, UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateInsights, GenerateInsightsOutput } from "@/ai/flows/generate-insights";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface Project {
  id: string;
  name: string;
}

export default function InsightsPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState<GenerateInsightsOutput | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

    const canViewPage = user?.role === 'admin' || user?.role === 'management';

    useEffect(() => {
        if (!canViewPage) return;

        const projectsQuery = query(collection(db, 'projects'));
        const unsubscribe = onSnapshot(projectsQuery, (snapshot) => {
            setProjects(snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name })));
        });

        return () => unsubscribe();
    }, [canViewPage]);

    const handleGenerateReport = async () => {
        if (!selectedProjectId) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Please select a project to analyze.'
            });
            return;
        }
        setLoading(true);
        setReport(null);
        try {
            const result = await generateInsights(selectedProjectId);
            setReport(result);
        } catch (error) {
            console.error("Failed to generate insights:", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not generate the insights report. Please try again.'
            });
        } finally {
            setLoading(false);
        }
    };
    
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
                        <div>
                            <CardTitle>Project Insights</CardTitle>
                            <CardDescription>
                                Select a project and generate an AI-powered report on its progress and team performance.
                            </CardDescription>
                        </div>
                         <div className="flex items-center gap-4 mt-4">
                            <Select onValueChange={setSelectedProjectId} value={selectedProjectId || ''}>
                                <SelectTrigger className="w-[280px]">
                                    <SelectValue placeholder="Select a project" />
                                </SelectTrigger>
                                <SelectContent>
                                    {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Button onClick={handleGenerateReport} disabled={loading || !selectedProjectId}>
                                {loading ? (
                                    <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</>
                                ) : (
                                    <><BarChart3 className="mr-2 h-4 w-4" /> Generate Insights</>
                                )}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1">
                       {loading && (
                           <div className="flex flex-col items-center justify-center h-full border-2 border-dashed rounded-lg">
                              <LoaderCircle className="h-12 w-12 animate-spin text-primary mb-4" />
                              <p className="text-lg font-semibold text-muted-foreground">Analyzing your project...</p>
                              <p className="text-sm text-muted-foreground">This may take a moment.</p>
                         </div>
                       )}
                       {!loading && !report && (
                           <div className="flex flex-col items-center justify-center h-full border-2 border-dashed rounded-lg text-center p-4">
                              <BrainCircuit className="h-12 w-12 text-muted-foreground mb-4" />
                              <h3 className="font-semibold text-lg">Ready for Analysis</h3>
                              <p className="text-sm text-muted-foreground">
                                  Select a project from the dropdown above and click "Generate Insights" to get started.
                              </p>
                           </div>
                       )}
                       {report && (
                         <div className="space-y-6 h-full overflow-y-auto">
                            <section>
                                <h2 className="text-xl font-bold tracking-tight mb-2">Overall Summary</h2>
                                <Alert>
                                    <BrainCircuit className="h-4 w-4" />
                                    <AlertTitle>AI Analysis</AlertTitle>
                                    <AlertDescription>
                                        {report.overallSummary}
                                    </AlertDescription>
                                </Alert>
                            </section>

                            <Separator />

                            <section>
                                 <h2 className="text-xl font-bold tracking-tight mb-2">At-Risk Projects</h2>
                                 {report.atRiskProjects.length > 0 ? (
                                    <div className="grid gap-4 md:grid-cols-2">
                                        {report.atRiskProjects.map(project => (
                                            <Card key={project.projectId}>
                                                <CardHeader>
                                                    <CardTitle className="flex items-center gap-2 text-lg">
                                                        <AlertTriangle className="text-amber-500" />
                                                        <Link href={`/projects/${project.projectId}`} className="hover:underline">
                                                            {project.projectName}
                                                        </Link>
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="space-y-2">
                                                    <div>
                                                        <h4 className="font-semibold text-sm">Risk Factor</h4>
                                                        <p className="text-sm text-muted-foreground">{project.riskReason}</p>
                                                    </div>
                                                     <div>
                                                        <h4 className="font-semibold text-sm">Suggested Action</h4>
                                                        <p className="text-sm text-muted-foreground">{project.suggestedAction}</p>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                 ) : (
                                    <Alert className="bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400">
                                        <UserCheck className="h-4 w-4" />
                                        <AlertTitle>All Clear!</AlertTitle>
                                        <AlertDescription>
                                            No high-risk items identified in this project. Great job!
                                        </AlertDescription>
                                    </Alert>
                                 )}
                            </section>
                            
                            <Separator />

                            <section>
                                 <h2 className="text-xl font-bold tracking-tight mb-2">Team Performance</h2>
                                 <div className="rounded-md border">
                                    <div className="grid grid-cols-[2fr,1fr,1fr,1fr,3fr] items-center p-4 bg-muted/60 font-semibold text-sm border-b">
                                        <span>Team Member</span>
                                        <span className="text-center">Completed</span>
                                        <span className="text-center">In Progress</span>
                                        <span className="text-center">Blocked</span>
                                        <span>Performance Summary</span>
                                    </div>
                                    <div>
                                        {report.teamPerformance.map(member => (
                                            <div key={member.teamMemberName} className="grid grid-cols-[2fr,1fr,1fr,1fr,3fr] items-center p-4 border-b last:border-b-0">
                                                <span className="font-medium">{member.teamMemberName}</span>
                                                <p className="text-center">
                                                    <Badge variant="outline" className="bg-green-500/10 border-green-500/40 text-green-700">{member.completedTasks}</Badge>
                                                </p>
                                                 <p className="text-center">
                                                    <Badge variant="outline" className="bg-blue-500/10 border-blue-500/40 text-blue-700">{member.inProgressTasks}</Badge>
                                                </p>
                                                <p className="text-center">
                                                    <Badge variant="outline" className="bg-red-500/10 border-red-500/40 text-red-700">{member.blockedTasks}</Badge>
                                                </p>
                                                <p className="text-sm text-muted-foreground">{member.performanceSummary}</p>
                                            </div>
                                        ))}
                                    </div>
                                 </div>
                            </section>
                         </div>
                       )}
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
