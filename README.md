# Startup Directory Platform

## Introduction

This is a web application built with Next.js that serves as a directory for startups. It allows users to sign up, create profiles, add and edit their own startups, browse other startups, filter them by various criteria (like tags, funding stage, location), favorite startups, and even simulate funding transactions. The platform is designed to connect founders with potential investors or supporters in a simple, user-friendly way.

Think of it like a community board for startups: Founders showcase their ideas, stories, and progress, while visitors can discover and support them. The app uses a clean, modern design with pink and amber colors to make it engaging and easy to navigate.

The goal is to help startups get visibility and build connections. It's not a full e-commerce site but focuses on storytelling, discovery, and basic interactions like liking or following.

## Features

- **User Authentication**: Users sign up and log in using email (via NextAuth and Supabase). Guests are redirected to login for most features.
- **User Profiles**: After signup, users complete an onboarding form to add personal details like full name, bio, location, and phone.
- **Startup Creation and Editing**: Founders can create a detailed startup profile including name, description, mission, team info, traction, and more. They can upload logos or add image URLs. Editing is supported via a query param (e.g., ?edit=id).
- **Startup Browsing and Discovery**: 
  - Home page shows a hero section, search bar, filters (tags, stage, location), and a grid of startup cards.
  - Filter and sort startups by relevance to user preferences, views, or date.
  - Search by keywords.
- **Startup Details Page**: View full details of a startup by its slug (e.g., /startup/my-startup-slug). Includes like/follow buttons.
- **Favorites/Likes**: Users can like or follow startups, stored in the database.
- **Onboarding**: New users go through a simple form to set up their profile.
- **Basic Funding Simulation**: UPI links for support, and a transactions table to log mock funding (amount, message).
- **Responsive Design**: Works on desktop and mobile with Tailwind CSS styling.
- **Session Management**: Handles user sessions across pages with client-side sync.

The app emphasizes storytelling: Startups tell their "why", problems solved, traction, and future plans to build emotional connections.

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript for type safety.
- **Styling**: Tailwind CSS 4, with custom pink/amber gradients and shadows.
- **UI Components**: Headless UI, Lucide React icons, Heroicons, React Hook Form for forms, React Hot Toast for notifications.
- **Backend/Database**: Supabase (PostgreSQL) for auth, storage, and data. Uses server-side fetching in Next.js API routes.
- **Authentication**: NextAuth.js v4 with Supabase provider.
- **Animations/Effects**: GSAP for smooth interactions.
- **Form Validation**: Zod for schema validation, integrated with React Hook Form.
- **Email/Notifications**: Nodemailer and Resend for test emails (e.g., onboarding).
- **Other**: Formidable for file uploads, UUID for IDs.

No external APIs beyond Supabase. Runs locally with `npm run dev`.

## Architecture

The app follows Next.js App Router patterns: Server Components for data fetching, Client Components for interactivity.

### High-Level User Flow (Mermaid Diagram)

```mermaid
flowchart TD
    A[Visitor Lands on Home] --> B{Logged In?}
    B -->|No| C[Redirect to Login]
    B -->|Yes| D[Fetch User Preferences & Startups]
    D --> E[Display Hero + Filters + Startup Grid]
    E --> F[User Searches/Filters]
    F --> G[API Call to /api/startup with Params]
    G --> H[Supabase Query: Filter by Tags/Stage/Location + Match User Prefs]
    H --> I[Sort Results (e.g., by Views or Date)]
    I --> J[Render Startup Cards]
    J --> K[Click Card → /startup/[slug]]
    K --> L[Fetch Startup Details + Likes/Follows]
    L --> M[Display Full Page with Edit Button (if Owner)]
    M --> N[Like/Follow → API Update]
    N --> O[Create New? → /create Page]
    O --> P[Form Submission → /api/create or /api/update]
    P --> Q[Supabase Insert/Update + Image Upload]
    Q --> R[Redirect to Startup Page]
```

### Data Flow

1. **Server-Side**: Pages like `app/(root)/page.tsx` fetch data from Supabase via API routes (e.g., `/api/startup`). Uses `getServerSession` for auth.
2. **Client-Side**: Components like `StartupCard` handle likes with `useState` and API calls. Forms use `react-hook-form`.
3. **Database Interactions**: All via Supabase client in `lib/supabaseClient.ts`. Queries filter startups based on user email prefs.
4. **Middleware**: `middleware.ts` protects routes (e.g., requires auth for create/edit).

Key: Server Components reduce bundle size; Client Components (marked 'use client') handle state.

## Database Schema

The database uses Supabase's PostgreSQL. Tables are defined in `schema/schema.sql`. Here's a simple explanation:

- **profiles** (User Extensions):
  - `id` (UUID, links to auth.users)
  - `full_name`, `avatar_url`, `bio`, `native_place`, `permanent_address`, `phone`
  - `created_at` (timestamp)
  - Purpose: Stores extra user info beyond email/password. Filled during onboarding.

