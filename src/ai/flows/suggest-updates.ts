'use server';

/**
 * @fileOverview Suggests updates for stalled tasks in a software project.
 *
 * - suggestUpdates - A function that suggests updates for stalled tasks.
 * - SuggestUpdatesInput - The input type for the suggestUpdates function.
 * - SuggestUpdatesOutput - The return type for the suggestUpdates function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestUpdatesInputSchema = z.object({
  phase: z.string().describe('The current phase of the project.'),
  taskName: z.string().describe('The name of the task that is stalled.'),
  taskDescription: z.string().describe('A detailed description of the stalled task.'),
  assignedTeamMember: z.string().describe('The team member assigned to the task.'),
  priority: z.enum(['High', 'Medium', 'Low']).describe('The priority of the task.'),
  estimatedHours: z.number().describe('The estimated hours to complete the task.'),
  startDate: z.string().describe('The start date of the task (ISO format).'),
  endDate: z.string().describe('The end date of the task (ISO format).'),
  currentStatus: z
    .enum(['To Do', 'In Progress', 'Testing', 'Completed', 'Blocked'])
    .describe('The current status of the task.'),
  percentComplete: z.number().describe('The percentage of the task that is complete.'),
  dependencies: z.string().optional().describe('Any dependencies for the task.'),
  notes: z.string().optional().describe('Any notes or comments about the task.'),
});
export type SuggestUpdatesInput = z.infer<typeof SuggestUpdatesInputSchema>;

const SuggestionSchema = z.object({
    title: z.string().describe('A short, actionable title for the suggestion.'),
    description: z.string().describe('A detailed description of the suggested action.'),
    category: z.enum(['Re-scoping', 'Re-assignment', 'Dependency Management', 'Investigation', 'Communication']).describe('The category of the suggestion.'),
});

const SuggestUpdatesOutputSchema = z.object({
  suggestedUpdates: z.array(SuggestionSchema)
    .describe(
      'A list of suggested updates to get the task back on track, including potential reassignments, deadline extensions, or dependency adjustments.'
    ),
});
export type SuggestUpdatesOutput = z.infer<typeof SuggestUpdatesOutputSchema>;

export async function suggestUpdates(input: SuggestUpdatesInput): Promise<SuggestUpdatesOutput> {
  return suggestUpdatesFlow(input);
}

const suggestUpdatesPrompt = ai.definePrompt({
  name: 'suggestUpdatesPrompt',
  input: {schema: SuggestUpdatesInputSchema},
  output: {schema: SuggestUpdatesOutputSchema},
  prompt: `You are an expert project management assistant tasked with identifying solutions for stalled or blocked tasks.

  Given the following details about a stalled task, suggest a list of 2-3 concrete, actionable steps to get it back on track. For each suggestion, provide a clear title, a detailed description, and categorize it.

  Task Details:
  - Phase: {{{phase}}}
  - Task Name: {{{taskName}}}
  - Description: {{{taskDescription}}}
  - Assigned To: {{{assignedTeamMember}}}
  - Priority: {{{priority}}}
  - Estimated Hours: {{{estimatedHours}}}
  - Dates: {{{startDate}}} to {{{endDate}}}
  - Status: {{{currentStatus}}}
  - Progress: {{{percentComplete}}}%
  - Dependencies: {{{dependencies}}}
  - Notes: {{{notes}}}

  Analyze the task details to identify potential root causes for the delay. Is the scope too large? Is there a dependency issue? Is the assignee overloaded?

  Based on your analysis, generate suggestions. Consider:
  - Breaking the task into smaller, more manageable sub-tasks.
  - Re-evaluating dependencies and priorities.
  - Suggesting a discussion between team members.
  - Proposing a specific investigation to clarify an unknown.
  - Recommending a change in approach or a deadline extension.

  Your response must be a structured list of suggestions.
  `,
});

const suggestUpdatesFlow = ai.defineFlow(
  {
    name: 'suggestUpdatesFlow',
    inputSchema: SuggestUpdatesInputSchema,
    outputSchema: SuggestUpdatesOutputSchema,
  },
  async input => {
    const {output} = await suggestUpdatesPrompt(input);
    return output!;
  }
);
