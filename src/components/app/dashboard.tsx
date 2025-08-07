'use client';

import { useState, useEffect } from 'react';
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

  useEffect(() => {
    // Recalculate progress for tasks with subtasks on initial load
    setTasks(prevTasks =>
      prevTasks.map(task => {
        if (task.subTasks && task.subTasks.length > 0) {
          const completedSubTasks = task.subTasks.filter(st => st.completed).length;
          const newPercentComplete = Math.round((completedSubTasks / task.subTasks.length) * 100);
          return { ...task, percentComplete: newPercentComplete };
        }
        return task;
      })
    );
  }, []);

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
      setTasks([...tasks, { ...task, id: new Date().toISOString() }]);
      toast({ title: "Task Added", description: `"${task.name}" has been successfully added.` });
    }
    // After saving, re-calculate progress
    handleSubTaskToggle(task.id, '', false, true);
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
          // If un-checking, revert to In Progress, but percent might need recalculating if there are subtasks.
          // For now, we set to 0, subtask toggling will give finer control.
          return { ...t, status: 'In Progress', percentComplete: 0 };
        }
      }
      return t;
    }));
  }

  const handleSubTaskToggle = (taskId: string, subTaskId: string, isComplete: boolean, forceRecalc = false) => {
    setTasks(tasks.map(t => {
      if (t.id === taskId && (t.subTasks || forceRecalc)) {
        const subTasks = t.subTasks || [];
        const updatedSubTasks = forceRecalc ? subTasks : subTasks.map(st => 
          st.id === subTaskId ? { ...st, completed: isComplete } : st
        );

        const completedCount = updatedSubTasks.filter(st => st.completed).length;
        const totalCount = updatedSubTasks.length;
        const newPercentComplete = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : t.percentComplete;
        
        let newStatus = t.status;
        if (totalCount > 0) {
            if (newPercentComplete === 100) {
            newStatus = 'Completed';
            } else if (newPercentComplete > 0) {
            newStatus = 'In Progress';
            } else if (t.status === 'Completed') {
            newStatus = 'In Progress'; // Revert from completed if a subtask is unchecked
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
    </div>
  );
}
