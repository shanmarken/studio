
'use client';

import { Task } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { UserAvatar } from './user-avatar';
import { Progress } from '../ui/progress';
import { Button } from '../ui/button';
import { BrainCircuit, Edit, Trash2, ArrowRightCircle, ChevronDown, Folder, Calendar } from 'lucide-react';
import { Separator } from '../ui/separator';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { useState } from 'react';
import { format } from 'date-fns';

interface TaskWithProject extends Task {
  projectName?: string;
}

type TaskCardProps = {
  task: TaskWithProject;
  onEdit: (task: Task) => void;
  onSuggest: (task: Task) => void;
  onDelete: (task: Task) => void;
  onPromote: (task: Task) => void;
  onCompleteToggle: (taskId: string, isComplete: boolean) => void;
  onSubTaskToggle: (taskId:string, subTaskId: string, isComplete: boolean) => void;
};

export function TaskCard({ task, onEdit, onSuggest, onDelete, onPromote, onCompleteToggle, onSubTaskToggle }: TaskCardProps) {
  const [isOpen, setIsOpen] = useState(false);

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
  
  const hasSubtasks = task.subTasks && task.subTasks.length > 0;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card className="mb-4 bg-card/80 backdrop-blur-sm hover:shadow-md transition-shadow duration-300">
        <CardHeader className="p-4 flex flex-col gap-3">
            <div className="flex justify-between items-start gap-2">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                    <Checkbox
                    id={`task-${task.id}`}
                    checked={task.status === 'Completed'}
                    onCheckedChange={(checked) => onCompleteToggle(task.id, !!checked)}
                    className="mt-1"
                    disabled={hasSubtasks}
                    />
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base font-semibold tracking-normal">
                        <label htmlFor={`task-${task.id}`} className={cn("cursor-pointer", hasSubtasks && "cursor-default")}>{task.name}</label>
                      </CardTitle>
                    </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                    <Badge className={cn('whitespace-nowrap', priorityColorMap[task.priority])}>
                        {task.priority}
                    </Badge>
                    <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                            <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
                        </Button>
                    </CollapsibleTrigger>
                </div>
            </div>
            <div className="pl-8 flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  {task.projectName && (
                    <>
                      <Folder className="h-3 w-3" />
                      <span className="font-medium">{task.projectName}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3"/>
                  <span>Due {format(new Date(task.endDate), "MMM d")}</span>
                </div>
            </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="p-4 pt-0">
            <div className="pl-8 space-y-4">
                <p className="line-clamp-2 text-sm text-muted-foreground">{task.description}</p>
                
                {hasSubtasks && (
                    <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground">SUB-TASKS</h4>
                    <div className="space-y-2">
                        {task.subTasks?.map(subTask => (
                        <div key={subTask.id} className="flex items-center gap-2">
                            <Checkbox 
                            id={`subtask-${subTask.id}`} 
                            checked={subTask.completed}
                            onCheckedChange={(checked) => onSubTaskToggle(task.id, subTask.id, !!checked)}
                            />
                            <Label 
                            htmlFor={`subtask-${subTask.id}`} 
                            className={cn("text-sm font-normal", subTask.completed && "line-through text-muted-foreground")}
                            >
                            {subTask.name}
                            </Label>
                        </div>
                        ))}
                    </div>
                    </div>
                )}

                <div className="flex items-center gap-2">
                    <Progress value={task.percentComplete} className="h-2" />
                    <span className="text-xs font-mono">{task.percentComplete}%</span>
                </div>

                <Separator/>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <UserAvatar name={task.assignedTo} />
                        <span>{task.assignedTo}</span>
                    </div>
                    <Badge variant="outline" className={cn(statusColorMap[task.status])}>
                        {task.status}
                    </Badge>
                </div>

                <Separator/>

                <div className="flex items-center justify-end gap-2">
                {task.status === 'Completed' ? (
                    <Button variant="outline" size="sm" onClick={() => onPromote(task)} className="gap-2">
                        <ArrowRightCircle className="size-4" />
                        Promote
                    </Button>
                ) : (
                    <Button variant="ghost" size="sm" onClick={() => onSuggest(task)} className="gap-2">
                    <BrainCircuit className="size-4" />
                    Suggest
                    </Button>
                )}

                <Button variant="ghost" size="sm" onClick={() => onEdit(task)} className="gap-2">
                    <Edit className="size-4" />
                    Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onDelete(task)} className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10">
                    <Trash2 className="size-4" />
                    Delete
                </Button>
                </div>
            </div>
          </CardContent>
        </CollapsibleContent>
        </Card>
    </Collapsible>
  );
}
