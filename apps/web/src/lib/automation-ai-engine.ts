// Types
export interface AiWorkflowResult {
  name: string;
  description: string;
  trigger: {
    type: string;
    config: Record<string, unknown>;
  };
  steps: Array<{
    name: string;
    actionType: string;
    config: Record<string, unknown>;
    order: number;
  }>;
  confidence: number; // 0-100
  matchedPattern: string;
  suggestions: string[]; // Tips for improving the workflow
}

const TRIGGER_PATTERNS = [
  { type: 'CUSTOMER_REPLIED', keywords: ['customer replies', 'customer replied', 'lead replies', 'contact replies', 'reply received'] },
  { type: 'INVOICE_PAID', keywords: ['invoice paid', 'payment received', 'pays an invoice'] },
  { type: 'TASK_COMPLETED', keywords: ['task completed', 'task is completed', 'finishes a task'] },
  { type: 'BIRTHDAY', keywords: ['birthday', 'date of birth'] },
  { type: 'FORM_SUBMITTED', keywords: ['form', 'submit', 'fills out', 'sign up', 'register', 'opt in'] },
  { type: 'CONTACT_CREATED', keywords: ['new contact', 'new lead', 'added to crm', 'joins'] },
  { type: 'OPPORTUNITY_STAGE_CHANGED', keywords: ['stage change', 'deal moves', 'pipeline', 'opportunity', 'deal stage', 'deal won', 'deal is won'] },
  { type: 'APPOINTMENT_BOOKED', keywords: ['book', 'appointment', 'schedule', 'calendar', 'meeting'] },
  { type: 'TAG_ADDED', keywords: ['tag', 'label', 'marked as', 'categorized'] }
];

const ACTION_PATTERNS = [
  { type: 'INTERNAL_NOTIFICATION', keywords: ['internal notification', 'notify the team', 'notify my team', 'alert the team'] },
  { type: 'UPDATE_CONTACT_FIELD', keywords: ['update contact field', 'set contact field', 'change contact field'] },
  { type: 'WEBHOOK', keywords: ['webhook', 'call an api', 'send to api'] },
  { type: 'AI_GENERATE', keywords: ['generate with ai', 'ai generated', 'use ai to'] },
  { type: 'SEND_SMS', keywords: ['send an sms', 'send sms', 'sms', 'text message', 'send a text', 'text them'] },
  { type: 'SEND_EMAIL', keywords: ['email', 'mail', 'send email'] },
  { type: 'ADD_TAG', keywords: ['tag', 'label', 'mark'] },
  { type: 'REMOVE_TAG', keywords: ['remove tag', 'untag'] },
  { type: 'CREATE_TASK', keywords: ['task', 'todo', 'assign', 'follow up', 'follow-up', 'call'] },
  { type: 'MOVE_OPPORTUNITY_STAGE', keywords: ['move stage', 'advance', 'promote', 'move deal'] },
  { type: 'WAIT_DELAY', keywords: ['wait', 'delay', 'pause', 'after', 'before'] }
];

export function parseTimeDuration(text: string): number {
  const normalized = text.toLowerCase();
  
  // Try to find specific patterns like "X hours", "Y days", "Z minutes"
  const patterns = [
    { regex: /(\d+)\s*(min|mins|minute|minutes)/, multiplier: 1 },
    { regex: /(\d+)\s*(hr|hrs|hour|hours)/, multiplier: 60 },
    { regex: /(\d+)\s*(day|days)/, multiplier: 1440 },
    { regex: /(\d+)\s*(week|weeks)/, multiplier: 10080 },
    { regex: /a\s+(min|minute)/, multiplier: 1 },
    { regex: /an\s+(hr|hour)/, multiplier: 60 },
    { regex: /a\s+(day)/, multiplier: 1440 },
    { regex: /a\s+(week)/, multiplier: 10080 }
  ];

  let totalMinutes = 0;
  let found = false;

  for (const pattern of patterns) {
    const match = normalized.match(pattern.regex);
    if (match) {
      const val = parseInt(match[1] || '1', 10);
      if (!isNaN(val)) {
        totalMinutes += val * pattern.multiplier;
        found = true;
      }
    }
  }

  return found ? totalMinutes : 0;
}

