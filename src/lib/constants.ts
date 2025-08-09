import { Priority, Status, Task } from './types';

export const PHASES = [
  'Requirements',
  'SRS',
  'UI/UX Design',
  'Database Design',
  'Backend Development',
  'Frontend Development',
  'User Testing',
  'Software Testing (QA)',
  'Deployment',
  'Post-Deployment Monitoring',
];

export const STATUSES: Status[] = ['To Do', 'In Progress', 'Testing', 'Completed', 'Blocked'];
export const PRIORITIES: Priority[] = ['High', 'Medium', 'Low'];

export const INITIAL_TASKS: Task[] = [];
