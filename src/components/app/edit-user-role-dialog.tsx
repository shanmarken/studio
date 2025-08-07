
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
import { User, UserRole } from '@/lib/types';
import { useEffect, useState } from 'react';
import { LoaderCircle } from 'lucide-react';

const availableRoles: UserRole[] = ['developer', 'management', 'admin'];

const roleSchema = z.object({
  role: z.enum(availableRoles, { required_error: 'Please select a role.' }),
});

type RoleFormValues = z.infer<typeof roleSchema>;

type EditUserRoleDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  user: User | null;
  onSave: (userId: string, newRole: UserRole) => void;
};

export function EditUserRoleDialog({ isOpen, onOpenChange, user, onSave }: EditUserRoleDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
  });

  useEffect(() => {
    if (user) {
      form.reset({ role: user.role });
    }
  }, [user, form, isOpen]);

  const onSubmit = async (values: RoleFormValues) => {
    if (!user) return;
    setIsLoading(true);
    await onSave(user.uid, values.role);
    setIsLoading(false);
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User Role</DialogTitle>
          <DialogDescription>
            Change the role for {user.displayName} ({user.email}).
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableRoles.map(role => (
                        <SelectItem key={role} value={role} className="capitalize">{role}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

