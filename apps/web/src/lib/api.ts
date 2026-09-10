function getApiUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes('localhost')) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname.includes('railway.app')) {
    return 'https://prosumateapi-production.up.railway.app';
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    total?: number;
    [key: string]: unknown;
  };
  requestId?: string;
}

class ApiClient {
  private getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('prosumate_token');
  }

  setAccessToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('prosumate_token', token);
    }
  }

  clearAccessToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('prosumate_token');
      localStorage.removeItem('prosumate_active_agency');
      localStorage.removeItem('prosumate_active_location');
    }
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const token = this.getAccessToken();
    const headers: Record<string, string> = {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...((options.headers as Record<string, string>) || {}),
    };

    try {
      const response = await fetch(`${getApiUrl()}${endpoint}`, {
        ...options,
        headers,
      });

      const json = await response.json();
      return json;
    } catch (err: any) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: err.message || 'Unable to reach the server. Ensure the API is running.',
        },
      };
    }
  }

  // Auth endpoints
  async register(data: any) {
    return this.request<any>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: any) {
    return this.request<any>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMe() {
    return this.request<any>('/api/v1/auth/me');
  }

  async logout() {
    const res = await this.request<any>('/api/v1/auth/logout', { method: 'POST' });
    this.clearAccessToken();
    return res;
  }

  // Agencies
  async getAgencies() {
    return this.request<any[]>('/api/v1/agencies');
  }

  async getAgency(agencyId: string) {
    return this.request<any>(`/api/v1/agencies/${agencyId}`);
  }

  // Locations
  async getLocations(agencyId: string) {
    return this.request<any[]>(`/api/v1/locations/agency/${agencyId}`);
  }

  async createLocation(agencyId: string, data: any) {
    return this.request<any>(`/api/v1/locations/agency/${agencyId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getLocationUsers(locationId: string) {
    return this.request<any[]>(`/api/v1/locations/${locationId}/users`);
  }

  // Audit Logs
  async getAuditLogs(params?: { agencyId?: string; locationId?: string }) {
    const query = new URLSearchParams();
    if (params?.agencyId) query.set('agencyId', params.agencyId);
    if (params?.locationId) query.set('locationId', params.locationId);
    return this.request<any[]>(`/api/v1/audit-logs?${query.toString()}`);
  }

  // CRM Contacts
  async getContacts(locationId: string, params?: { search?: string; status?: string; tag?: string }) {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.status) query.set('status', params.status);
    if (params?.tag) query.set('tag', params.tag);
    return this.request<any[]>(`/api/v1/locations/${locationId}/contacts?${query.toString()}`);
  }

  async createContact(locationId: string, data: any) {
    return this.request<any>(`/api/v1/locations/${locationId}/contacts`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getContact(locationId: string, contactId: string) {
    return this.request<any>(`/api/v1/locations/${locationId}/contacts/${contactId}`);
  }

  async updateContact(locationId: string, contactId: string, data: any) {
    return this.request<any>(`/api/v1/locations/${locationId}/contacts/${contactId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteContact(locationId: string, contactId: string) {
    return this.request<any>(`/api/v1/locations/${locationId}/contacts/${contactId}`, {
      method: 'DELETE',
    });
  }

  async addContactNote(locationId: string, contactId: string, content: string) {
    return this.request<any>(`/api/v1/locations/${locationId}/contacts/${contactId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  async addContactTask(locationId: string, contactId: string, task: any) {
    return this.request<any>(`/api/v1/locations/${locationId}/contacts/${contactId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(task),
    });
  }

  // CRM Pipelines & Opportunities
  async getPipelines(locationId: string) {
    return this.request<any[]>(`/api/v1/locations/${locationId}/pipelines`);
  }

  async getPipelineBoard(locationId: string, pipelineId: string) {
    return this.request<any>(`/api/v1/locations/${locationId}/pipelines/${pipelineId}/board`);
  }

  async createOpportunity(locationId: string, data: any) {
    return this.request<any>(`/api/v1/locations/${locationId}/opportunities`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async moveOpportunityStage(locationId: string, opportunityId: string, stageId: string) {
    return this.request<any>(`/api/v1/locations/${locationId}/opportunities/${opportunityId}/stage`, {
      method: 'PATCH',
      body: JSON.stringify({ stageId }),
    });
  }

  // Calendars & Appointments (Phase 3)
  async getCalendars(locationId: string) {
    return this.request<any[]>(`/api/v1/locations/${locationId}/calendars`);
  }

  async createCalendar(locationId: string, data: any) {
    return this.request<any>(`/api/v1/locations/${locationId}/calendars`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCalendar(locationId: string, calendarId: string) {
    return this.request<any>(`/api/v1/locations/${locationId}/calendars/${calendarId}`);
  }

  async getCalendarSlots(locationId: string, calendarId: string, date?: string) {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    return this.request<any>(`/api/v1/locations/${locationId}/calendars/${calendarId}/slots${query}`);
  }

  async bookAppointment(locationId: string, calendarId: string, data: any) {
    return this.request<any>(`/api/v1/locations/${locationId}/calendars/${calendarId}/book`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAppointmentStatus(locationId: string, appointmentId: string, status: string, notes?: string) {
    return this.request<any>(`/api/v1/locations/${locationId}/appointments/${appointmentId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
  }

  // Forms & Lead Capture (Phase 3)
  async getForms(locationId: string) {
    return this.request<any[]>(`/api/v1/locations/${locationId}/forms`);
  }

  async createForm(locationId: string, data: any) {
    return this.request<any>(`/api/v1/locations/${locationId}/forms`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getForm(locationId: string, formId: string) {
    return this.request<any>(`/api/v1/locations/${locationId}/forms/${formId}`);
  }

  async getFormSubmissions(locationId: string, formId: string) {
    return this.request<any[]>(`/api/v1/locations/${locationId}/forms/${formId}/submissions`);
  }

  async submitPublicForm(formSlug: string, data: Record<string, unknown>) {
    return this.request<any>(`/api/v1/public/forms/${formSlug}/submit`, {
      method: 'POST',
      body: JSON.stringify({ data }),
    });
  }

  // Conversations & Unified Inbox (Phase 4)
  async getConversations(locationId: string, filters?: { channel?: string; search?: string }) {
    const params = new URLSearchParams();
    if (filters?.channel) params.set('channel', filters.channel);
    if (filters?.search) params.set('search', filters.search);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request<any[]>(`/api/v1/locations/${locationId}/conversations${qs}`);
  }

  async startConversation(locationId: string, data: any) {
    return this.request<any>(`/api/v1/locations/${locationId}/conversations`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getConversation(locationId: string, conversationId: string) {
    return this.request<any>(`/api/v1/locations/${locationId}/conversations/${conversationId}`);
  }

  async getMessages(locationId: string, conversationId: string) {
    return this.request<any[]>(`/api/v1/locations/${locationId}/conversations/${conversationId}/messages`);
  }

  async sendMessage(locationId: string, conversationId: string, data: any) {
    return this.request<any>(`/api/v1/locations/${locationId}/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async markConversationRead(locationId: string, conversationId: string) {
    return this.request<any>(`/api/v1/locations/${locationId}/conversations/${conversationId}/read`, {
      method: 'POST',
    });
  }

  // Automation & Workflows (Phase 5)
  async getWorkflowFolders(locationId: string) {
    return this.request<any[]>(`/api/v1/locations/${locationId}/workflow-folders`);
  }

  async createWorkflowFolder(
    locationId: string,
    data: { name: string; color?: string | null; icon?: string | null }
  ) {
    return this.request<any>(`/api/v1/locations/${locationId}/workflow-folders`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateWorkflowFolder(
    locationId: string,
    folderId: string,
    data: { name?: string; color?: string | null; icon?: string | null }
  ) {
    return this.request<any>(`/api/v1/locations/${locationId}/workflow-folders/${folderId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteWorkflowFolder(locationId: string, folderId: string) {
    return this.request<any>(`/api/v1/locations/${locationId}/workflow-folders/${folderId}`, {
      method: 'DELETE',
    });
  }

  async getWorkflows(locationId: string) {
    return this.request<any[]>(`/api/v1/locations/${locationId}/workflows`);
  }

  async getWorkflowTrash(locationId: string) {
    return this.request<any[]>(`/api/v1/locations/${locationId}/workflows/trash`);
  }

  async createWorkflow(locationId: string, data: any) {
    return this.request<any>(`/api/v1/locations/${locationId}/workflows`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getWorkflow(locationId: string, workflowId: string) {
    return this.request<any>(`/api/v1/locations/${locationId}/workflows/${workflowId}`);
  }

  async updateWorkflow(locationId: string, workflowId: string, data: any) {
    return this.request<any>(`/api/v1/locations/${locationId}/workflows/${workflowId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteWorkflow(locationId: string, workflowId: string) {
    return this.request<any>(`/api/v1/locations/${locationId}/workflows/${workflowId}`, {
      method: 'DELETE',
    });
  }

  async restoreWorkflow(locationId: string, workflowId: string) {
    return this.request<any>(`/api/v1/locations/${locationId}/workflows/${workflowId}/restore`, {
      method: 'POST',
    });
  }

  async duplicateWorkflow(locationId: string, workflowId: string, data: { name?: string } = {}) {
    return this.request<any>(`/api/v1/locations/${locationId}/workflows/${workflowId}/duplicate`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async moveWorkflowToFolder(locationId: string, workflowId: string, folderId: string | null) {
    return this.request<any>(`/api/v1/locations/${locationId}/workflows/${workflowId}/move`, {
      method: 'PATCH',
      body: JSON.stringify({ folderId }),
    });
  }

  async testRunWorkflow(locationId: string, workflowId: string, data: { contactId: string; triggerData?: any }) {
    return this.request<any>(`/api/v1/locations/${locationId}/workflows/${workflowId}/test`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getWorkflowExecutions(locationId: string, workflowId: string) {
    return this.request<any[]>(`/api/v1/locations/${locationId}/workflows/${workflowId}/executions`);
  }

  // Stripe Billing & Usage Metering (Phase 6)
  async getPlans() {
    return this.request<any[]>('/api/v1/billing/plans');
  }

  async getLocationSubscription(locationId: string) {
    return this.request<any>(`/api/v1/locations/${locationId}/billing/subscription`);
  }

  async subscribeLocation(locationId: string, data: { planId: string; paymentMethodId?: string }) {
    return this.request<any>(`/api/v1/locations/${locationId}/billing/subscription`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async cancelLocationSubscription(locationId: string) {
    return this.request<any>(`/api/v1/locations/${locationId}/billing/subscription`, {
      method: 'DELETE',
    });
  }

  async getWallet(locationId: string) {
    return this.request<any>(`/api/v1/locations/${locationId}/billing/wallet`);
  }

  async topUpWallet(locationId: string, data: { amountCents: number; paymentMethodId?: string }) {
    return this.request<any>(`/api/v1/locations/${locationId}/billing/wallet/topup`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateWalletConfig(locationId: string, data: any) {
    return this.request<any>(`/api/v1/locations/${locationId}/billing/wallet/config`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getUsageTransactions(locationId: string) {
    return this.request<any[]>(`/api/v1/locations/${locationId}/billing/usage`);
  }

  async getInvoices(locationId: string) {
    return this.request<any[]>(`/api/v1/locations/${locationId}/billing/invoices`);
  }

  // Landing Pages, Funnels & Page Builder (Phase 7)
  async getFunnels(locationId: string) {
    return this.request<any[]>(`/api/v1/locations/${locationId}/funnels`);
  }

  async createFunnel(locationId: string, data: any) {
    return this.request<any>(`/api/v1/locations/${locationId}/funnels`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getFunnel(locationId: string, funnelId: string) {
    return this.request<any>(`/api/v1/locations/${locationId}/funnels/${funnelId}`);
  }

  async updateFunnel(locationId: string, funnelId: string, data: any) {
    return this.request<any>(`/api/v1/locations/${locationId}/funnels/${funnelId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteFunnel(locationId: string, funnelId: string) {
    return this.request<any>(`/api/v1/locations/${locationId}/funnels/${funnelId}`, {
      method: 'DELETE',
    });
  }

  async getPublicFunnel(slug: string) {
    return this.request<any>(`/api/v1/public/funnels/${slug}`);
  }

  async recordFunnelEvent(slug: string, data: { stepSlug: string; type: 'view' | 'conversion' }) {
    return this.request<any>(`/api/v1/public/funnels/${slug}/events`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Reporting, Attribution & Reputation (Phase 8)
  async getAttributionReport(locationId: string, model: string = 'last_touch') {
    return this.request<any>(`/api/v1/locations/${locationId}/reporting/attribution?model=${model}`);
  }

  async getSalesLeaderboard(locationId: string) {
    return this.request<any[]>(`/api/v1/locations/${locationId}/reporting/sales-leaderboard`);
  }

  async addCampaignMetric(locationId: string, data: any) {
    return this.request<any>(`/api/v1/locations/${locationId}/reporting/campaigns`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCustomerReviews(locationId: string) {
    return this.request<any[]>(`/api/v1/locations/${locationId}/reputation/reviews`);
  }

  async replyToReview(locationId: string, reviewId: string, replyText: string) {
    return this.request<any>(`/api/v1/locations/${locationId}/reputation/reviews/${reviewId}/reply`, {
      method: 'POST',
      body: JSON.stringify({ replyText }),
    });
  }

  async sendReviewRequest(locationId: string, data: any) {
    return this.request<any>(`/api/v1/locations/${locationId}/reputation/requests`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getReviewRequests(locationId: string) {
    return this.request<any[]>(`/api/v1/locations/${locationId}/reputation/requests`);
  }

  async getPublicReviews(locationId: string) {
    return this.request<any>(`/api/v1/public/locations/${locationId}/reviews`);
  }

  async submitPublicReview(locationId: string, data: any) {
    return this.request<any>(`/api/v1/public/locations/${locationId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // AI Tools & Assistants (Phase 9)
  async getAiConfig(locationId: string) {
    return this.request<any>(`/api/v1/locations/${locationId}/ai/config`);
  }

  async updateAiConfig(locationId: string, data: any) {
    return this.request<any>(`/api/v1/locations/${locationId}/ai/config`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async generateAiText(locationId: string, data: any) {
    return this.request<any>(`/api/v1/locations/${locationId}/ai/generate`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAiHistory(locationId: string) {
    return this.request<any[]>(`/api/v1/locations/${locationId}/ai/history`);
  }

  // Marketplace, Webhooks & Enterprise (Phase 10)
  async getSnapshots() {
    return this.request<any[]>('/api/v1/marketplace/snapshots');
  }

  async installSnapshot(locationId: string, snapshotId: string) {
    return this.request<any>(`/api/v1/locations/${locationId}/marketplace/install/${snapshotId}`, {
      method: 'POST',
    });
  }

  async getWebhooks(locationId: string) {
    return this.request<any[]>(`/api/v1/locations/${locationId}/webhooks`);
  }

  async createWebhook(locationId: string, data: any) {
    return this.request<any>(`/api/v1/locations/${locationId}/webhooks`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteWebhook(locationId: string, webhookId: string) {
    return this.request<any>(`/api/v1/locations/${locationId}/webhooks/${webhookId}`, {
      method: 'DELETE',
    });
  }

  async testWebhook(locationId: string, webhookId: string) {
    return this.request<any>(`/api/v1/locations/${locationId}/webhooks/${webhookId}/test`, {
      method: 'POST',
    });
  }

  async getSsoConfig(locationId: string) {
    return this.request<any>(`/api/v1/locations/${locationId}/sso`);
  }

  async updateSsoConfig(locationId: string, data: any) {
    return this.request<any>(`/api/v1/locations/${locationId}/sso`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async exportAuditLogs(locationId: string, format: 'csv' | 'json') {
    const res = await fetch(`http://localhost:4000/api/v1/locations/${locationId}/audit-logs/export?format=${format}`, {
      headers: {
        authorization: `Bearer ${localStorage.getItem('prosumate_token') || ''}`,
      },
    });
    return res.text();
  }

  // Health
  async getHealth() {
    return this.request<any>('/health');
  }
}

export const api = new ApiClient();
