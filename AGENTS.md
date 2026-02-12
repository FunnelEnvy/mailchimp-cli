# Mailchimp CLI — Agent Reference

## Command Inventory

### Auth Commands

| Command | Required Args | Optional Flags | Description |
|---------|--------------|----------------|-------------|
| `mailchimp auth login` | — | — | Interactive API key setup |
| `mailchimp auth status` | — | `-o` | Show auth status |
| `mailchimp auth logout` | — | — | Remove credentials |

### Lists Commands

| Command | Required Args | Optional Flags | Description |
|---------|--------------|----------------|-------------|
| `mailchimp lists list` | — | `--api-key`, `-o`, `-q`, `-v`, `--count`, `--offset` | List audiences |
| `mailchimp lists get` | `--list-id` | `--api-key`, `-o`, `-q`, `-v` | Get list details |

### Members Commands

| Command | Required Args | Optional Flags | Description |
|---------|--------------|----------------|-------------|
| `mailchimp members list` | `--list-id` | `--api-key`, `-o`, `-q`, `-v`, `--count`, `--offset`, `--status` | List subscribers |
| `mailchimp members get` | `--list-id`, `--email` | `--api-key`, `-o`, `-v` | Get subscriber |
| `mailchimp members add` | `--list-id`, `--email` | `--api-key`, `-o`, `-q`, `-v`, `--status`, `--first-name`, `--last-name`, `--dry-run` | Add subscriber |
| `mailchimp members update` | `--list-id`, `--email` | `--api-key`, `-o`, `-q`, `-v`, `--status`, `--first-name`, `--last-name`, `--dry-run` | Update subscriber |
| `mailchimp members delete` | `--list-id`, `--email` | `--api-key`, `-o`, `-v`, `--dry-run` | Delete subscriber |

### Campaigns Commands

| Command | Required Args | Optional Flags | Description |
|---------|--------------|----------------|-------------|
| `mailchimp campaigns list` | — | `--api-key`, `-o`, `-q`, `-v`, `--count`, `--offset`, `--status`, `--type` | List campaigns |
| `mailchimp campaigns get` | `--campaign-id` | `--api-key`, `-o`, `-v` | Get campaign details |
| `mailchimp campaigns create` | `--list-id`, `--subject`, `--from-name`, `--reply-to` | `--api-key`, `-o`, `-q`, `-v`, `--title`, `--type`, `--dry-run` | Create campaign |
| `mailchimp campaigns send` | `--campaign-id` | `--api-key`, `-o`, `-v`, `--dry-run`, `--confirm` | Send campaign |
| `mailchimp campaigns delete` | `--campaign-id` | `--api-key`, `-o`, `-v`, `--dry-run` | Delete campaign |

### Templates Commands

| Command | Required Args | Optional Flags | Description |
|---------|--------------|----------------|-------------|
| `mailchimp templates list` | — | `--api-key`, `-o`, `-q`, `-v`, `--count`, `--offset`, `--type` | List templates |
| `mailchimp templates get` | `--template-id` | `--api-key`, `-o`, `-v` | Get template details |

### Reports Commands

| Command | Required Args | Optional Flags | Description |
|---------|--------------|----------------|-------------|
| `mailchimp reports list` | — | `--api-key`, `-o`, `-q`, `-v`, `--count`, `--offset` | List reports |
| `mailchimp reports get` | `--campaign-id` | `--api-key`, `-o`, `-v` | Get campaign report |

### Automations Commands

| Command | Required Args | Optional Flags | Description |
|---------|--------------|----------------|-------------|
| `mailchimp automations list` | — | `--api-key`, `-o`, `-q`, `-v`, `--count`, `--offset` | List automations |
| `mailchimp automations get` | `--automation-id` | `--api-key`, `-o`, `-v` | Get automation details |

## Authentication

### Setup Sequence

```bash
# Option 1: Interactive login
mailchimp auth login
# Enter API key when prompted (format: {key}-{datacenter}, e.g., abc123-us21)

# Option 2: Environment variable
export MAILCHIMP_API_KEY=your-api-key-us21

# Option 3: Direct flag (any command)
mailchimp lists list --api-key your-api-key-us21
```

### Auth Details

- **Method:** HTTP Basic Auth
- **Header:** `Authorization: Basic base64("anystring:{api_key}")`
- **API key format:** `{key}-{datacenter}` (e.g., `abc123def-us21`)
- **Base URL:** `https://{dc}.api.mailchimp.com/3.0` (datacenter extracted from key)
- **Config path:** `~/.config/mailchimp-cli/config.json`

## Common Workflows

### Add subscribers to a list

```bash
# Find the list ID
mailchimp lists list -o json | jq '.[0].id'

# Add a subscriber
mailchimp members add --list-id LIST_ID --email user@example.com --status subscribed --first-name John --last-name Doe

# Verify the subscriber was added
mailchimp members get --list-id LIST_ID --email user@example.com
```

### Create and send a campaign

```bash
# Create a campaign
mailchimp campaigns create --list-id LIST_ID --subject "Monthly Update" --from-name "ACME" --reply-to hello@acme.com

# Preview send (dry run)
mailchimp campaigns send --campaign-id CAMPAIGN_ID --dry-run

# Actually send
mailchimp campaigns send --campaign-id CAMPAIGN_ID --confirm

# Check report after sending
mailchimp reports get --campaign-id CAMPAIGN_ID
```

### Export subscribers

```bash
# Export all subscribers as CSV
mailchimp members list --list-id LIST_ID --count 1000 -o csv > subscribers.csv

# Export only subscribed members
mailchimp members list --list-id LIST_ID --status subscribed -o csv > active_subscribers.csv
```

### Audit campaign performance

```bash
# List all sent campaign reports
mailchimp reports list -o table

# Get detailed report for a specific campaign
mailchimp reports get --campaign-id CAMPAIGN_ID -o json
```

## Output Formats

All data commands accept `--output json|table|csv` (default: `json`).

JSON output structure:
- List commands return arrays: `[{...}, {...}]`
- Single resource commands return objects: `{...}`
- Errors return: `{"error": {"code": "ERROR_CODE", "message": "..."}}`

### Key response fields

- **Lists:** `id`, `name`, `member_count`, `open_rate`, `click_rate`
- **Members:** `id`, `email`, `status`, `first_name`, `last_name`, `list_id`
- **Campaigns:** `id`, `type`, `status`, `subject`, `from_name`, `emails_sent`
- **Reports:** `id`, `emails_sent`, `unique_opens`, `open_rate`, `unique_clicks`, `click_rate`
- **Templates:** `id`, `name`, `type`, `active`, `date_created`
- **Automations:** `id`, `title`, `status`, `emails_sent`, `workflow_type`

## Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| `AUTH_MISSING` | No API key found | Run `mailchimp auth login` |
| `AUTH_FAILED` | Invalid or expired key | Check key or re-authenticate |
| `RATE_LIMITED` | Too many requests | Wait for `retry_after` seconds |
| `NOT_FOUND` | Resource doesn't exist | Check the ID/email |
| `API_ERROR` | General API error | Check error message |
| `CLI_ERROR` | Client-side error | Check command arguments |

## Rate Limits

Mailchimp enforces rate limits of 10 concurrent connections per user. The CLI handles rate limiting automatically:
- 429 responses trigger automatic retry with exponential backoff
- Rate limit errors include a `retry_after` field in JSON output
- Use `--verbose` to see retry information

Auto-retry is built in with exponential backoff. Rate limit errors include a `retry_after` field in JSON output.
