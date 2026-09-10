import { z } from 'zod';
import { AgencyRole, LocationRole } from '@prosumate/types';

// ==========================================
// Authentication Schemas
// ==========================================

export const registerSchema = z.object({
  email: z.string().trim().email('Invalid email address').max(255),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .max(128, 'Password cannot exceed 128 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  firstName: z.string().trim().min(1, 'First name is required').max(100),
  lastName: z.string().trim().min(1, 'Last name is required').max(100),
  phone: z.string().trim().max(30).optional(),
  agencyName: z.string().trim().min(2, 'Agency name must be at least 2 characters').max(100),
  initialLocationName: z.string().trim().min(2, 'Initial location name must be at least 2 characters').max(100).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

// ==========================================
// Agency Schemas
// ==========================================

export const createAgencySchema = z.object({
  name: z.string().trim().min(2).max(100),
  billingTier: z.string().default('starter'),
  settings: z.record(z.unknown()).optional(),
});

export type CreateAgencyInput = z.infer<typeof createAgencySchema>;

export const updateAgencySchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  settings: z.record(z.unknown()).optional(),
});

export type UpdateAgencyInput = z.infer<typeof updateAgencySchema>;

// ==========================================
// Location Schemas
// ==========================================

export const createLocationSchema = z.object({
  name: z.string().trim().min(2).max(100),
  timezone: z.string().default('UTC'),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postalCode: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
});

export type CreateLocationInput = z.infer<typeof createLocationSchema>;

export const updateLocationSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  timezone: z.string().optional(),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postalCode: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
});

export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;

// ==========================================
// User & Membership Management Schemas
// ==========================================

export const inviteUserSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  agencyRole: z.nativeEnum(AgencyRole).optional(),
  locationId: z.string().uuid().optional(),
  locationRole: z.nativeEnum(LocationRole).optional(),
});

export type InviteUserInput = z.infer<typeof inviteUserSchema>;

export const assignLocationUserSchema = z.object({
  userId: z.string().uuid(),
  role: z.nativeEnum(LocationRole),
});

export type AssignLocationUserInput = z.infer<typeof assignLocationUserSchema>;

// ==========================================
// Query & Pagination Schemas
// ==========================================

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationQueryInput = z.infer<typeof paginationQuerySchema>;

// ==========================================
// CRM Schemas (Phase 2)
// ==========================================

export const createContactSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(100),
  lastName: z.string().trim().min(1, 'Last name is required').max(100),
  email: z.string().trim().email('Invalid email address'),
  phone: z.string().trim().max(30).optional(),
  companyId: z.string().uuid().optional().nullable(),
  companyName: z.string().trim().max(100).optional(),
  source: z.string().trim().max(50).default('direct'),
  ownerId: z.string().uuid().optional().nullable(),
  tags: z.array(z.string().trim()).default([]),
  customFields: z.record(z.unknown()).default({}),
  status: z.enum(['lead', 'customer', 'unresponsive', 'archived']).default('lead'),
});

export type CreateContactInput = z.infer<typeof createContactSchema>;

export const updateContactSchema = z.object({
  firstName: z.string().trim().min(1).max(100).optional(),
  lastName: z.string().trim().min(1).max(100).optional(),
  email: z.string().trim().email().optional(),
  phone: z.string().trim().max(30).optional().nullable(),
  companyId: z.string().uuid().optional().nullable(),
  source: z.string().trim().max(50).optional(),
  ownerId: z.string().uuid().optional().nullable(),
  tags: z.array(z.string().trim()).optional(),
  customFields: z.record(z.unknown()).optional(),
  status: z.enum(['lead', 'customer', 'unresponsive', 'archived']).optional(),
});

export type UpdateContactInput = z.infer<typeof updateContactSchema>;

