
'use server';
/**
 * @fileOverview Generates insights about software projects.
 *
 * - generateInsights - A function that analyzes all projects and tasks.
 * - GenerateInsightsOutput - The return type for the generateInsights function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getAllProjectsWithTasks, ProjectWithTasks } from '@/services/project-service';

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
  overallSummary: z.string().describe('A high-level summary of all projects, including progress, velocity, and any major blockers.'),
  atRiskProjects: z.array(AtRiskProjectSchema).describe('A list of projects that are currently at risk of falling behind schedule or failing.'),
  teamPerformance: z.array(TeamMemberPerformanceSchema).describe("An analysis of each team member's performance."),
});
export type GenerateInsightsOutput = z.infer<typeof GenerateInsightsOutputSchema>;

export async function generateInsights(): Promise<GenerateInsightsOutput> {
  const projects = await getAllProjectsWithTasks();
  // Filter out projects that have no tasks, as they are not relevant for insights.
  const activeProjects = projects.filter(p => p.tasks.length > 0);
  return generateInsightsFlow(activeProjects);
}

const generateInsightsPrompt = ai.definePrompt({
  name: 'generateInsightsPrompt',
  input: { schema: z.array(ProjectWithTasks) },
  output: { schema: GenerateInsightsOutputSchema },
  prompt: `You are an expert project management analyst. Your task is to provide a detailed analysis of a portfolio of software projects.
  
  Analyze the following project data, which includes project details and a list of all tasks within each project.
  
  Project Data:
  {{{json this}}}
  
  Your analysis should include three parts:
  
  1.  **Overall Summary**: Provide a high-level executive summary of the entire project portfolio. Mention overall percentage complete, identify any cross-project dependencies or common blockers, and comment on the general velocity.
  
  2.  **At-Risk Projects**: Identify projects that are at risk. A project might be at risk if it has a high number of blocked tasks, is significantly behind schedule (many incomplete tasks past their end date), or has low overall progress despite being active for a long time. For each at-risk project, provide the project name and a brief, actionable reason why it's at risk.
  
  3.  **Team Performance**: Analyze the workload and output of each team member across all projects. For each person, calculate the number of completed, in-progress, and blocked tasks. Provide a brief, objective performance summary. Note if a team member is overloaded with in-progress tasks or is frequently blocked.
  
  Provide a structured, data-driven, and objective report.`,
});

const generateInsightsFlow = ai.defineFlow(
  {
    name: 'generateInsightsFlow',
    inputSchema: z.array(ProjectWithTasks),
    outputSchema: GenerateInsightsOutputSchema,
  },
  async (projects) => {
    if (projects.length === 0) {
        return {
            overallSummary: "There are no active projects with tasks to analyze. Add some tasks to your projects to generate insights.",
            atRiskProjects: [],
            teamPerformance: []
        };
    }
    const { output } = await generateInsightsPrompt(projects);
    return output!;
  }
);
