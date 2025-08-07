
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

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [isSuggestDialogOpen, setIsSuggestDialogOpen] = useState(false);
  const [taskToSuggest, setTaskToSuggest] = useState<Task | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    // Simulate loading tasks, e.g. from local storage or an API
    const savedTasks = localStorage.getItem('project-pulse-tasks');
    const initialTasks = savedTasks ? JSON.parse(savedTasks, (key, value) => {
      if (key === 'startDate' || key === 'endDate') {
        return new Date(value);
      }
      return value;
    }) : INITIAL_TASKS;

    // Recalculate progress for tasks with subtasks on initial load
    const tasksWithCalculatedProgress = initialTasks.map((task: Task) => {
      if (task.subTasks && task.subTasks.length > 0) {
        const completedSubTasks = task.subTasks.filter(st => st.completed).length;
        const newPercentComplete = Math.round((completedSubTasks / task.subTasks.length) * 100);
        return { ...task, percentComplete: newPercentComplete };
      }
      return task;
    });
    setTasks(tasksWithCalculatedProgress);
  }, []);

  useEffect(() => {
    // Persist tasks to local storage whenever they change
    if (tasks.length > 0) {
        localStorage.setItem('project-pulse-tasks', JSON.stringify(tasks));
    }
  }, [tasks]);

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
    exportToCsv(tasks, 'project_pulse_tasks.csv');
    toast({ title: "Export successful", description: "Your tasks have been exported to CSV." });
  };

  const handleSuggestUpdate = (task: Task) => {
    setTaskToSuggest(task);
    setIsSuggestDialogOpen(true);
  }

  const handleTaskCompleteToggle = (taskId: string, isComplete: boolean) => {
    setTasks(prevTasks => prevTasks.map(t => {
      if (t.id === taskId) {
        if (isComplete) {
          return { ...t, status: 'Completed', percentComplete: 100 };
        } else {
          return { ...t, status: 'In Progress', percentComplete: 0 };
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
    </div>
  );
}
