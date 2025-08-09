

'use client';

import { useEffect, useState, useMemo } from 'react';
import { collection, query, where, getDoc, onSnapshot, doc, updateDoc, deleteDoc, addDoc, serverTimestamp, collectionGroup } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { Task, Status } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoaderCircle, Filter, Search, ChevronsRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useToast } from '@/hooks/use-toast';
import { DeleteTaskDialog } from './delete-task-dialog';
import { PromoteTaskDialog } from './promote-task-dialog';
import { SuggestUpdateDialog } from './suggest-update-dialog';
import { TaskDialog } from './task-dialog';
import { TaskCard } from './task-card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';


const STATUS_COLUMNS: Status[] = ['To Do', 'In Progress', 'Testing', 'Completed', 'Blocked'];

interface TaskWithProject extends Task {
  projectName: string;
  projectId: string;
  releaseName?: string;
}

interface MyTasksClientProps {
    searchTerm: string;
}

export function MyTasksClient({ searchTerm }: MyTasksClientProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<TaskWithProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsedColumns, setCollapsedColumns] = useState<Record<Status, boolean>>({
    'To Do': false,
    'In Progress': false,
    'Testing': false,
    Completed: true,
    Blocked: false,
  });

  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [isSuggestDialogOpen, setIsSuggestDialogOpen] = useState(false);
  const [taskToSuggest, setTaskToSuggest] = useState<Task | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isPromoteDialogOpen, setIsPromoteDialogOpen] = useState(false);
  const [taskToPromote, setTaskToPromote] = useState<Task | null>(null);
  const [defaultTaskDialogTab, setDefaultTaskDialogTab] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }
    
    setLoading(true);

    const tasksQuery = query(
      collectionGroup(db, 'tasks'),
      where('assignedToId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(tasksQuery, async (tasksSnapshot) => {
      try {
        const tasksData = await Promise.all(
          tasksSnapshot.docs.map(async (taskDoc) => {
            const taskData = taskDoc.data();
            const projectRef = taskDoc.ref.parent.parent;
            if (!projectRef) return null;

            const projectSnap = await getDoc(projectRef);
            const projectName = projectSnap.exists() ? projectSnap.data()?.name : 'Unknown Project';
            
            let releaseName = '';
            if (taskData.releaseId) {
                const releaseRef = doc(db, 'projects', projectRef.id, 'releases', taskData.releaseId);
                const releaseSnap = await getDoc(releaseRef);
                if (releaseSnap.exists()) {
                    releaseName = releaseSnap.data()?.name;
                }
            }

            return {
              ...(taskData as Task),
              id: taskDoc.id,
              projectName: projectName,
              projectId: projectRef.id,
              releaseName: releaseName,
              startDate: new Date(taskData.startDate),
              endDate: new Date(taskData.endDate),
              comments: taskData.comments?.map((c: any) => ({...c, createdAt: new Date(c.createdAt)})) || []
            };
          })
        );
        
        setTasks(tasksData.filter(Boolean) as TaskWithProject[]);
      } catch (error) {
        console.error("Error processing tasks:", error);
        toast({ variant: 'destructive', title: 'Error', description: `Failed to load tasks.` });
      } finally {
        setLoading(false);
      }
    }, (error) => {
      console.error(`Error fetching tasks:`, error);
      toast({ variant: 'destructive', title: 'Error', description: `Failed to load tasks.` });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, toast]);


  const filteredTasks = useMemo(() => {
    return tasks.filter(task => 
        task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.projectName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tasks, searchTerm]);

  const tasksByStatus = useMemo(() => {
    return filteredTasks.reduce((acc, task) => {
        const status = task.status;
        if (!acc[status]) {
            acc[status] = [];
        }
        acc[status].push(task);
        return acc;
    }, {} as Record<Status, TaskWithProject[]>);
  }, [filteredTasks]);

  const statusColorMap: Record<Status, string> = {
    'To Do': 'bg-gray-500',
    'In Progress': 'bg-blue-500',
    'Testing': 'bg-purple-500',
    Completed: 'bg-green-500',
    Blocked: 'bg-red-500',
  };


  const handleEditTask = (task: Task, defaultTab?: string) => {
    setDefaultTaskDialogTab(defaultTab);
    setTaskToEdit(task);
    setIsTaskDialogOpen(true);
  };
  
  const handleDeleteRequest = (task: Task) => {
    setTaskToDelete(task);
    setIsDeleteDialogOpen(true);
  };

  const handleSuggestUpdate = (task: Task) => {
    setTaskToSuggest(task);
    setIsSuggestDialogOpen(true);
  }

  const handlePromoteRequest = (task: Task) => {
    setTaskToPromote(task);
    setIsPromoteDialogOpen(true);
  }

  const handleConfirmDelete = async () => {
    if (taskToDelete) {
        const taskName = taskToDelete.name;
        try {
            const projectId = (taskToDelete as TaskWithProject).projectId;
            const taskRef = doc(db, 'projects', projectId, 'tasks', taskToDelete.id);
            await deleteDoc(taskRef);
            toast({ title: 'Task Deleted', description: `"${taskName}" has been deleted.`});
        } catch (error) {
            console.error("Error deleting task: ", error);
            toast({ variant: 'destructive', title: "Error", description: "Failed to delete task." });
        }
      setTaskToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  };

    const handleSaveTask = async (task: Task) => {
        const isEditing = !!task.id && tasks.some(t => t.id === task.id);
        const taskName = task.name;
        const currentProjectId = task.projectId;

        if (!currentProjectId) {
            toast({ variant: 'destructive', title: "Error", description: "Project ID is missing." });
            return;
        }
        
        if (task.subTasks && task.subTasks.length > 0) {
            const completedCount = task.subTasks.filter(st => st.completed).length;
            const totalCount = task.subTasks.length;
            task.percentComplete = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : task.percentComplete;
        }

        const taskData: any = {
            ...task,
            startDate: task.startDate.toISOString(),
            endDate: task.endDate.toISOString(),
            dependencies: task.dependencies || '',
            notes: task.notes || '',
            comments: task.comments?.map(c => ({...c, createdAt: c.createdAt.toISOString()})) || []
        };
        
        delete taskData.id;
        delete taskData.projectId;

        try {
            if (isEditing) {
                const taskRef = doc(db, 'projects', currentProjectId, 'tasks', task.id);
                await updateDoc(taskRef, taskData);
                toast({ title: "Task Updated", description: `"${taskName}" has been successfully updated.` });
            } else {
               toast({ variant: 'destructive', title: "Error", description: "Cannot add new tasks from this view." });
            }
        } catch (error) {
            console.error("Error saving task: ", error);
            toast({ variant: 'destructive', title: "Error", description: "Failed to save task." });
        }
  };

  const handleConfirmPromote = async (task: Task, newPhase: string) => {
    const projectId = (task as TaskWithProject).projectId;
    const newTaskData: Omit<Task, 'id'> = {
        ...task,
        phase: newPhase,
        status: 'To Do',
        percentComplete: 0,
        subTasks: task.subTasks?.map(st => ({...st, completed: false})),
    };
    // @ts-ignore
    delete newTaskData.id; 

    try {
        await addDoc(collection(db, 'projects', projectId, 'tasks'), {
            ...newTaskData,
            startDate: newTaskData.startDate.toISOString(),
            endDate: newTaskData.endDate.toISOString(),
            createdAt: serverTimestamp(),
            promotedFrom: task.id
        });

        toast({
            title: 'Task Promoted',
            description: `A new task "${newTaskData.name}" was created in the ${newPhase} phase.`
        });
    } catch (error) {
        console.error("Error promoting task:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to promote task.' });
    }
  };

  const handleTaskCompleteToggle = async (taskId: string, isComplete: boolean) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const projectId = (task as TaskWithProject).projectId;
    const taskRef = doc(db, 'projects', projectId, 'tasks', taskId);
    let updateData: Partial<Task> = {};
    if (isComplete) {
      updateData = { status: 'Completed', percentComplete: 100 };
    } else {
      const newPercent = (task.subTasks && task.subTasks.length > 0) ? task.percentComplete : 0;
      updateData = { status: 'In Progress', percentComplete: newPercent };
    }
    await updateDoc(taskRef, updateData);
  }

  const handleSubTaskToggle = async (taskId: string, subTaskId: string, isComplete: boolean) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.subTasks) return;

    const projectId = (task as TaskWithProject).projectId;

    const updatedSubTasks = task.subTasks.map(st => 
        st.id === subTaskId ? { ...st, completed: isComplete } : st
    );

    const completedCount = updatedSubTasks.filter(st => st.completed).length;
    const totalCount = updatedSubTasks.length;
    const newPercentComplete = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : task.percentComplete;
    
    let newStatus = task.status;
    if (totalCount > 0) {
        if (newPercentComplete === 100) {
        newStatus = 'Completed';
        } else if (newPercentComplete > 0 && task.status !== 'Blocked') {
        newStatus = 'In Progress';
        } else if (newPercentComplete === 0 && task.status === 'Completed') {
        newStatus = 'In Progress';
        }
    }
    
    const taskRef = doc(db, 'projects', projectId, 'tasks', taskId);
    await updateDoc(taskRef, {
        subTasks: updatedSubTasks,
        percentComplete: newPercentComplete,
        status: newStatus
    });
  };

  const toggleColumnCollapse = (status: Status) => {
    setCollapsedColumns(prev => ({ ...prev, [status]: !prev[status] }));
  };


  return (
    <div className="flex flex-col flex-1 bg-muted/40 h-full">
      <main className="flex-1 overflow-x-auto custom-scrollbar">
        <div className="p-4 sm:p-6 lg:p-8 h-full">
          {loading ? (
              <div className="flex h-full w-full items-center justify-center">
                  <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
              </div>
          ) : (
            <div className="flex h-full gap-4">
                {STATUS_COLUMNS.map(status => {
                    const columnTasks = tasksByStatus[status] || [];
                    const isCollapsed = collapsedColumns[status];
                    return (
                        <Collapsible
                            key={status}
                            open={!isCollapsed}
                            onOpenChange={() => toggleColumnCollapse(status)}
                            className={cn("flex flex-col rounded-lg border bg-background transition-all duration-300", isCollapsed ? 'w-16' : 'flex-shrink-0 w-80 md:w-96')}
                        >
                            <div className={cn("flex-shrink-0 p-4 border-b", isCollapsed ? 'h-full relative' : 'flex items-center gap-2')}>
                                {isCollapsed ? (
                                    <div className="h-full flex flex-col items-center justify-between py-4">
                                        <div className="flex flex-col items-center">
                                            <CollapsibleTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                                    <ChevronsRight className={cn("h-4 w-4 transition-transform", !isCollapsed ? 'rotate-90' : 'rotate-0')} />
                                                </Button>
                                            </CollapsibleTrigger>
                                            <div className={cn("w-2 h-2 rounded-full mt-2", statusColorMap[status])}></div>
                                         </div>
                                         <h2 className="text-sm font-semibold tracking-widest uppercase text-muted-foreground [writing-mode:vertical-rl] rotate-180">
                                             {status}
                                         </h2>
                                         <div className="text-sm font-bold">{columnTasks.length}</div>
                                    </div>
                                ) : (
                                    <>
                                        <CollapsibleTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-6 w-6">
                                                <ChevronsRight className={cn("h-4 w-4 transition-transform", !isCollapsed ? 'rotate-90' : 'rotate-0')} />
                                            </Button>
                                        </CollapsibleTrigger>
                                        <div className={cn("w-3 h-3 rounded-full", statusColorMap[status])}></div>
                                        <h2 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2 uppercase">
                                            {status}
                                        </h2>
                                        <span className="text-sm font-normal text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                                            {columnTasks.length}
                                        </span>
                                    </>
                                )}
                            </div>
                            <CollapsibleContent asChild>
                                <div className="space-y-4 overflow-y-auto flex-1 p-4">
                                    {columnTasks.map(task => (
                                    <TaskCard 
                                        key={task.id} 
                                        task={task} 
                                        onEdit={handleEditTask}
                                        onSuggest={handleSuggestUpdate}
                                        onDelete={handleDeleteRequest}
                                        onPromote={handlePromoteRequest}
                                        onCompleteToggle={handleTaskCompleteToggle}
                                        onSubTaskToggle={handleSubTaskToggle}
                                    />
                                    ))}
                                    {columnTasks.length === 0 && (
                                        <div className="h-24 flex items-center justify-center text-sm text-muted-foreground border-2 border-dashed rounded-lg">
                                            No tasks here.
                                        </div>
                                    )}
                                </div>
                            </CollapsibleContent>
                        </Collapsible>
                    )
                })}
            </div>
          )}
        </div>
      </main>

        <TaskDialog
            isOpen={isTaskDialogOpen}
            onOpenChange={setIsTaskDialogOpen}
            onSave={handleSaveTask}
            taskToEdit={taskToEdit}
            tasks={tasks}
            defaultTab={defaultTaskDialogTab}
        />
        
        <SuggestUpdateDialog
            isOpen={isSuggestDialogOpen}
            onOpenChange={setIsSuggestDialogOpen}
            task={taskToSuggest}
        />

        <DeleteTaskDialog
            isOpen={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            onConfirm={handleConfirmDelete}
            task={taskToDelete}
        />

        <PromoteTaskDialog
            isOpen={isPromoteDialogOpen}
            onOpenChange={setIsPromoteDialogOpen}
            onConfirm={handleConfirmPromote}
            task={taskToPromote}
        />
    </div>
  );
}
