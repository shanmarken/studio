
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
import { LogOut, Settings, LayoutDashboard, BarChart3, ChevronsRightLeft, User, Building, ClipboardList, Calendar } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { auth, db } from '@/lib/firebase';
import { UserAvatar } from './user-avatar';
import { useEffect, useState } from 'react';
import { collection, query, onSnapshot, doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface Project {
  id: string;
  name: string;
}

interface ProjectSidebarProps {
  projectId: string;
}

export function ProjectSidebar({ projectId }: ProjectSidebarProps) {
  const { user } = useAuth();
  const { state: sidebarState } = useSidebar();
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const pathname = usePathname();
  
  const isExpanded = sidebarState === 'expanded';

  useEffect(() => {
    if (user) {
      const q = query(collection(db, 'users', user.uid, 'projects'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project)));
      });
      return () => unsubscribe();
    }
  }, [user]);

  useEffect(() => {
    if (user && projectId) {
      const docRef = doc(db, 'users', user.uid, 'projects', projectId);
      const unsub = onSnapshot(docRef, (doc) => {
        if (doc.exists()) {
          setCurrentProject({ id: doc.id, ...doc.data() } as Project);
        }
      });
      return () => unsub();
    }
  }, [user, projectId]);
  
  return (
    <>
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
            <ProjectPulseLogo />
            {isExpanded && <h1 className="font-semibold text-lg">Project Pulse</h1>}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
            <SidebarMenuItem>
                 <div className="w-full flex flex-col gap-1 p-2 border-b">
                    <div className="text-xs text-muted-foreground font-semibold px-2">
                        {isExpanded ? "Current Project" : "Project"}
                    </div>
                    <Button variant="ghost" className="w-full justify-start gap-2 p-2 h-auto">
                        <div className="flex items-center justify-between w-full">
                           <span className="truncate">{currentProject?.name || 'Loading...'}</span>
                           {isExpanded && <ChevronsRightLeft className="h-4 w-4 text-muted-foreground"/>}
                        </div>
                    </Button>
                </div>
            </SidebarMenuItem>

            <SidebarMenuItem className="mt-2">
                 <Link href={`/projects/${projectId}`} className="block w-full">
                    <SidebarMenuButton tooltip="Dashboard" isActive={pathname.endsWith(`/projects/${projectId}`)}>
                        <LayoutDashboard />
                        <span>Dashboard</span>
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
                <Link href="/calendar" className="block w-full">
                    <SidebarMenuButton tooltip="Calendar" isActive={pathname.includes('/calendar')}>
                        <Calendar />
                        <span>Calendar</span>
                    </SidebarMenuButton>
                </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton tooltip="Analytics">
                    <BarChart3 />
                    <span>Analytics</span>
                </SidebarMenuButton>
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
        <div className="w-full p-2 border-t">
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
