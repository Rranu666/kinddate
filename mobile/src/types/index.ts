// ─── Enums ───────────────────────────────────────────────────────────────────

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected' | 'flagged';
export type UserPlan = 'free' | 'plus' | 'premium';
export type GenderType = 'man' | 'woman' | 'non_binary' | 'other';
export type IntentType = 'serious' | 'casual' | 'friends' | 'open';
export type MatchStatus = 'pending' | 'accepted' | 'rejected' | 'expired';
export type MessageType = 'text' | 'image' | 'voice' | 'video' | 'system';
export type AttachmentStyle = 'secure' | 'anxious' | 'avoidant' | 'fearful';

// ─── Profile ─────────────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name?: string;
  display_name: string;
  bio?: string;
  age?: number;
  birthday?: string;
  gender?: GenderType;
  gender_identity?: string;
  seeking_gender?: string[];
  location_city?: string;
  location_state?: string;
  location_country?: string;
  location_lat?: number;
  location_lng?: number;
  max_distance_miles?: number;
  intent?: IntentType;
  occupation?: string;
  education?: string;
  height_inches?: number;
  avatar_url?: string;
  photos?: string[];
  interests?: string[];
  lifestyle?: Record<string, string>;
  personality_scores?: Record<string, number>;
  attachment_style?: AttachmentStyle;
  love_languages?: string[];
  relationship_goals?: string[];
  dealbreakers?: string[];
  age_min_pref?: number;
  age_max_pref?: number;
  is_verified?: boolean;
  verification_status?: VerificationStatus;
  trust_score?: number;
  plan?: UserPlan;
  plan_expires_at?: string;
  ai_profile_data?: AiProfileData;
  readiness_score?: number;
  onboarding_completed?: boolean;
  onboarding_step?: number;
  created_at?: string;
  updated_at?: string;
}

export interface AiProfileData {
  attachment_style?: AttachmentStyle;
  love_languages?: string[];
  communication_style?: string;
  core_fears?: string[];
  growth_edges?: string[];
  relationship_patterns?: string[];
  readiness_score?: number;
  insights_updated_at?: string;
}

// ─── Match ────────────────────────────────────────────────────────────────────

export interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  status: MatchStatus;
  compatibility_score?: number;
  score_breakdown?: ScoreBreakdown;
  ai_explanation?: string;
  matched_at?: string;
  expires_at?: string;
  created_at: string;
  updated_at?: string;
  // Joined profile data
  other_user?: Profile;
  // Derived
  unread_count?: number;
  last_message?: Message;
}

export interface ScoreBreakdown {
  personality: number;
  intent: number;
  communication: number;
  values: number;
  behavioral: number;
  attraction: number;
  total: number;
}

// ─── Message ──────────────────────────────────────────────────────────────────

export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  type: MessageType;
  media_url?: string;
  is_flagged?: boolean;
  read_at?: string;
  created_at: string;
  // Derived
  sender?: Profile;
}

// ─── AI Conversation ─────────────────────────────────────────────────────────

export type AriaMode =
  | 'DISCOVERY'
  | 'READINESS_CHECK'
  | 'MATCH_INSIGHT'
  | 'CONVERSATION_COACH'
  | 'DATE_PREP'
  | 'REFLECTION'
  | 'HEALING'
  | 'GROWTH';

export interface AriaMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface AriaInsight {
  type: string;
  value: string | string[] | number;
  confidence: number;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthState {
  user: Profile | null;
  session: { access_token: string; refresh_token: string } | null;
  loading: boolean;
  initialized: boolean;
}

// ─── UI / Navigation types ────────────────────────────────────────────────────

export interface TabBarIconProps {
  color: string;
  size: number;
  focused: boolean;
}

export interface MatchCardProps {
  match: Match;
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  onPress?: (id: string) => void;
}
