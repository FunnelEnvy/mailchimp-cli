import { Command } from 'commander';
import { requireApiKey, extractDatacenter, getBaseUrl, getAuthHeaders } from '../auth.js';
import { request, HttpError } from '../lib/http.js';
import { printOutput, printError, type OutputFormat } from '../lib/output.js';

interface Campaign {
  id: string;
  web_id: number;
  type: string;
  create_time: string;
  send_time: string;
  status: string;
  emails_sent: number;
  content_type: string;
  recipients: {
    list_id: string;
    list_name: string;
    recipient_count: number;
  };
  settings: {
    subject_line: string;
    from_name: string;
    reply_to: string;
    title: string;
  };
}

interface CampaignsResponse {
  campaigns: Campaign[];
  total_items: number;
}

function formatCampaign(c: Campaign): Record<string, unknown> {
  return {
    id: c.id,
    type: c.type,
    status: c.status,
    subject: c.settings?.subject_line ?? '',
    from_name: c.settings?.from_name ?? '',
    list_name: c.recipients?.list_name ?? '',
    emails_sent: c.emails_sent,
    send_time: c.send_time ?? '',
    create_time: c.create_time,
  };
}

export function registerCampaignsCommands(program: Command): void {
  const campaigns = program.command('campaigns').description('Manage email campaigns');

  campaigns
    .command('list')
    .description('List campaigns')
    .option('--api-key <key>', 'Mailchimp API key')
    .option('-o, --output <format>', 'Output format (json, table, csv)', 'json')
    .option('-q, --quiet', 'Suppress non-essential output')
    .option('-v, --verbose', 'Enable verbose output')
    .option('--count <n>', 'Number of results to return', '10')
    .option('--offset <n>', 'Offset for pagination', '0')
    .option('--status <status>', 'Filter by status (save, paused, schedule, sending, sent)')
    .option('--type <type>', 'Filter by type (regular, plaintext, absplit, rss, variate)')
    .action(async (opts: {
      apiKey?: string;
      output: OutputFormat;
      quiet?: boolean;
      verbose?: boolean;
      count: string;
      offset: string;
      status?: string;
      type?: string;
    }) => {
      try {
        const apiKey = requireApiKey(opts.apiKey);
        const dc = extractDatacenter(apiKey);
        const baseUrl = getBaseUrl(dc);

        if (opts.verbose) {
          console.error(`GET ${baseUrl}/campaigns`);
        }

        const result = await request<CampaignsResponse>(`${baseUrl}/campaigns`, {
          headers: getAuthHeaders(apiKey),
          query: {
            count: opts.count,
            offset: opts.offset,
            status: opts.status,
            type: opts.type,
          },
        });

        if (!opts.quiet) {
          console.error(`Found ${result.total_items} campaign(s)`);
        }

        printOutput(result.campaigns.map(formatCampaign), opts.output);
      } catch (err) {
        const error = err instanceof HttpError ? err : new Error(String(err));
        printError(
          { code: (error as HttpError).code ?? 'CLI_ERROR', message: error.message },
          opts.output,
        );
        process.exit(1);
      }
    });

  campaigns
    .command('get')
    .description('Get details of a specific campaign')
    .requiredOption('--campaign-id <id>', 'Campaign ID')
    .option('--api-key <key>', 'Mailchimp API key')
    .option('-o, --output <format>', 'Output format (json, table, csv)', 'json')
    .option('-v, --verbose', 'Enable verbose output')
    .action(async (opts: { campaignId: string; apiKey?: string; output: OutputFormat; verbose?: boolean }) => {
      try {
        const apiKey = requireApiKey(opts.apiKey);
        const dc = extractDatacenter(apiKey);
        const baseUrl = getBaseUrl(dc);

        if (opts.verbose) {
          console.error(`GET ${baseUrl}/campaigns/${opts.campaignId}`);
        }

        const result = await request<Campaign>(`${baseUrl}/campaigns/${opts.campaignId}`, {
          headers: getAuthHeaders(apiKey),
        });

        printOutput(formatCampaign(result), opts.output);
      } catch (err) {
        const error = err instanceof HttpError ? err : new Error(String(err));
        printError(
          { code: (error as HttpError).code ?? 'CLI_ERROR', message: error.message },
          opts.output,
        );
        process.exit(1);
      }
    });

  campaigns
    .command('create')
    .description('Create a new campaign')
    .requiredOption('--list-id <id>', 'List/audience ID to send to')
    .requiredOption('--subject <subject>', 'Email subject line')
    .requiredOption('--from-name <name>', 'From name')
    .requiredOption('--reply-to <email>', 'Reply-to email address')
    .option('--title <title>', 'Internal campaign title')
    .option('--type <type>', 'Campaign type (regular, plaintext)', 'regular')
    .option('--api-key <key>', 'Mailchimp API key')
    .option('-o, --output <format>', 'Output format (json, table, csv)', 'json')
    .option('-q, --quiet', 'Suppress non-essential output')
    .option('-v, --verbose', 'Enable verbose output')
    .option('--dry-run', 'Show what would be done without making changes')
    .action(async (opts: {
      listId: string;
      subject: string;
      fromName: string;
      replyTo: string;
      title?: string;
      type: string;
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

        const body = {
          type: opts.type,
          recipients: {
            list_id: opts.listId,
          },
          settings: {
            subject_line: opts.subject,
            from_name: opts.fromName,
            reply_to: opts.replyTo,
            title: opts.title ?? opts.subject,
          },
        };

        if (opts.dryRun) {
          console.log('[DRY RUN] Would create campaign:');
          printOutput(body as unknown as Record<string, unknown>, opts.output);
          return;
        }

        if (opts.verbose) {
          console.error(`POST ${baseUrl}/campaigns`);
        }

        const result = await request<Campaign>(`${baseUrl}/campaigns`, {
          method: 'POST',
          headers: getAuthHeaders(apiKey),
          body,
        });

        if (!opts.quiet) {
          console.error(`Created campaign: ${result.id}`);
        }

        printOutput(formatCampaign(result), opts.output);
      } catch (err) {
        const error = err instanceof HttpError ? err : new Error(String(err));
        printError(
          { code: (error as HttpError).code ?? 'CLI_ERROR', message: error.message },
          opts.output,
        );
        process.exit(1);
      }
    });

  campaigns
    .command('send')
    .description('Send a campaign (use --confirm to actually send)')
    .requiredOption('--campaign-id <id>', 'Campaign ID')
    .option('--api-key <key>', 'Mailchimp API key')
    .option('-o, --output <format>', 'Output format (json, table, csv)', 'json')
    .option('-v, --verbose', 'Enable verbose output')
    .option('--dry-run', 'Preview what would happen without sending')
    .option('--confirm', 'Actually send the campaign (required)')
    .action(async (opts: {
      campaignId: string;
      apiKey?: string;
      output: OutputFormat;
      verbose?: boolean;
      dryRun?: boolean;
      confirm?: boolean;
    }) => {
      try {
        const apiKey = requireApiKey(opts.apiKey);
        const dc = extractDatacenter(apiKey);
        const baseUrl = getBaseUrl(dc);

        if (opts.dryRun) {
          console.log(`[DRY RUN] Would send campaign: ${opts.campaignId}`);
          console.log(`POST ${baseUrl}/campaigns/${opts.campaignId}/actions/send`);
          return;
        }

        if (!opts.confirm) {
          console.error(
            'Sending a campaign is irreversible. Use --confirm to actually send, or --dry-run to preview.',
          );
          process.exit(1);
        }

        if (opts.verbose) {
          console.error(`POST ${baseUrl}/campaigns/${opts.campaignId}/actions/send`);
        }

        await request(`${baseUrl}/campaigns/${opts.campaignId}/actions/send`, {
          method: 'POST',
          headers: getAuthHeaders(apiKey),
        });

        console.log(`Campaign ${opts.campaignId} sent successfully.`);
      } catch (err) {
        const error = err instanceof HttpError ? err : new Error(String(err));
        printError(
          { code: (error as HttpError).code ?? 'CLI_ERROR', message: error.message },
          opts.output,
        );
        process.exit(1);
      }
    });

  campaigns
    .command('delete')
    .description('Delete a campaign')
    .requiredOption('--campaign-id <id>', 'Campaign ID')
    .option('--api-key <key>', 'Mailchimp API key')
    .option('-o, --output <format>', 'Output format (json, table, csv)', 'json')
    .option('-v, --verbose', 'Enable verbose output')
    .option('--dry-run', 'Show what would be done without making changes')
    .action(async (opts: {
      campaignId: string;
      apiKey?: string;
      output: OutputFormat;
      verbose?: boolean;
      dryRun?: boolean;
    }) => {
      try {
        const apiKey = requireApiKey(opts.apiKey);
        const dc = extractDatacenter(apiKey);
        const baseUrl = getBaseUrl(dc);

        if (opts.dryRun) {
          console.log(`[DRY RUN] Would delete campaign: ${opts.campaignId}`);
          return;
        }

        if (opts.verbose) {
          console.error(`DELETE ${baseUrl}/campaigns/${opts.campaignId}`);
        }

        await request(`${baseUrl}/campaigns/${opts.campaignId}`, {
          method: 'DELETE',
          headers: getAuthHeaders(apiKey),
        });

        console.log(`Deleted campaign: ${opts.campaignId}`);
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
