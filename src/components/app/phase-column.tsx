
'use client';

import { Task } from '@/lib/types';
import { TaskCard } from './task-card';

type PhaseColumnProps = {
  phase: string;
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onSuggestUpdate: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onPromoteTask: (task: Task) => void;
  onTaskCompleteToggle: (taskId: string, isComplete: boolean) => void;
  onSubTaskToggle: (taskId: string, subTaskId: string, isComplete: boolean) => void;
};

export function PhaseColumn({ phase, tasks, onEditTask, onSuggestUpdate, onDeleteTask, onPromoteTask, onTaskCompleteToggle, onSubTaskToggle }: PhaseColumnProps) {
  return (
    <div className="h-full">
        {tasks.length > 0 ? (
            tasks.map((task) => (
            <TaskCard 
                key={task.id} 
                task={task} 
                onEdit={onEditTask} 
                onSuggest={onSuggestUpdate}
                onDelete={onDeleteTask}
                onPromote={onPromoteTask}
                onCompleteToggle={onTaskCompleteToggle}
                onSubTaskToggle={onSubTaskToggle}
            />
            ))
        ) : (
            <div className="h-24 flex items-center justify-center text-sm text-muted-foreground border-2 border-dashed rounded-lg">
                No tasks here.
            </div>
        )}
    </div>
  );
}
