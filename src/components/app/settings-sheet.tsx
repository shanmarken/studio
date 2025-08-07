
'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface SettingsSheetProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    activeTab: 'team' | 'profile';
}

export function SettingsSheet({ isOpen, onOpenChange, activeTab }: SettingsSheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl w-full p-0">
        <Tabs defaultValue={activeTab} className="h-full flex flex-col">
          <SheetHeader className="p-6">
            <SheetTitle>Settings</SheetTitle>
            <SheetDescription>
                Manage your team members, roles, and company details.
            </SheetDescription>
             <TabsList className="grid w-full grid-cols-2 mt-4">
                <TabsTrigger value="team">Team Management</TabsTrigger>
                <TabsTrigger value="profile">Company Profile</TabsTrigger>
            </TabsList>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <TabsContent value="team">
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
            <TabsContent value="profile">
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
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
