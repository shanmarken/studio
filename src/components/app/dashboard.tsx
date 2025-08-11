

'use client';

import { useState, useEffect, useMemo } from 'react';
import { Task, Status, Release } from '@/lib/types';
import { PHASES } from '@/lib/constants';
import { PhaseColumn } from './phase-column';
import { Header } from './header';
import { TaskDialog } from './task-dialog';
import { useToast } from '@/hooks/use-toast';
import { exportToCsv } from '@/lib/utils';
import { SuggestUpdateDialog } from './suggest-update-dialog';
import { DeleteTaskDialog } from './delete-task-dialog';
import { PromoteTaskDialog } from './promote-task-dialog';
import { useAuth } from '@/hooks/use-auth';
import { collection, query, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, getDoc, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ChevronsRight, LoaderCircle, GitBranch } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { ManageReleasesDialog } from './manage-releases-dialog';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { DroppableColumn } from './dnd/droppable-column';
import { DraggableTaskCard } from './dnd/draggable-task-card';
import { TaskCard } from './task-card';

interface DashboardProps {
  projectId: string;
}

export default function Dashboard({ projectId }: DashboardProps) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projectName, setProjectName] = useState('');
  const [loading, setLoading] = useState(true);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [isSuggestDialogOpen, setIsSuggestDialogOpen] = useState(false);
  const [taskToSuggest, setTaskToSuggest] = useState<Task | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isPromoteDialogOpen, setIsPromoteDialogOpen] = useState(false);
  const [taskToPromote, setTaskToPromote] = useState<Task | null>(null);
  const { toast } = useToast();
  const [collapsedColumns, setCollapsedColumns] = useState<Record<string, boolean>>({});
  const [defaultTaskDialogTab, setDefaultTaskDialogTab] = useState<string | undefined>(undefined);
  const [releases, setReleases] = useState<Release[]>([]);
  const [selectedRelease, setSelectedRelease] = useState<string | null>(null);
  const [isManageReleasesOpen, setIsManageReleasesOpen] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    const projectRef = doc(db, 'projects', projectId);
    const unsubscribe = onSnapshot(projectRef, (doc) => {
        if (doc.exists()) {
            setProjectName(doc.data().name);
        }
    });
    return () => unsubscribe();
  }, [projectId]);


  useEffect(() => {
    if (!projectId) return;
    
    const releasesQuery = query(collection(db, 'projects', projectId, 'releases'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(releasesQuery, (snapshot) => {
        const releasesData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Release));
        setReleases(releasesData);
        if (!selectedRelease && releasesData.length > 0) {
            setSelectedRelease(releasesData[0].id);
        } else if (selectedRelease && !releasesData.some(r => r.id === selectedRelease)) {
            // If the selected release was deleted, select the first one
            setSelectedRelease(releasesData.length > 0 ? releasesData[0].id : null);
        } else if (releasesData.length === 0) {
            setSelectedRelease(null);
        }
        setLoading(false);
    });

    return () => unsubscribe();
}, [projectId, selectedRelease]);


  useEffect(() => {
    if (!user || !projectId || !selectedRelease) {
        setTasks([]);
        setLoading(!selectedRelease); // if no release, stop loading
        return;
    };

    setLoading(true);
    const tasksQuery = query(
        collection(db, 'projects', projectId, 'tasks'),
        where('releaseId', '==', selectedRelease)
    );

    const unsubscribe = onSnapshot(tasksQuery, (querySnapshot) => {
      const loadedTasks: Task[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        loadedTasks.push({
          ...data,
          id: doc.id,
          projectId, // Ensure projectId is attached
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          comments: data.comments?.map((c: any) => ({...c, createdAt: new Date(c.createdAt)})) || []
        } as Task);
      });
      
      const tasksWithCalculatedProgress = loadedTasks.map((task: Task) => {
        if (task.subTasks && task.subTasks.length > 0) {
          const completedSubTasks = task.subTasks.filter(st => st.completed).length;
          const newPercentComplete = Math.round((completedSubTasks / task.subTasks.length) * 100);
          return { ...task, percentComplete: newPercentComplete };
        }
        return task;
      });

      setTasks(tasksWithCalculatedProgress);
      setLoading(false);
    }, (error) => {
      console.error("Failed to load tasks:", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load tasks. Please try again later.'
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [projectId, toast, user, selectedRelease]);


  const handleAddTask = () => {
    setDefaultTaskDialogTab(undefined);
    setTaskToEdit(null);
    setIsTaskDialogOpen(true);
  };

  const handleEditTask = (task: Task, defaultTab?: string) => {
    setDefaultTaskDialogTab(defaultTab);
    setTaskToEdit(task);
    setIsTaskDialogOpen(true);
  };

  const handleDeleteRequest = (task: Task) => {
    setTaskToDelete(task);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (taskToDelete) {
        const taskName = taskToDelete.name;
        try {
            const taskRef = doc(db, 'projects', projectId, 'tasks', taskToDelete.id);
            await deleteDoc(taskRef);
            toast({ title: 'Task Deleted', description: `"${taskName}" has been deleted.`});
        } catch (error) {
            console.error("Error deleting task: ", error);
            toast({ variant: 'destructive', title: "Error", description: "Failed to delete task." });
        }
      setTaskToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleSaveTask = async (task: Task) => {
    const isEditing = !!task.id && tasks.some(t => t.id === task.id);
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
    } catch (error) {
        console.error("Error saving task: ", error);
        toast({ variant: 'destructive', title: "Error", description: "Failed to save task." });
    }
  };

  const handleExport = () => {
    if (tasks.length === 0) {
      toast({ variant: 'destructive', title: "Export failed", description: "There are no tasks to export." });
      return;
    }
    exportToCsv(tasks, `project_${projectId}_tasks.csv`);
    toast({ title: "Export successful", description: "Your tasks have been exported to CSV." });
  };

  const handleSuggestUpdate = (task: Task) => {
    setTaskToSuggest(task);
    setIsSuggestDialogOpen(true);
  }

  const handlePromoteRequest = (task: Task) => {
    setTaskToPromote(task);
    setIsPromoteDialogOpen(true);
  }

  const handleConfirmPromote = async (task: Task, newPhase: string) => {
    const newTaskData: Omit<Task, 'id'> = {
        ...task,
        phase: newPhase,
        status: 'To Do',
        percentComplete: 0,
        subTasks: task.subTasks?.map(st => ({...st, completed: false})),
    };
    // @ts-ignore
    delete newTaskData.id; 

    try {
        await addDoc(collection(db, 'projects', projectId, 'tasks'), {
            ...newTaskData,
            startDate: newTaskData.startDate.toISOString(),
            endDate: newTaskData.endDate.toISOString(),
            createdAt: serverTimestamp(),
            promotedFrom: task.id
        });

        toast({
            title: 'Task Promoted',
            description: `A new task "${newTaskData.name}" was created in the ${newPhase} phase.`
        });
    } catch (error) {
        console.error("Error promoting task:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to promote task.' });
    }
  };

  const handleTaskCompleteToggle = async (taskId: string, isComplete: boolean) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const taskRef = doc(db, 'projects', projectId, 'tasks', taskId);
    let newStatus = task.status;
    let newPercent = task.percentComplete;
    
    if (isComplete) {
        newStatus = task.subTasks && task.subTasks.length > 0 ? 'Testing' : 'Completed';
        newPercent = 100;
    } else {
        newStatus = 'In Progress';
        newPercent = 0;
    }

    try {
        await updateDoc(taskRef, { status: newStatus, percentComplete: newPercent });
    } catch (error) {
        console.error("Error updating task status:", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to update task status.'
        });
    }
}

  const handleSubTaskToggle = async (taskId: string, subTaskId: string, isComplete: boolean) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.subTasks) return;

    const updatedSubTasks = task.subTasks.map(st => 
        st.id === subTaskId ? { ...st, completed: isComplete } : st
    );

    const completedCount = updatedSubTasks.filter(st => st.completed).length;
    const totalCount = updatedSubTasks.length;
    const newPercentComplete = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    
    let newStatus = task.status;
    if (totalCount > 0) {
        if (newPercentComplete === 100) {
          newStatus = 'Testing';
        } else if (newPercentComplete > 0 && task.status !== 'Blocked' && task.status !== 'In Progress') {
          newStatus = 'In Progress';
        } else if (newPercentComplete === 0 && (task.status === 'Completed' || task.status === 'Testing')) {
          newStatus = 'In Progress';
        }
    }
    
    const taskRef = doc(db, 'projects', projectId, 'tasks', taskId);
    try {
        await updateDoc(taskRef, {
            subTasks: updatedSubTasks,
            percentComplete: newPercentComplete,
            status: newStatus
        });
    } catch (error) {
         console.error("Error updating subtask:", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to update sub-task.'
        });
    }
  };

  const toggleColumnCollapse = (phase: string) => {
    setCollapsedColumns(prev => ({ ...prev, [phase]: !prev[phase] }));
  };

  const filteredTasks = useMemo(() => {
    if (!selectedRelease) return [];
    return tasks.filter(task => task.releaseId === selectedRelease);
  }, [tasks, selectedRelease]);

  const handleDeleteRelease = async (releaseId: string) => {
    try {
        const releaseRef = doc(db, 'projects', projectId, 'releases', releaseId);
        const releaseSnap = await getDoc(releaseRef);
        const releaseName = releaseSnap.data()?.name || 'Untitled Release';

        await deleteDoc(releaseRef);
        toast({ title: 'Release Deleted', description: `"${releaseName}" has been deleted.`});
        // After deletion, the useEffect for releases will re-run and handle selection.
    } catch (error) {
        console.error("Error deleting release: ", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete release.' });
    }
  }
  
   const tasksByPhase = useMemo(() => {
    return filteredTasks.reduce((acc, task) => {
        const phase = task.phase;
        if (!acc[phase]) {
            acc[phase] = [];
        }
        acc[phase].push(task);
        return acc;
    }, {} as Record<string, Task[]>);
  }, [filteredTasks]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
        return;
    }

    const activeTask = tasks.find(t => t.id === active.id);
    const overColumnPhase = over.id as string;
    
    if (activeTask && activeTask.phase !== overColumnPhase) {
        // Optimistic UI update
        const updatedTasks = tasks.map(t => t.id === active.id ? { ...t, phase: overColumnPhase, status: 'To Do' as Status } : t);
        setTasks(updatedTasks);
        
        try {
            const taskRef = doc(db, 'projects', activeTask.projectId!, activeTask.id);
            await updateDoc(taskRef, { phase: overColumnPhase, status: 'To Do' });
            toast({
                title: 'Task Updated',
                description: `"${activeTask.name}" moved to ${overColumnPhase}.`
            });
        } catch (error) {
            setTasks(tasks); // Revert on error
            console.error("Error updating task phase:", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to update task phase.'
            });
        }
    }
  };


  if (loading) {
     return (
       <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
         <div className="flex items-center space-x-2">
           <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
           <span className="text-lg font-medium text-muted-foreground">Loading Tasks...</span>
         </div>
       </div>
     );
  }

  return (
    <div className="flex flex-col h-full">
      <Header 
        projectName={projectName}
        onAddTask={handleAddTask} 
        onExport={handleExport}
        releases={releases}
        selectedRelease={selectedRelease}
        onSelectRelease={setSelectedRelease}
        onManageReleases={() => setIsManageReleasesOpen(true)}
        />

      <main className="flex-1 overflow-x-auto custom-scrollbar">
        <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
            <div className="p-4 sm:p-6 lg:p-8 h-full">
            {selectedRelease ? (
            <div className="flex gap-4 h-full">
                {PHASES.map((phase) => {
                const phaseTasks = tasksByPhase[phase] || [];
                const isCollapsed = collapsedColumns[phase];
                return (
                    <DroppableColumn
                        key={phase}
                        status={phase as any}
                        tasks={phaseTasks}
                        isCollapsed={!!isCollapsed}
                        toggleCollapse={() => toggleColumnCollapse(phase)}
                    >
                         <SortableContext
                                items={phaseTasks.map(t => t.id)}
                                strategy={verticalListSortingStrategy}
                            >
                            {phaseTasks.length > 0 ? (
                                phaseTasks.map((task) => (
                                    <DraggableTaskCard key={task.id} task={task}>
                                        <TaskCard 
                                            task={task} 
                                            onEdit={handleEditTask}
                                            onSuggest={handleSuggestUpdate}
                                            onDelete={handleDeleteRequest}
                                            onPromote={handlePromoteRequest}
                                            onCompleteToggle={handleTaskCompleteToggle}
                                            onSubTaskToggle={handleSubTaskToggle}
                                        />
                                    </DraggableTaskCard>
                                ))
                            ) : (
                                <div className="h-24 flex items-center justify-center text-sm text-muted-foreground border-2 border-dashed rounded-lg">
                                    No tasks here.
                                </div>
                            )}
                         </SortableContext>
                    </DroppableColumn>
                )
                })}
            </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto text-center rounded-lg border-2 border-dashed p-12 bg-background">
                    <GitBranch className="h-12 w-12 text-muted-foreground mb-4" />
                    <h2 className="mt-6 text-xl font-semibold">No Releases Found</h2>
                    <p className="mt-2 text-center text-muted-foreground">
                        This project doesn't have any releases yet. Create one to start adding tasks.
                    </p>
                    <Button className="mt-6" onClick={() => setIsManageReleasesOpen(true)}>
                        Create Your First Release
                    </Button>
                </div>
            )}
            </div>
        </DndContext>
      </main>

      <TaskDialog
        isOpen={isTaskDialogOpen}
        onOpenChange={setIsTaskDialogOpen}
        onSave={handleSaveTask}
        taskToEdit={taskToEdit}
        tasks={tasks}
        defaultTab={defaultTaskDialogTab}
        projectId={projectId}
        releaseId={selectedRelease}
      />
      
      <SuggestUpdateDialog
        isOpen={isSuggestDialogOpen}
        onOpenChange={setIsSuggestDialogOpen}
        task={taskToSuggest}
      />

      <DeleteTaskDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        task={taskToDelete}
      />

      <PromoteTaskDialog
        isOpen={isPromoteDialogOpen}
        onOpenChange={setIsPromoteDialogOpen}
        onConfirm={handleConfirmPromote}
        task={taskToPromote}
      />

      <ManageReleasesDialog
        isOpen={isManageReleasesOpen}
        onOpenChange={setIsManageReleasesOpen}
        projectId={projectId}
        releases={releases}
        onDeleteRelease={handleDeleteRelease}
      />
    </div>
  );
}
