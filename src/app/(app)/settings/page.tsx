
'use client';

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { TeamMembersTable } from "@/components/app/team-members-table";
import { useAuth } from "@/hooks/use-auth";
import { Calendar, UserPlus, Edit, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { InviteUserDialog } from "@/components/app/invite-user-dialog";
import { Badge } from "@/components/ui/badge";
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { LoaderCircle } from 'lucide-react';

const companyProfileSchema = z.object({
    companyName: z.string().min(2, { message: "Company name must be at least 2 characters." }),
    website: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
    address: z.string().max(100).optional(),
    description: z.string().max(500).optional(),
});

type CompanyProfileFormValues = z.infer<typeof companyProfileSchema>;

export default function SettingsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<CompanyProfileFormValues>({
    resolver: zodResolver(companyProfileSchema),
    defaultValues: {
      companyName: "",
      website: "",
      address: "",
      description: "",
    },
  });

  const companyProfileRef = doc(db, 'companyProfile', 'main');

  useEffect(() => {
    const unsubscribe = onSnapshot(companyProfileRef, (docSnap) => {
        if (docSnap.exists()) {
            form.reset(docSnap.data());
        }
        setLoadingProfile(false);
    });
    return () => unsubscribe();
  }, [form, companyProfileRef]);

  const onSubmit = async (values: CompanyProfileFormValues) => {
    try {
        await setDoc(companyProfileRef, values);
        toast({ title: 'Success', description: 'Company profile has been updated.' });
        setIsEditing(false);
    } catch (error) {
        console.error("Error updating profile:", error);
        toast({ variant: 'destructive', title: "Error", description: "Failed to save profile." });
    }
  }

  const handleCancel = async () => {
    const docSnap = await getDoc(companyProfileRef);
    if (docSnap.exists()) {
        form.reset(docSnap.data());
    }
    setIsEditing(false);
  }

  function handleConnectCalendar() {
    toast({
        title: "Coming Soon!",
        description: "Google Calendar integration is under development."
    })
  }

  const isAdmin = user?.role === 'admin';

  return (
    <>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-muted/40">
             <Tabs defaultValue="profile" className="w-full">
                <TabsList className="grid w-full grid-cols-3 max-w-lg">
                    <TabsTrigger value="profile">Company Profile</TabsTrigger>
                    {isAdmin && <TabsTrigger value="team">Team Management</TabsTrigger>}
                    <TabsTrigger value="integrations">Integrations</TabsTrigger>
                </TabsList>
                 <TabsContent value="profile" className="mt-4">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Company Profile</CardTitle>
                                    <CardDescription>
                                        {isAdmin ? (isEditing ? "You are currently editing the company profile." : "View or edit your company's information.") : "View your company's information."}
                                    </CardDescription>
                                </div>
                                {isAdmin && (
                                    <div className="flex gap-2">
                                        {isEditing ? (
                                            <>
                                                <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>
                                                <Button type="submit">
                                                    <Save className="mr-2" />
                                                    Save Changes
                                                </Button>
                                            </>
                                        ) : (
                                            <Button type="button" onClick={() => setIsEditing(true)}>
                                                <Edit className="mr-2" />
                                                Edit
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </CardHeader>
                            <CardContent>
                            {loadingProfile ? (
                                    <div className="flex items-center justify-center p-8">
                                        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                                    </div>
                            ) : (
                                <fieldset disabled={!isEditing && isAdmin} className="space-y-6">
                                    <FormField
                                        control={form.control}
                                        name="companyName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Company Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. Acme Inc." {...field} readOnly={!isEditing}/>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="website"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Website</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="https://example.com" {...field} readOnly={!isEditing}/>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="address"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Address</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="123 Main St, Anytown, USA" {...field} readOnly={!isEditing}/>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Company Description</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                    placeholder="Tell us a little about your company"
                                                    className="resize-none"
                                                    {...field}
                                                    readOnly={!isEditing}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </fieldset>
                            )}
                            </CardContent>
                            </Card>
                        </form>
                    </Form>
                </TabsContent>
                {isAdmin && (
                    <TabsContent value="team" className="mt-4">
                        <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Your Team</CardTitle>
                                <CardDescription>Manage team members and their roles.</CardDescription>
                            </div>
                            <Button onClick={() => setIsInviteDialogOpen(true)}>
                                <UserPlus className="mr-2 h-4 w-4" />
                                Invite User
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <TeamMembersTable />
                        </CardContent>
                        </Card>
                    </TabsContent>
                )}
                <TabsContent value="integrations" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Integrations</CardTitle>
                            <CardDescription>Connect your account to other services.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <Card className="bg-muted/40">
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="text-lg">Google Calendar</CardTitle>
                                        <CardDescription>Sync your project tasks and deadlines.</CardDescription>
                                    </div>
                                     <Badge variant="secondary">Not Connected</Badge>
                                </CardHeader>
                                <CardContent>
                                    <Button onClick={handleConnectCalendar}>
                                        <Calendar className="mr-2 h-4 w-4" />
                                        Connect to Google Calendar
                                    </Button>
                                </CardContent>
                           </Card>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </main>
        <InviteUserDialog isOpen={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen} />
    </>
  );
}
