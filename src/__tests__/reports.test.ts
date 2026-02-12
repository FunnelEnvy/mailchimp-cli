import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import nock from 'nock';

const API_KEY = 'test-key-us21';
const BASE = 'https://us21.api.mailchimp.com';

describe('reports API', () => {
  beforeEach(() => {
    nock.disableNetConnect();
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  const mockReport = {
    id: 'camp1',
    campaign_title: 'January Newsletter',
    type: 'regular',
    list_id: 'abc123',
    list_name: 'My Newsletter',
    subject_line: 'January Newsletter',
    emails_sent: 1500,
    abuse_reports: 0,
    unsubscribed: 3,
    send_time: '2024-01-20T10:00:00+00:00',
    opens: {
      opens_total: 800,
      unique_opens: 600,
      open_rate: 0.4,
    },
    clicks: {
      clicks_total: 200,
      unique_clicks: 150,
      click_rate: 0.1,
    },
    bounces: {
      hard_bounces: 5,
      soft_bounces: 10,
    },
  };

  it('gets a campaign report', async () => {
    const scope = nock(BASE)
      .get('/3.0/reports/camp1')
      .reply(200, mockReport);

    const { request } = await import('../lib/http.js');
    const { getAuthHeaders } = await import('../auth.js');

    const result = await request<{
      id: string;
      emails_sent: number;
      opens: { open_rate: number };
    }>(
      `${BASE}/3.0/reports/camp1`,
      { headers: getAuthHeaders(API_KEY) },
    );

    expect(result.id).toBe('camp1');
    expect(result.emails_sent).toBe(1500);
    expect(result.opens.open_rate).toBe(0.4);
    expect(scope.isDone()).toBe(true);
  });

  it('lists all reports', async () => {
    const scope = nock(BASE)
      .get('/3.0/reports')
      .query({ count: '10', offset: '0' })
      .reply(200, {
        reports: [mockReport],
        total_items: 1,
      });

    const { request } = await import('../lib/http.js');
    const { getAuthHeaders } = await import('../auth.js');

    const result = await request<{ reports: unknown[]; total_items: number }>(
      `${BASE}/3.0/reports`,
      {
        headers: getAuthHeaders(API_KEY),
        query: { count: '10', offset: '0' },
      },
    );

    expect(result.total_items).toBe(1);
    expect(result.reports).toHaveLength(1);
    expect(scope.isDone()).toBe(true);
  });
});
