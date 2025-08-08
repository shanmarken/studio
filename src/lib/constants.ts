
import { Priority, Status, Task } from './types';

export const PHASES = [
  'Requirements',
  'Software Requirements Specification',
  'UI/UX Design',
  'Database Design',
  'Backend Development',
  'Frontend Development',
  'User Testing',
  'Software Testing (QA)',
  'Deployment',
  'Post-Deployment Monitoring',
];

export const STATUSES: Status[] = ['To Do', 'In Progress', 'Completed', 'Blocked'];
export const PRIORITIES: Priority[] = ['High', 'Medium', 'Low'];

export const INITIAL_TASKS: Task[] = [];
