
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, User as UserIcon, Filter, Search, Sun, Moon } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { auth } from '@/lib/firebase';
import { UserAvatar } from './user-avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { ProfileDialog } from './profile-dialog';
import { Input } from '../ui/input';
import { useTheme } from 'next-themes';

interface MainHeaderProps {
    title: string;
    showSearch?: boolean;
    searchTerm?: string;
    onSearchChange?: (value: string) => void;
}

export function MainHeader({ title, showSearch = false, searchTerm, onSearchChange }: MainHeaderProps) {
  const { user } = useAuth();
  const { setTheme } = useTheme();
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);

  return (
    <>
      <header className="flex-shrink-0 bg-background/90 backdrop-blur-sm border-b z-10">
        <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold">{title}</h1>
            <div className="flex items-center gap-2">
                {showSearch && (
                    <>
                        <Button variant="outline">
                            <Filter className="mr-2 h-4 w-4" />
                            Filters
                        </Button>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Subject or reference" 
                                className="pl-8" 
                                value={searchTerm}
                                onChange={(e) => onSearchChange?.(e.target.value)}
                            />
                        </div>
                    </>
                )}
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
