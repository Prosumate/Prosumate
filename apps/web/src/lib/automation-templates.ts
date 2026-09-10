export interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  category: 'lead_generation' | 'sales_pipeline' | 'appointment' | 'customer_onboarding' | 're_engagement' | 'internal_operations';
  niche: string[];
  icon: string;
  color: string;
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
  popularity: number;
}

export const TEMPLATE_CATEGORIES = [
  { id: 'lead_generation', label: 'Lead Generation', description: 'Convert prospects into leads.', icon: 'UserPlus', color: 'bg-blue-500/10 text-blue-500' },
  { id: 'sales_pipeline', label: 'Sales Pipeline', description: 'Manage and close deals effectively.', icon: 'TrendingUp', color: 'bg-green-500/10 text-green-500' },
  { id: 'appointment', label: 'Appointment', description: 'Automate scheduling and reminders.', icon: 'Calendar', color: 'bg-purple-500/10 text-purple-500' },
  { id: 'customer_onboarding', label: 'Customer Onboarding', description: 'Ensure smooth customer transitions.', icon: 'BookOpen', color: 'bg-yellow-500/10 text-yellow-500' },
  { id: 're_engagement', label: 'Re-engagement', description: 'Win back inactive or lost leads.', icon: 'RefreshCcw', color: 'bg-orange-500/10 text-orange-500' },
  { id: 'internal_operations', label: 'Internal Operations', description: 'Streamline internal team workflows.', icon: 'Settings', color: 'bg-gray-500/10 text-gray-500' }
];

