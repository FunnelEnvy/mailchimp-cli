# Mailchimp CLI

[![npm version](https://img.shields.io/npm/v/@marketing-clis/mailchimp-cli.svg)](https://www.npmjs.com/package/@marketing-clis/mailchimp-cli)
[![CI](https://github.com/marketing-clis/mailchimp-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/marketing-clis/mailchimp-cli/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Command-line interface for the Mailchimp Marketing API. Manage audiences, subscribers, campaigns, templates, reports, and automations from your terminal.

## Install

```bash
npm install -g @marketing-clis/mailchimp-cli
```

## Quick Start

```bash
# Set up authentication
mailchimp auth login

# List your audiences
mailchimp lists list --output table

# List subscribers in an audience
mailchimp members list --list-id abc123 --output table

# Add a subscriber
mailchimp members add --list-id abc123 --email user@example.com --status subscribed

# List campaigns
mailchimp campaigns list --output table

# Get a campaign report
mailchimp reports get --campaign-id camp123
```

## Authentication

Mailchimp uses API keys that include the datacenter suffix (e.g., `abc123def-us21`). The CLI automatically extracts the datacenter from your key.

### Setup

```bash
# Interactive setup — saves key to config file
mailchimp auth login

# Or use environment variable
export MAILCHIMP_API_KEY=your-api-key-us21

# Or pass directly to any command
mailchimp lists list --api-key your-api-key-us21
```

### Priority Order

1. `--api-key` flag
2. `MAILCHIMP_API_KEY` environment variable
3. Config file at `~/.config/mailchimp-cli/config.json`
4. Interactive `mailchimp auth login`

### Check Status

```bash
mailchimp auth status
```

## Command Reference

### Auth

```bash
mailchimp auth login              # Save API key interactively
mailchimp auth status             # Show auth status and account info
mailchimp auth logout             # Remove saved credentials
```

### Lists (Audiences)

```bash
mailchimp lists list                          # List all audiences
mailchimp lists list --count 20 --offset 10   # Pagination
mailchimp lists get --list-id abc123          # Get list details
```

### Members (Subscribers)

```bash
mailchimp members list --list-id abc123                                  # List members
mailchimp members list --list-id abc123 --status subscribed              # Filter by status
mailchimp members get --list-id abc123 --email user@example.com          # Get member
mailchimp members add --list-id abc123 --email new@example.com --status subscribed  # Add member
mailchimp members add --list-id abc123 --email new@example.com --first-name Jane    # With name
mailchimp members update --list-id abc123 --email user@example.com --status unsubscribed  # Update
mailchimp members delete --list-id abc123 --email user@example.com       # Delete
```

### Campaigns

```bash
mailchimp campaigns list                              # List campaigns
mailchimp campaigns list --status sent                # Filter by status
mailchimp campaigns get --campaign-id camp123          # Get details
mailchimp campaigns create --list-id abc123 --subject "Hello" --from-name "ACME" --reply-to hello@acme.com
mailchimp campaigns send --campaign-id camp123 --confirm  # Send (requires --confirm)
mailchimp campaigns send --campaign-id camp123 --dry-run  # Preview without sending
mailchimp campaigns delete --campaign-id camp123       # Delete
```

### Templates

```bash
mailchimp templates list                              # List templates
mailchimp templates list --type user                  # Filter by type
mailchimp templates get --template-id 101             # Get details
```

### Reports

```bash
mailchimp reports list                                # List all reports
mailchimp reports get --campaign-id camp123            # Get campaign report
```

### Automations

```bash
mailchimp automations list                            # List automations
mailchimp automations get --automation-id auto123     # Get details
```

## Output Formats

All commands support `--output` / `-o` with these formats:

- `json` (default) — machine-readable, pipe-friendly
- `table` — human-readable aligned columns
- `csv` — for spreadsheets and data pipelines

```bash
# Pipe JSON to jq
mailchimp lists list -o json | jq '.[].name'

# Human-readable table
mailchimp campaigns list -o table

# Export to CSV
mailchimp members list --list-id abc123 -o csv > members.csv
```

## Configuration

Config file location: `~/.config/mailchimp-cli/config.json`

```json
{
  "auth": {
    "api_key": "your-api-key-us21",
    "datacenter": "us21"
  },
  "defaults": {
    "output": "table"
  }
}
```

## Development

```bash
git clone https://github.com/marketing-clis/mailchimp-cli.git
cd mailchimp-cli
pnpm install
pnpm run build
pnpm run test
```

## Part of Marketing CLIs

This tool is part of [Marketing CLIs](https://github.com/marketing-clis/marketing-clis) — open source CLIs for marketing tools that don't have them.

## License

MIT
