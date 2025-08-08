
'use client';

import { useEffect, useState, useMemo } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { Task, Status } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoaderCircle } from 'lucide-react';
import Link from 'next/link';
import { TaskCard } from './task-card';

const STATUS_COLUMNS: Status[] = ['To Do', 'In Progress', 'Completed', 'Blocked'];

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
            const taskData = taskDoc.data();
            myTasks.push({
              ...(taskData as Task),
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

  const tasksByStatus = useMemo(() => {
    return tasks.reduce((acc, task) => {
        const status = task.status;
        if (!acc[status]) {
            acc[status] = [];
        }
        acc[status].push(task);
        return acc;
    }, {} as Record<Status, TaskWithProject[]>);
  }, [tasks]);

  const SimplifiedTaskCard = (props: { task: TaskWithProject }) => {
    return (
        <TaskCard
            task={props.task}
            onEdit={() => {}}
            onSuggest={() => {}}
            onDelete={() => {}}
            onPromote={() => {}}
            onCompleteToggle={() => {}}
            onSubTaskToggle={() => {}}
        />
    )
  }

  return (
    <>
        <header className="sticky top-0 z-10 bg-background/90 backdrop-blur-sm border-b">
            <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:p-8">
                <h1 className="text-2xl font-bold">My Tasks</h1>
            </div>
        </header>
        <main className="flex-1 overflow-x-auto">
            {loading ? (
                <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
                    <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : tasks.length === 0 ? (
                 <div className="p-4 sm:p-6 lg:p-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>No Tasks Found</CardTitle>
                            <CardDescription>You do not have any tasks assigned to you.</CardDescription>
                        </CardHeader>
                    </Card>
                </div>
            ) : (
                <div className="p-4 sm:p-6 lg:p-8 h-full flex gap-8">
                    {STATUS_COLUMNS.map(status => {
                        const columnTasks = tasksByStatus[status] || [];
                        if (columnTasks.length === 0) return null;
                        
                        return (
                            <div key={status} className="flex-shrink-0 w-80 md:w-96">
                                <div className="sticky top-0 bg-background/80 backdrop-blur-sm z-10 p-4 -mx-4 flex items-center justify-center">
                                    <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                                        {status}
                                        <span className="text-sm font-normal text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                                            {columnTasks.length}
                                        </span>
                                    </h2>
                                </div>
                                <div className="h-full">
                                    {columnTasks.map(task => (
                                        <Card key={task.id} className="mb-4">
                                            <CardHeader>
                                                <CardTitle className="text-base">{task.name}</CardTitle>
                                                <CardDescription>
                                                    In project: <Link href={`/projects/${task.projectId}`} className="text-primary hover:underline">{task.projectName}</Link>
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
                                                <div className="mt-4 flex justify-between items-center text-sm">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${task.priority === 'High' ? 'bg-red-100 text-red-800' : task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>{task.priority} Priority</span>
                                                    <span>Due: {task.endDate.toLocaleDateString()}</span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </main>
    </>
  );
}
