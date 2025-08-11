
'use client';

import { MyTasksClient } from '@/components/app/my-tasks-client';
import { MainHeader } from '@/components/app/main-header';
import { TaskDialog } from '@/components/app/task-dialog';
import { Task } from '@/lib/types';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function MyTasksPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleSaveTask = async (task: Task) => {
    const isEditing = !!task.id && task.id.length < 20; // Heuristic to check if it's a firestore ID vs a new date string
    const taskName = task.name;
    const currentProjectId = task.projectId;

    if (!currentProjectId) {
        toast({ variant: 'destructive', title: "Error", description: "Project ID is missing." });
        return;
    }
     if (!task.releaseId) {
        toast({ variant: 'destructive', title: "Error", description: "Release ID is missing. Please select a release." });
        return;
    }

    if (task.subTasks && task.subTasks.length > 0) {
        const completedCount = task.subTasks.filter(st => st.completed).length;
        const totalCount = task.subTasks.length;
        task.percentComplete = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : task.percentComplete;
    }

     if (task.percentComplete === 100 && task.status !== 'Completed') {
        task.status = 'Testing';
    }

    const taskData: any = {
        ...task,
        startDate: task.startDate.toISOString(),
        endDate: task.endDate.toISOString(),
        dependencies: task.dependencies || '',
        notes: task.notes || '',
        comments: task.comments?.map(c => ({...c, createdAt: c.createdAt.toISOString()})) || [],
    };
    
    delete taskData.id;
    delete taskData.projectId;

    try {
        if (isEditing) {
            const taskRef = doc(db, 'projects', currentProjectId, 'tasks', task.id);
            await updateDoc(taskRef, taskData);
            toast({ title: "Task Updated", description: `"${taskName}" has been successfully updated.` });
        } else {
            const docRef = await addDoc(collection(db, 'projects', currentProjectId, 'tasks'), {
                ...taskData,
                createdAt: serverTimestamp()
            });
            toast({ title: "Task Added", description: `"${taskName}" has been successfully added.` });
        }
        setIsTaskDialogOpen(false);
    } catch (error) {
        console.error("Error saving task: ", error);
        toast({ variant: 'destructive', title: "Error", description: "Failed to save task." });
    }
  }

  return (
    <div className="flex flex-col h-full">
      <MainHeader 
        title="My Tasks"
        showSearch={true}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onAddTask={() => setIsTaskDialogOpen(true)}
      />
      <MyTasksClient searchTerm={searchTerm} />
       <TaskDialog
        isOpen={isTaskDialogOpen}
        onOpenChange={setIsTaskDialogOpen}
        onSave={handleSaveTask}
        tasks={[]}
      />
    </div>
  );
}
