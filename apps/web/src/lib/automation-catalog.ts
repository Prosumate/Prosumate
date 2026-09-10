export type AutomationCatalogItem = {
  id: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  runtimeType: string;
  config?: Record<string, unknown>;
};

export type AutomationCatalogGroup = {
  id: string;
  label: string;
  items: AutomationCatalogItem[];
};

const trigger = (id: string, label: string, description: string, icon = 'Zap', runtimeType = 'CUSTOM_EVENT'): AutomationCatalogItem => ({
  id, label, description, icon, runtimeType, color: 'emerald',
  config: runtimeType === id ? {} : { eventType: id },
});

export const TRIGGER_CATALOG: AutomationCatalogGroup[] = [
  { id: 'contacts', label: 'Contacts', items: [
    trigger('CONTACT_CREATED', 'Contact Created', 'A new contact enters the CRM.', 'UserPlus', 'CONTACT_CREATED'),
    trigger('CONTACT_CHANGED', 'Contact Changed', 'Any selected contact field changes.', 'ContactRound'),
    trigger('TAG_ADDED', 'Contact Tag Added', 'A tag is applied to a contact.', 'Tag', 'TAG_ADDED'),
    trigger('TAG_REMOVED', 'Contact Tag Removed', 'A tag is removed from a contact.', 'Tags'),
    trigger('BIRTHDAY_REMINDER', 'Birthday Reminder', 'Runs relative to a contact birthday.', 'Cake'),
    trigger('CONTACT_DND_CHANGED', 'DND Changed', 'Contact communication preference changes.', 'ShieldOff'),
  ]},
  { id: 'communication', label: 'Communication', items: [
    trigger('CUSTOMER_REPLIED', 'Customer Replied', 'Inbound email, SMS, chat, or social reply.', 'MessageSquareReply', 'CUSTOMER_REPLIED'),
    trigger('INBOUND_WEBHOOK', 'Inbound Webhook', 'Receive an event from any external service.', 'Webhook'),
    trigger('CALL_STATUS', 'Call Status', 'A call starts, completes, or is missed.', 'PhoneCall'),
    trigger('EMAIL_EVENT', 'Email Event', 'Email delivered, opened, clicked, or bounced.', 'MailCheck'),
    trigger('SURVEY_SUBMITTED', 'Survey Submitted', 'A customer submits a survey.', 'ClipboardCheck'),
    trigger('FORM_SUBMITTED', 'Form Submitted', 'A lead capture form is submitted.', 'FileText', 'FORM_SUBMITTED'),
  ]},
  { id: 'appointments', label: 'Appointments', items: [
    trigger('APPOINTMENT_BOOKED', 'Appointment Booked', 'A customer books an appointment.', 'CalendarCheck', 'APPOINTMENT_BOOKED'),
    trigger('APPOINTMENT_STATUS', 'Appointment Status', 'Appointment is confirmed, cancelled, or no-show.', 'CalendarClock'),
    trigger('CALENDAR_CHANGED', 'Calendar Changed', 'A calendar booking is rescheduled.', 'CalendarDays'),
  ]},
  { id: 'opportunities', label: 'Opportunities', items: [
    trigger('OPPORTUNITY_CREATED', 'Opportunity Created', 'A new deal enters a pipeline.', 'BadgeDollarSign'),
    trigger('OPPORTUNITY_STAGE_CHANGED', 'Opportunity Stage Changed', 'A deal moves to another stage.', 'GitBranch', 'OPPORTUNITY_STAGE_CHANGED'),
    trigger('OPPORTUNITY_STATUS', 'Opportunity Status Changed', 'A deal is won, lost, or reopened.', 'Trophy'),
    trigger('STALE_OPPORTUNITY', 'Stale Opportunity', 'A deal has no activity for a set duration.', 'TimerOff'),
  ]},
  { id: 'commerce', label: 'Payments & Ecommerce', items: [
    trigger('PAYMENT_RECEIVED', 'Payment Received', 'A successful payment is captured.', 'CreditCard'),
    trigger('INVOICE_STATUS', 'Invoice Status', 'Invoice is sent, paid, overdue, or void.', 'ReceiptText'),
    trigger('ORDER_CREATED', 'Order Created', 'A store receives a new order.', 'ShoppingBag'),
    trigger('CART_ABANDONED', 'Cart Abandoned', 'A shopper leaves without completing checkout.', 'ShoppingCart'),
    trigger('SUBSCRIPTION_CHANGED', 'Subscription Changed', 'A subscription starts, renews, or cancels.', 'Repeat2'),
    trigger('PRODUCT_PURCHASED', 'Product Purchased', 'A selected product is purchased.', 'PackageCheck'),
  ]},
  { id: 'learning', label: 'Courses & Certificates', items: [
    trigger('COURSE_ENROLLED', 'Course Enrolled', 'A learner joins a course.', 'GraduationCap'),
    trigger('COURSE_COMPLETED', 'Course Completed', 'A learner completes a course.', 'BookCheck'),
    trigger('LESSON_COMPLETED', 'Lesson Completed', 'A learner completes a lesson.', 'ListChecks'),
    trigger('CERTIFICATE_ISSUED', 'Certificate Issued', 'A certificate is generated or awarded.', 'Award'),
  ]},
  { id: 'community', label: 'Communities & Affiliates', items: [
    trigger('COMMUNITY_JOINED', 'Community Joined', 'A member joins a community.', 'Users'),
    trigger('COMMUNITY_EVENT', 'Community Event', 'A member posts, comments, or earns access.', 'MessagesSquare'),
    trigger('AFFILIATE_CREATED', 'Affiliate Created', 'A new affiliate is approved.', 'Handshake'),
    trigger('AFFILIATE_SALE', 'Affiliate Sale', 'An affiliate drives a conversion.', 'CircleDollarSign'),
    trigger('PAYOUT_STATUS', 'Affiliate Payout Status', 'An affiliate payout changes status.', 'WalletCards'),
  ]},
  { id: 'events', label: 'Events & Client Portal', items: [
    trigger('EVENT_REGISTRATION', 'Event Registration', 'An attendee registers for an event.', 'TicketCheck'),
    trigger('EVENT_ATTENDANCE', 'Event Attendance', 'An attendee checks in or misses an event.', 'ScanLine'),
    trigger('CLIENT_PORTAL_ACCESS', 'Client Portal Access', 'A client is invited or signs in.', 'PanelsTopLeft'),
    trigger('DOCUMENT_SIGNED', 'Document Signed', 'A proposal or document is signed.', 'FileSignature'),
  ]},
  { id: 'advertising', label: 'Ads & Social', items: [
    trigger('FACEBOOK_LEAD', 'Facebook Lead Form', 'A Meta lead form is submitted.', 'Facebook'),
    trigger('INSTAGRAM_EVENT', 'Instagram Event', 'A comment, mention, or direct message arrives.', 'Instagram'),
    trigger('GOOGLE_ADS_LEAD', 'Google Ads Lead', 'A Google lead form or conversion fires.', 'BadgeG'),
    trigger('TIKTOK_LEAD', 'TikTok Lead', 'A TikTok instant form is submitted.', 'Music2'),
  ]},
  { id: 'voice', label: 'IVR & Events', items: [
    trigger('IVR_KEYPRESS', 'IVR Keypress', 'A caller selects an IVR menu option.', 'AudioLines'),
    trigger('VOICEMAIL_RECEIVED', 'Voicemail Received', 'A new voicemail is captured.', 'Voicemail'),
    trigger('SCHEDULED_EVENT', 'Scheduled Event', 'Runs on a date, interval, or cron schedule.', 'AlarmClock'),
  ]},
];

