import { randomUUID, randomBytes, createHmac } from 'crypto';
import {
  User,
  Agency,
  Location,
  UserAgencyMembership,
  UserLocationMembership,
  AuditLog,
  UserStatus,
  AgencyStatus,
  LocationStatus,
  AgencyRole,
  LocationRole,
  Permission,
} from '@prosumate/types';

export interface UserRecord extends User {
  passwordHash: string;
}

export interface SessionRecord {
  id: string;
  userId: string;
  refreshTokenHash: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
  revokedAt?: Date;
  createdAt: Date;
}

export class MemoryDatabase {
  users: Map<string, UserRecord> = new Map();
  agencies: Map<string, Agency> = new Map();
  locations: Map<string, Location> = new Map();
  userAgencyMemberships: Map<string, UserAgencyMembership> = new Map();
  userLocationMemberships: Map<string, UserLocationMembership> = new Map();
  sessions: Map<string, SessionRecord> = new Map();
  auditLogs: AuditLog[] = [];

  clear() {
    this.users.clear();
    this.agencies.clear();
    this.locations.clear();
    this.userAgencyMemberships.clear();
    this.userLocationMemberships.clear();
    this.sessions.clear();
    this.auditLogs = [];
    this.companies.clear();
    this.contacts.clear();
    this.contactNotes.clear();
    this.contactTasks.clear();
    this.activityEvents.clear();
    this.pipelines.clear();
    this.opportunities.clear();
    this.opportunityMovements = [];
    this.calendars.clear();
    this.appointments.clear();
    this.forms.clear();
    this.formSubmissions.clear();
    this.conversations.clear();
    this.messages.clear();
    this.workflows.clear();
    this.workflowExecutions.clear();
    this.workflowFolders.clear();
    this.workflowEventDepth = 0;
    this.subscriptionPlans.clear();
    this.locationSubscriptions.clear();
    this.creditWallets.clear();
    this.usageTransactions.clear();
    this.invoices.clear();
    this.funnels.clear();
    this.campaignMetrics.clear();
    this.customerReviews.clear();
    this.reviewRequests.clear();
    this.aiConfigs.clear();
    this.aiGenerations.clear();
    this.snapshots.clear();
    this.webhooks.clear();
    this.webhookLogs.clear();
    this.ssoConfigs.clear();
  }

