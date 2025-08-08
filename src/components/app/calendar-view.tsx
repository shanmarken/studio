
'use client';

import { useEffect, useState, useMemo } from 'react';
import { collection, query, getDocs, collectionGroup, getDoc, onSnapshot, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { Task, Status } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoaderCircle, ChevronLeft, ChevronRight, Search, Plus, Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '../ui/badge';
import { isSameDay, addDays, startOfWeek, format, eachDayOfInterval, addWeeks, subWeeks, isToday, getMonth, addMonths, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';
import { Input } from '../ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { TaskDialog } from './task-dialog';
import { useToast } from '@/hooks/use-toast';

interface TaskWithProject extends Task {
  projectName: string;
  projectId: string;
}

const statusColorMap: Record<Status, string> = {
    'To Do': 'bg-gray-500/10 border-gray-500/40 hover:bg-gray-500/20',
    'In Progress': 'bg-blue-500/10 border-blue-500/40 hover:bg-blue-500/20',
    'Completed': 'bg-green-500/10 border-green-500/40 hover:bg-green-500/20',
    'Blocked': 'bg-red-500/10 border-red-500/40 hover:bg-red-500/20',
  };

export function CalendarView() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<TaskWithProject[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('week');

  const weekStartsOn = 1; // Monday

  const startOfCurrentWeek = startOfWeek(currentDate, { weekStartsOn });
  
  const days = useMemo(() => {
    if (viewMode === 'week') {
      return eachDayOfInterval({
        start: startOfCurrentWeek,
        end: addDays(startOfCurrentWeek, 6),
      });
    }
    if (viewMode === 'day') {
      return [selectedDate];
    }
    // Placeholder for month view
    return [];
  }, [viewMode, currentDate, selectedDate, startOfCurrentWeek]);


   useEffect(() => {
    const fetchTasks = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const tasksQuery = collectionGroup(db, 'tasks');
        const unsubscribe = onSnapshot(tasksQuery, async (tasksSnapshot) => {
            const tasksData = await Promise.all(
                tasksSnapshot.docs.map(async (taskDoc) => {
                  const taskData = taskDoc.data();
                  const projectRef = taskDoc.ref.parent.parent;
                  if (!projectRef) return null;
      
                  const projectSnap = await getDoc(projectRef);
                  const projectName = projectSnap.exists() ? projectSnap.data()?.name : 'Unknown Project';
                  
                  return {
                    ...(taskData as Task),
                    id: taskDoc.id,
                    projectName: projectName,
                    projectId: projectRef.id,
                    startDate: new Date(taskData.startDate),
                    endDate: new Date(taskData.endDate),
                  };
                })
            );
            setTasks(tasksData.filter(Boolean) as TaskWithProject[]);
            setAllTasks(tasksData.filter(Boolean) as Task[]);
            setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("Error fetching tasks:", error);
        setLoading(false);
      }
    };
    fetchTasks();
  }, [user]);

  const tasksByDay = useMemo(() => {
    const grouped: { [key: string]: TaskWithProject[] } = {};
    days.forEach(day => {
        const dayKey = format(day, 'yyyy-MM-dd');
        grouped[dayKey] = tasks.filter(task => isSameDay(task.endDate, day));
    });
    return grouped;
  }, [tasks, days]);

  const dueTasks = useMemo(() => {
    return tasks.filter(task => isSameDay(task.endDate, selectedDate) && task.status !== 'Completed');
  }, [tasks, selectedDate]);

  const timeSlots = Array.from({ length: 11 }, (_, i) => `${i + 8}:00`); // 8am to 6pm

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
        setSelectedDate(date);
        setCurrentDate(date);
    }
  }

  const handleAddTask = () => {
    setTaskToEdit(null);
    setIsTaskDialogOpen(true);
  };

  const handleSaveTask = async (task: Task) => {
    const isEditing = !!task.id && tasks.some(t => t.id === task.id);
    let taskName = task.name;
    const projectId = task.projectId;
    
    if (!projectId) {
        toast({ variant: 'destructive', title: "Error", description: "Project ID is missing." });
        return;
    }

    if (task.subTasks && task.subTasks.length > 0) {
        const completedCount = task.subTasks.filter(st => st.completed).length;
        const totalCount = task.subTasks.length;
        task.percentComplete = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : task.percentComplete;
    }

    const taskData = {
        ...task,
        startDate: task.startDate.toISOString(),
        endDate: task.endDate.toISOString(),
    };
    // @ts-ignore
    delete taskData.projectId;

    try {
        if (isEditing) {
            const taskRef = doc(db, 'projects', projectId, 'tasks', task.id);
            // @ts-ignore
            delete taskData.id;
            await updateDoc(taskRef, taskData);
            toast({ title: "Task Updated", description: `"${taskName}" has been successfully updated.` });
        } else {
            // @ts-ignore
            delete taskData.id;
            const docRef = await addDoc(collection(db, 'projects', projectId, 'tasks'), {
                ...taskData,
                createdAt: serverTimestamp()
            });
            taskName = task.name;
            toast({ title: "Task Added", description: `"${taskName}" has been successfully added.` });
        }
    } catch (error) {
        console.error("Error saving task: ", error);
        toast({ variant: 'destructive', title: "Error", description: "Failed to save task." });
    }
  };

  const handlePrev = () => {
    if (viewMode === 'week') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else if (viewMode === 'day') {
      const newDate = addDays(selectedDate, -1);
      setSelectedDate(newDate);
      setCurrentDate(newDate);
    }
  };

  const handleNext = () => {
    if (viewMode === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else if (viewMode === 'day') {
        const newDate = addDays(selectedDate, 1);
        setSelectedDate(newDate);
        setCurrentDate(newDate);
    }
  };
  
  const getHeaderText = () => {
    if (viewMode === 'week') {
      return format(startOfCurrentWeek, 'MMMM yyyy');
    }
    if (viewMode === 'day') {
      return format(selectedDate, 'EEEE, MMMM d');
    }
    return '';
  }


  return (
    <>
    <div className="flex flex-col flex-1 h-full">
         <div className="border-b border-border/50 flex-shrink-0 sticky top-0 bg-background z-20">
             <div className='flex items-center justify-between gap-4 p-2 sm:px-6'>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => handleDateSelect(new Date())}>Today</Button>
                    <Button variant="outline" size="icon" onClick={handlePrev}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                     <Button variant="outline" size="icon" onClick={handleNext}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <h2 className="text-xl font-semibold">{getHeaderText()}</h2>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search tasks..." className="pl-8" />
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className='capitalize'>
                                {viewMode} <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => setViewMode('day')}>Day</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setViewMode('week')}>Week</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setViewMode('month')} disabled>Month</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button onClick={handleAddTask}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Task
                    </Button>
                </div>
             </div>
         </div>
        <div className="sm:px-6 sm:pb-6">
            <header className="flex items-start justify-between flex-shrink-0 gap-8 pt-4">
                <Card className="flex-1 bg-background">
                    <CardHeader>
                        <CardTitle>Tasks Due: {format(selectedDate, 'MMMM d')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-64">
                            {dueTasks.length > 0 ? (
                                <div className="space-y-2">
                                {dueTasks.map(task => (
                                    <Link href={`/projects/${task.projectId}`} key={task.id}>
                                        <div className="p-2 rounded-md bg-muted/40 hover:bg-muted/80 transition-colors cursor-pointer shadow-sm border">
                                            <p className="font-semibold text-sm">{task.name}</p>
                                            <p className="text-xs text-muted-foreground">{task.projectName}</p>
                                        </div>
                                    </Link>
                                ))}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                                    No tasks due on this date.
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>
                <div className="w-72">
                    <div className="flex flex-col gap-2">
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={handleDateSelect}
                            month={currentDate}
                            onMonthChange={setCurrentDate}
                            className="rounded-md border bg-background hidden lg:block"
                        />
                    </div>
                </div>
            </header>
            <main className="bg-background rounded-lg border border-border/50 mt-4">
                {loading ? (
                    <div className="flex h-full w-full items-center justify-center p-8">
                        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="grid grid-cols-[auto,1fr] h-full p-4">
                        {/* Time slots column */}
                        <div className="w-20 text-xs text-muted-foreground">
                            <div className="h-16"></div> {/* Spacer for day headers */}
                            {timeSlots.map(time => (
                                <div key={time} className="h-24 flex items-start justify-end pr-2 pt-1 border-t border-border/50">
                                    <span>{time}</span>
                                </div>
                            ))}
                        </div>
                        {/* Days columns */}
                        <div className={cn("grid border-l border-border/50", viewMode === 'week' ? "grid-cols-7" : "grid-cols-1")}>
                            {days.map(day => (
                                <div key={day.toString()} className="border-r border-border/50 relative">
                                    <div className={cn(
                                        "sticky top-[65px] bg-background/90 backdrop-blur-sm z-10 py-2 border-b border-border/50 h-16 flex flex-col", 
                                        viewMode === 'week' ? 'text-center justify-center' : 'justify-center px-4'
                                    )}>
                                        {viewMode === 'week' ? (
                                            <>
                                                <div className="text-sm uppercase text-muted-foreground">{format(day, 'EEE')}</div>
                                                <div className={cn(
                                                    "text-2xl font-bold", 
                                                    isToday(day) && "bg-primary text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center mx-auto"
                                                )}>
                                                    {format(day, 'd')}
                                                </div>
                                            </>
                                        ) : (
                                            <div className={cn("text-xl font-bold", isToday(day) && "text-primary")}>
                                                {format(day, 'EEEE, MMMM d')}
                                            </div>
                                        )}
                                    </div>
                                    <div className="relative h-full">
                                        {/* Time slot lines */}
                                        {timeSlots.map(time => (
                                            <div key={time} className="h-24 border-t border-border/50"></div>
                                        ))}
                                        {/* Tasks */}
                                        <div className="absolute inset-0 top-16 p-1 space-y-1">
                                            {(tasksByDay[format(day, 'yyyy-MM-dd')] || []).map(task => (
                                                <Link href={`/projects/${task.projectId}`} key={task.id}>
                                                    <Card className={cn(
                                                        "border-l-4 transition-colors p-2 text-xs cursor-pointer",
                                                        statusColorMap[task.status]
                                                        )}>
                                                        <div className="flex flex-col gap-1">
                                                          <p className="font-semibold truncate">{task.name}</p>
                                                          <p className="text-muted-foreground truncate">{task.projectName}</p>
                                                          <div className="flex justify-center">
                                                            <Badge variant="outline" className='text-xs'>{task.status}</Badge>
                                                          </div>
                                                        </div>
                                                    </Card>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    </div>
    <TaskDialog
        isOpen={isTaskDialogOpen}
        onOpenChange={setIsTaskDialogOpen}
        onSave={handleSaveTask}
        taskToEdit={taskToEdit}
        tasks={allTasks}
      />
    </>
  );
}
