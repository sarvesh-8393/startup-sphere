# Startup Directory Platform - Onboarding Guide

Welcome to the Startup Directory Platform! This guide will help you get started quickly, whether you're a new developer joining the project or a user exploring the platform.

## 🚀 Quick Start for Developers

### Prerequisites
- Node.js 20+ installed
- A Supabase account (free tier works)
- Git for version control

### 1. Clone and Install
```bash
git clone <your-repo-url> startup-directory
cd startup-directory
npm install
```

### 2. Environment Setup
Create `.env.local` in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXTAUTH_SECRET=your_random_secret_here
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

### 3. Database Setup
1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor in your Supabase dashboard
3. Copy and run the SQL from `schema/schema.sql`
4. Enable Row Level Security (RLS) policies as needed

### 4. OAuth Setup
#### Google OAuth:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select a project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
6. Add credentials to `.env.local`

#### GitHub OAuth:
1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create new OAuth App
3. Set Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. Add credentials to `.env.local`

### 5. Run the Application
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

## 👤 User Onboarding Flow

### First Visit
1. **Landing Page**: You'll see the hero section with featured startups
2. **Authentication Required**: Most features require login - click "Sign In"
3. **Choose Provider**: Sign in with Google or GitHub OAuth
4. **Profile Setup**: Complete your founder profile in the onboarding form
5. **Explore**: Browse startups, create your own, or interact with others

### Key Features to Try First
1. **Browse Startups**: Use filters by tags, funding stage, location
2. **View Details**: Click any startup card to see full story
3. **Like Startups**: Click the heart icon to save favorites
4. **Create Your Startup**: Go to `/create` to add your own startup
5. **Edit Profile**: Update your founder details anytime

## 🛠 Developer Onboarding

### Project Structure
```
├── app/                    # Next.js app router pages
│   ├── api/               # API routes
│   ├── (root)/            # Main app pages
│   └── globals.css        # Global styles
├── components/            # React components
├── lib/                   # Utility libraries
│   ├── auth.ts           # Authentication helpers
│   ├── recommendation.ts # AI recommendation logic
│   └── supabaseClient.ts # Database client
├── schema/               # Database schema
└── public/               # Static assets
```

### Key Technologies
- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: Supabase (PostgreSQL)
- **Auth**: NextAuth.js v4
- **AI/ML**: Natural.js for TF-IDF recommendations
- **Forms**: React Hook Form + Zod validation

### Development Workflow
1. **Branching**: Create feature branches from `main`
2. **Development**: Use `npm run dev` for hot reload
3. **Linting**: Run `npm run lint` before committing
4. **Testing**: Manual testing - no automated tests yet
5. **Commits**: Use conventional commit messages

### Common Development Tasks

#### Adding a New Component
1. Create component in `components/` directory
2. Use TypeScript interfaces for props
3. Follow existing naming conventions
4. Add to appropriate page or layout

#### Modifying Database Schema
1. Update `schema/schema.sql`
2. Run SQL in Supabase dashboard
3. Update TypeScript types if needed
4. Test API routes that use the table

#### Adding New API Routes
1. Create route in `app/api/` directory
2. Use Supabase client for database operations
3. Handle authentication with `getServerSession`
4. Return proper JSON responses

#### Working with Recommendations
The recommendation system uses AI/ML:
- TF-IDF for content similarity
- Cosine similarity for vector comparison
- User likes build preference vectors
- Falls back to trending for new users

## 🔧 Troubleshooting

### Common Issues

**Database Connection Errors**
- Check Supabase URL and keys in `.env.local`
- Ensure RLS policies allow your operations
- Verify table names match schema

**Authentication Issues**
- Confirm OAuth redirect URIs are correct
- Check NEXTAUTH_SECRET is set
- Clear browser cookies if needed

**Build Errors**
- Run `npm install` to ensure dependencies
- Check Node.js version (20+ required)
- Clear `.next` folder: `rm -rf .next`

**Recommendation System Not Working**
- Ensure `startup_likes` table exists
- Check user has liked some startups
- Verify TF-IDF model builds correctly

### Getting Help
- Check existing issues on GitHub
- Review the detailed README.md
- Test API endpoints with curl or Postman
- Check Supabase logs for database errors

## 🎯 Next Steps

### For Users
- Complete your founder profile
- Create and share your startup story
- Explore and support other startups
- Network with founders in your industry

### For Developers
- Read the full README.md for technical details
- Explore the codebase and understand the architecture
- Set up your development environment fully
- Start contributing to open issues
- Consider adding automated tests

Welcome aboard! The Startup Directory Platform is designed to help founders connect and grow. If you have questions, don't hesitate to ask.
