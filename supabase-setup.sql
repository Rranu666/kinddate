-- ═══════════════════════════════════════════════════════════════
-- KIND DATE — SUPABASE DATABASE SCHEMA
-- Version: 1.0 | Newport Beach, CA
-- An initiative by 2026 Kindness Community Foundation
-- ═══════════════════════════════════════════════════════════════

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- for geo location queries

-- ─── ENUMS ───────────────────────────────────────────────────────
CREATE TYPE verification_status AS ENUM ('unverified','pending','verified','rejected','flagged');
CREATE TYPE user_plan AS ENUM ('free','plus','premium');
CREATE TYPE gender_type AS ENUM ('man','woman','non_binary','other');
CREATE TYPE intent_type AS ENUM ('serious','casual','friends','open');
CREATE TYPE match_status AS ENUM ('pending','accepted','rejected','expired');
CREATE TYPE report_status AS ENUM ('open','investigating','resolved','dismissed');
CREATE TYPE report_type AS ENUM ('fake_profile','harassment','spam','explicit_content','bot','other');
CREATE TYPE booking_status AS ENUM ('pending','confirmed','cancelled','completed');
CREATE TYPE venue_type AS ENUM ('restaurant','bar','cafe','lounge','outdoor','other');
CREATE TYPE message_type AS ENUM ('text','image','voice','video','system');
CREATE TYPE subscription_status AS ENUM ('active','cancelled','expired','trialing');

-- ─── PROFILES (extends Supabase auth.users) ───────────────────────
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  date_of_birth DATE,
  age INTEGER GENERATED ALWAYS AS (
    DATE_PART('year', AGE(date_of_birth))::INTEGER
  ) STORED,
  gender gender_type,
  bio TEXT,
  ai_bio TEXT, -- AI-generated bio
  avatar_url TEXT,
  photos TEXT[] DEFAULT '{}',
  city TEXT DEFAULT 'Newport Beach',
  state TEXT DEFAULT 'CA',
  country TEXT DEFAULT 'USA',
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  location GEOGRAPHY(POINT), -- PostGIS point for geo queries
  intent intent_type,
  interested_in gender_type[],
  age_min INTEGER DEFAULT 18,
  age_max INTEGER DEFAULT 99,
  max_distance_miles INTEGER DEFAULT 25,
  interests TEXT[] DEFAULT '{}',
  lifestyle_tags TEXT[] DEFAULT '{}',
  trust_score INTEGER DEFAULT 0 CHECK (trust_score BETWEEN 0 AND 100),
  verification_status verification_status DEFAULT 'unverified',
  is_phone_verified BOOLEAN DEFAULT FALSE,
  is_email_verified BOOLEAN DEFAULT FALSE,
  is_id_verified BOOLEAN DEFAULT FALSE,
  is_selfie_verified BOOLEAN DEFAULT FALSE,
  is_social_verified BOOLEAN DEFAULT FALSE,
  instagram_handle TEXT,
  linkedin_url TEXT,
  plan user_plan DEFAULT 'free',
  is_admin BOOLEAN DEFAULT FALSE,
  is_banned BOOLEAN DEFAULT FALSE,
  ban_reason TEXT,
  last_active TIMESTAMPTZ,
  onboarding_complete BOOLEAN DEFAULT FALSE,
  profile_complete BOOLEAN DEFAULT FALSE,
  boost_active_until TIMESTAMPTZ,
  super_likes_remaining INTEGER DEFAULT 1,
  daily_likes_remaining INTEGER DEFAULT 10,
  daily_likes_reset TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 day',
  ai_profile_data JSONB DEFAULT '{}',
  notification_settings JSONB DEFAULT '{"matches":true,"messages":true,"likes":true,"ai_suggestions":true}',
  privacy_settings JSONB DEFAULT '{"show_distance":true,"show_last_active":true,"incognito":false}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── VERIFICATION RECORDS ────────────────────────────────────────
CREATE TABLE verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- phone, email, government_id, selfie, social
  status verification_status DEFAULT 'pending',
  provider TEXT, -- persona, stripe_identity, twilio, etc.
  provider_reference_id TEXT,
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  rejection_reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TRUST SCORE HISTORY ────────────────────────────────────────
CREATE TABLE trust_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- phone_verified, id_verified, report_received, etc.
  score_delta INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── MATCHES ────────────────────────────────────────────────────
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status match_status DEFAULT 'pending',
  user1_liked BOOLEAN DEFAULT FALSE,
  user2_liked BOOLEAN DEFAULT FALSE,
  user1_liked_at TIMESTAMPTZ,
  user2_liked_at TIMESTAMPTZ,
  is_super_like BOOLEAN DEFAULT FALSE,
  ai_compatibility_score INTEGER, -- 0-100
  ai_compatibility_breakdown JSONB DEFAULT '{}', -- personality, lifestyle, intent scores
  ai_icebreaker TEXT,
  matched_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user1_id, user2_id),
  CHECK (user1_id != user2_id)
);

