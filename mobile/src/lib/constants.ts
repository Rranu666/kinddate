// ─── Brand Colors ─────────────────────────────────────────────────────────────
export const COLORS = {
  // Primary palette
  rose: '#C8716A',
  roseLight: '#E8A89E',
  roseDark: '#A85850',
  roseFaint: '#F5E2DF',

  // Accent
  sage: '#7B9E87',
  sageDark: '#5C7A67',
  sageFaint: '#EAF2EC',

  gold: '#C9A96E',
  goldLight: '#E8D5B0',
  goldFaint: '#F8F0E3',

  // Backgrounds
  cream: '#FAF6F0',
  creamDark: '#F0EAE0',
  white: '#FFFFFF',

  // Dark theme (Aria)
  night: '#0E0B15',
  nightCard: '#1A1525',
  nightBorder: '#2D2545',
  nightMuted: '#6B5F7A',

  // Text
  textPrimary: '#1A1A1A',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textInverse: '#FFFFFF',

  // Semantic
  success: '#22C55E',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',

  // Borders
  border: '#E5DDD5',
  borderFaint: '#F0EAE0',
} as const;

// ─── Typography ───────────────────────────────────────────────────────────────
export const FONTS = {
  serif: 'PlayfairDisplay_700Bold',
  serifRegular: 'PlayfairDisplay_400Regular',
  serifItalic: 'PlayfairDisplay_400Regular_Italic',
  sans: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansSemiBold: 'Inter_600SemiBold',
  sansBold: 'Inter_700Bold',
} as const;

export const FONT_SIZES = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 34,
  '5xl': 42,
} as const;

// ─── Spacing ─────────────────────────────────────────────────────────────────
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
} as const;

// ─── Border Radius ────────────────────────────────────────────────────────────
export const RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
} as const;

// ─── Shadow ───────────────────────────────────────────────────────────────────
export const SHADOW = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  rose: {
    shadowColor: '#C8716A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;

// ─── App Constants ────────────────────────────────────────────────────────────
export const APP_NAME = 'KindDate';
export const APP_TAGLINE = 'Love, guided with intention.';
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://kinddate.netlify.app';

export const MATCH_WEEKLY_LIMIT = 3;
export const SUPER_LIKE_FREE_LIMIT = 1;
export const MESSAGE_PAGE_SIZE = 50;
export const MATCHES_PAGE_SIZE = 20;

export const ARIA_MODES: Record<string, { label: string; description: string; icon: string }> = {
  DISCOVERY: {
    label: 'Discover Yourself',
    description: 'Understand your patterns & needs',
    icon: '🔍',
  },
  READINESS_CHECK: {
    label: 'Readiness Check',
    description: 'Are you ready for love?',
    icon: '💚',
  },
  MATCH_INSIGHT: {
    label: 'Match Insight',
    description: 'Understand your compatibility',
    icon: '🔮',
  },
  CONVERSATION_COACH: {
    label: 'Conversation Coach',
    description: 'Get messaging guidance',
    icon: '💬',
  },
  DATE_PREP: {
    label: 'Date Prep',
    description: 'Calm nerves, set intentions',
    icon: '🌹',
  },
  REFLECTION: {
    label: 'Reflect',
    description: 'Process your dating experiences',
    icon: '🪞',
  },
  HEALING: {
    label: 'Healing',
    description: 'Move through rejection with grace',
    icon: '🫶',
  },
  GROWTH: {
    label: 'Grow',
    description: 'Break old patterns, build new ones',
    icon: '🌱',
  },
};

export const ATTACHMENT_STYLES: Record<string, { label: string; description: string; color: string }> = {
  secure: { label: 'Secure', description: 'Comfortable with intimacy and independence', color: COLORS.sage },
  anxious: { label: 'Anxious-Preoccupied', description: 'Craves closeness, fears abandonment', color: COLORS.rose },
  avoidant: { label: 'Dismissive-Avoidant', description: 'Values independence, suppresses needs', color: COLORS.gold },
  fearful: { label: 'Fearful-Avoidant', description: 'Wants closeness but fears it', color: COLORS.roseLight },
};

export const INTERESTS = [
  'Hiking', 'Cooking', 'Travel', 'Music', 'Art', 'Film', 'Reading',
  'Fitness', 'Yoga', 'Meditation', 'Photography', 'Dancing', 'Gaming',
  'Wine & Dining', 'Coffee', 'Entrepreneurship', 'Tech', 'Fashion',
  'Volunteering', 'Spirituality', 'Sports', 'Surfing', 'Tennis', 'Golf',
  'Theater', 'Comedy', 'Podcasts', 'Nature', 'Wellness', 'Dogs', 'Cats',
];

export const PLAN_FEATURES = {
  free: ['3 curated matches/week', '1 super like', 'Basic Aria chat', 'Standard messaging'],
  plus: ['10 curated matches/week', '5 super likes', 'Full Aria coaching', 'Read receipts', 'Match insights'],
  premium: ['Unlimited matches', 'Unlimited super likes', 'Priority matching', 'Video dates', 'VIP concierge'],
};
