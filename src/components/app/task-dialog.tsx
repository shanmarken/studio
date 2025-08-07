'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, PlusCircle, Trash2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Task, SubTask } from '@/lib/types';
import { PHASES, PRIORITIES, STATUSES, TEAM_MEMBERS } from '@/lib/constants';
import { useEffect } from 'react';
import { Separator } from '../ui/separator';
import { useAuth } from '@/hooks/use-auth';

const subTaskSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Sub-task name cannot be empty'),
  completed: z.boolean(),
});

const taskSchema = z.object({
  name: z.string().min(1, 'Task name is required'),
  description: z.string().min(1, 'Description is required'),
  assignedTo: z.string().min(1, 'Assignee is required'),
  priority: z.enum(['High', 'Medium', 'Low']),
  estimatedHours: z.coerce.number().min(0, 'Must be a positive number'),
  startDate: z.date(),
  endDate: z.date(),
  status: z.enum(['To Do', 'In Progress', 'Completed', 'Blocked']),
  percentComplete: z.number().min(0).max(100),
  dependencies: z.string().optional(),
  notes: z.string().optional(),
  phase: z.string().min(1, 'Phase is required'),
  subTasks: z.array(subTaskSchema).optional(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

type TaskDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (task: Task) => void;
  taskToEdit?: Task | null;
};

export function TaskDialog({ isOpen, onOpenChange, onSave, taskToEdit }: TaskDialogProps) {
  const { user } = useAuth();
  
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      name: '',
      description: '',
      assignedTo: '',
      priority: 'Medium',
      estimatedHours: 8,
      startDate: new Date(),
      endDate: new Date(),
      status: 'To Do',
      percentComplete: 0,
      dependencies: '',
      notes: '',
      phase: '',
      subTasks: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "subTasks",
  });

  useEffect(() => {
    if (taskToEdit) {
      form.reset({
        ...taskToEdit,
        percentComplete: taskToEdit.percentComplete || 0,
        subTasks: taskToEdit.subTasks || [],
      });
    } else {
      form.reset({
        name: '',
        description: '',
        assignedTo: user?.displayName || '',
        priority: 'Medium',
        estimatedHours: 8,
        startDate: new date(),
        endDate: new Date(new Date().setDate(new Date().getDate() + 7)),
        status: 'To Do',
        percentComplete: 0,
        dependencies: '',
        notes: '',
        phase: PHASES[0],
        subTasks: [],
      });
    }
  }, [taskToEdit, form, isOpen, user]);

  const onSubmit = (values: TaskFormValues) => {
    onSave({
      ...values,
      id: taskToEdit?.id || new Date().toISOString(),
      subTasks: values.subTasks,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{taskToEdit ? 'Edit Task' : 'Add New Task'}</DialogTitle>
          <DialogDescription>
            {taskToEdit ? 'Update the details of the existing task.' : 'Fill in the details for the new task.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField name="name" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Task Name</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="description" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl><Textarea {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField name="assignedTo" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigned To</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a team member" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {TEAM_MEMBERS.map(member => <SelectItem key={member} value={member}>{member}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="phase" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Phase</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a phase" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {PHASES.map(phase => <SelectItem key={phase} value={phase}>{phase}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <FormField name="priority" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="status" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField name="startDate" control={form.control} render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start Date</FormLabel>
                  <Popover><PopoverTrigger asChild>
                    <FormControl>
                      <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                        {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                  </PopoverContent></Popover>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="endDate" control={form.control} render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>End Date</FormLabel>
                  <Popover><PopoverTrigger asChild>
                    <FormControl>
                      <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                        {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                  </PopoverContent></Popover>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <FormField name="estimatedHours" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Estimated Hours</FormLabel>
                  <FormControl><Input type="number" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="percentComplete" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Percent Complete ({field.value}%)</FormLabel>
                    <FormControl>
                      <Slider
                        min={0}
                        max={100}
                        step={5}
                        defaultValue={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                        disabled={!!taskToEdit?.subTasks?.length}
                      />
                    </FormControl>
                  </FormItem>
                )} />
            </div>
            <FormField name="dependencies" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Dependencies</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField name="notes" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl><Textarea {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <Separator />
            
            <div>
                <FormLabel>Sub-tasks</FormLabel>
                <div className="space-y-2 mt-2">
                    {fields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2">
                        <FormField
                        control={form.control}
                        name={`subTasks.${index}.name`}
                        render={({ field }) => (
                            <FormItem className="flex-grow">
                            <FormControl>
                                <Input {...field} placeholder="Sub-task name" />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        >
                        <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                    ))}
                    <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ id: `new-${new Date().toISOString()}`, name: '', completed: false })}
                    >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Sub-task
                    </Button>
                </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">Save Task</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