export const createCompanySchema = z.object({
  name: z.string().trim().min(1, 'Company name is required').max(100),
  domain: z.string().trim().max(100).optional().nullable(),
  phone: z.string().trim().max(30).optional().nullable(),
  industry: z.string().trim().max(50).optional().nullable(),
  address: z.record(z.unknown()).optional(),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;

export const addNoteSchema = z.object({
  content: z.string().trim().min(1, 'Note content cannot be empty'),
});

export type AddNoteInput = z.infer<typeof addNoteSchema>;

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, 'Task title is required').max(200),
  description: z.string().trim().optional(),
  assignedUserId: z.string().uuid().optional().nullable(),
  dueDate: z.string().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

// Pipelines & Opportunities
export const createPipelineSchema = z.object({
  name: z.string().trim().min(2).max(100),
  stages: z
    .array(
      z.object({
        name: z.string().trim().min(1),
        color: z.string().optional(),
      })
    )
    .min(1, 'Pipeline must have at least one stage'),
});

export type CreatePipelineInput = z.infer<typeof createPipelineSchema>;

export const createOpportunitySchema = z.object({
  pipelineId: z.string().uuid(),
  stageId: z.string().uuid(),
  contactId: z.string().uuid(),
  companyId: z.string().uuid().optional().nullable(),
  name: z.string().trim().min(1).max(150),
  monetaryValue: z.number().nonnegative().default(0),
  currency: z.string().default('USD'),
  status: z.enum(['open', 'won', 'lost', 'abandoned']).default('open'),
  ownerId: z.string().uuid().optional().nullable(),
  expectedCloseDate: z.string().optional().nullable(),
});

export type CreateOpportunityInput = z.infer<typeof createOpportunitySchema>;

export const moveOpportunityStageSchema = z.object({
  stageId: z.string().uuid(),
  status: z.enum(['open', 'won', 'lost', 'abandoned']).optional(),
});

export type MoveOpportunityStageInput = z.infer<typeof moveOpportunityStageSchema>;

// ==========================================
// Calendar & Appointment Schemas (Phase 3)
// ==========================================

export const createCalendarSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().min(2).max(60).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().trim().max(500).optional(),
  defaultDurationMinutes: z.number().int().min(5).max(480).default(30),
  timezone: z.string().default('America/Chicago'),
  availability: z.array(
    z.object({
      dayOfWeek: z.number().int().min(0).max(6),
      startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format'),
      endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format'),
    })
  ).min(1, 'At least one availability window is required'),
});

export type CreateCalendarInput = z.infer<typeof createCalendarSchema>;

export const bookAppointmentSchema = z.object({
  contactId: z.string().uuid().optional(),
  firstName: z.string().trim().min(1).max(100).optional(),
  lastName: z.string().trim().min(1).max(100).optional(),
  email: z.string().trim().email().optional(),
  phone: z.string().trim().max(30).optional(),
  title: z.string().trim().min(1).max(200).default('Appointment'),
  startTime: z.string(), // ISO 8601
  notes: z.string().trim().max(1000).optional(),
});

export type BookAppointmentInput = z.infer<typeof bookAppointmentSchema>;

export const updateAppointmentSchema = z.object({
  status: z.enum(['scheduled', 'completed', 'cancelled', 'no_show']),
  notes: z.string().trim().max(1000).optional(),
});

export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;

// ==========================================
// Form & Lead Capture Schemas (Phase 3)
// ==========================================

export const createFormSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().min(2).max(60).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  fields: z.array(
    z.object({
      label: z.string().trim().min(1),
      type: z.enum(['text', 'email', 'phone', 'textarea', 'select', 'checkbox']),
      placeholder: z.string().optional(),
      required: z.boolean().default(false),
      options: z.array(z.string()).optional(),
    })
  ).min(1, 'Form must have at least one field'),
  submitAction: z.enum(['create_contact', 'notify', 'redirect']).default('create_contact'),
  thankYouMessage: z.string().trim().default('Thank you for your submission!'),
  redirectUrl: z.string().url().optional().nullable(),
});

export type CreateFormInput = z.infer<typeof createFormSchema>;

export const submitFormSchema = z.object({
  data: z.record(z.unknown()),
});

export type SubmitFormInput = z.infer<typeof submitFormSchema>;

// ==========================================
// Conversations & Messages Schemas (Phase 4)
// ==========================================