export const AUTOMATION_TEMPLATES: AutomationTemplate[] = [
  // --- Lead Generation ---
  {
    id: 'new-lead-welcome',
    name: 'New Lead Welcome Sequence',
    description: 'Engage new leads immediately with a welcome SMS and email.',
    category: 'lead_generation',
    niche: ['general', 'real_estate', 'dental', 'saas'],
    icon: 'MessageSquare',
    color: 'bg-blue-500/10 text-blue-500',
    popularity: 95,
    trigger: {
      type: 'FORM_SUBMITTED',
      config: { formId: 'any' }
    },
    steps: [
      { order: 1, name: 'Send SMS welcome', actionType: 'SEND_SMS', config: { message: 'Hi! Thanks for your interest. We received your details and will be in touch shortly. Reply STOP to opt out.' } },
      { order: 2, name: 'Wait 5 min', actionType: 'WAIT', config: { duration: 5, unit: 'minutes' } },
      { order: 3, name: 'Send Email with company info', actionType: 'SEND_EMAIL', config: { subject: 'Welcome! Here is more about us', body: 'Thank you for reaching out to us. We have received your information and one of our experts will contact you soon. In the meantime, feel free to check out our recent success stories.' } },
      { order: 4, name: 'Add tag new-lead', actionType: 'ADD_TAG', config: { tag: 'new-lead' } }
    ]
  },
  {
    id: 'lead-follow-up',
    name: 'Automated Lead Follow-up',
    description: 'Ensure no lead falls through the cracks with a multi-day follow-up.',
    category: 'lead_generation',
    niche: ['general', 'b2b', 'saas'],
    icon: 'PhoneCall',
    color: 'bg-blue-500/10 text-blue-500',
    popularity: 88,
    trigger: {
      type: 'CONTACT_CREATED',
      config: { source: 'inbound' }
    },
    steps: [
      { order: 1, name: 'Send Email introduction', actionType: 'SEND_EMAIL', config: { subject: 'Thanks for connecting', body: 'Hi there, it is great to connect with you. I wanted to personally introduce myself and see if you have any questions about how we can help your business grow.' } },
      { order: 2, name: 'Wait 24h', actionType: 'WAIT', config: { duration: 24, unit: 'hours' } },
      { order: 3, name: 'Send SMS check-in', actionType: 'SEND_SMS', config: { message: 'Hi! Just checking in to see if you received my email yesterday. Let me know when you have a moment to chat.' } },
      { order: 4, name: 'Create task Call lead', actionType: 'CREATE_TASK', config: { title: 'Call lead', priority: 'high' } }
    ]
  },
  {
    id: 'lead-qualification',
    name: 'Lead Qualification Pipeline',
    description: 'Automatically qualify leads before passing them to the sales team.',
    category: 'lead_generation',
    niche: ['b2b', 'saas', 'real_estate'],
    icon: 'Filter',
    color: 'bg-blue-500/10 text-blue-500',
    popularity: 82,
    trigger: {
      type: 'FORM_SUBMITTED',
      config: { formId: 'qualification_form' }
    },
    steps: [
      { order: 1, name: 'Add tag unqualified', actionType: 'ADD_TAG', config: { tag: 'unqualified' } },
      { order: 2, name: 'Send Email qualification survey', actionType: 'SEND_EMAIL', config: { subject: 'Quick question for you', body: 'To help us serve you better, could you please take 30 seconds to answer a couple of quick questions? It will help us tailor our approach to your needs.' } },
      { order: 3, name: 'Wait 48h', actionType: 'WAIT', config: { duration: 48, unit: 'hours' } },
      { order: 4, name: 'Create task Score lead', actionType: 'CREATE_TASK', config: { title: 'Score lead', priority: 'medium' } }
    ]
  },
  {
    id: 'lead-scoring-nurture',
    name: 'Lead Score & Nurture',
    description: 'Nurture leads with valuable content until they are ready to buy.',
    category: 'lead_generation',
    niche: ['general', 'saas', 'coaching'],
    icon: 'Target',
    color: 'bg-blue-500/10 text-blue-500',
    popularity: 75,
    trigger: {
      type: 'TAG_ADDED',
      config: { tag: 'nurture' }
    },
    steps: [
      { order: 1, name: 'Send Email value content', actionType: 'SEND_EMAIL', config: { subject: 'Here is something you might find useful', body: 'We recently put together this comprehensive guide on industry best practices. I thought it might be directly relevant to the challenges you are currently facing.' } },
      { order: 2, name: 'Wait 3 days', actionType: 'WAIT', config: { duration: 3, unit: 'days' } },
      { order: 3, name: 'Send SMS special offer', actionType: 'SEND_SMS', config: { message: 'Hi! We are offering a free consultation this week for our community members. Would you be interested in booking a slot?' } },
      { order: 4, name: 'Move opportunity to Qualified', actionType: 'UPDATE_OPPORTUNITY', config: { stage: 'Qualified' } }
    ]
  },
  {
    id: 'instant-speed-to-lead',
    name: 'Speed to Lead Response',
    description: 'Instantly respond to high-intent leads to maximize conversion.',
    category: 'lead_generation',
    niche: ['real_estate', 'home_services', 'dental'],
    icon: 'Zap',
    color: 'bg-blue-500/10 text-blue-500',
    popularity: 98,
    trigger: {
      type: 'FORM_SUBMITTED',
      config: { formId: 'high_intent' }
    },
    steps: [
      { order: 1, name: 'Send SMS instant response', actionType: 'SEND_SMS', config: { message: 'Thanks for reaching out! A specialist will call you from this number in the next 5 minutes.' } },
      { order: 2, name: 'Send Email detailed info', actionType: 'SEND_EMAIL', config: { subject: 'Your inquiry has been received', body: 'Thank you for your interest. We prioritize fast responses, and one of our specialists is preparing to call you right now. Please have your questions ready!' } },
      { order: 3, name: 'Create task Call within 5 min', actionType: 'CREATE_TASK', config: { title: 'URGENT: Call within 5 min', priority: 'urgent' } }
    ]
  },

  // --- Sales Pipeline ---
  {
    id: 'deal-stage-notification',
    name: 'Opportunity Stage Alert',
    description: 'Keep the team and client updated when a deal moves forward.',
    category: 'sales_pipeline',
    niche: ['general', 'b2b'],
    icon: 'Bell',
    color: 'bg-green-500/10 text-green-500',
    popularity: 85,
    trigger: {
      type: 'OPPORTUNITY_STAGE_CHANGED',
      config: { stage: 'any' }
    },
    steps: [
      { order: 1, name: 'Send internal notification', actionType: 'INTERNAL_NOTIFICATION', config: { message: 'Deal stage updated' } },
      { order: 2, name: 'Send Email to client', actionType: 'SEND_EMAIL', config: { subject: 'Update on your project', body: 'We just wanted to let you know that your project has officially moved to the next stage! Our team is currently reviewing the details and will update you again shortly.' } },
      { order: 3, name: 'Create task Update CRM', actionType: 'CREATE_TASK', config: { title: 'Update CRM records', priority: 'low' } }
    ]
  },
  {
    id: 'deal-won-celebration',
    name: 'Deal Won Sequence',
    description: 'Celebrate closed deals and smoothly transition to onboarding.',
    category: 'sales_pipeline',
    niche: ['general', 'saas', 'agency'],
    icon: 'Award',
    color: 'bg-green-500/10 text-green-500',
    popularity: 92,
    trigger: {
      type: 'OPPORTUNITY_STAGE_CHANGED',
      config: { stage: 'Closed Won' }
    },
    steps: [
      { order: 1, name: 'Send Email congratulations', actionType: 'SEND_EMAIL', config: { subject: 'Welcome aboard!', body: 'We are absolutely thrilled to have you as a new customer! Our onboarding team will be reaching out shortly to get things kicked off.' } },
      { order: 2, name: 'Add tag customer', actionType: 'ADD_TAG', config: { tag: 'customer' } },
      { order: 3, name: 'Remove tag prospect', actionType: 'REMOVE_TAG', config: { tag: 'prospect' } },
      { order: 4, name: 'Create task Begin onboarding', actionType: 'CREATE_TASK', config: { title: 'Begin onboarding process', priority: 'high' } }
    ]
  },
  {
    id: 'deal-lost-recovery',
    name: 'Lost Deal Recovery',
    description: 'Stay in touch with lost opportunities for future business.',
    category: 'sales_pipeline',
    niche: ['general', 'b2b'],
    icon: 'LifeBuoy',
    color: 'bg-green-500/10 text-green-500',
    popularity: 70,
    trigger: {
      type: 'OPPORTUNITY_STAGE_CHANGED',
      config: { stage: 'Closed Lost' }
    },
    steps: [
      { order: 1, name: 'Wait 7 days', actionType: 'WAIT', config: { duration: 7, unit: 'days' } },
      { order: 2, name: 'Send Email We miss you', actionType: 'SEND_EMAIL', config: { subject: 'Checking in', body: 'I know we were not able to work together this time around, but I wanted to keep the door open. Let me know if your situation changes in the future.' } },
      { order: 3, name: 'Wait 14 days', actionType: 'WAIT', config: { duration: 14, unit: 'days' } },
      { order: 4, name: 'Send SMS special offer', actionType: 'SEND_SMS', config: { message: 'Hi! If you are still looking for a solution, we are running a special promotion this month. Let me know if you would like details.' } }
    ]
  },
  {
    id: 'proposal-follow-up',
    name: 'Proposal Follow-up',
    description: 'Automatically follow up after a proposal is sent.',
    category: 'sales_pipeline',
    niche: ['agency', 'b2b', 'home_services'],
    icon: 'FileText',
    color: 'bg-green-500/10 text-green-500',
    popularity: 89,
    trigger: {
      type: 'OPPORTUNITY_STAGE_CHANGED',
      config: { stage: 'Proposal Sent' }
    },
    steps: [
      { order: 1, name: 'Wait 2 days', actionType: 'WAIT', config: { duration: 2, unit: 'days' } },
      { order: 2, name: 'Send Email reminder', actionType: 'SEND_EMAIL', config: { subject: 'Following up on our proposal', body: 'I just wanted to float this to the top of your inbox. Have you had a chance to review the proposal I sent over a couple of days ago?' } },
      { order: 3, name: 'Wait 5 days', actionType: 'WAIT', config: { duration: 5, unit: 'days' } },
      { order: 4, name: 'Send SMS urgent follow-up', actionType: 'SEND_SMS', config: { message: 'Hi! Just a quick check-in regarding the proposal. Do you have 5 minutes for a quick call tomorrow to review it together?' } },
      { order: 5, name: 'Create task Call decision maker', actionType: 'CREATE_TASK', config: { title: 'Call decision maker', priority: 'medium' } }
    ]
  },

  // --- Appointment ---
  {
    id: 'booking-confirmation',
    name: 'Booking Confirmation',
    description: 'Send immediate confirmation when an appointment is booked.',
    category: 'appointment',
    niche: ['general', 'dental', 'coaching', 'home_services'],
    icon: 'CheckCircle',
    color: 'bg-purple-500/10 text-purple-500',
    popularity: 99,
    trigger: {
      type: 'APPOINTMENT_BOOKED',
      config: {}
    },
    steps: [
      { order: 1, name: 'Send Email confirmation with details', actionType: 'SEND_EMAIL', config: { subject: 'Appointment Confirmed', body: 'Your appointment has been successfully booked. Please find the details and any necessary preparation instructions below. We look forward to seeing you!' } },
      { order: 2, name: 'Send SMS reminder', actionType: 'SEND_SMS', config: { message: 'Your appointment is confirmed! Check your email for details. Reply C to cancel.' } },
      { order: 3, name: 'Add tag appointment-booked', actionType: 'ADD_TAG', config: { tag: 'appointment-booked' } }
    ]
  },
  {
    id: 'appointment-reminder-24h',
    name: '24-Hour Reminder',
    description: 'Reduce no-shows with automated reminders 24 hours prior.',
    category: 'appointment',
    niche: ['general', 'dental', 'coaching', 'home_services'],
    icon: 'Clock',
    color: 'bg-purple-500/10 text-purple-500',
    popularity: 96,
    trigger: {
      type: 'APPOINTMENT_BOOKED',
      config: {}
    },
    steps: [
      { order: 1, name: 'Wait 1380 min', actionType: 'WAIT', config: { duration: 1380, unit: 'minutes' } }, // 23 hours later to give 1 hr warning
      { order: 2, name: 'Send SMS reminder', actionType: 'SEND_SMS', config: { message: 'Reminder: Your appointment with us is tomorrow. Please let us know immediately if you need to reschedule.' } },
      { order: 3, name: 'Send Email reminder with prep info', actionType: 'SEND_EMAIL', config: { subject: 'Reminder: Upcoming Appointment Tomorrow', body: 'This is a friendly reminder of your appointment scheduled for tomorrow. Please remember to review any prep materials we sent previously.' } }
    ]
  },
  {
    id: 'no-show-follow-up',
    name: 'No-Show Recovery',
    description: 'Re-engage leads who missed their scheduled appointment.',
    category: 'appointment',
    niche: ['general', 'dental', 'coaching'],
    icon: 'UserX',
    color: 'bg-purple-500/10 text-purple-500',
    popularity: 81,
    trigger: {
      type: 'TAG_ADDED',
      config: { tag: 'no-show' }
    },
    steps: [
      { order: 1, name: 'Send Email apology', actionType: 'SEND_EMAIL', config: { subject: 'Sorry we missed you!', body: 'We noticed you were unable to make your appointment today. We completely understand that things come up, and we would love to help you reschedule.' } },
      { order: 2, name: 'Wait 2h', actionType: 'WAIT', config: { duration: 2, unit: 'hours' } },
      { order: 3, name: 'Send SMS reschedule offer', actionType: 'SEND_SMS', config: { message: 'Sorry we missed you today! Let us get you rescheduled. Reply YES to book a new time.' } },
      { order: 4, name: 'Create task Call to reschedule', actionType: 'CREATE_TASK', config: { title: 'Call to reschedule', priority: 'medium' } }
    ]
  },
  {
    id: 'post-visit-survey',
    name: 'Post-Visit Feedback',
    description: 'Automatically ask for reviews and feedback after appointments.',
    category: 'appointment',
    niche: ['dental', 'home_services', 'general'],
    icon: 'Star',
    color: 'bg-purple-500/10 text-purple-500',
    popularity: 87,
    trigger: {
      type: 'TAG_ADDED',
      config: { tag: 'visit-completed' }
    },
    steps: [
      { order: 1, name: 'Wait 2h', actionType: 'WAIT', config: { duration: 2, unit: 'hours' } },
      { order: 2, name: 'Send Email survey link', actionType: 'SEND_EMAIL', config: { subject: 'How did we do?', body: 'Thank you for choosing us! Your feedback is incredibly important to our team. Could you please take one minute to fill out this short survey?' } },
      { order: 3, name: 'Wait 3 days', actionType: 'WAIT', config: { duration: 3, unit: 'days' } },
      { order: 4, name: 'Send SMS review request', actionType: 'SEND_SMS', config: { message: 'Thanks for your recent visit! If you enjoyed your experience, we would love a quick review on Google: [link]' } }
    ]
  },

  // --- Customer Onboarding ---
  {
    id: 'welcome-sequence',
    name: 'Customer Welcome Sequence',
    description: 'Onboard new customers with a structured email sequence.',
    category: 'customer_onboarding',
    niche: ['saas', 'coaching', 'b2b'],
    icon: 'Smile',
    color: 'bg-yellow-500/10 text-yellow-500',
    popularity: 91,
    trigger: {
      type: 'TAG_ADDED',
      config: { tag: 'new-customer' }
    },
    steps: [
      { order: 1, name: 'Send Email welcome pack', actionType: 'SEND_EMAIL', config: { subject: 'Welcome to the family!', body: 'We are so excited to have you on board! Attached you will find a welcome pack that outlines what to expect next.' } },
      { order: 2, name: 'Wait 1 day', actionType: 'WAIT', config: { duration: 1, unit: 'days' } },
      { order: 3, name: 'Send Email getting started guide', actionType: 'SEND_EMAIL', config: { subject: 'Getting Started Guide', body: 'Ready to dive in? Here is a quick guide to help you get the most out of your new account within the first 48 hours.' } },
      { order: 4, name: 'Wait 3 days', actionType: 'WAIT', config: { duration: 3, unit: 'days' } },
      { order: 5, name: 'Send Email tips & tricks', actionType: 'SEND_EMAIL', config: { subject: 'Pro Tips & Tricks', body: 'Now that you are settled, here are a few advanced tips and tricks that our most successful customers use.' } }
    ]
  },
  {
    id: 'account-setup-checklist',
    name: 'Account Setup Automation',
    description: 'Ensure customers complete their account setup properly.',
    category: 'customer_onboarding',
    niche: ['saas', 'b2b'],
    icon: 'ListChecks',
    color: 'bg-yellow-500/10 text-yellow-500',
    popularity: 79,
    trigger: {
      type: 'CONTACT_CREATED',
      config: { source: 'signup' }
    },
    steps: [
      { order: 1, name: 'Create task Setup account', actionType: 'CREATE_TASK', config: { title: 'Setup new user account', priority: 'high' } },
      { order: 2, name: 'Send Email setup guide', actionType: 'SEND_EMAIL', config: { subject: 'Complete your profile', body: 'To get the most out of our platform, please take a moment to complete your profile setup. It only takes two minutes!' } },
      { order: 3, name: 'Wait 2 days', actionType: 'WAIT', config: { duration: 2, unit: 'days' } },
      { order: 4, name: 'Send SMS check-in', actionType: 'SEND_SMS', config: { message: 'Hi! Just checking if you had any issues setting up your account. Reply to this text if you need help!' } }
    ]
  },
  {
    id: 'first-30-days',
    name: 'First 30 Days Nurture',
    description: 'A comprehensive 30-day nurture to reduce churn and build value.',
    category: 'customer_onboarding',
    niche: ['saas', 'coaching'],
    icon: 'CalendarDays',
    color: 'bg-yellow-500/10 text-yellow-500',
    popularity: 84,
    trigger: {
      type: 'TAG_ADDED',
      config: { tag: 'active-subscriber' }
    },
    steps: [
      { order: 1, name: 'Send Email week 1 tips', actionType: 'SEND_EMAIL', config: { subject: 'Week 1: Mastering the Basics', body: 'Congratulations on completing your first week! Here is a recap of the basic features you should be comfortable with by now.' } },
      { order: 2, name: 'Wait 7 days', actionType: 'WAIT', config: { duration: 7, unit: 'days' } },
      { order: 3, name: 'Send Email week 2 tips', actionType: 'SEND_EMAIL', config: { subject: 'Week 2: Advanced Features', body: 'Ready to take it to the next level? This week, we are diving into advanced features that save you hours every week.' } },
      { order: 4, name: 'Wait 7 days', actionType: 'WAIT', config: { duration: 7, unit: 'days' } },
      { order: 5, name: 'Send Email week 3 tips', actionType: 'SEND_EMAIL', config: { subject: 'Week 3: Integrations', body: 'Did you know you can connect our platform with your favorite tools? Learn how to set up powerful integrations today.' } },
      { order: 6, name: 'Wait 7 days', actionType: 'WAIT', config: { duration: 7, unit: 'days' } },
      { order: 7, name: 'Send Email month summary', actionType: 'SEND_EMAIL', config: { subject: 'Your First Month Review', body: 'Wow, it has already been a month! We would love to hear about your experience so far and see how we can continue to support you.' } }
    ]
  },

  // --- Re-engagement ---
  {
    id: 'inactive-reactivation',
    name: 'Inactive Lead Reactivation',
    description: 'Win back leads who stopped responding.',
    category: 're_engagement',
    niche: ['general', 'b2b', 'real_estate'],
    icon: 'RotateCcw',
    color: 'bg-orange-500/10 text-orange-500',
    popularity: 76,
    trigger: {
      type: 'TAG_ADDED',
      config: { tag: 'inactive' }
    },
    steps: [
      { order: 1, name: 'Send Email We miss you', actionType: 'SEND_EMAIL', config: { subject: 'Are you still looking?', body: 'It has been a little while since we last spoke. Are you still actively looking for a solution, or have you already found one?' } },
      { order: 2, name: 'Wait 3 days', actionType: 'WAIT', config: { duration: 3, unit: 'days' } },
      { order: 3, name: 'Send SMS exclusive offer', actionType: 'SEND_SMS', config: { message: 'Hi there! We miss you. Use code BACK10 for 10% off your next purchase if you return this week!' } },
      { order: 4, name: 'Wait 7 days', actionType: 'WAIT', config: { duration: 7, unit: 'days' } },
      { order: 5, name: 'Create task Manual outreach', actionType: 'CREATE_TASK', config: { title: 'Manual outreach to inactive lead', priority: 'low' } }
    ]
  },
  {
    id: 'annual-renewal',
    name: 'Annual Renewal Reminder',
    description: 'Ensure subscriptions are renewed on time.',
    category: 're_engagement',
    niche: ['saas', 'b2b', 'home_services'],
    icon: 'RefreshCw',
    color: 'bg-orange-500/10 text-orange-500',
    popularity: 88,
    trigger: {
      type: 'TAG_ADDED',
      config: { tag: 'upcoming-renewal' }
    },
    steps: [
      { order: 1, name: 'Send Email renewal notice', actionType: 'SEND_EMAIL', config: { subject: 'Your annual renewal is coming up', body: 'This is a friendly heads-up that your annual subscription will automatically renew in 30 days. No action is required on your part if you wish to continue.' } },
      { order: 2, name: 'Wait 7 days', actionType: 'WAIT', config: { duration: 7, unit: 'days' } },
      { order: 3, name: 'Send SMS reminder', actionType: 'SEND_SMS', config: { message: 'Friendly reminder: Your annual subscription renews soon. If you need to update payment details, please check your email.' } },
      { order: 4, name: 'Wait 14 days', actionType: 'WAIT', config: { duration: 14, unit: 'days' } },
      { order: 5, name: 'Create task Call for renewal', actionType: 'CREATE_TASK', config: { title: 'Call to secure renewal', priority: 'high' } }
    ]
  },

  // --- Internal Operations ---
  {
    id: 'new-contact-assignment',
    name: 'Auto Contact Assignment',
    description: 'Automatically route new contacts to the right team members.',
    category: 'internal_operations',
    niche: ['general', 'b2b', 'real_estate'],
    icon: 'Users',
    color: 'bg-gray-500/10 text-gray-500',
    popularity: 93,
    trigger: {
      type: 'CONTACT_CREATED',
      config: {}
    },
    steps: [
      { order: 1, name: 'Add tag unassigned', actionType: 'ADD_TAG', config: { tag: 'unassigned' } },
      { order: 2, name: 'Create task Review and assign', actionType: 'CREATE_TASK', config: { title: 'Review and assign new contact', priority: 'medium' } },
      { order: 3, name: 'Send internal notification', actionType: 'INTERNAL_NOTIFICATION', config: { message: 'New unassigned contact needs review' } }
    ]
  },
  {
    id: 'task-escalation',
    name: 'Task Escalation Flow',
    description: 'Escalate stagnant deals or untouched leads to management.',
    category: 'internal_operations',
    niche: ['b2b', 'agency', 'real_estate'],
    icon: 'AlertTriangle',
    color: 'bg-gray-500/10 text-gray-500',
    popularity: 80,
    trigger: {
      type: 'TAG_ADDED',
      config: { tag: 'needs-attention' }
    },
    steps: [
      { order: 1, name: 'Wait 48h', actionType: 'WAIT', config: { duration: 48, unit: 'hours' } },
      { order: 2, name: 'Create task Escalate to manager', actionType: 'CREATE_TASK', config: { title: 'ESCALATION: Review stuck lead', priority: 'urgent' } },
      { order: 3, name: 'Send Email escalation notice', actionType: 'SEND_EMAIL', config: { subject: 'Urgent: Lead requires management review', body: 'A lead has gone untouched for over 48 hours and requires immediate management intervention. Please review the CRM records immediately.' } }
    ]
  },
  {
    id: 'daily-pipeline-review',
    name: 'Pipeline Review Trigger',
    description: 'Ensure the pipeline stays clean and up-to-date.',
    category: 'internal_operations',
    niche: ['b2b', 'saas'],
    icon: 'ClipboardList',
    color: 'bg-gray-500/10 text-gray-500',
    popularity: 72,
    trigger: {
      type: 'OPPORTUNITY_STAGE_CHANGED',
      config: { stage: 'Review' }
    },
    steps: [
      { order: 1, name: 'Create task Review pipeline', actionType: 'CREATE_TASK', config: { title: 'Daily pipeline review', priority: 'low' } },
      { order: 2, name: 'Send Email daily summary', actionType: 'SEND_EMAIL', config: { subject: 'Daily Pipeline Update', body: 'Here is an automated summary of the opportunities that moved into the Review stage today. Please ensure all records are updated.' } },
      { order: 3, name: 'Add tag reviewed', actionType: 'ADD_TAG', config: { tag: 'reviewed' } }
    ]
  }
];

