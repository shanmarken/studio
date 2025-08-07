
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SettingsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your team and company settings here.</p>
      </div>
      <div className="grid gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Your Team</CardTitle>
            <CardDescription>Manage team members and their roles.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Team management features will be here.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Company Profile</CardTitle>
            <CardDescription>Update your company's information.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Company profile settings will be here.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
