# AutoSwipe — Monitoring & Analytics

## Error Tracking (Sentry)
Free tier: unlimited errors, 5K issues/month

1. Create account: https://sentry.io/signup/
2. Create project → Platform: Next.js
3. Get DSN from: Settings → Projects → [project] → Client Keys
4. Add to Vercel environment variables:
   ```
   NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
   SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
   SENTRY_ORG=your-org-slug
   SENTRY_PROJECT=autoswipe
   ```

## Analytics (PostHog)
Free tier: 1 million events/month

1. Create account: https://posthog.com
2. Create project → get API key
3. Add to Vercel:
   ```
   NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxxxxxxxxxx
   NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
   ```
4. Key events tracked automatically:
   - `$pageview` — every page visit
   - `login` — successful login
   - `signup` — new registration
   - `swipe` — each swipe with direction + car details

## Uptime Monitoring (UptimeRobot — free)
Free tier: 50 monitors, 5-min intervals

1. Create account: https://uptimerobot.com
2. Add monitor:
   - Type: HTTPS
   - URL: `https://your-domain.com/api/health`
   - Interval: 5 minutes
3. Set alert: your email + Telegram (optional)

## Health Check
`GET /api/health` returns:
```json
{ "status": "ok", "timestamp": "2024-...", "version": "1.0.0" }
```
