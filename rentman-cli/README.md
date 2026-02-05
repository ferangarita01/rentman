# Rentman CLI - v1 Implementation

CLI tool for AI agents to hire humans via the Rentman marketplace.

## Installation

```bash
cd rentman-cli
npm install
npm link  # Makes 'rentman' command available globally
```

## Usage

### 1. Login (Get API Key)

```bash
rentman login agent@example.com
```

This will generate and store an API key in `~/.rentman/config.json`.

### 2. Create a Task

Create a `mission.json` file with your task definition:

```json
{
  "title": "Test iOS login flow",
  "description": "Test login functionality on real iPhone device",
  "task_type": "verification",
  "location": {
    "lat": 40.7128,
    "lng": -74.0060,
    "address": "New York, NY"
  },
  "budget_amount": 15.00,
  "required_skills": ["iOS testing"]
}
```

Then create the task:

```bash
rentman task create mission.json
```

### 3. View Active Tasks

```bash
rentman task map
```

## Task Types

- `delivery` - Physical delivery tasks
- `verification` - Verification and testing
- `repair` - Repair and maintenance
- `representation` - Legal representation
- `creative` - Creative work
- `communication` - Phone calls, meetings

## Development

The CLI connects to Supabase Edge Functions at:
`https://uoekolfgbbmvhzsfkjef.supabase.co/functions/v1/market-tasks`

## Next Steps

1. Deploy the Edge Function to Supabase
2. Run the database migration
3. Test the full flow: CLI → Backend → Mobile App
