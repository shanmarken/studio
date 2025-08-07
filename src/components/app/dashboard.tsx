
'use client';

import { useState, useEffect } from 'react';
import { Task } from '@/lib/types';
import { INITIAL_TASKS, PHASES } from '@/lib/constants';
import { PhaseColumn } from './phase-column';
import { Header } from './header';
import { TaskDialog } from './task-dialog';
import { useToast } from '@/hooks/use-toast';
import { exportToCsv } from '@/lib/utils';
import { SuggestUpdateDialog } from './suggest-update-dialog';
import { DeleteTaskDialog } from './delete-task-dialog';
import { PromoteTaskDialog } from './promote-task-dialog';

interface DashboardProps {
  projectId: string;
}

export default function Dashboard({ projectId }: DashboardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [isSuggestDialogOpen, setIsSuggestDialogOpen] = useState(false);
  const [taskToSuggest, setTaskToSuggest] = useState<Task | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isPromoteDialogOpen, setIsPromoteDialogOpen] = useState(false);
  const [taskToPromote, setTaskToPromote] = useState<Task | null>(null);

  
  const { toast } = useToast();
  const storageKey = `project-pulse-tasks-${projectId}`;


  useEffect(() => {
    if (!projectId) return;

    const savedTasks = localStorage.getItem(storageKey);
    let loadedTasks: Task[] = [];
    
    if (savedTasks) {
      loadedTasks = JSON.parse(savedTasks, (key, value) => {
        if ((key === 'startDate' || key === 'endDate') && value) {
          return new Date(value);
        }
        return value;
      });
    } else if (projectId === '1') {
      // If no tasks are saved for the default project, load the initial ones.
      loadedTasks = INITIAL_TASKS.map(task => ({
        ...task,
        startDate: new Date(task.startDate),
        endDate: new Date(task.endDate),
      }));
    }
    
    // Recalculate progress for tasks with subtasks on initial load
    const tasksWithCalculatedProgress = loadedTasks.map((task: Task) => {
      if (task.subTasks && task.subTasks.length > 0) {
        const completedSubTasks = task.subTasks.filter(st => st.completed).length;
        const newPercentComplete = Math.round((completedSubTasks / task.subTasks.length) * 100);
        return { ...task, percentComplete: newPercentComplete };
      }
      return task;
    });

    setTasks(tasksWithCalculatedProgress);
  }, [projectId, storageKey]);


  useEffect(() => {
    // Persist tasks to local storage whenever they change
    if (tasks.length > 0 || localStorage.getItem(storageKey)) {
        localStorage.setItem(storageKey, JSON.stringify(tasks));
    }
  }, [tasks, storageKey]);

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

  const handleConfirmDelete = () => {
    if (taskToDelete) {
        setTasks(prevTasks => {
            const newTasks = prevTasks.filter(p => p.id !== taskToDelete.id)
            localStorage.setItem(storageKey, JSON.stringify(newTasks));
            toast({ title: 'Task Deleted', description: `"${taskToDelete?.name}" has been deleted.`});
            return newTasks
        });
      setTaskToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleSaveTask = (task: Task) => {
    const isEditing = tasks.some(t => t.id === task.id);
    
    setTasks(prevTasks => {
        let newTasks;
        if (isEditing) {
            newTasks = prevTasks.map(t => (t.id === task.id ? task : t));
            toast({ title: "Task Updated", description: `"${task.name}" has been successfully updated.` });
        } else {
            const newTask = { ...task, id: new Date().toISOString() }
            newTasks = [...prevTasks, newTask];
            toast({ title: "Task Added", description: `"${newTask.name}" has been successfully added.` });
        }

        // After saving, re-calculate progress if subtasks exist
        return newTasks.map(t => {
            if (t.id === task.id && t.subTasks && t.subTasks.length > 0) {
                const completedCount = t.subTasks.filter(st => st.completed).length;
                const totalCount = t.subTasks.length;
                const newPercentComplete = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : t.percentComplete;
                return { ...t, percentComplete: newPercentComplete };
            }
            return t;
        });
    });
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

  const handleConfirmPromote = (task: Task, newPhase: string) => {
    const newTask: Task = {
        ...task,
        id: new Date().toISOString(), // New ID for the cloned task
        phase: newPhase,
        status: 'To Do',
        percentComplete: 0,
        // Reset sub-tasks to be incomplete
        subTasks: task.subTasks?.map(st => ({...st, completed: false})),
    };

    setTasks(prevTasks => [...prevTasks, newTask]);

    toast({
        title: 'Task Promoted',
        description: `A new task "${newTask.name}" was created in the ${newPhase} phase.`
    });
  };

  const handleTaskCompleteToggle = (taskId: string, isComplete: boolean) => {
    setTasks(prevTasks => prevTasks.map(t => {
      if (t.id === taskId) {
        if (isComplete) {
          return { ...t, status: 'Completed', percentComplete: 100 };
        } else {
          // If un-checking, revert to a sensible default, not just 0%
          const newPercent = (t.subTasks && t.subTasks.length > 0) ? t.percentComplete : 0;
          return { ...t, status: 'In Progress', percentComplete: newPercent };
        }
      }
      return t;
    }));
  }

  const handleSubTaskToggle = (taskId: string, subTaskId: string, isComplete: boolean) => {
    setTasks(prevTasks => prevTasks.map(t => {
      if (t.id === taskId && t.subTasks) {
        const updatedSubTasks = t.subTasks.map(st => 
          st.id === subTaskId ? { ...st, completed: isComplete } : st
        );

        const completedCount = updatedSubTasks.filter(st => st.completed).length;
        const totalCount = updatedSubTasks.length;
        const newPercentComplete = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : t.percentComplete;
        
        let newStatus = t.status;
        if (totalCount > 0) {
            if (newPercentComplete === 100) {
            newStatus = 'Completed';
            } else if (newPercentComplete > 0 && t.status !== 'Blocked') {
            newStatus = 'In Progress';
            } else if (newPercentComplete === 0 && t.status === 'Completed') {
            newStatus = 'In Progress';
            }
        }

        return { ...t, subTasks: updatedSubTasks, percentComplete: newPercentComplete, status: newStatus };
      }
      return t;
    }));
  };

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
