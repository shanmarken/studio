
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { z } from 'zod';

export const TaskSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.string().optional(),
  assignedTo: z.string().nullable().optional(),
});

export const ProjectWithTasksSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  tasks: z.array(TaskSchema),
});
export type ProjectWithTasks = z.infer<typeof ProjectWithTasksSchema>;


/**
 * Fetches a single project and its associated tasks from Firestore.
 * @param projectId The ID of the project to fetch.
 * @returns A promise that resolves to the project with its tasks, or null if not found.
 */
export async function getProjectWithTasks(projectId: string): Promise<ProjectWithTasks | null> {
  const projectRef = doc(db, 'projects', projectId);
  const projectDoc = await getDoc(projectRef);

  if (!projectDoc.exists()) {
    return null;
  }

  const projectData = projectDoc.data();
  const tasksRef = collection(db, 'projects', projectId, 'tasks');
  const tasksSnapshot = await getDocs(tasksRef);
  
  const tasks = tasksSnapshot.docs.map((taskDoc) => {
    const data = taskDoc.data();
    return {
      id: taskDoc.id,
      name: data.name || 'Untitled Task',
      status: data.status || 'To Do',
      assignedTo: data.assignedTo || 'Unassigned',
    };
  });

  return {
    id: projectDoc.id,
    name: projectData.name,
    description: projectData.description,
    tasks: tasks,
  };
}
