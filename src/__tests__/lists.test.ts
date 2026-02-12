import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import nock from 'nock';

const API_KEY = 'test-key-us21';
const BASE = 'https://us21.api.mailchimp.com';

describe('lists API', () => {
  beforeEach(() => {
    nock.disableNetConnect();
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  it('lists all audiences', async () => {
    const scope = nock(BASE)
      .get('/3.0/lists')
      .query({ count: '10', offset: '0' })
      .reply(200, {
        lists: [
          {
            id: 'abc123',
            web_id: 12345,
            name: 'My Newsletter',
            permission_reminder: 'You signed up',
            date_created: '2024-01-01T00:00:00+00:00',
            list_rating: 3,
            stats: {
              member_count: 1500,
              unsubscribe_count: 20,
              open_rate: 0.35,
              click_rate: 0.12,
            },
          },
          {
            id: 'def456',
            web_id: 67890,
            name: 'Product Updates',
            permission_reminder: 'You are a customer',
            date_created: '2024-06-15T00:00:00+00:00',
            list_rating: 4,
            stats: {
              member_count: 500,
              unsubscribe_count: 5,
              open_rate: 0.45,
              click_rate: 0.18,
            },
          },
        ],
        total_items: 2,
      });

    // Import the http module to test direct API call
    const { request } = await import('../lib/http.js');
    const { getAuthHeaders } = await import('../auth.js');

    const result = await request<{ lists: unknown[]; total_items: number }>(
      `${BASE}/3.0/lists`,
      {
        headers: getAuthHeaders(API_KEY),
        query: { count: '10', offset: '0' },
      },
    );

    expect(result.total_items).toBe(2);
    expect(result.lists).toHaveLength(2);
    expect(scope.isDone()).toBe(true);
  });

  it('gets a specific list', async () => {
    const scope = nock(BASE)
      .get('/3.0/lists/abc123')
      .reply(200, {
        id: 'abc123',
        web_id: 12345,
        name: 'My Newsletter',
        permission_reminder: 'You signed up',
        date_created: '2024-01-01T00:00:00+00:00',
        list_rating: 3,
        stats: {
          member_count: 1500,
          unsubscribe_count: 20,
          open_rate: 0.35,
          click_rate: 0.12,
        },
      });

    const { request } = await import('../lib/http.js');
    const { getAuthHeaders } = await import('../auth.js');

    const result = await request<{ id: string; name: string }>(
      `${BASE}/3.0/lists/abc123`,
      { headers: getAuthHeaders(API_KEY) },
    );

    expect(result.id).toBe('abc123');
    expect(result.name).toBe('My Newsletter');
    expect(scope.isDone()).toBe(true);
  });
});
