
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
import { INITIAL_TASKS } from '@/lib/constants';
import { Progress } from '@/components/ui/progress';
import { collection, query, where, getDocs, addDoc, serverTimestamp, writeBatch, doc, getDoc, setDoc, deleteDoc, runTransaction } from 'firebase/firestore';
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
  
  const DATA_VERSION = 2; // Increment this to force a re-seed for all users.

  const seedInitialData = useCallback(async (userId: string) => {
    try {
        await runTransaction(db, async (transaction) => {
            const userStateRef = doc(db, 'userStates', userId);
            const userStateSnap = await transaction.get(userStateRef);

            // Check if seeding is needed
            if (userStateSnap.exists() && userStateSnap.data()?.dataVersion >= DATA_VERSION) {
                return; // Seeding not needed
            }

            // 1. Create "Project Pulse" project
            const projectRef = doc(collection(db, 'users', userId, 'projects'));
            transaction.set(projectRef, {
                name: 'Project Pulse',
                description: 'A next-gen project management tool to keep your development lifecycle on track.',
                createdAt: serverTimestamp(),
                ownerId: userId,
            });

            // 2. Add initial tasks to the project
            INITIAL_TASKS.forEach(task => {
                const taskRef = doc(collection(db, 'users', userId, 'projects', projectRef.id, 'tasks'));
                const taskData = {
                  ...task,
                  startDate: task.startDate.toISOString(),
                  endDate: task.endDate.toISOString(),
                };
                // @ts-ignore
                delete taskData.id;
                transaction.set(taskRef, taskData);
            });

            // 3. Update user state to mark as seeded
            transaction.set(userStateRef, { hasBeenSeeded: true, dataVersion: DATA_VERSION });
        });
    } catch (error) {
        console.error("Error in seeding transaction: ", error);
        toast({
            variant: 'destructive',
            title: 'Setup Error',
            description: 'Could not initialize your account with sample data.'
        });
    }
}, [toast]);


  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
        await seedInitialData(user.uid);
        
        const projectsQuery = query(collection(db, 'users', user.uid, 'projects'));
        const querySnapshot = await getDocs(projectsQuery);
        
        const projectsDataPromises = querySnapshot.docs.map(async (doc) => {
            const projectData = doc.data();
            
            const tasksRef = collection(db, 'users', user.uid, 'projects', doc.id, 'tasks');
            const tasksSnapshot = await getDocs(tasksRef);
            const taskCount = tasksSnapshot.size;
            const completedTaskCount = tasksSnapshot.docs.filter(d => d.data().status === 'Completed').length;
            
            return {
                id: doc.id,
                name: projectData.name,
                description: projectData.description,
                lastUpdated: projectData.createdAt, // Or a more dynamic field if you add one
                taskCount,
                completedTaskCount
            };
        });

        const fetchedProjects = await Promise.all(projectsDataPromises);
        setProjects(fetchedProjects);
    } catch (error) {
        console.error("Error loading projects: ", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to load projects. Please try again later.'
        });
    } finally {
        setLoading(false);
    }
  }, [user, toast, seedInitialData]);

  useEffect(() => {
    if (!authLoading && user) {
      loadData();
    }
  }, [authLoading, user, loadData]);


  const handleCreateProject = async (project: { name: string; description: string }) => {
    if (!user) return;

    try {
        const docRef = await addDoc(collection(db, "users", user.uid, "projects"), {
          ...project,
          createdAt: serverTimestamp(),
          ownerId: user.uid,
        });

        const newProject: Project = {
          ...project,
          id: docRef.id,
          lastUpdated: new Date(),
          taskCount: 0,
          completedTaskCount: 0,
        };
        setProjects(prev => [...prev, newProject]);
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
        await deleteDoc(doc(db, 'users', user.uid, 'projects', projectToDelete.id));

        const updatedProjects = projects.filter(p => p.id !== projectToDelete.id);
        setProjects(updatedProjects);
        
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
          <header className="sticky top-0 z-20 bg-background/90 backdrop-blur-sm border-b">
            <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-start gap-3">
                <ProjectPulseLogo />
                <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  Your Projects
                </h1>
              </div>
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
          </main>
        </div>
        <ProfileDialog isOpen={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen} />
        <CreateProjectDialog isOpen={isCreateProjectDialogOpen} onOpenChange={setIsCreateProjectDialogOpen} onSave={handleCreateProject} />
        <DeleteProjectDialog isOpen={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen} onConfirm={handleConfirmDelete} />
      </SidebarInset>
    </SidebarProvider>
  );
}
