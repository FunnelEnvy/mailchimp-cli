import { Command } from 'commander';
import { registerAuthCommands } from './commands/auth.js';
import { registerListsCommands } from './commands/lists.js';
import { registerMembersCommands } from './commands/members.js';
import { registerCampaignsCommands } from './commands/campaigns.js';
import { registerTemplatesCommands } from './commands/templates.js';
import { registerReportsCommands } from './commands/reports.js';
import { registerAutomationsCommands } from './commands/automations.js';

const program = new Command();

program
  .name('mailchimp')
  .description('Command-line interface for the Mailchimp Marketing API')
  .version('0.1.0');

registerAuthCommands(program);
registerListsCommands(program);
registerMembersCommands(program);
registerCampaignsCommands(program);
registerTemplatesCommands(program);
registerReportsCommands(program);
registerAutomationsCommands(program);

program.parse();
