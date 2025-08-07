
'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Mail, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

type InviteUserDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

export function InviteUserDialog({ isOpen, onOpenChange }: InviteUserDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>How to Invite New Users</DialogTitle>
          <DialogDescription>
            Follow these steps to add new members to your team.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Mail className="h-5 w-5" />
                </div>
                <div>
                    <h3 className="font-semibold">1. Ask them to Sign Up</h3>
                    <p className="text-sm text-muted-foreground">
                        Direct the new user to the application&apos;s {' '}
                        <Link href="/signup" className="underline text-primary">Sign Up page</Link>
                        . They will need to create their own account using their email and a password.
                    </p>
                </div>
            </div>
             <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                    <h3 className="font-semibold">2. Assign Their Role</h3>
                    <p className="text-sm text-muted-foreground">
                        Once they have created their account, their name will appear in the team list. You can then click the "Edit" button next to their name to assign them the appropriate role.
                    </p>
                </div>
            </div>
        </div>
        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
