
'use client';

import { useEffect, useState, useMemo } from 'react';
import { collection, query, where, getDoc, onSnapshot, doc, updateDoc, deleteDoc, addDoc, serverTimestamp, collectionGroup } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { Task, Status } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoaderCircle, Filter, Search } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useToast } from '@/hooks/use-toast';
import { DeleteTaskDialog } from './delete-task-dialog';
import { PromoteTaskDialog } from './promote-task-dialog';
import { SuggestUpdateDialog } from './suggest-update-dialog';
import { TaskDialog } from './task-dialog';
import { TaskCard } from './task-card';


const STATUS_COLUMNS: Status[] = ['To Do', 'In Progress', 'Completed', 'Blocked'];

interface TaskWithProject extends Task {
  projectName: string;
  projectId: string;
}

interface MyTasksClientProps {
    searchTerm: string;
}

export function MyTasksClient({ searchTerm }: MyTasksClientProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<TaskWithProject[]>([]);
  const [loading, setLoading] = useState(true);

  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [isSuggestDialogOpen, setIsSuggestDialogOpen] = useState(false);
  const [taskToSuggest, setTaskToSuggest] = useState<Task | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isPromoteDialogOpen, setIsPromoteDialogOpen] = useState(false);
  const [taskToPromote, setTaskToPromote] = useState<Task | null>(null);

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
            
            return {
              ...(taskData as Task),
              id: taskDoc.id,
              projectName: projectName,
              projectId: projectRef.id,
              startDate: new Date(taskData.startDate),
              endDate: new Date(taskData.endDate),
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
    Completed: 'bg-green-500',
    Blocked: 'bg-red-500',
  };


  const handleEditTask = (task: Task) => {
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
        let taskName = task.name;
        const projectId = (task as TaskWithProject).projectId;

        if (task.subTasks && task.subTasks.length > 0) {
            const completedCount = task.subTasks.filter(st => st.completed).length;
            const totalCount = task.subTasks.length;
            task.percentComplete = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : task.percentComplete;
        }

        const taskData = {
            ...task,
            startDate: task.startDate.toISOString(),
            endDate: task.endDate.toISOString(),
        };

        try {
            if (isEditing) {
                const taskRef = doc(db, 'projects', projectId, 'tasks', task.id);
                // @ts-ignore
                delete taskData.id;
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


  return (
    <div className="flex flex-col flex-1 h-full bg-muted/40 min-h-0">
        <main className="flex-1 flex flex-col min-h-0">
          {loading ? (
              <div className="flex h-full w-full items-center justify-center">
                  <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
              </div>
          ) : (
              <div className="flex-1 overflow-x-auto">
                <div className="flex gap-8 h-full p-4 sm:p-6 lg:p-8">
                    {STATUS_COLUMNS.map(status => {
                        const columnTasks = tasksByStatus[status] || [];
                        return (
                            <div key={status} className="flex-shrink-0 w-80 md:w-96 flex flex-col">
                                <div className="flex items-center gap-2 mb-4 flex-shrink-0">
                                    <div className={`w-3 h-3 rounded-full ${statusColorMap[status]}`}></div>
                                    <h2 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2 uppercase">
                                        {status}
                                    </h2>
                                    <span className="text-sm font-normal text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                                        {columnTasks.length}
                                    </span>
                                </div>
                                <div className="space-y-4 overflow-y-auto flex-1 pr-2 -mr-2">
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
                            </div>
                        )
                    })}
                </div>
              </div>
          )}
        </main>

        <TaskDialog
            isOpen={isTaskDialogOpen}
            onOpenChange={setIsTaskDialogOpen}
            onSave={handleSaveTask}
            taskToEdit={taskToEdit}
            tasks={tasks}
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