export function generateSmartSmsContent(context: string): string {
  const lowerContext = context.toLowerCase();
  if (lowerContext.includes('welcome') || lowerContext.includes('new lead')) {
    return "Hi there! Thanks for your interest. Let us know if you have any questions.";
  }
  if (lowerContext.includes('appointment') || lowerContext.includes('reminder')) {
    return "Hi! Just a quick reminder about your upcoming appointment. Let us know if you need to reschedule.";
  }
  if (lowerContext.includes('won') || lowerContext.includes('congratulate')) {
    return "Congratulations on taking the next step! We're excited to start working with you.";
  }
  return "Hi, we wanted to quickly follow up with you. Reply to this message if you have any questions!";
}

export function generateSmartEmailContent(context: string): { subject: string; body: string } {
  const lowerContext = context.toLowerCase();
  if (lowerContext.includes('welcome') || lowerContext.includes('new lead')) {
    return {
      subject: "Welcome! Here is what's next",
      body: "Hi there,\n\nThanks for signing up! We're thrilled to have you here. Please feel free to reply to this email if you need anything.\n\nBest,\nThe Team"
    };
  }
  if (lowerContext.includes('appointment') || lowerContext.includes('reminder')) {
    return {
      subject: "Your Upcoming Appointment",
      body: "Hello,\n\nThis is a friendly reminder for your upcoming appointment. Please let us know if you need to reschedule.\n\nThanks!"
    };
  }
  if (lowerContext.includes('value') || lowerContext.includes('nurture')) {
    return {
      subject: "Some tips to help you succeed",
      body: "Hi,\n\nWe wanted to share some exclusive tips with you today that we hope will help you along your journey. Check out our latest resources!\n\nBest regards,"
    };
  }
  return {
    subject: "Following up",
    body: "Hi,\n\nJust wanted to reach out and follow up. Let us know if there is anything we can do to help you.\n\nThanks!"
  };
}

export function getConfidenceLabel(score: number): string {
  if (score >= 90) return 'High';
  if (score >= 70) return 'Medium';
  return 'Low';
}

function generateWorkflowName(triggerType: string, actionTypes: string[]): string {
  const triggers: Record<string, string> = {
    FORM_SUBMITTED: 'Form Submission',
    CONTACT_CREATED: 'New Contact',
    OPPORTUNITY_STAGE_CHANGED: 'Deal Stage',
    APPOINTMENT_BOOKED: 'Appointment',
    TAG_ADDED: 'Tag Applied'
  };

  const actionCount = actionTypes.length;
  const triggerName = triggers[triggerType] || 'Automated';
  
  if (actionTypes.includes('SEND_EMAIL') && actionTypes.includes('SEND_SMS')) {
    return `${triggerName} Follow-up Sequence`;
  }
  
  if (actionCount > 2) {
    return `${triggerName} Nurture Campaign`;
  }

  return `${triggerName} Workflow`;
}

