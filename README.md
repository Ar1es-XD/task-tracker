# Task Tracker

Production-ready full-stack task management app built with Next.js App Router, Prisma, NextAuth, TanStack Query, Framer Motion, and dnd-kit.

## Features

- Google OAuth sign-in with NextAuth
- Protected task REST APIs
- Prisma + PostgreSQL persistence
- Google Calendar event sync for tasks
- Drag-and-drop Kanban workflow
- Calendar view for due dates
- Optimistic UI updates and graceful loading/error states
- Dark/light mode with next-themes

## Local Development

1. Install dependencies:

```bash
npm install
```

1. Create environment variables:

```bash
cp .env.example .env
```

1. Set up Prisma:

```bash
npx prisma migrate dev --name init
npx prisma generate
```

1. Run the app:

```bash
npm run dev
```

Open <http://localhost:3000>.

## Environment Variables

- `DATABASE_URL` PostgreSQL connection string
- `NEXTAUTH_URL` Application URL (for local dev: <http://localhost:3000>)
- `NEXTAUTH_SECRET` Session encryption secret
- `GOOGLE_CLIENT_ID` Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` Google OAuth client secret

## Google OAuth Configuration

1. Create OAuth credentials in Google Cloud Console.
2. Add authorized redirect URI:

- `http://localhost:3000/api/auth/callback/google`
- `https://<your-production-domain>/api/auth/callback/google`

1. Ensure Calendar API is enabled in your Google project.

## Deployment

### Vercel

1. Import repository into Vercel.
2. Add all environment variables from `.env.example` in project settings:

- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

1. Configure `NEXTAUTH_URL` to your production domain.
2. Deploy.

### Supabase (PostgreSQL)

1. Create a new Supabase project.
2. Copy the Postgres connection string from Supabase (pooler or direct, based on your environment).
3. Set `DATABASE_URL` in Vercel and local `.env`.
4. Run migrations against Supabase DB:

```bash
npx prisma migrate deploy
```

## Production Notes

- API routes are authenticated and return structured JSON errors.
- Task status transitions are optimistic and rollback on failure.
- Task creation, updates, and deletion are synchronized with Google Calendar when access token is available.
- Calendar sync failures do not block task CRUD operations.
