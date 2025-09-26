# Status Checking in Serverless Deployments

Since serverless environments (like Vercel) don't support long-running processes with intervals, we use multiple approaches for status checking:

## 1. Client-Side Polling ✅ (Already Implemented)

The `usePhotoshootStatus` hook automatically polls for status updates:
- **Training**: Every 30 seconds
- **Generating**: Every 10 seconds  
- **Other states**: Every 5 seconds

This works automatically when users are viewing their photoshoots.

## 2. External Cron Services

For background status checking when users aren't online, set up external cron services:

### Option A: Vercel Cron (Recommended)

Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/status/check-all",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

### Option B: GitHub Actions

Create `.github/workflows/status-check.yml`:
```yaml
name: Status Check
on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes
jobs:
  check-status:
    runs-on: ubuntu-latest
    steps:
      - name: Check Status
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json" \
            https://your-app.vercel.app/api/status/check-all
```

### Option C: External Services

Use services like:
- **Uptime Robot**: Set up HTTP monitor calling your endpoint
- **Cron-job.org**: Free cron service
- **EasyCron**: Reliable cron service

**Endpoint to call:**
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  https://your-app.vercel.app/api/status/check-all
```

## 3. Webhook-Based Updates ✅ (Already Implemented)

Astria webhooks automatically update status:
- **Training completion**: `/api/webhooks/astria`
- **Generation completion**: `/api/webhooks/astria`

## 4. Manual Status Checking

Users can manually refresh status:
- **Auto-update endpoint**: `/api/photoshoot/[sessionId]/auto-update`
- **Status tracker component**: Includes manual refresh button

## Environment Variables

Add to your deployment:
```env
# Optional: For external cron authentication
CRON_SECRET=your_secure_secret_here
INTERNAL_API_KEY=your_internal_api_key
```

## Testing

Test the status checking endpoint:
```bash
# Check all pending sessions
curl -X POST https://your-app.vercel.app/api/status/check-all

# Check specific session (requires auth)
curl -X POST https://your-app.vercel.app/api/photoshoot/SESSION_ID/auto-update
```

## Monitoring

The status checker logs all activities:
- ✅ Successful status updates
- ❌ Failed API calls
- 🔍 Sessions being checked
- 📊 Batch operation results

Check your deployment logs to monitor status checking activity.

## Recommended Setup

1. **Enable Vercel Cron** (if on Pro plan)
2. **Set up GitHub Actions** as backup
3. **Configure Astria webhooks** for real-time updates
4. **Client-side polling** handles user interactions

This multi-layered approach ensures reliable status checking in serverless environments!
