
'use client';

import { useEffect, useState, useMemo } from 'react';
import { collection, query, getDocs, collectionGroup } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { Task } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoaderCircle } from 'lucide-react';
import Link from 'next/link';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '../ui/badge';
import { isSameDay } from 'date-fns';

interface TaskWithProject extends Task {
  projectName: string;
  projectId: string;
}

export function CalendarView() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskWithProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    const fetchTasks = async () => {
      if (!user) return;

      setLoading(true);
      try {
        const projectsQuery = query(collection(db, 'users', user.uid, 'projects'));
        const projectsSnapshot = await getDocs(projectsQuery);
        
        const allTasks: TaskWithProject[] = [];

        for (const projectDoc of projectsSnapshot.docs) {
            const tasksQuery = query(collection(db, 'users', user.uid, 'projects', projectDoc.id, 'tasks'));
            const tasksSnapshot = await getDocs(tasksQuery);

            tasksSnapshot.forEach(taskDoc => {
                const taskData = taskDoc.data();
                allTasks.push({
                    ...(taskData as Task),
                    id: taskDoc.id,
                    projectName: projectDoc.data().name,
                    projectId: projectDoc.id,
                    startDate: new Date(taskData.startDate),
                    endDate: new Date(taskData.endDate),
                });
            });
        }
        
        setTasks(allTasks);
      } catch (error) {
        console.error("Error fetching tasks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [user]);

  const tasksByDueDate = useMemo(() => {
    return tasks.reduce((acc, task) => {
      const dateKey = task.endDate.toISOString().split('T')[0];
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(task);
      return acc;
    }, {} as Record<string, TaskWithProject[]>);
  }, [tasks]);

  const selectedDayTasks = useMemo(() => {
    if (!selectedDate) return [];
    return tasks.filter(task => isSameDay(task.endDate, selectedDate));
  }, [tasks, selectedDate]);
  
  const modifiers = {
    due: Object.keys(tasksByDueDate).map(dateStr => new Date(dateStr)),
  };

  const modifiersStyles = {
    due: {
      color: 'hsl(var(--primary-foreground))',
      backgroundColor: 'hsl(var(--primary))',
      borderRadius: '9999px',
    },
  };

  return (
    <>
      <header className="sticky top-0 z-10 bg-background/90 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:p-8">
          <h1 className="text-2xl font-bold">Calendar</h1>
        </div>
      </header>
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        {loading ? (
            <div className="flex h-64 items-center justify-center">
                <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
            </div>
        ) : (
            <div className="grid md:grid-cols-2 gap-8">
                <Card>
                    <CardContent className="p-2">
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            className="rounded-md"
                            modifiers={modifiers}
                            modifiersStyles={modifiersStyles}
                        />
                    </CardContent>
                </Card>
                <div>
                    <h2 className="text-xl font-semibold mb-4">
                        Tasks due on {selectedDate ? selectedDate.toLocaleDateString() : '...'}
                    </h2>
                    {selectedDayTasks.length > 0 ? (
                        <div className="space-y-4">
                            {selectedDayTasks.map(task => (
                                <Card key={task.id}>
                                    <CardHeader>
                                        <CardTitle className="text-lg">{task.name}</CardTitle>
                                        <CardDescription>
                                            In project: <Link href={`/projects/${task.projectId}`} className="text-primary hover:underline">{task.projectName}</Link>
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex justify-between items-center text-sm">
                                            <Badge variant={task.status === 'Completed' ? 'default' : 'secondary'} className={task.status === 'Completed' ? 'bg-green-500/80 text-white' : ''}>{task.status}</Badge>
                                            <span>Assigned to: {task.assignedTo}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card className="flex items-center justify-center h-40 border-dashed">
                            <p className="text-muted-foreground">No tasks due on this day.</p>
                        </Card>
                    )}
                </div>
            </div>
        )}
      </main>
    </>
  );
}
