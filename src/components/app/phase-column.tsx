

'use client';

import { Task } from '@/lib/types';
import { TaskCard } from './task-card';

interface TaskWithProject extends Task {
  projectName?: string;
}

type PhaseColumnProps = {
  phase: string;
  tasks: TaskWithProject[];
  onEditTask: (task: Task, defaultTab?: string) => void;
  onSuggestUpdate: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onPromoteTask: (task: Task) => void;
  onTaskCompleteToggle: (taskId: string, isComplete: boolean) => void;
  onSubTaskToggle: (taskId: string, subTaskId: string, isComplete: boolean) => void;
};

export function PhaseColumn({ phase, tasks, onEditTask, onSuggestUpdate, onDeleteTask, onPromoteTask, onTaskCompleteToggle, onSubTaskToggle }: PhaseColumnProps) {
  return (
    <div className="h-full">
        {/* This component is now effectively a passthrough, DND logic is in dashboard */}
        {children}
    </div>
  );
}