- **startups** (Core Startup Data):
  - `id` (UUID, auto-generated)
  - `name`, `short_description`, `description` (texts)
  - `website_url` (text)
  - `tags` (array of strings, e.g., ['ai', 'fintech'])
  - `funding_stage` (text, e.g., 'Seed')
  - `account_details` (JSONB for UPI/Stripe links)
  - `founder_id` (UUID, links to auth.users)
  - `mission_statement`, `problem_solution`, `founder_story`, `target_market`, `traction`, `use_of_funds`, `milestones`, `team_profiles`, `awards` (texts for storytelling)
  - `image_url` (text, for logo)
  - `created_at` (timestamp)
  - Purpose: Holds all startup details. Slugs are generated from names for URLs.

- **favorites** (User Likes/Follows):
  - `user_id` (UUID, links to auth.users)
  - `startup_id` (UUID, links to startups)
  - `created_at` (timestamp)
  - Primary Key: (user_id, startup_id) – prevents duplicates.
  - Purpose: Tracks which startups a user has favorited.

- **transactions** (Funding Logs):
  - `id` (UUID, auto-generated)
  - `sender_id` (UUID, links to auth.users)
  - `startup_id` (UUID, links to startups)
  - `amount` (numeric, e.g., 100.00)
  - `message` (text, e.g., "Great idea!")
  - `timestamp` (timestamp)
  - Purpose: Records mock funding/support transactions.

Relationships:
- One founder → Many startups (via founder_id)
- Many users → Many startups (via favorites)
- Many senders → Many startups (via transactions)

Supabase handles auth.users table automatically.

## Setup Instructions

1. **Prerequisites**:
   - Node.js 20+ installed.
   - A Supabase account (free tier works): Create a project at [supabase.com](https://supabase.com), get your URL and anon key.
   - Git for version control.

2. **Clone and Install**:
   ```bash
   git clone <your-repo-url> my-startup
   cd my-startup
   npm install
   ```

3. **Environment Setup**:
   - Copy `.env.example` to `.env.local` (if exists) or create `.env.local`.
   - Add Supabase credentials:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
     SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # For server-side ops
     NEXTAUTH_SECRET=some_random_secret  # Generate with `openssl rand -base64 32`
     NEXTAUTH_URL=http://localhost:3000
     ```
   - For email: Add SMTP details if using Nodemailer (optional for tests).

4. **Database Setup**:
   - In Supabase dashboard: Run the SQL from `schema/schema.sql` in the SQL Editor.
   - Enable Row Level Security (RLS) policies if needed (default allows auth'd users).

5. **Run Locally**:
   ```bash
   npm run dev
   ```
   - Open [http://localhost:3000](http://localhost:3000).
   - Sign up/login to test.

6. **Build and Deploy**:
   - Build: `npm run build`
   - Start: `npm start`
   - Deploy: Use Vercel (easiest for Next.js) – connect GitHub repo.

Troubleshooting:
- If Supabase errors: Check keys and RLS.
- Linting: `npm run lint`
- Turbopack enabled for faster dev.

## Usage

1. **First Visit**: You'll be redirected to `/login`. Sign up with email.
2. **Onboarding**: After login, fill `/onboarding` form for profile.
3. **Browse Startups**: Go to home (`/`). Use search, filters (tags via chips, stage dropdown, location input), sort (views/date).
4. **View Startup**: Click a card → `/startup/[slug]`. See full story, like/follow.
5. **Create/Edit Startup**: Go to `/create`. Fill the form (auto-resizes textareas). Submit → redirects to your startup page. Edit via `?edit=slug`.
6. **Favorites**: Like buttons update in real-time.
7. **Admin/Support**: Transactions for funding sim; UPI links for real support.

Mobile: Filters collapse nicely; forms are touch-friendly.

## API Endpoints

All under `/api/` (Next.js API routes). Protected by auth where noted.

- **Auth**: `/api/auth/[...nextauth]/route.ts` – Handles signin, callback (Supabase provider).
- **Onboarding**: `POST /api/onboarding` – Save profile.
- **User Sync**: `POST /api/sync-user` – Update session/user data.
- **Startups**:
  - `GET /api/startup` – List/filter startups (params: email, query, tags, stage, location, sort).
  - `GET /api/startup/[slug]` – Get single startup details.
  - `POST /api/create` – Create startup (FormData with fields + image).
  - `PUT /api/update` – Update startup (similar to create).
- **Interactions**:
  - `POST /api/like` – Toggle favorite.
  - `POST /api/follow` – Follow startup.
  - `POST /api/view` – Increment view count.
- **Other**:
  - `POST /api/send-test-email` – Test email sending.
  - `POST /api/transactions` – Log funding (not implemented yet?).

All use Supabase queries. Errors return JSON with message.

## Contributing

1. Fork the repo and clone.
2. Create a branch: `git checkout -b feature/your-feature`.
3. Make changes, test locally.
4. Commit: `git commit -m "Add feature: description"`.
5. Push and PR to main.
6. Follow TypeScript/Tailwind conventions. Add tests if possible (none yet).

Issues? Open a GitHub issue. Focus on UX improvements, new filters, or real payments.

## License

MIT License – Feel free to use, modify, and distribute. No warranties.
#   s t a r t u p - s p h e r e  
 #   s t a r t u p - s p h e r e  
 