export const startConversationSchema = z.object({
  contactId: z.string().uuid('Valid contactId is required'),
  channel: z.enum(['email', 'sms', 'chat']).default('email'),
  subject: z.string().trim().max(200).optional(),
  initialMessage: z.string().trim().min(1, 'Message cannot be empty').max(5000),
});

export type StartConversationInput = z.infer<typeof startConversationSchema>;

export const sendMessageSchema = z.object({
  content: z.string().trim().min(1, 'Message content cannot be empty').max(5000),
  channel: z.enum(['email', 'sms', 'chat']).optional(),
  subject: z.string().trim().max(200).optional(),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;

export const inboundWebhookSchema = z.object({
  provider: z.string().optional().default('simulated'),
  from: z.string().trim().min(1),
  to: z.string().trim().min(1),
  channel: z.enum(['email', 'sms']).default('sms'),
  content: z.string().trim().min(1),
  subject: z.string().trim().optional(),
  externalMessageId: z.string().optional(),
});

export type InboundWebhookInput = z.infer<typeof inboundWebhookSchema>;

// ==========================================
// Automation & Workflow Schemas (Phase 5+)
// ==========================================

const workflowTriggerTypes = [
  'FORM_SUBMITTED',
  'CONTACT_CREATED',
  'OPPORTUNITY_STAGE_CHANGED',
  'APPOINTMENT_BOOKED',
  'TAG_ADDED',
  'CUSTOMER_REPLIED',
  'INVOICE_PAID',
  'TASK_COMPLETED',
  'BIRTHDAY',
  'CUSTOM_EVENT',
] as const;

const workflowActionTypes = [
  'SEND_EMAIL',
  'SEND_SMS',
  'ADD_TAG',
  'REMOVE_TAG',
  'CREATE_TASK',
  'MOVE_OPPORTUNITY_STAGE',
  'WAIT_DELAY',
  'IF_ELSE',
  'AI_GENERATE',
  'WEBHOOK',
  'INTERNAL_NOTIFICATION',
  'UPDATE_CONTACT_FIELD',
] as const;

const workflowStepSchema = z.object({
  name: z.string().trim().min(1),
  actionType: z.enum(workflowActionTypes),
  config: z.record(z.unknown()).default({}),
  order: z.number().int().nonnegative(),
});

export const createWorkflowSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).optional().nullable(),
  status: z.enum(['draft', 'published', 'paused']).default('published'),
  trigger: z.object({
    type: z.enum(workflowTriggerTypes),
    config: z.record(z.unknown()).default({}),
  }),
  steps: z
    .array(workflowStepSchema)
    .min(1, 'Workflow must contain at least one action step'),
  folderId: z.string().uuid().optional().nullable(),
  tags: z.array(z.string().trim().min(1).max(50)).max(20).optional(),
});

export type CreateWorkflowInput = z.infer<typeof createWorkflowSchema>;

export const updateWorkflowSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(500).optional().nullable(),
  status: z.enum(['draft', 'published', 'paused']).optional(),
  trigger: z
    .object({
      type: z.enum(workflowTriggerTypes),
      config: z.record(z.unknown()).default({}),
    })
    .optional(),
  steps: z.array(workflowStepSchema).min(1, 'Workflow must contain at least one action step').optional(),
  folderId: z.string().uuid().optional().nullable(),
  tags: z.array(z.string().trim().min(1).max(50)).max(20).optional(),
});

export type UpdateWorkflowInput = z.infer<typeof updateWorkflowSchema>;

export const testRunWorkflowSchema = z.object({
  contactId: z.string().uuid('Valid contactId is required'),
  triggerData: z.record(z.unknown()).optional(),
});

export type TestRunWorkflowInput = z.infer<typeof testRunWorkflowSchema>;

// Workflow Folder schemas
export const createWorkflowFolderSchema = z.object({
  name: z.string().trim().min(2).max(80),
  color: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
});

export type CreateWorkflowFolderInput = z.infer<typeof createWorkflowFolderSchema>;

export const updateWorkflowFolderSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  color: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
});

export type UpdateWorkflowFolderInput = z.infer<typeof updateWorkflowFolderSchema>;

