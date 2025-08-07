
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Task } from '@/lib/types';
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
import { collection, query, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { LoaderCircle } from 'lucide-react';

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

  useEffect(() => {
    if (!user || !projectId) return;

    setLoading(true);
    const tasksQuery = query(collection(db, 'users', user.uid, 'projects', projectId, 'tasks'));

    const unsubscribe = onSnapshot(tasksQuery, (querySnapshot) => {
      const loadedTasks: Task[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        loadedTasks.push({
          ...data,
          id: doc.id,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
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
  }, [user, projectId, toast]);


  const handleAddTask = () => {
    setTaskToEdit(null);
    setIsTaskDialogOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setTaskToEdit(task);
    setIsTaskDialogOpen(true);
  };

  const handleDeleteRequest = (task: Task) => {
    setTaskToDelete(task);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (taskToDelete && user) {
        const taskName = taskToDelete.name;
        try {
            const taskRef = doc(db, 'users', user.uid, 'projects', projectId, 'tasks', taskToDelete.id);
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
    if (!user) return;

    const isEditing = !!task.id && tasks.some(t => t.id === task.id);
    let taskName = task.name;
    
    // Recalculate progress if subtasks exist
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
            const taskRef = doc(db, 'users', user.uid, 'projects', projectId, 'tasks', task.id);
            // @ts-ignore
            delete taskData.id;
            await updateDoc(taskRef, taskData);
            toast({ title: "Task Updated", description: `"${taskName}" has been successfully updated.` });
        } else {
            // @ts-ignore
            delete taskData.id;
            const docRef = await addDoc(collection(db, 'users', user.uid, 'projects', projectId, 'tasks'), {
                ...taskData,
                createdAt: serverTimestamp()
            });
            taskName = task.name;
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
    if (!user) return;
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
        await addDoc(collection(db, 'users', user.uid, 'projects', projectId, 'tasks'), {
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
    if (!user) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const taskRef = doc(db, 'users', user.uid, 'projects', projectId, 'tasks', taskId);
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
    if (!user) return;
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
    
    const taskRef = doc(db, 'users', user.uid, 'projects', projectId, 'tasks', taskId);
    await updateDoc(taskRef, {
        subTasks: updatedSubTasks,
        percentComplete: newPercentComplete,
        status: newStatus
    });
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

      <main className="flex-1 overflow-x-auto">
        <div className="p-4 sm:p-6 lg:p-8 h-full">
          <div className="flex gap-8 h-full">
            {PHASES.map((phase) => (
              <PhaseColumn
                key={phase}
                phase={phase}
                tasks={tasks.filter((task) => task.phase === phase)}
                onEditTask={handleEditTask}
                onSuggestUpdate={handleSuggestUpdate}
                onDeleteTask={handleDeleteRequest}
                onPromoteTask={handlePromoteRequest}
                onTaskCompleteToggle={handleTaskCompleteToggle}
                onSubTaskToggle={handleSubTaskToggle}
              />
            ))}
          </div>
        </div>
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
