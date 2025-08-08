
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

export default function InsightsPage() {
    const { user } = useAuth();

    const canViewPage = user?.role === 'admin' || user?.role === 'management';

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
                <CardHeader>
                    <CardTitle>Insights</CardTitle>
                    <CardDescription>
                        This is where your team's insights and analytics will be displayed.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                   <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground">Insights Dashboard Coming Soon</p>
                   </div>
                </CardContent>
            </Card>
        </main>
    );
}
