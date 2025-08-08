'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-updates.ts';
import '@/ai/flows/generate-insights.ts';
