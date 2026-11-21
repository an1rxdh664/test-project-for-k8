# QuickForm

A small, deployable Next.js + React + Tailwind form website. Submissions are saved to a Supabase Postgres table.

## Fields

- Full name (required)
- Email address (required)
- Phone number
- City
- Message

## 1. Create the database

1. Create a project at [Supabase](https://supabase.com/).
2. Open **SQL Editor** in your Supabase dashboard.
3. Run the SQL in `supabase/schema.sql`.
4. Open **Project Settings → API** and copy the Project URL and `service_role` key.

## 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Keep the service-role key secret. Never prefix it with `NEXT_PUBLIC_`.

## 3. Run locally

Requires Node.js 20.9 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## 4. Deploy to Vercel

1. Push this project to a GitHub repository.
2. Import the repository in [Vercel](https://vercel.com/).
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in **Project Settings → Environment Variables**.
4. Deploy.

The form will save submissions to `public.form_submissions` in Supabase.

## Notes

- The API validates and trims incoming values on the server.
- The service-role key is used only by the server API route.
- For a public production form, consider adding CAPTCHA/rate limiting and a privacy notice before collecting real personal data.