-- ─── MESSAGES ────────────────────────────────────────────────────
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT,
  type message_type DEFAULT 'text',
  media_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  is_deleted BOOLEAN DEFAULT FALSE,
  is_flagged BOOLEAN DEFAULT FALSE,
  ai_flagged BOOLEAN DEFAULT FALSE,
  ai_flag_reason TEXT,
  ai_smart_reply_suggestions TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── AI CONVERSATIONS ─────────────────────────────────────────
CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  messages JSONB DEFAULT '[]', -- array of {role, content, timestamp}
  context_type TEXT DEFAULT 'general', -- onboarding, matchmaking, date_planning, profile_help
  summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── VENUES ────────────────────────────────────────────────────
CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type venue_type NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  city TEXT DEFAULT 'Newport Beach',
  state TEXT DEFAULT 'CA',
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  location GEOGRAPHY(POINT),
  phone TEXT,
  website TEXT,
  instagram TEXT,
  images TEXT[] DEFAULT '{}',
  price_level INTEGER DEFAULT 2 CHECK (price_level BETWEEN 1 AND 4),
  avg_rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  kind_date_offer TEXT, -- e.g. "20% off for Kind Date couples"
  availability_hours JSONB DEFAULT '{}', -- {"monday": "11am-10pm", ...}
  booking_url TEXT,
  opentable_id TEXT,
  commission_rate DECIMAL(5,2) DEFAULT 10.00, -- % commission
  revenue_generated DECIMAL(10,2) DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  ai_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── VENUE BOOKINGS ──────────────────────────────────────────
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
  match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
  booked_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  partner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status booking_status DEFAULT 'pending',
  date DATE NOT NULL,
  time_slot TIME NOT NULL,
  party_size INTEGER DEFAULT 2,
  special_requests TEXT,
  confirmation_code TEXT,
  total_amount DECIMAL(10,2),
  commission_amount DECIMAL(10,2),
  ai_suggested BOOLEAN DEFAULT FALSE,
  ai_suggestion_reason TEXT,
  opentable_reservation_id TEXT,
  reminder_sent BOOLEAN DEFAULT FALSE,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  completed_at TIMESTAMPTZ,
  review_requested BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SUBSCRIPTIONS ────────────────────────────────────────────
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  plan user_plan NOT NULL,
  status subscription_status DEFAULT 'active',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  amount_cents INTEGER NOT NULL, -- in cents: 900 = $9.00
  currency TEXT DEFAULT 'usd',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  cancelled_at TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ADD-ON PURCHASES ────────────────────────────────────────
CREATE TABLE addon_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  addon_type TEXT NOT NULL, -- boost, super_like_pack, ai_rewrite
  quantity INTEGER DEFAULT 1,
  amount_cents INTEGER NOT NULL,
  stripe_payment_intent_id TEXT,
  status TEXT DEFAULT 'completed',
  applied_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── REPORTS ────────────────────────────────────────────────
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reported_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type report_type NOT NULL,
  description TEXT,
  evidence_urls TEXT[] DEFAULT '{}',
  status report_status DEFAULT 'open',
  priority TEXT DEFAULT 'medium', -- low, medium, high, critical
  ai_flagged BOOLEAN DEFAULT FALSE,
  ai_confidence_score DECIMAL(5,2),
  ai_analysis JSONB DEFAULT '{}',
  admin_notes TEXT,
  resolved_by UUID REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ,
  action_taken TEXT, -- warning, suspension, ban, dismissed
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── BLOCKS ──────────────────────────────────────────────────
CREATE TABLE blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

