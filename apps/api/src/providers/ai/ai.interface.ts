export interface AiGenerateTaskParams {
  task: string;
  prompt: string;
  tone?: string;
  contactId?: string;
  channel?: string;
  context?: Record<string, unknown>;
}

export interface AiGenerateTaskResult {
  task: string;
  result: string;
  tokensUsed: number;
  costCents: number;
  provider: 'openai' | 'mock' | 'free_tier' | 'internal';
  sentiment?: 'positive' | 'neutral' | 'negative' | 'urgent';
  qualificationScore?: number;
  intent?: string;
  recommendedAction?: string;
  metadata?: Record<string, unknown>;
}

export interface AiProvider {
  name: string;
  generateTask(params: AiGenerateTaskParams): Promise<AiGenerateTaskResult>;
}
