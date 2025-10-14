-- comment_votes
CREATE TABLE IF NOT EXISTS comment_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  vote_type INTEGER NOT NULL
);

-- comments
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  startup_id UUID REFERENCES startups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- follows
CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP DEFAULT now(),
  email TEXT,
  slug TEXT
);

-- notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  startup_id UUID REFERENCES startups(id) ON DELETE CASCADE,
  type TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Core Info
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  role TEXT,              -- e.g. "Founder & CEO"
  location TEXT,          -- e.g. "Bangalore, India"

  -- Quick Stats
  experience_years INT,   -- e.g. 5
  previous_startups INT,  -- e.g. 2
  education TEXT,         -- e.g. "B.Tech, IIT Delhi"
  specialties TEXT[],     -- e.g. '{AI, SaaS, Fundraising}'
  funding_raised TEXT,    -- e.g. "$500K Seed Round"

  -- Detailed Bio / Story
  origin_story TEXT,      -- why they started
  career_path TEXT,       -- their background
  vision TEXT,            -- long-term vision

  -- Social & Contact
  linkedin_url TEXT,
  twitter_url TEXT,
  github_url TEXT,
  medium_url TEXT,
  personal_website TEXT,
  contact_email TEXT,     -- optional public email

  -- Achievements / Media Mentions
  awards TEXT[],
  press_links TEXT[],     -- URLs to articles/interviews
  featured_projects TEXT[],

  -- Tags / Keywords
  industry_tags TEXT[],   -- e.g. '{AI, EdTech, FinTech}'
  stage_tags TEXT[],      -- e.g. '{YC Alumni, Bootstrapped}'
  interest_tags TEXT[],   -- e.g. '{Networking, Mentorship}'

  -- Timestamps
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);


-- startups
CREATE TABLE IF NOT EXISTS startups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  short_description TEXT NOT NULL,
  description TEXT NOT NULL,
  website_url TEXT,
  tags TEXT[],
  funding_stage TEXT,
  account_details JSONB,
  founder_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT now(),
  slug TEXT,
  image_url TEXT,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  mission_statement TEXT,
  problem_solution TEXT,
  founder_story TEXT,
  target_market TEXT,
  traction TEXT,
  use_of_funds TEXT,
  milestones TEXT,
  team_profiles TEXT,
  awards TEXT,
  location TEXT
);

-- transactions
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  startup_id UUID REFERENCES startups(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  message TEXT,
  timestamp TIMESTAMP DEFAULT now()
);

-- user_preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  tags TEXT[] NOT NULL DEFAULT '{}'::text[],
  stage TEXT,
  location TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
