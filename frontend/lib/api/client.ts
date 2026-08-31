export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = 'An error occurred while fetching the data.';
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorMessage;
    } catch {
      errorMessage = response.statusText;
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export async function downloadAPI(endpoint: string, filename: string) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers = {
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };

  const response = await fetch(url, { headers });

  if (!response.ok) {
    let errorMessage = 'An error occurred while downloading the data.';
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorMessage;
    } catch {
      errorMessage = response.statusText;
    }
    throw new Error(errorMessage);
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
}

// ------------------------------------------------------------------
// System Health
// ------------------------------------------------------------------
export const systemApi = {
  checkCeleryHealth: () => {
    return fetch(`${API_BASE_URL}/health/celery`).then((res) => res.json());
  }
};

// ------------------------------------------------------------------
// Auth
// ------------------------------------------------------------------
export const authApi = {
  login: (data: FormData) => {
    // Special case for login which uses application/x-www-form-urlencoded
    const url = `${API_BASE_URL}/auth/login`;
    return fetch(url, {
      method: 'POST',
      body: data,
    }).then(async (response) => {
      if (!response.ok) {
        let errorMessage = 'Login failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } catch {
          errorMessage = response.statusText;
        }
        throw new Error(errorMessage);
      }
      return response.json();
    });
  },
  getMe: () => fetchAPI('/auth/me'),
};

// ------------------------------------------------------------------
// Organizations
// ------------------------------------------------------------------
export interface Organization {
  id: number;
  name: string;
  slug: string;
  created_at: string;
}

export const organizationsApi = {
  getOrganization: (id: number) => fetchAPI(`/organizations/${id}`),
};

// ------------------------------------------------------------------
// Brand Brain
// ------------------------------------------------------------------
export interface BrandProfile {
  id?: number;
  organization_id?: number;
  name: string;
  description?: string;
  products?: string[];
  target_audience?: string[];
  tone?: string;
  approved_messaging?: string[];
  prohibited_words?: string[];
  prohibited_claims?: string[];
  guidelines?: string;
}

