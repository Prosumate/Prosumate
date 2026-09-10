/**
 * Prosumate Multi-Tenant Domain Types & Contracts
 */

// ==========================================
// 1. Roles & Permissions (RBAC)
// ==========================================

export enum AgencyRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

export enum LocationRole {
  LOCATION_ADMIN = 'LOCATION_ADMIN',
  LOCATION_USER = 'LOCATION_USER',
  LOCATION_READONLY = 'LOCATION_READONLY',
}

export type Permission =
  // Platform Permissions
  | 'platform:manage'
  | 'platform:audit:read'
  // Agency Permissions
  | 'agency:read'
  | 'agency:update'
  | 'agency:delete'
  | 'agency:billing:manage'
  | 'agency:settings:manage'
  // Location Permissions
  | 'location:read'
  | 'location:create'
  | 'location:update'
  | 'location:delete'
  | 'location:settings:manage'
  // User & Membership Permissions
  | 'users:read'
  | 'users:invite'
  | 'users:update'
  | 'users:remove'
  // Audit Permissions
  | 'audit:read'
  // CRM (Prepared for Phase 2)
  | 'crm:contacts:read'
  | 'crm:contacts:create'
  | 'crm:contacts:update'
  | 'crm:contacts:delete'
  | 'crm:companies:read'
  | 'crm:companies:manage'
  | 'crm:pipelines:read'
  | 'crm:pipelines:manage'
  // Calendars & Appointments (Phase 3)
  | 'calendars:read'
  | 'calendars:manage'
  // Forms & Lead Capture (Phase 3)
  | 'forms:read'
  | 'forms:manage'
  // Conversations & Unified Inbox (Phase 4)
  | 'conversations:read'
  | 'conversations:send'
  // Automation & Workflows (Phase 5)
  | 'workflows:read'
  | 'workflows:manage'
  | 'workflows:execute'
  // Billing & Subscriptions (Phase 6)
  | 'billing:read'
  | 'billing:manage'
  // Funnels & Landing Pages (Phase 7)
  | 'funnels:read'
  | 'funnels:manage'
  // Reporting, Attribution & Reputation (Phase 8)
  | 'reports:read'
  | 'reputation:read'
  | 'reputation:manage'
  // AI Tools & Assistants (Phase 9)
  | 'ai:read'
  | 'ai:generate'
  | 'ai:manage'
  // Marketplace, Webhooks & Enterprise (Phase 10)
  | 'marketplace:read'
  | 'marketplace:install'
  | 'webhooks:read'
  | 'webhooks:manage'
  | 'sso:manage';

