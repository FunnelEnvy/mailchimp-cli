import { Command } from 'commander';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { config, extractDatacenter, getBaseUrl, getAuthHeaders, resolveApiKey } from '../auth.js';
import { request } from '../lib/http.js';
import { printOutput, type OutputFormat } from '../lib/output.js';

interface PingResponse {
  health_status: string;
  account_id: string;
  account_name: string;
  email: string;
  first_name: string;
  last_name: string;
  login_id: string;
}

export function registerAuthCommands(program: Command): void {
  const auth = program.command('auth').description('Manage authentication');

  auth
    .command('login')
    .description('Save your Mailchimp API key')
    .action(async () => {
      const rl = createInterface({ input: stdin, output: stdout });
      try {
        const apiKey = await rl.question('Enter your Mailchimp API key: ');
        if (!apiKey.trim()) {
          console.error('API key cannot be empty.');
          process.exit(1);
        }

        const trimmed = apiKey.trim();
        let dc: string;
        try {
          dc = extractDatacenter(trimmed);
        } catch (err) {
          console.error((err as Error).message);
          process.exit(1);
        }

        // Verify the key works by calling the ping endpoint
        try {
          const baseUrl = getBaseUrl(dc);
          const result = await request<PingResponse>(`${baseUrl}/`, {
            headers: getAuthHeaders(trimmed),
          });
          console.log(`Authenticated as: ${result.account_name} (${result.email})`);
          console.log(`Datacenter: ${dc}`);
        } catch {
          console.error('Warning: Could not verify API key. Saving anyway.');
        }

        config.set('auth', { api_key: trimmed, datacenter: dc });
        console.log(`API key saved to ${config.getConfigPath()}`);
      } finally {
        rl.close();
      }
    });

  auth
    .command('status')
    .description('Show current authentication status')
    .option('-o, --output <format>', 'Output format (json, table, csv)', 'json')
    .action(async (opts: { output: OutputFormat }) => {
      const apiKey = resolveApiKey();
      if (!apiKey) {
        console.error('Not authenticated. Run: mailchimp auth login');
        process.exit(1);
      }

      const dc = extractDatacenter(apiKey);
      const baseUrl = getBaseUrl(dc);

      try {
        const result = await request<PingResponse>(`${baseUrl}/`, {
          headers: getAuthHeaders(apiKey),
        });

        printOutput(
          {
            status: 'authenticated',
            account_name: result.account_name,
            account_id: result.account_id,
            email: result.email,
            datacenter: dc,
            api_base: baseUrl,
          },
          opts.output,
        );
      } catch {
        printOutput(
          {
            status: 'configured (unverified)',
            datacenter: dc,
            api_base: baseUrl,
          },
          opts.output,
        );
      }
    });

  auth
    .command('logout')
    .description('Remove saved credentials')
    .action(() => {
      config.set('auth', {});
      console.log('Credentials removed.');
    });
}
