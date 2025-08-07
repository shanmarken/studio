
'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User, UserRole } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Edit, LoaderCircle, UserPlus } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { EditUserRoleDialog } from './edit-user-role-dialog';
import { useToast } from '@/hooks/use-toast';

export function TeamMembersTable() {
    const { user: currentUser } = useAuth();
    const { toast } = useToast();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<User | null>(null);

    useEffect(() => {
        setLoading(true);
        const usersQuery = collection(db, 'users');
        const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
            const usersData = snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as User));
            setUsers(usersData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching users:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleEditClick = (user: User) => {
        setUserToEdit(user);
        setIsEditDialogOpen(true);
    };

    const handleSaveChanges = async (userId: string, newRole: UserRole) => {
        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, { role: newRole });
            toast({ title: 'Success', description: `User role has been updated to ${newRole}.` });
        } catch (error) {
            console.error("Error updating user role:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update user role.' });
        } finally {
            setIsEditDialogOpen(false);
            setUserToEdit(null);
        }
    };
    
    // TODO: Implement Invite User functionality
    const handleInviteUser = () => {
        toast({ title: 'Coming Soon!', description: 'The ability to invite new users is not yet implemented.' });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-lg font-medium text-muted-foreground">Loading team members...</span>
            </div>
        );
    }

    return (
        <>
            <div className="flex justify-end mb-4">
                <Button onClick={handleInviteUser}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite User
                </Button>
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.uid}>
                                <TableCell className="font-medium">{user.displayName}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                    <Badge variant="secondary" className="capitalize">{user.role}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleEditClick(user)}
                                        disabled={user.uid === currentUser?.uid}
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            {userToEdit && (
                 <EditUserRoleDialog
                    isOpen={isEditDialogOpen}
                    onOpenChange={setIsEditDialogOpen}
                    user={userToEdit}
                    onSave={handleSaveChanges}
                />
            )}
        </>
    );
}

