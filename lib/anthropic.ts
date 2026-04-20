import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { buildSystemPrompt } from './prompt-builder';
import { mockGenerateDashboard } from './mock-dashboard';
import type { ColumnMeta } from '@/types/dataset';
import type { DashboardAIResponse } from '@/types/dashboard';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const ChartConfigSchema = z.object({
  xAxis: z.string(),
  yAxis: z.string().optional(),
  aggregation: z.enum(['sum', 'avg', 'count', 'min', 'max', 'none']),
  groupBy: z.string().nullable().optional(),
  sortBy: z.string().nullable().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  limit: z.number().nullable().optional(),
  colors: z.array(z.string()).optional(),
  dateGrouping: z.enum(['day', 'week', 'month', 'year']).nullable().optional(),
  valueColumn: z.string().optional(),
});

const AIResponseSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(500),
  charts: z
    .array(
      z.object({
        type: z.enum(['bar', 'line', 'pie', 'area', 'scatter', 'table', 'metric']),
        title: z.string().min(1).max(200),
        config: ChartConfigSchema,
        position: z.object({
          x: z.number().int().min(0),
          y: z.number().int().min(0),
          w: z.number().int().min(1).max(12),
          h: z.number().int().min(1).max(12),
        }),
      })
    )
    .min(1)
    .max(20),
});

export async function generateDashboard(
  userPrompt: string,
  columns: ColumnMeta[]
): Promise<DashboardAIResponse> {
  if (process.env.USE_MOCK_AI === 'true') {
    return mockGenerateDashboard(userPrompt, columns);
  }

  const systemPrompt = buildSystemPrompt(columns);

  const stream = anthropic.messages.stream({
    model: 'claude-opus-4-6',
    max_tokens: 8192,
    thinking: { type: 'adaptive' },
    system: [
      {
        type: 'text',
        text: systemPrompt,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: userPrompt }],
  });

  const message = await stream.finalMessage();

  let rawText = '';
  for (const block of message.content) {
    if (block.type === 'text') {
      rawText = block.text;
      break;
    }
  }

  if (!rawText) {
    throw new Error('Claude returned no text content');
  }

  const cleaned = rawText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error(`Claude response is not valid JSON.\nRaw: ${cleaned.slice(0, 300)}`);
    }
    parsed = JSON.parse(match[0]);
  }

  const result = AIResponseSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`Claude response failed validation: ${result.error.issues[0]?.message}`);
  }

  return result.data as DashboardAIResponse;
}