-- ─── NOTIFICATIONS ───────────────────────────────────────────
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- match, message, like, super_like, ai_suggestion, booking
  title TEXT NOT NULL,
  body TEXT,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ANALYTICS EVENTS ─────────────────────────────────────────
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  properties JSONB DEFAULT '{}',
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════
CREATE INDEX idx_profiles_location ON profiles USING GIST(location);
CREATE INDEX idx_profiles_trust ON profiles(trust_score DESC);
CREATE INDEX idx_profiles_plan ON profiles(plan);
CREATE INDEX idx_profiles_verification ON profiles(verification_status);
CREATE INDEX idx_profiles_active ON profiles(last_active DESC);
CREATE INDEX idx_matches_users ON matches(user1_id, user2_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_messages_match ON messages(match_id, created_at DESC);
CREATE INDEX idx_messages_unread ON messages(receiver_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_venues_location ON venues USING GIST(location);
CREATE INDEX idx_venues_featured ON venues(is_featured, is_active);
CREATE INDEX idx_bookings_date ON bookings(date, status);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_reports_status ON reports(status, priority);
CREATE INDEX idx_analytics_user ON analytics_events(user_id, event_name, created_at DESC);

-- ═══════════════════════════════════════════════════════════════
-- FUNCTIONS
-- ═══════════════════════════════════════════════════════════════

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

-- Calculate trust score
CREATE OR REPLACE FUNCTION calculate_trust_score(user_id UUID)
RETURNS INTEGER AS $$
DECLARE score INTEGER := 0;
BEGIN
  SELECT INTO score COALESCE((
    CASE WHEN is_phone_verified THEN 20 ELSE 0 END +
    CASE WHEN is_email_verified THEN 10 ELSE 0 END +
    CASE WHEN is_id_verified THEN 35 ELSE 0 END +
    CASE WHEN is_selfie_verified THEN 25 ELSE 0 END +
    CASE WHEN is_social_verified THEN 10 ELSE 0 END
  ), 0) FROM profiles WHERE id = user_id;
  RETURN LEAST(score, 100);
END;
$$ LANGUAGE plpgsql;

-- Update trust score after verification change
CREATE OR REPLACE FUNCTION sync_trust_score()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles SET trust_score = calculate_trust_score(NEW.id) WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Get nearby users
CREATE OR REPLACE FUNCTION get_nearby_users(
  p_user_id UUID, p_lat DECIMAL, p_lng DECIMAL, p_radius_miles INTEGER DEFAULT 25
) RETURNS TABLE(user_id UUID, distance_miles DECIMAL) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, (ST_Distance(p.location, ST_MakePoint(p_lng, p_lat)::GEOGRAPHY) / 1609.34)::DECIMAL
  FROM profiles p
  WHERE p.id != p_user_id
    AND p.is_banned = FALSE
    AND p.verification_status = 'verified'
    AND p.profile_complete = TRUE
    AND ST_DWithin(p.location, ST_MakePoint(p_lng, p_lat)::GEOGRAPHY, p_radius_miles * 1609.34)
  ORDER BY p.location <-> ST_MakePoint(p_lng, p_lat)::GEOGRAPHY;
END;
$$ LANGUAGE plpgsql;

-- Check if it's a mutual match
CREATE OR REPLACE FUNCTION check_mutual_match()
RETURNS TRIGGER AS $$
DECLARE match_record matches%ROWTYPE;
BEGIN
  SELECT * INTO match_record FROM matches
  WHERE (user1_id = NEW.user2_id AND user2_id = NEW.user1_id)
     OR (user1_id = NEW.user1_id AND user2_id = NEW.user2_id);
  IF match_record.user1_liked AND match_record.user2_liked THEN
    UPDATE matches SET status = 'accepted', matched_at = NOW()
    WHERE id = match_record.id;
    -- Create notification for both users
    INSERT INTO notifications (user_id, type, title, body, data)
    VALUES
      (match_record.user1_id, 'match', '🎉 It''s a Match!', 'You have a new match!', jsonb_build_object('match_id', match_record.id)),
      (match_record.user2_id, 'match', '🎉 It''s a Match!', 'You have a new match!', jsonb_build_object('match_id', match_record.id));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════
-- TRIGGERS
-- ═══════════════════════════════════════════════════════════════
CREATE TRIGGER tr_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_venues_updated_at BEFORE UPDATE ON venues FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_ai_conv_updated_at BEFORE UPDATE ON ai_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_sync_trust_score AFTER UPDATE OF is_phone_verified,is_email_verified,is_id_verified,is_selfie_verified,is_social_verified ON profiles FOR EACH ROW EXECUTE FUNCTION sync_trust_score();
CREATE TRIGGER tr_check_match AFTER UPDATE OF user1_liked,user2_liked ON matches FOR EACH ROW EXECUTE FUNCTION check_mutual_match();

-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read public profiles, only edit own
CREATE POLICY "Public profiles readable" ON profiles FOR SELECT USING (NOT is_banned AND verification_status != 'flagged');
CREATE POLICY "Own profile editable" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Create own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Matches: users see only their own matches
CREATE POLICY "Own matches only" ON matches FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);
CREATE POLICY "Create match" ON matches FOR INSERT WITH CHECK (auth.uid() = user1_id);
CREATE POLICY "Update own match" ON matches FOR UPDATE USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Messages: only match participants
CREATE POLICY "Match messages only" ON messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Send messages" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Notifications: own only
CREATE POLICY "Own notifications" ON notifications FOR ALL USING (auth.uid() = user_id);

-- Bookings: own only
CREATE POLICY "Own bookings" ON bookings FOR ALL USING (auth.uid() = booked_by OR auth.uid() = partner_id);

-- Reports: can create, only admin can read all
CREATE POLICY "Create reports" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Own reports" ON reports FOR SELECT USING (auth.uid() = reporter_id);

-- Blocks: own only
CREATE POLICY "Own blocks" ON blocks FOR ALL USING (auth.uid() = blocker_id);

-- Subscriptions: own only
CREATE POLICY "Own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);

-- AI Conversations: own only
CREATE POLICY "Own AI conversations" ON ai_conversations FOR ALL USING (auth.uid() = user_id);

-- Verifications: own only
CREATE POLICY "Own verifications" ON verifications FOR SELECT USING (auth.uid() = user_id);

-- Venues: public read
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Venues public read" ON venues FOR SELECT USING (is_active = TRUE);

-- ═══════════════════════════════════════════════════════════════
-- SEED DATA — Sample venues for Newport Beach
-- ═══════════════════════════════════════════════════════════════
INSERT INTO venues (name, type, description, address, city, state, latitude, longitude, price_level, avg_rating, is_featured, is_verified, kind_date_offer, tags) VALUES
('Nobu Newport Beach', 'restaurant', 'World-renowned Japanese fusion restaurant at Fashion Island. Perfect for impressing your match.', '73 Fashion Island, Newport Beach, CA 92660', 'Newport Beach', 'CA', 33.6846, -117.8689, 4, 4.90, TRUE, TRUE, '20% off for Kind Date couples on first visit', ARRAY['japanese','sushi','romantic','upscale']),
('The Bungalow Newport', 'bar', 'Relaxed, bohemian indoor/outdoor lounge with craft cocktails. Ideal for a first casual date.', '2441 E Coast Hwy, Newport Beach, CA 92625', 'Newport Beach', 'CA', 33.6052, -117.8718, 3, 4.80, FALSE, TRUE, 'Free welcome cocktail for Kind Date matches', ARRAY['cocktails','casual','outdoor','live-music']),
('Bear Flag Fish Company', 'cafe', 'Fresh, local seafood in a laid-back Lido Marina setting. Great for daytime dates.', '3421 Via Lido, Newport Beach, CA 92663', 'Newport Beach', 'CA', 33.6073, -117.9109, 2, 4.70, FALSE, TRUE, 'Free dessert on your first Kind Date', ARRAY['seafood','casual','waterfront','lunch']),
('Balboa Bay Resort', 'restaurant', 'Elegant harborfront dining with panoramic Newport Harbor views. Perfect for special occasions.', '1221 W Coast Hwy, Newport Beach, CA 92663', 'Newport Beach', 'CA', 33.6139, -117.9273, 4, 4.90, TRUE, TRUE, 'Private table with harbor view for Kind Date couples', ARRAY['waterfront','romantic','fine-dining','harbor-view']),
('Sol Cocina', 'restaurant', 'Vibrant coastal Mexican restaurant with amazing margaritas and a fun atmosphere.', '251 E Coast Hwy, Newport Beach, CA 92660', 'Newport Beach', 'CA', 33.6143, -117.8764, 2, 4.60, FALSE, TRUE, NULL, ARRAY['mexican','margaritas','casual','patio']),
('Balboa Coffee', 'cafe', 'Charming artisan coffee shop on Balboa Island. Best for relaxed first coffee dates.', '206 Marine Ave, Newport Beach, CA 92662', 'Newport Beach', 'CA', 33.6031, -117.8969, 1, 4.50, FALSE, TRUE, 'Free coffee for your first Kind Date', ARRAY['coffee','cozy','island','daytime']);

-- ═══════════════════════════════════════════════════════════════
-- END OF SCHEMA
-- ═══════════════════════════════════════════════════════════════
