
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, PlusCircle, User as UserIcon, Trash2 } from 'lucide-react';
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
} from "@/components/ui/dropdown-menu"
import { useCallback, useEffect, useState } from 'react';
import { ProfileDialog } from '@/components/app/profile-dialog';
import { CreateProjectDialog } from '@/components/app/create-project-dialog';
import { DeleteProjectDialog } from '@/components/app/delete-project-dialog';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { collection, query, where, getDocs, addDoc, serverTimestamp, deleteDoc, onSnapshot, doc, getDoc, collectionGroup } from 'firebase/firestore';
import { LoaderCircle } from 'lucide-react';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { ProjectsSidebar } from '@/components/app/projects-sidebar';

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
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isCreateProjectDialogOpen, setIsCreateProjectDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
        if (!authLoading) {
            setLoading(false);
        }
        return;
    };

    setLoading(true);
    
    const fetchProjects = async (projectsQuery: any) => {
        return new Promise<Project[]>((resolve, reject) => {
            const unsubscribe = onSnapshot(projectsQuery, async (querySnapshot) => {
                const projectsDataPromises = querySnapshot.docs.map(async (projectDoc) => {
                    const projectData = projectDoc.data();
                    const ownerId = projectData.ownerId;
                    if (!ownerId) return null;

                    const tasksPath = `users/${ownerId}/projects/${projectDoc.id}/tasks`;
                    const tasksRef = collection(db, tasksPath);
                    
                    // Use a snapshot listener for tasks to get realtime updates
                    return new Promise<Project | null>((taskResolve) => {
                        onSnapshot(tasksRef, (tasksSnapshot) => {
                            const taskCount = tasksSnapshot.size;
                            const completedTaskCount = tasksSnapshot.docs.filter(d => d.data().status === 'Completed').length;
                            
                            taskResolve({
                                id: projectDoc.id,
                                name: projectData.name,
                                description: projectData.description,
                                lastUpdated: projectData.createdAt,
                                taskCount,
                                completedTaskCount,
                                ownerId: ownerId,
                            });
                        }, (error) => {
                            console.error(`Error loading tasks for project ${projectDoc.id}:`, error);
                            // Resolve with partial data if tasks fail to load
                            taskResolve({
                                id: projectDoc.id,
                                name: projectData.name,
                                description: projectData.description,
                                lastUpdated: projectData.createdAt,
                                taskCount: 0,
                                completedTaskCount: 0,
                                ownerId: ownerId,
                            });
                        });
                    });
                });

                const fetchedProjects = (await Promise.all(projectsDataPromises)).filter(p => p !== null) as Project[];
                resolve(fetchedProjects);
                // Note: We don't return the unsubscribe function from here because we need to manage multiple subscriptions.
            }, (error) => {
                console.error("Error loading projects: ", error);
                reject(error);
            });
            // We need a way to group and call all unsubscribe functions.
            // For now, this listener will be active for the component's life.
        });
    };

    const loadAllProjects = async () => {
        let allProjects: Project[] = [];
        
        // 1. Fetch user's own projects
        const myProjectsQuery = query(collection(db, `users/${user.uid}/projects`));
        const myProjects = await fetchProjects(myProjectsQuery);
        allProjects = [...myProjects];

        // 2. If admin, fetch all other projects
        if (user.role === 'admin') {
            const allProjectsQuery = query(collectionGroup(db, 'projects'));
            const allOtherProjects = await fetchProjects(allProjectsQuery);
            allProjects = [...allProjects, ...allOtherProjects];
        }

        // 3. De-duplicate projects
        const uniqueProjects = Array.from(new Map(allProjects.map(p => [p.id, p])).values());
        
        setProjects(uniqueProjects);
        setLoading(false);
    };

    loadAllProjects().catch(error => {
        setLoading(false);
        console.error("Failed to load project data", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load projects. Check console for details."
        });
    });

}, [user, authLoading, toast]);


  const handleCreateProject = async (project: { name: string; description: string }) => {
    if (!user) return;

    try {
        const projectsCollectionPath = `users/${user.uid}/projects`;
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
    
    // Admins can delete any project, others can only delete their own.
    const ownerId = projectToDelete.ownerId || user.uid;
    if (user.role !== 'admin' && ownerId !== user.uid) {
        toast({ variant: 'destructive', title: 'Error', description: 'You do not have permission to delete this project.' });
        return;
    }

    try {
        const projectRef = doc(db, `users/${ownerId}/projects`, projectToDelete.id);
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
    if (project.taskCount === 0) return 0;
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