// Move workflow to folder
export const moveWorkflowSchema = z.object({
  folderId: z.string().uuid().nullable(),
});

export type MoveWorkflowInput = z.infer<typeof moveWorkflowSchema>;

// Duplicate workflow
export const duplicateWorkflowSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
});

export type DuplicateWorkflowInput = z.infer<typeof duplicateWorkflowSchema>;

// Create from template
export const createFromTemplateSchema = z.object({
  templateId: z.string().min(1),
  name: z.string().trim().min(2).max(120).optional(),
  overrides: z.record(z.unknown()).optional(),
});

export type CreateFromTemplateInput = z.infer<typeof createFromTemplateSchema>;

// AI workflow generation
export const generateAiWorkflowSchema = z.object({
  prompt: z.string().trim().min(10).max(2000),
  niche: z.string().optional(),
});

export type GenerateAiWorkflowInput = z.infer<typeof generateAiWorkflowSchema>;

// ==========================================
// Billing & Subscriptions Schemas (Phase 6)
// ==========================================

export const createSubscriptionSchema = z.object({
  planId: z.string().min(1, 'Valid planId is required'),
  paymentMethodId: z.string().optional().default('pm_card_visa'),
});

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;

export const updateSubscriptionSchema = z.object({
  planId: z.string().optional(),
  cancelAtPeriodEnd: z.boolean().optional(),
});

export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;

export const topUpWalletSchema = z.object({
  amountCents: z
    .number()
    .int('Amount in cents must be an integer')
    .min(500, 'Minimum top-up amount is $5.00 (500 cents)')
    .max(1000000, 'Maximum top-up amount is $10,000.00'),
  paymentMethodId: z.string().optional().default('pm_card_visa'),
});

export type TopUpWalletInput = z.infer<typeof topUpWalletSchema>;

export const updateWalletConfigSchema = z.object({
  autoRechargeEnabled: z.boolean().optional(),
  autoRechargeThresholdCents: z.number().int().nonnegative().optional(),
  autoRechargeAmountCents: z.number().int().positive().optional(),
});

export type UpdateWalletConfigInput = z.infer<typeof updateWalletConfigSchema>;

export const recordUsageSchema = z.object({
  type: z.enum(['sms', 'email', 'ai_tokens', 'phone_number']),
  units: z.number().int().positive('Units must be greater than zero'),
  description: z.string().trim().min(1).max(200),
});

export type RecordUsageInput = z.infer<typeof recordUsageSchema>;

// ==========================================
// Landing Pages & Funnels Schemas (Phase 7)
// ==========================================

export const funnelBlockSchema = z.object({
  id: z.string().optional(),
  type: z.string().trim().min(1, 'Block type is required'),
  title: z.string().trim().optional().nullable().default(''),
  subtitle: z.string().trim().optional().nullable(),
  content: z.string().trim().optional().nullable(),
  settings: z.record(z.any()).default({}),
  order: z.number().int().nonnegative().default(0),
}).passthrough();

export type FunnelBlockInput = z.infer<typeof funnelBlockSchema>;

export const funnelStepSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, 'Step name is required'),
  slug: z.string().trim().min(1),
  type: z.string().trim().default('opt_in'),
  order: z.number().int().nonnegative().default(0),
  blocks: z.array(funnelBlockSchema).default([]),
  nextStepSlug: z.string().trim().optional().nullable(),
}).passthrough();

export type FunnelStepInput = z.infer<typeof funnelStepSchema>;

export const createFunnelSchema = z.object({
  name: z.string().trim().min(1, 'Funnel name is required').max(120),
  slug: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).optional().nullable(),
  published: z.boolean().default(true),
  steps: z.array(funnelStepSchema).min(1, 'Funnel must contain at least one step'),
}).passthrough();

export type CreateFunnelInput = z.infer<typeof createFunnelSchema>;

export const updateFunnelSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  slug: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(500).optional().nullable(),
  published: z.boolean().optional(),
  steps: z.array(funnelStepSchema).optional(),
}).passthrough();

export type UpdateFunnelInput = z.infer<typeof updateFunnelSchema>;

