
'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { ProjectPulseLogo } from './project-pulse-logo';
import { Button } from '../ui/button';
import { LogOut, Settings, FolderKanban, PanelLeft, User, Building, ClipboardList } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { auth } from '@/lib/firebase';
import { UserAvatar } from './user-avatar';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';

export function ProjectsSidebar() {
  const { user } = useAuth();
  const { state: sidebarState, isMobile, toggleSidebar } = useSidebar();
  const pathname = usePathname();
  
  const isExpanded = sidebarState === 'expanded';

  return (
    <>
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <ProjectPulseLogo />
                {isExpanded && <h1 className="font-semibold text-lg">Project Pulse</h1>}
            </div>
            <div className="flex items-center">
              {isMobile && (
                <Button variant="ghost" size="icon" onClick={toggleSidebar} className="h-7 w-7">
                  <PanelLeft />
                </Button>
              )}
            </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
            <SidebarMenuItem>
                 <Link href="/projects" className="block w-full">
                    <SidebarMenuButton tooltip="Projects" isActive={pathname.includes('/projects')}>
                        <FolderKanban />
                        <span>Projects</span>
                    </SidebarMenuButton>
                </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
                 <Link href="/mytasks" className="block w-full">
                    <SidebarMenuButton tooltip="My Tasks" isActive={pathname.includes('/mytasks')}>
                        <ClipboardList />
                        <span>My Tasks</span>
                    </SidebarMenuButton>
                </Link>
            </SidebarMenuItem>
             <SidebarMenuItem>
                <Link href="/settings" className="block w-full">
                    <SidebarMenuButton tooltip="Settings" isActive={pathname.includes('/settings')}>
                        <Settings />
                        <span>Settings</span>
                    </SidebarMenuButton>
                </Link>
            </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <div className="w-full p-2 border-t border-sidebar-border">
            {user && (
                 <div className="flex items-center gap-2">
                    <UserAvatar name={user.displayName || user.email || ''} />
                    {isExpanded && (
                        <div className="flex-1 flex flex-col truncate">
                            <span className="font-semibold text-sm truncate">{user.displayName}</span>
                            <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                        </div>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => auth.signOut()}>
                        <LogOut className="size-4" />
                    </Button>
                </div>
            )}
        </div>
      </SidebarFooter>
    </Sidebar>
    </>
  );
}
