import { AiProvider, AiGenerateTaskParams, AiGenerateTaskResult } from './ai.interface';
import { logger } from '@prosumate/logger';

export class MockAiProvider implements AiProvider {
  name = 'mock';

  async generateTask(params: AiGenerateTaskParams): Promise<AiGenerateTaskResult> {
    const task = params.task || 'general';
    const tone = params.tone || 'professional';
    let outputText = '';
    const metadata: Record<string, unknown> = {};

    switch (task) {
      case 'lead_qualification': {
        const score = 84;
        const tier = 'High Intent';
        outputText = JSON.stringify(
          {
            score,
            qualification: tier,
            summary: `High value prospect analyzed from submission. Contact demonstrates clear immediate interest in service offerings.`,
            recommendedAction: 'Schedule 15-minute discovery consultation immediately.',
            suggestedDealValue: 5000,
          },
          null,
          2
        );
        metadata.score = score;
        metadata.qualification = tier;
        break;
      }

      case 'reply_suggestion': {
        outputText = `Hi there! Thanks so much for reaching out to us. We would love to assist you with this right away. What day this week works best for a brief 10-minute introduction call?`;
        break;
      }

      case 'copywriting': {
        outputText = `Subject: Unlock faster growth with automated lead follow-up\n\nHi {{firstName}},\n\nDid you know that 78% of customers buy from the company that responds first? With Prosumate, your incoming leads receive immediate personalized attention—around the clock.\n\nLet's discuss how we can streamline your sales pipeline this month.\n\nBest regards,\nYour Growth Team`;
        break;
      }

      default: {
        outputText = `[AI Assistant (${tone})]: Generated response addressing prompt: "${params.prompt.slice(0, 100)}..."`;
        break;
      }
    }

    logger.info(`[MOCK AI GENERATION] Task: "${task}" | Tone: "${tone}" (SIMULATED - $0 API cost)`);

    return {
      task,
      result: outputText,
      tokensUsed: 150,
      costCents: 0,
      provider: 'mock',
      metadata,
    };
  }
}