export const ROLE_PERMISSIONS: Record<AgencyRole | LocationRole, Permission[]> = {
  [AgencyRole.OWNER]: [
    'agency:read',
    'agency:update',
    'agency:delete',
    'agency:billing:manage',
    'agency:settings:manage',
    'location:read',
    'location:create',
    'location:update',
    'location:delete',
    'location:settings:manage',
    'users:read',
    'users:invite',
    'users:update',
    'users:remove',
    'audit:read',
    'crm:contacts:read',
    'crm:contacts:create',
    'crm:contacts:update',
    'crm:contacts:delete',
    'crm:companies:read',
    'crm:companies:manage',
    'crm:pipelines:read',
    'crm:pipelines:manage',
    'calendars:read',
    'calendars:manage',
    'forms:read',
    'forms:manage',
    'conversations:read',
    'conversations:send',
    'workflows:read',
    'workflows:manage',
    'workflows:execute',
    'billing:read',
    'billing:manage',
    'funnels:read',
    'funnels:manage',
    'reports:read',
    'reputation:read',
    'reputation:manage',
    'ai:read',
    'ai:generate',
    'ai:manage',
    'marketplace:read',
    'marketplace:install',
    'webhooks:read',
    'webhooks:manage',
    'sso:manage',
  ],
  [AgencyRole.ADMIN]: [
    'agency:read',
    'agency:update',
    'agency:settings:manage',
    'location:read',
    'location:create',
    'location:update',
    'location:settings:manage',
    'users:read',
    'users:invite',
    'users:update',
    'audit:read',
    'crm:contacts:read',
    'crm:contacts:create',
    'crm:contacts:update',
    'crm:contacts:delete',
    'crm:companies:read',
    'crm:companies:manage',
    'crm:pipelines:read',
    'crm:pipelines:manage',
    'calendars:read',
    'calendars:manage',
    'forms:read',
    'forms:manage',
    'conversations:read',
    'conversations:send',
    'workflows:read',
    'workflows:manage',
    'workflows:execute',
    'billing:read',
    'billing:manage',
    'funnels:read',
    'funnels:manage',
    'reports:read',
    'reputation:read',
    'reputation:manage',
    'ai:read',
    'ai:generate',
    'ai:manage',
    'marketplace:read',
    'marketplace:install',
    'webhooks:read',
    'webhooks:manage',
    'sso:manage',
  ],
  [AgencyRole.MEMBER]: [
    'agency:read',
    'location:read',
    'users:read',
    'crm:contacts:read',
    'crm:companies:read',
    'crm:pipelines:read',
    'calendars:read',
    'forms:read',
    'conversations:read',
    'workflows:read',
  ],
  [LocationRole.LOCATION_ADMIN]: [
    'location:read',
    'location:update',
    'location:settings:manage',
    'users:read',
    'users:invite',
    'crm:contacts:read',
    'crm:contacts:create',
    'crm:contacts:update',
    'crm:contacts:delete',
    'crm:companies:read',
    'crm:companies:manage',
    'crm:pipelines:read',
    'crm:pipelines:manage',
    'calendars:read',
    'calendars:manage',
    'forms:read',
    'forms:manage',
    'conversations:read',
    'conversations:send',
    'workflows:read',
    'workflows:manage',
    'workflows:execute',
    'billing:read',
    'billing:manage',
    'funnels:read',
    'funnels:manage',
    'reports:read',
    'reputation:read',
    'reputation:manage',
    'ai:read',
    'ai:generate',
    'ai:manage',
    'marketplace:read',
    'marketplace:install',
    'webhooks:read',
    'webhooks:manage',
    'sso:manage',
  ],
  [LocationRole.LOCATION_USER]: [
    'location:read',
    'users:read',
    'crm:contacts:read',
    'crm:contacts:create',
    'crm:contacts:update',
    'crm:companies:read',
    'crm:pipelines:read',
    'calendars:read',
    'calendars:manage',
    'forms:read',
    'conversations:read',
    'conversations:send',
    'workflows:read',
    'workflows:execute',
    'billing:read',
    'funnels:read',
    'reports:read',
    'reputation:read',
    'ai:read',
    'ai:generate',
    'marketplace:read',
    'webhooks:read',
  ],
  [LocationRole.LOCATION_READONLY]: [
    'location:read',
    'users:read',
    'crm:contacts:read',
    'crm:companies:read',
    'crm:pipelines:read',
    'calendars:read',
    'forms:read',
    'conversations:read',
    'workflows:read',
    'billing:read',
    'funnels:read',
    'reports:read',
    'reputation:read',
    'ai:read',
    'marketplace:read',
  ],
};

// ==========================================
// 2. Multi-Tenant Entities & Statuses
// ==========================================

export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  INVITED = 'invited',
}

export enum AgencyStatus {
  ACTIVE = 'active',
  TRIAL = 'trial',
  PAST_DUE = 'past_due',
  SUSPENDED = 'suspended',
}

