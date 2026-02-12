import { describe, it, expect } from 'vitest';
import { buildUrl, HttpError } from '../lib/http.js';

describe('buildUrl', () => {
  it('returns base URL when no query params', () => {
    expect(buildUrl('https://us21.api.mailchimp.com/3.0/lists')).toBe(
      'https://us21.api.mailchimp.com/3.0/lists',
    );
  });

  it('appends query params', () => {
    const url = buildUrl('https://us21.api.mailchimp.com/3.0/lists', {
      count: 10,
      offset: 0,
    });
    expect(url).toContain('count=10');
    expect(url).toContain('offset=0');
  });

  it('filters out undefined values', () => {
    const url = buildUrl('https://us21.api.mailchimp.com/3.0/lists', {
      count: 10,
      status: undefined,
    });
    expect(url).toContain('count=10');
    expect(url).not.toContain('status');
  });
});

describe('HttpError', () => {
  it('creates error with properties', () => {
    const err = new HttpError('test', 'TEST_CODE', 400, 30);
    expect(err.message).toBe('test');
    expect(err.code).toBe('TEST_CODE');
    expect(err.status).toBe(400);
    expect(err.retryAfter).toBe(30);
    expect(err.name).toBe('HttpError');
  });
});
