import { createHash } from 'node:crypto';
import { ConfigManager } from './lib/config.js';

const config = new ConfigManager('mailchimp');

export { config };

export interface AuthHeaders {
  [key: string]: string;
}

/**
 * Extracts the datacenter from a Mailchimp API key.
 * Mailchimp API keys have the format: {key}-{dc} (e.g., abc123def456-us21)
 */
export function extractDatacenter(apiKey: string): string {
  const parts = apiKey.split('-');
  const dc = parts[parts.length - 1];
  if (!dc || parts.length < 2) {
    throw new Error(
      'Invalid Mailchimp API key format. Expected format: {key}-{datacenter} (e.g., abc123-us21)',
    );
  }
  return dc;
}

/**
 * Returns the Mailchimp API base URL for the given datacenter.
 */
export function getBaseUrl(dc: string): string {
  return `https://${dc}.api.mailchimp.com/3.0`;
}

/**
 * Resolves the API key from flag > env > config.
 */
export function resolveApiKey(flagValue?: string): string | undefined {
  if (flagValue) return flagValue;
  const envVal = process.env['MAILCHIMP_API_KEY'];
  if (envVal) return envVal;
  return config.read().auth?.api_key;
}

/**
 * Requires an API key or exits with an error.
 */
export function requireApiKey(flagValue?: string): string {
  const key = resolveApiKey(flagValue);
  if (!key) {
    console.error(
      `No API key found. Provide one via:\n` +
        `  1. --api-key flag\n` +
        `  2. MAILCHIMP_API_KEY environment variable\n` +
        `  3. mailchimp auth login`,
    );
    process.exit(1);
  }
  return key;
}

/**
 * Returns auth headers for Mailchimp API requests.
 * Mailchimp uses HTTP Basic Auth: username can be any string, password is the API key.
 */
export function getAuthHeaders(apiKey: string): AuthHeaders {
  const encoded = Buffer.from(`anystring:${apiKey}`).toString('base64');
  return {
    Authorization: `Basic ${encoded}`,
  };
}

/**
 * Computes the MD5 hash of a lowercased email address (Mailchimp subscriber hash).
 */
export function subscriberHash(email: string): string {
  return createHash('md5').update(email.toLowerCase()).digest('hex');
}
