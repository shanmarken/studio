
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, PlusCircle, User as UserIcon, Trash2, Sun, Moon } from 'lucide-react';
import Link from 'next/link';
import { ProjectPulseLogo } from '@/components/app/project-pulse-logo';
import { useAuth } from '@/hooks/use-auth';
import { auth, db } from '@/lib/firebase';
import { UserAvatar } from '@/components/app/user-avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent
} from "@/components/ui/dropdown-menu"
import { useEffect, useState } from 'react';
import { ProfileDialog } from '@/components/app/profile-dialog';
import { CreateProjectDialog } from '@/components/app/create-project-dialog';
import { DeleteProjectDialog } from '@/components/app/delete-project-dialog';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { collection, query, where, getDocs, addDoc, serverTimestamp, deleteDoc, onSnapshot, doc, getDoc, collectionGroup } from 'firebase/firestore';
import { LoaderCircle } from 'lucide-react';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { ProjectsSidebar } from '@/components/app/projects-sidebar';
import { useTheme } from 'next-themes';

interface Project {
  id: string;
  name: string;
  description: string;
  lastUpdated: any;
  taskCount: number;
  completedTaskCount: number;
  ownerId: string;
}


export default function ProjectsPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { setTheme } = useTheme();
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isCreateProjectDialogOpen, setIsCreateProjectDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }
    if (!user) {
      setLoading(false);
      return;
    }
  
    setLoading(true);
    
    const projectsQuery = query(collection(db, 'projects'));
    
    const unsubscribe = onSnapshot(projectsQuery, (projectsSnapshot) => {
        const allProjects = projectsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Project));
  
        if (allProjects.length === 0) {
            setProjects([]);
            setLoading(false);
            return;
        }
  
        const projectsWithTasks: Project[] = [];
        const unsubscribes: (() => void)[] = [];
        let projectsProcessed = 0;
  
        allProjects.forEach(project => {
            const tasksPath = `projects/${project.id}/tasks`;
            const tasksRef = collection(db, tasksPath);
  
            const taskUnsubscribe = onSnapshot(tasksRef, (tasksSnapshot) => {
                const taskCount = tasksSnapshot.size;
                const completedTaskCount = tasksSnapshot.docs.filter(d => d.data().status === 'Completed').length;
                
                const existingProjectIndex = projectsWithTasks.findIndex(p => p.id === project.id);
                if (existingProjectIndex > -1) {
                    projectsWithTasks[existingProjectIndex] = { ...projectsWithTasks[existingProjectIndex], taskCount, completedTaskCount };
                } else {
                    projectsWithTasks.push({ ...project, taskCount, completedTaskCount });
                }
  
                setProjects([...projectsWithTasks]);

                if (!project.hasOwnProperty('taskCount')) {
                    projectsProcessed++;
                }

                if (projectsProcessed === allProjects.length) {
                    setLoading(false);
                }
            }, (error) => {
                console.error(`Error loading tasks for project ${project.id}: `, error);
            });
            unsubscribes.push(taskUnsubscribe);
        });
        
        return () => {
            unsubscribes.forEach(unsub => unsub());
        };
  
    }, (error) => {
        console.error("Error loading projects: ", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load projects."
        });
        setLoading(false);
    });
  
    return () => unsubscribe();
  
  }, [user, authLoading, toast]);


  const handleCreateProject = async (project: { name: string; description: string }) => {
    if (!user) return;

    try {
        const projectsCollectionPath = `projects`;
        const projectData = {
          ...project,
          createdAt: serverTimestamp(),
          ownerId: user.uid,
        };

        await addDoc(collection(db, projectsCollectionPath), projectData);
        
        toast({ title: 'Project Created', description: `"${project.name}" has been successfully created.`});
    } catch (error) {
        console.error("Error creating project: ", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to create project.'
        });
    }
  };

  const handleDeleteRequest = (e: React.MouseEvent, project: Project) => {
    e.preventDefault();
    e.stopPropagation();
    setProjectToDelete(project);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete || !user) return;
    
    try {
        const projectRef = doc(db, 'projects', projectToDelete.id);
        await deleteDoc(projectRef);
        
        toast({ title: 'Project Deleted', description: `"${projectToDelete?.name}" has been deleted.`});
    } catch (error) {
        console.error("Error deleting project: ", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to delete project.'
        });
    } finally {
        setProjectToDelete(null);
        setIsDeleteDialogOpen(false);
    }
  };

  const getProjectProgress = (project: Project) => {
    if (!project.taskCount || project.taskCount === 0) return 0;
    return Math.round((project.completedTaskCount / project.taskCount) * 100);
  }
  
  const getFormattedDate = (lastUpdated: any) => {
    if (!lastUpdated) return 'Just now';
    if (lastUpdated.toDate) {
      return lastUpdated.toDate().toLocaleDateString();
    }
    if (lastUpdated instanceof Date) {
      return lastUpdated.toLocaleDateString();
    }
    return 'Just now';
  };
  

  if (loading || authLoading) {
      return (
        <div className="flex h-screen items-center justify-center">
            <div className="flex items-center space-x-2">
                <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                <span className="text-lg font-medium text-muted-foreground">Loading Projects...</span>
            </div>
        </div>
      )
  }

  return (
    <SidebarProvider>
      <ProjectsSidebar />
      <SidebarInset>
        <div className="flex flex-col min-h-screen bg-background">
          <header className="sticky top-0 z-10 bg-background/90 backdrop-blur-sm border-b">
            <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
              <h1 className="text-2xl font-bold">Projects</h1>
              <div className="flex items-center gap-2">
                <Button className="gap-2" onClick={() => setIsCreateProjectDialogOpen(true)}>
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
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            {projects.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {projects.map((project) => {
                    const progress = getProjectProgress(project);
                    return (
                    <Link href={`/projects/${project.id}`} key={project.id} className="block hover:no-underline group/card">
                        <Card className="hover:shadow-lg hover:-translate-y-1 transition-all h-full flex flex-col relative">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute top-2 right-2 h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive opacity-50 group-hover/card:opacity-100 transition-opacity"
                            onClick={(e) => handleDeleteRequest(e, project)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                        <CardHeader>
                            <CardTitle>{project.name}</CardTitle>
                            <CardDescription>{project.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow space-y-2">
                            <div className="flex items-center gap-2">
                                <Progress value={progress} className="h-2" />
                                <span className="text-xs font-mono">{progress}%</span>
                            </div>
                        </CardContent>
                        <div className="p-4 pt-0 text-xs text-muted-foreground">
                            Last updated {getFormattedDate(project.lastUpdated)}
                        </div>
                        </Card>
                    </Link>
                    );
                })}
                 <Card 
                    className="border-dashed border-2 hover:border-primary hover:text-primary transition-colors flex items-center justify-center min-h-[200px] cursor-pointer"
                    onClick={() => setIsCreateProjectDialogOpen(true)}
                >
                    <div className="text-center">
                        <PlusCircle className="mx-auto h-10 w-10 text-muted-foreground" />
                        <p className="mt-2 font-semibold">Create New Project</p>
                    </div>
                </Card>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto text-center rounded-lg border-2 border-dashed p-12">
                    <ProjectPulseLogo />
                    <h2 className="mt-6 text-xl font-semibold">Welcome to Project Pulse</h2>
                    <p className="mt-2 text-center text-muted-foreground">
                        Your workspace is ready. Get started by creating your first project.
                    </p>
                    <Button className="mt-6" onClick={() => setIsCreateProjectDialogOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Your First Project
                    </Button>
                </div>
            )}
          </main>
        </div>
        <ProfileDialog isOpen={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen} />
        <CreateProjectDialog isOpen={isCreateProjectDialogOpen} onOpenChange={setIsCreateProjectDialogOpen} onSave={handleCreateProject} />
        <DeleteProjectDialog isOpen={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen} onConfirm={handleConfirmDelete} projectToDelete={projectToDelete} />
      </SidebarInset>
    </SidebarProvider>
  );
}
