
'use server';
/**
 * @fileOverview Generates insights about software projects.
 *
 * - generateInsights - A function that analyzes a project's tasks.
 * - GenerateInsightsOutput - The return type for the generateInsights function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getProjectWithTasks, ProjectWithTasks } from '@/services/project-service';

const AtRiskProjectSchema = z.object({
    projectName: z.string().describe('The name of the project.'),
    projectId: z.string().describe('The ID of the project.'),
    riskReason: z.string().describe('A brief explanation of why the project is considered at risk.'),
    suggestedAction: z.string().describe('A concrete next step to mitigate the risk.'),
});

const TeamMemberPerformanceSchema = z.object({
    teamMemberName: z.string().describe("The team member's name."),
    completedTasks: z.number().describe('The number of tasks completed by the team member.'),
    inProgressTasks: z.number().describe('The number of tasks currently in progress.'),
    blockedTasks: z.number().describe('The number of tasks that are currently blocked.'),
    performanceSummary: z.string().describe('A brief summary of the team member\'s performance and workload.'),
});

const GenerateInsightsOutputSchema = z.object({
  overallSummary: z.string().describe('A high-level summary of the project, including progress, velocity, and any major blockers.'),
  atRiskProjects: z.array(AtRiskProjectSchema).describe('A list of items within the project that are at risk (e.g. epics, features, or specific tasks).'),
  teamPerformance: z.array(TeamMemberPerformanceSchema).describe("An analysis of each team member's performance within the project."),
});
export type GenerateInsightsOutput = z.infer<typeof GenerateInsightsOutputSchema>;

export async function generateInsights(projectId: string): Promise<GenerateInsightsOutput> {
  const project = await getProjectWithTasks(projectId);
  if (!project) {
    throw new Error('Project not found');
  }
  return generateInsightsFlow(project);
}

const generateInsightsPrompt = ai.definePrompt({
  name: 'generateInsightsPrompt',
  input: { schema: ProjectWithTasks },
  output: { schema: GenerateInsightsOutputSchema },
  prompt: `You are an expert project management analyst. Your task is to provide a detailed analysis of a software project based on a simplified dataset.
  
  Analyze the following project data, which includes the project name and a list of its tasks with only their name, assignee, status, and percent complete.
  
  Project Data:
  {{{json this}}}
  
  Your analysis should include three parts:
  
  1.  **Overall Summary**: Provide a high-level executive summary of the project. Comment on the general velocity based on the distribution of task statuses. Identify any potential bottlenecks if many tasks are in 'Blocked' or 'Testing' state.
  
  2.  **At-Risk Items**: Based on the task names and statuses, identify any tasks that seem like they could be at risk. For example, a task named "Finalize API" that is still 'In Progress' might be a risk. Provide its name and a brief, actionable reason why it might be at risk.
  
  3.  **Team Performance**: Analyze the workload and output of each team member. For each person, calculate the number of completed, in-progress, and blocked tasks. Provide a brief, objective performance summary. Note if a team member seems overloaded with in-progress tasks or is frequently blocked.
  
  Provide a structured, data-driven, and objective report. If there are no tasks, state that analysis cannot be performed.`,
});

const generateInsightsFlow = ai.defineFlow(
  {
    name: 'generateInsightsFlow',
    inputSchema: ProjectWithTasks,
    outputSchema: GenerateInsightsOutputSchema,
  },
  async (project) => {
    if (!project || project.tasks.length === 0) {
        return {
            overallSummary: "There are no tasks in this project to analyze. Add some tasks to generate insights.",
            atRiskProjects: [],
            teamPerformance: []
        };
    }
    const { output } = await generateInsightsPrompt(project);
    return output!;
  }
);
