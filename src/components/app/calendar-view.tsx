
'use client';

import { useEffect, useState, useMemo } from 'react';
import { collection, query, getDocs, collectionGroup, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { Task } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoaderCircle, ChevronLeft, ChevronRight, Search, Plus, Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '../ui/badge';
import { isSameDay, addDays, startOfWeek, format, eachDayOfInterval, addWeeks, subWeeks, isToday, getMonth } from 'date-fns';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';
import { Input } from '../ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { TaskDialog } from './task-dialog';

interface TaskWithProject extends Task {
  projectName: string;
  projectId: string;
}

export function CalendarView() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskWithProject[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  const weekStartsOn = 1; // Monday

  const startOfCurrentWeek = startOfWeek(currentDate, { weekStartsOn });
  const daysInWeek = eachDayOfInterval({
    start: startOfCurrentWeek,
    end: addDays(startOfCurrentWeek, 6),
  });

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
    daysInWeek.forEach(day => {
        const dayKey = format(day, 'yyyy-MM-dd');
        grouped[dayKey] = tasks.filter(task => isSameDay(task.endDate, day));
    });
    return grouped;
  }, [tasks, daysInWeek]);

  const dueTasks = useMemo(() => {
    return tasks.filter(task => isSameDay(task.endDate, selectedDate));
  }, [tasks, selectedDate]);

  const timeSlots = Array.from({ length: 11 }, (_, i) => `${i + 8}:00`); // 8am to 6pm

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
        setSelectedDate(date);
        if (getMonth(date) !== getMonth(currentDate)) {
            setCurrentDate(date);
        }
    }
  }

  const handleAddTask = () => {
    setTaskToEdit(null);
    setIsTaskDialogOpen(true);
  };

  const handleSaveTask = (task: Task) => {
    // This is a placeholder. You'll need to implement the actual save logic.
    console.log("Saving task", task);
  };


  return (
    <>
    <div className="flex flex-col h-full bg-muted/40 text-foreground p-4 sm:px-6 sm:pb-6">
         <div className="border-b border-border/50 flex-shrink-0">
             <div className='flex items-center justify-between gap-4 py-2'>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setCurrentDate(new Date())}>Today</Button>
                    <Button variant="outline" onClick={() => setCurrentDate(subWeeks(currentDate, 1))}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                     <Button variant="outline" onClick={() => setCurrentDate(addWeeks(currentDate, 1))}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <h2 className="text-xl font-semibold">{format(startOfCurrentWeek, 'MMMM yyyy')}</h2>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search tasks..." className="pl-8" />
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                Week <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem>Day</DropdownMenuItem>
                            <DropdownMenuItem>Week</DropdownMenuItem>
                            <DropdownMenuItem>Month</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button onClick={handleAddTask}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Task
                    </Button>
                </div>
             </div>
         </div>
        <header className="flex items-start justify-between pt-4 flex-shrink-0 gap-8">
            <Card className="flex-1 h-64 bg-background">
                <CardHeader>
                    <CardTitle>Tasks Due: {format(selectedDate, 'MMMM d')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-40">
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
                        onSelect={handleDateSelect}
                        month={currentDate}
                        onMonthChange={setCurrentDate}
                        className="rounded-md border bg-background hidden lg:block"
                    />
                </div>
             </div>
        </header>
        <main className="flex-1 overflow-auto custom-scrollbar bg-background rounded-lg border border-border/50 mt-4 p-4">
            {loading ? (
                 <div className="flex h-full w-full items-center justify-center">
                    <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="grid grid-cols-[auto,1fr] h-full">
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
                    <div className="grid grid-cols-7 border-l border-border/50">
                        {daysInWeek.map(day => (
                            <div key={day.toString()} className="border-r border-border/50 relative">
                                <div className="sticky top-0 bg-background/90 backdrop-blur-sm z-10 text-center py-2 border-b border-border/50 h-16 flex flex-col justify-center">
                                    <div className="text-sm uppercase text-muted-foreground">{format(day, 'EEE')}</div>
                                    <div className={cn("text-2xl font-bold", isToday(day) && "bg-primary text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center mx-auto")}>
                                        {format(day, 'd')}
                                    </div>
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
                                                <Card className="bg-primary/10 border-l-4 border-primary hover:bg-primary/20 transition-colors p-2 text-xs cursor-pointer">
                                                    <p className="font-semibold truncate">{task.name}</p>
                                                    <p className="text-muted-foreground truncate">{task.projectName}</p>
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
