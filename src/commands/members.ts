import { Command } from 'commander';
import { requireApiKey, extractDatacenter, getBaseUrl, getAuthHeaders, subscriberHash } from '../auth.js';
import { request, HttpError } from '../lib/http.js';
import { printOutput, printError, type OutputFormat } from '../lib/output.js';

interface Member {
  id: string;
  email_address: string;
  unique_email_id: string;
  status: string;
  merge_fields: Record<string, unknown>;
  list_id: string;
  timestamp_signup: string;
  timestamp_opt: string;
  last_changed: string;
}

interface MembersResponse {
  members: Member[];
  total_items: number;
  list_id: string;
}

function formatMember(m: Member): Record<string, unknown> {
  return {
    id: m.id,
    email: m.email_address,
    status: m.status,
    first_name: (m.merge_fields?.FNAME as string) ?? '',
    last_name: (m.merge_fields?.LNAME as string) ?? '',
    list_id: m.list_id,
    last_changed: m.last_changed,
  };
}

export function registerMembersCommands(program: Command): void {
  const members = program.command('members').description('Manage list members (subscribers)');

  members
    .command('list')
    .description('List members of a list')
    .requiredOption('--list-id <id>', 'List ID')
    .option('--api-key <key>', 'Mailchimp API key')
    .option('-o, --output <format>', 'Output format (json, table, csv)', 'json')
    .option('-q, --quiet', 'Suppress non-essential output')
    .option('-v, --verbose', 'Enable verbose output')
    .option('--count <n>', 'Number of results to return', '10')
    .option('--offset <n>', 'Offset for pagination', '0')
    .option('--status <status>', 'Filter by status (subscribed, unsubscribed, cleaned, pending, transactional)')
    .action(async (opts: {
      listId: string;
      apiKey?: string;
      output: OutputFormat;
      quiet?: boolean;
      verbose?: boolean;
      count: string;
      offset: string;
      status?: string;
    }) => {
      try {
        const apiKey = requireApiKey(opts.apiKey);
        const dc = extractDatacenter(apiKey);
        const baseUrl = getBaseUrl(dc);
        const url = `${baseUrl}/lists/${opts.listId}/members`;

        if (opts.verbose) {
          console.error(`GET ${url}`);
        }

        const result = await request<MembersResponse>(url, {
          headers: getAuthHeaders(apiKey),
          query: {
            count: opts.count,
            offset: opts.offset,
            status: opts.status,
          },
        });

        if (!opts.quiet) {
          console.error(`Found ${result.total_items} member(s)`);
        }

        printOutput(result.members.map(formatMember), opts.output);
      } catch (err) {
        const error = err instanceof HttpError ? err : new Error(String(err));
        printError(
          { code: (error as HttpError).code ?? 'CLI_ERROR', message: error.message },
          opts.output,
        );
        process.exit(1);
      }
    });

  members
    .command('get')
    .description('Get a specific member by email')
    .requiredOption('--list-id <id>', 'List ID')
    .requiredOption('--email <email>', 'Member email address')
    .option('--api-key <key>', 'Mailchimp API key')
    .option('-o, --output <format>', 'Output format (json, table, csv)', 'json')
    .option('-v, --verbose', 'Enable verbose output')
    .action(async (opts: { listId: string; email: string; apiKey?: string; output: OutputFormat; verbose?: boolean }) => {
      try {
        const apiKey = requireApiKey(opts.apiKey);
        const dc = extractDatacenter(apiKey);
        const baseUrl = getBaseUrl(dc);
        const hash = subscriberHash(opts.email);
        const url = `${baseUrl}/lists/${opts.listId}/members/${hash}`;

        if (opts.verbose) {
          console.error(`GET ${url}`);
        }

        const result = await request<Member>(url, {
          headers: getAuthHeaders(apiKey),
        });

        printOutput(formatMember(result), opts.output);
      } catch (err) {
        const error = err instanceof HttpError ? err : new Error(String(err));
        printError(
          { code: (error as HttpError).code ?? 'CLI_ERROR', message: error.message },
          opts.output,
        );
        process.exit(1);
      }
    });

  members
    .command('add')
    .description('Add a new member to a list')
    .requiredOption('--list-id <id>', 'List ID')
    .requiredOption('--email <email>', 'Email address')
    .option('--status <status>', 'Subscription status (subscribed, pending)', 'subscribed')
    .option('--first-name <name>', 'First name')
    .option('--last-name <name>', 'Last name')
    .option('--api-key <key>', 'Mailchimp API key')
    .option('-o, --output <format>', 'Output format (json, table, csv)', 'json')
    .option('-q, --quiet', 'Suppress non-essential output')
    .option('-v, --verbose', 'Enable verbose output')
    .option('--dry-run', 'Show what would be done without making changes')
    .action(async (opts: {
      listId: string;
      email: string;
      status: string;
      firstName?: string;
      lastName?: string;
      apiKey?: string;
      output: OutputFormat;
      quiet?: boolean;
      verbose?: boolean;
      dryRun?: boolean;
    }) => {
      try {
        const apiKey = requireApiKey(opts.apiKey);
        const dc = extractDatacenter(apiKey);
        const baseUrl = getBaseUrl(dc);
        const url = `${baseUrl}/lists/${opts.listId}/members`;

        const body: Record<string, unknown> = {
          email_address: opts.email,
          status: opts.status,
        };

        const mergeFields: Record<string, string> = {};
        if (opts.firstName) mergeFields['FNAME'] = opts.firstName;
        if (opts.lastName) mergeFields['LNAME'] = opts.lastName;
        if (Object.keys(mergeFields).length > 0) {
          body['merge_fields'] = mergeFields;
        }

        if (opts.dryRun) {
          console.log('[DRY RUN] Would add member:');
          printOutput({ url, method: 'POST', body }, opts.output);
          return;
        }

        if (opts.verbose) {
          console.error(`POST ${url}`);
        }

        const result = await request<Member>(url, {
          method: 'POST',
          headers: getAuthHeaders(apiKey),
          body,
        });

        if (!opts.quiet) {
          console.error(`Added member: ${result.email_address}`);
        }

        printOutput(formatMember(result), opts.output);
      } catch (err) {
        const error = err instanceof HttpError ? err : new Error(String(err));
        printError(
          { code: (error as HttpError).code ?? 'CLI_ERROR', message: error.message },
          opts.output,
        );
        process.exit(1);
      }
    });

  members
    .command('update')
    .description('Update a member by email')
    .requiredOption('--list-id <id>', 'List ID')
    .requiredOption('--email <email>', 'Member email address')
    .option('--status <status>', 'New subscription status')
    .option('--first-name <name>', 'First name')
    .option('--last-name <name>', 'Last name')
    .option('--api-key <key>', 'Mailchimp API key')
    .option('-o, --output <format>', 'Output format (json, table, csv)', 'json')
    .option('-q, --quiet', 'Suppress non-essential output')
    .option('-v, --verbose', 'Enable verbose output')
    .option('--dry-run', 'Show what would be done without making changes')
    .action(async (opts: {
      listId: string;
      email: string;
      status?: string;
      firstName?: string;
      lastName?: string;
      apiKey?: string;
      output: OutputFormat;
      quiet?: boolean;
      verbose?: boolean;
      dryRun?: boolean;
    }) => {
      try {
        const apiKey = requireApiKey(opts.apiKey);
        const dc = extractDatacenter(apiKey);
        const baseUrl = getBaseUrl(dc);
        const hash = subscriberHash(opts.email);
        const url = `${baseUrl}/lists/${opts.listId}/members/${hash}`;

        const body: Record<string, unknown> = {};
        if (opts.status) body['status'] = opts.status;

        const mergeFields: Record<string, string> = {};
        if (opts.firstName) mergeFields['FNAME'] = opts.firstName;
        if (opts.lastName) mergeFields['LNAME'] = opts.lastName;
        if (Object.keys(mergeFields).length > 0) {
          body['merge_fields'] = mergeFields;
        }

        if (opts.dryRun) {
          console.log('[DRY RUN] Would update member:');
          printOutput({ url, method: 'PATCH', body }, opts.output);
          return;
        }

        if (opts.verbose) {
          console.error(`PATCH ${url}`);
        }

        const result = await request<Member>(url, {
          method: 'PATCH',
          headers: getAuthHeaders(apiKey),
          body,
        });

        if (!opts.quiet) {
          console.error(`Updated member: ${result.email_address}`);
        }

        printOutput(formatMember(result), opts.output);
      } catch (err) {
        const error = err instanceof HttpError ? err : new Error(String(err));
        printError(
          { code: (error as HttpError).code ?? 'CLI_ERROR', message: error.message },
          opts.output,
        );
        process.exit(1);
      }
    });

  members
    .command('delete')
    .description('Permanently delete a member from a list')
    .requiredOption('--list-id <id>', 'List ID')
    .requiredOption('--email <email>', 'Member email address')
    .option('--api-key <key>', 'Mailchimp API key')
    .option('-o, --output <format>', 'Output format (json, table, csv)', 'json')
    .option('-v, --verbose', 'Enable verbose output')
    .option('--dry-run', 'Show what would be done without making changes')
    .action(async (opts: {
      listId: string;
      email: string;
      apiKey?: string;
      output: OutputFormat;
      verbose?: boolean;
      dryRun?: boolean;
    }) => {
      try {
        const apiKey = requireApiKey(opts.apiKey);
        const dc = extractDatacenter(apiKey);
        const baseUrl = getBaseUrl(dc);
        const hash = subscriberHash(opts.email);
        const url = `${baseUrl}/lists/${opts.listId}/members/${hash}`;

        if (opts.dryRun) {
          console.log('[DRY RUN] Would delete member:');
          printOutput({ url, method: 'DELETE', email: opts.email, hash }, opts.output);
          return;
        }

        if (opts.verbose) {
          console.error(`DELETE ${url}`);
        }

        await request(url, {
          method: 'DELETE',
          headers: getAuthHeaders(apiKey),
        });

        console.log(`Deleted member: ${opts.email}`);
      } catch (err) {
        const error = err instanceof HttpError ? err : new Error(String(err));
        printError(
          { code: (error as HttpError).code ?? 'CLI_ERROR', message: error.message },
          opts.output,
        );
        process.exit(1);
      }
    });
}
