import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import nock from 'nock';

const API_KEY = 'test-key-us21';
const BASE = 'https://us21.api.mailchimp.com';

describe('automations API', () => {
  beforeEach(() => {
    nock.disableNetConnect();
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  it('lists automations', async () => {
    const scope = nock(BASE)
      .get('/3.0/automations')
      .query({ count: '10', offset: '0' })
      .reply(200, {
        automations: [
          {
            id: 'auto1',
            create_time: '2024-01-01T00:00:00+00:00',
            start_time: '2024-01-02T00:00:00+00:00',
            status: 'sending',
            emails_sent: 500,
            recipients: {
              list_id: 'abc123',
              list_name: 'My Newsletter',
            },
            settings: {
              title: 'Welcome Series',
              from_name: 'ACME Corp',
              reply_to: 'hello@acme.com',
            },
            trigger_settings: {
              workflow_type: 'welcomeSeries',
            },
          },
        ],
        total_items: 1,
      });

    const { request } = await import('../lib/http.js');
    const { getAuthHeaders } = await import('../auth.js');

    const result = await request<{ automations: unknown[]; total_items: number }>(
      `${BASE}/3.0/automations`,
      {
        headers: getAuthHeaders(API_KEY),
        query: { count: '10', offset: '0' },
      },
    );

    expect(result.total_items).toBe(1);
    expect(result.automations).toHaveLength(1);
    expect(scope.isDone()).toBe(true);
  });
});
