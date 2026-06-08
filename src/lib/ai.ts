import Anthropic from '@anthropic-ai/sdk';
import { db } from './db';

const MODEL = 'claude-haiku-4-5-20251001';
const COST_INPUT_PER_M = 0.8;
const COST_OUTPUT_PER_M = 4.0;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export type AIFeature =
  | 'onboarding_plan'
  | 'photo_scan'
  | 'label_scan'
  | 'ai_coach'
  | 'chat_log'
  | 'food_scout';

async function logAIUsage(
  userId: string,
  feature: AIFeature,
  inputTokens: number,
  outputTokens: number
): Promise<void> {
  const cost =
    (inputTokens / 1_000_000) * COST_INPUT_PER_M +
    (outputTokens / 1_000_000) * COST_OUTPUT_PER_M;

  await db`
    INSERT INTO ai_usage_log
      (user_id, feature, model, input_tokens, output_tokens, cost_usd_cents)
    VALUES
      (${userId}, ${feature}, ${MODEL},
       ${inputTokens}, ${outputTokens}, ${cost})
  `;
}

export async function callAI(params: {
  userId: string;
  feature: AIFeature;
  messages: Anthropic.MessageParam[];
  system?: string;
  maxTokens?: number;
}): Promise<Anthropic.Message> {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: params.maxTokens ?? 1024,
    system: params.system,
    messages: params.messages,
  });

  const inputTokens = response.usage.input_tokens;
  const outputTokens = response.usage.output_tokens;

  await logAIUsage(
    params.userId,
    params.feature,
    inputTokens,
    outputTokens
  );

  return response;
}

export async function callAIStream(params: {
  userId: string;
  feature: AIFeature;
  messages: Anthropic.MessageParam[];
  system?: string;
  maxTokens?: number;
}) {
  const stream = anthropic.messages.stream({
    model: MODEL,
    max_tokens: params.maxTokens ?? 1024,
    system: params.system,
    messages: params.messages,
  });

  const finalMessage = await stream.finalMessage();

  await logAIUsage(
    params.userId,
    params.feature,
    finalMessage.usage.input_tokens,
    finalMessage.usage.output_tokens
  );

  return stream;
}
