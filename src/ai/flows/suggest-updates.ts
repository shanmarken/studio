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
    .enum(['To Do', 'In Progress', 'Completed', 'Blocked'])
    .describe('The current status of the task.'),
  percentComplete: z.number().describe('The percentage of the task that is complete.'),
  dependencies: z.string().optional().describe('Any dependencies for the task.'),
  notes: z.string().optional().describe('Any notes or comments about the task.'),
});
export type SuggestUpdatesInput = z.infer<typeof SuggestUpdatesInputSchema>;

const SuggestUpdatesOutputSchema = z.object({
  suggestedUpdates: z
    .string()
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
  prompt: `You are a project management assistant tasked with identifying solutions for stalled tasks.

  Given the following details about a stalled task, suggest concrete steps to get the task back on track.

  Phase: {{{phase}}}
  Task Name: {{{taskName}}}
  Task Description: {{{taskDescription}}}
  Assigned Team Member: {{{assignedTeamMember}}}
  Priority: {{{priority}}}
  Estimated Hours: {{{estimatedHours}}}
  Start Date: {{{startDate}}}
  End Date: {{{endDate}}}
  Current Status: {{{currentStatus}}}
  Percent Complete: {{{percentComplete}}}
  Dependencies: {{{dependencies}}}
  Notes: {{{notes}}}

  Consider potential reassignments, deadline extensions, dependency adjustments, or other relevant actions.
  Provide specific, actionable suggestions.
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
