

'use client';

import { useState, useEffect } from 'react';
import { Task, Status } from '@/lib/types';
import { PHASES } from '@/lib/constants';
import { PhaseColumn } from './phase-column';
import { Header } from './header';
import { TaskDialog } from './task-dialog';
import { useToast } from '@/hooks/use-toast';
import { exportToCsv } from '@/lib/utils';
import { SuggestUpdateDialog } from './suggest-update-dialog';
import { DeleteTaskDialog } from './delete-task-dialog';
import { PromoteTaskDialog } from './promote-task-dialog';
import { useAuth } from '@/hooks/use-auth';
import { collection, query, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, getDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ChevronsRight, LoaderCircle } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';

interface DashboardProps {
  projectId: string;
}

export default function Dashboard({ projectId }: DashboardProps) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [isSuggestDialogOpen, setIsSuggestDialogOpen] = useState(false);
  const [taskToSuggest, setTaskToSuggest] = useState<Task | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isPromoteDialogOpen, setIsPromoteDialogOpen] = useState(false);
  const [taskToPromote, setTaskToPromote] = useState<Task | null>(null);
  const { toast } = useToast();
  const [collapsedColumns, setCollapsedColumns] = useState<Record<string, boolean>>({});
  const [defaultTaskDialogTab, setDefaultTaskDialogTab] = useState<string | undefined>(undefined);


  useEffect(() => {
    if (!user || !projectId) return;

    setLoading(true);
    const tasksQuery = query(collection(db, 'projects', projectId, 'tasks'));

    const unsubscribe = onSnapshot(tasksQuery, (querySnapshot) => {
      const loadedTasks: Task[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        loadedTasks.push({
          ...data,
          id: doc.id,
          projectId, // Ensure projectId is attached
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          comments: data.comments?.map((c: any) => ({...c, createdAt: new Date(c.createdAt)})) || []
        } as Task);
      });
      
      const tasksWithCalculatedProgress = loadedTasks.map((task: Task) => {
        if (task.subTasks && task.subTasks.length > 0) {
          const completedSubTasks = task.subTasks.filter(st => st.completed).length;
          const newPercentComplete = Math.round((completedSubTasks / task.subTasks.length) * 100);
          return { ...task, percentComplete: newPercentComplete };
        }
        return task;
      });

      setTasks(tasksWithCalculatedProgress);
      setLoading(false);
    }, (error) => {
      console.error("Failed to load tasks:", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load tasks. Please try again later.'
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [projectId, toast, user]);


  const handleAddTask = () => {
    setDefaultTaskDialogTab(undefined);
    setTaskToEdit(null);
    setIsTaskDialogOpen(true);
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

  const handleConfirmDelete = async () => {
    if (taskToDelete) {
        const taskName = taskToDelete.name;
        try {
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
            const docRef = await addDoc(collection(db, 'projects', currentProjectId, 'tasks'), {
                ...taskData,
                createdAt: serverTimestamp()
            });
            toast({ title: "Task Added", description: `"${taskName}" has been successfully added.` });
        }
    } catch (error) {
        console.error("Error saving task: ", error);
        toast({ variant: 'destructive', title: "Error", description: "Failed to save task." });
    }
  };

  const handleExport = () => {
    if (tasks.length === 0) {
      toast({ variant: 'destructive', title: "Export failed", description: "There are no tasks to export." });
      return;
    }
    exportToCsv(tasks, `project_${projectId}_tasks.csv`);
    toast({ title: "Export successful", description: "Your tasks have been exported to CSV." });
  };

  const handleSuggestUpdate = (task: Task) => {
    setTaskToSuggest(task);
    setIsSuggestDialogOpen(true);
  }

  const handlePromoteRequest = (task: Task) => {
    setTaskToPromote(task);
    setIsPromoteDialogOpen(true);
  }

  const handleConfirmPromote = async (task: Task, newPhase: string) => {
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

  const toggleColumnCollapse = (phase: string) => {
    setCollapsedColumns(prev => ({ ...prev, [phase]: !prev[phase] }));
  };


  if (loading) {
     return (
       <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
         <div className="flex items-center space-x-2">
           <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
           <span className="text-lg font-medium text-muted-foreground">Loading Tasks...</span>
         </div>
       </div>
     );
  }

  return (
    <div className="flex flex-col h-full">
      <Header onAddTask={handleAddTask} onExport={handleExport} />

      <main className="flex-1 overflow-x-auto custom-scrollbar">
        <div className="p-4 sm:p-6 lg:p-8 h-full">
          <div className="flex gap-4 h-full">
            {PHASES.map((phase) => {
              const phaseTasks = tasks.filter((task) => task.phase === phase);
              const isCollapsed = collapsedColumns[phase];
              return (
                <Collapsible
                    key={phase}
                    open={!isCollapsed}
                    onOpenChange={() => toggleColumnCollapse(phase)}
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
                                </div>
                                 <h2 className="text-sm font-semibold tracking-widest uppercase text-muted-foreground [writing-mode:vertical-rl] rotate-180">
                                     {phase}
                                 </h2>
                                 <div className="text-sm font-bold">{phaseTasks.length}</div>
                            </div>
                        ) : (
                            <>
                                <CollapsibleTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6">
                                        <ChevronsRight className={cn("h-4 w-4 transition-transform", !isCollapsed ? 'rotate-90' : 'rotate-0')} />
                                    </Button>
                                </CollapsibleTrigger>
                                <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                                  {phase}
                                  <span className="text-sm font-normal text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                                    {phaseTasks.length}
                                  </span>
                                </h2>
                            </>
                        )}
                    </div>
                    <CollapsibleContent asChild>
                      <div className="space-y-4 overflow-y-auto flex-1 p-4">
                        <PhaseColumn
                          phase={phase}
                          tasks={phaseTasks}
                          onEditTask={handleEditTask}
                          onSuggestUpdate={handleSuggestUpdate}
                          onDeleteTask={handleDeleteRequest}
                          onPromoteTask={handlePromoteRequest}
                          onTaskCompleteToggle={handleTaskCompleteToggle}
                          onSubTaskToggle={handleSubTaskToggle}
                        />
                      </div>
                    </CollapsibleContent>
                </Collapsible>
              )
            })}
          </div>
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
