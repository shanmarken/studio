

'use client';

import { useEffect, useState, useMemo } from 'react';
import { collection, query, where, getDocs, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { Task, Status } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoaderCircle, Filter, Search } from 'lucide-react';
import Link from 'next/link';
import { TaskCard } from './task-card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useToast } from '@/hooks/use-toast';
import { DeleteTaskDialog } from './delete-task-dialog';
import { PromoteTaskDialog } from './promote-task-dialog';
import { SuggestUpdateDialog } from './suggest-update-dialog';
import { TaskDialog } from './task-dialog';


const STATUS_COLUMNS: Status[] = ['To Do', 'In Progress', 'Completed', 'Blocked'];

interface TaskWithProject extends Task {
  projectName: string;
  projectId: string;
}

export function MyTasksClient() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<TaskWithProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [isSuggestDialogOpen, setIsSuggestDialogOpen] = useState(false);
  const [taskToSuggest, setTaskToSuggest] = useState<Task | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isPromoteDialogOpen, setIsPromoteDialogOpen] = useState(false);
  const [taskToPromote, setTaskToPromote] = useState<Task | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!user || !user.uid) return;

      setLoading(true);
      try {
        const projectsQuery = query(collection(db, 'projects'));
        const projectsSnapshot = await getDocs(projectsQuery);
        const myTasks: TaskWithProject[] = [];

        for (const projectDoc of projectsSnapshot.docs) {
          const tasksQuery = query(
            collection(db, `projects/${projectDoc.id}/tasks`),
            where('assignedToId', '==', user.uid)
          );
          const tasksSnapshot = await getDocs(tasksQuery);
          
          tasksSnapshot.forEach(taskDoc => {
            const taskData = taskDoc.data();
            myTasks.push({
              ...(taskData as Task),
              id: taskDoc.id,
              projectName: projectDoc.data().name,
              projectId: projectDoc.id,
              startDate: new Date(taskData.startDate),
              endDate: new Date(taskData.endDate),
            });
          });
        }
        
        setTasks(myTasks);
      } catch (error) {
        console.error("Error fetching tasks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [user]);

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
    <>
        <header className="sticky top-0 z-10 bg-background/90 backdrop-blur-sm border-b">
            <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:p-8">
                <h1 className="text-2xl font-bold">Kanban</h1>
                <div className="flex items-center gap-2">
                    <Button variant="outline">
                        <Filter className="mr-2 h-4 w-4" />
                        Filters
                    </Button>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Subject or reference" 
                            className="pl-8" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>
        </header>
        <main className="flex-1 overflow-x-auto bg-muted/40">
            {loading ? (
                <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
                    <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="p-4 sm:p-6 lg:p-8 h-full flex gap-8">
                    {STATUS_COLUMNS.map(status => {
                        const columnTasks = tasksByStatus[status] || [];
                        return (
                            <div key={status} className="flex-shrink-0 w-80 md:w-96">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className={`w-3 h-3 rounded-full ${statusColorMap[status]}`}></div>
                                    <h2 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2 uppercase">
                                        {status}
                                    </h2>
                                    <span className="text-sm font-normal text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                                        {columnTasks.length}
                                    </span>
                                </div>
                                <div className="h-full space-y-4">
                                    {columnTasks.map(task => (
                                       <div key={task.id} className="bg-background rounded-lg shadow-sm border p-4">
                                            <p className="text-sm font-medium">{task.name}</p>
                                            <p className="text-xs text-muted-foreground mt-1">In project: <Link href={`/projects/${task.projectId}`} className="text-primary hover:underline">{task.projectName}</Link></p>
                                            <div className="mt-2 flex items-center gap-2">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${task.priority === 'High' ? 'bg-red-100 text-red-800' : task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>{task.priority}</span>
                                                <span className="text-xs text-muted-foreground">Due: {task.endDate.toLocaleDateString()}</span>
                                            </div>
                                       </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
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
    </>
  );
}
