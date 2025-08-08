

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
import { collection, query, where, getDocs, addDoc, serverTimestamp, deleteDoc, onSnapshot, doc, getDoc, collectionGroup, writeBatch, limit } from 'firebase/firestore';
import { LoaderCircle } from 'lucide-react';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { ProjectsSidebar } from '@/components/app/projects-sidebar';
import { useTheme } from 'next-themes';
import { Task, Priority, Status } from '@/lib/types';
import { PHASES } from '@/lib/constants';

interface Project {
  id: string;
  name: string;
  description: string;
  lastUpdated: any;
  taskCount: number;
  completedTaskCount: number;
  ownerId: string;
}

const dummyTasks: Omit<Task, 'id' | 'startDate' | 'endDate'>[] = [
    { name: 'Define MVP Features', description: 'Outline the minimum viable product features for initial launch.', assignedTo: 'Alice', phase: PHASES[0], priority: 'High', status: 'Completed', percentComplete: 100, estimatedHours: 16 },
    { name: 'Write Software Requirements Specification', description: 'Create the detailed SRS document covering all functional and non-functional requirements.', assignedTo: 'Alice', phase: PHASES[1], priority: 'High', status: 'Completed', percentComplete: 100, estimatedHours: 24 },
    { name: 'Create Wireframes for Core App Flow', description: 'Develop low-fidelity wireframes for the main user journeys.', assignedTo: 'Bob', phase: PHASES[2], priority: 'High', status: 'In Progress', percentComplete: 75, estimatedHours: 30 },
    { name: 'Design High-Fidelity Mockups', description: 'Produce high-fidelity mockups in Figma based on the approved wireframes.', assignedTo: 'Bob', phase: PHASES[2], priority: 'Medium', status: 'To Do', percentComplete: 0, estimatedHours: 40 },
    { name: 'Design Database Schema', description: 'Define the database tables, relationships, and data types.', assignedTo: 'Charlie', phase: PHASES[3], priority: 'High', status: 'Completed', percentComplete: 100, estimatedHours: 20 },
    { name: 'Setup Authentication API', description: 'Implement user registration, login, and session management endpoints.', assignedTo: 'Charlie', phase: PHASES[4], priority: 'High', status: 'In Progress', percentComplete: 90, estimatedHours: 32 },
    { name: 'Develop Project CRUD API', description: 'Create the API endpoints for creating, reading, updating, and deleting projects.', assignedTo: 'Charlie', phase: PHASES[4], priority: 'Medium', status: 'To Do', percentComplete: 0, estimatedHours: 24 },
    { name: 'Build Reusable Button Component', description: 'Create a flexible and themeable Button component in React.', assignedTo: 'Dave', phase: PHASES[5], priority: 'High', status: 'Blocked', percentComplete: 20, estimatedHours: 8, notes: "Waiting on final design system colors from Bob." },
    { name: 'Implement Project Dashboard UI', description: 'Develop the main project dashboard page with task columns.', assignedTo: 'Dave', phase: PHASES[5], priority: 'Medium', status: 'To Do', percentComplete: 0, estimatedHours: 40 },
    { name: 'Conduct Usability Testing with Beta Users', description: 'Organize and run usability testing sessions with a select group of beta testers.', assignedTo: 'Eve', phase: PHASES[6], priority: 'Medium', status: 'To Do', percentComplete: 0, estimatedHours: 24 },
    { name: 'Write E2E Tests for Authentication', description: 'Use Cypress to write end-to-end tests for the login and signup flows.', assignedTo: 'Frank', phase: PHASES[7], priority: 'Low', status: 'To Do', percentComplete: 0, estimatedHours: 16 },
    { name: 'Configure Staging Environment on Firebase', description: 'Set up the Firebase hosting and Firestore rules for the staging environment.', assignedTo: 'Grace', phase: PHASES[8], priority: 'High', status: 'To Do', percentComplete: 0, estimatedHours: 12 },
];


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

  // --- Start of Dummy Data Seeding ---
  useEffect(() => {
    const seedData = async () => {
      if (!user) return;

      const projectName = "PhotonXR";
      const projectQuery = query(collection(db, "projects"), where("name", "==", projectName), limit(1));
      const projectSnapshot = await getDocs(projectQuery);

      if (projectSnapshot.empty) {
        console.log(`Project "${projectName}" not found. Cannot seed data.`);
        return;
      }
      
      const projectDoc = projectSnapshot.docs[0];
      const projectId = projectDoc.id;

      const tasksCollectionRef = collection(db, 'projects', projectId, 'tasks');
      const tasksSnapshot = await getDocs(tasksCollectionRef);

      if (tasksSnapshot.size > 0) {
        console.log(`Project "${projectName}" already has tasks. Skipping seed.`);
        return;
      }

      console.log(`Seeding data for project "${projectName}"...`);
      const batch = writeBatch(db);

      dummyTasks.forEach((task, index) => {
        const newTaskRef = doc(tasksCollectionRef); // Create a new doc with a random ID
        const startDate = new Date();
        const endDate = new Date();
        startDate.setDate(startDate.getDate() + index * 2);
        endDate.setDate(endDate.getDate() + index * 2 + 5);

        batch.set(newTaskRef, {
            ...task,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            createdAt: serverTimestamp()
        });
      });

      try {
        await batch.commit();
        toast({ title: 'Data Seeded', description: `Dummy tasks added to "${projectName}".`});
      } catch (error) {
        console.error("Error seeding data: ", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to seed dummy data.'});
      }
    };

    if(!authLoading) {
        seedData();
    }
  }, [user, authLoading, toast]);
  // --- End of Dummy Data Seeding ---

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
          <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-muted/40">
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
                <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto text-center rounded-lg border-2 border-dashed p-12 bg-background">
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
