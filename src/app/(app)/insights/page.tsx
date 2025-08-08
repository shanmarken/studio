
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BrainCircuit, LoaderCircle, BarChart3, AlertTriangle, UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateInsights, GenerateInsightsOutput } from "@/ai/flows/generate-insights";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export default function InsightsPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState<GenerateInsightsOutput | null>(null);

    const canViewPage = user?.role === 'admin' || user?.role === 'management';

    const handleGenerateReport = async () => {
        setLoading(true);
        setReport(null);
        try {
            const result = await generateInsights();
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
                <Card>
                    <CardHeader>
                        <CardTitle>Access Denied</CardTitle>
                        <CardDescription>You do not have permission to view this page.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p>Please contact your administrator if you believe this is an error.</p>
                    </CardContent>
                </Card>
            </main>
        )
    }

    return (
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-muted/40">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Project Insights</CardTitle>
                        <CardDescription>
                            Generate an AI-powered report on project progress and team performance.
                        </CardDescription>
                    </div>
                     <Button onClick={handleGenerateReport} disabled={loading}>
                        {loading ? (
                            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <BrainCircuit className="mr-2 h-4 w-4" />
                        )}
                        {loading ? 'Analyzing...' : 'Generate Report'}
                    </Button>
                </CardHeader>
                <CardContent>
                   {loading && (
                     <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
                        <LoaderCircle className="h-12 w-12 animate-spin text-primary mb-4" />
                        <p className="text-lg font-semibold text-muted-foreground">Analyzing your projects...</p>
                        <p className="text-sm text-muted-foreground">This may take a moment.</p>
                   </div>
                   )}

                   {!loading && !report && (
                     <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg text-center p-4">
                        <BarChart3 className="h-12 w-12 text-muted-foreground mb-8" />
                        <h3 className="text-lg font-semibold mb-2">Welcome to Project Insights</h3>
                        <p className="text-sm text-muted-foreground">
                            Click the &quot;Generate Report&quot; button to get a complete analysis of your ongoing projects.
                        </p>
                   </div>
                   )}

                   {!loading && report && (
                     <div className="space-y-6">
                        {/* Overall Summary */}
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

                        {/* At-Risk Projects */}
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
                                        No projects are currently identified as high-risk. Great job!
                                    </AlertDescription>
                                </Alert>
                             )}
                        </section>
                        
                        <Separator />

                        {/* Team Performance */}
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
        </main>
    );
}
