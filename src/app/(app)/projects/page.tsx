
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, PlusCircle, User as UserIcon, Trash2 } from 'lucide-react';
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
import { useCallback, useEffect, useState } from 'react';
import { ProfileDialog } from '@/components/app/profile-dialog';
import { CreateProjectDialog } from '@/components/app/create-project-dialog';
import { DeleteProjectDialog } from '@/components/app/delete-project-dialog';
import { useToast } from '@/hooks/use-toast';
import { Task } from '@/lib/types';
import { INITIAL_TASKS } from '@/lib/constants';
import { Progress } from '@/components/ui/progress';

interface Project {
  id: string;
  name: string;
  description: string;
  lastUpdated: string;
}

const initialProjects: Project[] = [
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


export default function ProjectsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isCreateProjectDialogOpen, setIsCreateProjectDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Record<string, Task[]>>({});

  const loadData = useCallback(() => {
    let allProjects: Project[];
    try {
      const savedProjects = localStorage.getItem('project-pulse-projects');
      allProjects = savedProjects ? JSON.parse(savedProjects) : initialProjects;
    } catch (error) {
        console.error("Failed to parse projects from localStorage", error);
        allProjects = initialProjects;
        localStorage.removeItem('project-pulse-projects');
    }
    setProjects(allProjects);

    if (!localStorage.getItem('project-pulse-tasks-1')) {
      localStorage.setItem('project-pulse-tasks-1', JSON.stringify(INITIAL_TASKS));
    }

    const allTasks: Record<string, Task[]> = {};
    allProjects.forEach(project => {
        try {
            const savedTasks = localStorage.getItem(`project-pulse-tasks-${project.id}`);
            allTasks[project.id] = savedTasks ? JSON.parse(savedTasks) : [];
        } catch (error) {
            console.error(`Failed to parse tasks for project ${project.id}`, error);
            allTasks[project.id] = [];
            localStorage.removeItem(`project-pulse-tasks-${project.id}`);
        }
    });
    setTasks(allTasks);
  }, []);

  useEffect(() => {
    loadData();

    // Reload data when the window gets focus to ensure progress is up-to-date
    const handleFocus = () => loadData();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadData]);


  const handleCreateProject = (project: { name: string; description: string }) => {
    const newProject = {
      ...project,
      id: new Date().toISOString(), // Use a more unique ID
      lastUpdated: 'Just now',
    };
    const updatedProjects = [...projects, newProject];
    setProjects(updatedProjects);
    
    // Persist new project list immediately
    localStorage.setItem('project-pulse-projects', JSON.stringify(updatedProjects));
    // Initialize empty tasks for the new project
    localStorage.setItem(`project-pulse-tasks-${newProject.id}`, JSON.stringify([]));

    // Reload all data to ensure consistency
    loadData();

    toast({ title: 'Project Created', description: `"${project.name}" has been successfully created.`});
  };

  const handleDeleteRequest = (e: React.MouseEvent, project: Project) => {
    e.preventDefault();
    e.stopPropagation();
    setProjectToDelete(project);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (projectToDelete) {
      // Delete tasks associated with the project
      localStorage.removeItem(`project-pulse-tasks-${projectToDelete.id}`);
      
      // Delete the project itself
      const updatedProjects = projects.filter(p => p.id !== projectToDelete.id);
      setProjects(updatedProjects);
      
      // Persist the updated project list
      localStorage.setItem('project-pulse-projects', JSON.stringify(updatedProjects));
      
      toast({ title: 'Project Deleted', description: `"${projectToDelete?.name}" has been deleted.`});
      setProjectToDelete(null);
      setIsDeleteDialogOpen(false);

      // Reload data to ensure UI is in sync
      loadData();
    }
  };

  const getProjectProgress = (projectId: string) => {
    const projectTasks = tasks[projectId] || [];
    if (projectTasks.length === 0) return 0;

    const totalProgress = projectTasks.reduce((acc, task) => acc + (task.percentComplete || 0), 0);
    const averageProgress = Math.round(totalProgress / projectTasks.length);
    return isNaN(averageProgress) ? 0 : averageProgress;
  }
  

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
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {projects.map((project) => {
              const progress = getProjectProgress(project.id);
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
                        Last updated {project.lastUpdated}
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
    </>
  );
}