export const brandApi = {
  getBrandProfile: (orgId: number) => fetchAPI(`/organizations/${orgId}/brand`),
  createBrandProfile: (orgId: number, data: BrandProfile) =>
    fetchAPI(`/organizations/${orgId}/brand`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateBrandProfile: (orgId: number, data: Partial<BrandProfile>) =>
    fetchAPI(`/organizations/${orgId}/brand`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

// ------------------------------------------------------------------
// Social Accounts
// ------------------------------------------------------------------
export interface SocialAccount {
  id: number;
  organization_id: number;
  platform: 'LINKEDIN' | 'INSTAGRAM' | 'FACEBOOK' | 'X';
  external_account_id: string;
  account_name?: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'EXPIRED' | 'ERROR';
  token_expires_at?: string;
}

export const socialAccountsApi = {
  getAccounts: (orgId: number) => fetchAPI(`/organizations/${orgId}/social-accounts`),
  connectAccount: (orgId: number, data: { platform: string; external_account_id: string; account_name?: string }) =>
    fetchAPI(`/organizations/${orgId}/social-accounts`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  connectMetaAccount: (orgId: number, accessToken: string) =>
    fetchAPI(`/organizations/${orgId}/meta/connect`, {
      method: 'POST',
      body: JSON.stringify({ access_token: accessToken }),
    }),
};

// ------------------------------------------------------------------
// Campaigns
// ------------------------------------------------------------------
export interface Campaign {
  id: number;
  organization_id: number;
  name: string;
  objective?: string;
  topic?: string;
  target_audience?: string[];
  tone?: string;
  cta?: string;
  status: string;
  reply_status?: string;
  ai_draft_response?: string;
  start_date?: string;
  end_date?: string;
  created_at: string;
}

export const campaignsApi = {
  getCampaigns: (orgId: number) => fetchAPI(`/organizations/${orgId}/campaigns`),
  createCampaign: (orgId: number, data: Partial<Campaign>) =>
    fetchAPI(`/organizations/${orgId}/campaigns`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCampaign: (orgId: number, campaignId: number, data: Partial<Campaign>) =>
    fetchAPI(`/organizations/${orgId}/campaigns/${campaignId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  generateCampaignContent: (orgId: number, campaignId: number, platforms: string[], format?: string) =>
    fetchAPI(`/organizations/${orgId}/campaigns/${campaignId}/generate-content`, {
      method: 'POST',
      body: JSON.stringify({ platforms, format: format || "Standard Post" }),
    }),
};
export interface ContentItem {
  id: number;
  [key: string]: unknown;
}

export interface Schedule {
  id: number;
  [key: string]: unknown;
}

export const contentApi = {
  submitReview: (orgId: number, contentId: number, variantId: number) =>
    fetchAPI(`/organizations/${orgId}/content/${contentId}/variants/${variantId}/submit-review`, { method: 'POST' }),
  approve: (orgId: number, contentId: number, variantId: number) =>
    fetchAPI(`/organizations/${orgId}/content/${contentId}/variants/${variantId}/approve`, { method: 'POST' }),
  reject: (orgId: number, contentId: number, variantId: number, reason: string) =>
    fetchAPI(`/organizations/${orgId}/content/${contentId}/variants/${variantId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  editVariant: (orgId: number, contentId: number, variantId: number, data: Record<string, unknown>) =>
    fetchAPI(`/organizations/${orgId}/content/${contentId}/variants/${variantId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  publishContent: (orgId: number, data: Record<string, unknown>) =>
    fetchAPI(`/organizations/${orgId}/content/publish`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const schedulesApi = {
  scheduleVariant: (orgId: number, variantId: number, data: Record<string, unknown>) =>
    fetchAPI(`/organizations/${orgId}/content/variants/${variantId}/schedule`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getCalendarEvents: (orgId: number) => fetchAPI(`/organizations/${orgId}/calendar`),
};

export const analyticsApi = {
  getOverview: (orgId: number, params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetchAPI(`/organizations/${orgId}/analytics/overview${qs}`);
  },
  getTrends: (orgId: number, params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetchAPI(`/organizations/${orgId}/analytics/trends${qs}`);
  },
  getPlatforms: (orgId: number, params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetchAPI(`/organizations/${orgId}/analytics/platforms${qs}`);
  },
  getTopContent: (orgId: number) => fetchAPI(`/organizations/${orgId}/analytics/top-content`),
  getPostAnalytics: (orgId: number, postId: number) => fetchAPI(`/organizations/${orgId}/analytics/posts/${postId}`),
  exportAnalytics: (orgId: number) => fetchAPI(`/organizations/${orgId}/analytics/export`),
  getRecommendations: (orgId: number) => fetchAPI(`/organizations/${orgId}/analytics/recommendations`),
  syncAnalytics: (orgId: number) => fetchAPI(`/organizations/${orgId}/analytics/sync`, { method: 'POST' })
};

export interface EngagementItem {
  id: number;
  platform: string;
  author_name: string;
  author_handle: string;
  author_avatar?: string;
  content: string;
  sentiment?: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  status: string;
  reply_status?: string;
  ai_draft_response?: string;
  created_at: string;
  ai_draft_reply?: string;
}

export interface EmailCampaign {
  id: number;
  name: string;
  audience_name?: string;
  recipient_count?: number;
  subject?: string;
  status: string;
  reply_status?: string;
  ai_draft_response?: string;
  audience_id?: number;
  campaign_id?: number;
  body_html?: string;
  scheduled_at?: string;
  created_at?: string;
}

export interface Trend {
  id: number;
  topic: string;
  volume: number;
  momentum: number;
  source: string;
  category: string;
  relevance_score?: number;
  ai_analysis?: string;
  title?: string;
  description?: string;
}

export interface Audience {
  id: number;
  name: string;
  description?: string;
  contact_count?: number;
}

export interface Lead {
  id: number;
  name: string;
  email: string;
  status: string;
  reply_status?: string;
  ai_draft_response?: string;
  score?: number;
  phone?: string;
  source?: string;
  notes?: string;
}

export interface PlatformMetric {
  platform: string;
  impressions: number;
  engagements: number;
  clicks: number;
  conversion_rate?: number;
  published_post_id?: number;
  title?: string;
  content_preview?: string;
  engagement_rate?: number;
}

export interface AnalyticsOverview {
  impressions: number;
  reach: number;
  engagements: number;
  clicks: number;
  engagement_rate: number;
  posts_published: number;
  followers: number;
}

export const engagementApi = {
  getEngagements: (orgId: number, params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetchAPI(`/organizations/${orgId}/engagements${qs}`);
  },
  syncEngagement: (orgId: number) => fetchAPI(`/organizations/${orgId}/engagements/sync`, { method: 'POST' }),
  generateReply: (orgId: number, engagementId: number) => fetchAPI(`/organizations/${orgId}/engagements/${engagementId}/generate-reply`, { method: 'POST' }),
  updateReply: (orgId: number, engagementId: number, reply: string) => fetchAPI(`/organizations/${orgId}/engagements/${engagementId}/reply`, {
    method: 'PATCH',
    body: JSON.stringify({ reply })
  }),
  approveReply: (orgId: number, engagementId: number) => fetchAPI(`/organizations/${orgId}/engagements/${engagementId}/approve-reply`, { method: 'POST' }),
  sendReply: (orgId: number, engagementId: number) => fetchAPI(`/organizations/${orgId}/engagements/${engagementId}/send-reply`, { method: 'POST' })
};

export const emailApi = {
  getEmails: (orgId: number) => fetchAPI(`/organizations/${orgId}/email-campaigns`),
  getEmail: (orgId: number, emailId: number) => fetchAPI(`/organizations/${orgId}/email-campaigns/${emailId}`),
  createEmail: (orgId: number, data: Partial<EmailCampaign>) => fetchAPI(`/organizations/${orgId}/email-campaigns`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  generateEmail: (orgId: number, emailId: number) => fetchAPI(`/organizations/${orgId}/email-campaigns/${emailId}/generate`, { method: 'POST' }),
  updateEmail: (orgId: number, emailId: number, data: Partial<EmailCampaign>) => fetchAPI(`/organizations/${orgId}/email-campaigns/${emailId}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  }),
  approveEmail: (orgId: number, emailId: number) => fetchAPI(`/organizations/${orgId}/email-campaigns/${emailId}/approve`, { method: 'POST' }),
  scheduleEmail: (orgId: number, emailId: number, scheduled_at: string) => fetchAPI(`/organizations/${orgId}/email-campaigns/${emailId}/schedule`, {
    method: 'POST',
    body: JSON.stringify({ scheduled_at })
  }),
  sendEmail: (orgId: number, emailId: number) => fetchAPI(`/organizations/${orgId}/email-campaigns/${emailId}/send`, { method: 'POST' }),
  getAnalytics: (orgId: number, emailId: number) => fetchAPI(`/organizations/${orgId}/email-campaigns/${emailId}/analytics`)
};

// ------------------------------------------------------------------
// Trends
// ------------------------------------------------------------------
export const trendsApi = {
  getTrends: (orgId: number) => fetchAPI(`/organizations/${orgId}/trends`),
  evaluateTrend: (orgId: number, trendId: number) => fetchAPI(`/organizations/${orgId}/trends/${trendId}/evaluate`, { method: 'POST' }),
  createTrend: (orgId: number, data: Partial<Trend>) => fetchAPI(`/organizations/${orgId}/trends`, { method: 'POST', body: JSON.stringify(data) }),
  fetchLiveTrends: (orgId: number) => fetchAPI(`/organizations/${orgId}/trends/fetch`, { method: 'POST' }),
};

// ------------------------------------------------------------------
// Audiences
// ------------------------------------------------------------------
export const audiencesApi = {
  getAudiences: (orgId: number) => fetchAPI(`/organizations/${orgId}/audiences`),
  createAudience: (orgId: number, data: Partial<Audience>) => fetchAPI(`/organizations/${orgId}/audiences`, { method: 'POST', body: JSON.stringify(data) }),
  updateAudience: (orgId: number, id: number, data: Partial<Audience>) => fetchAPI(`/organizations/${orgId}/audiences/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAudience: (orgId: number, id: number) => fetchAPI(`/organizations/${orgId}/audiences/${id}`, { method: 'DELETE' }),
  exportAudiences: (orgId: number) => fetchAPI(`/organizations/${orgId}/audiences/export`)
};

// ------------------------------------------------------------------
// Leads
// ------------------------------------------------------------------
export const leadsApi = {
  getLeads: (orgId: number) => fetchAPI(`/organizations/${orgId}/leads`),
  createLead: (orgId: number, data: Partial<Lead>) => fetchAPI(`/organizations/${orgId}/leads`, { method: 'POST', body: JSON.stringify(data) }),
  updateLead: (orgId: number, id: number, data: Partial<Lead>) => fetchAPI(`/organizations/${orgId}/leads/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteLead: (orgId: number, id: number) => fetchAPI(`/organizations/${orgId}/leads/${id}`, { method: 'DELETE' })
};

