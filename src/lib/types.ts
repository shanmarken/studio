export type Status = 'To Do' | 'In Progress' | 'Completed' | 'Blocked';
export type Priority = 'High' | 'Medium' | 'Low';

export type Task = {
  id: string;
  name: string;
  description: string;
  assignedTo: string;
  priority: Priority;
  estimatedHours: number;
  startDate: Date;
  endDate: Date;
  status: Status;
  percentComplete: number;
  dependencies?: string;
  notes?: string;
  phase: string;
};