/**
 * Convert the human-friendly template catalog format into the canonical
 * workflow execution contract used by the API. Keeping this at the catalog
 * boundary also lets older templates remain backwards compatible.
 */
export function prepareTemplateWorkflow(template: AutomationTemplate) {
  return {
    name: template.name,
    description: template.description,
    trigger: {
      type: template.trigger.type,
      config: { ...template.trigger.config },
    },
    steps: template.steps.map((step, index) => {
      let actionType = step.actionType;
      const config = { ...step.config } as Record<string, unknown>;

      if (actionType === 'WAIT') {
        actionType = 'WAIT_DELAY';
        const duration = Number(config.duration) || 0;
        const unit = String(config.unit || 'minutes');
        const multiplier = unit.startsWith('day')
          ? 1440
          : unit.startsWith('hour')
            ? 60
            : unit.startsWith('week')
              ? 10080
              : 1;
        config.delayMinutes = duration * multiplier;
        delete config.duration;
        delete config.unit;
      }

      if (actionType === 'UPDATE_OPPORTUNITY') {
        actionType = 'MOVE_OPPORTUNITY_STAGE';
        config.stageId = config.stage || '';
        delete config.stage;
      }

      if (actionType === 'SEND_SMS' && config.message !== undefined) {
        config.content = config.message;
        delete config.message;
      }

      if (actionType === 'SEND_EMAIL') {
        if (config.subject !== undefined) config.templateSubject = config.subject;
        if (config.body !== undefined) config.templateBody = config.body;
        delete config.subject;
        delete config.body;
      }

      if (actionType === 'CREATE_TASK' && config.title !== undefined) {
        config.taskTitle = config.title;
        delete config.title;
      }

      return {
        name: step.name,
        actionType,
        config,
        order: index,
      };
    }),
  };
}

export function getTemplateById(id: string): AutomationTemplate | undefined {
  return AUTOMATION_TEMPLATES.find((template) => template.id === id);
}

export function getTemplatesByCategory(category: string): AutomationTemplate[] {
  return AUTOMATION_TEMPLATES.filter(t => t.category === category);
}

export function getTemplatesByNiche(niche: string): AutomationTemplate[] {
  return AUTOMATION_TEMPLATES.filter(t => t.niche.includes(niche));
}

export function searchTemplates(query: string): AutomationTemplate[] {
  const q = query.toLowerCase();
  return AUTOMATION_TEMPLATES.filter(t => 
    t.name.toLowerCase().includes(q) || 
    t.description.toLowerCase().includes(q)
  );
}
