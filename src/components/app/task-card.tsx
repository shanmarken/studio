'use client';

import { Task } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { UserAvatar } from './user-avatar';
import { Progress } from '../ui/progress';
import { Button } from '../ui/button';
import { BrainCircuit, Edit } from 'lucide-react';
import { Separator } from '../ui/separator';

type TaskCardProps = {
  task: Task;
  onEdit: (task: Task) => void;
  onSuggest: (task: Task) => void;
};

export function TaskCard({ task, onEdit, onSuggest }: TaskCardProps) {
  const priorityColorMap = {
    High: 'bg-red-500/20 text-red-700 border-red-500/30 dark:text-red-400',
    Medium: 'bg-amber-500/20 text-amber-700 border-amber-500/30 dark:text-amber-400',
    Low: 'bg-green-500/20 text-green-700 border-green-500/30 dark:text-green-400',
  };

  const statusColorMap = {
    'To Do': 'bg-gray-500/20 text-gray-700 border-gray-500/30 dark:text-gray-400',
    'In Progress': 'bg-blue-500/20 text-blue-700 border-blue-500/30 dark:text-blue-400',
    Completed: 'bg-green-500/20 text-green-700 border-green-500/30 dark:text-green-400',
    Blocked: 'bg-destructive/20 text-destructive border-destructive/30 dark:text-destructive',
  };

  return (
    <Card className="mb-4 bg-card/80 backdrop-blur-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader className="p-4">
        <CardTitle className="text-base font-semibold tracking-normal flex justify-between items-start">
          <span>{task.name}</span>
          <Badge className={cn('whitespace-nowrap', priorityColorMap[task.priority])}>
            {task.priority}
          </Badge>
        </CardTitle>
        <div className="flex items-center justify-between text-sm text-muted-foreground pt-1">
          <div className="flex items-center gap-2">
            <UserAvatar name={task.assignedTo} />
            <span>{task.assignedTo}</span>
          </div>
          <Badge variant="outline" className={cn(statusColorMap[task.status])}>
            {task.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="space-y-2 text-sm text-muted-foreground">
          <p className="line-clamp-2">{task.description}</p>
          <div className="flex items-center gap-2">
            <Progress value={task.percentComplete} className="h-2" />
            <span className="text-xs font-mono">{task.percentComplete}%</span>
          </div>
          <div className="text-xs">
            {task.startDate.toLocaleDateString()} - {task.endDate.toLocaleDateString()}
          </div>
        </div>
        <Separator className="my-3" />
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => onSuggest(task)} className="gap-2">
            <BrainCircuit className="size-4" />
            Suggest
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onEdit(task)} className="gap-2">
            <Edit className="size-4" />
            Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