export function generateWorkflowFromPrompt(prompt: string): AiWorkflowResult {
  const normalizedPrompt = prompt.toLowerCase();
  
  // 1. Detect Trigger
  let detectedTriggerType = 'CONTACT_CREATED'; // Default fallback
  let triggerMatchedPattern = 'default fallback';
  
  for (const tp of TRIGGER_PATTERNS) {
    for (const keyword of tp.keywords) {
      if (normalizedPrompt.includes(keyword)) {
        detectedTriggerType = tp.type;
        triggerMatchedPattern = keyword;
        break;
      }
    }
    if (triggerMatchedPattern !== 'default fallback') break;
  }

  // 2. Extract Actions with order
  const foundActions: Array<{ type: string; index: number; keyword: string }> = [];
  
  for (const ap of ACTION_PATTERNS) {
    for (const keyword of ap.keywords) {
      // Find all occurrences to preserve order if multiple actions of same type or mixed
      let startIndex = 0;
      while (true) {
        const index = normalizedPrompt.indexOf(keyword, startIndex);
        if (index === -1) break;
        
        // Prevent overlapping duplicates like "tag" vs "remove tag" 
        // A simple check: if we already found an action very close, we might want to skip, 
        // but for now we'll just push all and filter later or rely on distinct keywords.
        foundActions.push({ type: ap.type, index, keyword });
        startIndex = index + keyword.length;
      }
    }
  }

  // Sort by index to maintain order of appearance
  foundActions.sort((a, b) => a.index - b.index);

  // Filter overlapping/duplicate keywords to avoid double counting
  // For example, "send email" vs "email", or "remove tag" vs "tag"
  const filteredActions: typeof foundActions = [];
  for (const act of foundActions) {
    const isOverlapping = filteredActions.some(
      f => act.index >= f.index && act.index < (f.index + f.keyword.length)
        || f.index >= act.index && f.index < (act.index + act.keyword.length)
    );
    if (!isOverlapping) {
      filteredActions.push(act);
    }
  }

  // 3. Generate Config & Steps
  const steps: AiWorkflowResult['steps'] = [];
  let order = 1;
  for (let i = 0; i < filteredActions.length; i++) {
    const act = filteredActions[i];
    
    // For Wait/Delay, we want to parse the time after this keyword up to the next keyword or end of string
    const nextActIndex = (i + 1 < filteredActions.length) ? filteredActions[i + 1].index : normalizedPrompt.length;
    const contextSnippet = normalizedPrompt.substring(act.index, nextActIndex);
    
    const config: Record<string, unknown> = {};
    let stepName = act.type;

    switch (act.type) {
      case 'SEND_SMS':
        config.content = generateSmartSmsContent(normalizedPrompt);
        stepName = 'Send SMS Message';
        break;
      case 'SEND_EMAIL': {
        const email = generateSmartEmailContent(normalizedPrompt);
        config.templateSubject = email.subject;
        config.templateBody = email.body;
        stepName = 'Send Email';
        break;
      }
      case 'ADD_TAG':
        config.tag = 'auto-generated';
        stepName = 'Add Tag';
        break;
      case 'REMOVE_TAG':
        config.tag = 'auto-generated';
        stepName = 'Remove Tag';
        break;
      case 'CREATE_TASK':
        config.taskTitle = 'Follow up with contact';
        stepName = 'Create Task';
        break;
      case 'MOVE_OPPORTUNITY_STAGE':
        config.stageId = '';
        stepName = 'Move Deal Stage';
        break;
      case 'WAIT_DELAY':
        const duration = parseTimeDuration(contextSnippet);
        config.delayMinutes = duration || 60; // default 1 hour if unparseable
        stepName = `Wait for ${config.delayMinutes} minutes`;
        break;
      case 'INTERNAL_NOTIFICATION':
        config.message = 'A contact reached this workflow step.';
        stepName = 'Notify Team';
        break;
      case 'UPDATE_CONTACT_FIELD':
        config.field = 'status';
        config.value = 'lead';
        stepName = 'Update Contact Field';
        break;
      case 'WEBHOOK':
        config.url = '';
        config.method = 'POST';
        stepName = 'Send Webhook';
        break;
      case 'AI_GENERATE':
        config.prompt = prompt.slice(0, 500);
        config.outputField = 'aiGeneratedContent';
        stepName = 'Generate Content with AI';
        break;
    }

    steps.push({
      name: stepName,
      actionType: act.type,
      config,
      order: order++
    });
  }

  // If no actions found but we have a trigger, maybe add a default step
  if (steps.length === 0) {
    steps.push({
      name: 'Create Task',
      actionType: 'CREATE_TASK',
      config: { title: 'Review new entry' },
      order: 1
    });
  }

  const actionTypes = steps.map(s => s.actionType);

  // 4. Generate Name
  const name = generateWorkflowName(detectedTriggerType, actionTypes);

  // 5. Confidence Scoring
  let confidence = 50;
  if (triggerMatchedPattern !== 'default fallback') {
    if (steps.length >= 2) confidence = 95;
    else if (steps.length === 1) confidence = 80;
    else confidence = 65;
  }

  // 6. Suggestions
  const suggestions: string[] = [];
  if (actionTypes.includes('SEND_SMS') && actionTypes.includes('SEND_EMAIL')) {
    if (!actionTypes.includes('WAIT_DELAY')) {
      suggestions.push('Consider adding a wait delay between SMS and email to avoid overwhelming the contact');
    }
  }
  if (!actionTypes.includes('ADD_TAG')) {
    suggestions.push('Adding a tag will help you track which contacts entered this workflow');
  }

  return {
    name,
    description: `AI-assisted workflow: ${prompt}`.slice(0, 500),
    trigger: {
      type: detectedTriggerType,
      config: {}
    },
    steps,
    confidence,
    matchedPattern: triggerMatchedPattern,
    suggestions
  };
}
