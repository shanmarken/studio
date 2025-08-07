'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Task } from '@/lib/types';
import { BrainCircuit, LoaderCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { suggestUpdates } from '@/ai/flows/suggest-updates';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

type SuggestUpdateDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  task: Task | null;
};

export function SuggestUpdateDialog({ isOpen, onOpenChange, task }: SuggestUpdateDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState('');
  const { toast } = useToast();

  const handleGenerateSuggestion = async () => {
    if (!task) return;

    setIsLoading(true);
    setSuggestion('');
    try {
      const input = {
        phase: task.phase,
        taskName: task.name,
        taskDescription: task.description,
        assignedTeamMember: task.assignedTo,
        priority: task.priority,
        estimatedHours: task.estimatedHours,
        startDate: format(task.startDate, 'yyyy-MM-dd'),
        endDate: format(task.endDate, 'yyyy-MM-dd'),
        currentStatus: task.status,
        percentComplete: task.percentComplete,
        dependencies: task.dependencies || '',
        notes: task.notes || '',
      };
      
      const result = await suggestUpdates(input);
      setSuggestion(result.suggestedUpdates);
    } catch (error) {
      console.error('Failed to get suggestion:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not generate a suggestion. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSuggestion('');
    }
    onOpenChange(open);
  }

  if (!task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Get AI Suggestions</DialogTitle>
          <DialogDescription>
            Generate suggestions for how to move the task "{task.name}" forward.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This tool will analyze the task details and suggest actions to get it back on track.
          </p>

          <Button onClick={handleGenerateSuggestion} disabled={isLoading} className="w-full">
            {isLoading ? (
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <BrainCircuit className="mr-2 h-4 w-4" />
            )}
            {isLoading ? 'Generating...' : 'Generate Suggestions'}
          </Button>
          
          {suggestion && (
            <Alert>
              <BrainCircuit className="h-4 w-4" />
              <AlertTitle>Suggested Updates</AlertTitle>
              <AlertDescription className="whitespace-pre-wrap">
                {suggestion}
              </AlertDescription>
            </Alert>
          )}
        </div>
        <DialogFooter className="sm:justify-start">
          <Button type="button" variant="secondary" onClick={() => handleOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
