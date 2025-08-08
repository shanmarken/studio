
'use client';

import { useEffect, useState, useMemo } from 'react';
import { collection, getDocs, collectionGroup } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { Task } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { LoaderCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Calendar } from '@/components/ui/calendar';
import { addDays, startOfWeek, format, isSameDay, eachDayOfInterval, addWeeks, subWeeks, isToday } from 'date-fns';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';


interface TaskWithProject extends Task {
  projectName: string;
  projectId: string;
}

export function WeekViewCalendar() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskWithProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

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
        const projectsQuery = collectionGroup(db, 'tasks');
        const tasksSnapshot = await getDocs(projectsQuery);
        
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
      } catch (error) {
        console.error("Error fetching tasks:", error);
      } finally {
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

  const timeSlots = Array.from({ length: 11 }, (_, i) => `${i + 8}:00`); // 8am to 6pm

  return (
    <div className="flex h-screen bg-background text-foreground">
        <div className="w-64 border-r border-border p-4 flex flex-col gap-4">
            <h2 className="text-xl font-bold">Calendar</h2>
            <Calendar
                mode="single"
                selected={currentDate}
                onSelect={(date) => date && setCurrentDate(date)}
                className="rounded-md border"
            />
            {/* Placeholder for other sidebar content like "My Calendars" */}
        </div>
        <div className="flex-1 flex flex-col">
            <header className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-4">
                    <Button variant="outline" onClick={() => setCurrentDate(new Date())}>Today</Button>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setCurrentDate(subWeeks(currentDate, 1))}>
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setCurrentDate(addWeeks(currentDate, 1))}>
                            <ChevronRight className="h-5 w-5" />
                        </Button>
                    </div>
                    <h2 className="text-xl font-semibold">
                        {format(startOfCurrentWeek, 'MMMM yyyy')}
                    </h2>
                </div>
                {/* View switcher can go here */}
            </header>
            <main className="flex-1 overflow-auto">
                {loading ? (
                     <div className="flex h-full w-full items-center justify-center">
                        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="grid grid-cols-[auto,1fr] h-full">
                        {/* Time slots column */}
                        <div className="w-20 text-xs text-muted-foreground border-r border-border">
                            {timeSlots.map(time => (
                                <div key={time} className="h-24 flex items-start justify-end pr-2 pt-1">
                                    <span>{time}</span>
                                </div>
                            ))}
                        </div>
                        {/* Days columns */}
                        <div className="grid grid-cols-7">
                            {daysInWeek.map(day => (
                                <div key={day.toString()} className="border-r border-border relative">
                                    <div className="sticky top-0 bg-background/80 backdrop-blur-sm z-10 text-center py-2 border-b border-border">
                                        <div className="text-xs uppercase text-muted-foreground">{format(day, 'EEE')}</div>
                                        <div className={cn("text-2xl font-semibold", isToday(day) && "text-primary")}>
                                            {format(day, 'd')}
                                        </div>
                                    </div>
                                    <div className="relative h-full">
                                        {/* Time slot lines */}
                                        {timeSlots.map(time => (
                                            <div key={time} className="h-24 border-b border-border/50"></div>
                                        ))}
                                        {/* Tasks */}
                                        <div className="absolute inset-0 p-1 space-y-1">
                                            {(tasksByDay[format(day, 'yyyy-MM-dd')] || []).map(task => (
                                                <Link href={`/projects/${task.projectId}`} key={task.id}>
                                                    <Card className="bg-primary/10 border-primary/20 hover:bg-primary/20 transition-colors p-2 text-xs">
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
    </div>
  );
}
