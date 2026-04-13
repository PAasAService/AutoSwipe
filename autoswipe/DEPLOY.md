# AutoSwipe — Production Deploy Guide

## 1. Database Setup (Neon — free, recommended)

1. Go to https://neon.tech → sign up free → create project "autoswipe"
2. Copy the **connection string** (looks like: `postgresql://user:pass@ep-xxx.neon.tech/autoswipe?sslmode=require`)
3. Set it as `DATABASE_URL` in your production environment

### Local dev with Docker
```bash
docker compose up -d           # starts local PostgreSQL
npx prisma db push             # creates all tables
npm run db:seed                # seeds demo data
```

## 2. Deploy to Vercel

1. Push your code to GitHub
2. Go to https://vercel.com → Import repository
3. Set these environment variables in Vercel dashboard:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your Neon connection string |
| `NEXTAUTH_SECRET` | Run: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://your-domain.vercel.app` |
| `NEXT_PUBLIC_APP_URL` | `https://your-domain.vercel.app` |
| `RESEND_API_KEY` | From resend.com (free: 3000 emails/month) |
| `EMAIL_FROM` | `noreply@your-domain.com` |

4. Set **Build Command**: `npx prisma generate && npx prisma migrate deploy && next build`

## 3. First Deploy Checklist

- [ ] DATABASE_URL points to Neon (not localhost)
- [ ] NEXTAUTH_SECRET is a real random secret (not a placeholder)
- [ ] NEXTAUTH_URL matches your actual domain
- [ ] Listing images: default is local disk (`public/uploads`). On Vercel, disk is ephemeral—use a persistent volume, object storage, or another host if you need uploads to survive redeploys.
- [ ] Build command includes `prisma migrate deploy`
- [ ] Run `npm run db:seed` once after first deploy (via Vercel CLI or dashboard)

## 4. App Store Submission (React Native)

1. Update `EXPO_PUBLIC_API_BASE_URL` in native `.env` to your production URL
2. Run: `npx eas build --platform all --profile production`
3. Submit via: `npx eas submit`

See [Expo EAS docs](https://docs.expo.dev/eas/) for full details.
