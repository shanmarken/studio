
import { collection, getDocs, doc, collectionGroup } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Task } from '@/lib/types';
import { z } from 'zod';

const TaskSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  assignedTo: z.string(),
  assignedToId: z.string().optional(),
  priority: z.enum(['High', 'Medium', 'Low']),
  estimatedHours: z.number(),
  startDate: z.string(),
  endDate: z.string(),
  status: z.enum(['To Do', 'In Progress', 'Completed', 'Blocked']),
  percentComplete: z.number(),
  dependencies: z.string().optional(),
  notes: z.string().optional(),
  phase: z.string(),
});

export const ProjectWithTasks = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  ownerId: z.string(),
  tasks: z.array(TaskSchema),
});
export type ProjectWithTasks = z.infer<typeof ProjectWithTasks>;

/**
 * Fetches all projects and their associated tasks from Firestore.
 * @returns A promise that resolves to an array of projects, each with its tasks.
 */
export async function getAllProjectsWithTasks(): Promise<ProjectWithTasks[]> {
  const projectsRef = collection(db, 'projects');
  const projectsSnapshot = await getDocs(projectsRef);

  const allProjects = await Promise.all(
    projectsSnapshot.docs.map(async (projectDoc) => {
      const projectData = projectDoc.data();
      const tasksRef = collection(db, 'projects', projectDoc.id, 'tasks');
      const tasksSnapshot = await getDocs(tasksRef);
      
      const tasks = tasksSnapshot.docs.map((taskDoc) => {
        const data = taskDoc.data();
        return {
          ...data,
          id: taskDoc.id,
          // Ensure dates are ISO strings for serialization
          startDate: new Date(data.startDate).toISOString(),
          endDate: new Date(data.endDate).toISOString(),
        } as z.infer<typeof TaskSchema>;
      });

      return {
        id: projectDoc.id,
        name: projectData.name,
        description: projectData.description,
        ownerId: projectData.ownerId,
        tasks: tasks,
      };
    })
  );

  return allProjects;
}
