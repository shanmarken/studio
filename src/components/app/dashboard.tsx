'use client';

import { useState } from 'react';
import { Task } from '@/lib/types';
import { PHASES, INITIAL_TASKS } from '@/lib/constants';
import { PhaseColumn } from './phase-column';
import { Header } from './header';
import { TaskDialog } from './task-dialog';
import { useToast } from '@/hooks/use-toast';
import { exportToCsv } from '@/lib/utils';
import { SuggestUpdateDialog } from './suggest-update-dialog';

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [isSuggestDialogOpen, setIsSuggestDialogOpen] = useState(false);
  const [taskToSuggest, setTaskToSuggest] = useState<Task | null>(null);
  
  const { toast } = useToast();

  const handleAddTask = () => {
    setTaskToEdit(null);
    setIsTaskDialogOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setTaskToEdit(task);
    setIsTaskDialogOpen(true);
  };

  const handleSaveTask = (task: Task) => {
    const isEditing = tasks.some(t => t.id === task.id);
    if (isEditing) {
      setTasks(tasks.map(t => (t.id === task.id ? task : t)));
      toast({ title: "Task Updated", description: `"${task.name}" has been successfully updated.` });
    } else {
      setTasks([...tasks, task]);
      toast({ title: "Task Added", description: `"${task.name}" has been successfully added.` });
    }
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
    setTasks(tasks.map(t => {
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
                onTaskCompleteToggle={handleTaskCompleteToggle}
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
      />
      
      <SuggestUpdateDialog
        isOpen={isSuggestDialogOpen}
        onOpenChange={setIsSuggestDialogOpen}
        task={taskToSuggest}
      />
    </div>
  );
}
