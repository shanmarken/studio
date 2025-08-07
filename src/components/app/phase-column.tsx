
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
    <div className="flex-shrink-0 w-80 md:w-96">
      <div className="sticky top-0 bg-background/80 backdrop-blur-sm z-10 p-4 -mx-4 flex items-center justify-center">
        <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
          {phase}
          <span className="text-sm font-normal text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </h2>
      </div>
      <div className="h-full">
        {tasks.map((task) => (
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
        ))}
      </div>
    </div>
  );
}
