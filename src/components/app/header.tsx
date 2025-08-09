
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, PlusCircle, ArrowLeft, LogOut, User as UserIcon, Moon, Sun, GitBranch, ChevronsUpDown } from 'lucide-react';
import { ProjectPulseLogo } from './project-pulse-logo';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { auth, db } from '@/lib/firebase';
import { UserAvatar } from './user-avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { ProfileDialog } from './profile-dialog';
import { useTheme } from 'next-themes';
import { Release } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"


type HeaderProps = {
  projectName: string;
  onAddTask: () => void;
  onExport: () => void;
  releases: Release[];
  selectedRelease: string | null;
  onSelectRelease: (releaseId: string) => void;
  onManageReleases: () => void;
};

export function Header({ projectName, onAddTask, onExport, releases, selectedRelease, onSelectRelease, onManageReleases }: HeaderProps) {
  const { user } = useAuth();
  const { setTheme } = useTheme();
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-20 bg-background/90 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <Link href="/projects" className="flex items-center gap-2 text-foreground hover:no-underline">
                  <ArrowLeft className="h-5 w-5 md:hidden" />
                  <ProjectPulseLogo />
              </Link>
              <div className="flex flex-col">
                  <Link href="/projects" className="text-xs text-muted-foreground hidden md:block hover:underline">Dashboard</Link>
                  <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
                    {projectName || "Project Dashboard"}
                  </h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedRelease || ''} onValueChange={onSelectRelease}>
                <SelectTrigger className="w-[180px]">
                  <GitBranch className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Select a release" />
                </SelectTrigger>
                <SelectContent>
                  {releases.map(release => (
                    <SelectItem key={release.id} value={release.id}>{release.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={onManageReleases}>Manage Releases</Button>
              <Button onClick={onAddTask} className="gap-2">
                <PlusCircle />
                <span className="hidden sm:inline">Add Task</span>
              </Button>
              <Button onClick={onExport} variant="outline" className="gap-2">
                <FileDown />
                <span className="hidden sm:inline">Export</span>
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
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            <Sun className="h-4 w-4 mr-2 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                            <Moon className="absolute h-4 w-4 mr-2 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                            <span>Toggle theme</span>
                          </DropdownMenuSubTrigger>
                          <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                              <DropdownMenuItem onClick={() => setTheme("light")}>
                                Light
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setTheme("dark")}>
                                Dark
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setTheme("system")}>
                                System
                              </DropdownMenuItem>
                            </DropdownMenuSubContent>
                          </DropdownMenuPortal>
                        </DropdownMenuSub>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => auth.signOut()}>
                          <LogOut className="mr-2 h-4 w-4" />
                          <span>Log out</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
          </div>
      </header>
      <ProfileDialog isOpen={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen} />
    </>
  );
}
