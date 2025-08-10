

export type Status = 'To Do' | 'In Progress' | 'Testing' | 'Completed' | 'Blocked';
export type Priority = 'High' | 'Medium' | 'Low';
export type UserRole = 'admin' | 'developer' | 'management';

export type Attachment = {
  name: string;
  url: string;
  type: string;
};

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

export type Release = {
  id: string;
  name: string;
  projectId: string;
  createdAt: any;
}

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
  attachments?: Attachment[];
  projectId?: string;
  releaseId?: string;
};

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
}

    