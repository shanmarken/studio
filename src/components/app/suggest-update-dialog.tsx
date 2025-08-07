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
import { BrainCircuit, LoaderCircle, Lightbulb, Users, Search, MessageSquare, Scaling } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { suggestUpdates, SuggestUpdatesOutput } from '@/ai/flows/suggest-updates';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';

type SuggestUpdateDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  task: Task | null;
};

const categoryIcons = {
    'Re-scoping': <Scaling className="h-4 w-4" />,
    'Re-assignment': <Users className="h-4 w-4" />,
    'Dependency Management': <Lightbulb className="h-4 w-4" />,
    'Investigation': <Search className="h-4 w-4" />,
    'Communication': <MessageSquare className="h-4 w-4" />,
};

export function SuggestUpdateDialog({ isOpen, onOpenChange, task }: SuggestUpdateDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestUpdatesOutput['suggestedUpdates']>([]);
  const { toast } = useToast();

  const handleGenerateSuggestion = async () => {
    if (!task) return;

    setIsLoading(true);
    setSuggestions([]);
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
      setSuggestions(result.suggestedUpdates);
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
      setSuggestions([]);
    }
    onOpenChange(open);
  }

  if (!task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Get AI Suggestions for "{task.name}"</DialogTitle>
          <DialogDescription>
            This tool will analyze the task details and suggest actions to get it back on track.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
          {!suggestions.length && (
            <div className='flex flex-col items-center justify-center text-center p-8 border-dashed border-2 rounded-lg'>
                <BrainCircuit className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg">Stuck on a task?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    Let AI help you find a path forward.
                </p>
                <Button onClick={handleGenerateSuggestion} disabled={isLoading}>
                    {isLoading ? (
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                    <Lightbulb className="mr-2 h-4 w-4" />
                    )}
                    {isLoading ? 'Analyzing...' : 'Generate Suggestions'}
                </Button>
            </div>
          )}
          
          {suggestions.length > 0 && (
            <div className="space-y-3">
                 <h3 className="text-md font-semibold text-foreground">Here are some suggestions:</h3>
                {suggestions.map((suggestion, index) => (
                    <Alert key={index} className="bg-background/80">
                        <div className="flex items-start gap-3">
                           <div className="pt-1 text-primary">
                             {categoryIcons[suggestion.category]}
                           </div>
                           <div>
                            <AlertTitle className="font-semibold">{suggestion.title}</AlertTitle>
                            <AlertDescription>
                                {suggestion.description}
                            </AlertDescription>
                            <Badge variant="outline" className="mt-2">{suggestion.category}</Badge>
                           </div>
                        </div>
                    </Alert>
                ))}
            </div>
          )}
        </div>
        <DialogFooter className="sm:justify-between border-t pt-4 mt-auto">
          {suggestions.length > 0 && (
            <Button onClick={handleGenerateSuggestion} disabled={isLoading}>
              {isLoading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Lightbulb className="mr-2 h-4 w-4" />}
              {isLoading ? 'Regenerating...' : 'Regenerate'}
            </Button>
          )}
          <Button type="button" variant="secondary" onClick={() => handleOpenChange(false)} className={cn(!suggestions.length && 'w-full')}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
