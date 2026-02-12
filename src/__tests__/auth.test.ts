import { describe, it, expect } from 'vitest';
import { extractDatacenter, getBaseUrl, getAuthHeaders, subscriberHash } from '../auth.js';

describe('extractDatacenter', () => {
  it('extracts datacenter from standard key format', () => {
    expect(extractDatacenter('abc123def456-us21')).toBe('us21');
  });

  it('extracts datacenter from key with multiple dashes', () => {
    expect(extractDatacenter('abc-123-def-us14')).toBe('us14');
  });

  it('throws on key without datacenter suffix', () => {
    expect(() => extractDatacenter('abcdef123')).toThrow('Invalid Mailchimp API key format');
  });
});

describe('getBaseUrl', () => {
  it('constructs base URL from datacenter', () => {
    expect(getBaseUrl('us21')).toBe('https://us21.api.mailchimp.com/3.0');
  });

  it('works with different datacenter regions', () => {
    expect(getBaseUrl('eu1')).toBe('https://eu1.api.mailchimp.com/3.0');
  });
});

describe('getAuthHeaders', () => {
  it('returns Basic auth header with base64 encoded credentials', () => {
    const headers = getAuthHeaders('test-key-us21');
    expect(headers.Authorization).toMatch(/^Basic /);
    const decoded = Buffer.from(headers.Authorization.replace('Basic ', ''), 'base64').toString();
    expect(decoded).toBe('anystring:test-key-us21');
  });
});

describe('subscriberHash', () => {
  it('computes MD5 hash of lowercased email', () => {
    // MD5 of "user@example.com"
    expect(subscriberHash('user@example.com')).toBe('b58996c504c5638798eb6b511e6f49af');
  });

  it('lowercases email before hashing', () => {
    expect(subscriberHash('User@Example.COM')).toBe(subscriberHash('user@example.com'));
  });
});