  // --- Users ---
  createUser(data: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    phone?: string;
    isPlatformAdmin?: boolean;
    status?: UserStatus;
  }): UserRecord {
    const existing = Array.from(this.users.values()).find(
      (u) => u.email.toLowerCase() === data.email.toLowerCase()
    );
    if (existing) {
      throw new Error(`User with email '${data.email}' already exists`);
    }

    const now = new Date().toISOString();
    const user: UserRecord = {
      id: randomUUID(),
      email: data.email.toLowerCase(),
      passwordHash: data.passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone || null,
      isPlatformAdmin: data.isPlatformAdmin ?? false,
      status: data.status ?? UserStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(user.id, user);
    return user;
  }

  findUserByEmail(email: string): UserRecord | undefined {
    return Array.from(this.users.values()).find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
  }

  findUserById(id: string): UserRecord | undefined {
    return this.users.get(id);
  }

  // --- Agencies ---
  createAgency(data: {
    name: string;
    slug?: string;
    status?: AgencyStatus;
    billingTier?: string;
    settings?: Record<string, unknown>;
  }): Agency {
    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const existing = Array.from(this.agencies.values()).find((a) => a.slug === slug);
    if (existing) {
      throw new Error(`Agency slug '${slug}' already exists`);
    }

    const now = new Date().toISOString();
    const agency: Agency = {
      id: randomUUID(),
      name: data.name,
      slug,
      status: data.status ?? AgencyStatus.ACTIVE,
      billingTier: data.billingTier || 'starter',
      settings: data.settings || {},
      createdAt: now,
      updatedAt: now,
    };
    this.agencies.set(agency.id, agency);
    return agency;
  }

  findAgencyById(id: string): Agency | undefined {
    return this.agencies.get(id);
  }

  listAgencies(): Agency[] {
    return Array.from(this.agencies.values());
  }

  // --- Locations ---
  createLocation(data: {
    agencyId: string;
    name: string;
    slug?: string;
    timezone?: string;
    address?: Location['address'];
    status?: LocationStatus;
  }): Location {
    const agency = this.agencies.get(data.agencyId);
    if (!agency) {
      throw new Error(`Agency with id '${data.agencyId}' not found`);
    }

    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const now = new Date().toISOString();
    const location: Location = {
      id: randomUUID(),
      agencyId: data.agencyId,
      name: data.name,
      slug,
      timezone: data.timezone || 'UTC',
      address: data.address || null,
      status: data.status ?? LocationStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
    };
    this.locations.set(location.id, location);
    return location;
  }

  findLocationById(id: string): Location | undefined {
    return this.locations.get(id);
  }

  listLocationsByAgency(agencyId: string): Location[] {
    return Array.from(this.locations.values()).filter((l) => l.agencyId === agencyId);
  }

  // --- Memberships ---
  createAgencyMembership(data: {
    userId: string;
    agencyId: string;
    role: AgencyRole;
  }): UserAgencyMembership {
    const membership: UserAgencyMembership = {
      id: randomUUID(),
      userId: data.userId,
      agencyId: data.agencyId,
      role: data.role,
      createdAt: new Date().toISOString(),
    };
    this.userAgencyMemberships.set(`${data.userId}:${data.agencyId}`, membership);
    return membership;
  }

  getAgencyMembership(userId: string, agencyId: string): UserAgencyMembership | undefined {
    return this.userAgencyMemberships.get(`${userId}:${agencyId}`);
  }

  getUserAgencyMemberships(userId: string): UserAgencyMembership[] {
    return Array.from(this.userAgencyMemberships.values()).filter((m) => m.userId === userId);
  }

  createLocationMembership(data: {
    userId: string;
    locationId: string;
    role: LocationRole;
    permissionsOverride?: Permission[];
  }): UserLocationMembership {
    const membership: UserLocationMembership = {
      id: randomUUID(),
      userId: data.userId,
      locationId: data.locationId,
      role: data.role,
      permissionsOverride: data.permissionsOverride || [],
      createdAt: new Date().toISOString(),
    };
    this.userLocationMemberships.set(`${data.userId}:${data.locationId}`, membership);
    return membership;
  }

  getLocationMembership(userId: string, locationId: string): UserLocationMembership | undefined {
    return this.userLocationMemberships.get(`${userId}:${locationId}`);
  }

  getUserLocationMemberships(userId: string): UserLocationMembership[] {
    return Array.from(this.userLocationMemberships.values()).filter((m) => m.userId === userId);
  }

  getLocationMembers(locationId: string): Array<{ user: User; membership: UserLocationMembership }> {
    const memberships = Array.from(this.userLocationMemberships.values()).filter(
      (m) => m.locationId === locationId
    );
    return memberships
      .map((m) => {
        const u = this.users.get(m.userId);
        if (!u) return null;
        const { passwordHash, ...safeUser } = u;
        return { user: safeUser, membership: m };
      })
      .filter((item): item is { user: User; membership: UserLocationMembership } => item !== null);
  }

  // --- Sessions ---
  createSession(data: {
    userId: string;
    refreshTokenHash: string;
    ipAddress?: string;
    userAgent?: string;
    expiresAt: Date;
  }): SessionRecord {
    const session: SessionRecord = {
      id: randomUUID(),
      userId: data.userId,
      refreshTokenHash: data.refreshTokenHash,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      expiresAt: data.expiresAt,
      createdAt: new Date(),
    };
    this.sessions.set(session.id, session);
    return session;
  }

  findSessionByTokenHash(refreshTokenHash: string): SessionRecord | undefined {
    return Array.from(this.sessions.values()).find(
      (s) => s.refreshTokenHash === refreshTokenHash && !s.revokedAt && s.expiresAt > new Date()
    );
  }

  revokeSession(id: string): void {
    const session = this.sessions.get(id);
    if (session) {
      session.revokedAt = new Date();
    }
  }

  revokeAllUserSessions(userId: string): void {
    for (const session of this.sessions.values()) {
      if (session.userId === userId) {
        session.revokedAt = new Date();
      }
    }
  }

  // --- Audit Logs ---
  addAuditLog(data: Omit<AuditLog, 'id' | 'createdAt'>): AuditLog {
    const log: AuditLog = {
      id: randomUUID(),
      agencyId: data.agencyId || null,
      locationId: data.locationId || null,
      actorId: data.actorId || null,
      actorEmail: data.actorEmail || null,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      metadata: data.metadata || {},
      ipAddress: data.ipAddress || null,
      createdAt: new Date().toISOString(),
    };
    this.auditLogs.unshift(log);
    return log;
  }

  getAuditLogs(filter?: { agencyId?: string; locationId?: string; actorId?: string }): AuditLog[] {
    return this.auditLogs.filter((l) => {
      if (filter?.agencyId && l.agencyId !== filter.agencyId) return false;
      if (filter?.locationId && l.locationId !== filter.locationId) return false;
      if (filter?.actorId && l.actorId !== filter.actorId) return false;
      return true;
    });
  }

  // ==========================================
  // CRM Collections & Methods (Phase 2)
  // ==========================================
  companies: Map<string, any> = new Map();
  contacts: Map<string, any> = new Map();
  contactNotes: Map<string, any[]> = new Map(); // contactId -> notes
  contactTasks: Map<string, any[]> = new Map(); // contactId -> tasks
  activityEvents: Map<string, any[]> = new Map(); // contactId -> activity events
  pipelines: Map<string, any> = new Map();
  opportunities: Map<string, any> = new Map();
  opportunityMovements: any[] = [];

  // Companies
  createCompany(data: {
    agencyId: string;
    locationId: string;
    name: string;
    domain?: string | null;
    phone?: string | null;
    industry?: string | null;
    address?: Record<string, unknown>;
  }) {
    const now = new Date().toISOString();
    const company = {
      id: randomUUID(),
      agencyId: data.agencyId,
      locationId: data.locationId,
      name: data.name,
      domain: data.domain || null,
      phone: data.phone || null,
      industry: data.industry || null,
      address: data.address || {},
      createdAt: now,
      updatedAt: now,
    };
    this.companies.set(company.id, company);
    return company;
  }

  findCompanyById(id: string) {
    return this.companies.get(id);
  }

  listCompaniesByLocation(locationId: string) {
    return Array.from(this.companies.values()).filter((c) => c.locationId === locationId);
  }

  // Contacts
  createContact(data: {
    agencyId: string;
    locationId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
    companyId?: string | null;
    source?: string | null;
    ownerId?: string | null;
    tags?: string[];
    customFields?: Record<string, unknown>;
    status?: any;
  }) {
    // Duplicate detection within location
    const existing = Array.from(this.contacts.values()).find(
      (c) =>
        c.locationId === data.locationId &&
        !c.deletedAt &&
        (c.email.toLowerCase() === data.email.toLowerCase() ||
          (data.phone && c.phone && c.phone === data.phone))
    );

    if (existing) {
      throw new Error(`Duplicate contact: Contact with email '${data.email}' already exists in this location.`);
    }

    const now = new Date().toISOString();
    const contact = {
      id: randomUUID(),
      agencyId: data.agencyId,
      locationId: data.locationId,
      companyId: data.companyId || null,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email.toLowerCase(),
      phone: data.phone || null,
      source: data.source || 'direct',
      ownerId: data.ownerId || null,
      tags: data.tags || [],
      customFields: data.customFields || {},
      status: data.status || 'lead',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    this.contacts.set(contact.id, contact);

    // Initial activity log
    this.addActivityEvent({
      contactId: contact.id,
      type: 'CONTACT_CREATED',
      title: 'Contact Created',
      description: `Contact ${contact.firstName} ${contact.lastName} was registered via ${contact.source}`,
    });

    this.triggerEvent(contact.locationId, 'CONTACT_CREATED', {
      contactId: contact.id,
      source: contact.source,
    });
    for (const tag of contact.tags) {
      this.triggerEvent(contact.locationId, 'TAG_ADDED', {
        contactId: contact.id,
        tag,
      });
    }

    return contact;
  }

  findContactById(id: string) {
    const contact = this.contacts.get(id);
    if (!contact || contact.deletedAt) return undefined;
    return contact;
  }

  listContactsByLocation(locationId: string, filter?: { status?: string; tag?: string; search?: string }) {
    return Array.from(this.contacts.values()).filter((c) => {
      if (c.locationId !== locationId) return false;
      if (c.deletedAt) return false;
      if (filter?.status && c.status !== filter.status) return false;
      if (filter?.tag && !c.tags.includes(filter.tag)) return false;
      if (filter?.search) {
        const term = filter.search.toLowerCase();
        const matchesName = `${c.firstName} ${c.lastName}`.toLowerCase().includes(term);
        const matchesEmail = c.email.toLowerCase().includes(term);
        const matchesPhone = c.phone?.toLowerCase().includes(term);
        if (!matchesName && !matchesEmail && !matchesPhone) return false;
      }
      return true;
    });
  }

  updateContact(id: string, updates: Partial<any>) {
    const contact = this.contacts.get(id);
    if (!contact || contact.deletedAt) {
      throw new Error(`Contact '${id}' not found`);
    }

    const previousTags = new Set<string>(contact.tags || []);
    Object.assign(contact, updates);
    contact.updatedAt = new Date().toISOString();

    this.addActivityEvent({
      contactId: id,
      type: 'CONTACT_UPDATED',
      title: 'Contact Updated',
      description: 'Profile details were modified',
      metadata: updates,
    });

    for (const tag of contact.tags || []) {
      if (!previousTags.has(tag)) {
        this.triggerEvent(contact.locationId, 'TAG_ADDED', {
          contactId: contact.id,
          tag,
        });
      }
    }

    return contact;
  }

  deleteContact(id: string) {
    const contact = this.contacts.get(id);
    if (contact) {
      contact.deletedAt = new Date().toISOString();
    }
  }

  // Notes & Tasks & Activities
  addContactNote(data: { contactId: string; authorId: string; authorEmail: string; content: string }) {
    const note = {
      id: randomUUID(),
      contactId: data.contactId,
      authorId: data.authorId,
      authorEmail: data.authorEmail,
      content: data.content,
      createdAt: new Date().toISOString(),
    };

    const notes = this.contactNotes.get(data.contactId) || [];
    notes.unshift(note);
    this.contactNotes.set(data.contactId, notes);

    this.addActivityEvent({
      contactId: data.contactId,
      actorId: data.authorId,
      actorEmail: data.authorEmail,
      type: 'NOTE_ADDED',
      title: 'Note Added',
      description: data.content.slice(0, 100),
    });

    return note;
  }

  getContactNotes(contactId: string) {
    return this.contactNotes.get(contactId) || [];
  }

  addContactTask(data: {
    contactId: string;
    title: string;
    description?: string;
    assignedUserId?: string | null;
    dueDate?: string | null;
  }) {
    const task = {
      id: randomUUID(),
      contactId: data.contactId,
      assignedUserId: data.assignedUserId || null,
      title: data.title,
      description: data.description || null,
      dueDate: data.dueDate || null,
      status: 'pending',
      createdAt: new Date().toISOString(),
      completedAt: null,
    };

    const tasks = this.contactTasks.get(data.contactId) || [];
    tasks.unshift(task);
    this.contactTasks.set(data.contactId, tasks);

    this.addActivityEvent({
      contactId: data.contactId,
      type: 'TASK_CREATED',
      title: 'Task Created',
      description: task.title,
    });

    return task;
  }

  getContactTasks(contactId: string) {
    return this.contactTasks.get(contactId) || [];
  }

  addActivityEvent(data: {
    contactId: string;
    type: string;
    title: string;
    description?: string;
    actorId?: string | null;
    actorEmail?: string | null;
    metadata?: Record<string, unknown>;
  }) {
    const event = {
      id: randomUUID(),
      contactId: data.contactId,
      type: data.type,
      title: data.title,
      description: data.description || null,
      actorId: data.actorId || null,
      actorEmail: data.actorEmail || null,
      metadata: data.metadata || {},
      createdAt: new Date().toISOString(),
    };

    const events = this.activityEvents.get(data.contactId) || [];
    events.unshift(event);
    this.activityEvents.set(data.contactId, events);
    return event;
  }

  getContactActivityTimeline(contactId: string) {
    return this.activityEvents.get(contactId) || [];
  }

  // Pipelines & Opportunities
  createPipeline(data: {
    agencyId: string;
    locationId: string;
    name: string;
    stages: Array<{ name: string; color?: string }>;
    isDefault?: boolean;
  }) {
    const pipelineId = randomUUID();
    const stages = data.stages.map((s, idx) => ({
      id: randomUUID(),
      pipelineId,
      name: s.name,
      order: idx,
      color: s.color || '#6366f1',
    }));

    const pipeline = {
      id: pipelineId,
      agencyId: data.agencyId,
      locationId: data.locationId,
      name: data.name,
      stages,
      isDefault: data.isDefault ?? false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.pipelines.set(pipeline.id, pipeline);
    return pipeline;
  }

  findPipelineById(id: string) {
    return this.pipelines.get(id);
  }

  listPipelinesByLocation(locationId: string) {
    return Array.from(this.pipelines.values()).filter((p) => p.locationId === locationId);
  }

  createOpportunity(data: {
    agencyId: string;
    locationId: string;
    pipelineId: string;
    stageId: string;
    contactId: string;
    companyId?: string | null;
    name: string;
    monetaryValue: number;
    currency?: string;
    status?: string;
    ownerId?: string | null;
    expectedCloseDate?: string | null;
  }) {
    const opportunity = {
      id: randomUUID(),
      agencyId: data.agencyId,
      locationId: data.locationId,
      pipelineId: data.pipelineId,
      stageId: data.stageId,
      contactId: data.contactId,
      companyId: data.companyId || null,
      name: data.name,
      monetaryValue: data.monetaryValue || 0,
      currency: data.currency || 'USD',
      status: data.status || 'open',
      ownerId: data.ownerId || null,
      expectedCloseDate: data.expectedCloseDate || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.opportunities.set(opportunity.id, opportunity);

    // Initial movement log
    this.opportunityMovements.push({
      id: randomUUID(),
      opportunityId: opportunity.id,
      fromStageId: null,
      toStageId: opportunity.stageId,
      actorId: data.ownerId || null,
      createdAt: new Date().toISOString(),
    });

    // Contact timeline activity
    this.addActivityEvent({
      contactId: data.contactId,
      type: 'OPPORTUNITY_CREATED',
      title: 'Opportunity Created',
      description: `${opportunity.name} (${opportunity.currency} $${opportunity.monetaryValue.toLocaleString()})`,
    });

    return opportunity;
  }

  findOpportunityById(id: string) {
    return this.opportunities.get(id);
  }

  moveOpportunityStage(opportunityId: string, newStageId: string, actorId?: string, newStatus?: string) {
    const opp = this.opportunities.get(opportunityId);
    if (!opp) {
      throw new Error(`Opportunity '${opportunityId}' not found`);
    }

    const prevStageId = opp.stageId;
    opp.stageId = newStageId;
    if (newStatus) opp.status = newStatus;
    opp.updatedAt = new Date().toISOString();

    const movement = {
      id: randomUUID(),
      opportunityId,
      fromStageId: prevStageId,
      toStageId: newStageId,
      actorId: actorId || null,
      createdAt: new Date().toISOString(),
    };
    this.opportunityMovements.push(movement);

    this.addActivityEvent({
      contactId: opp.contactId,
      type: 'STAGE_MOVED',
      title: 'Deal Stage Advanced',
      description: `Opportunity stage moved`,
      metadata: { fromStageId: prevStageId, toStageId: newStageId },
    });

    this.triggerEvent(opp.locationId, 'OPPORTUNITY_STAGE_CHANGED', {
      contactId: opp.contactId,
      opportunityId: opp.id,
      stageId: newStageId,
      stageName: this.findPipelineById(opp.pipelineId)?.stages?.find(
        (stage: any) => stage.id === newStageId
      )?.name,
      fromStageId: prevStageId,
    });

    return opp;
  }

  listOpportunitiesByPipeline(pipelineId: string) {
    return Array.from(this.opportunities.values()).filter((o) => o.pipelineId === pipelineId);
  }

  // ==========================================
  // Calendars & Appointments (Phase 3)
  // ==========================================
  calendars: Map<string, any> = new Map();
  appointments: Map<string, any> = new Map();
  forms: Map<string, any> = new Map();
  formSubmissions: Map<string, any[]> = new Map(); // formId -> submissions[]

  createCalendar(data: {
    agencyId: string;
    locationId: string;
    name: string;
    slug: string;
    description?: string | null;
    defaultDurationMinutes?: number;
    timezone?: string;
    availability: Array<{ dayOfWeek: number; startTime: string; endTime: string }>;
  }) {
    // Check slug uniqueness within location
    const existing = Array.from(this.calendars.values()).find(
      (c) => c.locationId === data.locationId && c.slug === data.slug
    );
    if (existing) {
      throw new Error(`Calendar slug '${data.slug}' already exists in this location`);
    }

    const now = new Date().toISOString();
    const calendar = {
      id: randomUUID(),
      agencyId: data.agencyId,
      locationId: data.locationId,
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      defaultDurationMinutes: data.defaultDurationMinutes || 30,
      timezone: data.timezone || 'America/Chicago',
      availability: data.availability,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    this.calendars.set(calendar.id, calendar);
    return calendar;
  }

  findCalendarById(id: string) {
    return this.calendars.get(id);
  }

  findCalendarBySlug(slug: string) {
    return Array.from(this.calendars.values()).find((c) => c.slug === slug && c.isActive);
  }

  listCalendarsByLocation(locationId: string) {
    return Array.from(this.calendars.values()).filter((c) => c.locationId === locationId);
  }

  getAvailableSlots(calendarId: string, dateStr: string): Array<{ startTime: string; endTime: string }> {
    const calendar = this.calendars.get(calendarId);
    if (!calendar) return [];

    const date = new Date(dateStr + 'T00:00:00');
    const dayOfWeek = date.getDay();
    const rules = calendar.availability.filter((r: any) => r.dayOfWeek === dayOfWeek);
    if (rules.length === 0) return [];

    const duration = calendar.defaultDurationMinutes;
    const slots: Array<{ startTime: string; endTime: string }> = [];

    // Get existing appointments for this calendar on this date
    const existingAppts = Array.from(this.appointments.values()).filter((a) => {
      if (a.calendarId !== calendarId || a.status === 'cancelled') return false;
      const apptDate = a.startTime.split('T')[0];
      return apptDate === dateStr;
    });

    for (const rule of rules) {
      const [startH, startM] = rule.startTime.split(':').map(Number);
      const [endH, endM] = rule.endTime.split(':').map(Number);
      const windowStartMin = startH * 60 + startM;
      const windowEndMin = endH * 60 + endM;

      for (let min = windowStartMin; min + duration <= windowEndMin; min += duration) {
        const slotStartH = Math.floor(min / 60).toString().padStart(2, '0');
        const slotStartM = (min % 60).toString().padStart(2, '0');
        const slotEndMin = min + duration;
        const slotEndH = Math.floor(slotEndMin / 60).toString().padStart(2, '0');
        const slotEndM = (slotEndMin % 60).toString().padStart(2, '0');

        const slotStart = `${dateStr}T${slotStartH}:${slotStartM}:00`;
        const slotEnd = `${dateStr}T${slotEndH}:${slotEndM}:00`;

        // Check conflict using Date comparison for format-safe comparison
        const slotStartMs = new Date(slotStart).getTime();
        const slotEndMs = new Date(slotEnd).getTime();
        const hasConflict = existingAppts.some((a) => {
          const aStartMs = new Date(a.startTime).getTime();
          const aEndMs = new Date(a.endTime).getTime();
          return aStartMs < slotEndMs && aEndMs > slotStartMs;
        });

        if (!hasConflict) {
          slots.push({ startTime: slotStart, endTime: slotEnd });
        }
      }
    }
    return slots;
  }

  bookAppointment(data: {
    calendarId: string;
    agencyId: string;
    locationId: string;
    contactId: string;
    assignedUserId?: string | null;
    title: string;
    startTime: string;
    endTime: string;
    notes?: string | null;
    meetingLink?: string | null;
  }) {
    // Check for double-booking
    const existingAppts = Array.from(this.appointments.values()).filter(
      (a) => a.calendarId === data.calendarId && a.status !== 'cancelled'
    );
    const conflict = existingAppts.find(
      (a) => a.startTime < data.endTime && a.endTime > data.startTime
    );
    if (conflict) {
      throw new Error('Time slot conflict: This slot is already booked');
    }

    const now = new Date().toISOString();
    const appointment = {
      id: randomUUID(),
      calendarId: data.calendarId,
      agencyId: data.agencyId,
      locationId: data.locationId,
      contactId: data.contactId,
      assignedUserId: data.assignedUserId || null,
      title: data.title,
      startTime: data.startTime,
      endTime: data.endTime,
      status: 'scheduled',
      notes: data.notes || null,
      meetingLink: data.meetingLink || null,
      createdAt: now,
      updatedAt: now,
    };
    this.appointments.set(appointment.id, appointment);

    // Activity timeline event
    this.addActivityEvent({
      contactId: data.contactId,
      type: 'APPOINTMENT_BOOKED',
      title: 'Appointment Booked',
      description: `${data.title} scheduled for ${new Date(data.startTime).toLocaleString()}`,
    });

    this.triggerEvent(data.locationId, 'APPOINTMENT_BOOKED', {
      contactId: data.contactId,
      appointmentId: appointment.id,
      calendarId: appointment.calendarId,
      startTime: appointment.startTime,
    });

    return appointment;
  }

  findAppointmentById(id: string) {
    return this.appointments.get(id);
  }

  listAppointmentsByCalendar(calendarId: string) {
    return Array.from(this.appointments.values())
      .filter((a) => a.calendarId === calendarId)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }

  listAppointmentsByLocation(locationId: string) {
    return Array.from(this.appointments.values())
      .filter((a) => a.locationId === locationId)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }

  updateAppointmentStatus(id: string, status: string, notes?: string) {
    const appt = this.appointments.get(id);
    if (!appt) throw new Error(`Appointment '${id}' not found`);
    appt.status = status;
    if (notes !== undefined) appt.notes = notes;
    appt.updatedAt = new Date().toISOString();
    return appt;
  }

  // ==========================================
  // Forms & Lead Capture (Phase 3)
  // ==========================================

  createForm(data: {
    agencyId: string;
    locationId: string;
    name: string;
    slug: string;
    fields: Array<{ label: string; type: string; placeholder?: string; required?: boolean; options?: string[] }>;
    submitAction?: string;
    thankYouMessage?: string;
    redirectUrl?: string | null;
  }) {
    const existing = Array.from(this.forms.values()).find(
      (f) => f.slug === data.slug
    );
    if (existing) {
      throw new Error(`Form slug '${data.slug}' already exists`);
    }

    const now = new Date().toISOString();
    const form = {
      id: randomUUID(),
      agencyId: data.agencyId,
      locationId: data.locationId,
      name: data.name,
      slug: data.slug,
      fields: data.fields.map((f, idx) => ({
        id: randomUUID(),
        label: f.label,
        type: f.type,
        placeholder: f.placeholder || '',
        required: f.required ?? false,
        options: f.options || [],
        order: idx,
      })),
      submitAction: data.submitAction || 'create_contact',
      thankYouMessage: data.thankYouMessage || 'Thank you for your submission!',
      redirectUrl: data.redirectUrl || null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    this.forms.set(form.id, form);
    return form;
  }

  findFormById(id: string) {
    return this.forms.get(id);
  }

  findFormBySlug(slug: string) {
    return Array.from(this.forms.values()).find((f) => f.slug === slug && f.isActive);
  }

  listFormsByLocation(locationId: string) {
    return Array.from(this.forms.values()).filter((f) => f.locationId === locationId);
  }

  submitForm(data: {
    formId: string;
    locationId: string;
    submissionData: Record<string, unknown>;
    ipAddress?: string;
  }) {
    const form = this.forms.get(data.formId);
    if (!form) throw new Error(`Form '${data.formId}' not found`);

    // Auto-create or match contact from submission data
    let contactId: string | null = null;
    const findField = (keys: string[]) => {
      for (const [k, v] of Object.entries(data.submissionData)) {
        if (keys.includes(k.toLowerCase().replace(/[^a-z]/g, ''))) {
          return v as string;
        }
      }
      return undefined;
    };

    const email = (data.submissionData.email || findField(['email', 'emailaddress'])) as string | undefined;
    const firstName = (data.submissionData.firstName || data.submissionData.first_name || findField(['firstname', 'first']) || '') as string;
    const lastName = (data.submissionData.lastName || data.submissionData.last_name || findField(['lastname', 'last']) || '') as string;
    const phone = (data.submissionData.phone || findField(['phone', 'phonenumber', 'mobile']) || '') as string;

    if (email) {
      // Try to find existing contact by email in this location
      const existingContact = Array.from(this.contacts.values()).find(
        (c) => c.locationId === form.locationId && !c.deletedAt && c.email.toLowerCase() === email.toLowerCase()
      );

      if (existingContact) {
        contactId = existingContact.id;
      } else if (firstName || lastName) {
        // Auto-create new contact
        try {
          const newContact = this.createContact({
            agencyId: form.agencyId,
            locationId: form.locationId,
            firstName: firstName || 'Unknown',
            lastName: lastName || 'Visitor',
            email,
            phone: phone || undefined,
            source: `form:${form.slug}`,
            tags: ['Form Submission'],
          });
          contactId = newContact.id;
        } catch {
          // Duplicate or validation error — link to null
        }
      }
    }

    const submission = {
      id: randomUUID(),
      formId: data.formId,
      locationId: data.locationId,
      contactId,
      submissionData: data.submissionData,
      ipAddress: data.ipAddress || null,
      createdAt: new Date().toISOString(),
    };

    const subs = this.formSubmissions.get(data.formId) || [];
    subs.unshift(submission);
    this.formSubmissions.set(data.formId, subs);

    // Activity timeline event if linked to contact
    if (contactId) {
      this.addActivityEvent({
        contactId,
        type: 'FORM_SUBMITTED',
        title: 'Form Submitted',
        description: `Submitted "${form.name}" form`,
        metadata: { formId: form.id, formSlug: form.slug },
      });

      this.triggerEvent(form.locationId, 'FORM_SUBMITTED', {
        contactId,
        formId: form.id,
        formSlug: form.slug,
        submissionData: data.submissionData,
      });
    }

    return { submission, contactId, thankYouMessage: form.thankYouMessage };
  }

  getFormSubmissions(formId: string) {
    return this.formSubmissions.get(formId) || [];
  }

  getFormSubmissionCount(formId: string) {
    return (this.formSubmissions.get(formId) || []).length;
  }

  // ==========================================
  // Conversations & Messages (Phase 4)
  // ==========================================
  conversations: Map<string, any> = new Map();
  messages: Map<string, any[]> = new Map(); // conversationId -> Message[]

  getOrCreateConversation(data: {
    agencyId: string;
    locationId: string;
    contactId: string;
    channel: string;
    subject?: string | null;
  }) {
    const existing = Array.from(this.conversations.values()).find(
      (c) =>
        c.locationId === data.locationId &&
        c.contactId === data.contactId &&
        c.channel === data.channel
    );

    if (existing) {
      if (data.subject && !existing.subject) {
        existing.subject = data.subject;
      }
      return existing;
    }

    const now = new Date().toISOString();
    const conversation = {
      id: randomUUID(),
      agencyId: data.agencyId,
      locationId: data.locationId,
      contactId: data.contactId,
      channel: data.channel,
      subject: data.subject || null,
      lastMessageSnippet: '',
      lastMessageAt: now,
      unreadCount: 0,
      assignedUserId: null,
      createdAt: now,
      updatedAt: now,
    };
    this.conversations.set(conversation.id, conversation);
    return conversation;
  }

  findConversationById(id: string) {
    const conv = this.conversations.get(id);
    if (!conv) return null;
    const contact = this.findContactById(conv.contactId);
    return {
      ...conv,
      contact: contact
        ? {
            id: contact.id,
            firstName: contact.firstName,
            lastName: contact.lastName,
            email: contact.email,
            phone: contact.phone,
          }
        : null,
    };
  }

  listConversations(
    locationId: string,
    filters?: { channel?: string; search?: string }
  ) {
    let list = Array.from(this.conversations.values()).filter(
      (c) => c.locationId === locationId
    );

    if (filters?.channel && filters.channel !== 'all') {
      list = list.filter((c) => c.channel === filters.channel);
    }

    const enriched = list.map((conv) => {
      const contact = this.findContactById(conv.contactId);
      return {
        ...conv,
        contact: contact
          ? {
              id: contact.id,
              firstName: contact.firstName,
              lastName: contact.lastName,
              email: contact.email,
              phone: contact.phone,
            }
          : null,
      };
    });

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      return enriched.filter((c) => {
        const name = `${c.contact?.firstName || ''} ${c.contact?.lastName || ''}`.toLowerCase();
        const email = (c.contact?.email || '').toLowerCase();
        const snippet = (c.lastMessageSnippet || '').toLowerCase();
        const subject = (c.subject || '').toLowerCase();
        return name.includes(q) || email.includes(q) || snippet.includes(q) || subject.includes(q);
      }).sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
    }

    return enriched.sort(
      (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );
  }

  listMessages(conversationId: string) {
    const list = this.messages.get(conversationId) || [];
    return [...list].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }

  sendMessage(data: {
    conversationId: string;
    senderId?: string | null;
    senderType: string;
    channel?: string;
    direction: string;
    content: string;
    subject?: string | null;
    status?: string;
  }) {
    const conv = this.conversations.get(data.conversationId);
    if (!conv) {
      throw new Error(`Conversation '${data.conversationId}' not found`);
    }

    const now = new Date().toISOString();
    const message = {
      id: randomUUID(),
      conversationId: data.conversationId,
      agencyId: conv.agencyId,
      locationId: conv.locationId,
      contactId: conv.contactId,
      senderId: data.senderId || null,
      senderType: data.senderType,
      channel: data.channel || conv.channel,
      direction: data.direction,
      content: data.content,
      subject: data.subject || conv.subject || null,
      status: data.status || (data.direction === 'outbound' ? 'sent' : 'received'),
      metadata: {},
      createdAt: now,
    };

    const msgs = this.messages.get(data.conversationId) || [];
    msgs.push(message);
    this.messages.set(data.conversationId, msgs);

    // Update conversation state
    conv.lastMessageSnippet = data.content.slice(0, 100);
    conv.lastMessageAt = now;
    conv.updatedAt = now;
    if (data.direction === 'inbound') {
      conv.unreadCount = (conv.unreadCount || 0) + 1;
    }

    // Add activity timeline event to contact
    if (data.direction === 'outbound') {
      this.addActivityEvent({
        contactId: conv.contactId,
        type: 'COMMUNICATION_SENT',
        title: `${(data.channel || conv.channel).toUpperCase()} Sent`,
        description: data.content.slice(0, 150),
        actorId: data.senderId,
      });
    } else {
      this.addActivityEvent({
        contactId: conv.contactId,
        type: 'COMMUNICATION_RECEIVED',
        title: `${(data.channel || conv.channel).toUpperCase()} Received`,
        description: data.content.slice(0, 150),
      });

      this.triggerEvent(conv.locationId, 'CUSTOMER_REPLIED', {
        contactId: conv.contactId,
        conversationId: conv.id,
        messageId: message.id,
        channel: message.channel,
      });
    }

    return message;
  }

  markConversationRead(conversationId: string) {
    const conv = this.conversations.get(conversationId);
    if (conv) {
      conv.unreadCount = 0;
      conv.updatedAt = new Date().toISOString();
    }
    return conv;
  }

  receiveInboundMessage(data: {
    locationId?: string;
    from: string;
    to: string;
    channel: string;
    content: string;
    subject?: string;
  }) {
    // 1. Locate contact by phone or email
    let contact: any = null;
    const allContacts = Array.from(this.contacts.values()).filter((c) => !c.deletedAt);

    if (data.channel === 'email') {
      contact = allContacts.find((c) => c.email.toLowerCase() === data.from.toLowerCase());
    } else {
      contact = allContacts.find((c) => c.phone && c.phone.replace(/\D/g, '').includes(data.from.replace(/\D/g, '')));
    }

    // If contact not found and location specified, auto-create contact
    if (!contact) {
      const locId = data.locationId || (this.locations.values().next().value?.id);
      const location = locId ? this.findLocationById(locId) : null;
      if (!location) {
        throw new Error('Cannot route inbound message: No valid location identified');
      }

      contact = this.createContact({
        agencyId: location.agencyId,
        locationId: location.id,
        firstName: 'Inbound',
        lastName: data.channel.toUpperCase() + ' Lead',
        email: data.channel === 'email' ? data.from : `lead-${Date.now()}@inbound.prosumate.local`,
        phone: data.channel === 'sms' ? data.from : undefined,
        source: `inbound:${data.channel}`,
        tags: ['Inbound Lead'],
      });
    }

    // 2. Get or create conversation thread
    const conv = this.getOrCreateConversation({
      agencyId: contact.agencyId,
      locationId: contact.locationId,
      contactId: contact.id,
      channel: data.channel,
      subject: data.subject || null,
    });

    // 3. Send message as inbound
    const message = this.sendMessage({
      conversationId: conv.id,
      senderType: 'contact',
      channel: data.channel,
      direction: 'inbound',
      content: data.content,
      subject: data.subject,
      status: 'received',
    });

    return { conversation: conv, message, contact };
  }

  // ==========================================
  // Automation & Workflows (Phase 5+)
  // ==========================================
  workflows: Map<string, any> = new Map();
  workflowExecutions: Map<string, any[]> = new Map(); // workflowId -> WorkflowExecution[]
  workflowFolders: Map<string, any> = new Map();
  private workflowEventDepth = 0;

  private cloneWorkflowValue<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T;
  }

  private normalizeWorkflowSteps(steps: any[], preserveIds: boolean) {
    return steps
      .map((step, index) => ({ step, index }))
      .sort((a, b) => (a.step.order ?? a.index) - (b.step.order ?? b.index))
      .map(({ step }, order) => ({
        id: preserveIds && step.id ? step.id : randomUUID(),
        name: step.name,
        actionType: step.actionType,
        config: this.cloneWorkflowValue(step.config || {}),
        order,
      }));
  }

  private interpolateWorkflowText(value: unknown, contact: any): string {
    return String(value ?? '')
      .replace(/{{contact\.firstName}}/g, contact.firstName || '')
      .replace(/{{firstName}}/g, contact.firstName || '')
      .replace(/{{contact\.lastName}}/g, contact.lastName || '')
      .replace(/{{lastName}}/g, contact.lastName || '')
      .replace(/{{contact\.email}}/g, contact.email || '')
      .replace(/{{email}}/g, contact.email || '');
  }

  createWorkflow(data: {
    agencyId: string;
    locationId: string;
    name: string;
    description?: string | null;
    status?: string;
    trigger: { type: string; config?: Record<string, unknown> };
    steps: Array<{
      name: string;
      actionType: string;
      config?: Record<string, unknown>;
      order: number;
    }>;
    folderId?: string | null;
    tags?: string[];
    duplicatedFrom?: string | null;
    createdBy?: string | null;
  }) {
    if (data.folderId) {
      const folder = this.workflowFolders.get(data.folderId);
      if (!folder || folder.locationId !== data.locationId) {
        throw new Error(`Workflow folder '${data.folderId}' not found in this location`);
      }
    }

    const now = new Date().toISOString();
    const workflow = {
      id: randomUUID(),
      agencyId: data.agencyId,
      locationId: data.locationId,
      name: data.name,
      description: data.description || null,
      status: data.status || 'published',
      trigger: {
        type: data.trigger.type,
        config: this.cloneWorkflowValue(data.trigger.config || {}),
      },
      steps: this.normalizeWorkflowSteps(data.steps, false),
      totalRuns: 0,
      successfulRuns: 0,
      folderId: data.folderId || null,
      deletedAt: null,
      duplicatedFrom: data.duplicatedFrom || null,
      createdBy: data.createdBy || null,
      tags: Array.from(new Set(data.tags || [])),
      createdAt: now,
      updatedAt: now,
    };

    this.workflows.set(workflow.id, workflow);
    return workflow;
  }

  findWorkflowById(id: string) {
    return this.workflows.get(id);
  }

  listWorkflowsByLocation(locationId: string, includeDeleted = false) {
    return Array.from(this.workflows.values()).filter(
      (w) => w.locationId === locationId && (includeDeleted || !w.deletedAt)
    );
  }

  updateWorkflow(
    id: string,
    updates: Partial<{
      name: string;
      description: string | null;
      status: string;
      trigger: any;
      steps: any[];
      folderId: string | null;
      tags: string[];
    }>
  ) {
    const workflow = this.workflows.get(id);
    if (!workflow) {
      throw new Error(`Workflow '${id}' not found`);
    }

    if (updates.folderId) {
      const folder = this.workflowFolders.get(updates.folderId);
      if (!folder || folder.locationId !== workflow.locationId) {
        throw new Error(`Workflow folder '${updates.folderId}' not found in this location`);
      }
    }

    if (updates.name !== undefined) workflow.name = updates.name;
    if (updates.description !== undefined) workflow.description = updates.description;
    if (updates.status !== undefined) workflow.status = updates.status;
    if (updates.trigger !== undefined) {
      workflow.trigger = this.cloneWorkflowValue(updates.trigger);
    }
    if (updates.folderId !== undefined) workflow.folderId = updates.folderId;
    if (updates.tags !== undefined) workflow.tags = Array.from(new Set(updates.tags));
    if (updates.steps !== undefined) {
      workflow.steps = this.normalizeWorkflowSteps(updates.steps, true);
    }
    workflow.updatedAt = new Date().toISOString();

    return workflow;
  }

  deleteWorkflow(id: string) {
    return this.workflows.delete(id);
  }

  executeWorkflow(
    workflowId: string,
    payload: { contactId: string; triggerData?: Record<string, unknown> }
  ) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow || workflow.deletedAt) {
      throw new Error(`Workflow '${workflowId}' not found`);
    }

    const contact = this.findContactById(payload.contactId);
    if (!contact || contact.locationId !== workflow.locationId) {
      throw new Error(`Contact '${payload.contactId}' not found for workflow execution`);
    }

    const executionId = randomUUID();
    const startedAt = new Date().toISOString();
    const stepsExecuted: any[] = [];

    // Sort steps in execution order
    const steps = [...workflow.steps].sort((a, b) => a.order - b.order);

    let hasFailure = false;
    let failureError: string | null = null;

    for (const step of steps) {
      const stepTimestamp = new Date().toISOString();
      try {
        const stepOutput: Record<string, unknown> = {};

        switch (step.actionType) {
          case 'SEND_EMAIL': {
            const contentObject =
              typeof step.config?.content === 'object' && step.config.content
                ? step.config.content
                : null;
            const subject =
              (step.config?.templateSubject as string) ||
              (step.config?.subject as string) ||
              (contentObject?.subject as string) ||
              'Automated Notification';
            const content = this.interpolateWorkflowText(
              (step.config?.templateBody as string) ||
              (typeof step.config?.content === 'string' ? step.config.content : undefined) ||
              (contentObject?.body as string) ||
              (step.config?.body as string) ||
              'Hello, this is an automated message.',
              contact
            );

            const conv = this.getOrCreateConversation({
              agencyId: workflow.agencyId,
              locationId: workflow.locationId,
              contactId: contact.id,
              channel: 'email',
              subject,
            });

            this.sendMessage({
              conversationId: conv.id,
              senderType: 'system',
              channel: 'email',
              direction: 'outbound',
              content,
              subject,
              status: 'delivered',
            });
            stepOutput.message = 'Email dispatched';
            break;
          }

          case 'SEND_SMS': {
            const content = this.interpolateWorkflowText(
              (step.config?.content as string) ||
              (step.config?.message as string) ||
              (step.config?.templateBody as string) ||
              'Automated SMS notification.',
              contact
            );

            const conv = this.getOrCreateConversation({
              agencyId: workflow.agencyId,
              locationId: workflow.locationId,
              contactId: contact.id,
              channel: 'sms',
            });

            this.sendMessage({
              conversationId: conv.id,
              senderType: 'system',
              channel: 'sms',
              direction: 'outbound',
              content,
              status: 'delivered',
            });
            stepOutput.message = 'SMS dispatched';
            break;
          }

          case 'ADD_TAG': {
            const tag =
              (step.config?.tag as string) ||
              (Array.isArray(step.config?.tags) ? step.config.tags[0] : undefined);
            if (!tag) throw new Error('ADD_TAG requires config.tag');
            if (!contact.tags.includes(tag)) {
              contact.tags.push(tag);
              this.addActivityEvent({
                contactId: contact.id,
                type: 'CONTACT_UPDATED',
                title: 'Tag Added via Workflow',
                description: `Workflow "${workflow.name}" added tag: ${tag}`,
              });
              this.triggerEvent(workflow.locationId, 'TAG_ADDED', {
                contactId: contact.id,
                tag,
                sourceWorkflowId: workflow.id,
              });
            }
            stepOutput.tagAdded = tag;
            break;
          }

          case 'REMOVE_TAG': {
            const tag =
              (step.config?.tag as string) ||
              (Array.isArray(step.config?.tags) ? step.config.tags[0] : undefined);
            if (!tag) throw new Error('REMOVE_TAG requires config.tag');
            contact.tags = contact.tags.filter((t: string) => t !== tag);
            stepOutput.tagRemoved = tag;
            break;
          }

          case 'CREATE_TASK': {
            const title =
              (step.config?.taskTitle as string) ||
              (step.config?.title as string) ||
              `Task generated by ${workflow.name}`;
            this.addContactTask({
              contactId: contact.id,
              title,
              description: `Automated task provisioned from workflow "${workflow.name}"`,
            });
            stepOutput.taskCreated = title;
            break;
          }

          case 'MOVE_OPPORTUNITY_STAGE': {
            const opp = Array.from(this.opportunities.values()).find(
              (o) => o.contactId === contact.id && o.locationId === workflow.locationId
            );
            if (!opp) throw new Error('No opportunity found for contact');

            let targetStageId = step.config?.stageId as string | undefined;
            if (targetStageId && !this.findPipelineById(opp.pipelineId)?.stages?.some(
              (stage: any) => stage.id === targetStageId
            )) {
              const targetName = targetStageId;
              targetStageId = this.findPipelineById(opp.pipelineId)?.stages?.find(
                (stage: any) => stage.name.toLowerCase() === targetName.toLowerCase()
              )?.id;
            }
            if (!targetStageId && step.config?.stage) {
              const targetName = String(step.config.stage);
              targetStageId = this.findPipelineById(opp.pipelineId)?.stages?.find(
                (stage: any) => stage.name.toLowerCase() === targetName.toLowerCase()
              )?.id;
            }
            if (!targetStageId) throw new Error('MOVE_OPPORTUNITY_STAGE requires a valid stageId');

            this.moveOpportunityStage(opp.id, targetStageId);
            stepOutput.stageMoved = targetStageId;
            break;
          }

          case 'WAIT':
          case 'WAIT_DELAY': {
            const unit = String(step.config?.unit || 'minutes');
            const multiplier = unit.startsWith('day')
              ? 1440
              : unit.startsWith('hour')
                ? 60
                : unit.startsWith('week')
                  ? 10080
                  : 1;
            stepOutput.delayMinutes =
              Number(step.config?.delayMinutes ?? step.config?.durationMinutes) ||
              (Number(step.config?.duration) || 0) * multiplier;
            stepOutput.simulated = true;
            break;
          }

          case 'INTERNAL_NOTIFICATION': {
            const message = this.interpolateWorkflowText(
              step.config?.message || 'A contact reached this workflow step.',
              contact
            );
            this.addActivityEvent({
              contactId: contact.id,
              type: 'INTERNAL_NOTIFICATION',
              title: 'Workflow Team Notification',
              description: message,
              metadata: { workflowId: workflow.id },
            });
            stepOutput.notification = message;
            break;
          }

          case 'UPDATE_CONTACT_FIELD': {
            const field = String(step.config?.field || '').trim();
            if (!field) throw new Error('UPDATE_CONTACT_FIELD requires config.field');
            if (['id', 'agencyId', 'locationId', 'createdAt', 'deletedAt'].includes(field)) {
              throw new Error(`Contact field '${field}' cannot be changed by a workflow`);
            }
            const value = step.config?.value;
            const directFields = ['firstName', 'lastName', 'email', 'phone', 'source', 'ownerId', 'status'];
            if (directFields.includes(field)) {
              contact[field] = value;
            } else {
              contact.customFields = { ...(contact.customFields || {}), [field]: value };
            }
            contact.updatedAt = new Date().toISOString();
            stepOutput.field = field;
            stepOutput.value = value;
            break;
          }

          case 'AI_GENERATE': {
            const prompt = this.interpolateWorkflowText(
              step.config?.prompt || 'Write a helpful follow-up for this contact.',
              contact
            );
            const outputField = String(step.config?.outputField || 'aiGeneratedContent');
            const generated = `AI draft for ${contact.firstName}: ${prompt}`;
            contact.customFields = {
              ...(contact.customFields || {}),
              [outputField]: generated,
            };
            contact.updatedAt = new Date().toISOString();
            stepOutput.outputField = outputField;
            stepOutput.generated = generated;
            break;
          }

          case 'WEBHOOK': {
            const webhookId = step.config?.webhookId as string | undefined;
            if (webhookId) {
              const delivery = this.dispatchWebhook(
                workflow.locationId,
                webhookId,
                String(step.config?.event || 'workflow.step'),
                { workflowId: workflow.id, contactId: contact.id, triggerData: payload.triggerData || {} }
              );
              stepOutput.deliveryId = delivery.id;
            } else {
              const targetUrl = String(step.config?.url || '').trim();
              if (!targetUrl) throw new Error('WEBHOOK requires config.webhookId or config.url');
              stepOutput.targetUrl = targetUrl;
              stepOutput.method = String(step.config?.method || 'POST').toUpperCase();
              stepOutput.simulated = true;
            }
            break;
          }

          case 'IF_ELSE': {
            const field = String(step.config?.field || 'status');
            const actual = field in contact ? contact[field] : contact.customFields?.[field];
            const expected = step.config?.value;
            const operator = String(step.config?.operator || 'equals');
            const conditionMet = operator === 'not_equals'
              ? actual !== expected
              : operator === 'contains'
                ? String(actual ?? '').includes(String(expected ?? ''))
                : actual === expected;
            stepOutput.conditionMet = conditionMet;
            stepOutput.actual = actual;
            break;
          }

          default:
            throw new Error(`Unsupported workflow action '${step.actionType}'`);
        }

        stepsExecuted.push({
          stepId: step.id,
          stepName: step.name,
          actionType: step.actionType,
          status: 'completed',
          output: stepOutput,
          executedAt: stepTimestamp,
          errorMessage: null,
        });
      } catch (err: any) {
        hasFailure = true;
        failureError = err.message || 'Step execution failed';
        stepsExecuted.push({
          stepId: step.id,
          stepName: step.name,
          actionType: step.actionType,
          status: 'failed',
          executedAt: stepTimestamp,
          errorMessage: failureError,
        });
        break; // Stop sequential chain on failure
      }
    }

    const completedAt = new Date().toISOString();
    const execution = {
      id: executionId,
      workflowId,
      workflowName: workflow.name,
      locationId: workflow.locationId,
      contactId: contact.id,
      triggerType: workflow.trigger.type,
      status: hasFailure ? 'failed' : 'completed',
      stepsExecuted,
      startedAt,
      completedAt,
      error: failureError,
    };

    const runs = this.workflowExecutions.get(workflowId) || [];
    runs.unshift(execution);
    this.workflowExecutions.set(workflowId, runs);

    // Update workflow metrics
    workflow.totalRuns = (workflow.totalRuns || 0) + 1;
    if (!hasFailure) {
      workflow.successfulRuns = (workflow.successfulRuns || 0) + 1;
    }
    workflow.updatedAt = completedAt;

    return execution;
  }

  private workflowTriggerMatches(
    config: Record<string, unknown> | undefined,
    payload: Record<string, any>
  ): boolean {
    if (!config) return true;

    return Object.entries(config).every(([key, expected]) => {
      if (key === 'additionalTriggers') return true;
      if (expected === undefined || expected === null || expected === '' || expected === 'any' || expected === '*') {
        return true;
      }

      let actual = payload[key];
      if (key === 'stage') actual = payload.stageName ?? payload.stage ?? payload.stageId;
      if (key === 'tag') actual = payload.tag;

      if (Array.isArray(expected)) {
        return expected.some((value) => String(value).toLowerCase() === String(actual).toLowerCase());
      }
      if (key === 'source' && typeof actual === 'string') {
        return actual.toLowerCase().startsWith(String(expected).toLowerCase());
      }
      return String(actual).toLowerCase() === String(expected).toLowerCase();
    });
  }

  triggerEvent(
    locationId: string,
    triggerType: string,
    payload: { contactId: string; [key: string]: any }
  ) {
    if (this.workflowEventDepth >= 10) return [];

    const matchingWorkflows = Array.from(this.workflows.values()).filter((workflow) => {
      if (
        workflow.locationId !== locationId ||
        workflow.deletedAt ||
        workflow.status !== 'published' ||
        workflow.id === payload.sourceWorkflowId
      ) return false;

      const primaryMatches = workflow.trigger.type === triggerType &&
        this.workflowTriggerMatches(workflow.trigger.config, payload);
      const additionalTriggers = Array.isArray(workflow.trigger.config?.additionalTriggers)
        ? workflow.trigger.config.additionalTriggers as Array<{ type?: string; config?: Record<string, unknown> }>
        : [];
      const additionalMatches = additionalTriggers.some((additionalTrigger) =>
        additionalTrigger.type === triggerType &&
        this.workflowTriggerMatches(additionalTrigger.config, payload)
      );
      return primaryMatches || additionalMatches;
    });

    const executions: any[] = [];
    this.workflowEventDepth += 1;
    try {
      for (const wf of matchingWorkflows) {
        try {
          const exec = this.executeWorkflow(wf.id, {
            contactId: payload.contactId,
            triggerData: payload,
          });
          executions.push(exec);
        } catch {
          // Individual workflow failure does not break event chain
        }
      }
    } finally {
      this.workflowEventDepth -= 1;
    }
    return executions;
  }

  listWorkflowExecutions(workflowId: string) {
    return this.workflowExecutions.get(workflowId) || [];
  }

  // === Workflow Folder Methods ===

  createWorkflowFolder(data: {
    locationId: string;
    name: string;
    color?: string | null;
    icon?: string | null;
  }) {
    const now = new Date().toISOString();
    const folder = {
      id: randomUUID(),
      locationId: data.locationId,
      name: data.name,
      color: data.color || null,
      icon: data.icon || null,
      workflowCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    this.workflowFolders.set(folder.id, folder);
    return folder;
  }

  listWorkflowFolders(locationId: string) {
    const folders = Array.from(this.workflowFolders.values()).filter(
      (f) => f.locationId === locationId
    );
    // Compute live workflow counts
    for (const folder of folders) {
      folder.workflowCount = Array.from(this.workflows.values()).filter(
        (w) => w.locationId === locationId && w.folderId === folder.id && !w.deletedAt
      ).length;
    }
    return folders;
  }

  findWorkflowFolderById(id: string) {
    return this.workflowFolders.get(id);
  }

  updateWorkflowFolder(id: string, updates: Partial<{ name: string; color: string | null; icon: string | null }>) {
    const folder = this.workflowFolders.get(id);
    if (!folder) throw new Error(`Workflow folder '${id}' not found`);
    if (updates.name !== undefined) folder.name = updates.name;
    if (updates.color !== undefined) folder.color = updates.color;
    if (updates.icon !== undefined) folder.icon = updates.icon;
    folder.updatedAt = new Date().toISOString();
    return folder;
  }

  deleteWorkflowFolder(id: string) {
    // Unassign all workflows in this folder
    for (const wf of this.workflows.values()) {
      if (wf.folderId === id) {
        wf.folderId = null;
        wf.updatedAt = new Date().toISOString();
      }
    }
    return this.workflowFolders.delete(id);
  }

  // === Soft Delete / Restore ===

  softDeleteWorkflow(id: string) {
    const workflow = this.workflows.get(id);
    if (!workflow) throw new Error(`Workflow '${id}' not found`);
    workflow.deletedAt = new Date().toISOString();
    workflow.status = 'paused';
    workflow.updatedAt = workflow.deletedAt;
    return workflow;
  }

  restoreWorkflow(id: string) {
    const workflow = this.workflows.get(id);
    if (!workflow) throw new Error(`Workflow '${id}' not found`);
    workflow.deletedAt = null;
    workflow.status = 'draft';
    workflow.updatedAt = new Date().toISOString();
    return workflow;
  }

  listDeletedWorkflows(locationId: string) {
    return Array.from(this.workflows.values()).filter(
      (w) => w.locationId === locationId && w.deletedAt
    );
  }

  // === Duplicate Workflow ===

  duplicateWorkflow(workflowId: string, overrideName?: string, createdBy?: string | null) {
    const original = this.workflows.get(workflowId);
    if (!original) throw new Error(`Workflow '${workflowId}' not found`);

    return this.createWorkflow({
      agencyId: original.agencyId,
      locationId: original.locationId,
      name: overrideName || `${original.name} (Copy)`,
      description: original.description,
      status: 'draft',
      trigger: { ...original.trigger },
      steps: original.steps.map((s: any, idx: number) => ({
        name: s.name,
        actionType: s.actionType,
        config: { ...s.config },
        order: idx,
      })),
      folderId: original.folderId,
      tags: [...(original.tags || [])],
      duplicatedFrom: workflowId,
      createdBy: createdBy || null,
    });
  }

  // === Move Workflow to Folder ===

  moveWorkflowToFolder(workflowId: string, folderId: string | null) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) throw new Error(`Workflow '${workflowId}' not found`);
    if (folderId) {
      const folder = this.workflowFolders.get(folderId);
      if (!folder || folder.locationId !== workflow.locationId) {
        throw new Error(`Workflow folder '${folderId}' not found in this location`);
      }
    }
    workflow.folderId = folderId;
    workflow.updatedAt = new Date().toISOString();
    return workflow;
  }

  // ==========================================
  // Stripe Billing, Subscriptions & Metering (Phase 6)
  // ==========================================
  subscriptionPlans: Map<string, any> = new Map();
  locationSubscriptions: Map<string, any> = new Map(); // locationId -> LocationSubscription
  creditWallets: Map<string, any> = new Map(); // locationId -> CreditWallet
  usageTransactions: Map<string, any[]> = new Map(); // locationId -> UsageTransaction[]
  invoices: Map<string, any[]> = new Map(); // locationId -> Invoice[]

  createSubscriptionPlan(data: {
    id?: string;
    name: string;
    tier: string;
    description: string;
    priceCents: number;
    interval?: string;
    currency?: string;
    features: string[];
    includedCreditsCents: number;
    isPopular?: boolean;
  }) {
    const plan = {
      id: data.id || randomUUID(),
      name: data.name,
      tier: data.tier,
      description: data.description,
      priceCents: data.priceCents,
      interval: data.interval || 'month',
      currency: data.currency || 'USD',
      features: data.features,
      includedCreditsCents: data.includedCreditsCents,
      isPopular: data.isPopular || false,
    };
    this.subscriptionPlans.set(plan.id, plan);
    return plan;
  }

  listSubscriptionPlans() {
    return Array.from(this.subscriptionPlans.values());
  }

  findSubscriptionPlanById(planId: string) {
    return this.subscriptionPlans.get(planId);
  }

  getLocationSubscription(locationId: string) {
    return this.locationSubscriptions.get(locationId);
  }

  subscribeLocation(locationId: string, planId: string, paymentMethodId = 'pm_card_visa') {
    const location = this.findLocationById(locationId);
    if (!location) throw new Error(`Location '${locationId}' not found`);

    const plan = this.findSubscriptionPlanById(planId);
    if (!plan) throw new Error(`Subscription plan '${planId}' not found`);

    const now = new Date();
    const periodStart = now.toISOString();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

    let sub = this.locationSubscriptions.get(locationId);
    if (sub) {
      sub.planId = plan.id;
      sub.planName = plan.name;
      sub.tier = plan.tier;
      sub.status = 'active';
      sub.cancelAtPeriodEnd = false;
      sub.updatedAt = periodStart;
    } else {
      sub = {
        id: randomUUID(),
        agencyId: location.agencyId,
        locationId,
        planId: plan.id,
        planName: plan.name,
        tier: plan.tier,
        stripeCustomerId: `cus_sim_${randomUUID().slice(0, 8)}`,
        stripeSubscriptionId: `sub_sim_${randomUUID().slice(0, 8)}`,
        status: 'active',
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        createdAt: periodStart,
        updatedAt: periodStart,
      };
      this.locationSubscriptions.set(locationId, sub);
    }

    // Top up wallet with included credits
    if (plan.includedCreditsCents > 0) {
      this.topUpCreditWallet(
        locationId,
        plan.includedCreditsCents,
        `Plan allowance: ${plan.name}`
      );
    }

    // Generate Subscription Invoice
    const inv = {
      id: randomUUID(),
      agencyId: location.agencyId,
      locationId,
      stripeInvoiceId: `in_sim_${randomUUID().slice(0, 8)}`,
      amountDueCents: plan.priceCents,
      amountPaidCents: plan.priceCents,
      currency: plan.currency,
      status: 'paid',
      invoicePdfUrl: `https://billing.prosumate.internal/invoices/inv-${randomUUID().slice(0, 6)}.pdf`,
      createdAt: periodStart,
      paidAt: periodStart,
    };
    const invs = this.invoices.get(locationId) || [];
    invs.unshift(inv);
    this.invoices.set(locationId, invs);

    return sub;
  }

  cancelLocationSubscription(locationId: string) {
    const sub = this.locationSubscriptions.get(locationId);
    if (!sub) throw new Error(`No active subscription found for location '${locationId}'`);

    sub.cancelAtPeriodEnd = true;
    sub.updatedAt = new Date().toISOString();
    return sub;
  }

  getCreditWallet(locationId: string) {
    let wallet = this.creditWallets.get(locationId);
    if (!wallet) {
      const location = this.findLocationById(locationId);
      wallet = {
        id: randomUUID(),
        agencyId: location?.agencyId || '',
        locationId,
        balanceCents: 0,
        currency: 'USD',
        autoRechargeEnabled: true,
        autoRechargeThresholdCents: 1000, // $10.00
        autoRechargeAmountCents: 5000, // $50.00
        updatedAt: new Date().toISOString(),
      };
      this.creditWallets.set(locationId, wallet);
    }
    return wallet;
  }

  topUpCreditWallet(locationId: string, amountCents: number, description = 'Prepaid wallet credit top-up') {
    const wallet = this.getCreditWallet(locationId);
    wallet.balanceCents += amountCents;
    wallet.updatedAt = new Date().toISOString();

    const location = this.findLocationById(locationId);
    if (location && amountCents > 0) {
      const inv = {
        id: randomUUID(),
        agencyId: location.agencyId,
        locationId,
        stripeInvoiceId: `in_sim_${randomUUID().slice(0, 8)}`,
        amountDueCents: amountCents,
        amountPaidCents: amountCents,
        currency: wallet.currency,
        status: 'paid',
        invoicePdfUrl: `https://billing.prosumate.internal/invoices/inv-${randomUUID().slice(0, 6)}.pdf`,
        createdAt: wallet.updatedAt,
        paidAt: wallet.updatedAt,
      };
      const invs = this.invoices.get(locationId) || [];
      invs.unshift(inv);
      this.invoices.set(locationId, invs);
    }

    return wallet;
  }

  updateCreditWalletConfig(
    locationId: string,
    updates: Partial<{
      autoRechargeEnabled: boolean;
      autoRechargeThresholdCents: number;
      autoRechargeAmountCents: number;
    }>
  ) {
    const wallet = this.getCreditWallet(locationId);
    if (updates.autoRechargeEnabled !== undefined) {
      wallet.autoRechargeEnabled = updates.autoRechargeEnabled;
    }
    if (updates.autoRechargeThresholdCents !== undefined) {
      wallet.autoRechargeThresholdCents = updates.autoRechargeThresholdCents;
    }
    if (updates.autoRechargeAmountCents !== undefined) {
      wallet.autoRechargeAmountCents = updates.autoRechargeAmountCents;
    }
    wallet.updatedAt = new Date().toISOString();
    return wallet;
  }

  recordUsage(
    locationId: string,
    data: {
      type: 'sms' | 'email' | 'ai_tokens' | 'phone_number';
      units: number;
      description: string;
      rebillingMarginPercent?: number;
    }
  ) {
    const location = this.findLocationById(locationId);
    if (!location) throw new Error(`Location '${locationId}' not found`);

    const wallet = this.getCreditWallet(locationId);

    // Unit prices in cents
    const unitPrices: Record<string, number> = {
      sms: 2, // 2 cents ($0.02)
      email: 0.2, // 0.2 cents ($0.002)
      ai_tokens: 0.005, // 0.005 cents ($0.00005)
      phone_number: 200, // 200 cents ($2.00)
    };

    const unitPrice = unitPrices[data.type] || 1;
    const margin = data.rebillingMarginPercent ?? 20; // 20% agency rebilling margin
    const baseCost = unitPrice * data.units;
    const amountCents = Math.max(1, Math.round(baseCost * (1 + margin / 100)));

    // Deduct from balance
    wallet.balanceCents -= amountCents;
    wallet.updatedAt = new Date().toISOString();

    const transaction = {
      id: randomUUID(),
      agencyId: location.agencyId,
      locationId,
      type: data.type,
      amountCents,
      description: data.description,
      units: data.units,
      unitPriceCents: unitPrice,
      rebillingMarginPercent: margin,
      createdAt: wallet.updatedAt,
    };

    const txs = this.usageTransactions.get(locationId) || [];
    txs.unshift(transaction);
    this.usageTransactions.set(locationId, txs);

    // Trigger auto-recharge if wallet drops below threshold
    let autoRechargeTriggered = false;
    if (wallet.autoRechargeEnabled && wallet.balanceCents < wallet.autoRechargeThresholdCents) {
      this.topUpCreditWallet(
        locationId,
        wallet.autoRechargeAmountCents,
        `Auto-recharge trigger (balance dropped below threshold)`
      );
      autoRechargeTriggered = true;
    }

    return { transaction, wallet, autoRechargeTriggered };
  }

  listUsageTransactions(locationId: string) {
    return this.usageTransactions.get(locationId) || [];
  }

  listInvoices(locationId: string) {
    return this.invoices.get(locationId) || [];
  }

  // ==========================================
  // Landing Pages & Funnels (Phase 7)
  // ==========================================
  funnels: Map<string, any> = new Map();

  createFunnel(data: {
    agencyId: string;
    locationId: string;
    name: string;
    slug: string;
    description?: string | null;
    published?: boolean;
    steps: Array<{
      id?: string;
      name: string;
      slug: string;
      type: string;
      order?: number;
      blocks?: any[];
      nextStepSlug?: string | null;
    }>;
  }) {
    const existing = Array.from(this.funnels.values()).find(
      (f) => f.locationId === data.locationId && f.slug === data.slug
    );
    if (existing) {
      throw new Error(`Funnel with slug '${data.slug}' already exists in this location`);
    }

    const now = new Date().toISOString();
    const funnelId = randomUUID();

    const steps = data.steps.map((s, sIdx) => ({
      id: s.id || randomUUID(),
      funnelId,
      name: s.name,
      slug: s.slug,
      type: s.type,
      order: s.order ?? sIdx,
      blocks: (s.blocks || []).map((b: any, bIdx: number) => ({
        id: b.id || randomUUID(),
        type: b.type,
        title: b.title,
        subtitle: b.subtitle || null,
        content: b.content || null,
        settings: b.settings || {},
        order: b.order ?? bIdx,
      })),
      pageViews: 0,
      conversions: 0,
      nextStepSlug: s.nextStepSlug || null,
    }));

    const funnel = {
      id: funnelId,
      agencyId: data.agencyId,
      locationId: data.locationId,
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      published: data.published ?? true,
      steps,
      totalViews: 0,
      totalConversions: 0,
      createdAt: now,
      updatedAt: now,
    };

    this.funnels.set(funnel.id, funnel);
    return funnel;
  }

  findFunnelById(id: string) {
    return this.funnels.get(id);
  }

  findFunnelBySlug(locationId: string, slug: string) {
    return Array.from(this.funnels.values()).find(
      (f) => f.locationId === locationId && f.slug === slug
    );
  }

  findPublicFunnelBySlug(slug: string) {
    return Array.from(this.funnels.values()).find(
      (f) => f.slug === slug && f.published
    );
  }

  listFunnelsByLocation(locationId: string) {
    return Array.from(this.funnels.values()).filter(
      (f) => f.locationId === locationId
    );
  }

  updateFunnel(
    id: string,
    updates: Partial<{
      name: string;
      slug: string;
      description: string | null;
      published: boolean;
      steps: any[];
    }>
  ) {
    const funnel = this.funnels.get(id);
    if (!funnel) throw new Error(`Funnel '${id}' not found`);

    if (updates.name !== undefined) funnel.name = updates.name;
    if (updates.slug !== undefined) funnel.slug = updates.slug;
    if (updates.description !== undefined) funnel.description = updates.description;
    if (updates.published !== undefined) funnel.published = updates.published;
    if (updates.steps !== undefined) {
      funnel.steps = updates.steps.map((s: any, sIdx: number) => ({
        id: s.id || randomUUID(),
        funnelId: funnel.id,
        name: s.name,
        slug: s.slug,
        type: s.type,
        order: s.order ?? sIdx,
        blocks: (s.blocks || []).map((b: any, bIdx: number) => ({
          id: b.id || randomUUID(),
          type: b.type,
          title: b.title,
          subtitle: b.subtitle || null,
          content: b.content || null,
          settings: b.settings || {},
          order: b.order ?? bIdx,
        })),
        pageViews: s.pageViews ?? 0,
        conversions: s.conversions ?? 0,
        nextStepSlug: s.nextStepSlug || null,
      }));
    }
    funnel.updatedAt = new Date().toISOString();

    return funnel;
  }

  deleteFunnel(id: string) {
    return this.funnels.delete(id);
  }

  recordFunnelEvent(funnelId: string, stepSlug: string, eventType: 'view' | 'conversion') {
    const funnel = this.funnels.get(funnelId);
    if (!funnel) throw new Error(`Funnel '${funnelId}' not found`);

    const step = funnel.steps.find((s: any) => s.slug === stepSlug);
    if (!step) throw new Error(`Funnel step '${stepSlug}' not found`);

    if (eventType === 'view') {
      step.pageViews = (step.pageViews || 0) + 1;
      funnel.totalViews = (funnel.totalViews || 0) + 1;
    } else if (eventType === 'conversion') {
      step.conversions = (step.conversions || 0) + 1;
      funnel.totalConversions = (funnel.totalConversions || 0) + 1;
    }

    funnel.updatedAt = new Date().toISOString();
    return { funnel, step };
  }

  // ==========================================
  // Reporting, Attribution & Reputation (Phase 8)
  // ==========================================
  campaignMetrics: Map<string, any[]> = new Map();
  customerReviews: Map<string, any[]> = new Map();
  reviewRequests: Map<string, any[]> = new Map();

  addCampaignMetric(locationId: string, data: any) {
    const list = this.campaignMetrics.get(locationId) || [];
    const metric = {
      id: randomUUID(),
      agencyId: data.agencyId,
      locationId,
      channel: data.channel,
      campaignName: data.campaignName,
      adSpendCents: data.adSpendCents,
      impressions: data.impressions,
      clicks: data.clicks,
      leadsGenerated: data.leadsGenerated,
      dealsClosed: data.dealsClosed,
      revenueGeneratedCents: data.revenueGeneratedCents,
      startDate: data.startDate || new Date().toISOString(),
      endDate: data.endDate || new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    list.push(metric);
    this.campaignMetrics.set(locationId, list);
    return metric;
  }

  getAttributionReport(locationId: string, model: string = 'last_touch') {
    const metrics = this.campaignMetrics.get(locationId) || [];
    
    // Group metrics by channel
    const channelMap = new Map<string, {
      adSpendCents: number;
      revenueCents: number;
      leads: number;
      deals: number;
    }>();

    const channelLabels: Record<string, string> = {
      google_ads: 'Google Search & Performance Max',
      facebook_ads: 'Meta (Facebook & Instagram)',
      organic_search: 'Organic SEO & Direct Search',
      referral: 'Affiliate & Client Referrals',
      email_campaign: 'Outbound & Nurture Email',
      direct: 'Direct & Brand Traffic',
    };

    for (const m of metrics) {
      const existing = channelMap.get(m.channel) || {
        adSpendCents: 0,
        revenueCents: 0,
        leads: 0,
        deals: 0,
      };
      existing.adSpendCents += m.adSpendCents;
      existing.revenueCents += m.revenueGeneratedCents;
      existing.leads += m.leadsGenerated;
      existing.deals += m.dealsClosed;
      channelMap.set(m.channel, existing);
    }

    const channels = Array.from(channelMap.entries()).map(([ch, stats]) => {
      const roas = stats.adSpendCents > 0
        ? Number((stats.revenueCents / stats.adSpendCents).toFixed(2))
        : stats.revenueCents > 0 ? 10.0 : 0;
      const cacCents = stats.deals > 0
        ? Math.round(stats.adSpendCents / stats.deals)
        : 0;

      return {
        channel: ch,
        channelLabel: channelLabels[ch] || ch,
        adSpendCents: stats.adSpendCents,
        revenueCents: stats.revenueCents,
        leads: stats.leads,
        deals: stats.deals,
        roas,
        cacCents,
      };
    });

    const totalAdSpendCents = channels.reduce((acc, c) => acc + c.adSpendCents, 0);
    const totalRevenueCents = channels.reduce((acc, c) => acc + c.revenueCents, 0);
    const totalLeads = channels.reduce((acc, c) => acc + c.leads, 0);
    const totalDeals = channels.reduce((acc, c) => acc + c.deals, 0);

    const blendedRoas = totalAdSpendCents > 0
      ? Number((totalRevenueCents / totalAdSpendCents).toFixed(2))
      : 0;
    const blendedCacCents = totalDeals > 0
      ? Math.round(totalAdSpendCents / totalDeals)
      : 0;

    return {
      channels,
      totalAdSpendCents,
      totalRevenueCents,
      blendedRoas,
      blendedCacCents,
      totalLeads,
      totalDeals,
      attributionModel: model,
    };
  }

  getSalesLeaderboard(locationId: string) {
    const pipelines = this.listPipelinesByLocation(locationId);
    const opportunities = Array.from(this.opportunities.values()).filter((o) => o.locationId === locationId);
    const repMap = new Map<string, {
      userId: string;
      userName: string;
      userEmail: string;
      dealsWon: number;
      revenueWonCents: number;
      totalDeals: number;
    }>();

    const stageWonMap = new Map<string, boolean>();
    for (const p of pipelines) {
      for (const s of p.stages) {
        const isWon = s.name.toLowerCase().includes('won') || s.name.toLowerCase().includes('closed');
        stageWonMap.set(s.id, isWon);
      }
    }

    for (const opp of opportunities) {
      const isWon = opp.status === 'won' || stageWonMap.get(opp.stageId) === true;
      const userId = opp.ownerId || 'unassigned';
      let rep = repMap.get(userId);
      if (!rep) {
        let userName = 'Unassigned';
        let userEmail = 'team@agency.com';
        if (userId !== 'unassigned') {
          const u = this.findUserById(userId);
          if (u) {
            userName = `${u.firstName} ${u.lastName}`;
            userEmail = u.email;
          }
        }
        rep = {
          userId,
          userName,
          userEmail,
          dealsWon: 0,
          revenueWonCents: 0,
          totalDeals: 0,
        };
        repMap.set(userId, rep);
      }

      rep.totalDeals += 1;
      if (isWon) {
        rep.dealsWon += 1;
        rep.revenueWonCents += (opp.monetaryValue || 0) * 100;
      }
    }

    const leaderboard = Array.from(repMap.values()).map((rep) => {
      const winRatePercent = rep.totalDeals > 0
        ? Math.round((rep.dealsWon / rep.totalDeals) * 100)
        : 0;
      const avgDealSizeCents = rep.dealsWon > 0
        ? Math.round(rep.revenueWonCents / rep.dealsWon)
        : 0;

      return {
        userId: rep.userId,
        userName: rep.userName,
        userEmail: rep.userEmail,
        dealsWon: rep.dealsWon,
        revenueWonCents: rep.revenueWonCents,
        winRatePercent,
        avgDealSizeCents,
      };
    });

    leaderboard.sort((a, b) => b.revenueWonCents - a.revenueWonCents);
    return leaderboard;
  }

  listCustomerReviews(locationId: string) {
    return this.customerReviews.get(locationId) || [];
  }

  submitPublicReview(locationId: string, data: {
    agencyId?: string;
    contactId?: string | null;
    authorName: string;
    rating: number;
    source?: string;
    reviewText: string;
  }) {
    const list = this.customerReviews.get(locationId) || [];
    const location = this.findLocationById(locationId);
    const review = {
      id: randomUUID(),
      agencyId: data.agencyId || location?.agencyId || '',
      locationId,
      contactId: data.contactId || null,
      authorName: data.authorName,
      rating: data.rating,
      source: data.source || 'direct',
      reviewText: data.reviewText,
      responseReply: null,
      status: 'new',
      respondedAt: null,
      createdAt: new Date().toISOString(),
    };

    list.unshift(review);
    this.customerReviews.set(locationId, list);
    return review;
  }

  replyToReview(locationId: string, reviewId: string, replyText: string) {
    const list = this.customerReviews.get(locationId) || [];
    const review = list.find((r) => r.id === reviewId);
    if (!review) throw new Error(`Review '${reviewId}' not found`);

    review.responseReply = replyText;
    review.status = 'replied';
    review.respondedAt = new Date().toISOString();
    return review;
  }

  sendReviewRequest(locationId: string, data: {
    agencyId: string;
    contactId: string;
    channel: 'sms' | 'email';
    customMessage?: string;
  }) {
    const contact = this.findContactById(data.contactId);
    if (!contact || contact.locationId !== locationId) {
      throw new Error(`Contact '${data.contactId}' not found`);
    }

    const list = this.reviewRequests.get(locationId) || [];
    const request = {
      id: randomUUID(),
      agencyId: data.agencyId,
      locationId,
      contactId: data.contactId,
      contactName: `${contact.firstName} ${contact.lastName}`,
      channel: data.channel,
      status: 'sent',
      sentAt: new Date().toISOString(),
    };

    list.unshift(request);
    this.reviewRequests.set(locationId, list);

    // Record activity in contact history
    this.addActivityEvent({
      contactId: data.contactId,
      type: 'REVIEW_REQUESTED',
      title: 'Review Requested',
      description: `Review invitation sent via ${data.channel.toUpperCase()}`,
      metadata: { requestId: request.id, channel: data.channel },
    });

    return request;
  }

  listReviewRequests(locationId: string) {
    return this.reviewRequests.get(locationId) || [];
  }

  // ==========================================
  // AI Tools & Assistants (Phase 9)
  // ==========================================
  aiConfigs: Map<string, any> = new Map();
  aiGenerations: Map<string, any[]> = new Map();

  getAiConfig(locationId: string) {
    let config = this.aiConfigs.get(locationId);
    if (!config) {
      const location = this.findLocationById(locationId);
      config = {
        id: randomUUID(),
        agencyId: location?.agencyId || '',
        locationId,
        name: 'Prosumate Autonomous Growth Copilot',
        systemPrompt:
          'You are an elite sales and marketing assistant for an enterprise agency. You communicate with clarity, emphasize client ROI, and craft high-converting messaging.',
        defaultTone: 'professional',
        autoReplyEnabled: false,
        qualificationThreshold: 75,
        model: 'gemini-1.5-pro',
        tokensUsedTotal: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.aiConfigs.set(locationId, config);
    }
    return config;
  }

  updateAiConfig(locationId: string, updates: Partial<{
    name: string;
    systemPrompt: string;
    defaultTone: string;
    autoReplyEnabled: boolean;
    qualificationThreshold: number;
  }>) {
    const config = this.getAiConfig(locationId);
    if (updates.name !== undefined) config.name = updates.name;
    if (updates.systemPrompt !== undefined) config.systemPrompt = updates.systemPrompt;
    if (updates.defaultTone !== undefined) config.defaultTone = updates.defaultTone;
    if (updates.autoReplyEnabled !== undefined) config.autoReplyEnabled = updates.autoReplyEnabled;
    if (updates.qualificationThreshold !== undefined) config.qualificationThreshold = updates.qualificationThreshold;
    config.updatedAt = new Date().toISOString();
    return config;
  }

  executeAiTask(locationId: string, data: {
    task: string;
    prompt: string;
    tone?: string;
    contactId?: string;
    channel?: string;
    context?: any;
  }) {
    const config = this.getAiConfig(locationId);
    const location = this.findLocationById(locationId);
    const tone = data.tone || config.defaultTone || 'professional';

    let resultText = '';
    let qualificationScore: number | null = null;
    let recommendedAction: string | null = null;

    if (data.task === 'generate_copy') {
      if (data.channel === 'sms') {
        resultText = `Hey there! We noticed your interest in scaling client acquisition. Ready to automate your lead routing and double booking velocity? Let's connect this week: https://prosu.me/book`;
      } else if (data.channel === 'email') {
        resultText = `Subject: Unlocking predictable pipeline velocity for your firm\n\nHi there,\n\nIn our experience working with high-growth businesses, the single greatest bottleneck is the lag between lead generation and first touch outreach.\n\nOur automated multi-channel infrastructure eliminates this delay, achieving a sub-60-second speed-to-lead across Email, SMS, and calendar booking.\n\nWould you be open to a 10-minute briefing on how this translates to 3x higher booking rates?\n\nBest regards,\n${config.name}`;
      } else if (data.channel === 'ad_copy') {
        resultText = `Headline: Scale Your Agency Operations Without Adding Headcount\nPrimary Text: Stop letting high-intent leads slip through the cracks. Prosumate unifies your CRM, 2-way conversations, and automated workflows into one enterprise operating system.\nCTA: Book Strategy Session`;
      } else {
        resultText = `Transform your sales execution with automated unified communications, event-driven workflows, and prepaid usage metering. Built for enterprise scale.`;
      }
    } else if (data.task === 'suggest_reply') {
      resultText = `Thank you for sharing that context. We completely understand the importance of seamless onboarding. We can walk through our migration protocol and demonstrate how our unified inbox consolidates your communications in under 15 minutes. Would tomorrow at 2:00 PM CST work for a quick review?`;
    } else if (data.task === 'qualify_lead') {
      qualificationScore = 88;
      recommendedAction = 'High-intent lead with verified decision authority. Recommend immediate discovery appointment booking.';
      resultText = `Lead Qualification Assessment (Score: ${qualificationScore}/100):\n• Budget: High (Confirmed enterprise tier fit)\n• Authority: Direct Decision Maker (Executive / Founder)\n• Need: Clear bottleneck in current lead response time\n• Timeline: Immediate (Looking to deploy within 30 days)\n\nRecommendation: Fast-track to senior sales advisor.`;
    } else {
      resultText = `Executive Conversation Summary:\n• Client expressed strong interest in consolidating multiple disjointed tools into Prosumate.\n• Key priorities: Unified inbox, calendar booking sync, and automated SMS nurture sequences.\n• Next Step: Strategy consultation scheduled.`;
    }

    // Meter Token Usage against Phase 6 Credit Wallet
    const tokensUsed = Math.max(180, Math.min(1500, Math.round((data.prompt.length + resultText.length) / 3)));
    
    let costCents = 1;
    try {
      const usageRes = this.recordUsage(locationId, {
        type: 'ai_tokens',
        units: tokensUsed,
        description: `AI ${data.task.replace('_', ' ')} (${tokensUsed} tokens)`,
        rebillingMarginPercent: 20,
      });
      costCents = usageRes.transaction.amountCents;
    } catch {
      // If wallet not initialized or insufficient, track nominal charge
      costCents = Math.round(tokensUsed * 0.005 * 1.2);
    }

    config.tokensUsedTotal = (config.tokensUsedTotal || 0) + tokensUsed;

    const generation = {
      id: randomUUID(),
      agencyId: location?.agencyId || '',
      locationId,
      task: data.task,
      tone,
      prompt: data.prompt,
      resultText,
      tokensUsed,
      costCents,
      qualificationScore,
      recommendedAction,
      createdAt: new Date().toISOString(),
    };

    const list = this.aiGenerations.get(locationId) || [];
    list.unshift(generation);
    this.aiGenerations.set(locationId, list);

    return generation;
  }

  listAiGenerations(locationId: string) {
    return this.aiGenerations.get(locationId) || [];
  }

  // ==========================================
  // Marketplace, Webhooks & Enterprise (Phase 10)
  // ==========================================
  snapshots: Map<string, any> = new Map();
  webhooks: Map<string, any[]> = new Map();
  webhookLogs: Map<string, any[]> = new Map();
  ssoConfigs: Map<string, any> = new Map();

  createSnapshot(data: any) {
    const snapshot = {
      id: data.id || randomUUID(),
      name: data.name,
      slug: data.slug,
      category: data.category,
      description: data.description,
      icon: data.icon || 'Sparkles',
      pipelineTemplate: data.pipelineTemplate,
      calendarTemplate: data.calendarTemplate,
      formTemplate: data.formTemplate,
      workflowTemplate: data.workflowTemplate,
      aiPersonaTemplate: data.aiPersonaTemplate,
      installCount: data.installCount || 0,
      createdAt: new Date().toISOString(),
    };
    this.snapshots.set(snapshot.id, snapshot);
    return snapshot;
  }

  listSnapshots() {
    return Array.from(this.snapshots.values());
  }

  findSnapshotById(id: string) {
    return this.snapshots.get(id) || Array.from(this.snapshots.values()).find((s) => s.slug === id) || null;
  }

  installSnapshot(locationId: string, snapshotId: string) {
    const location = this.findLocationById(locationId);
    if (!location) throw new Error(`Location '${locationId}' not found`);

    const snapshot = this.findSnapshotById(snapshotId);
    if (!snapshot) throw new Error(`Snapshot '${snapshotId}' not found`);

    const installedAssets: Record<string, any> = {};

    // 1. Clone Pipeline
    if (snapshot.pipelineTemplate) {
      const pipeline = this.createPipeline({
        agencyId: location.agencyId,
        locationId,
        name: snapshot.pipelineTemplate.name,
        stages: snapshot.pipelineTemplate.stages.map((s: any) => ({ name: s.name, color: '#6366f1' })),
      });
      installedAssets.pipelineId = pipeline.id;
    }

    // 2. Clone Calendar
    if (snapshot.calendarTemplate) {
      const calendar = this.createCalendar({
        agencyId: location.agencyId,
        locationId,
        name: snapshot.calendarTemplate.name,
        slug: `${snapshot.slug}-cal-${Date.now().toString().slice(-4)}`,
        defaultDurationMinutes: snapshot.calendarTemplate.durationMinutes || 30,
        availability: [
          { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
          { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
          { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
          { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' },
          { dayOfWeek: 5, startTime: '09:00', endTime: '17:00' },
        ],
      });
      installedAssets.calendarId = calendar.id;
    }

    // 3. Clone Intake Form
    if (snapshot.formTemplate) {
      const form = this.createForm({
        agencyId: location.agencyId,
        locationId,
        name: snapshot.formTemplate.name,
        slug: `${snapshot.slug}-form-${Date.now().toString().slice(-4)}`,
        fields: snapshot.formTemplate.fields,
      });
      installedAssets.formId = form.id;
    }

    // 4. Clone Workflow
    if (snapshot.workflowTemplate) {
      const workflow = this.createWorkflow({
        agencyId: location.agencyId,
        locationId,
        name: snapshot.workflowTemplate.name,
        status: 'published',
        trigger: {
          type: snapshot.workflowTemplate.triggerType || 'FORM_SUBMITTED',
          config: {},
        },
        steps:
          snapshot.workflowTemplate.actions?.map((a: any, idx: number) => ({
            name: `Action ${idx + 1}`,
            actionType: a.type.toUpperCase(),
            config: a.parameters || {},
            order: idx,
          })) || [],
      });
      installedAssets.workflowId = workflow.id;
    }

    // 5. Clone AI Persona
    if (snapshot.aiPersonaTemplate) {
      this.updateAiConfig(locationId, snapshot.aiPersonaTemplate);
      installedAssets.aiConfigured = true;
    }

    snapshot.installCount = (snapshot.installCount || 0) + 1;

    this.addActivityEvent({
      contactId: locationId,
      type: 'SNAPSHOT_INSTALLED',
      title: 'Industry Snapshot Installed',
      description: `Installed '${snapshot.name}' into location.`,
      metadata: { snapshotId: snapshot.id, installedAssets },
    });

    return {
      success: true,
      snapshot: { id: snapshot.id, name: snapshot.name },
      installedAssets,
    };
  }

  // Webhooks
  createWebhook(locationId: string, data: { name: string; targetUrl: string; events: string[] }) {
    const location = this.findLocationById(locationId);
    const webhook = {
      id: randomUUID(),
      agencyId: location?.agencyId || '',
      locationId,
      name: data.name,
      targetUrl: data.targetUrl,
      events: data.events,
      secretKey: randomBytes(24).toString('hex'),
      status: 'active',
      lastDeliveredAt: null,
      createdAt: new Date().toISOString(),
    };

    const list = this.webhooks.get(locationId) || [];
    list.unshift(webhook);
    this.webhooks.set(locationId, list);
    return webhook;
  }

  listWebhooks(locationId: string) {
    return this.webhooks.get(locationId) || [];
  }

  findWebhookById(locationId: string, webhookId: string) {
    const list = this.webhooks.get(locationId) || [];
    return list.find((w) => w.id === webhookId) || null;
  }

  deleteWebhook(locationId: string, webhookId: string) {
    const list = this.webhooks.get(locationId) || [];
    const filtered = list.filter((w) => w.id !== webhookId);
    this.webhooks.set(locationId, filtered);
    return filtered.length !== list.length;
  }

  dispatchWebhook(locationId: string, webhookId: string, event: string, payload: any) {
    const webhook = this.findWebhookById(locationId, webhookId);
    if (!webhook) throw new Error(`Webhook '${webhookId}' not found`);

    const payloadString = JSON.stringify(payload);
    const signature = 'sha256=' + createHmac('sha256', webhook.secretKey).update(payloadString).digest('hex');

    const log = {
      id: randomUUID(),
      webhookId,
      event,
      payload,
      signature,
      responseStatus: 200,
      deliveredAt: new Date().toISOString(),
    };

    webhook.lastDeliveredAt = log.deliveredAt;

    const logs = this.webhookLogs.get(webhookId) || [];
    logs.unshift(log);
    this.webhookLogs.set(webhookId, logs);

    return log;
  }

  listWebhookLogs(webhookId: string) {
    return this.webhookLogs.get(webhookId) || [];
  }

  // Enterprise SSO
  getSsoConfig(locationId: string) {
    let sso = this.ssoConfigs.get(locationId);
    if (!sso) {
      const location = this.findLocationById(locationId);
      sso = {
        id: randomUUID(),
        agencyId: location?.agencyId || '',
        locationId,
        provider: 'saml',
        idpMetadataUrl: '',
        clientId: '',
        clientSecret: '',
        enforceSso: false,
        allowedDomains: [],
        updatedAt: new Date().toISOString(),
      };
      this.ssoConfigs.set(locationId, sso);
    }
    return sso;
  }

  updateSsoConfig(locationId: string, data: Partial<{
    provider: string;
    idpMetadataUrl: string;
    clientId: string;
    clientSecret: string;
    enforceSso: boolean;
    allowedDomains: string[];
  }>) {
    const sso = this.getSsoConfig(locationId);
    if (data.provider !== undefined) sso.provider = data.provider;
    if (data.idpMetadataUrl !== undefined) sso.idpMetadataUrl = data.idpMetadataUrl;
    if (data.clientId !== undefined) sso.clientId = data.clientId;
    if (data.clientSecret !== undefined) sso.clientSecret = data.clientSecret;
    if (data.enforceSso !== undefined) sso.enforceSso = data.enforceSso;
    if (data.allowedDomains !== undefined) sso.allowedDomains = data.allowedDomains;
    sso.updatedAt = new Date().toISOString();
    return sso;
  }

  // Audit Logs Export
  exportAuditLogs(locationId: string, format: 'csv' | 'json') {
    const logs = this.getAuditLogs({ locationId });
    if (format === 'json') {
      return JSON.stringify(logs, null, 2);
    }

    // CSV format
    const header = 'id,createdAt,action,entityType,entityId,actorId,actorEmail,metadata\n';
    const rows = logs
      .map((l) => {
        const meta = JSON.stringify(l.metadata || {}).replace(/"/g, '""');
        return `"${l.id}","${l.createdAt}","${l.action}","${l.entityType}","${l.entityId || ''}","${l.actorId || ''}","${l.actorEmail || ''}","${meta}"`;
      })
      .join('\n');

    return header + rows;
  }
}

export const memoryDb = new MemoryDatabase();
