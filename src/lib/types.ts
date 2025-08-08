

export type Status = 'To Do' | 'In Progress' | 'Completed' | 'Blocked';
export type Priority = 'High' | 'Medium' | 'Low';
export type UserRole = 'admin' | 'developer' | 'management';

export type Comment = {
  id: string;
  author: string;
  authorId: string;
  text: string;
  createdAt: Date;
};

export type SubTask = {
  id: string;
  name: string;
  completed: boolean;
};

export type Task = {
  id: string;
  name: string;
  description: string;
  assignedTo: string;
  assignedToId?: string;
  priority: Priority;
  estimatedHours: number;
  startDate: Date;
  endDate: Date;
  status: Status;
  percentComplete: number;
  dependencies?: string;
  notes?: string;
  phase: string;
  subTasks?: SubTask[];
  comments?: Comment[];
  projectId?: string;
};
