
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


export default function SettingsPage() {

  return (
    <>
        <header className="sticky top-0 z-10 bg-background/90 backdrop-blur-sm border-b">
            <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
                <h1 className="text-2xl font-bold">Settings</h1>
            </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
             <Tabs defaultValue="team" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-md">
                    <TabsTrigger value="team">Team Management</TabsTrigger>
                    <TabsTrigger value="profile">Company Profile</TabsTrigger>
                </TabsList>
                <TabsContent value="team" className="mt-4">
                    <Card>
                    <CardHeader>
                        <CardTitle>Your Team</CardTitle>
                        <CardDescription>Manage team members and their roles.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p>Team management features will be here.</p>
                    </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="profile" className="mt-4">
                    <Card>
                    <CardHeader>
                        <CardTitle>Company Profile</CardTitle>
                        <CardDescription>Update your company's information.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p>Company profile settings will be here.</p>
                    </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </main>
    </>
  );
}