export enum LocationStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  isPlatformAdmin: boolean;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Agency {
  id: string;
  name: string;
  slug: string;
  status: AgencyStatus;
  billingTier: string;
  settings?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Location {
  id: string;
  agencyId: string;
  name: string;
  slug: string;
  timezone: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  } | null;
  status: LocationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface UserAgencyMembership {
  id: string;
  userId: string;
  agencyId: string;
  role: AgencyRole;
  createdAt: string;
}

export interface UserLocationMembership {
  id: string;
  userId: string;
  locationId: string;
  role: LocationRole;
  permissionsOverride?: Permission[];
  createdAt: string;
}

// ==========================================
// 3. Request Tenant Context & Auth Claims
// ==========================================

export interface TenantContext {
  userId: string;
  email: string;
  isPlatformAdmin: boolean;
  activeAgencyId?: string;
  activeLocationId?: string;
  agencyRole?: AgencyRole;
  locationRole?: LocationRole;
  permissions: Permission[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface JwtPayload {
  sub: string; // userId
  email: string;
  isPlatformAdmin: boolean;
  agencyId?: string;
  locationId?: string;
  iat?: number;
  exp?: number;
}

// ==========================================
// 4. Audit Logging
// ==========================================

export enum AuditAction {
  USER_REGISTERED = 'USER_REGISTERED',
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  AGENCY_CREATED = 'AGENCY_CREATED',
  AGENCY_UPDATED = 'AGENCY_UPDATED',
  LOCATION_CREATED = 'LOCATION_CREATED',
  LOCATION_UPDATED = 'LOCATION_UPDATED',
  USER_INVITED = 'USER_INVITED',
  USER_ROLE_CHANGED = 'USER_ROLE_CHANGED',
  USER_REMOVED = 'USER_REMOVED',
  CROSS_TENANT_ACCESS_DENIED = 'CROSS_TENANT_ACCESS_DENIED',
  UNAUTHORIZED_ACCESS_ATTEMPT = 'UNAUTHORIZED_ACCESS_ATTEMPT',
}

export interface AuditLog {
  id: string;
  agencyId?: string | null;
  locationId?: string | null;
  actorId?: string | null;
  actorEmail?: string | null;
  action: AuditAction | string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  createdAt: string;
}

// ==========================================
// 5. Standard API Envelopes & Errors
// ==========================================

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    [key: string]: unknown;
  };
  requestId?: string;
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorDetail;
  requestId: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ==========================================
// 6. CRM & Pipeline Domain Types (Phase 2)
// ==========================================

export enum ContactStatus {
  LEAD = 'lead',
  CUSTOMER = 'customer',
  UNRESPONSIVE = 'unresponsive',
  ARCHIVED = 'archived',
}

export enum OpportunityStatus {
  OPEN = 'open',
  WON = 'won',
  LOST = 'lost',
  ABANDONED = 'abandoned',
}

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

export enum ActivityType {
  CONTACT_CREATED = 'CONTACT_CREATED',
  CONTACT_UPDATED = 'CONTACT_UPDATED',
  NOTE_ADDED = 'NOTE_ADDED',
  TASK_CREATED = 'TASK_CREATED',
  TASK_COMPLETED = 'TASK_COMPLETED',
  OPPORTUNITY_CREATED = 'OPPORTUNITY_CREATED',
  STAGE_MOVED = 'STAGE_MOVED',
  COMMUNICATION_SENT = 'COMMUNICATION_SENT',
}

export interface Company {
  id: string;
  agencyId: string;
  locationId: string;
  name: string;
  domain?: string | null;
  phone?: string | null;
  industry?: string | null;
  address?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  agencyId: string;
  locationId: string;
  companyId?: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  source?: string | null;
  ownerId?: string | null;
  tags: string[];
  customFields: Record<string, unknown>;
  status: ContactStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface ContactNote {
  id: string;
  contactId: string;
  authorId: string;
  authorEmail: string;
  content: string;
  createdAt: string;
}

export interface ContactTask {
  id: string;
  contactId: string;
  assignedUserId?: string | null;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  status: TaskStatus;
  createdAt: string;
  completedAt?: string | null;
}

export interface ActivityTimelineItem {
  id: string;
  contactId: string;
  actorId?: string | null;
  actorEmail?: string | null;
  type: ActivityType;
  title: string;
  description?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface PipelineStage {
  id: string;
  pipelineId: string;
  name: string;
  order: number;
  color?: string | null;
}

export interface Pipeline {
  id: string;
  agencyId: string;
  locationId: string;
  name: string;
  stages: PipelineStage[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Opportunity {
  id: string;
  agencyId: string;
  locationId: string;
  pipelineId: string;
  stageId: string;
  contactId: string;
  companyId?: string | null;
  name: string;
  monetaryValue: number;
  currency: string;
  status: OpportunityStatus;
  ownerId?: string | null;
  expectedCloseDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OpportunityMovement {
  id: string;
  opportunityId: string;
  fromStageId?: string | null;
  toStageId: string;
  actorId?: string | null;
  createdAt: string;
}

export interface KanbanStageWithOpportunities extends PipelineStage {
  opportunities: Array<Opportunity & { contact?: Contact; company?: Company }>;
  totalValue: number;
}

// ==========================================
// 7. Calendars & Appointments (Phase 3)
// ==========================================

export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export interface AvailabilityRule {
  dayOfWeek: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  startTime: string; // "09:00"
  endTime: string;   // "17:00"
}

export interface Calendar {
  id: string;
  agencyId: string;
  locationId: string;
  name: string;
  slug: string;
  description?: string | null;
  defaultDurationMinutes: number;
  timezone: string;
  availability: AvailabilityRule[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  calendarId: string;
  agencyId: string;
  locationId: string;
  contactId: string;
  assignedUserId?: string | null;
  title: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  notes?: string | null;
  meetingLink?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 8. Forms & Lead Capture (Phase 3)
// ==========================================

export enum FormFieldType {
  TEXT = 'text',
  EMAIL = 'email',
  PHONE = 'phone',
  TEXTAREA = 'textarea',
  SELECT = 'select',
  CHECKBOX = 'checkbox',
}

export interface FormField {
  id: string;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  required: boolean;
  options?: string[]; // For select fields
  order: number;
}

export interface Form {
  id: string;
  agencyId: string;
  locationId: string;
  name: string;
  slug: string;
  fields: FormField[];
  submitAction: 'create_contact' | 'notify' | 'redirect';
  thankYouMessage: string;
  redirectUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FormSubmission {
  id: string;
  formId: string;
  locationId: string;
  contactId?: string | null;
  submissionData: Record<string, unknown>;
  ipAddress?: string | null;
  createdAt: string;
}

// ==========================================
// 9. Conversations & Unified Inbox (Phase 4)
// ==========================================

export enum ConversationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  CHAT = 'chat',
}

export enum MessageDirection {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound',
}

export enum MessageStatus {
  QUEUED = 'queued',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  RECEIVED = 'received',
}

export enum SenderType {
  USER = 'user',
  CONTACT = 'contact',
  SYSTEM = 'system',
}

export interface Conversation {
  id: string;
  agencyId: string;
  locationId: string;
  contactId: string;
  channel: ConversationChannel;
  subject?: string | null;
  lastMessageSnippet: string;
  lastMessageAt: string;
  unreadCount: number;
  assignedUserId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  agencyId: string;
  locationId: string;
  contactId: string;
  senderId?: string | null;
  senderType: SenderType;
  channel: ConversationChannel;
  direction: MessageDirection;
  content: string;
  subject?: string | null;
  status: MessageStatus;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// ==========================================
// 10. Automation & Workflows (Phase 5+)
// ==========================================

export enum WorkflowTriggerType {
  FORM_SUBMITTED = 'FORM_SUBMITTED',
  CONTACT_CREATED = 'CONTACT_CREATED',
  OPPORTUNITY_STAGE_CHANGED = 'OPPORTUNITY_STAGE_CHANGED',
  APPOINTMENT_BOOKED = 'APPOINTMENT_BOOKED',
  TAG_ADDED = 'TAG_ADDED',
  CUSTOMER_REPLIED = 'CUSTOMER_REPLIED',
  INVOICE_PAID = 'INVOICE_PAID',
  TASK_COMPLETED = 'TASK_COMPLETED',
  BIRTHDAY = 'BIRTHDAY',
  CUSTOM_EVENT = 'CUSTOM_EVENT',
}

export enum WorkflowActionType {
  SEND_EMAIL = 'SEND_EMAIL',
  SEND_SMS = 'SEND_SMS',
  ADD_TAG = 'ADD_TAG',
  REMOVE_TAG = 'REMOVE_TAG',
  CREATE_TASK = 'CREATE_TASK',
  MOVE_OPPORTUNITY_STAGE = 'MOVE_OPPORTUNITY_STAGE',
  WAIT_DELAY = 'WAIT_DELAY',
  IF_ELSE = 'IF_ELSE',
  AI_GENERATE = 'AI_GENERATE',
  WEBHOOK = 'WEBHOOK',
  INTERNAL_NOTIFICATION = 'INTERNAL_NOTIFICATION',
  UPDATE_CONTACT_FIELD = 'UPDATE_CONTACT_FIELD',
}

export enum WorkflowStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  PAUSED = 'paused',
}

export enum WorkflowExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface WorkflowTrigger {
  type: WorkflowTriggerType | string;
  config: Record<string, unknown>;
}

export interface WorkflowStep {
  id: string;
  name: string;
  actionType: WorkflowActionType | string;
  config: Record<string, unknown>;
  order: number;
  nextStepId?: string | null;
}

export interface Workflow {
  id: string;
  agencyId: string;
  locationId: string;
  name: string;
  description?: string | null;
  status: WorkflowStatus | string;
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
  totalRuns: number;
  successfulRuns: number;
  folderId?: string | null;
  deletedAt?: string | null;
  duplicatedFrom?: string | null;
  createdBy?: string | null;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowFolder {
  id: string;
  locationId: string;
  name: string;
  color?: string | null;
  icon?: string | null;
  workflowCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  niche: string[];
  icon: string;
  color: string;
  trigger: WorkflowTrigger;
  steps: Array<{
    name: string;
    actionType: string;
    config: Record<string, unknown>;
    order: number;
  }>;
  popularity: number;
}

export interface AiWorkflowGenerationResult {
  workflow: Workflow;
  confidence: number;
  matchedPattern?: string | null;
  suggestions: string[];
}

export interface WorkflowExecutionStepLog {
  stepId: string;
  stepName: string;
  actionType: WorkflowActionType | string;
  status: 'completed' | 'failed' | 'skipped';
  output?: Record<string, unknown>;
  executedAt: string;
  errorMessage?: string | null;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowName: string;
  locationId: string;
  contactId: string;
  triggerType: WorkflowTriggerType | string;
  status: WorkflowExecutionStatus;
  stepsExecuted: WorkflowExecutionStepLog[];
  startedAt: string;
  completedAt?: string | null;
  error?: string | null;
}

// ==========================================
// 11. Stripe Billing, Subscriptions & Metering (Phase 6)
// ==========================================

export enum SubscriptionTier {
  STARTER = 'starter',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
  CUSTOM = 'custom',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  TRIALING = 'trialing',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  UNPAID = 'unpaid',
}

export enum BillingInterval {
  MONTH = 'month',
  YEAR = 'year',
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: SubscriptionTier;
  description: string;
  priceCents: number;
  interval: BillingInterval;
  currency: string;
  features: string[];
  includedCreditsCents: number;
  isPopular?: boolean;
}

export interface LocationSubscription {
  id: string;
  agencyId: string;
  locationId: string;
  planId: string;
  planName: string;
  tier: SubscriptionTier;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreditWallet {
  id: string;
  agencyId: string;
  locationId: string;
  balanceCents: number;
  currency: string;
  autoRechargeEnabled: boolean;
  autoRechargeThresholdCents: number;
  autoRechargeAmountCents: number;
  updatedAt: string;
}

export enum UsageMeteringType {
  SMS = 'sms',
  EMAIL = 'email',
  AI_TOKENS = 'ai_tokens',
  PHONE_NUMBER = 'phone_number',
}

export interface UsageTransaction {
  id: string;
  agencyId: string;
  locationId: string;
  type: UsageMeteringType;
  amountCents: number;
  description: string;
  units: number;
  unitPriceCents: number;
  rebillingMarginPercent: number;
  createdAt: string;
}

export enum InvoiceStatus {
  DRAFT = 'draft',
  OPEN = 'open',
  PAID = 'paid',
  UNCOLLECTIBLE = 'uncollectible',
  VOID = 'void',
}

export interface Invoice {
  id: string;
  agencyId: string;
  locationId: string;
  stripeInvoiceId: string;
  amountDueCents: number;
  amountPaidCents: number;
  currency: string;
  status: InvoiceStatus;
  invoicePdfUrl?: string | null;
  createdAt: string;
  paidAt?: string | null;
}

// ==========================================
// 12. Landing Pages, Funnels & Page Builder (Phase 7)
// ==========================================

export enum FunnelStepType {
  OPT_IN = 'opt_in',
  SALES = 'sales',
  CHECKOUT = 'checkout',
  UPSELL = 'upsell',
  DOWNSELL = 'downsell',
  THANK_YOU = 'thank_you',
}

export enum FunnelBlockType {
  HERO = 'hero',
  FEATURES = 'features',
  TESTIMONIALS = 'testimonials',
  PRICING = 'pricing',
  FORM_EMBED = 'form_embed',
  CTA = 'cta',
  VIDEO = 'video',
}

export interface FunnelBlockSettings {
  backgroundColor?: string;
  textColor?: string;
  buttonText?: string;
  buttonUrl?: string;
  buttonVariant?: 'primary' | 'secondary' | 'outline';
  formId?: string;
  mediaUrl?: string;
  badgeText?: string;
  columns?: number;
  items?: Array<{
    title: string;
    description: string;
    icon?: string;
    author?: string;
    role?: string;
    avatarUrl?: string;
  }>;
}

export interface FunnelBlock {
  id: string;
  type: FunnelBlockType;
  title: string;
  subtitle?: string;
  content?: string;
  settings: FunnelBlockSettings;
  order: number;
}

export interface FunnelStep {
  id: string;
  funnelId: string;
  name: string;
  slug: string;
  type: FunnelStepType;
  order: number;
  blocks: FunnelBlock[];
  pageViews: number;
  conversions: number;
  nextStepSlug?: string | null;
}

export interface Funnel {
  id: string;
  agencyId: string;
  locationId: string;
  name: string;
  slug: string;
  description?: string | null;
  published: boolean;
  steps: FunnelStep[];
  totalViews: number;
  totalConversions: number;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 13. Reporting, Attribution & Reputation (Phase 8)
// ==========================================

export enum AttributionChannel {
  GOOGLE_ADS = 'google_ads',
  FACEBOOK_ADS = 'facebook_ads',
  ORGANIC_SEARCH = 'organic_search',
  REFERRAL = 'referral',
  EMAIL_CAMPAIGN = 'email_campaign',
  DIRECT = 'direct',
}

export enum AttributionModel {
  FIRST_TOUCH = 'first_touch',
  LAST_TOUCH = 'last_touch',
  LINEAR = 'linear',
}

export interface CampaignMetric {
  id: string;
  agencyId: string;
  locationId: string;
  channel: AttributionChannel;
  campaignName: string;
  adSpendCents: number;
  impressions: number;
  clicks: number;
  leadsGenerated: number;
  dealsClosed: number;
  revenueGeneratedCents: number;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface ChannelAttributionSummary {
  channel: AttributionChannel;
  channelLabel: string;
  adSpendCents: number;
  revenueCents: number;
  leads: number;
  deals: number;
  roas: number;
  cacCents: number;
}

export interface AttributionReport {
  channels: ChannelAttributionSummary[];
  totalAdSpendCents: number;
  totalRevenueCents: number;
  blendedRoas: number;
  blendedCacCents: number;
  totalLeads: number;
  totalDeals: number;
}

export interface SalesLeaderboardItem {
  userId: string;
  userName: string;
  userEmail: string;
  dealsWon: number;
  revenueWonCents: number;
  winRatePercent: number;
  avgDealSizeCents: number;
}

export enum ReviewSource {
  GOOGLE = 'google',
  FACEBOOK = 'facebook',
  TRUSTPILOT = 'trustpilot',
  DIRECT = 'direct',
}

export enum ReviewStatus {
  NEW = 'new',
  REPLIED = 'replied',
  FLAGGED = 'flagged',
  ARCHIVED = 'archived',
}

export interface CustomerReview {
  id: string;
  agencyId: string;
  locationId: string;
  contactId?: string | null;
  authorName: string;
  rating: number; // 1 to 5
  source: ReviewSource;
  reviewText: string;
  responseReply?: string | null;
  status: ReviewStatus;
  respondedAt?: string | null;
  createdAt: string;
}

export interface ReviewRequest {
  id: string;
  agencyId: string;
  locationId: string;
  contactId: string;
  contactName: string;
  channel: 'sms' | 'email';
  status: 'sent' | 'opened' | 'completed';
  sentAt: string;
}

// ==========================================
// 14. AI Tools & Assistants (Phase 9)
// ==========================================

export enum AiTaskType {
  SUGGEST_REPLY = 'suggest_reply',
  GENERATE_COPY = 'generate_copy',
  QUALIFY_LEAD = 'qualify_lead',
  SUMMARIZE_CONVERSATION = 'summarize_conversation',
}

export enum AiTone {
  PROFESSIONAL = 'professional',
  PERSUASIVE = 'persuasive',
  FRIENDLY = 'friendly',
  URGENT = 'urgent',
  CONSULTATIVE = 'consultative',
}

export interface AiAgentConfig {
  id: string;
  agencyId: string;
  locationId: string;
  name: string;
  systemPrompt: string;
  defaultTone: AiTone;
  autoReplyEnabled: boolean;
  qualificationThreshold: number;
  model: string;
  tokensUsedTotal: number;
  createdAt: string;
  updatedAt: string;
}

export interface AiGenerationResult {
  id: string;
  agencyId: string;
  locationId: string;
  task: AiTaskType;
  tone: AiTone;
  prompt: string;
  resultText: string;
  tokensUsed: number;
  costCents: number;
  qualificationScore?: number | null;
  recommendedAction?: string | null;
  createdAt: string;
}

// ==========================================
// 15. Marketplace, Webhooks & Enterprise (Phase 10)
// ==========================================

export enum SnapshotCategory {
  REAL_ESTATE = 'real_estate',
  HEALTHCARE = 'healthcare',
  LEGAL = 'legal',
  SAAS = 'saas',
  AGENCY = 'agency',
}

export interface IndustrySnapshot {
  id: string;
  name: string;
  slug: string;
  category: SnapshotCategory;
  description: string;
  icon: string;
  pipelineTemplate?: {
    name: string;
    stages: { name: string; probability: number }[];
  };
  calendarTemplate?: {
    name: string;
    durationMinutes: number;
  };
  formTemplate?: {
    name: string;
    fields: { name: string; label: string; type: string; required: boolean }[];
  };
  workflowTemplate?: {
    name: string;
    triggerType: string;
    actions: { type: string; parameters: Record<string, any> }[];
  };
  aiPersonaTemplate?: {
    name: string;
    systemPrompt: string;
    defaultTone: string;
  };
  installCount: number;
  createdAt: string;
}

export interface WebhookSubscription {
  id: string;
  agencyId: string;
  locationId: string;
  name: string;
  targetUrl: string;
  events: string[];
  secretKey: string;
  status: 'active' | 'paused';
  lastDeliveredAt?: string | null;
  createdAt: string;
}

export interface WebhookDeliveryLog {
  id: string;
  webhookId: string;
  event: string;
  payload: Record<string, any>;
  responseStatus: number;
  deliveredAt: string;
}

export interface EnterpriseSsoConfig {
  id: string;
  agencyId: string;
  locationId: string;
  provider: 'saml' | 'oidc' | 'google_workspace' | 'azure_ad';
  idpMetadataUrl?: string | null;
  clientId?: string | null;
  clientSecret?: string | null;
  enforceSso: boolean;
  allowedDomains: string[];
  updatedAt: string;
}






