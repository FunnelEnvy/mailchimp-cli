import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import nock from 'nock';

const API_KEY = 'test-key-us21';
const BASE = 'https://us21.api.mailchimp.com';

describe('campaigns API', () => {
  beforeEach(() => {
    nock.disableNetConnect();
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  const mockCampaign = {
    id: 'camp1',
    web_id: 11111,
    type: 'regular',
    create_time: '2024-01-15T00:00:00+00:00',
    send_time: '2024-01-20T10:00:00+00:00',
    status: 'sent',
    emails_sent: 1500,
    content_type: 'template',
    recipients: {
      list_id: 'abc123',
      list_name: 'My Newsletter',
      recipient_count: 1500,
    },
    settings: {
      subject_line: 'January Newsletter',
      from_name: 'ACME Corp',
      reply_to: 'hello@acme.com',
      title: 'Jan 2024 Newsletter',
    },
  };

  it('lists campaigns', async () => {
    const scope = nock(BASE)
      .get('/3.0/campaigns')
      .query({ count: '10', offset: '0' })
      .reply(200, {
        campaigns: [mockCampaign],
        total_items: 1,
      });

    const { request } = await import('../lib/http.js');
    const { getAuthHeaders } = await import('../auth.js');

    const result = await request<{ campaigns: unknown[]; total_items: number }>(
      `${BASE}/3.0/campaigns`,
      {
        headers: getAuthHeaders(API_KEY),
        query: { count: '10', offset: '0' },
      },
    );

    expect(result.total_items).toBe(1);
    expect(result.campaigns).toHaveLength(1);
    expect(scope.isDone()).toBe(true);
  });

  it('gets a campaign', async () => {
    const scope = nock(BASE)
      .get('/3.0/campaigns/camp1')
      .reply(200, mockCampaign);

    const { request } = await import('../lib/http.js');
    const { getAuthHeaders } = await import('../auth.js');

    const result = await request<{ id: string; settings: { subject_line: string } }>(
      `${BASE}/3.0/campaigns/camp1`,
      { headers: getAuthHeaders(API_KEY) },
    );

    expect(result.id).toBe('camp1');
    expect(result.settings.subject_line).toBe('January Newsletter');
    expect(scope.isDone()).toBe(true);
  });

  it('creates a campaign', async () => {
    const body = {
      type: 'regular',
      recipients: { list_id: 'abc123' },
      settings: {
        subject_line: 'New Campaign',
        from_name: 'ACME',
        reply_to: 'hello@acme.com',
        title: 'New Campaign',
      },
    };

    const scope = nock(BASE)
      .post('/3.0/campaigns', body)
      .reply(200, {
        ...mockCampaign,
        id: 'camp2',
        status: 'save',
        settings: { ...mockCampaign.settings, subject_line: 'New Campaign' },
      });

    const { request } = await import('../lib/http.js');
    const { getAuthHeaders } = await import('../auth.js');

    const result = await request<{ id: string; status: string }>(
      `${BASE}/3.0/campaigns`,
      {
        method: 'POST',
        headers: getAuthHeaders(API_KEY),
        body,
      },
    );

    expect(result.id).toBe('camp2');
    expect(result.status).toBe('save');
    expect(scope.isDone()).toBe(true);
  });

  it('sends a campaign', async () => {
    const scope = nock(BASE)
      .post('/3.0/campaigns/camp1/actions/send')
      .reply(204);

    const { request } = await import('../lib/http.js');
    const { getAuthHeaders } = await import('../auth.js');

    await request(
      `${BASE}/3.0/campaigns/camp1/actions/send`,
      {
        method: 'POST',
        headers: getAuthHeaders(API_KEY),
      },
    );

    expect(scope.isDone()).toBe(true);
  });
});
