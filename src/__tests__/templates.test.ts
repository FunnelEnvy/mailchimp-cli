import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import nock from 'nock';

const API_KEY = 'test-key-us21';
const BASE = 'https://us21.api.mailchimp.com';

describe('templates API', () => {
  beforeEach(() => {
    nock.disableNetConnect();
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  it('lists templates', async () => {
    const scope = nock(BASE)
      .get('/3.0/templates')
      .query({ count: '10', offset: '0' })
      .reply(200, {
        templates: [
          {
            id: 101,
            type: 'user',
            name: 'Welcome Email',
            drag_and_drop: true,
            responsive: true,
            category: '',
            date_created: '2024-01-01T00:00:00+00:00',
            date_edited: '2024-06-01T00:00:00+00:00',
            active: true,
            folder_id: '',
          },
        ],
        total_items: 1,
      });

    const { request } = await import('../lib/http.js');
    const { getAuthHeaders } = await import('../auth.js');

    const result = await request<{ templates: unknown[]; total_items: number }>(
      `${BASE}/3.0/templates`,
      {
        headers: getAuthHeaders(API_KEY),
        query: { count: '10', offset: '0' },
      },
    );

    expect(result.total_items).toBe(1);
    expect(result.templates).toHaveLength(1);
    expect(scope.isDone()).toBe(true);
  });
});
