import { Command } from 'commander';
import { requireApiKey, extractDatacenter, getBaseUrl, getAuthHeaders } from '../auth.js';
import { request } from '../lib/http.js';
import { printOutput, printError, type OutputFormat } from '../lib/output.js';
import { HttpError } from '../lib/http.js';

interface MailchimpList {
  id: string;
  web_id: number;
  name: string;
  contact: Record<string, unknown>;
  permission_reminder: string;
  date_created: string;
  list_rating: number;
  stats: {
    member_count: number;
    unsubscribe_count: number;
    open_rate: number;
    click_rate: number;
  };
}

interface ListsResponse {
  lists: MailchimpList[];
  total_items: number;
}

export function registerListsCommands(program: Command): void {
  const lists = program.command('lists').description('Manage audiences/lists');

  lists
    .command('list')
    .description('List all audiences/lists')
    .option('--api-key <key>', 'Mailchimp API key')
    .option('-o, --output <format>', 'Output format (json, table, csv)', 'json')
    .option('-q, --quiet', 'Suppress non-essential output')
    .option('-v, --verbose', 'Enable verbose output')
    .option('--count <n>', 'Number of results to return', '10')
    .option('--offset <n>', 'Offset for pagination', '0')
    .action(async (opts: { apiKey?: string; output: OutputFormat; quiet?: boolean; verbose?: boolean; count: string; offset: string }) => {
      try {
        const apiKey = requireApiKey(opts.apiKey);
        const dc = extractDatacenter(apiKey);
        const baseUrl = getBaseUrl(dc);

        if (opts.verbose) {
          console.error(`GET ${baseUrl}/lists`);
        }

        const result = await request<ListsResponse>(`${baseUrl}/lists`, {
          headers: getAuthHeaders(apiKey),
          query: { count: opts.count, offset: opts.offset },
        });

        if (!opts.quiet) {
          console.error(`Found ${result.total_items} list(s)`);
        }

        const rows = result.lists.map((l) => ({
          id: l.id,
          name: l.name,
          member_count: l.stats.member_count,
          unsubscribe_count: l.stats.unsubscribe_count,
          open_rate: l.stats.open_rate,
          click_rate: l.stats.click_rate,
          date_created: l.date_created,
        }));

        printOutput(rows, opts.output);
      } catch (err) {
        const error = err instanceof HttpError ? err : new Error(String(err));
        printError(
          { code: (error as HttpError).code ?? 'CLI_ERROR', message: error.message },
          opts.output,
        );
        process.exit(1);
      }
    });

  lists
    .command('get')
    .description('Get details of a specific audience/list')
    .requiredOption('--list-id <id>', 'List ID')
    .option('--api-key <key>', 'Mailchimp API key')
    .option('-o, --output <format>', 'Output format (json, table, csv)', 'json')
    .option('-q, --quiet', 'Suppress non-essential output')
    .option('-v, --verbose', 'Enable verbose output')
    .action(async (opts: { listId: string; apiKey?: string; output: OutputFormat; quiet?: boolean; verbose?: boolean }) => {
      try {
        const apiKey = requireApiKey(opts.apiKey);
        const dc = extractDatacenter(apiKey);
        const baseUrl = getBaseUrl(dc);

        if (opts.verbose) {
          console.error(`GET ${baseUrl}/lists/${opts.listId}`);
        }

        const result = await request<MailchimpList>(`${baseUrl}/lists/${opts.listId}`, {
          headers: getAuthHeaders(apiKey),
        });

        printOutput(
          {
            id: result.id,
            web_id: result.web_id,
            name: result.name,
            permission_reminder: result.permission_reminder,
            date_created: result.date_created,
            list_rating: result.list_rating,
            member_count: result.stats.member_count,
            unsubscribe_count: result.stats.unsubscribe_count,
            open_rate: result.stats.open_rate,
            click_rate: result.stats.click_rate,
          },
          opts.output,
        );
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
