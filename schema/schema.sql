-- PROFILES: extended user info
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  native_place TEXT,
  permanent_address TEXT,
  phone TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- STARTUPS: main startup info
CREATE TABLE IF NOT EXISTS startups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  short_description TEXT NOT NULL,
  description TEXT NOT NULL,
  website_url TEXT,
  tags TEXT[],
  funding_stage TEXT,
  account_details JSONB,
  founder_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT now()
);

-- FAVORITES: watchlist
CREATE TABLE IF NOT EXISTS favorites (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  startup_id UUID REFERENCES startups(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT now(),
  PRIMARY KEY (user_id, startup_id)
);

-- TRANSACTIONS: funding records
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  startup_id UUID REFERENCES startups(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  message TEXT,
  timestamp TIMESTAMP DEFAULT now()
);
