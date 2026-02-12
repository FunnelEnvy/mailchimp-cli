import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import nock from 'nock';

const API_KEY = 'test-key-us21';
const BASE = 'https://us21.api.mailchimp.com';
const LIST_ID = 'abc123';

describe('members API', () => {
  beforeEach(() => {
    nock.disableNetConnect();
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  const mockMember = {
    id: 'mem1',
    email_address: 'user@example.com',
    unique_email_id: 'uniq1',
    status: 'subscribed',
    merge_fields: { FNAME: 'John', LNAME: 'Doe' },
    list_id: LIST_ID,
    timestamp_signup: '2024-01-01T00:00:00+00:00',
    timestamp_opt: '2024-01-01T00:00:00+00:00',
    last_changed: '2024-06-01T00:00:00+00:00',
  };

  it('lists members', async () => {
    const scope = nock(BASE)
      .get(`/3.0/lists/${LIST_ID}/members`)
      .query({ count: '10', offset: '0' })
      .reply(200, {
        members: [mockMember],
        total_items: 1,
        list_id: LIST_ID,
      });

    const { request } = await import('../lib/http.js');
    const { getAuthHeaders } = await import('../auth.js');

    const result = await request<{ members: unknown[]; total_items: number }>(
      `${BASE}/3.0/lists/${LIST_ID}/members`,
      {
        headers: getAuthHeaders(API_KEY),
        query: { count: '10', offset: '0' },
      },
    );

    expect(result.total_items).toBe(1);
    expect(result.members).toHaveLength(1);
    expect(scope.isDone()).toBe(true);
  });

  it('gets a member by hash', async () => {
    const { subscriberHash, getAuthHeaders } = await import('../auth.js');
    const { request } = await import('../lib/http.js');

    const hash = subscriberHash('user@example.com');
    const scope = nock(BASE)
      .get(`/3.0/lists/${LIST_ID}/members/${hash}`)
      .reply(200, mockMember);

    const result = await request<{ email_address: string }>(
      `${BASE}/3.0/lists/${LIST_ID}/members/${hash}`,
      { headers: getAuthHeaders(API_KEY) },
    );

    expect(result.email_address).toBe('user@example.com');
    expect(scope.isDone()).toBe(true);
  });

  it('adds a member', async () => {
    const scope = nock(BASE)
      .post(`/3.0/lists/${LIST_ID}/members`, {
        email_address: 'new@example.com',
        status: 'subscribed',
        merge_fields: { FNAME: 'Jane' },
      })
      .reply(200, {
        ...mockMember,
        id: 'mem2',
        email_address: 'new@example.com',
        merge_fields: { FNAME: 'Jane', LNAME: '' },
      });

    const { request } = await import('../lib/http.js');
    const { getAuthHeaders } = await import('../auth.js');

    const result = await request<{ email_address: string }>(
      `${BASE}/3.0/lists/${LIST_ID}/members`,
      {
        method: 'POST',
        headers: getAuthHeaders(API_KEY),
        body: {
          email_address: 'new@example.com',
          status: 'subscribed',
          merge_fields: { FNAME: 'Jane' },
        },
      },
    );

    expect(result.email_address).toBe('new@example.com');
    expect(scope.isDone()).toBe(true);
  });

  it('updates a member', async () => {
    const { subscriberHash, getAuthHeaders } = await import('../auth.js');
    const { request } = await import('../lib/http.js');

    const hash = subscriberHash('user@example.com');
    const scope = nock(BASE)
      .patch(`/3.0/lists/${LIST_ID}/members/${hash}`, {
        status: 'unsubscribed',
      })
      .reply(200, {
        ...mockMember,
        status: 'unsubscribed',
      });

    const result = await request<{ status: string }>(
      `${BASE}/3.0/lists/${LIST_ID}/members/${hash}`,
      {
        method: 'PATCH',
        headers: getAuthHeaders(API_KEY),
        body: { status: 'unsubscribed' },
      },
    );

    expect(result.status).toBe('unsubscribed');
    expect(scope.isDone()).toBe(true);
  });

  it('deletes a member', async () => {
    const { subscriberHash, getAuthHeaders } = await import('../auth.js');
    const { request } = await import('../lib/http.js');

    const hash = subscriberHash('user@example.com');
    const scope = nock(BASE)
      .delete(`/3.0/lists/${LIST_ID}/members/${hash}`)
      .reply(204);

    await request(
      `${BASE}/3.0/lists/${LIST_ID}/members/${hash}`,
      {
        method: 'DELETE',
        headers: getAuthHeaders(API_KEY),
      },
    );

    expect(scope.isDone()).toBe(true);
  });
});
