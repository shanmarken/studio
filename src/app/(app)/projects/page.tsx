
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, PlusCircle, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { ProjectPulseLogo } from '@/components/app/project-pulse-logo';
import { useAuth } from '@/hooks/use-auth';
import { auth } from '@/lib/firebase';
import { UserAvatar } from '@/components/app/user-avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useState } from 'react';
import { ProfileDialog } from '@/components/app/profile-dialog';

export default function ProjectsPage() {
  const { user } = useAuth();
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  
  const projects = [
    {
      id: '1',
      name: 'Project Pulse',
      description: 'A next-gen project management tool to keep your development lifecycle on track.',
      lastUpdated: '2 days ago',
    },
    {
      id: '2',
      name: 'Website Redesign',
      description: 'A complete overhaul of the corporate website and branding.',
      lastUpdated: '5 days ago',
    },
  ];

  return (
    <>
      <div className="flex flex-col min-h-screen bg-background">
        <header className="sticky top-0 z-20 bg-background/90 backdrop-blur-sm border-b">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <ProjectPulseLogo />
                <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  Your Projects
                </h1>
              </div>
              <div className="flex items-center gap-4">
                <Button className="gap-2">
                  <PlusCircle />
                  <span className="hidden sm:inline">Create Project</span>
                </Button>
                {user && (
                  <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                          <UserAvatar name={user.displayName || user.email || 'User'} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                          <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{user.displayName || 'My Account'}</p>
                            <p className="text-xs leading-none text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setIsProfileDialogOpen(true)}>
                            <UserIcon className="mr-2 h-4 w-4" />
                            <span>Edit Profile</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => auth.signOut()}>
                          <LogOut className="mr-2 h-4 w-4" />
                          <span>Log out</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                )}
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {projects.map((project) => (
              <Link href={`/projects/${project.id}`} key={project.id} className="block hover:no-underline">
                <Card className="hover:shadow-lg hover:-translate-y-1 transition-all h-full flex flex-col">
                  <CardHeader>
                    <CardTitle>{project.name}</CardTitle>
                    <CardDescription>{project.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow"></CardContent>
                  <div className="p-4 pt-0 text-xs text-muted-foreground">
                      Last updated {project.lastUpdated}
                  </div>
                </Card>
              </Link>
            ))}
            <Card className="border-dashed border-2 hover:border-primary hover:text-primary transition-colors flex items-center justify-center min-h-[200px] cursor-pointer">
                <div className="text-center">
                  <PlusCircle className="mx-auto h-10 w-10 text-muted-foreground" />
                  <p className="mt-2 font-semibold">Create New Project</p>
                </div>
              </Card>
          </div>
        </main>
      </div>
      <ProfileDialog isOpen={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen} />
    </>
  );
}