const action = (id: string, label: string, description: string, icon: string, runtimeType: string, color: string, config: Record<string, unknown> = {}): AutomationCatalogItem => ({ id, label, description, icon, runtimeType, color, config });

export const ACTION_CATALOG: AutomationCatalogGroup[] = [
  { id: 'communication', label: 'Communication', items: [
    action('SEND_EMAIL', 'Send Email', 'Send a personalized email.', 'Mail', 'SEND_EMAIL', 'blue'),
    action('SEND_SMS', 'Send SMS', 'Send a personalized text message.', 'MessageSquare', 'SEND_SMS', 'emerald'),
    action('INTERNAL_NOTIFICATION', 'Internal Notification', 'Notify a user or team.', 'Bell', 'INTERNAL_NOTIFICATION', 'cyan'),
    action('WEBHOOK', 'Send Webhook', 'POST data to an external endpoint.', 'Webhook', 'WEBHOOK', 'teal'),
  ]},
  { id: 'crm', label: 'CRM', items: [
    action('ADD_TAG', 'Add Contact Tag', 'Apply a tag to the contact.', 'Tag', 'ADD_TAG', 'indigo'),
    action('REMOVE_TAG', 'Remove Contact Tag', 'Remove a tag from the contact.', 'Tags', 'REMOVE_TAG', 'rose'),
    action('UPDATE_CONTACT_FIELD', 'Update Contact Field', 'Set a contact field value.', 'ContactRound', 'UPDATE_CONTACT_FIELD', 'orange'),
    action('CREATE_TASK', 'Create Task', 'Assign a follow-up task.', 'ListTodo', 'CREATE_TASK', 'amber'),
    action('MOVE_OPPORTUNITY_STAGE', 'Move Opportunity', 'Move a deal into another stage.', 'GitBranch', 'MOVE_OPPORTUNITY_STAGE', 'purple'),
  ]},
  { id: 'logic', label: 'Logic & AI', items: [
    action('WAIT_DELAY', 'Wait', 'Pause before the next action.', 'Clock3', 'WAIT_DELAY', 'slate'),
    action('IF_ELSE', 'If / Else', 'Branch using contact or event data.', 'Split', 'IF_ELSE', 'yellow'),
    action('AI_GENERATE', 'OpenAI', 'Generate, classify, summarize, or extract with AI.', 'Bot', 'AI_GENERATE', 'fuchsia', { provider: 'openai' }),
  ]},
  { id: 'apps', label: 'Apps & Integrations', items: [
    action('AIRTABLE', 'Airtable', 'Create or update Airtable records.', 'Table2', 'WEBHOOK', 'yellow', { provider: 'airtable' }),
    action('N8N', 'n8n', 'Start an n8n workflow.', 'Workflow', 'WEBHOOK', 'orange', { provider: 'n8n' }),
    action('HUBSPOT', 'HubSpot', 'Sync contacts, companies, and deals.', 'Hub', 'WEBHOOK', 'orange', { provider: 'hubspot' }),
    action('CALENDLY', 'Calendly', 'Create or manage scheduling events.', 'CalendarDays', 'WEBHOOK', 'blue', { provider: 'calendly' }),
    action('SLACK', 'Slack', 'Send a channel or direct message.', 'MessageCircle', 'WEBHOOK', 'purple', { provider: 'slack' }),
    action('ZAPIER', 'Zapier', 'Trigger a Zap with workflow data.', 'Asterisk', 'WEBHOOK', 'amber', { provider: 'zapier' }),
    action('GOOGLE_SHEETS', 'Google Sheets', 'Append or update spreadsheet rows.', 'Sheet', 'WEBHOOK', 'emerald', { provider: 'google-sheets' }),
    action('SHOPIFY', 'Shopify', 'Update customer or order data.', 'ShoppingBag', 'WEBHOOK', 'green', { provider: 'shopify' }),
    action('STRIPE', 'Stripe', 'Manage customers and subscriptions.', 'CreditCard', 'WEBHOOK', 'indigo', { provider: 'stripe' }),
    action('TWILIO', 'Twilio', 'Start a call or advanced message flow.', 'PhoneCall', 'WEBHOOK', 'red', { provider: 'twilio' }),
  ]},
];
