
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
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { LoaderCircle, Trash2 } from 'lucide-react';
import { Release } from '@/lib/types';
import { collection, addDoc, serverTimestamp, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';

const releaseSchema = z.object({
  name: z.string().min(1, { message: 'Release name is required.' }),
});

type ReleaseFormValues = z.infer<typeof releaseSchema>;

type ManageReleasesDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  projectId: string;
  releases: Release[];
};

export function ManageReleasesDialog({ isOpen, onOpenChange, projectId, releases }: ManageReleasesDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<ReleaseFormValues>({
    resolver: zodResolver(releaseSchema),
    defaultValues: {
      name: '',
    },
  });

  const onSubmit = async (values: ReleaseFormValues) => {
    setIsLoading(true);
    try {
        const releasesCollection = collection(db, 'projects', projectId, 'releases');
        await addDoc(releasesCollection, {
            name: values.name,
            projectId: projectId,
            createdAt: serverTimestamp(),
        });
        toast({ title: "Release Created", description: `"${values.name}" has been added.`});
        form.reset();
    } catch(error) {
        console.error("Error creating release: ", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to create release.' });
    } finally {
        setIsLoading(false);
    }
  };

  const handleDeleteRelease = async (releaseId: string, releaseName: string) => {
    if (!window.confirm(`Are you sure you want to delete the release "${releaseName}"? This action cannot be undone.`)) {
        return;
    }
    try {
        const releaseRef = doc(db, 'projects', projectId, 'releases', releaseId);
        await deleteDoc(releaseRef);
        toast({ title: 'Release Deleted', description: `"${releaseName}" has been deleted.`});
    } catch (error) {
        console.error("Error deleting release: ", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete release.' });
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Releases</DialogTitle>
          <DialogDescription>
            Add new releases or manage existing ones for this project.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
            <div>
                <h3 className="text-sm font-medium mb-2">Existing Releases</h3>
                <ScrollArea className="h-40 border rounded-md">
                    {releases.length > 0 ? (
                        releases.map((release, index) => (
                            <div key={release.id}>
                                <div className="flex items-center justify-between p-2">
                                    <span className="text-sm">{release.name}</span>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteRelease(release.id, release.name)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                                {index < releases.length - 1 && <Separator />}
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground p-4 text-center">No releases found.</p>
                    )}
                </ScrollArea>
            </div>

            <Separator />
            
            <div>
                <h3 className="text-sm font-medium mb-2">Create New Release</h3>
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Release Name</FormLabel>
                        <FormControl><Input {...field} placeholder="e.g. MVP 2" /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <div className="flex justify-end">
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                            Create Release
                        </Button>
                    </div>
                </form>
                </Form>
            </div>
        </div>

        <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Close
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