export const recordFunnelEventSchema = z.object({
  stepSlug: z.string().trim().min(1),
  type: z.enum(['view', 'conversion']),
});

export type RecordFunnelEventInput = z.infer<typeof recordFunnelEventSchema>;

// ==========================================
// Reporting, Attribution & Reputation (Phase 8)
// ==========================================

export const createCampaignMetricSchema = z.object({
  channel: z.enum(['google_ads', 'facebook_ads', 'organic_search', 'referral', 'email_campaign', 'direct']),
  campaignName: z.string().trim().min(1).max(100),
  adSpendCents: z.number().int().nonnegative(),
  impressions: z.number().int().nonnegative(),
  clicks: z.number().int().nonnegative(),
  leadsGenerated: z.number().int().nonnegative(),
  dealsClosed: z.number().int().nonnegative(),
  revenueGeneratedCents: z.number().int().nonnegative(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type CreateCampaignMetricInput = z.infer<typeof createCampaignMetricSchema>;

export const sendReviewRequestSchema = z.object({
  contactId: z.string().uuid(),
  channel: z.enum(['sms', 'email']),
  customMessage: z.string().trim().max(300).optional(),
});

export type SendReviewRequestInput = z.infer<typeof sendReviewRequestSchema>;

export const replyReviewSchema = z.object({
  replyText: z.string().trim().min(2, 'Reply must be at least 2 characters').max(1000),
});

export type ReplyReviewInput = z.infer<typeof replyReviewSchema>;

export const publicSubmitReviewSchema = z.object({
  authorName: z.string().trim().min(2).max(100),
  rating: z.number().int().min(1).max(5),
  source: z.enum(['google', 'facebook', 'trustpilot', 'direct']).default('direct'),
  reviewText: z.string().trim().min(5).max(2000),
});

export type PublicSubmitReviewInput = z.infer<typeof publicSubmitReviewSchema>;

// ==========================================
// AI Tools & Assistants Schemas (Phase 9)
// ==========================================

export const generateAiTextSchema = z.object({
  task: z.enum(['suggest_reply', 'generate_copy', 'qualify_lead', 'summarize_conversation']),
  prompt: z.string().trim().min(2, 'Prompt must be at least 2 characters').max(4000),
  tone: z.enum(['professional', 'persuasive', 'friendly', 'urgent', 'consultative']).default('professional'),
  contactId: z.string().uuid().optional(),
  channel: z.enum(['email', 'sms', 'ad_copy', 'landing_page']).optional(),
  context: z.record(z.unknown()).optional(),
});

export type GenerateAiTextInput = z.infer<typeof generateAiTextSchema>;

export const updateAiConfigSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  systemPrompt: z.string().trim().max(2000).optional(),
  defaultTone: z.enum(['professional', 'persuasive', 'friendly', 'urgent', 'consultative']).optional(),
  autoReplyEnabled: z.boolean().optional(),
  qualificationThreshold: z.number().int().min(1).max(100).optional(),
});

export type UpdateAiConfigInput = z.infer<typeof updateAiConfigSchema>;

// ==========================================
// Marketplace, Webhooks & Enterprise Schemas (Phase 10)
// ==========================================

export const createWebhookSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  targetUrl: z.string().url('Target URL must be a valid URL'),
  events: z.array(z.string().min(1)).min(1, 'At least one event must be selected'),
});

export type CreateWebhookInput = z.infer<typeof createWebhookSchema>;

export const updateWebhookSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  targetUrl: z.string().url().optional(),
  events: z.array(z.string().min(1)).optional(),
  status: z.enum(['active', 'paused']).optional(),
});

export type UpdateWebhookInput = z.infer<typeof updateWebhookSchema>;

export const updateSsoConfigSchema = z.object({
  provider: z.enum(['saml', 'oidc', 'google_workspace', 'azure_ad']).default('saml'),
  idpMetadataUrl: z.string().url().optional().or(z.literal('')),
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  enforceSso: z.boolean().default(false),
  allowedDomains: z.array(z.string().trim()).default([]),
});

export type UpdateSsoConfigInput = z.infer<typeof updateSsoConfigSchema>;


