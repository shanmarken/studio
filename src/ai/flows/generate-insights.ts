
'use server';
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getProjectWithTasks } from '@/services/project-service';

// --- Define a Zod schema for the project input (adapt fields to your real model) ---
const ProjectWithTasksSchema = z.object({
  id: z.string(),
  name: z.string(),
  // optional description
  description: z.string().optional(),
  tasks: z.array(z.object({
    id: z.string(),
    name: z.string(),
    status: z.string().optional(), // replace with enum if you have fixed statuses
    assignedTo: z.string().nullable().optional(),
    // add any other fields you need for the analysis
  })),
});
type ProjectWithTasks = z.infer<typeof ProjectWithTasksSchema>;

// --- existing output schemas (unchanged) ---
const AtRiskProjectSchema = z.object({
  projectName: z.string().describe("The name of the project."),
  projectId: z.string().describe("The ID of the project."),
  riskReason: z.string().describe("A brief explanation of why the project is considered at risk."),
  suggestedAction: z.string().describe("A concrete next step to mitigate the risk."),
});

const TeamMemberPerformanceSchema = z.object({
  teamMemberName: z.string().describe("The team member's name."),
  completedTasks: z.number().describe("The number of tasks completed by the team member."),
  inProgressTasks: z.number().describe("The number of tasks currently in progress."),
  blockedTasks: z.number().describe("The number of tasks that are currently blocked."),
  performanceSummary: z.string().describe("A brief summary of the team member's performance and workload."),
});

const GenerateInsightsOutputSchema = z.object({
  overallSummary: z.string().describe("A high-level summary of the project, including progress, velocity, and any major blockers."),
  atRiskProjects: z.array(AtRiskProjectSchema).describe("A list of items within the project that are at risk (e.g. epics, features, or specific tasks)."),
  teamPerformance: z.array(TeamMemberPerformanceSchema).describe("An analysis of each team member's performance within the project."),
});
export type GenerateInsightsOutput = z.infer<typeof GenerateInsightsOutputSchema>;

// --- Prompt definition (use the Zod schema for input) ---
const generateInsightsPrompt = ai.definePrompt({
  name: 'generateInsightsPrompt',
  input: { schema: ProjectWithTasksSchema },       // <-- pass the Zod schema object
  output: { schema: GenerateInsightsOutputSchema },// <-- this was fine already
  prompt: `You are an AI assistant integrated into a project management app.

Return ONLY valid JSON matching the exact output schema (no commentary or markdown).

Here is the project data you should analyze:
{{{json input}}}`
});

// --- Flow definition (also use the Zod schema) ---
const generateInsightsFlow = ai.defineFlow(
  {
    name: 'generateInsightsFlow',
    inputSchema: ProjectWithTasksSchema,           // <-- Zod schema, not TS type
    outputSchema: GenerateInsightsOutputSchema,
  },
  async (project) => {
    if (!project || !project.tasks || project.tasks.length === 0) {
      return {
        overallSummary: "There are no tasks in this project to analyze. Add some tasks to generate insights.",
        atRiskProjects: [],
        teamPerformance: []
      };
    }

    const { output } = await generateInsightsPrompt(project);

    if (!output) {
      throw new Error('AI returned no output');
    }
    
    // Extra validation with Zod (helps if AI returned something slightly off)
    try {
      const validated = GenerateInsightsOutputSchema.parse(output);
      return validated;
    } catch (e) {
      console.error('Zod validation failed for AI output:', e);
      throw new Error('AI output failed validation — check logs for details.');
    }
  }
);

// --- exported helper used earlier ---
export async function generateInsights(projectId: string): Promise<GenerateInsightsOutput> {
  const project = await getProjectWithTasks(projectId);
  if (!project) throw new Error('Project not found');

  // If your getProjectWithTasks returns a plain JS object that matches the schema,
  // you can call the flow directly:
  return generateInsightsFlow(project);
}
