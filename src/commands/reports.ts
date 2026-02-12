import { Command } from 'commander';
import { requireApiKey, extractDatacenter, getBaseUrl, getAuthHeaders } from '../auth.js';
import { request, HttpError } from '../lib/http.js';
import { printOutput, printError, type OutputFormat } from '../lib/output.js';

interface CampaignReport {
  id: string;
  campaign_title: string;
  type: string;
  list_id: string;
  list_name: string;
  subject_line: string;
  emails_sent: number;
  abuse_reports: number;
  unsubscribed: number;
  send_time: string;
  opens: {
    opens_total: number;
    unique_opens: number;
    open_rate: number;
  };
  clicks: {
    clicks_total: number;
    unique_clicks: number;
    click_rate: number;
  };
  bounces: {
    hard_bounces: number;
    soft_bounces: number;
  };
}

interface ReportsResponse {
  reports: CampaignReport[];
  total_items: number;
}

function formatReport(r: CampaignReport): Record<string, unknown> {
  return {
    id: r.id,
    campaign_title: r.campaign_title,
    subject_line: r.subject_line,
    emails_sent: r.emails_sent,
    unique_opens: r.opens?.unique_opens ?? 0,
    open_rate: r.opens?.open_rate ?? 0,
    unique_clicks: r.clicks?.unique_clicks ?? 0,
    click_rate: r.clicks?.click_rate ?? 0,
    hard_bounces: r.bounces?.hard_bounces ?? 0,
    soft_bounces: r.bounces?.soft_bounces ?? 0,
    unsubscribed: r.unsubscribed,
    abuse_reports: r.abuse_reports,
    send_time: r.send_time,
  };
}

export function registerReportsCommands(program: Command): void {
  const reports = program.command('reports').description('View campaign reports');

  reports
    .command('list')
    .description('List all campaign reports')
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
          console.error(`GET ${baseUrl}/reports`);
        }

        const result = await request<ReportsResponse>(`${baseUrl}/reports`, {
          headers: getAuthHeaders(apiKey),
          query: { count: opts.count, offset: opts.offset },
        });

        if (!opts.quiet) {
          console.error(`Found ${result.total_items} report(s)`);
        }

        printOutput(result.reports.map(formatReport), opts.output);
      } catch (err) {
        const error = err instanceof HttpError ? err : new Error(String(err));
        printError(
          { code: (error as HttpError).code ?? 'CLI_ERROR', message: error.message },
          opts.output,
        );
        process.exit(1);
      }
    });

  reports
    .command('get')
    .description('Get report for a specific campaign')
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
          console.error(`GET ${baseUrl}/reports/${opts.campaignId}`);
        }

        const result = await request<CampaignReport>(`${baseUrl}/reports/${opts.campaignId}`, {
          headers: getAuthHeaders(apiKey),
        });

        printOutput(formatReport(result), opts.output);
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
