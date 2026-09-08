import { memoryDb } from './repository';
import { AgencyRole, LocationRole, AuditAction } from '@prosumate/types';
import * as crypto from 'crypto';

export function hashPasswordSimple(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export function seedDemoData() {
  memoryDb.clear();

  // 1. Master Proprietary Administrator
  const primaryUser = memoryDb.createUser({
    email: 'Prosumateai@gmail.com',
    passwordHash: hashPasswordSimple('Prosumate@256'),
    firstName: 'Prosumate',
    lastName: 'Admin',
    isPlatformAdmin: true,
  });

  // Reference aliases for downstream CRM and pipeline records
  const platformAdmin = primaryUser;
  const agencyOwner = primaryUser;
  const austinAdmin = primaryUser;
  const salesRep = primaryUser;

  // 2. Demo Agency
  const agency = memoryDb.createAgency({
    name: 'Apex Growth Marketing',
    slug: 'apex-growth',
    billingTier: 'pro_tier',
    settings: {
      defaultCurrency: 'USD',
      brandingColor: '#6366f1',
    },
  });

  // 3. Demo Locations
  const locationAustin = memoryDb.createLocation({
    agencyId: agency.id,
    name: 'Apex Austin HQ',
    slug: 'apex-austin',
    timezone: 'America/Chicago',
    address: {
      street: '100 Congress Ave',
      city: 'Austin',
      state: 'TX',
      postalCode: '78701',
      country: 'US',
    },
  });

  const locationMiami = memoryDb.createLocation({
    agencyId: agency.id,
    name: 'Apex Miami Office',
    slug: 'apex-miami',
    timezone: 'America/New_York',
    address: {
      street: '1111 Lincoln Rd',
      city: 'Miami Beach',
      state: 'FL',
      postalCode: '33139',
      country: 'US',
    },
  });

  // Assign Primary User as Owner and Admin across agency and locations
  memoryDb.createAgencyMembership({
    userId: primaryUser.id,
    agencyId: agency.id,
    role: AgencyRole.OWNER,
  });

  memoryDb.createLocationMembership({
    userId: primaryUser.id,
    locationId: locationAustin.id,
    role: LocationRole.LOCATION_ADMIN,
  });

  memoryDb.createLocationMembership({
    userId: primaryUser.id,
    locationId: locationMiami.id,
    role: LocationRole.LOCATION_ADMIN,
  });

  // 7. Audit Events
  memoryDb.addAuditLog({
    agencyId: agency.id,
    actorId: platformAdmin.id,
    actorEmail: platformAdmin.email,
    action: AuditAction.AGENCY_CREATED,
    entityType: 'agency',
    entityId: agency.id,
    metadata: { name: agency.name, slug: agency.slug },
  });

  memoryDb.addAuditLog({
    agencyId: agency.id,
    locationId: locationAustin.id,
    actorId: agencyOwner.id,
    actorEmail: agencyOwner.email,
    action: AuditAction.LOCATION_CREATED,
    entityType: 'location',
    entityId: locationAustin.id,
    metadata: { name: locationAustin.name },
  });

  // 8. CRM Seed Data (Phase 2)
  // Companies
  const companyNexus = memoryDb.createCompany({
    agencyId: agency.id,
    locationId: locationAustin.id,
    name: 'Nexus Health Partners',
    domain: 'nexushealth.io',
    phone: '+1-512-555-4000',
    industry: 'Healthcare Technology',
    address: { city: 'Austin', state: 'TX' },
  });

  const companyVanguard = memoryDb.createCompany({
    agencyId: agency.id,
    locationId: locationMiami.id,
    name: 'Vanguard Fintech Group',
    domain: 'vanguardfin.com',
    phone: '+1-305-555-8800',
    industry: 'Financial Services',
    address: { city: 'Miami Beach', state: 'FL' },
  });

  // Contacts
  const contactDavid = memoryDb.createContact({
    agencyId: agency.id,
    locationId: locationAustin.id,
    companyId: companyNexus.id,
    firstName: 'David',
    lastName: 'Miller',
    email: 'david.miller@nexushealth.io',
    phone: '+1-512-555-4011',
    source: 'website',
    ownerId: salesRep.id,
    tags: ['Enterprise', 'Qualified', 'Inbound'],
    customFields: { annualRevenue: '$5M - $10M', employees: '45' },
    status: 'lead',
  });

  memoryDb.addContactNote({
    contactId: contactDavid.id,
    authorId: salesRep.id,
    authorEmail: salesRep.email,
    content: 'Completed 30-min discovery call. Budget approved for Q4 multi-location rollout.',
  });

  memoryDb.addContactTask({
    contactId: contactDavid.id,
    assignedUserId: salesRep.id,
    title: 'Send Master Services Agreement & Scope of Work',
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
  });

  const contactElena = memoryDb.createContact({
    agencyId: agency.id,
    locationId: locationAustin.id,
    firstName: 'Marcus',
    lastName: 'Brody',
    email: 'mbrody@acmecapital.com',
    phone: '+1-512-555-9033',
    source: 'google_ads',
    ownerId: austinAdmin.id,
    tags: ['Demo Requested', 'High Intent'],
    status: 'lead',
  });

  const contactMiami = memoryDb.createContact({
    agencyId: agency.id,
    locationId: locationMiami.id,
    companyId: companyVanguard.id,
    firstName: 'Elena',
    lastName: 'Rostova',
    email: 'elena@vanguardfin.com',
    phone: '+1-305-555-8822',
    source: 'referral',
    ownerId: agencyOwner.id,
    tags: ['Decision Maker', 'High Value'],
    status: 'customer',
  });

  // Standard Pipeline for Austin HQ
  const pipelineAustin = memoryDb.createPipeline({
    agencyId: agency.id,
    locationId: locationAustin.id,
    name: 'Standard Agency Pipeline',
    isDefault: true,
    stages: [
      { name: 'New Lead', color: '#6366f1' },
      { name: 'Contacted', color: '#8b5cf6' },
      { name: 'Discovery Call', color: '#06b6d4' },
      { name: 'Proposal Sent', color: '#f59e0b' },
      { name: 'Negotiation', color: '#ec4899' },
      { name: 'Closed Won', color: '#10b981' },
    ],
  });

  const stages = pipelineAustin.stages;
  const stageDiscovery = stages[2]!;
  const stageProposal = stages[3]!;
  const stageNegotiation = stages[4]!;

  // Opportunities
  memoryDb.createOpportunity({
    agencyId: agency.id,
    locationId: locationAustin.id,
    pipelineId: pipelineAustin.id,
    stageId: stageProposal.id,
    contactId: contactDavid.id,
    companyId: companyNexus.id,
    name: 'Nexus Enterprise Platform License',
    monetaryValue: 24000,
    status: 'open',
    ownerId: salesRep.id,
  });

  memoryDb.createOpportunity({
    agencyId: agency.id,
    locationId: locationAustin.id,
    pipelineId: pipelineAustin.id,
    stageId: stageDiscovery.id,
    contactId: contactElena.id,
    name: 'Acme Capital Marketing Assessment',
    monetaryValue: 6500,
    status: 'open',
    ownerId: austinAdmin.id,
  });

  // 9. Calendars & Appointments Seed Data (Phase 3)
  const discoveryCalendar = memoryDb.createCalendar({
    agencyId: agency.id,
    locationId: locationAustin.id,
    name: 'Discovery Call Calendar',
    slug: 'discovery-calls',
    description: 'Book a 30-minute discovery call with our sales team',
    defaultDurationMinutes: 30,
    timezone: 'America/Chicago',
    availability: [
      { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' }, // Monday
      { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' }, // Tuesday
      { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' }, // Wednesday
      { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' }, // Thursday
      { dayOfWeek: 5, startTime: '09:00', endTime: '12:00' }, // Friday (half day)
    ],
  });

  // Book a sample appointment for David Miller tomorrow at 10am
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  memoryDb.bookAppointment({
    calendarId: discoveryCalendar.id,
    agencyId: agency.id,
    locationId: locationAustin.id,
    contactId: contactDavid.id,
    assignedUserId: salesRep.id,
    title: 'Platform Demo — Nexus Health',
    startTime: `${tomorrowStr}T10:00:00`,
    endTime: `${tomorrowStr}T10:30:00`,
    notes: 'Show multi-location management and reporting dashboards',
    meetingLink: 'https://meet.prosumate.io/demo-nexus',
  });

  // 10. Forms & Lead Capture Seed Data (Phase 3)
  const leadForm = memoryDb.createForm({
    agencyId: agency.id,
    locationId: locationAustin.id,
    name: 'Website Lead Capture',
    slug: 'website-lead',
    fields: [
      { label: 'First Name', type: 'text', placeholder: 'Your first name', required: true },
      { label: 'Last Name', type: 'text', placeholder: 'Your last name', required: true },
      { label: 'Email', type: 'email', placeholder: 'you@company.com', required: true },
      { label: 'Phone', type: 'phone', placeholder: '+1-555-0100' },
      { label: 'How did you hear about us?', type: 'select', options: ['Google Search', 'LinkedIn', 'Referral', 'Conference', 'Other'] },
      { label: 'Message', type: 'textarea', placeholder: 'Tell us about your goals...' },
    ],
    submitAction: 'create_contact',
    thankYouMessage: 'Thanks for reaching out! Our team will be in touch within 24 hours.',
  });

  // Seed a form submission
  memoryDb.submitForm({
    formId: leadForm.id,
    locationId: locationAustin.id,
    submissionData: {
      firstName: 'Sarah',
      lastName: 'Connor',
      email: 'sarah.connor@cyberdyne.net',
      phone: '+1-512-555-7777',
      'How did you hear about us?': 'LinkedIn',
      Message: 'Interested in the platform for our 12-location franchise network.',
    },
    ipAddress: '203.0.113.42',
  });

  // 11. Conversations & Messages Seed Data (Phase 4)
  // Email Thread with David Miller
  const emailConv = memoryDb.getOrCreateConversation({
    agencyId: agency.id,
    locationId: locationAustin.id,
    contactId: contactDavid.id,
    channel: 'email',
    subject: 'Evaluating Prosumate for Nexus Health Locations',
  });

  memoryDb.sendMessage({
    conversationId: emailConv.id,
    senderType: 'contact',
    channel: 'email',
    direction: 'inbound',
    subject: 'Evaluating Prosumate for Nexus Health Locations',
    content: "Hi Apex team, we're reviewing our Q4 marketing software stack and want to evaluate Prosumate's multi-location capabilities for our clinics.",
    status: 'received',
  });

  memoryDb.sendMessage({
    conversationId: emailConv.id,
    senderId: salesRep.id,
    senderType: 'user',
    channel: 'email',
    direction: 'outbound',
    subject: 'Re: Evaluating Prosumate for Nexus Health Locations',
    content: "Hi David, thanks for reaching out! I've booked our discovery demo for tomorrow at 10 AM. Looking forward to walking you through our architecture and multi-tenant setup.",
    status: 'delivered',
  });

  // SMS Thread with David Miller
  const smsConv = memoryDb.getOrCreateConversation({
    agencyId: agency.id,
    locationId: locationAustin.id,
    contactId: contactDavid.id,
    channel: 'sms',
  });

  memoryDb.sendMessage({
    conversationId: smsConv.id,
    senderId: salesRep.id,
    senderType: 'user',
    channel: 'sms',
    direction: 'outbound',
    content: 'Reminder: Nexus Health demo is scheduled for tomorrow at 10:00 AM CST. Reply YES to confirm.',
    status: 'delivered',
  });

  memoryDb.sendMessage({
    conversationId: smsConv.id,
    senderType: 'contact',
    channel: 'sms',
    direction: 'inbound',
    content: 'YES, confirmed! Talk to you tomorrow.',
    status: 'received',
  });

  // 12. Automation & Workflows Seed Data (Phase 5)
  // Workflow 1: New Lead Capture Auto-Nurture
  const leadWorkflow = memoryDb.createWorkflow({
    agencyId: agency.id,
    locationId: locationAustin.id,
    name: 'Website Lead Capture Auto-Nurture',
    description: 'Instant SMS response, CRM tagging, and team task provisioning for inbound form leads',
    status: 'published',
    trigger: {
      type: 'FORM_SUBMITTED',
      config: { formId: leadForm.id },
    },
    steps: [
      {
        name: 'Instant SMS Confirmation',
        actionType: 'SEND_SMS',
        config: {
          content: 'Hi {{firstName}}, thanks for requesting information from Apex Growth! Our advisory team will reach out shortly.',
        },
        order: 0,
      },
      {
        name: 'Apply Nurture Tag',
        actionType: 'ADD_TAG',
        config: { tag: 'Nurture Sequence' },
        order: 1,
      },
      {
        name: 'Create Advisor Task',
        actionType: 'CREATE_TASK',
        config: { taskTitle: 'Follow up on inbound website lead' },
        order: 2,
      },
    ],
  });

  // Workflow 2: Deal Stage Movement Notification
  const dealWorkflow = memoryDb.createWorkflow({
    agencyId: agency.id,
    locationId: locationAustin.id,
    name: 'Proposal Generation & Notification',
    description: 'Auto-dispatches proposal notification email when deal moves to proposal stage',
    status: 'published',
    trigger: {
      type: 'OPPORTUNITY_STAGE_CHANGED',
      config: {},
    },
    steps: [
      {
        name: 'Send Proposal Email',
        actionType: 'SEND_EMAIL',
        config: {
          templateSubject: 'Your Apex Growth Proposal is Ready for Review',
          templateBody: 'Hi {{firstName}}, we have finalized your custom multi-location strategy proposal.',
        },
        order: 0,
      },
      {
        name: 'Tag Active Proposal',
        actionType: 'ADD_TAG',
        config: { tag: 'Proposal Sent' },
        order: 1,
      },
    ],
  });

  // 13. Stripe Billing, Subscriptions & Metering (Phase 6)
  const starterPlan = memoryDb.createSubscriptionPlan({
    id: 'plan_starter_growth',
    name: 'Starter Growth',
    tier: 'starter',
    description: 'Essential CRM, pipelines, and unified inbox for emerging single-location businesses',
    priceCents: 9700, // $97.00
    interval: 'month',
    currency: 'USD',
    features: [
      '1 Operating Location',
      'Up to 5 Team Members',
      'Unlimited CRM Contacts',
      'Sales Pipelines & Kanban',
      'Standard Calendar Booking',
      '$10/mo Included Communication Credits',
    ],
    includedCreditsCents: 1000,
  });

  const proPlan = memoryDb.createSubscriptionPlan({
    id: 'plan_professional_agency',
    name: 'Professional Agency',
    tier: 'professional',
    description: 'Full-featured marketing automation and multi-channel communication suite for growing agencies',
    priceCents: 29700, // $297.00
    interval: 'month',
    currency: 'USD',
    features: [
      'Up to 3 Operating Locations',
      'Unlimited Team Members',
      'Advanced Visual Workflows',
      'Two-Way Email & SMS Unified Inbox',
      'Custom Form Builder & Webhooks',
      '$50/mo Included Communication Credits',
      'Agency Rebilling Markups',
    ],
    includedCreditsCents: 5000,
    isPopular: true,
  });

  const enterprisePlan = memoryDb.createSubscriptionPlan({
    id: 'plan_enterprise_scale',
    name: 'Enterprise Scale',
    tier: 'enterprise',
    description: 'High-volume infrastructure with custom rebilling margins, dedicated SLA, and white-label capabilities',
    priceCents: 49700, // $497.00
    interval: 'month',
    currency: 'USD',
    features: [
      'Unlimited Operating Locations',
      'Unlimited Team Members & RBAC',
      'High-Throughput SMS & Email Tier',
      'Dedicated Webhook Pipelines',
      '$150/mo Included Communication Credits',
      'Priority 99.99% Uptime SLA',
      'Custom Integration Engineering',
    ],
    includedCreditsCents: 15000,
  });

  // Provision active subscription for Austin HQ
  const austinSub = memoryDb.subscribeLocation(locationAustin.id, proPlan.id);

  // Top up additional credit balance for operations
  memoryDb.topUpCreditWallet(locationAustin.id, 7500, 'Prepaid balance reload');

  // Record initial usage transactions
  memoryDb.recordUsage(locationAustin.id, {
    type: 'sms',
    units: 120,
    description: 'Lead capture confirmation SMS blast',
    rebillingMarginPercent: 20,
  });

  memoryDb.recordUsage(locationAustin.id, {
    type: 'email',
    units: 350,
    description: 'Weekly agency newsletter dispatch',
    rebillingMarginPercent: 20,
  });

  // 14. Landing Pages & Funnels (Phase 7)
  const growthFunnel = memoryDb.createFunnel({
    agencyId: agency.id,
    locationId: locationAustin.id,
    name: 'High-Ticket Client Acquisition Funnel',
    slug: 'high-ticket-growth',
    description: 'Two-step conversion funnel: Hero value proposition, features grid, integrated lead form, and thank-you confirmation',
    published: true,
    steps: [
      {
        name: 'VIP Opt-in & Strategy Consultation',
        slug: 'opt-in',
        type: 'opt_in',
        order: 0,
        nextStepSlug: 'thank-you',
        blocks: [
          {
            type: 'hero',
            title: 'Scale Your Business With Automated Multi-Tenant Architecture',
            subtitle: 'The all-in-one platform built for high-growth agencies, consultants, and enterprise operators.',
            settings: {
              badgeText: '2026 Enterprise Growth Strategy',
              buttonText: 'Request VIP Consultation',
              buttonVariant: 'primary',
            },
            order: 0,
          },
          {
            type: 'features',
            title: 'Enterprise Capabilities Out of the Box',
            subtitle: 'Everything you need to capture, nurture, and close deals at scale.',
            settings: {
              items: [
                {
                  title: 'Unified Communication Inbox',
                  description: 'Two-way Email, SMS, and client messaging unified into a single stream.',
                },
                {
                  title: 'Event-Driven Workflows',
                  description: 'Automate tasks, CRM tags, pipeline advancements, and instant SMS follow-ups.',
                },
                {
                  title: 'Usage Metering & Billing',
                  description: 'Automated prepaid wallets, credit auto-recharge, and agency markup margins.',
                },
              ],
            },
            order: 1,
          },
          {
            type: 'form_embed',
            title: 'Claim Your Custom Growth Blueprint',
            subtitle: 'Complete the form below to receive immediate access and schedule your advisor review.',
            settings: {
              formId: leadForm.id,
            },
            order: 2,
          },
        ],
      },
      {
        name: 'Strategy Session Confirmation',
        slug: 'thank-you',
        type: 'thank_you',
        order: 1,
        blocks: [
          {
            type: 'hero',
            title: "You're All Set! Your Strategy Blueprint is on Its Way",
            subtitle: 'Our executive advisory team has received your submission and will be in touch shortly.',
            settings: {
              badgeText: 'Application Confirmed',
              buttonText: 'Return to Homepage',
              buttonUrl: '/',
            },
            order: 0,
          },
        ],
      },
    ],
  });

  // 15. Reporting, Attribution & Reputation (Phase 8)
  memoryDb.addCampaignMetric(locationAustin.id, {
    agencyId: agency.id,
    channel: 'google_ads',
    campaignName: 'High-Intent Enterprise Search',
    adSpendCents: 245000,
    impressions: 42000,
    clicks: 1680,
    leadsGenerated: 142,
    dealsClosed: 18,
    revenueGeneratedCents: 1260000,
    startDate: new Date(Date.now() - 30 * 86400000).toISOString(),
    endDate: new Date().toISOString(),
  });

  memoryDb.addCampaignMetric(locationAustin.id, {
    agencyId: agency.id,
    channel: 'facebook_ads',
    campaignName: 'Retargeting Case Study VSL',
    adSpendCents: 120000,
    impressions: 86000,
    clicks: 2140,
    leadsGenerated: 98,
    dealsClosed: 11,
    revenueGeneratedCents: 620000,
    startDate: new Date(Date.now() - 30 * 86400000).toISOString(),
    endDate: new Date().toISOString(),
  });

  memoryDb.addCampaignMetric(locationAustin.id, {
    agencyId: agency.id,
    channel: 'organic_search',
    campaignName: 'High-Authority SEO Inbound',
    adSpendCents: 0,
    impressions: 28000,
    clicks: 1420,
    leadsGenerated: 84,
    dealsClosed: 14,
    revenueGeneratedCents: 980000,
    startDate: new Date(Date.now() - 30 * 86400000).toISOString(),
    endDate: new Date().toISOString(),
  });

  const review1 = memoryDb.submitPublicReview(locationAustin.id, {
    agencyId: agency.id,
    authorName: 'Sarah Jenkins',
    rating: 5,
    source: 'google',
    reviewText: 'Apex Austin completely transformed our pipeline operations. The unified inbox and automated lead workflows increased our booking velocity threefold!',
  });
  memoryDb.replyToReview(locationAustin.id, review1.id, 'Thank you Sarah! Our team is thrilled to be powering your client acquisition.');

  const review2 = memoryDb.submitPublicReview(locationAustin.id, {
    agencyId: agency.id,
    authorName: 'Michael Chang',
    rating: 5,
    source: 'facebook',
    reviewText: 'The multi-channel conversations and calendar booking engine eliminate all friction. Flawless experience.',
  });
  memoryDb.replyToReview(locationAustin.id, review2.id, 'Much appreciated Michael! We love having you on board.');

  memoryDb.submitPublicReview(locationAustin.id, {
    agencyId: agency.id,
    authorName: 'Jessica Alvarez',
    rating: 5,
    source: 'trustpilot',
    reviewText: 'Exceptional platform. Automated credit auto-recharges and instantaneous SMS responses keep our clients constantly delighted.',
  });

  // 16. AI Tools & Assistants (Phase 9)
  const aiConfig = memoryDb.getAiConfig(locationAustin.id);
  memoryDb.updateAiConfig(locationAustin.id, {
    name: 'Apex Autonomous Revenue Copilot',
    systemPrompt: 'You are an elite sales advisory AI for Apex Austin HQ. Your primary objective is helping enterprise firms automate lead follow-ups and schedule qualified discovery consultations.',
    defaultTone: 'persuasive',
    autoReplyEnabled: true,
    qualificationThreshold: 80,
  });

  memoryDb.executeAiTask(locationAustin.id, {
    task: 'generate_copy',
    prompt: 'Enterprise cold outreach for VP of Sales on speed-to-lead automation',
    channel: 'email',
    tone: 'persuasive',
  });

  memoryDb.executeAiTask(locationAustin.id, {
    task: 'qualify_lead',
    prompt: 'Lead states they manage 50 SDRs and lose 40% of inbound leads due to slow response times. Budget approved up to $50k/yr.',
  });

  // 17. Marketplace, Webhooks & Enterprise (Phase 10)
  const snapRealEstate = memoryDb.createSnapshot({
    name: 'High-Ticket Real Estate Lead & Appointment Engine',
    slug: 'real-estate-engine',
    category: 'real_estate',
    description: 'Complete operating system for luxury real estate brokerages with buyer/seller lead scoring, property showing scheduler, and automated SMS tour follow-up.',
    icon: 'Home',
    installCount: 142,
    pipelineTemplate: {
      name: 'Luxury Residential Sales Pipeline',
      stages: [
        { name: 'Inbound Property Inquiry', probability: 20 },
        { name: 'Showing Scheduled', probability: 40 },
        { name: 'Offer Submitted', probability: 70 },
        { name: 'In Escrow / Under Contract', probability: 90 },
        { name: 'Closed Deal', probability: 100 },
      ],
    },
    calendarTemplate: {
      name: 'VIP Property Showing Calendar',
      durationMinutes: 45,
    },
    formTemplate: {
      name: 'Buyer Qualification & Showing Request Form',
      fields: [
        { name: 'budgetRange', label: 'Price Range', type: 'select', required: true },
        { name: 'timeframe', label: 'Purchasing Horizon', type: 'select', required: true },
        { name: 'preApproved', label: 'Mortgage Pre-Approval Status', type: 'select', required: true },
      ],
    },
    workflowTemplate: {
      name: 'Speed-to-Lead Showing Confirmation',
      triggerType: 'form_submitted',
      actions: [
        { type: 'send_sms', parameters: { message: 'Hi {{contact.firstName}}, thanks for requesting a showing! What time today works best for you?' } },
        { type: 'add_task', parameters: { title: 'Review mortgage pre-approval documents' } },
      ],
    },
    aiPersonaTemplate: {
      name: 'Premier Real Estate Showing Bot',
      systemPrompt: 'You represent a premier luxury real estate brokerage. You coordinate property tours, answer neighborhood questions, and qualify high-net-worth buyers.',
      defaultTone: 'consultative',
    },
  });

  const snapDental = memoryDb.createSnapshot({
    name: 'Medical & Dental Patient Recall Engine',
    slug: 'dental-growth-engine',
    category: 'healthcare',
    description: 'Patient booking automation, automated 6-month cleaning recall sequences, cosmetic treatment upsells, and HIPAA-ready SMS reminders.',
    icon: 'Activity',
    installCount: 98,
    pipelineTemplate: {
      name: 'Cosmetic & Implant Patient Pipeline',
      stages: [
        { name: 'Intake Inquiry', probability: 15 },
        { name: 'Consultation Booked', probability: 50 },
        { name: 'Treatment Plan Presented', probability: 75 },
        { name: 'Treatment In Progress', probability: 90 },
        { name: 'Care Completed', probability: 100 },
      ],
    },
    calendarTemplate: {
      name: 'New Patient Consultation',
      durationMinutes: 30,
    },
  });

  const snapSaaS = memoryDb.createSnapshot({
    name: 'SaaS Trial-to-Enterprise Acceleration',
    slug: 'saas-enterprise-acceleration',
    category: 'saas',
    description: 'B2B product-led growth snapshot with automated trial activation emails, PQL Slack notifications, and executive demo booking.',
    icon: 'Zap',
    installCount: 215,
    pipelineTemplate: {
      name: 'Enterprise Software Sales Pipeline',
      stages: [
        { name: 'Product Qualified Lead (PQL)', probability: 25 },
        { name: 'Demo Conducted', probability: 50 },
        { name: 'Security & Compliance Review', probability: 75 },
        { name: 'Procurement & MSA', probability: 90 },
        { name: 'Closed Won', probability: 100 },
      ],
    },
  });

  // Seed Outbound Webhook
  const seedWebhook = memoryDb.createWebhook(locationAustin.id, {
    name: 'Zapier External CRM Sync',
    targetUrl: 'https://hooks.zapier.com/hooks/catch/123456/prosumate-sync',
    events: ['contact.created', 'appointment.booked', 'opportunity.won'],
  });

  // Seed Enterprise SSO Config
  const seedSso = memoryDb.updateSsoConfig(locationAustin.id, {
    provider: 'google_workspace',
    enforceSso: true,
    allowedDomains: ['apex.agency', 'apexaustin.com'],
  });

  return {
    platformAdmin,
    agency,
    locationAustin,
    locationMiami,
    agencyOwner,
    austinAdmin,
    salesRep,
    pipelineAustin,
    contactDavid,
    discoveryCalendar,
    leadForm,
    emailConv,
    smsConv,
    leadWorkflow,
    dealWorkflow,
    starterPlan,
    proPlan,
    enterprisePlan,
    austinSub,
    growthFunnel,
    aiConfig,
    snapRealEstate,
    snapDental,
    snapSaaS,
    seedWebhook,
    seedSso,
  };
}

