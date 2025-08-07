
'use client';

import { useForm } from 'react-hook-form';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Task } from '@/lib/types';
import { PHASES } from '@/lib/constants';
import { useEffect } from 'react';

const promoteSchema = z.object({
  phase: z.string().min(1, 'You must select a new phase.'),
});

type PromoteFormValues = z.infer<typeof promoteSchema>;

type PromoteTaskDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: (task: Task, newPhase: string) => void;
  task: Task | null;
};

export function PromoteTaskDialog({ isOpen, onOpenChange, onConfirm, task }: PromoteTaskDialogProps) {
  const form = useForm<PromoteFormValues>({
    resolver: zodResolver(promoteSchema),
    defaultValues: {
      phase: '',
    },
  });

  useEffect(() => {
    if (task) {
      // Find the next phase in the list if possible
      const currentPhaseIndex = PHASES.indexOf(task.phase);
      const nextPhase = PHASES[currentPhaseIndex + 1] || '';
      form.reset({ phase: nextPhase });
    } else {
        form.reset({ phase: '' });
    }
  }, [task, form, isOpen]);

  if (!task) return null;

  const onSubmit = (values: PromoteFormValues) => {
    onConfirm(task, values.phase);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Promote Task to Next Phase</DialogTitle>
          <DialogDescription>
            This will create a new task based on &quot;{task.name}&quot; in the selected phase. The original task will remain completed.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="phase"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Phase</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                    <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select the next phase" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PHASES.filter(p => p !== task.phase).map(phase => (
                        <SelectItem key={phase} value={phase}>{phase}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Promote Task
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
