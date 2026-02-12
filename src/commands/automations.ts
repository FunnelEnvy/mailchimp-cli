import { Command } from 'commander';
import { requireApiKey, extractDatacenter, getBaseUrl, getAuthHeaders } from '../auth.js';
import { request, HttpError } from '../lib/http.js';
import { printOutput, printError, type OutputFormat } from '../lib/output.js';

interface Automation {
  id: string;
  create_time: string;
  start_time: string;
  status: string;
  emails_sent: number;
  recipients: {
    list_id: string;
    list_name: string;
  };
  settings: {
    title: string;
    from_name: string;
    reply_to: string;
  };
  trigger_settings: {
    workflow_type: string;
  };
}

interface AutomationsResponse {
  automations: Automation[];
  total_items: number;
}

export function registerAutomationsCommands(program: Command): void {
  const automations = program.command('automations').description('Manage automations');

  automations
    .command('list')
    .description('List automations')
    .option('--api-key <key>', 'Mailchimp API key')
    .option('-o, --output <format>', 'Output format (json, table, csv)', 'json')
    .option('-q, --quiet', 'Suppress non-essential output')
    .option('-v, --verbose', 'Enable verbose output')
    .option('--count <n>', 'Number of results to return', '10')
    .option('--offset <n>', 'Offset for pagination', '0')
    .action(async (opts: {
      apiKey?: string;
      output: OutputFormat;
      quiet?: boolean;
      verbose?: boolean;
      count: string;
      offset: string;
    }) => {
      try {
        const apiKey = requireApiKey(opts.apiKey);
        const dc = extractDatacenter(apiKey);
        const baseUrl = getBaseUrl(dc);

        if (opts.verbose) {
          console.error(`GET ${baseUrl}/automations`);
        }

        const result = await request<AutomationsResponse>(`${baseUrl}/automations`, {
          headers: getAuthHeaders(apiKey),
          query: { count: opts.count, offset: opts.offset },
        });

        if (!opts.quiet) {
          console.error(`Found ${result.total_items} automation(s)`);
        }

        const rows = result.automations.map((a) => ({
          id: a.id,
          title: a.settings?.title ?? '',
          status: a.status,
          emails_sent: a.emails_sent,
          list_name: a.recipients?.list_name ?? '',
          workflow_type: a.trigger_settings?.workflow_type ?? '',
          create_time: a.create_time,
          start_time: a.start_time ?? '',
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

  automations
    .command('get')
    .description('Get details of a specific automation')
    .requiredOption('--automation-id <id>', 'Automation ID')
    .option('--api-key <key>', 'Mailchimp API key')
    .option('-o, --output <format>', 'Output format (json, table, csv)', 'json')
    .option('-v, --verbose', 'Enable verbose output')
    .action(async (opts: { automationId: string; apiKey?: string; output: OutputFormat; verbose?: boolean }) => {
      try {
        const apiKey = requireApiKey(opts.apiKey);
        const dc = extractDatacenter(apiKey);
        const baseUrl = getBaseUrl(dc);

        if (opts.verbose) {
          console.error(`GET ${baseUrl}/automations/${opts.automationId}`);
        }

        const result = await request<Automation>(`${baseUrl}/automations/${opts.automationId}`, {
          headers: getAuthHeaders(apiKey),
        });

        printOutput(
          {
            id: result.id,
            title: result.settings?.title ?? '',
            status: result.status,
            emails_sent: result.emails_sent,
            list_name: result.recipients?.list_name ?? '',
            from_name: result.settings?.from_name ?? '',
            reply_to: result.settings?.reply_to ?? '',
            workflow_type: result.trigger_settings?.workflow_type ?? '',
            create_time: result.create_time,
            start_time: result.start_time ?? '',
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
