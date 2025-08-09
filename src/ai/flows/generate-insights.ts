
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
  prompt: `You are an AI assistant integrated into a project management app.

Your job: Analyze the provided project data and return a structured JSON object containing insights about overall progress, risks, and team performance.

Strict output rules:
- Return ONLY valid JSON — no extra commentary, no markdown code fences.
- Match the JSON structure EXACTLY as shown in the example below.
- Do not include any keys not in the schema.
- All string fields must be plain text without line breaks unless necessary.
- All numbers must be integers (no decimals).

Here is the required JSON structure:

{
  "overallSummary": "A high-level summary of the project, including progress, velocity, and any major blockers.",
  "atRiskProjects": [
    {
      "projectName": "The name of the project.",
      "projectId": "The ID of the project.",
      "riskReason": "A brief explanation of why the project is considered at risk.",
      "suggestedAction": "A concrete next step to mitigate the risk."
    }
  ],
  "teamPerformance": [
    {
      "teamMemberName": "The team member's name.",
      "completedTasks": 0,
      "inProgressTasks": 0,
      "blockedTasks": 0,
      "performanceSummary": "A brief summary of the team member's performance and workload."
    }
  ]
}

Here is the project data you should analyze:
{{{json this}}}`,
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
