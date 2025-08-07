
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
import { UserPlus } from "lucide-react";
import { useState } from "react";
import { InviteUserDialog } from "@/components/app/invite-user-dialog";

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

  const form = useForm<CompanyProfileFormValues>({
    resolver: zodResolver(companyProfileSchema),
    // TODO: Fetch and populate with existing data
    defaultValues: {
      companyName: "",
      website: "",
      address: "",
      description: "",
    },
  });

  function onSubmit(values: CompanyProfileFormValues) {
    console.log(values);
    // TODO: Implement save logic
    toast({
      title: "Profile Saved",
      description: "Your company profile has been updated.",
    });
  }

  if (user?.role !== 'admin') {
    return (
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
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
    <>
        <header className="sticky top-0 z-10 bg-background/90 backdrop-blur-sm border-b">
            <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:p-8">
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
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Your Team</CardTitle>
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
                <TabsContent value="profile" className="mt-4">
                    <Card>
                    <CardHeader>
                        <CardTitle>Company Profile</CardTitle>
                        <CardDescription>Update your company's information.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="companyName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Company Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Acme Inc." {...field} />
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
                                                <Input placeholder="https://example.com" {...field} />
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
                                                <Input placeholder="123 Main St, Anytown, USA" {...field} />
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
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="flex justify-end">
                                    <Button type="submit">Save Changes</Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </main>
        <InviteUserDialog isOpen={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen} />
    </>
  );
}
