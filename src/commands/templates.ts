import { Command } from 'commander';
import { requireApiKey, extractDatacenter, getBaseUrl, getAuthHeaders } from '../auth.js';
import { request, HttpError } from '../lib/http.js';
import { printOutput, printError, type OutputFormat } from '../lib/output.js';

interface Template {
  id: number;
  type: string;
  name: string;
  drag_and_drop: boolean;
  responsive: boolean;
  category: string;
  date_created: string;
  date_edited: string;
  active: boolean;
  folder_id: string;
}

interface TemplatesResponse {
  templates: Template[];
  total_items: number;
}

export function registerTemplatesCommands(program: Command): void {
  const templates = program.command('templates').description('Manage email templates');

  templates
    .command('list')
    .description('List email templates')
    .option('--api-key <key>', 'Mailchimp API key')
    .option('-o, --output <format>', 'Output format (json, table, csv)', 'json')
    .option('-q, --quiet', 'Suppress non-essential output')
    .option('-v, --verbose', 'Enable verbose output')
    .option('--count <n>', 'Number of results to return', '10')
    .option('--offset <n>', 'Offset for pagination', '0')
    .option('--type <type>', 'Filter by type (user, base, gallery)')
    .action(async (opts: {
      apiKey?: string;
      output: OutputFormat;
      quiet?: boolean;
      verbose?: boolean;
      count: string;
      offset: string;
      type?: string;
    }) => {
      try {
        const apiKey = requireApiKey(opts.apiKey);
        const dc = extractDatacenter(apiKey);
        const baseUrl = getBaseUrl(dc);

        if (opts.verbose) {
          console.error(`GET ${baseUrl}/templates`);
        }

        const result = await request<TemplatesResponse>(`${baseUrl}/templates`, {
          headers: getAuthHeaders(apiKey),
          query: {
            count: opts.count,
            offset: opts.offset,
            type: opts.type,
          },
        });

        if (!opts.quiet) {
          console.error(`Found ${result.total_items} template(s)`);
        }

        const rows = result.templates.map((t) => ({
          id: t.id,
          name: t.name,
          type: t.type,
          category: t.category,
          active: t.active,
          responsive: t.responsive,
          date_created: t.date_created,
          date_edited: t.date_edited,
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

  templates
    .command('get')
    .description('Get details of a specific template')
    .requiredOption('--template-id <id>', 'Template ID')
    .option('--api-key <key>', 'Mailchimp API key')
    .option('-o, --output <format>', 'Output format (json, table, csv)', 'json')
    .option('-v, --verbose', 'Enable verbose output')
    .action(async (opts: { templateId: string; apiKey?: string; output: OutputFormat; verbose?: boolean }) => {
      try {
        const apiKey = requireApiKey(opts.apiKey);
        const dc = extractDatacenter(apiKey);
        const baseUrl = getBaseUrl(dc);

        if (opts.verbose) {
          console.error(`GET ${baseUrl}/templates/${opts.templateId}`);
        }

        const result = await request<Template>(`${baseUrl}/templates/${opts.templateId}`, {
          headers: getAuthHeaders(apiKey),
        });

        printOutput(
          {
            id: result.id,
            name: result.name,
            type: result.type,
            category: result.category,
            active: result.active,
            responsive: result.responsive,
            drag_and_drop: result.drag_and_drop,
            date_created: result.date_created,
            date_edited: result.date_edited,
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
