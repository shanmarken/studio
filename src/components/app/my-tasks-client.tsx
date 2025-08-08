
'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { Task } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoaderCircle } from 'lucide-react';
import Link from 'next/link';

interface TaskWithProject extends Task {
  projectName: string;
  projectId: string;
}

export function MyTasksClient() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskWithProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!user || !user.uid) return;

      setLoading(true);
      try {
        const projectsQuery = query(collection(db, 'projects'));
        const projectsSnapshot = await getDocs(projectsQuery);
        const myTasks: TaskWithProject[] = [];

        for (const projectDoc of projectsSnapshot.docs) {
          const tasksQuery = query(
            collection(db, `projects/${projectDoc.id}/tasks`),
            where('assignedToId', '==', user.uid)
          );
          const tasksSnapshot = await getDocs(tasksQuery);
          
          tasksSnapshot.forEach(taskDoc => {
            const taskData = taskDoc.data() as Task;
            myTasks.push({
              ...taskData,
              id: taskDoc.id,
              projectName: projectDoc.data().name,
              projectId: projectDoc.id,
              startDate: new Date(taskData.startDate),
              endDate: new Date(taskData.endDate),
            });
          });
        }
        
        setTasks(myTasks);
      } catch (error) {
        console.error("Error fetching tasks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [user]);

  return (
    <>
        <header className="sticky top-0 z-10 bg-background/90 backdrop-blur-sm border-b">
            <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:p-8">
                <h1 className="text-2xl font-bold">My Tasks</h1>
            </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
            {loading ? (
                <div className="flex h-64 items-center justify-center">
                    <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : tasks.length === 0 ? (
                <Card>
                    <CardHeader>
                        <CardTitle>No Tasks Found</CardTitle>
                        <CardDescription>You do not have any tasks assigned to you.</CardDescription>
                    </CardHeader>
                </Card>
            ) : (
                <div className="space-y-4">
                    {tasks.map(task => (
                        <Card key={task.id}>
                            <CardHeader>
                                <CardTitle>{task.name}</CardTitle>

                                <CardDescription>
                                    In project: <Link href={`/projects/${task.projectId}`} className="text-primary hover:underline">{task.projectName}</Link>
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">{task.description}</p>
                                <div className="mt-4 flex justify-between items-center text-sm">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${task.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{task.status}</span>
                                    <span>Due: {task.endDate.toLocaleDateString()}</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </main>
    </>
  );
}
