import { AiProvider, AiGenerateTaskParams, AiGenerateTaskResult } from './ai.interface';
import { logger } from '@prosumate/logger';

const NICHE_LABELS: Record<string, string> = {
  agencies: 'marketing agencies',
  real_estate: 'real-estate teams',
  legal: 'law firms',
  dental: 'dental practices',
  medical: 'medical practices',
  fitness: 'fitness studios',
  beauty: 'beauty and wellness businesses',
  home_services: 'home-service companies',
  automotive: 'automotive businesses',
  restaurants: 'restaurants and hospitality teams',
  ecommerce: 'e-commerce brands',
  education: 'education providers',
  financial_services: 'financial-service firms',
  insurance: 'insurance agencies',
  saas: 'software companies',
};

export class InternalAiProvider implements AiProvider {
  name = 'internal';

  // Sentiment Analysis Heuristic
  analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' | 'urgent' {
    const lower = text.toLowerCase();
    if (/\b(urgent|asap|emergency|immediately|critical|deadline|now)\b/.test(lower)) {
      return 'urgent';
    }
    if (/\b(angry|cancel|broken|terrible|bad|worst|horrible|issue|fail|refund|complaint)\b/.test(lower)) {
      return 'negative';
    }
    if (/\b(love|great|excellent|perfect|thank|appreciate|excited|ready|buy|awesome|impressive)\b/.test(lower)) {
      return 'positive';
    }
    return 'neutral';
  }

  // Intent Classification Heuristic
  classifyIntent(text: string): string {
    const lower = text.toLowerCase();
    if (/\b(price|cost|quote|how much|pricing|rate|package|tier)\b/.test(lower)) {
      return 'pricing_inquiry';
    }
    if (/\b(book|schedule|demo|call|meeting|appointment|calendar|talk)\b/.test(lower)) {
      return 'booking_request';
    }
    if (/\b(help|support|error|bug|not working|problem|trouble)\b/.test(lower)) {
      return 'support_issue';
    }
    if (/\b(stop|unsubscribe|cancel|quit|leave)\b/.test(lower)) {
      return 'cancellation_risk';
    }
    return 'general_interest';
  }

  // BANT Lead Qualification Calculator
  calculateLeadScore(prompt: string, context?: Record<string, unknown>): {
    score: number;
    recommendedAction: string;
    details: { budget: string; authority: string; need: string; timeline: string };
  } {
    const text = (prompt + ' ' + JSON.stringify(context || {})).toLowerCase();
    let score = 50; // baseline

    let budget = 'Medium';
    if (/\b(enterprise|high budget|\$10k|\$15k|\$50k|\$100k|\$15,000|funded|unlimited budget|scale|ad spend)\b/.test(text)) {
      score += 15;
      budget = 'High ($10k+/mo potential)';
    } else if (/\b(cheap|tight budget|low cost|free|student|discount)\b/.test(text)) {
      score -= 10;
      budget = 'Limited / Budget-conscious';
    }

    let authority = 'Influencer / Manager';
    if (/\b(ceo|founder|owner|vp|director|partner|head of|decision maker)\b/.test(text)) {
      score += 15;
      authority = 'Direct Decision Maker (C-Level / Owner)';
    }

    let need = 'Operational Efficiency';
    if (/\b(urgent|critical|losing money|struggling|replace|bottleneck|manual)\b/.test(text)) {
      score += 12;
      need = 'Critical Bottleneck in Current Operations';
    }

    let timeline = 'Within 60 Days';
    if (/\b(immediate|today|this week|asap|now|urgent|30 days)\b/.test(text)) {
      score += 10;
      timeline = 'Immediate (Deploy within 14-30 days)';
    } else if (/\b(2 weeks|two weeks|weeks)\b/.test(text)) {
      score += 8;
      timeline = 'Near-term (Within 2-4 weeks)';
    }

    score = Math.max(10, Math.min(98, score));

    let recommendedAction = 'Standard nurture sequence via email and periodic SMS check-ins.';
    if (score >= 80) {
      recommendedAction = 'High-intent lead with verified decision authority. Fast-track to senior sales advisor for immediate strategy consultation.';
    } else if (score >= 65) {
      recommendedAction = 'Warm opportunity. Trigger automated calendar booking sequence and share case study assets.';
    }

    return {
      score,
      recommendedAction,
      details: { budget, authority, need, timeline },
    };
  }

  detectNiche(prompt: string, context?: Record<string, unknown>): string {
    const requested = String(context?.niche || '').toLowerCase().replace(/[ -]+/g, '_');
    if (NICHE_LABELS[requested]) return requested;
    const text = (prompt + ' ' + JSON.stringify(context || {})).toLowerCase();
    const matches: Array<[RegExp, string]> = [
      [/\b(realtor|property|real estate|mortgage)\b/, 'real_estate'],
      [/\b(law|legal|attorney|solicitor)\b/, 'legal'],
      [/\b(dental|dentist|orthodont)\b/, 'dental'],
      [/\b(clinic|medical|patient|doctor)\b/, 'medical'],
      [/\b(gym|fitness|personal train)\b/, 'fitness'],
      [/\b(salon|spa|beauty|wellness)\b/, 'beauty'],
      [/\b(plumb|roof|hvac|contractor|home service)\b/, 'home_services'],
      [/\b(auto|dealer|vehicle|garage)\b/, 'automotive'],
      [/\b(restaurant|cafe|hospitality|reservation)\b/, 'restaurants'],
      [/\b(ecommerce|e-commerce|online store|shopify)\b/, 'ecommerce'],
      [/\b(school|course|education|student)\b/, 'education'],
      [/\b(finance|accounting|wealth|investment)\b/, 'financial_services'],
      [/\b(insurance|policy|coverage|premium)\b/, 'insurance'],
      [/\b(saas|software|subscription app)\b/, 'saas'],
    ];
    return matches.find(([pattern]) => pattern.test(text))?.[1] || 'agencies';
  }

  evaluateBranch(
    condition: { field: string; operator?: string; value?: unknown },
    context: Record<string, unknown>
  ): { matched: boolean; branch: 'then' | 'else'; actual: unknown } {
    const actual = condition.field.split('.').reduce<unknown>((current, key) => {
      if (!current || typeof current !== 'object') return undefined;
      return (current as Record<string, unknown>)[key];
    }, context);
    const expected = condition.value;
    let matched = false;
    switch (condition.operator || 'equals') {
      case 'not_equals':
        matched = String(actual).toLowerCase() !== String(expected).toLowerCase();
        break;
      case 'contains':
        matched = Array.isArray(actual)
          ? actual.some((item) => String(item).toLowerCase() === String(expected).toLowerCase())
          : String(actual ?? '').toLowerCase().includes(String(expected ?? '').toLowerCase());
        break;
      case 'greater_than':
        matched = Number(actual) > Number(expected);
        break;
      case 'less_than':
        matched = Number(actual) < Number(expected);
        break;
      case 'is_set':
        matched = actual !== undefined && actual !== null && actual !== '';
        break;
      default:
        matched = String(actual).toLowerCase() === String(expected).toLowerCase();
    }
    return { matched, branch: matched ? 'then' : 'else', actual };
  }

  async generateTask(params: AiGenerateTaskParams): Promise<AiGenerateTaskResult> {
    const tone = params.tone || 'professional';
    const sentiment = this.analyzeSentiment(params.prompt);
    const intent = this.classifyIntent(params.prompt);
    const niche = this.detectNiche(params.prompt, params.context);
    const nicheLabel = NICHE_LABELS[niche];

    let resultText = '';
    let qualificationScore: number | undefined;
    let recommendedAction: string | undefined;

    switch (params.task) {
      case 'qualify_lead': {
        const qualification = this.calculateLeadScore(params.prompt, params.context);
        qualificationScore = qualification.score;
        recommendedAction = qualification.recommendedAction;
        resultText = `Lead Qualification Assessment (Score: ${qualification.score}/100 - Tone: ${tone.toUpperCase()})
• Intent Classification: ${intent.toUpperCase()}
• Budget: ${qualification.details.budget}
• Decision Authority: ${qualification.details.authority}
• Pain Point / Need: ${qualification.details.need}
• Target Timeline: ${qualification.details.timeline}

Recommended Action: ${qualification.recommendedAction}`;
        break;
      }

      case 'generate_copy': {
        if (params.channel === 'sms') {
          if (tone === 'urgent') {
            resultText = `Action required: your ${nicheLabel} enquiry is time-sensitive. Reply with a suitable time today and our team will help.`;
          } else {
            resultText = `Hi! Thanks for your interest. We help ${nicheLabel} respond to leads faster and keep follow-up organized. Reply YES to choose a time.`;
          }
        } else if (params.channel === 'email') {
          resultText = `Subject: A more reliable follow-up process for your team

Hi there,

For ${nicheLabel}, slow or inconsistent lead follow-up often creates avoidable lost opportunities.

Prosumate keeps enquiries, follow-up tasks, internal messages, and appointment workflows together so your team can respond consistently.

Would a short walkthrough of the workflow be useful?

Best regards,
The Prosumate Team`;
        } else if (params.channel === 'ad_copy') {
          resultText = `Headline: Keep Every ${nicheLabel} Lead Moving
Primary Text: Organize enquiries, follow-up, tasks, and appointments in one internal workspace.
Call to Action: Explore Prosumate`;
        } else {
          resultText = `Give ${nicheLabel} one clear workspace for leads, follow-up, tasks, and appointments.`;
        }
        break;
      }

      case 'evaluate_branch': {
        const condition = (params.context?.condition || {}) as {
          field?: string;
          operator?: string;
          value?: unknown;
        };
        if (!condition.field) {
          throw new Error('evaluate_branch requires context.condition.field');
        }
        const branch = this.evaluateBranch(
          condition as { field: string; operator?: string; value?: unknown },
          (params.context?.data || params.context || {}) as Record<string, unknown>
        );
        resultText = JSON.stringify(branch);
        recommendedAction = branch.branch;
        break;
      }

      case 'suggest_reply': {
        if (intent === 'pricing_inquiry') {
          resultText = `Thank you for asking about our pricing. We offer tailored tiers designed to deliver positive ROI from day one, with full access to our multi-channel conversations, CRM, and automation workflows. Would you like to review the plan options together during a 10-minute briefing?`;
        } else if (intent === 'booking_request') {
          resultText = `We would be delighted to connect. You can choose a convenient time directly on our live calendar here: https://prosu.me/book - looking forward to speaking!`;
        } else if (sentiment === 'negative' || sentiment === 'urgent') {
          resultText = `We deeply appreciate you bringing this to our attention. Our team is actively reviewing your request with priority, and we will ensure this is resolved immediately. A senior representative will reach out to you within the hour.`;
        } else {
          resultText = `Thank you for reaching out. We have received your message and are eager to assist. Please let us know if you have any specific requirements, and we will prepare everything for you.`;
        }
        break;
      }

      default: {
        resultText = `Executive Overview:
• Evaluated input: "${params.prompt.substring(0, 80)}..."
• Intent: ${intent} | Sentiment: ${sentiment}
• Recommended Next Step: Maintain automated pipeline cadence and verify contact stage alignment.`;
        break;
      }
    }

    const tokensUsed = Math.max(120, Math.round((params.prompt.length + resultText.length) / 3.5));

    logger.info(`[INTERNAL AI GENERATED] Task: ${params.task} | Tone: ${tone} | Intent: ${intent} | Sentiment: ${sentiment}`, {
      task: params.task,
      tokensUsed,
      qualificationScore,
    });

    return {
      task: params.task,
      result: resultText,
      tokensUsed,
      costCents: 0, // 100% internal native execution - $0 cost
      provider: 'internal',
      sentiment,
      qualificationScore,
      intent,
      recommendedAction,
      metadata: {
        tone,
        niche,
        engine: 'deterministic-local-rules',
        processedLocally: true,
        generatedAt: new Date().toISOString(),
      },
    };
  }
}
